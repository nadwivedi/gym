import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  addDays,
  addMonths,
  diffDays,
  isDate,
  memberState,
  overlaps,
  periodMoney,
  periodState,
  renewOptions,
} from '../../shared/domain.mjs'

const period = (startDate, renewalDate, extra = {}) => ({ _id: `${startDate}`, startDate, renewalDate, status: 'ok', ...extra })

test('dates: validation and arithmetic', () => {
  assert.equal(isDate('2026-02-30'), false)
  assert.equal(isDate('2026-2-3'), false)
  assert.equal(isDate('2026-10-02'), true)
  assert.equal(addDays('2026-12-31', 1), '2027-01-01')
  assert.equal(diffDays('2026-10-02', '2026-10-17'), 15)
  assert.equal(addMonths('2026-10-05', 1), '2026-11-05')
  assert.equal(addMonths('2026-01-31', 1), '2026-02-28')
  assert.equal(addMonths('2028-01-31', 1), '2028-02-29')
  assert.equal(addMonths('2026-08-31', 6), '2027-02-28')
  assert.equal(addMonths('2026-10-05', 12), '2027-10-05')
})

test('period state: upcoming, active, expired on the renewal date itself', () => {
  const p = period('2026-10-05', '2026-11-05')
  assert.equal(periodState(p, '2026-10-04'), 'upcoming')
  assert.equal(periodState(p, '2026-10-05'), 'active')
  assert.equal(periodState(p, '2026-11-04'), 'active')
  assert.equal(periodState(p, '2026-11-05'), 'expired')
  assert.equal(periodState({ ...p, status: 'cancelled' }, '2026-10-10'), 'cancelled')
})

test('money: partial payments, waiver, refunds never create a due', () => {
  const p = { fee: 3000, admissionFee: 500, status: 'ok' }
  const pay = (amount, type = 'payment', voided = false) => ({ amount, type, voided })
  assert.equal(periodMoney(p, []).balance, 3500)
  assert.equal(periodMoney(p, [pay(1000), pay(500)]).balance, 2000)
  assert.equal(periodMoney(p, [pay(1000), pay(500, 'payment', true)]).balance, 2500)
  assert.equal(periodMoney({ ...p, waived: 2000 }, [pay(1500)]).balance, 0)
  const refunded = periodMoney(p, [pay(3500), pay(500, 'refund')])
  assert.deepEqual([refunded.balance, refunded.netPaid, refunded.extra], [0, 3000, 0])
  assert.equal(periodMoney({ ...p, status: 'cancelled' }, []).balance, 0)
  assert.equal(periodMoney({ ...p, fee: 1000 }, [pay(3500)]).extra, 2000)
})

test('member state and dashboard bucket', () => {
  const today = '2026-10-02'
  const state = (periods, member = {}) => memberState(member, periods, today)
  assert.equal(state([]).bucket, 'none')
  assert.equal(state([period('2026-09-01', '2026-10-01')]).bucket, 'overdue')
  assert.equal(state([period('2026-09-02', '2026-10-02')]).bucket, 'today')
  assert.equal(state([period('2026-09-05', '2026-10-05')]).bucket, 'week')
  assert.equal(state([period('2026-09-20', '2026-10-20')]).bucket, 'later')
  assert.equal(state([period('2026-10-10', '2026-11-10')]).bucket, 'starting')
  assert.equal(state([period('2026-09-01', '2026-10-01')], { hidden: true }).bucket, 'hidden')
  // Renewed in advance: the queued period pushes the renewal date out.
  const advance = state([period('2026-09-05', '2026-10-05'), period('2026-10-05', '2027-04-05')])
  assert.deepEqual([advance.status, advance.renewalDate, advance.bucket], ['active', '2027-04-05', 'later'])
  // Cancelled periods are ignored.
  assert.equal(state([period('2026-09-01', '2026-12-01', { status: 'cancelled' })]).status, 'none')
})

test('renew options: early, late, very late', () => {
  const today = '2026-10-02'
  assert.deepEqual(renewOptions([], 1, today), [{ key: 'today', startDate: today, renewalDate: '2026-11-02' }])

  const early = renewOptions([period('2026-09-10', '2026-10-10')], 3, today)
  assert.equal(early.length, 1)
  assert.deepEqual([early[0].key, early[0].startDate, early[0].renewalDate], ['continue', '2026-10-10', '2027-01-10'])

  const late = renewOptions([period('2026-08-20', '2026-09-20')], 1, today)
  assert.deepEqual(late.map((o) => o.key), ['continue', 'today'])
  assert.deepEqual([late[0].startDate, late[0].renewalDate, late[0].gapDays, late[0].alreadyOver], ['2026-09-20', '2026-10-20', 12, false])
  assert.equal(late[1].renewalDate, '2026-11-02')

  const veryLate = renewOptions([period('2026-05-01', '2026-06-01')], 1, today)
  assert.equal(veryLate[0].alreadyOver, true)
})

test('overlap detection', () => {
  const list = [period('2026-10-05', '2026-11-05')]
  assert.equal(overlaps(list, '2026-11-05', '2026-12-05'), false) // back to back
  assert.equal(overlaps(list, '2026-11-04', '2026-12-04'), true)
  assert.equal(overlaps(list, '2026-09-01', '2026-10-05'), false)
  assert.equal(overlaps(list, '2026-10-10', '2026-10-20'), true)
  assert.equal(overlaps(list, '2026-10-10', '2026-10-20', '2026-10-05'), false) // ignoring itself
  assert.equal(overlaps([{ ...list[0], status: 'cancelled' }], '2026-10-10', '2026-10-20'), false)
})
