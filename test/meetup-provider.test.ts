/* Copyright © 2022 Seneca Project Contributors, MIT License. */

import * as Fs from 'fs'



const Seneca = require('seneca')
const SenecaMsgTest = require('seneca-msg-test')

import MeetupProvider from '../src/meetup-provider'
import MeetupProviderDoc from '../src/MeetupProvider-doc'

const BasicMessages = require('./basic.messages.js')


// Only run some tests locally (not on Github Actions).
let Config = undefined
if (Fs.existsSync(__dirname + '/local-config.js')) {
  Config = require('./local-config')
}


describe('meetup-provider', () => {

  test('happy', async () => {
    expect(MeetupProvider).toBeDefined()
    expect(MeetupProviderDoc).toBeDefined()

    const seneca = await makeSeneca()

    expect(await seneca.post('sys:provider,provider:meetup,get:info'))
      .toMatchObject({
        ok: true,
        name: 'meetup',
      })
  })


  test('messages', async () => {
    const seneca = await makeSeneca()
    await (SenecaMsgTest(seneca, BasicMessages)())
  })


  /*
  test('board-basic', async () => {
    if (!Config) return;
    const seneca = await makeSeneca()

    const list = await seneca.entity("provider/meetup/board").list$()
    expect(list.length > 0).toBeTruthy()

    const board0 = await seneca.entity("provider/meetup/board")
      .load$(Config.board0.id)
    expect(board0.name).toContain('Welcome Board')

    board0.desc = 'DESC:' + Math.random()
    let board0r = await board0.save$()
    expect(board0r.id).toEqual(board0.id)
    expect(board0r.desc).toEqual(board0.desc)

    const board0u = await seneca.entity("provider/meetup/board")
      .load$(Config.board0.id)
    expect(board0u.name).toContain('Welcome Board')
    expect(board0u.desc).toEqual(board0r.desc)

  })
  */
})


async function makeSeneca() {
  const seneca = Seneca({ legacy: false })
    .test()
    .use('promisify')
    .use('entity')
    .use('env', {
      // debug: true,
      file: [__dirname + '/local-env.js;?'],
      var: {
        $MEETUP_KEY: String,
        $MEETUP_NAME: String,
        $MEETUP_CUSTID: String,
        $MEETUP_ACCID: String,
      }
    })
    .use('provider', {
      provider: {
        meetup: {
          keys: {
            key: { value: '$MEETUP_KEY' },
            name: { value: '$MEETUP_NAME' },
            cust: { value: '$MEETUP_CUSTID' },
            acc: { value: '$MEETUP_ACCID' },
          }
        }
      }
    })
    .use(MeetupProvider)

  return seneca.ready()
}

