import { memberState, periodMoney, periodState } from '../../shared/domain.mjs'
import { Member, Payment, Period, out } from './db.js'
import { fail } from './validate.js'

function groupBy(list, key) {
  const map = new Map()
  for (const item of list) {
    const k = String(item[key])
    if (!map.has(k)) map.set(k, [])
    map.get(k).push(item)
  }
  return map
}

// One line per member: what the lists and the renewal dashboard show.
function summarize(member, periods, paysByPeriod, today) {
  const st = memberState(member, periods, today)
  let balance = 0
  let promisedDate = ''
  for (const p of periods) {
    const m = periodMoney(p, paysByPeriod.get(String(p._id)) || [])
    balance += m.balance
    if (m.balance > 0 && p.promisedDate && (!promisedDate || p.promisedDate < promisedDate)) promisedDate = p.promisedDate
  }
  const live = periods.filter((p) => p.status !== 'cancelled')
  const ref = st.current || live.reduce((best, p) => (!best || p.renewalDate > best.renewalDate ? p : best), null)
  return {
    id: String(member._id),
    memberNo: member.memberNo,
    name: member.name,
    phone: member.phone,
    joinDate: member.joinDate,
    hidden: !!member.hidden,
    hiddenReason: member.hiddenReason || '',
    hiddenAt: member.hiddenAt || '',
    status: st.status,
    bucket: st.bucket,
    renewalDate: st.renewalDate,
    daysLeft: st.daysLeft,
    startsOn: st.startsOn,
    planName: ref?.planName || '',
    balance: Math.round(balance * 100) / 100,
    promisedDate,
  }
}

export async function loadSummaries(today) {
  const [members, periods, payments] = await Promise.all([
    Member.find().lean(),
    Period.find().lean(),
    Payment.find({ voided: { $ne: true } }).lean(),
  ])
  const periodsByMember = groupBy(periods, 'memberId')
  const paysByPeriod = groupBy(payments, 'periodId')
  return members.map((m) => summarize(m, periodsByMember.get(String(m._id)) || [], paysByPeriod, today))
}

export async function memberDetail(id, today) {
  const member = await Member.findById(id).lean()
  if (!member) fail(404, 'Member not found')
  const [periods, payments] = await Promise.all([
    Period.find({ memberId: id }).sort({ startDate: 1 }).lean(),
    Payment.find({ memberId: id }).sort({ date: -1, createdAt: -1 }).lean(),
  ])
  const paysByPeriod = groupBy(
    payments.filter((p) => !p.voided),
    'periodId',
  )
  return {
    member: out(member),
    summary: summarize(member, periods, paysByPeriod, today),
    periods: periods
      .map((p) => ({ ...out(p), state: periodState(p, today), ...periodMoney(p, paysByPeriod.get(String(p._id)) || []) }))
      .reverse(),
    payments: payments.map(out),
  }
}

export async function moneyFor(period, excludePaymentId) {
  const pays = await Payment.find({ periodId: period._id, voided: { $ne: true } }).lean()
  return periodMoney(
    period,
    pays.filter((p) => String(p._id) !== String(excludePaymentId)),
  )
}
