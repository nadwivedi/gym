import { BaileysClient } from './baileysClient.js'
import { config } from './config.js'
import { WaState } from './models.js'
import { profile } from './mongoAuthState.js'
import { WhatsAppSession } from './session.js'

const quiet = process.env.NODE_ENV === 'test'
const print = (level) => (event, detail) => {
  if (!quiet) console[level](`[WhatsApp] ${event}${detail ? `: ${detail}` : ''}`)
}
const log = { info: print('log'), warn: print('warn'), error: print('error') }

// The gym has one WhatsApp number, so there is exactly one session.
class WhatsAppService {
  constructor(deps) {
    this.deps = deps
    this.config = deps.config
    this.session = new WhatsAppSession({ ...deps, onReady: () => this.readyHandler?.() })
    this.watchdog = null
    this.shuttingDown = false
  }

  // Call once after the database is connected.
  async start() {
    const linked = await this.deps.profile.load().catch((err) => {
      this.deps.log.error('STARTUP_ERROR', `Could not load the WhatsApp login: ${err.message}`)
      return 0
    })
    await this.session.hydrate()
    await this.session._persist() // write back the normalised state
    this.deps.log.info('STARTUP', `Engine: Baileys, on demand | saved login: ${linked ? 'yes' : 'no'} | idle close: ${this.config.idleCloseMs / 1000}s`)
    this.watchdog = setInterval(() => this._tick(), this.config.watchdogIntervalMs)
    this.watchdog.unref?.()
  }

  async _tick() {
    if (this.shuttingDown) return
    try {
      await this.session.healthCheck()
    } catch (err) {
      this.deps.log.error('WATCHDOG_ERROR', err.message)
    }
  }

  async getStatus({ watching = false } = {}) {
    await this.session.hydrate()
    if (watching) this.session.touchPoll()
    return this.session.snapshot()
  }

  _guard(fn) {
    if (this.shuttingDown) return Promise.reject(new Error('Server is shutting down'))
    return fn()
  }

  connect() {
    return this._guard(() => this.session.connect())
  }
  renewQr() {
    return this._guard(() => this.session.renewQr())
  }
  cancel() {
    return this.session.cancel()
  }
  logout() {
    return this.session.logout()
  }

  send(number, text) {
    return this._guard(() => this.session.send(number, text))
  }

  // Lets the reminder job skip a run without connecting when nothing can be sent anyway.
  async canSend() {
    await this.session.hydrate()
    return { ok: !this.shuttingDown && this.session.canSendInBackground(), reason: this.session.state }
  }

  // Is a WhatsApp number linked (a saved login exists)?
  async linked() {
    await this.session.hydrate()
    return this.session.hasSavedSession() && this.session.state !== 'needs_qr'
  }

  // Called every time the connection becomes ready (set by the reminder job).
  setReadyHandler(fn) {
    this.readyHandler = fn
  }

  closeIfIdle() {
    return this.session.closeIfIdle()
  }

  async shutdown() {
    if (this.shuttingDown) return
    this.shuttingDown = true
    if (this.watchdog) clearInterval(this.watchdog)
    await this.session.shutdown().catch(() => {})
  }
}

const store = {
  load: () => WaState.findById('main').lean(),
  save: (data) => WaState.updateOne({ _id: 'main' }, { $set: data }, { upsert: true }),
}

export const wa = new WhatsAppService({
  config,
  store,
  profile,
  log,
  createClient: ({ sessionId }) => new BaileysClient({ sessionId }),
  // Loaded only when a QR code is actually shown.
  toQrDataUrl: async (qr) => (await import('qrcode')).default.toDataURL(qr, { width: 300, margin: 1 }),
})

export { WhatsAppService, log }
