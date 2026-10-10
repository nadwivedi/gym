import mongoose from 'mongoose'
import { tenantModel } from '../tenant.js'

const { Schema } = mongoose

// WhatsApp (Baileys) login data: one document per credential / Signal key.
// Values are BufferJSON-encoded strings. Treat as secret (equivalent to a private key).
const waAuthKeySchema = new Schema(
  {
    sessionId: { type: String, required: true },
    key: { type: String, required: true }, // 'creds' or '<type>-<id>'
    value: { type: String, required: true },
  },
  { versionKey: false, timestamps: true },
)
waAuthKeySchema.index({ sessionId: 1, key: 1 }, { unique: true })
export const WaAuthKey = tenantModel('WaAuthKey', waAuthKeySchema)

// Copies of messages we sent, so WhatsApp re-send requests ("Waiting for this message" on the
// member's phone) can be answered even after a reconnect. Kept for 14 days.
const waSentMessageSchema = new Schema(
  {
    sessionId: { type: String, required: true },
    msgId: { type: String, required: true },
    message: { type: String, required: true }, // BufferJSON-encoded proto message
    createdAt: { type: Date, default: Date.now, expires: 14 * 24 * 3600 },
  },
  { versionKey: false },
)
waSentMessageSchema.index({ sessionId: 1, msgId: 1 }, { unique: true })
export const WaSentMessage = tenantModel('WaSentMessage', waSentMessageSchema)

// The one WhatsApp connection of the gym: what the status screen shows.
export const WaState = tenantModel(
  'WaState',
  new Schema(
    {
      _id: String,
      status: { type: String, default: 'disconnected' },
      phoneNumber: { type: String, default: null },
      lastConnectedAt: Date,
      lastError: { type: String, default: null },
    },
    { versionKey: false },
  ),
)

// The message queue and log. A renewal reminder is identified by member + renewal date + kind,
// and that key is unique: the same reminder can never be queued, or sent, twice.
const reminderSchema = new Schema(
  {
    key: { type: String }, // '<memberId>:<renewalDate>:<kind>', absent for test messages
    memberId: Schema.Types.ObjectId,
    memberName: { type: String, default: '' },
    phone: { type: String, required: true },
    kind: { type: String, enum: ['due', 'after', 'test'], required: true },
    renewalDate: { type: String, default: '' },
    body: { type: String, required: true },
    status: { type: String, enum: ['pending', 'sent', 'failed', 'cancelled'], default: 'pending', index: true },
    scheduledFor: { type: Date, required: true },
    sentAt: Date,
    errorReason: { type: String, default: '' },
    // Send attempts that failed with an unexpected error (WhatsApp being offline does not count).
    attempts: { type: Number, default: 0 },
    waMessageId: String,
  },
  { versionKey: false, timestamps: true },
)
reminderSchema.index({ key: 1 }, { unique: true, partialFilterExpression: { key: { $type: 'string' } } })
reminderSchema.index({ status: 1, scheduledFor: 1 })
reminderSchema.index({ status: 1, sentAt: 1 })
export const Reminder = tenantModel('Reminder', reminderSchema)
