// Forgot password: run on the gym PC (`npm run reset-login`) to remove the owner login.
// The next visit asks to create a new login. Members, payments and all other data stay as they are.
import mongoose from 'mongoose'
import { newSecret } from './auth.js'
import { getSettings } from './db.js'

const MONGO_URL = process.env.MONGO_URL || 'mongodb://127.0.0.1:27017/gymsoft'

await mongoose.connect(MONGO_URL, { serverSelectionTimeoutMS: 5000 })
const s = await getSettings()
Object.assign(s, { loginMobile: '', passHash: '', passSalt: '', pinHash: '', pinSalt: '', secret: newSecret() })
await s.save()
console.log(`Login removed for "${s.gymName}". Open the app and create a new login. No gym data was changed.`)
await mongoose.disconnect()
