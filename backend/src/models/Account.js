// Gym owner accounts. They live in the main database (MONGO_URL); each account's gym data lives in its own
// database (dbName), reached through utils/tenant.js. An account sees only its own gym.
import mongoose from 'mongoose'

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
