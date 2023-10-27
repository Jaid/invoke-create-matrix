import type {ArgumentsCamelCase, Argv, CommandBuilder} from 'yargs'

import {InvokeServer} from '../InvokeServer.js'

// Don’t fully understand this, taken from here: https://github.com/zwade/hypatia/blob/a4f2f5785c146b4cb4ebff44da609a6500c53887/backend/src/start.ts#L47
export type Args = (typeof builder) extends CommandBuilder<any, infer U> ? ArgumentsCamelCase<U> : never

export const command = `$0 listModels`
export const builder = (argv: Argv) => {
  return argv
    .options({
      extended: {
        boolean: true,
        default: false,
      },
    })
}

export const handler = async (args: Args) => {
  const api = new InvokeServer
  const models = await api.getModels()
  console.log(`Got ${models.length} models`)
  if (args.extended) {
    console.dir(models)
    return
  }
  for (const model of models) {
    console.log(model.model_name)
  }
}
