// Forgot password: run on the server to give one account a new password.
//   npm run reset-login -- owner@example.com newpassword
// (an account adopted from the one-gym version can be named by its mobile number instead of an email).
// Every device of that account is signed out. No gym data is changed.
import './env.js'
import mongoose from 'mongoose'
import { Account } from './accounts.js'
import { hashPassword, newSecret } from './auth.js'

const MONGO_URL = process.env.MONGO_URL || 'mongodb://127.0.0.1:27017/gymsoft'
const [login = '', password = ''] = process.argv.slice(2)

if (!login || password.length < 6) {
  console.error('Usage: npm run reset-login -- <email or mobile number> <new password of at least 6 characters>')
  process.exit(1)
}

await mongoose.connect(MONGO_URL, { serverSelectionTimeoutMS: 5000 })
const query = login.includes('@') ? { email: login.trim().toLowerCase() } : { loginMobile: login.replace(/\D/g, '').slice(-10) }
const account = await Account.findOne(query)
if (!account) {
  console.error(`No account found for "${login}".`)
} else {
  const { salt, hash } = hashPassword(password)
  Object.assign(account, { passSalt: salt, passHash: hash, secret: newSecret() })
  await account.save()
  console.log(`New password set for "${account.name || login}". Log in with it now. No gym data was changed.`)
}
await mongoose.disconnect()
process.exit(account ? 0 : 1)
