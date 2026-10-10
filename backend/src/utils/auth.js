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

// A login token: <account id>.<expiry>.<signature>, signed with that account's own secret.
export function makeToken(secret, accountId) {
  const body = `${accountId}.${Date.now() + TOKEN_DAYS * 86400000}`
  return `${body}.${sign(secret, body)}`
}

// The account a token claims to belong to (check it with verifyToken before trusting it).
export const tokenAccountId = (token) => (typeof token === 'string' && /^[a-f\d]{24}\.\d+\.[a-f\d]{64}$/.test(token) ? token.split('.')[0] : null)

export function verifyToken(secret, token) {
  if (!tokenAccountId(token)) return false
  const [id, exp, mac] = token.split('.')
  if (Number(exp) < Date.now()) return false
  const a = Buffer.from(mac)
  const b = Buffer.from(sign(secret, `${id}.${exp}`))
  return a.length === b.length && crypto.timingSafeEqual(a, b)
}

export const newSecret = () => crypto.randomBytes(32).toString('hex')
