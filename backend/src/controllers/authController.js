import { Account, accountRef, getSettings } from '../models/index.js'
import { createAccount, seedDefaults } from '../services/accountService.js'
import { checkPassword, hashPassword, makeToken, newSecret } from '../utils/auth.js'
import { runAs } from '../utils/tenant.js'
import { emailOf, fail, loginMobileOf, loginNameOf, passwordOf, str } from '../utils/validate.js'

const MAX_LOGIN_FAILS = 5
const LOCK_MS = 60000

// Wrong passwords lock that one login (email or mobile number) for a minute after a few tries.
const tries = new Map() // login name -> { fails, lockedUntil }
const checkNotLocked = (name) => Date.now() < (tries.get(name)?.lockedUntil || 0) && fail(429, 'Too many wrong tries. Wait one minute and try again.')
function wrongTry(name, message) {
  const t = tries.get(name) || { fails: 0, lockedUntil: 0 }
  if (++t.fails >= MAX_LOGIN_FAILS) Object.assign(t, { fails: 0, lockedUntil: Date.now() + LOCK_MS })
  tries.set(name, t)
  fail(401, message)
}

export const status = (req, res) => res.json({ ok: true })

// A new gym owner: their own account and their own, empty gym.
export async function signup(req, res) {
  const b = req.body || {}
  const name = str(b.name, 60) || fail(400, 'Your name is required')
  const gymName = str(b.gymName, 60) || fail(400, 'Gym name is required')
  const loginMobile = loginMobileOf(b.mobile)
  const email = emailOf(b.email)
  const { salt, hash } = hashPassword(passwordOf(b.password))
  const taken = (field) => fail(409, `An account with this ${field} already exists. Please log in.`)
  if (await Account.exists({ loginMobile })) taken('mobile number')
  if (await Account.exists({ email })) taken('email')
  const account = await createAccount({ name, email, loginMobile, passHash: hash, passSalt: salt }).catch((err) =>
    err?.code === 11000 ? taken(err.keyPattern?.loginMobile ? 'mobile number' : 'email') : Promise.reject(err),
  )
  await runAs(accountRef(account), async () => {
    await seedDefaults()
    const s = await getSettings()
    s.gymName = gymName
    await s.save()
  })
  res.status(201).json({ token: makeToken(account.secret, account._id) })
}

// Log in with email or mobile number + password.
export async function login(req, res) {
  const name = loginNameOf(req.body?.email ?? req.body?.mobile)
  checkNotLocked(name.key)
  const account = await Account.findOne(name.query)
  if (!account || !checkPassword(String(req.body?.password ?? ''), account.passSalt, account.passHash)) {
    wrongTry(name.key, 'Wrong mobile number, email or password')
  }
  tries.delete(name.key)
  res.json({ token: makeToken(account.secret, account._id) })
}

// Change the login email and/or password. Signs every other device out.
export async function changeLogin(req, res) {
  const a = req.account
  if (!checkPassword(String(req.body?.currentPassword ?? ''), a.passSalt, a.passHash)) fail(400, 'Current password is wrong')
  const email = emailOf(req.body?.email)
  if (email !== a.email && (await Account.exists({ email, _id: { $ne: a._id } }))) fail(409, 'Another account already uses this email')
  a.email = email
  if (req.body?.newPassword) {
    const { salt, hash } = hashPassword(passwordOf(req.body.newPassword))
    a.passSalt = salt
    a.passHash = hash
  }
  a.secret = newSecret()
  await a.save()
  res.json({ token: makeToken(a.secret, a._id), email: a.email })
}
