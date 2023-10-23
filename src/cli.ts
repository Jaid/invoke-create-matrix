import * as mainCommand from './command/main.js'
import yargs from 'yargs'
import {hideBin} from 'yargs/helpers'

await yargs(hideBin(process.argv))
  .detectLocale(false)
  .scriptName(`invoke-create-matrix`)
  .command(mainCommand)
  .strict()
  .parserConfiguration({
    'strip-aliased': true,
    'strip-dashed': true,
  })
  .parse()
