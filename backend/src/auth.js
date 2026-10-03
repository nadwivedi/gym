import crypto from 'node:crypto'

const TOKEN_DAYS = 30

// Used for the login password, and for the old PIN while a gym moves off it.
export function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  return { salt, hash: crypto.scryptSync(password, salt, 32).toString('hex') }
}

export function checkPassword(password, salt, hash) {
  if (!salt || !hash) return false
  const a = Buffer.from(hashPassword(password, salt).hash, 'hex')
  const b = Buffer.from(hash, 'hex')
  return a.length === b.length && crypto.timingSafeEqual(a, b)
}

const sign = (secret, text) => crypto.createHmac('sha256', secret).update(text).digest('hex')

export function makeToken(secret) {
  const exp = String(Date.now() + TOKEN_DAYS * 86400000)
  return `${exp}.${sign(secret, exp)}`
}

export function verifyToken(secret, token) {
  if (typeof token !== 'string') return false
  const [exp, mac] = token.split('.')
  if (!exp || !mac || Number(exp) < Date.now()) return false
  const a = Buffer.from(mac)
  const b = Buffer.from(sign(secret, exp))
  return a.length === b.length && crypto.timingSafeEqual(a, b)
}

export const newSecret = () => crypto.randomBytes(32).toString('hex')
