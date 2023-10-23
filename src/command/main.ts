import type {Loras, Scheduler} from '../InvokeTask.js'
import type {ArgumentsCamelCase, Argv, CommandBuilder} from 'yargs'

import * as lodash from 'lodash-es'

import {InvokeServer} from '../InvokeServer.js'
import {defaultOptions, InvokeTask} from '../InvokeTask.js'

// Don’t fully understand this, taken from here: https://github.com/zwade/hypatia/blob/a4f2f5785c146b4cb4ebff44da609a6500c53887/backend/src/start.ts#L47
export type Args = (typeof builder) extends CommandBuilder<any, infer U> ? ArgumentsCamelCase<U> : never

export const command = `$0 <prompt...>`
export const builder = (argv: Argv) => {
  return argv
    .options({
      cfgScale: {
        default: defaultOptions.cfgScale,
        number: true,
      },
      cpuNoise: {
        boolean: defaultOptions.cpuNoise,
        default: false,
      },
      fp32: {
        boolean: defaultOptions.fp32,
        default: true,
      },
      height: {
        default: defaultOptions.height,
        number: true,
      },
      highPriority: {
        boolean: true,
        default: true,
      },
      lora: {
        array: true,
        coerce: (arg: string[]) => {
          const pairs = lodash.chunk(arg, 2)
          return <Loras> Object.fromEntries(pairs)
        },
        nargs: 2,
      },
      model: {
        default: defaultOptions.model,
        string: true,
      },
      negativePrompt: {
        default: defaultOptions.negativePrompt,
        string: true,
      },
      negativeStylePrompt: {
        default: defaultOptions.negativeStylePrompt,
        string: true,
      },
      prompt: {
        array: true,
        coerce: (arg: string[]) => {
          return arg.join(` `)
        },
        required: true,
        type: `string`,
      },
      runs: {
        default: defaultOptions.runs,
        number: true,
      },
      scheduler: {
        default: defaultOptions.scheduler,
        string: true,
      },
      seed: {
        number: true,
      },
      steps: {
        default: defaultOptions.steps,
        number: true,
      },
      stylePrompt: {
        default: defaultOptions.stylePrompt,
        string: true,
      },
      width: {
        number: true,
      },
    })
}

export const handler = async (args: Args) => {
  const api = new InvokeServer
  const task = new InvokeTask({
    cfgScale: args.cfgScale,
    cpuNoise: args.cpuNoise,
    fp32: args.fp32,
    height: args.height,
    highPriority: args.highPriority,
    loras: args.lora,
    model: args.model,
    negativePrompt: args.negativePrompt,
    negativeStylePrompt: args.negativeStylePrompt,
    prompt: args.prompt,
    runs: args.runs,
    scheduler: <Scheduler> args.scheduler,
    seed: args.seed,
    steps: args.steps,
    stylePrompt: args.stylePrompt,
    width: args.width,
  })
  const graph = task.build()
  await api.queue(graph)
}
