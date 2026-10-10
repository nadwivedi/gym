// Gym owner accounts. They live in the main database (MONGO_URL); each account's gym data lives in its own
// database (dbName), reached through tenant.js. An account sees only its own gym.
import mongoose from 'mongoose'
import { newSecret } from './auth.js'

const { Schema } = mongoose

export const Account = mongoose.model(
  'Account',
  new Schema(
    {
      name: { type: String, default: '' },
      // Login: email or mobile number + password. An account adopted from the one-gym version has only the mobile number.
      email: { type: String, lowercase: true, trim: true, unique: true, sparse: true },
      loginMobile: { type: String, unique: true, sparse: true },
      passHash: { type: String, required: true },
      passSalt: { type: String, required: true },
      // Signs this account's login tokens; replaced to sign every device out.
      secret: { type: String, required: true },
      dbName: { type: String, required: true, unique: true },
      // Key of the saved WhatsApp login; 'gym' for the adopted gym, so its linked number keeps working.
      waSessionId: { type: String, required: true },
    },
    { versionKey: false, timestamps: { createdAt: true, updatedAt: false } },
  ),
)

// What the rest of the server keeps about the logged-in account.
export const accountRef = (a) => ({ id: String(a._id), dbName: a.dbName, waSessionId: a.waSessionId, name: a.name, email: a.email || '' })

// A new gym gets its own database next to the main one, e.g. gymsoft_<id>.
export async function createAccount({ name, email, loginMobile, passHash, passSalt }) {
  const _id = new mongoose.Types.ObjectId()
  return Account.create({ _id, name, email, loginMobile, passHash, passSalt, secret: newSecret(), dbName: `${mongoose.connection.name}_${_id}`, waSessionId: String(_id) })
}

// The one-gym version kept the owner login in the main database's settings. On the first start of this
// version, that gym becomes the first account and keeps its data where it is: nothing is copied or deleted.
export async function adoptExistingGym() {
  await Account.init()
  if (await Account.estimatedDocumentCount()) return null
  const old = await mongoose.connection.db.collection('settings').findOne({ _id: 'main' })
  if (!old?.passHash || !old.loginMobile) return null
  return Account.create({
    name: old.gymName || '',
    loginMobile: old.loginMobile,
    passHash: old.passHash,
    passSalt: old.passSalt,
    secret: old.secret || newSecret(),
    dbName: mongoose.connection.name,
    waSessionId: 'gym',
  })
}
