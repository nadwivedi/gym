import mongoose from 'mongoose'
import { PAYMENT_MODES, isDate, todayStr } from '../../../shared/domain.mjs'

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

export const modeOf = (v) => (PAYMENT_MODES.includes(v) ? v : 'Cash')

// Money cannot have been received on a day that has not come yet.
export function paidDateOf(v, name) {
  const date = dateOf(v, name)
  if (date > todayStr()) fail(400, `${name} cannot be in the future`)
  return date
}

export const passwordOf = (v) =>
  typeof v === 'string' && v.length >= 6 && v.length <= 100 ? v : fail(400, 'Password must be at least 6 characters')

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
export const emailOf = (v) => {
  const email = str(v, 254).toLowerCase()
  return EMAIL.test(email) ? email : fail(400, 'Enter a valid email address')
}

// "+91 98765 43210", "098765 43210" and "9876543210" are all the same login.
export function loginMobileOf(v) {
  let digits = String(v ?? '').replace(/[^\d]/g, '')
  if (digits.length === 12 && digits.startsWith('91')) digits = digits.slice(2)
  if (digits.length === 11 && digits.startsWith('0')) digits = digits.slice(1)
  return digits.length === 10 ? digits : fail(400, 'Enter a 10-digit mobile number')
}

// What was typed in the login box: an email, or the mobile number of a gym from the one-gym version.
export function loginNameOf(v) {
  const text = str(v, 254)
  if (!/^[\d\s+()-]+$/.test(text)) {
    const email = emailOf(text)
    return { key: email, query: { email } }
  }
  const mobile = loginMobileOf(text)
  return { key: mobile, query: { loginMobile: mobile } }
}
