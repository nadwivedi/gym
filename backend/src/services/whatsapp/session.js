import { WaRecipientError, WaUnavailableError, withTimeout } from './errors.js'

// Session states. "authenticated" = connected and ready to send.
export const STATE = {
  DISCONNECTED: 'disconnected', // no connection open (normal between sends)
  INITIALIZING: 'initializing', // connecting to WhatsApp
  QR: 'qr_ready', // waiting for the owner to scan
  SYNCING: 'syncing', // QR scanned, finishing the login
  READY: 'authenticated', // connected, can send
  NEEDS_QR: 'needs_qr', // saved login is gone or invalid: only a QR scan can fix it
}

// Client "disconnected" reasons that mean the linked device was removed.
const LOGGED_OUT_REASONS = new Set(['LOGOUT'])

// Connection errors worth an immediate retry while starting (network blips, WhatsApp busy).
const TRANSIENT_LAUNCH = /connection closed|connection lost|connection failure|timed out|ETIMEDOUT|ECONNRESET|ECONNREFUSED|ENOTFOUND|EAI_AGAIN|socket hang up|stream errored/i
const MAX_LAUNCH_RETRIES = 2

// Send errors meaning the connection dropped (the message stays pending).
const CONNECTION_GONE = /connection closed|connection lost|connection was lost|not open|timed out|stream errored|ECONNRESET/i

// Serializes async work. Every lifecycle change (start / cancel / logout / crash handling) runs
// through one of these, so two connections can never be opened for the same login.
export class Mutex {
  constructor() {
    this._tail = Promise.resolve()
  }
  run(fn) {
    const result = this._tail.then(() => fn())
    this._tail = result.catch(() => {})
    return result
  }
}

// The gym's single WhatsApp connection, opened only when a message has to go out.
export class WhatsAppSession {
  /**
   * @param {object} deps
   *   config, sessionId, store: { load(), save(data) }, createClient({ sessionId }),
   *   profile: { hasSavedSession(id), wipe(id) }, log, toQrDataUrl(qr), onReady()
   */
  constructor(deps) {
    this.sessionId = deps.sessionId || 'gym'
    this.deps = deps
    this.config = deps.config

    this.state = STATE.DISCONNECTED
    this.qrDataUrl = null
    this.qrStartedAt = null
    this.lastPollAt = 0
    this.phoneNumber = null
    this.lastConnectedAt = null
    this.lastError = null

    this.client = null
    this.generation = 0 // bumped on every launch / teardown; events from older connections are ignored
    this.allowQr = false // false for background starts: a QR then means "login lost", not "show it"
    this.lock = new Mutex()
    this.sendLock = new Mutex()
    this.readyWaiters = new Set()
    this.launchTimer = null
    this.healthFails = 0
    this.launchRetries = 0
    this.qrRefreshes = 0
    this.sendsInFlight = 0
    this.lastActivityAt = Date.now()
    this.startedAt = null

    this._saveChain = Promise.resolve()
    this._hydrated = null
  }

  // ---- Persistence ----

  hydrate() {
    this._hydrated ||= (async () => {
      const doc = await this.deps.store.load().catch(() => null)
      if (!doc) return
      this.phoneNumber = doc.phoneNumber || null
      this.lastConnectedAt = doc.lastConnectedAt || null
      this.lastError = doc.lastError || null
      // Nothing is running in this process yet: "initializing" / "qr_ready" from the last run are stale.
      this.state = doc.status === STATE.NEEDS_QR ? STATE.NEEDS_QR : STATE.DISCONNECTED
    })()
    return this._hydrated
  }

  _persist() {
    const snapshot = { status: this.state, phoneNumber: this.phoneNumber, lastConnectedAt: this.lastConnectedAt, lastError: this.lastError }
    // Chained so an older write can never land after a newer one.
    this._saveChain = this._saveChain.then(() => this.deps.store.save(snapshot)).catch((err) => this.deps.log.warn('DB_SAVE_FAILED', err.message))
    return this._saveChain
  }

  _setState(state, extra = {}) {
    const prev = this.state
    this.state = state
    for (const [k, v] of Object.entries(extra)) this[k] = v
    if (state !== STATE.QR) {
      this.qrDataUrl = null
      this.qrStartedAt = null
    }
    if (prev !== state) this.deps.log.info('STATE', `${prev} -> ${state}${this.lastError && state !== STATE.READY ? ` (${this.lastError})` : ''}`)
    if (state === STATE.READY) this._resolveWaiters()
    else if (![STATE.INITIALIZING, STATE.SYNCING].includes(state)) this._rejectWaiters(this._unavailableError())
    return this._persist()
  }

  // ---- Status ----

  hasSavedSession() {
    return this.deps.profile.hasSavedSession(this.sessionId)
  }

  isRunning() {
    return !!this.client
  }

  _isStarting() {
    return !!this.client || [STATE.INITIALIZING, STATE.SYNCING].includes(this.state)
  }

  touchPoll() {
    this.lastPollAt = Date.now()
  }

  snapshot() {
    return {
      status: this.state,
      qrCodeDataUrl: this.state === STATE.QR ? this.qrDataUrl : null,
      qrExpiresAt: this.state === STATE.QR && this.qrStartedAt ? new Date(this.qrStartedAt + this.config.qrMaxMs).toISOString() : null,
      phoneNumber: this.phoneNumber,
      lastConnectedAt: this.lastConnectedAt,
      lastError: this.lastError,
      isInitializing: [STATE.INITIALIZING, STATE.SYNCING].includes(this.state),
      connectionOpen: this.state === STATE.READY,
      linked: this.hasSavedSession(),
    }
  }

  // ---- Public lifecycle (all serialized) ----

  // Owner tapped Connect: connect and show a QR if one is needed.
  connect() {
    return this.lock.run(async () => {
      await this.hydrate()
      if (this._isStarting()) {
        // A background start is already running: let it show a QR if the login turns out invalid.
        this.allowQr = true
        if (this.state === STATE.QR) this.lastPollAt = Date.now()
        return
      }
      await this._launch({ allowQr: true, reason: 'owner' })
    })
  }

  // Background start (a reminder is due). Never shows a QR.
  ensureRunning(reason = 'background') {
    return this.lock.run(async () => {
      await this.hydrate()
      if (this._isStarting()) return
      if (this.state === STATE.NEEDS_QR) return
      if (!this.hasSavedSession()) return
      await this._launch({ allowQr: false, reason })
    })
  }

  // Cancel a QR / connection attempt without changing the saved login.
  cancel() {
    return this.lock.run(async () => {
      await this.hydrate()
      await this._teardown()
      await this._setState(this.hasSavedSession() ? STATE.DISCONNECTED : STATE.NEEDS_QR, { lastError: null })
    })
  }

  // Unlink the device and delete the saved login.
  logout() {
    return this.lock.run(async () => {
      await this.hydrate()
      // WhatsApp only accepts the unlink over an open connection.
      if (!this.client && this.hasSavedSession()) {
        await this._launch({ allowQr: false, reason: 'logout' })
        await this.waitUntilReady(20000).catch(() => {})
      }
      const client = this.client
      if (client && this.state === STATE.READY) {
        await withTimeout(client.logout(), 20000, 'logout').catch(() => {})
      }
      await this._teardown()
      await this.deps.profile.wipe(this.sessionId)
      await this._setState(STATE.DISCONNECTED, { phoneNumber: null, lastError: null })
      this.deps.log.info('LOGOUT', 'Unlinked and saved login deleted')
    })
  }

  // Fresh QR: reconnect in "show QR" mode.
  renewQr() {
    return this.lock.run(async () => {
      await this.hydrate()
      await this._teardown()
      await this._launch({ allowQr: true, reason: 'renew-qr' })
    })
  }

  // Server shutdown: close the connection and flush the login to the database.
  shutdown() {
    return this.lock.run(() => this._teardown())
  }

  // ---- Launch / teardown (must run inside this.lock) ----

  async _launch({ allowQr, reason, retry = false }) {
    if (!retry) {
      this.launchRetries = 0
      this.qrRefreshes = 0
    }
    const gen = ++this.generation
    this.allowQr = allowQr
    this.startedAt = Date.now()
    this.healthFails = 0
    this._launchReason = reason
    this.deps.log.info('LAUNCH', `Connecting to WhatsApp (${reason}, qr ${allowQr ? 'allowed' : 'not allowed'})`)
    await this._setState(STATE.INITIALIZING, { lastError: null })

    // Not awaited: connecting can take a while and must not block cancel / logout.
    this._runLaunch(gen).catch((err) => this._onLaunchFailed(gen, err))
  }

  async _runLaunch(gen) {
    // Saved data without a completed login (an abandoned QR scan) is worth nothing: start clean.
    if (!this.hasSavedSession()) {
      await this.deps.profile.wipe(this.sessionId)
      if (gen !== this.generation) return // cancelled meanwhile
    }

    const client = this.deps.createClient({ sessionId: this.sessionId })
    this.client = client
    this._attachClientEvents(client, gen)

    this.launchTimer = setTimeout(() => {
      this._onLaunchFailed(gen, new Error(`WhatsApp did not connect within ${Math.round(this.config.launchTimeoutMs / 1000)}s`))
    }, this.config.launchTimeoutMs)

    await client.initialize()
  }

  _attachClientEvents(client, gen) {
    const live = () => gen === this.generation

    client.on('qr', async (qr) => {
      if (!live()) return
      this._finishLaunchPhase()
      if (!this.allowQr) {
        // Background start and WhatsApp wants a QR: the saved login is no longer valid.
        return this._onNeedsQr(gen, 'Your WhatsApp login has expired. Scan the QR code again to reconnect.', true)
      }
      try {
        const dataUrl = await this.deps.toQrDataUrl(qr)
        if (!live()) return
        const first = this.state !== STATE.QR
        this.qrDataUrl = dataUrl
        if (first) {
          this.qrStartedAt = Date.now()
          this.lastPollAt = Math.max(this.lastPollAt, Date.now())
          await this._setState(STATE.QR, { lastError: null })
          this.deps.log.info('QR_READY', 'QR code ready to scan')
        }
      } catch (err) {
        this.deps.log.error('QR_RENDER_FAILED', err.message)
      }
    })

    client.on('authenticated', () => {
      if (!live()) return
      this._finishLaunchPhase()
      this.launchTimer = setTimeout(() => {
        this._onLaunchFailed(gen, new Error('WhatsApp accepted the QR scan but did not finish connecting'))
      }, this.config.launchTimeoutMs)
      this._setState(STATE.SYNCING, { lastError: null })
    })

    client.on('ready', () => {
      if (!live()) return
      this._markReady(client.info?.wid?.user)
    })

    client.on('auth_failure', (msg) => {
      if (!live()) return
      // The owner is at the screen: throw away the invalid login and show a fresh QR right away.
      if (this.allowQr && this.qrRefreshes < 1) {
        this.qrRefreshes++
        return this.lock.run(async () => {
          if (gen !== this.generation) return
          this.deps.log.warn('AUTH_FAILURE', `${msg}: starting over with a new QR code`)
          await this._teardown()
          await this.deps.profile.wipe(this.sessionId)
          await this._launch({ allowQr: true, reason: 'fresh login', retry: true })
        })
      }
      this._onNeedsQr(gen, `WhatsApp rejected the saved login (${msg}). Scan the QR code again.`, true)
    })

    client.on('disconnected', (reason) => {
      if (!live()) return
      const r = String(reason)
      this.deps.log.warn('DISCONNECTED', r)
      if (LOGGED_OUT_REASONS.has(r)) {
        return this._onNeedsQr(gen, 'WhatsApp was logged out from your phone (Linked devices). Scan the QR code again.', true)
      }
      this._onCrash(gen, `WhatsApp disconnected (${r})`)
    })
  }

  _markReady(phoneFromClient) {
    if (this.state === STATE.READY) return
    this._finishLaunchPhase()
    this.healthFails = 0
    this.lastActivityAt = Date.now()
    const phone = phoneFromClient || this.phoneNumber
    this.deps.log.info('READY', `Connected as +${phone || 'unknown'} in ${Math.round((Date.now() - (this.startedAt || Date.now())) / 1000)}s`)
    this._setState(STATE.READY, { phoneNumber: phone, lastConnectedAt: new Date(), lastError: null })
    // Send whatever is pending right away (the reminder job hooks in here).
    Promise.resolve(this.deps.onReady?.()).catch((err) => this.deps.log.error('ON_READY_FAILED', err.message))
  }

  _finishLaunchPhase() {
    this.launchRetries = 0
    if (this.launchTimer) {
      clearTimeout(this.launchTimer)
      this.launchTimer = null
    }
  }

  async _teardown() {
    this.generation++ // any event from the old connection is ignored from now on
    this._finishLaunchPhase()
    const client = this.client
    this.client = null
    this.startedAt = null
    if (client) {
      await withTimeout(client.destroy(), 15000, 'disconnect').catch(() => {})
      this.deps.log.info('CLOSED', 'WhatsApp connection closed')
    }
  }

  // ---- Failure handling ----

  _onLaunchFailed(gen, err) {
    return this.lock.run(async () => {
      if (gen !== this.generation) return
      const msg = String(err?.message || err)
      if (TRANSIENT_LAUNCH.test(msg) && this.launchRetries < MAX_LAUNCH_RETRIES) {
        const attempt = ++this.launchRetries
        this.deps.log.warn('LAUNCH_RETRY', `${msg}: retrying (${attempt}/${MAX_LAUNCH_RETRIES})`)
        const allowQr = this.allowQr
        await this._teardown()
        this.launchRetries = attempt // _teardown resets it
        return this._launch({ allowQr, reason: `${this._launchReason || 'launch'} retry ${attempt}`, retry: true })
      }
      this.deps.log.error('LAUNCH_FAILED', msg)
      await this._teardown()
      await this._setState(this.hasSavedSession() ? STATE.DISCONNECTED : STATE.NEEDS_QR, { lastError: `Could not connect to WhatsApp: ${msg}` })
    })
  }

  _onNeedsQr(gen, message, wipe) {
    return this.lock.run(async () => {
      if (gen !== this.generation) return
      this.deps.log.warn('NEEDS_QR', message)
      await this._teardown()
      if (wipe) await this.deps.profile.wipe(this.sessionId)
      await this._setState(STATE.NEEDS_QR, { lastError: message })
    })
  }

  _onCrash(gen, message) {
    return this.lock.run(async () => {
      if (gen !== this.generation) return
      this.deps.log.warn('CRASH', message)
      await this._teardown()
      if (this.hasSavedSession()) {
        // On demand: nothing to do now; the next reminder connects again.
        await this._setState(STATE.DISCONNECTED, { lastError: `${message}. It will reconnect when a message needs to be sent.` })
      } else {
        await this._setState(STATE.NEEDS_QR, { lastError: message })
      }
    })
  }

  // ---- Health check (called by the watchdog timer) ----

  async healthCheck() {
    const gen = this.generation
    const now = Date.now()

    if (this.state === STATE.QR) {
      const idle = now - this.lastPollAt > this.config.qrIdleMs
      const tooLong = this.qrStartedAt && now - this.qrStartedAt > this.config.qrMaxMs
      if (idle || tooLong) {
        return this.lock.run(async () => {
          if (gen !== this.generation || this.state !== STATE.QR) return
          this.deps.log.info('QR_EXPIRED', idle ? 'Nobody is viewing the QR page' : 'QR not scanned in time')
          await this._teardown()
          await this._setState(this.hasSavedSession() ? STATE.DISCONNECTED : STATE.NEEDS_QR, {
            lastError: 'QR code expired. Tap Connect to get a new one.',
          })
        })
      }
      return
    }

    if (this.state !== STATE.READY || !this.client) return

    const waState = await withTimeout(Promise.resolve(this.client.getState()), 20000, 'health check').catch(() => null)
    if (gen !== this.generation) return
    if (waState === 'CONNECTED') {
      this.healthFails = 0
    } else {
      this.healthFails++
      this.deps.log.warn('HEALTH_CHECK', `State ${waState} (${this.healthFails}/${this.config.watchdogFailLimit})`)
      if (this.healthFails >= this.config.watchdogFailLimit) {
        return this._onCrash(gen, `WhatsApp stopped responding (state: ${waState})`)
      }
    }

    await this.closeIfIdle()
  }

  // Disconnect once nothing has been sent for idleCloseMs. The login stays in the database;
  // the next reminder connects again without a QR.
  closeIfIdle() {
    const gen = this.generation
    return this.lock.run(async () => {
      if (gen !== this.generation || this.state !== STATE.READY || this.sendsInFlight > 0) return
      if (Date.now() - this.lastActivityAt < this.config.idleCloseMs) return
      this.deps.log.info('IDLE_CLOSE', 'Nothing left to send: disconnecting (login stays saved)')
      await this._teardown()
      await this._setState(STATE.DISCONNECTED, { lastError: null })
    })
  }

  // ---- Sending ----

  _unavailableError() {
    switch (this.state) {
      case STATE.NEEDS_QR:
        return new WaUnavailableError('WhatsApp is not linked. Scan the QR code on the WhatsApp page.', 'needs_qr')
      case STATE.QR:
        return new WaUnavailableError('WhatsApp is waiting for a QR scan.', 'needs_qr')
      default:
        if (!this.hasSavedSession() && !this.client) {
          return new WaUnavailableError('WhatsApp is not linked yet. Connect it on the WhatsApp page first.', 'needs_qr')
        }
        return new WaUnavailableError('WhatsApp is not connected right now. The message will be retried.', 'not_connected')
    }
  }

  _resolveWaiters() {
    for (const w of this.readyWaiters) w.resolve()
    this.readyWaiters.clear()
  }

  _rejectWaiters(err) {
    for (const w of this.readyWaiters) w.reject(err)
    this.readyWaiters.clear()
  }

  waitUntilReady(timeoutMs) {
    if (this.state === STATE.READY && this.client) return Promise.resolve()
    if (![STATE.INITIALIZING, STATE.SYNCING].includes(this.state)) return Promise.reject(this._unavailableError())
    return new Promise((resolve, reject) => {
      const waiter = {
        resolve: () => {
          clearTimeout(timer)
          resolve()
        },
        reject: (e) => {
          clearTimeout(timer)
          reject(e)
        },
      }
      const timer = setTimeout(() => {
        this.readyWaiters.delete(waiter)
        reject(new WaUnavailableError('WhatsApp is still connecting. The message will be retried.', 'starting'))
      }, timeoutMs)
      this.readyWaiters.add(waiter)
    })
  }

  // Can a message be sent without the owner doing anything? (Lets the job skip a run without connecting.)
  canSendInBackground() {
    if ([STATE.NEEDS_QR, STATE.QR].includes(this.state)) return false
    return this.isRunning() || this.hasSavedSession()
  }

  // number: full number with country code, digits only.
  async send(number, text) {
    await this.hydrate()
    this.lastActivityAt = Date.now()
    if (!this.canSendInBackground()) throw this._unavailableError()
    this.sendsInFlight++
    try {
      if (!this._isStarting()) await this.ensureRunning('send')
      await this.waitUntilReady(this.config.sendWaitReadyMs)
      return await this.sendLock.run(() => this._doSend(number, text))
    } finally {
      this.sendsInFlight--
      this.lastActivityAt = Date.now()
    }
  }

  async _doSend(number, text) {
    const client = this.client
    const gen = this.generation
    if (!client || this.state !== STATE.READY) throw this._unavailableError()

    const num = String(number || '').replace(/\D/g, '')
    if (num.length < 11) throw new WaRecipientError(`Invalid mobile number: ${number}`)

    try {
      const numberId = await withTimeout(client.getNumberId(num), 30000, 'number lookup')
      if (!numberId) throw new WaRecipientError(`${num} is not on WhatsApp`)
      const result = await withTimeout(client.sendMessage(numberId._serialized, text), this.config.sendTimeoutMs, 'send')
      this.lastActivityAt = Date.now()
      this.deps.log.info('MSG_SENT', `Sent to ${num}`)
      return { success: true, messageId: result?.id?._serialized || null }
    } catch (err) {
      if (err instanceof WaRecipientError) throw err
      const msg = String(err?.message || err)
      if (CONNECTION_GONE.test(msg)) {
        // The connection dropped mid-send: close it and keep the message pending.
        this._onCrash(gen, `Connection lost while sending: ${msg}`)
        throw new WaUnavailableError(`WhatsApp connection was interrupted (${msg}). The message will be retried.`, 'interrupted')
      }
      throw err
    }
  }
}
