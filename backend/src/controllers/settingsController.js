import { PAYMENT_MODES, todayStr } from '../../../shared/domain.mjs'
import { Plan, publicSettings } from '../models/index.js'
import { loadCategories } from '../services/expenseService.js'
import { out } from '../utils/helpers.js'
import { fail, intOf, moneyOf, str } from '../utils/validate.js'

// Everything the app needs when it opens.
export async function bootstrap(req, res) {
  const [plans, expenseCategories] = await Promise.all([Plan.find().sort({ months: 1, name: 1 }).lean(), loadCategories()])
  res.json({
    today: todayStr(),
    settings: publicSettings(req.settings),
    account: { name: req.account.name, email: req.account.email || '', loginMobile: req.account.loginMobile || '' },
    plans: plans.map(out),
    expenseCategories: expenseCategories.map(out),
    modes: PAYMENT_MODES,
  })
}

export async function updateSettings(req, res) {
  const s = req.settings
  const b = req.body || {}
  if (b.gymName !== undefined) s.gymName = str(b.gymName, 60) || fail(400, 'Gym name is required')
  if (b.admissionFee !== undefined) s.admissionFee = moneyOf(b.admissionFee, 'Admission fee')
  if (b.overdueDays !== undefined) s.overdueDays = intOf(b.overdueDays, 'Days', 1, 365)
  if (b.countryCode !== undefined) {
    s.countryCode = /^\d{1,4}$/.test(String(b.countryCode)) ? String(b.countryCode) : fail(400, 'Country code is not valid')
  }
  await s.save()
  res.json(publicSettings(s))
}
