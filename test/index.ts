import test, {it} from 'node:test'

import yargs from 'yargs'
import {hideBin} from 'yargs/helpers'

import {expandMaps} from '~/lib/expandMaps.js'
import * as mainCommand from '~/src/command/main.js'
import {InvokeServer} from '~/src/InvokeServer.js'

const seed = 0
const cli = yargs().command(mainCommand)
const fixtures = [
  `Minions in Mario Kart, throwing Blue Shell at each other, item boxes, Rainbow Road course, epic dramatic action --style 'Minions in Mario Kart, throwing Blue Shell at each other, item boxes, Rainbow Road course, epic dramatic action' --steps 100 -seed ${seed}`,
  `Minions in Mario Kart, throwing Blue Shell at each other, item boxes, Rainbow Road course, epic dramatic action  --steps 100 -seed ${seed}`,
  `Shrek bathing in a --lora '[Concept] Detail Tweaker (w4r10ck) v1_0' 0.5 --lora '[Style] More Art (ledadu) xl_more_art-full-v1' 0.5 mud pool --steps 100 --seed ${seed}`,
  `A naked Minion on a slackline in a circus tent --steps 100 --seed ${seed}`,
]
for (const fixture of fixtures) {
  test(`should run CLI: ${fixture}`, async () => {
    const cliExecution = cli.parse(fixture)
    await cliExecution
    console.dir(cliExecution)
  })
}
test(`list boards`, async () => {
  const server = new InvokeServer
  const boards = await server.getBoards()
})
test(`list models`, async () => {
  const server = new InvokeServer
  const models = await server.getModels()
})
test(`expandMaps`, async () => {
  const config = {
    a: 1,
    'b.map': [`value1`, `value2`, `value3`],
    'c.map': [`moin`, `servus`],
    'd.map': [`d`],
    'e.map': [[`_`], ``],
  }
  const mapped = expandMaps(config)
})
