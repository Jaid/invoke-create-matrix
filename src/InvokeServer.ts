import type {InvokeTask, InvokeTask} from './InvokeTask.js'
import type {InvokeTaskBatch} from './InvokeTaskBatch.js'
import type {paths as ApiType} from '~/lib/openapi.js'

import got from 'got'
import * as lodash from 'lodash-es'

import {findGraceful} from '~/lib/findGraceful.js'

type Options = {
  domain: string
  port: number
  protocol: string
}

const defaultOptions = {
  domain: `localhost`,
  port: 9090,
  protocol: `http`,
}

export class InvokeServer {
  got: typeof got
  options: Options
  constructor(options?: Partial<Options>) {
    this.options = {
      ...defaultOptions,
      ...options,
    }
    this.got = got.extend({
      prefixUrl: `${this.options.protocol}://${this.options.domain}:${this.options.port}/api/v1`,
    })
  }
  async findBoard(nameOrId: string) {
    const boards = <Record<string, unknown>[]> await this.getBoards()
    const boardById = boards.find(board => board.board_id === nameOrId)
    if (boardById) {
      return boardById
    }
    const boardByName = findGraceful(nameOrId, boards, `board_name`)
    if (boardByName) {
      return boardByName
    }
    throw new Error(`Board not found by input “${nameOrId}”`)
  }
  async getBoards() {
    const query: ApiType["/api/v1/boards/"]["get"]["parameters"]["query"] = {
      all: true,
    }
    const response = await this.got(`boards/`, {
      responseType: `json`,
      searchParams: query,
    })
    return <ApiType["/api/v1/boards/"]["get"]["responses"]["200"]["content"]["application/json"]> response.body
  }
  async getDefaultBoardId() {
    const boards = await this.getBoards()
    const board = boards.find(board => board.board_name(`Uncategorized`))
    if (!board) {
      throw new Error(`No default board found`)
    }
    return board.board_id
  }
  // http://127.0.0.1:9090/api/v1/models/?base_models=sdxl&model_type=main
  async getModels() {
    const query: ApiType["/api/v1/models/"]["get"]["parameters"]["query"] = {
      base_models: [`sdxl`],
      model_type: `main`,
    }
    const response = await this.got(`models/`, {
      responseType: `json`,
      searchParams: new URLSearchParams(query),
    })
    return response.body.models
  }
  async normalizeTask(task: InvokeTask) {
    if (task.options.board) {
      const board = await this.findBoard(task.options.board)
      if (!board) {
        throw new Error(`Board not found by input “${task.options.board}”`)
      }
      task.setBoard(board.board_id)
    }
  }
  async queue(task: InvokeTask) {
    await this.normalizeTask(task)
    try {
      const response = await this.got.post(`queue/default/enqueue_batch`, {
        json: task.build(),
        responseType: `json`,
      })
      const body = <ApiType["/api/v1/queue/{queue_id}/enqueue_batch"]["post"]["responses"]["201"]["content"]["application/json"]> response.body
      return body
    } catch (error) {
      throw error
    }
  }
  async queueAll(batch: InvokeTask[] | Iterable<InvokeTask>) {
    const results: Parameters<InvokeServer["queue"]>[0][] = []
    for (const task of batch) {
      const result = await this.queue(task)
      results.push(result)
    }
    return results
  }
  async queueAllOptimized(batch: InvokeTaskBatch) {
    return this.queueAll(batch.getTasksOptimized())
  }
}
