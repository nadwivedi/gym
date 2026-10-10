import express from 'express'
import { accountRef } from '../accounts.js'
import { getSettings, out } from '../db.js'
import { waFor } from './index.js'
import { Reminder } from './models.js'

// Mounted under /api/whatsapp, behind the login: every call works on the logged-in account's own number.
export function whatsappRoutes() {
  const r = express.Router()
  // The logged-in account's own WhatsApp service.
  r.use(async (req, res, next) => {
    req.wa = await waFor(accountRef(req.account))
    next()
  })

  // The WhatsApp page passes ?watch=1: that keeps a QR code alive while someone is looking at it.
  r.get('/status', async (req, res) => {
    const settings = await getSettings()
    const status = await req.wa.getStatus({ watching: req.query.watch === '1' })
    res.json({ ...status, enabled: settings.waEnabled })
  })

  // Connect: uses the saved login if there is one, otherwise shows a QR code.
  r.post('/connect', async (req, res) => {
    await req.wa.connect()
    res.json({ ok: true })
  })

  r.post('/renew-qr', async (req, res) => {
    await req.wa.renewQr()
    res.json({ ok: true })
  })

  // Cancel a QR / connection attempt.
  r.post('/cancel', async (req, res) => {
    await req.wa.cancel()
    res.json({ ok: true })
  })

  // Unlink the gym's WhatsApp number and delete the saved login.
  r.post('/logout', async (req, res) => {
    await req.wa.logout()
    res.json({ ok: true })
  })

  r.patch('/settings', async (req, res) => {
    const settings = await getSettings()
    const b = req.body || {}
    if (b.enabled !== undefined) settings.waEnabled = !!b.enabled
    await settings.save()
    res.json({ ok: true })
  })

  r.get('/log', async (req, res) => {
    const rows = await Reminder.find().sort({ createdAt: -1 }).limit(100).lean()
    res.json(rows.map(out))
  })

  return r
}
