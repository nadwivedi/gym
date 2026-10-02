import mongoose from 'mongoose'
import { isDate } from '../../shared/domain.mjs'

export class HttpError extends Error {
  constructor(status, message, extra = {}) {
    super(message)
    this.status = status
    this.extra = extra
  }
}

export function fail(status, message, extra) {
  throw new HttpError(status, message, extra)
}

export const str = (v, max = 200) => (typeof v === 'string' ? v.trim().slice(0, max) : '')

export const dateOf = (v, name) => (isDate(v) ? v : fail(400, `${name} is not a valid date`))

export function moneyOf(v, name) {
  const n = typeof v === 'string' && v.trim() !== '' ? Number(v) : v
  if (typeof n !== 'number' || !Number.isFinite(n) || n < 0 || n > 10000000) fail(400, `${name} is not a valid amount`)
  return Math.round(n * 100) / 100
}

export function intOf(v, name, min, max) {
  const n = Number(v)
  if (!Number.isInteger(n) || n < min || n > max) fail(400, `${name} must be between ${min} and ${max}`)
  return n
}

export const idOf = (v) => (typeof v === 'string' && mongoose.isValidObjectId(v) ? v : fail(400, 'Invalid id'))

export function phoneOf(v) {
  const digits = str(String(v ?? ''), 30).replace(/[^\d]/g, '')
  if (digits && digits.length !== 10) fail(400, 'Phone number must be 10 digits')
  return digits
}
