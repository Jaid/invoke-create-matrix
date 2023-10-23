import type {Options as InvokeTaskOptions} from './InvokeTask.js'

import {InvokeServer} from './InvokeServer.js'
import {InvokeTask} from './InvokeTask.js'
import readFileYaml from 'read-file-yaml'

import {expandMaps} from '~/lib/expandMaps.js'

const api = new InvokeServer
const data = <InvokeTaskOptions> await readFileYaml.default(`temp/run.yml`)
if (!data) {
  throw new Error(`No data`)
}
const tasks = expandMaps(data).map(taskOptions => new InvokeTask(taskOptions))
await api.queueAllOptimized(tasks)
