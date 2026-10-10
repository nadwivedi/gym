import { Plan } from '../models/index.js'
import { out } from '../utils/helpers.js'
import { fail, idOf, intOf, moneyOf, str } from '../utils/validate.js'

export async function createPlan(req, res) {
  const b = req.body || {}
  const plan = await Plan.create({
    name: str(b.name, 60) || fail(400, 'Plan name is required'),
    months: intOf(b.months, 'Months', 1, 60),
    price: moneyOf(b.price ?? 0, 'Price'),
  })
  res.status(201).json(out(plan))
}

export async function updatePlan(req, res) {
  const plan = (await Plan.findById(idOf(req.params.id))) || fail(404, 'Plan not found')
  const b = req.body || {}
  if (b.name !== undefined) plan.name = str(b.name, 60) || fail(400, 'Plan name is required')
  if (b.months !== undefined) plan.months = intOf(b.months, 'Months', 1, 60)
  if (b.price !== undefined) plan.price = moneyOf(b.price, 'Price')
  if (b.active !== undefined) plan.active = !!b.active
  await plan.save()
  res.json(out(plan))
}
