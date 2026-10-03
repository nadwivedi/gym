export const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
export const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

// Short rupee amounts for chart axes: ₹950, ₹12.5K, ₹1.2L, ₹3Cr
export function moneyShort(n) {
  const abs = Math.abs(n)
  const [div, unit] = abs >= 1e7 ? [1e7, 'Cr'] : abs >= 1e5 ? [1e5, 'L'] : abs >= 1e3 ? [1e3, 'K'] : [1, '']
  return `${n < 0 ? '−' : ''}₹${Number((abs / div).toFixed(abs / div >= 100 ? 0 : 1))}${unit}`
}

export function fmtDate(s) {
  if (!s) return '—'
  const [y, m, d] = s.split('-').map(Number)
  return `${d} ${MONTHS[m - 1]} ${y}`
}

export const money = (n) => '₹' + Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })

const days = (n) => `${n} day${n === 1 ? '' : 's'}`

// Short status for a member summary: text plus badge colour.
export function dueInfo(s) {
  if (s.status === 'none') return { text: 'No membership', tone: '' }
  if (s.status === 'upcoming') return { text: `Starts ${fmtDate(s.startsOn)}`, tone: 'info' }
  if (s.daysLeft < 0) return { text: `${days(-s.daysLeft)} overdue`, tone: 'danger' }
  if (s.daysLeft === 0) return { text: 'Due today', tone: 'warn' }
  if (s.daysLeft <= 7) return { text: `${days(s.daysLeft)} left`, tone: 'warn' }
  return { text: `${days(s.daysLeft)} left`, tone: 'ok' }
}

// The "received now" form block -> the payment part of an admission / renewal request.
export const payNowBody = (pay) => (Number(pay.amount) > 0 ? { amount: Number(pay.amount), date: pay.date, mode: pay.mode } : undefined)

// The promised date only matters while part of the total is still unpaid.
export const promisedBody = (pay, total) => (total - (Number(pay.amount) || 0) > 0 ? pay.promisedDate : '')

// The optional personal details -> what the member API expects. Age is sent only without a date of birth.
export const personalBody = (p) => ({ address: p.address, dob: p.dob, age: p.dob ? '' : p.age })

// Login mobile box: digits only, at most 10. A pasted "+91 98765 43210" or "098765 43210" keeps the 10-digit number.
export function mobileDigits(v) {
  // Only the exact pasted forms lose their prefix, so an extra digit typed after a number starting with 91 is just ignored.
  let d = v.replace(/\D/g, '')
  if (d.length === 12 && d.startsWith('91')) d = d.slice(2)
  else if (d.length === 11 && d.startsWith('0')) d = d.slice(1)
  return d.slice(0, 10)
}

// Stock badge on a product: out of stock, running low, or how many are left.
export const stockBadge = (p) =>
  p.status === 'out' ? { tone: 'danger', text: 'Out of stock' } : p.status === 'low' ? { tone: 'warn', text: `Only ${p.stock} left` } : { tone: 'ok', text: `${p.stock} in stock` }

// "Sold 2 × Whey Protein", "Bought 10 × Creatine", "T-shirt (L): -1 piece"
export function moveTitle(m) {
  if (m.type === 'adjust') return `${m.product}: ${m.qty > 0 ? '+' : ''}${m.qty} ${Math.abs(m.qty) === 1 ? 'piece' : 'pieces'}`
  return `${m.type === 'sell' ? 'Sold' : 'Bought'} ${m.qty} × ${m.product}`
}

export const telLink = (phone) => `tel:${phone}`

export function waLink(phone, countryCode, text) {
  const full = phone.length === 10 ? countryCode + phone : phone
  return `https://wa.me/${full}?text=${encodeURIComponent(text)}`
}

export function reminderText(s, gymName) {
  if (s.balance > 0 && (s.daysLeft == null || s.daysLeft > 7)) {
    return `Hi ${s.name}, a balance of ${money(s.balance)} is pending for your membership at ${gymName}.`
  }
  if (s.daysLeft < 0) return `Hi ${s.name}, your membership at ${gymName} expired on ${fmtDate(s.renewalDate)}. Please renew to continue.`
  return `Hi ${s.name}, your membership at ${gymName} is due for renewal on ${fmtDate(s.renewalDate)}.`
}
