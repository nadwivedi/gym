import { Account, accountRef, getSettings } from '../models/index.js'
import { tokenAccountId, verifyToken } from '../utils/auth.js'
import { prepareAccount, runPrepared } from '../utils/tenant.js'
import { fail } from '../utils/validate.js'

// Needs a valid login. Everything after it works only on that account's own gym:
// sets req.account and req.settings.
export async function requireLogin(req, res, next) {
  const token = (req.headers.authorization || '').replace(/^Bearer /, '')
  const id = tokenAccountId(token)
  const account = id && (await Account.findById(id))
  if (!account || !verifyToken(account.secret, token)) fail(401, 'Please log in')
  req.account = account
  const ref = accountRef(account)
  await prepareAccount(ref)
  runPrepared(ref, async () => {
    try {
      req.settings = await getSettings()
      next()
    } catch (err) {
      next(err)
    }
  })
}
