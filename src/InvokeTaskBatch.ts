import type {Options as InvokeTaskOptions} from './InvokeTask.js'

import * as lodash from 'lodash-es'

import {expandMaps} from '~/lib/expandMaps.js'

import {InvokeTask} from './InvokeTask.js'

export class InvokeTaskBatch {
  static fromData = (batchData: InvokeTaskOptions) => {
    const expandedData = expandMaps(batchData)
    const tasks = expandedData.map(taskData => new InvokeTask(taskData))
    return new InvokeTaskBatch(tasks)
  }
  static fromOptions = (options: InvokeTaskOptions) => {
    const task = new InvokeTask(options)
    return new InvokeTaskBatch([task])
  }
  tasks: InvokeTask[]
  constructor(tasks: InvokeTask | InvokeTask[]) {
    this.tasks = lodash.castArray(tasks)
  }
  getTasksOptimized(): InvokeTask[] {
    const sortedTasks = lodash.sortBy(this.tasks, [`options.model`, task => JSON.stringify(task.options.loras)])
    return sortedTasks
  }
  [Symbol.iterator]() {
    return this.tasks[Symbol.iterator]()
  }
}
