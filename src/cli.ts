import yargs from 'yargs'
import {hideBin} from 'yargs/helpers'

import * as fromYamlCommand from './command/fromYaml.js'
import * as listModelsCommand from './command/listModels.js'
import * as mainCommand from './command/main.js'

await yargs(hideBin(process.argv))
  .detectLocale(false)
  .scriptName(`invoke-create-matrix`)
  .command(mainCommand)
  .command(fromYamlCommand)
  .command(listModelsCommand)
  .strict()
  .parserConfiguration({
    'strip-aliased': true,
    'strip-dashed': true,
  })
  .parse()
