import os from 'node:os'
import mongoose from 'mongoose'
import { createApp } from './app.js'
import { seedDefaults } from './db.js'

const MONGO_URL = process.env.MONGO_URL || 'mongodb://127.0.0.1:27017/gymsoft'
const PORT = Number(process.env.PORT) || 4000

try {
  await mongoose.connect(MONGO_URL, { serverSelectionTimeoutMS: 5000 })
} catch (err) {
  console.error(`Could not connect to MongoDB at ${MONGO_URL}. Is the MongoDB service running?\n${err.message}`)
  process.exit(1)
}
await seedDefaults()

createApp().listen(PORT, '0.0.0.0', () => {
  console.log(`Gym software is running.\n  On this PC:   http://localhost:${PORT}`)
  for (const list of Object.values(os.networkInterfaces())) {
    for (const net of list || []) {
      if (net.family === 'IPv4' && !net.internal) console.log(`  On your phone: http://${net.address}:${PORT}  (same Wi-Fi)`)
    }
  }
})
