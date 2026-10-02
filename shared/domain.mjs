// Date and money rules shared by the backend and the frontend.
// All dates are plain 'YYYY-MM-DD' strings so time zones can never shift a day.

export const PAYMENT_MODES = ['Cash', 'UPI', 'Card', 'Bank']

const pad = (n) => String(n).padStart(2, '0')
const toUTC = (s) => {
  const [y, m, d] = s.split('-').map(Number)
  return Date.UTC(y, m - 1, d)
}
const fromUTC = (ms) => {
  const d = new Date(ms)
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`
}

export function isDate(s) {
  return typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s) && fromUTC(toUTC(s)) === s
}

export function todayStr(now = new Date()) {
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}

export function addDays(s, n) {
  return fromUTC(toUTC(s) + n * 86400000)
}

// Days from a to b (positive when b is later).
export function diffDays(a, b) {
  return Math.round((toUTC(b) - toUTC(a)) / 86400000)
}

// 31 Jan + 1 month = 28 Feb (clamped to the last day of the month).
export function addMonths(s, n) {
  const [y, m, d] = s.split('-').map(Number)
  const first = new Date(Date.UTC(y, m - 1 + n, 1))
  const lastDay = new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + 1, 0)).getUTCDate()
  return `${first.getUTCFullYear()}-${pad(first.getUTCMonth() + 1)}-${pad(Math.min(d, lastDay))}`
}

const round2 = (n) => Math.round(n * 100) / 100
const isLive = (p) => p.status !== 'cancelled'

// A period covers startDate up to (not including) renewalDate.
export function periodState(p, today) {
  if (p.status === 'cancelled') return 'cancelled'
  if (p.startDate > today) return 'upcoming'
  if (p.renewalDate > today) return 'active'
  return p.status === 'ended' ? 'ended' : 'expired'
}

// payments: the non-voided payments of this one period.
export function periodMoney(p, payments) {
  let paid = 0
  let refunded = 0
  for (const x of payments) {
    if (x.voided) continue
    if (x.type === 'refund') refunded += x.amount
    else paid += x.amount
  }
  const total = (p.fee || 0) + (p.admissionFee || 0)
  const waived = p.waived || 0
  const open = !p.status || p.status === 'ok'
  const netPaid = paid - refunded
  return {
    total: round2(total),
    paid: round2(paid),
    refunded: round2(refunded),
    netPaid: round2(netPaid),
    waived: round2(waived),
    // A refund never creates a new due; closed periods owe nothing.
    balance: open ? round2(Math.max(0, total - waived - paid)) : 0,
    extra: open ? round2(Math.max(0, netPaid - (total - waived))) : 0,
  }
}

export function memberState(member, periods, today) {
  const live = periods.filter(isLive)
  const hidden = !!member.hidden
  if (!live.length) {
    return { status: 'none', bucket: hidden ? 'hidden' : 'none', renewalDate: null, daysLeft: null, startsOn: null, current: null }
  }
  const renewalDate = live.reduce((max, p) => (p.renewalDate > max ? p.renewalDate : max), live[0].renewalDate)
  const current = live.find((p) => p.startDate <= today && p.renewalDate > today) || null
  const upcoming = live.filter((p) => p.startDate > today).sort((a, b) => (a.startDate < b.startDate ? -1 : 1))
  const status = current ? 'active' : upcoming.length ? 'upcoming' : 'expired'
  const daysLeft = diffDays(today, renewalDate)
  let bucket
  if (hidden) bucket = 'hidden'
  else if (status === 'upcoming') bucket = 'starting'
  else if (daysLeft < 0) bucket = 'overdue'
  else if (daysLeft === 0) bucket = 'today'
  else if (daysLeft <= 7) bucket = 'week'
  else bucket = 'later'
  return { status, bucket, renewalDate, daysLeft, startsOn: current ? null : upcoming[0]?.startDate || null, current }
}

// Start-date choices offered on the renew screen.
export function renewOptions(periods, months, today) {
  const live = periods.filter(isLive)
  const make = (key, startDate, extra = {}) => ({ key, startDate, renewalDate: addMonths(startDate, months), ...extra })
  if (!live.length) return [make('today', today)]
  const last = live.reduce((max, p) => (p.renewalDate > max ? p.renewalDate : max), live[0].renewalDate)
  if (last >= today) return [make('continue', last, { late: false })]
  const cont = make('continue', last, { late: true, gapDays: diffDays(last, today) })
  cont.alreadyOver = cont.renewalDate <= today
  return [cont, make('today', today)]
}

export function overlaps(periods, startDate, renewalDate, ignoreId) {
  return periods.some(
    (p) =>
      isLive(p) &&
      String(p._id ?? p.id) !== String(ignoreId) &&
      p.startDate < renewalDate &&
      startDate < p.renewalDate,
  )
}
