import type {InvokeTask} from './InvokeTask.js'
import type {InvokeTaskBatch} from './InvokeTaskBatch.js'
import type {paths as ApiType} from '~/lib/openapi.js'

import got from 'got'
import * as lodash from 'lodash-es'

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
  async getModels() {
    const query: ApiType["/api/v1/models/"]["get"]["parameters"]["query"] = {
      base_models: [`sdxl`],
      model_type: `main`,
    }
    const response = await this.got(`models/`, {
      responseType: `json`,
      searchParams: new URLSearchParams(query),
    })
    return response.body
  }
  async queue(graph: ApiType["/api/v1/queue/{queue_id}/enqueue_batch"]["post"]["requestBody"]["content"]["application/json"]) {
    try {
      const response = await this.got.post(`queue/default/enqueue_batch`, {
        json: graph,
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
      const graph = task.build()
      const result = await this.queue(graph)
      results.push(result)
    }
    return results
  }
  async queueAllOptimized(batch: InvokeTaskBatch) {
    return this.queueAll(batch.getTasksOptimized())
  }
}
