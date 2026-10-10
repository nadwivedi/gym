import { Reminder, accountRef, getSettings } from '../models/index.js'
import { waFor } from '../services/whatsapp/index.js'
import { out } from '../utils/helpers.js'

// Every call works on the logged-in account's own WhatsApp number: this sets req.wa.
export async function loadWhatsApp(req, res, next) {
  req.wa = await waFor(accountRef(req.account))
  next()
}

// The WhatsApp page passes ?watch=1: that keeps a QR code alive while someone is looking at it.
export async function status(req, res) {
  const settings = await getSettings()
  const result = await req.wa.getStatus({ watching: req.query.watch === '1' })
  res.json({ ...result, enabled: settings.waEnabled })
}

// Connect: uses the saved login if there is one, otherwise shows a QR code.
export async function connect(req, res) {
  await req.wa.connect()
  res.json({ ok: true })
}

export async function renewQr(req, res) {
  await req.wa.renewQr()
  res.json({ ok: true })
}

// Cancel a QR / connection attempt.
export async function cancel(req, res) {
  await req.wa.cancel()
  res.json({ ok: true })
}

// Unlink the gym's WhatsApp number and delete the saved login.
export async function logout(req, res) {
  await req.wa.logout()
  res.json({ ok: true })
}

export async function updateSettings(req, res) {
  const settings = await getSettings()
  const b = req.body || {}
  if (b.enabled !== undefined) settings.waEnabled = !!b.enabled
  await settings.save()
  res.json({ ok: true })
}

export async function log(req, res) {
  const rows = await Reminder.find().sort({ createdAt: -1 }).limit(100).lean()
  res.json(rows.map(out))
}
