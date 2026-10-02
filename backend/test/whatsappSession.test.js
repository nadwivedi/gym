// The WhatsApp connection lifecycle, driven by a fake client (no network, no real WhatsApp).
import assert from 'node:assert/strict'
import { EventEmitter } from 'node:events'
import { test } from 'node:test'
import { WaRecipientError, WaUnavailableError } from '../src/whatsapp/errors.js'
import { STATE, WhatsAppSession } from '../src/whatsapp/session.js'

const tick = (ms = 5) => new Promise((r) => setTimeout(r, ms))
async function until(fn, ms = 2000) {
  const end = Date.now() + ms
  while (Date.now() < end) {
    if (await fn()) return
    await tick()
  }
  throw new Error('condition not met in time')
}

// Behaves like the Baileys adapter: initialize() connects, then the test plays WhatsApp's side
// by emitting qr / authenticated / ready / disconnected.
class FakeClient extends EventEmitter {
  constructor(env) {
    super()
    this.env = env
    this.destroyed = false
    this.loggedOut = false
    this.sent = []
    this.info = { wid: { user: '919876543210' } }
    env.clients.push(this)
  }
  async initialize() {
    if (this.env.initErrors?.length) throw new Error(this.env.initErrors.shift())
    this.env.onInitialize?.(this)
    return new Promise((resolve, reject) => {
      this._initReject = reject
    })
  }
  async destroy() {
    this.destroyed = true
    this._initReject?.(new Error('Connection closed'))
  }
  async logout() {
    this.loggedOut = true
  }
  getState() {
    return this.destroyed ? null : 'CONNECTED'
  }
  async getNumberId(num) {
    return num.endsWith('0000000000') ? null : { _serialized: `${num}@s.whatsapp.net` }
  }
  async sendMessage(jid, text) {
    if (this.env.sendError) throw this.env.sendError
    this.sent.push({ jid, text })
    return { id: { _serialized: `msg-${this.sent.length}` } }
  }
}

function makeSession(overrides = {}) {
  const env = { clients: [], linked: false, wiped: 0, db: null, readyCalls: 0, ...overrides.env }
  const session = new WhatsAppSession({
    config: {
      idleCloseMs: 60000,
      launchTimeoutMs: 2000,
      qrIdleMs: 60000,
      qrMaxMs: 300000,
      watchdogFailLimit: 2,
      sendTimeoutMs: 1000,
      sendWaitReadyMs: 1000,
      ...overrides.config,
    },
    store: { load: async () => env.db, save: async (data) => (env.db = { ...env.db, ...data }) },
    profile: {
      hasSavedSession: () => env.linked,
      wipe: async () => {
        env.wiped++
        env.linked = false
      },
    },
    createClient: () => new FakeClient(env),
    log: { info() {}, warn() {}, error() {} },
    toQrDataUrl: async (qr) => `data:image/png;base64,${qr}`,
    onReady: () => env.readyCalls++,
  })
  return { session, env }
}

// Plays a successful saved-login connection as soon as a client is created.
const autoReady = (env) => {
  env.onInitialize = (client) => setTimeout(() => client.emit('ready'), 5)
}

test('first link: Connect shows a QR, the scan logs in, pending sending is triggered', async () => {
  const { session, env } = makeSession()
  await session.connect()
  await until(() => env.clients.length === 1)
  env.clients[0].emit('qr', 'CODE-1')
  await until(() => session.state === STATE.QR)
  assert.equal(session.snapshot().qrCodeDataUrl, 'data:image/png;base64,CODE-1')

  env.clients[0].emit('authenticated')
  await until(() => session.state === STATE.SYNCING)
  env.linked = true // Baileys saved the credentials
  env.clients[0].emit('ready')
  await until(() => session.state === STATE.READY)
  assert.equal(session.snapshot().phoneNumber, '919876543210')
  assert.equal(env.readyCalls, 1)
  await until(() => env.db.status === 'authenticated') // the status is saved for the next server start
})

test('nothing connects in the background while no number is linked', async () => {
  const { session, env } = makeSession()
  await session.ensureRunning('job')
  assert.equal(env.clients.length, 0)
  assert.equal(session.canSendInBackground(), false)
  await assert.rejects(session.send('919876543210', 'hi'), WaUnavailableError)
  assert.equal(env.clients.length, 0)
})

test('on demand: a send opens the connection, and it is closed again once idle', async () => {
  const { session, env } = makeSession({ env: { linked: true }, config: { idleCloseMs: 30 } })
  autoReady(env)
  assert.equal(session.isRunning(), false) // no connection before there is something to send

  const result = await session.send('919811100001', 'Hi Rohit')
  assert.deepEqual(result, { success: true, messageId: 'msg-1' })
  assert.deepEqual(env.clients[0].sent, [{ jid: '919811100001@s.whatsapp.net', text: 'Hi Rohit' }])
  assert.equal(session.state, STATE.READY)

  // A second message reuses the open connection.
  await session.send('919811100002', 'Hi Anjali')
  assert.equal(env.clients.length, 1)

  await session.closeIfIdle() // too soon: still inside the idle time
  assert.equal(session.isRunning(), true)
  await tick(50)
  await session.closeIfIdle()
  assert.equal(session.isRunning(), false)
  assert.equal(env.clients[0].destroyed, true)
  assert.equal(session.state, STATE.DISCONNECTED)
  assert.equal(env.linked, true) // the login is kept
  assert.equal(env.wiped, 0)

  // The next message connects again by itself, without a QR.
  await session.send('919811100003', 'Hi Suresh')
  assert.equal(env.clients.length, 2)
  assert.equal(env.clients[1].sent.length, 1)
})

test('a number that is not on WhatsApp, or is too short, is a recipient error', async () => {
  const { session, env } = makeSession({ env: { linked: true } })
  autoReady(env)
  await assert.rejects(session.send('910000000000', 'hi'), WaRecipientError)
  await assert.rejects(session.send('98111', 'hi'), WaRecipientError)
  assert.equal(session.state, STATE.READY) // the connection itself is fine
})

test('a background start that is asked for a QR means the login was lost', async () => {
  const { session, env } = makeSession({ env: { linked: true } })
  env.onInitialize = (client) => setTimeout(() => client.emit('qr', 'CODE'), 5)
  await assert.rejects(session.send('919811100001', 'hi'), WaUnavailableError)
  await until(() => session.state === STATE.NEEDS_QR)
  assert.equal(env.wiped, 1)
  assert.equal(session.isRunning(), false)
  assert.match(session.snapshot().lastError, /expired/)
  // No more background attempts until the owner scans again.
  await session.ensureRunning('job')
  assert.equal(env.clients.length, 1)
})

test('logged out from the phone: the saved login is removed and a scan is needed', async () => {
  const { session, env } = makeSession({ env: { linked: true } })
  autoReady(env)
  await session.send('919811100001', 'hi')
  env.clients[0].emit('disconnected', 'LOGOUT')
  await until(() => session.state === STATE.NEEDS_QR)
  assert.equal(env.linked, false)
})

test('a dropped connection keeps the login and the message pending', async () => {
  const { session, env } = makeSession({ env: { linked: true } })
  autoReady(env)
  await session.send('919811100001', 'one')
  env.sendError = new Error('Connection Closed')
  await assert.rejects(session.send('919811100002', 'two'), WaUnavailableError)
  await until(() => session.state === STATE.DISCONNECTED)
  assert.equal(env.linked, true)
  env.sendError = null
  await session.send('919811100002', 'two')
  assert.equal(env.clients.length, 2)
})

test('a connection error while starting is retried, then reported', async () => {
  const { session, env } = makeSession({ env: { linked: true, initErrors: ['Connection Closed', 'ETIMEDOUT', 'Connection Closed'] } })
  await session.ensureRunning('job')
  await until(() => session.state === STATE.DISCONNECTED && env.clients.length === 3)
  assert.match(session.snapshot().lastError, /Could not connect to WhatsApp/)
  assert.equal(env.linked, true)
})

test('a QR nobody is looking at is closed', async () => {
  const { session, env } = makeSession({ config: { qrIdleMs: 20 } })
  await session.connect()
  await until(() => env.clients.length === 1)
  env.clients[0].emit('qr', 'CODE')
  await until(() => session.state === STATE.QR)
  await session.healthCheck() // someone just opened the page
  assert.equal(session.state, STATE.QR)
  await tick(40)
  await session.healthCheck()
  assert.equal(session.state, STATE.NEEDS_QR)
  assert.equal(env.clients[0].destroyed, true)
})

test('cancel and unlink', async () => {
  const { session, env } = makeSession({ env: { linked: true } })
  autoReady(env)
  await session.send('919811100001', 'hi')
  await session.logout()
  assert.equal(env.clients[0].loggedOut, true)
  assert.equal(env.linked, false)
  assert.equal(session.state, STATE.DISCONNECTED)
  assert.equal(session.snapshot().phoneNumber, null)

  env.onInitialize = null // from here on WhatsApp asks for a QR again
  await session.connect()
  await until(() => env.clients.length === 2)
  env.clients[1].emit('qr', 'CODE')
  await until(() => session.state === STATE.QR)
  await session.cancel()
  assert.equal(session.state, STATE.NEEDS_QR)
  assert.equal(env.clients[1].destroyed, true)
})
