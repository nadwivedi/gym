// Demo gym members for screenshots and promotional videos: 20 sample members in every renewal state.
//
// Run from the backend folder:
//   npm run seed-demo -- owner@example.com            add the demo members to that gym account
//   npm run seed-demo -- owner@example.com --refresh  replace them with fresh ones (dates move to today)
//   npm run seed-demo -- owner@example.com --remove   delete the demo members again
// With only one account in the database, the email can be left out.
//
// Safe to run more than once: demo members are marked with DEMO_NOTE in their notes, a second run adds nothing,
// and --refresh / --remove touch only marked members (with their memberships and payments). Real members, plans
// and settings are never changed. The status of each member (active, due today, overdue …) is not stored: the app
// works it out from the dates, so the dates below are counted from the day the script runs.
//
// The phone numbers are made up but may belong to real people, so the script refuses to run while automatic
// WhatsApp reminders are on and a WhatsApp number is linked: overdue demo members would be messaged.
import '../config/env.js'
import mongoose from 'mongoose'
import { addDays, addMonths, todayStr } from '../../../shared/domain.mjs'
import { Account, Member, Payment, Period, Plan, WaAuthKey, accountRef, getSettings, nextMemberNo } from '../models/index.js'
import { loadSummaries } from '../services/memberService.js'
import { runAs } from '../utils/tenant.js'

const MONGO_URL = process.env.MONGO_URL || 'mongodb://127.0.0.1:27017/gymsoft'
const DEMO_NOTE = 'Demo member'
const ADMISSION_FEE = 500

// Fee for each plan length, in rupees.
const PRICES = { 1: 1200, 3: 3300, 6: 6000, 12: 10000 }

// [name, phone, gender, months, renewal date in days from today, paid, mode, extra]
// paid: 'full', or the amount paid so far (the rest stays as a pending balance).
// extra: earlier: months of an older membership before this one, so this one is a renewal.
//        admission: charge the admission fee. promise: days from today the balance is promised for.
//        hidden: [days ago, reason].
const MEMBERS = [
  // Active: valid, fully paid, more than a week left.
  ['Rahul Verma', '9876543210', 'Male', 3, 54, 'full', 'UPI', { earlier: 3 }],
  ['Priya Singh', '9823456781', 'Female', 6, 121, 'full', 'Card', { earlier: 6 }],
  ['Arjun Mehta', '9811122334', 'Male', 12, 268, 'full', 'UPI', { admission: true }],
  ['Sneha Kapoor', '9898765432', 'Female', 1, 22, 'full', 'Cash', { earlier: 1 }],

  // Renewal due: the membership ends today.
  ['Vikram Rathore', '9765432109', 'Male', 1, 0, 'full', 'Cash', { earlier: 1 }],
  ['Kavya Nair', '9845012345', 'Female', 3, 0, 'full', 'UPI', { admission: true }],
  ['Rohan Malhotra', '9930123456', 'Male', 1, 0, 'full', 'UPI', { earlier: 1 }],

  // Expiring soon: ends within the next 7 days.
  ['Ananya Iyer', '9790011223', 'Female', 1, 2, 'full', 'UPI', { earlier: 1 }],
  ['Karan Choudhary', '9812345670', 'Male', 3, 4, 'full', 'Cash', { admission: true }],
  ['Meera Joshi', '9822334455', 'Female', 1, 5, 'full', 'Card', { earlier: 1 }],
  ['Aditya Sharma', '9871234560', 'Male', 6, 6, 'full', 'UPI', { admission: true }],

  // Expired: ended and not renewed.
  ['Neha Patel', '9727001122', 'Female', 1, -3, 'full', 'Cash', { earlier: 1 }],
  ['Siddharth Rao', '9845567890', 'Male', 3, -9, 'full', 'UPI', { admission: true }],
  ['Pooja Deshmukh', '9890123987', 'Female', 1, -12, 'full', 'Cash', { admission: true }],

  // Due pending: active, part paid, the rest promised for a later day.
  ['Aman Gupta', '9958012345', 'Male', 3, 41, 2000, 'UPI', { promise: 5 }], // ₹3,300 fee: ₹1,300 due
  ['Ishita Bansal', '9810987654', 'Female', 6, 98, 3500, 'Card', { promise: 10 }], // ₹6,000 fee: ₹2,500 due
  ['Manish Yadav', '9935678123', 'Male', 1, 17, 700, 'Cash', { promise: 3, admission: true }], // ₹1,200 + ₹500: ₹1,000 due

  // Hidden: stopped coming; kept in the Hidden list, out of the renewal lists.
  ['Deepak Kumar', '9761234098', 'Male', 1, -48, 'full', 'Cash', { admission: true, hidden: [30, 'Moved to another city'] }],
  ['Ritu Saxena', '9899001234', 'Female', 3, -75, 'full', 'UPI', { admission: true, hidden: [55, 'Stopped coming'] }],
  ['Farhan Sheikh', '9820456789', 'Male', 1, -40, 'full', 'Cash', { admission: true, hidden: [22, 'Joined another gym'] }],
]

// One membership period with its payment, shaped like the ones the app's admission and renewal screens save.
async function addPeriod(member, plan, months, startDate, renewalDate, kind, admissionFee, paid, mode, promisedDate = '') {
  const fee = PRICES[months]
  const period = await Period.create({
    memberId: member._id,
    planId: plan?._id,
    planName: plan?.name || `${months} month`,
    months,
    startDate,
    renewalDate,
    planPrice: fee,
    fee,
    admissionFee,
    promisedDate,
    kind,
  })
  const amount = paid === 'full' ? fee + admissionFee : paid
  if (amount > 0) await Payment.create({ memberId: member._id, periodId: period._id, type: 'payment', amount, date: startDate, mode })
}

async function addDemoMembers() {
  const today = todayStr()
  // The gym's own plans are used by length when it has them; none are created or changed.
  const planFor = {}
  for (const p of await Plan.find({ active: { $ne: false } }).sort({ createdAt: 1 }).lean()) planFor[p.months] ??= p

  for (const [name, phone, gender, months, endsIn, paid, mode, extra] of MEMBERS) {
    const renewalDate = addDays(today, endsIn)
    const start = addMonths(renewalDate, -months)
    const earlierStart = extra.earlier ? addMonths(start, -extra.earlier) : null
    const member = await Member.create({ memberNo: await nextMemberNo(), name, phone, gender, joinDate: earlierStart || start, notes: DEMO_NOTE })

    if (earlierStart) await addPeriod(member, planFor[extra.earlier], extra.earlier, earlierStart, start, 'admission', ADMISSION_FEE, 'full', mode)
    const admissionFee = !earlierStart && extra.admission ? ADMISSION_FEE : 0
    const promise = extra.promise ? addDays(today, extra.promise) : ''
    await addPeriod(member, planFor[months], months, start, renewalDate, earlierStart ? 'renewal' : 'admission', admissionFee, paid, mode, promise)

    if (extra.hidden) {
      const [daysAgo, reason] = extra.hidden
      await Member.updateOne({ _id: member._id }, { hidden: true, hiddenReason: reason, hiddenAt: addDays(today, -daysAgo) })
    }
  }
}

// Deletes the marked demo members with their memberships and payments. Returns how many were removed.
async function removeDemoMembers() {
  const ids = (await Member.find({ notes: DEMO_NOTE }, { _id: 1 }).lean()).map((m) => m._id)
  await Promise.all([Payment.deleteMany({ memberId: { $in: ids } }), Period.deleteMany({ memberId: { $in: ids } })])
  await Member.deleteMany({ _id: { $in: ids } })
  // A gym left with no members starts numbering at 1 again, as before the demo.
  if (ids.length && !(await Member.exists({}))) await mongoose.connection.useDb(currentDb).collection('counters').deleteOne({ _id: 'member' })
  return ids.length
}

// The demo members by the category the app shows them in, as worked out by the app itself.
async function countByCategory() {
  const rows = (await loadSummaries(todayStr())).filter((s) => s.id && demoIds.has(s.id))
  const count = (fn) => rows.filter(fn).length
  return {
    'Active (fully paid)': count((s) => s.bucket === 'later' && s.balance === 0),
    'Renewal due (today)': count((s) => s.bucket === 'today'),
    'Expiring soon (next 7 days)': count((s) => s.bucket === 'week'),
    'Expired (overdue)': count((s) => s.bucket === 'overdue'),
    'Due pending (part paid)': count((s) => !s.hidden && s.balance > 0),
    Hidden: count((s) => s.bucket === 'hidden'),
  }
}

const args = process.argv.slice(2)
const email = (args.find((a) => !a.startsWith('--')) || '').trim().toLowerCase()
const refresh = args.includes('--refresh')
const remove = args.includes('--remove')
let currentDb = ''
let demoIds = new Set()

try {
  await mongoose.connect(MONGO_URL, { serverSelectionTimeoutMS: 5000 })
} catch (err) {
  // The address without its password.
  console.error(`Could not connect to MongoDB at ${MONGO_URL.replace(/\/\/([^:/@]+):[^/]*@/, '//$1:****@')}.\n${err.message}`)
  process.exit(1)
}

const accounts = await Account.find({}, { email: 1, loginMobile: 1, name: 1, dbName: 1, waSessionId: 1 })
const account = email ? accounts.find((a) => a.email === email) : accounts.length === 1 ? accounts[0] : null
if (!account) {
  console.error(email ? `No account found for "${email}".` : 'Name the gym account to add demo members to:  npm run seed-demo -- owner@example.com')
  console.error(`Accounts: ${accounts.map((a) => a.email || a.loginMobile).join(', ') || 'none'}`)
  await mongoose.disconnect()
  process.exit(1)
}
currentDb = account.dbName
const label = account.email || account.loginMobile

const message = await runAs(accountRef(account), async () => {
  const existing = await Member.countDocuments({ notes: DEMO_NOTE })
  if (remove) return `Removed ${await removeDemoMembers()} demo members from ${label}. No other data was changed.`
  if (existing && !refresh) return `${label} already has ${existing} demo members, so nothing was added. Use --refresh to replace them, or --remove to delete them.`

  const settings = await getSettings()
  if (settings.waEnabled && (await WaAuthKey.exists({ sessionId: account.waSessionId, key: 'creds' }))) {
    return `${label} has a linked WhatsApp number with automatic reminders on, so demo members could be messaged. Nothing was added.\nSwitch off automatic reminders in the app first, then run this again.`
  }

  if (existing) await removeDemoMembers()
  await addDemoMembers()
  demoIds = new Set((await Member.find({ notes: DEMO_NOTE }, { _id: 1 }).lean()).map((m) => String(m._id)))
  const lines = Object.entries(await countByCategory()).map(([name, n]) => `  ${name.padEnd(30)} ${n}`)
  return [`Added ${demoIds.size} demo members to ${label}:`, ...lines, `Remove them later with:  npm run seed-demo -- ${label} --remove`].join('\n')
})

console.log(message)
await mongoose.disconnect()
