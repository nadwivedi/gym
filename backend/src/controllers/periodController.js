import { addMonths, memberState, overlaps, todayStr } from '../../../shared/domain.mjs'
import { Member, Payment, Period, Plan } from '../models/index.js'
import { getPeriod, memberDetail, moneyFor } from '../services/memberService.js'
import { logEntry, show } from '../utils/helpers.js'
import { dateOf, fail, idOf, modeOf, moneyOf, paidDateOf, str } from '../utils/validate.js'

export async function updatePeriod(req, res) {
  const period = await getPeriod(req.params.id)
  if (period.status === 'cancelled') fail(409, 'This membership is cancelled')
  const b = req.body || {}
  const changes = []
  const set = (field, value, label) => {
    if (value === period[field]) return
    changes.push(`${label}: ${show(period[field])} → ${show(value)}`)
    period[field] = value
  }
  const before = { startDate: period.startDate, months: period.months }

  if (b.planId !== undefined && String(b.planId) !== String(period.planId || '')) {
    const plan = (await Plan.findById(idOf(b.planId)).lean()) || fail(400, 'Plan not found')
    set('planName', plan.name, 'Plan')
    period.planId = plan._id
    period.planPrice = plan.price
    period.months = plan.months
  }
  if (b.startDate !== undefined) set('startDate', dateOf(b.startDate, 'Start date'), 'Start date')
  if (b.renewalDate !== undefined) set('renewalDate', dateOf(b.renewalDate, 'Renewal date'), 'Renewal date')
  else if (period.startDate !== before.startDate || period.months !== before.months) {
    set('renewalDate', addMonths(period.startDate, period.months), 'Renewal date')
  }
  if (b.fee !== undefined) set('fee', moneyOf(b.fee, 'Fee'), 'Fee')
  if (b.admissionFee !== undefined) set('admissionFee', moneyOf(b.admissionFee, 'Admission fee'), 'Admission fee')
  if (b.promisedDate !== undefined) {
    set('promisedDate', b.promisedDate ? dateOf(b.promisedDate, 'Promised date') : '', 'Promised date')
  }
  if (b.note !== undefined) period.note = str(b.note, 500)

  if (period.renewalDate <= period.startDate) fail(400, 'Renewal date must be after the start date')
  const siblings = await Period.find({ memberId: period.memberId }).lean()
  if (overlaps(siblings, period.startDate, period.renewalDate, period._id)) {
    fail(409, 'These dates overlap another membership of this member', { code: 'OVERLAP' })
  }
  period.waived = Math.min(period.waived, period.fee + period.admissionFee)
  if (changes.length) {
    const reason = str(b.reason, 200)
    period.history.push(logEntry(changes.join('; ') + (reason ? ` (${reason})` : '')))
  }
  await period.save()
  res.json(await memberDetail(period.memberId, todayStr()))
}

// A membership entered by mistake: remove it completely, with every payment and refund recorded
// on it. This is the one place money records are really deleted, so the word "delete" must be sent.
export async function deletePeriod(req, res) {
  const period = await getPeriod(req.params.id)
  if (String(req.body?.confirm ?? '').trim().toLowerCase() !== 'delete') fail(400, 'Type delete to confirm')
  const removed = await Payment.deleteMany({ periodId: period._id })
  await period.deleteOne()
  res.json({ ...(await memberDetail(period.memberId, todayStr())), deletedPayments: removed.deletedCount })
}

export async function cancelPeriod(req, res) {
  const period = await getPeriod(req.params.id)
  if (period.status === 'cancelled') fail(409, 'This membership is already cancelled')
  const m = await moneyFor(period)
  if (m.netPaid > 0) fail(409, 'This membership has payments. Refund them, or move them to the right member, first.')
  period.status = 'cancelled'
  const reason = str(req.body?.reason, 200)
  period.history.push(logEntry(`Cancelled${reason ? ` (${reason})` : ''}`))
  await period.save()
  res.json(await memberDetail(period.memberId, todayStr()))
}

export async function refundPeriod(req, res) {
  const period = await getPeriod(req.params.id)
  if (period.status === 'cancelled') fail(409, 'This membership is cancelled')
  const b = req.body || {}
  const amount = moneyOf(b.amount, 'Refund amount')
  if (amount <= 0) fail(400, 'Enter the refund amount')
  const date = paidDateOf(b.date, 'Refund date')
  const m = await moneyFor(period)
  if (amount > m.netPaid) fail(400, `Only ${m.netPaid} has been received, so that is the most you can refund`)
  const today = todayStr()
  await Payment.create({
    memberId: period.memberId,
    periodId: period._id,
    type: 'refund',
    amount,
    date,
    mode: modeOf(b.mode),
    note: str(b.note, 300),
  })
  if (b.after === 'end') {
    // Not started yet: cancel it completely. Already running: it stops today.
    if (period.startDate >= today) period.status = 'cancelled'
    else {
      period.status = 'ended'
      if (period.renewalDate > today) period.renewalDate = today
    }
    period.history.push(logEntry(`Membership ended after refund of ${amount}`))
    await period.save()
    const rest = await Period.find({ memberId: period.memberId }).lean()
    const stillMember = ['active', 'upcoming'].includes(memberState({}, rest, today).status)
    if (!stillMember) {
      await Member.updateOne({ _id: period.memberId }, { hidden: true, hiddenReason: 'Refunded and left', hiddenAt: today })
    }
  }
  res.json(await memberDetail(period.memberId, today))
}

export async function waivePeriod(req, res) {
  const period = await getPeriod(req.params.id)
  if (period.status !== 'ok') fail(409, 'This membership is closed')
  const b = req.body || {}
  if (b.undo) {
    period.history.push(logEntry(`Waiver of ${period.waived} removed`))
    period.waived = 0
  } else {
    const m = await moneyFor(period)
    if (m.balance <= 0) fail(409, 'There is no balance to waive')
    const amount = b.amount == null || b.amount === '' ? m.balance : moneyOf(b.amount, 'Amount')
    if (amount <= 0 || amount > m.balance) fail(400, `Amount must be between 1 and ${m.balance}`)
    period.waived += amount
    const note = str(b.note, 200)
    period.history.push(logEntry(`Balance of ${amount} waived${note ? ` (${note})` : ''}`))
  }
  await period.save()
  res.json(await memberDetail(period.memberId, todayStr()))
}
