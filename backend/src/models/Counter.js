import mongoose from 'mongoose'
import { tenantModel } from '../utils/tenant.js'

const { Schema } = mongoose

const Counter = tenantModel('Counter', new Schema({ _id: String, seq: Number }, { versionKey: false }))

export async function nextMemberNo() {
  const c = await Counter.findOneAndUpdate({ _id: 'member' }, { $inc: { seq: 1 } }, { upsert: true, returnDocument: 'after' })
  return c.seq
}
