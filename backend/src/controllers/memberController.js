import { memberAge, todayStr } from '../../../shared/domain.mjs'
import { Member, Payment, Period, nextMemberNo } from '../models/index.js'
import { buildPayment, buildPeriod, getMember, loadSummaries, memberDetail } from '../services/memberService.js'
import { dateOf, fail, idOf, intOf, phoneOf, str } from '../utils/validate.js'

async function checkDuplicatePhone(phone, force, exceptId) {
  if (!phone || force) return
  const dup = await Member.findOne({ phone, _id: { $ne: exceptId } }).lean()
  if (dup) fail(409, `${dup.name} already has this phone number`, { code: 'DUPLICATE', memberId: String(dup._id) })
}

// Optional personal details of a member: address, date of birth, age.
// `current` is the member being edited (absent for a new admission).
function personalFields(b, current) {
  const today = todayStr()
  const f = {}
  if (b.address !== undefined) f.address = str(b.address, 300)
  if (b.dob === undefined && b.age === undefined) return f
  const dob = b.dob ? dateOf(b.dob, 'Date of birth') : ''
  if (dob && (dob > today || dob < '1900-01-01')) fail(400, 'Date of birth is not valid')
  f.dob = dob
  if (dob || b.age === '' || b.age == null) {
    // With a date of birth the age is worked out, never stored.
    f.age = null
    f.ageOn = ''
  } else {
    const age = intOf(b.age, 'Age', 1, 120)
    // Saving the form again without touching the age must not restart its clock.
    if (!current || current.dob || memberAge(current, today) !== age) {
      f.age = age
      f.ageOn = today
    }
  }
  return f
}

export async function listMembers(req, res) {
  const rows = await loadSummaries(todayStr())
  res.json(rows.sort((a, b) => a.name.localeCompare(b.name)))
}

// A new admission: the member, their first membership and an optional first payment.
export async function createMember(req, res) {
  const b = req.body || {}
  const name = str(b.name, 80) || fail(400, 'Name is required')
  const phone = phoneOf(b.phone)
  await checkDuplicatePhone(phone, b.force)
  const periodData = await buildPeriod(b.membership, [], 'admission')
  const payData = buildPayment(b.payment, periodData.fee + periodData.admissionFee)
  const member = await Member.create({
    memberNo: await nextMemberNo(),
    name,
    phone,
    gender: str(b.gender, 20),
    notes: str(b.notes, 500),
    joinDate: b.joinDate ? dateOf(b.joinDate, 'Join date') : periodData.startDate,
    ...personalFields(b),
  })
  try {
    const period = await Period.create({ ...periodData, memberId: member._id })
    if (payData) await Payment.create({ ...payData, memberId: member._id, periodId: period._id })
  } catch (err) {
    // No transactions on a single MongoDB server, so undo by hand.
    await Promise.all([Period.deleteMany({ memberId: member._id }), Member.deleteOne({ _id: member._id })])
    throw err
  }
  res.status(201).json(await memberDetail(member._id, todayStr()))
}

export async function getMemberDetail(req, res) {
  res.json(await memberDetail(idOf(req.params.id), todayStr()))
}

export async function updateMember(req, res) {
  const member = await getMember(req.params.id)
  const b = req.body || {}
  if (b.name !== undefined) member.name = str(b.name, 80) || fail(400, 'Name is required')
  if (b.phone !== undefined) {
    const phone = phoneOf(b.phone)
    if (phone !== member.phone) await checkDuplicatePhone(phone, b.force, member._id)
    member.phone = phone
  }
  if (b.gender !== undefined) member.gender = str(b.gender, 20)
  if (b.notes !== undefined) member.notes = str(b.notes, 500)
  if (b.joinDate !== undefined) member.joinDate = dateOf(b.joinDate, 'Join date')
  member.set(personalFields(b, member))
  await member.save()
  res.json(await memberDetail(member._id, todayStr()))
}

export async function deleteMember(req, res) {
  const member = await getMember(req.params.id)
  if (await Payment.exists({ memberId: member._id, voided: { $ne: true } })) {
    fail(409, 'This member has payments, so they cannot be deleted. Hide them instead.')
  }
  await Promise.all([Payment.deleteMany({ memberId: member._id }), Period.deleteMany({ memberId: member._id })])
  await member.deleteOne()
  res.json({ ok: true })
}

export async function hideMember(req, res) {
  const member = await getMember(req.params.id)
  member.hidden = true
  member.hiddenReason = str(req.body?.reason, 200)
  member.hiddenAt = todayStr()
  await member.save()
  res.json(await memberDetail(member._id, todayStr()))
}

export async function unhideMember(req, res) {
  const member = await getMember(req.params.id)
  member.hidden = false
  await member.save()
  res.json(await memberDetail(member._id, todayStr()))
}

// Renew or rejoin: adds a new period and brings a hidden member back.
export async function renewMember(req, res) {
  const member = await getMember(req.params.id)
  const b = req.body || {}
  const existing = await Period.find({ memberId: member._id }).lean()
  const periodData = await buildPeriod(b, existing, member.hidden ? 'rejoin' : 'renewal')
  const payData = buildPayment(b.payment, periodData.fee + periodData.admissionFee)
  const period = await Period.create({ ...periodData, memberId: member._id })
  if (payData) await Payment.create({ ...payData, memberId: member._id, periodId: period._id })
  if (member.hidden) {
    member.hidden = false
    await member.save()
  }
  res.status(201).json(await memberDetail(member._id, todayStr()))
}
