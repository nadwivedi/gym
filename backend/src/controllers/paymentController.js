import { todayStr } from '../../../shared/domain.mjs'
import { Member, Payment, Period } from '../models/index.js'
import { getMember, getPeriod, memberDetail, moneyFor } from '../services/memberService.js'
import { logEntry, out, show } from '../utils/helpers.js'
import { dateOf, fail, idOf, modeOf, moneyOf, paidDateOf, str } from '../utils/validate.js'

async function getPayment(id) {
  const pay = (await Payment.findById(idOf(id))) || fail(404, 'Payment not found')
  if (pay.voided) fail(409, 'This entry is already cancelled')
  return pay
}

export async function listPayments(req, res) {
  const pays = await Payment.find().sort({ date: -1, createdAt: -1 }).limit(300).lean()
  const members = await Member.find({ _id: { $in: pays.map((p) => p.memberId) } }, { name: 1, memberNo: 1 }).lean()
  const names = new Map(members.map((m) => [String(m._id), m]))
  res.json(
    pays.map((p) => ({
      ...out(p),
      memberName: names.get(String(p.memberId))?.name || 'Deleted member',
      memberNo: names.get(String(p.memberId))?.memberNo,
    })),
  )
}

export async function createPayment(req, res) {
  const b = req.body || {}
  const period = await getPeriod(b.periodId)
  if (period.status !== 'ok') fail(409, 'This membership is closed, so it cannot take a payment')
  const amount = moneyOf(b.amount, 'Amount')
  if (amount <= 0) fail(400, 'Enter the amount')
  const date = paidDateOf(b.date, 'Payment date')
  const m = await moneyFor(period)
  if (amount > m.balance && !b.force) {
    fail(409, `This is more than the balance of ${m.balance}`, { code: 'OVERPAY', balance: m.balance })
  }
  // When the rest of the balance is promised for a later day.
  if (b.promisedDate !== undefined) {
    period.promisedDate = b.promisedDate ? dateOf(b.promisedDate, 'Promised date') : ''
    await period.save()
  }
  await Payment.create({
    memberId: period.memberId,
    periodId: period._id,
    type: 'payment',
    amount,
    date,
    mode: modeOf(b.mode),
    note: str(b.note, 300),
  })
  res.status(201).json(await memberDetail(period.memberId, todayStr()))
}

export async function updatePayment(req, res) {
  const pay = await getPayment(req.params.id)
  const b = req.body || {}
  const changes = []
  const set = (field, value, label) => {
    if (value === pay[field]) return
    changes.push(`${label}: ${show(pay[field])} → ${show(value)}`)
    pay[field] = value
  }
  if (b.amount !== undefined) {
    const amount = moneyOf(b.amount, 'Amount')
    if (amount <= 0) fail(400, 'Enter the amount')
    const period = await getPeriod(String(pay.periodId))
    const others = await moneyFor(period, pay._id)
    if (pay.type === 'refund' && amount > others.netPaid) fail(400, `Refund cannot be more than ${others.netPaid}`)
    if (pay.type === 'payment' && others.netPaid + amount < 0) {
      fail(400, 'A refund was already given against this payment, so it cannot be this small')
    }
    set('amount', amount, 'Amount')
  }
  if (b.date !== undefined) set('date', paidDateOf(b.date, 'Date'), 'Date')
  if (b.mode !== undefined) set('mode', modeOf(b.mode), 'Mode')
  if (b.note !== undefined) pay.note = str(b.note, 300)
  if (changes.length) pay.history.push(logEntry(changes.join('; ')))
  await pay.save()
  res.json(await memberDetail(pay.memberId, todayStr()))
}

// Payment was recorded against the wrong member (or the wrong membership).
export async function movePayment(req, res) {
  const pay = await getPayment(req.params.id)
  if (pay.type !== 'payment') fail(400, 'Only payments can be moved')
  const b = req.body || {}
  const target = await getMember(b.memberId)
  const source = await getPeriod(String(pay.periodId))
  if ((await moneyFor(source, pay._id)).netPaid < 0) {
    fail(409, 'A refund was given against this payment. Cancel the refund first.')
  }
  const periods = await Period.find({ memberId: target._id, status: 'ok' }).sort({ startDate: 1 }).lean()
  if (!periods.length) fail(409, `${target.name} has no membership to put this payment against`)
  let dest = b.periodId ? periods.find((p) => String(p._id) === String(b.periodId)) : null
  if (b.periodId && !dest) fail(400, 'Membership not found for that member')
  if (!dest) {
    for (const p of periods) {
      if ((await moneyFor(p)).balance > 0) {
        dest = p
        break
      }
    }
    dest ??= periods.at(-1)
  }
  if (String(dest._id) === String(pay.periodId)) fail(409, 'The payment is already recorded there')
  const from = await Member.findById(pay.memberId).lean()
  pay.history.push(logEntry(`Moved from ${from?.name || 'another member'} to ${target.name}`))
  pay.memberId = target._id
  pay.periodId = dest._id
  await pay.save()
  res.json({ ok: true, memberId: String(target._id) })
}

export async function voidPayment(req, res) {
  const pay = await getPayment(req.params.id)
  if (pay.type === 'payment') {
    const period = await getPeriod(String(pay.periodId))
    if ((await moneyFor(period, pay._id)).netPaid < 0) {
      fail(409, 'A refund was given against this payment. Cancel the refund first.')
    }
  }
  pay.voided = true
  pay.voidReason = str(req.body?.reason, 200)
  pay.history.push(logEntry(`Entry cancelled${pay.voidReason ? ` (${pay.voidReason})` : ''}`))
  await pay.save()
  res.json(await memberDetail(pay.memberId, todayStr()))
}
