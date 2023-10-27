import type {Options as InvokeTaskOptions} from '../InvokeTask.js'
import type {ArgumentsCamelCase, Argv, CommandBuilder} from 'yargs'

import readFileYaml from 'read-file-yaml'

import {InvokeServer} from '../InvokeServer.js'
import {InvokeTaskBatch} from '../InvokeTaskBatch.js'

// Don’t fully understand this, taken from here: https://github.com/zwade/hypatia/blob/a4f2f5785c146b4cb4ebff44da609a6500c53887/backend/src/start.ts#L47
export type Args = (typeof builder) extends CommandBuilder<any, infer U> ? ArgumentsCamelCase<U> : never

export const command = `$0 fromYaml <file>`
export const builder = (argv: Argv) => {
  return argv
    .options({
      file: {
        required: true,
        string: true,
      },
    })
}

export const handler = async (args: Args) => {
  const api = new InvokeServer
  const data = <InvokeTaskOptions> await readFileYaml.default(args.file)
  if (!data) {
    throw new Error(`No data in ${args.file}`)
  }
  const dataMerged = {
    ...args,
    ...data,
  }
  const batch = InvokeTaskBatch.fromData(dataMerged)
  console.log(`Sending ${batch.tasks.length} tasks to ${api.options.domain}`)
  await api.queueAllOptimized(batch)
}
