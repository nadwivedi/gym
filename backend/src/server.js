import './env.js'
import os from 'node:os'
import mongoose from 'mongoose'
import { createApp } from './app.js'
import { seedDefaults } from './db.js'
import { wa } from './whatsapp/index.js'
import { startReminderJob } from './whatsapp/reminders.js'

const MONGO_URL = process.env.MONGO_URL || 'mongodb://127.0.0.1:27017/gymsoft'
const PORT = Number(process.env.PORT) || 4000
console.log(PORT)
// The address without its password, for messages.
const SAFE_MONGO_URL = MONGO_URL.replace(/\/\/([^:/@]+):[^/]*@/, '//$1:****@')

try {
  await mongoose.connect(MONGO_URL, { serverSelectionTimeoutMS: 5000 })
} catch (err) {
  console.error(`Could not connect to MongoDB at ${SAFE_MONGO_URL}. Is the MongoDB service running?\n${err.message}`)
  process.exit(1)
}
await seedDefaults()

// WhatsApp reminders: nothing connects here. The job opens a connection only when a reminder is due.
await wa.start().catch((err) => console.error('[WhatsApp] Startup failed:', err.message))
const stopReminderJob = startReminderJob(wa)

const server = createApp().listen(PORT, '0.0.0.0', () => {
  console.log(`Gym software is running.\n  On this PC:   http://localhost:${PORT}`)
  for (const list of Object.values(os.networkInterfaces())) {
    for (const net of list || []) {
      if (net.family === 'IPv4' && !net.internal) console.log(`  On your phone: http://${net.address}:${PORT}  (same Wi-Fi)`)
    }
  }
})

// Graceful shutdown: close the WhatsApp connection properly so the login is fully saved.
let closing = false
async function shutdown() {
  if (closing) return
  closing = true
  stopReminderJob()
  server.close()
  await wa.shutdown().catch(() => {})
  await mongoose.disconnect().catch(() => {})
  process.exit(0)
}
process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
