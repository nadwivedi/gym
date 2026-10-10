import './src/env.js'
import os from 'node:os'
import mongoose from 'mongoose'
import { createApp } from './src/app.js'
import { adoptExistingGym } from './src/accounts.js'
import { shutdownAll } from './src/whatsapp/index.js'
import { startReminderJob } from './src/whatsapp/reminders.js'

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
// A gym from the one-gym version becomes the first account, with its data where it is.
const adopted = await adoptExistingGym()
if (adopted) console.log(`Existing gym "${adopted.name}" is now an account: log in with its mobile number and password.`)

// WhatsApp reminders: nothing connects here. The job opens a gym's connection only when a reminder is due.
const stopReminderJob = startReminderJob()

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
  await shutdownAll().catch(() => {})
  await mongoose.disconnect().catch(() => {})
  process.exit(0)
}
process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
