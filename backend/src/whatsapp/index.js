import { runAs } from '../tenant.js'
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

// One gym's WhatsApp number: exactly one session per account.
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

// Every gym account has its own WhatsApp number, saved login and connection. A service is created and
// started the first time an account needs it; all its database work runs in that account's gym.
const services = new Map() // account id -> Promise<WhatsAppService>
let readyHook = null

// Called (inside the account's gym) every time one of the connections becomes ready.
export function setReadyHook(fn) {
  readyHook = fn
}

export function waFor(account) {
  if (!services.has(account.id)) {
    const inGym = (fn) => runAs(account, fn)
    const service = new WhatsAppService({
      config,
      sessionId: account.waSessionId,
      store: {
        load: () => inGym(() => WaState.findById('main').lean()),
        save: (data) => inGym(() => WaState.updateOne({ _id: 'main' }, { $set: data }, { upsert: true })),
      },
      profile: {
        load: () => inGym(() => profile.load()),
        hasSavedSession: (id) => profile.hasSavedSession(id),
        wipe: (id) => inGym(() => profile.wipe(id)),
      },
      log,
      createClient: ({ sessionId }) => new BaileysClient({ sessionId, account }),
      // Loaded only when a QR code is actually shown.
      toQrDataUrl: async (qr) => (await import('qrcode')).default.toDataURL(qr, { width: 300, margin: 1 }),
    })
    service.setReadyHandler(() => inGym(() => readyHook?.(service)))
    const started = inGym(() => service.start()).then(() => service)
    started.catch(() => services.delete(account.id)) // a failed start is tried again next time
    services.set(account.id, started)
  }
  return services.get(account.id)
}

export async function shutdownAll() {
  const all = await Promise.allSettled(services.values())
  await Promise.all(all.filter((r) => r.status === 'fulfilled').map((r) => r.value.shutdown()))
}

export { WhatsAppService, log }
