import { useState } from 'react'
import { addMonths, overlaps, renewOptions } from '../../../shared/domain.mjs'
import { api, useAction, useLoad } from '../api.js'
import { DateInput, MoneyInput, PayNowFields, PlanPicker } from '../components/fields.jsx'
import { ErrorBox, Field, Group, Loading, Sheet } from '../components/ui.jsx'
import { useApp } from '../context.js'
import { fmtDate, payNowBody, promisedBody } from '../format.js'

export default function RenewSheet({ memberId, onClose, onDone }) {
  const { data, error } = useLoad(`/members/${memberId}`)
  const rejoin = data && (data.member.hidden || data.summary.status === 'none')
  return (
    <Sheet title={data ? `${rejoin ? 'Rejoin' : 'Renew'}: ${data.member.name}` : 'Renew'} onClose={onClose}>
      {data ? <RenewForm detail={data} rejoin={rejoin} onDone={onDone} /> : <Loading error={error} />}
    </Sheet>
  )
}

function RenewForm({ detail, rejoin, onDone }) {
  const { today, plans } = useApp()
  const { member, periods } = detail
  const lastPlanId = periods.find((p) => p.status !== 'cancelled')?.planId
  const firstPlan = plans.find((p) => p.active && p.id === lastPlanId) || plans.find((p) => p.active)

  const [plan, setPlan] = useState(firstPlan)
  const [fee, setFee] = useState(firstPlan ? String(firstPlan.price) : '')
  const [customDate, setCustomDate] = useState(today)
  const [pay, setPay] = useState({ amount: '', date: today, mode: 'Cash', promisedDate: '' })
  const months = plan?.months || 1
  const options = renewOptions(periods, months, today)
  const late = options.find((o) => o.key === 'continue')?.late
  // Early renewal continues the old dates; late renewal and rejoin default to a fresh start.
  const [choice, setChoice] = useState(rejoin || late || options[0].key === 'today' ? 'today' : 'continue')
  const { busy, error, run } = useAction()

  const picked = options.find((o) => o.key === choice)
  const startDate = choice === 'custom' ? customDate : picked.startDate
  const renewalDate = startDate ? addMonths(startDate, months) : ''
  const clash = startDate && overlaps(periods, startDate, renewalDate)
  const total = Number(fee) || 0

  const submit = async (e) => {
    e.preventDefault()
    const saved = await run(() =>
      api(`/members/${member.id}/periods`, {
        method: 'POST',
        body: { planId: plan.id, startDate, fee: total, promisedDate: promisedBody(pay, total), payment: payNowBody(pay) },
      }),
    )
    if (saved) onDone(saved)
  }

  const label = {
    continue: late ? 'Continue from old renewal date' : 'Start when current membership ends',
    today: 'Start from today',
  }

  return (
    <form className="form" onSubmit={submit}>
      <Group label="Plan">
        <PlanPicker
          value={plan?.id}
          onChange={(p) => {
            setPlan(p)
            setFee(String(p.price))
          }}
        />
      </Group>

      <Group label="New membership starts">
        {late && (
          <div className="box warn">
            Membership ended on {fmtDate(options[0].startDate)}, {options[0].gapDays} days ago. Choose which date to count from.
          </div>
        )}
        {options.map((o) => (
          <button type="button" key={o.key} className={`radio-card ${choice === o.key ? 'active' : ''}`} onClick={() => setChoice(o.key)}>
            <b>{label[o.key]}</b>
            <small>
              {fmtDate(o.startDate)} → next renewal {fmtDate(o.renewalDate)}
              {o.alreadyOver ? ' (already over!)' : ''}
            </small>
          </button>
        ))}
        <button type="button" className={`radio-card ${choice === 'custom' ? 'active' : ''}`} onClick={() => setChoice('custom')}>
          <b>Pick another date</b>
          <small>{choice === 'custom' && startDate ? `${fmtDate(startDate)} → next renewal ${fmtDate(renewalDate)}` : 'Start earlier or later'}</small>
        </button>
        {choice === 'custom' && <DateInput value={customDate} onChange={setCustomDate} required aria-label="Start date" />}
      </Group>

      {picked?.alreadyOver && (
        <div className="box warn">With this choice the new membership is already over today. The member will show as overdue again.</div>
      )}
      {clash && <div className="box error">These dates overlap a membership this member already has. Pick a later start date.</div>}

      <Field label="Fee for this period">
        <MoneyInput value={fee} onChange={setFee} required />
      </Field>
      <PayNowFields total={total} value={pay} onChange={setPay} />

      <ErrorBox error={error} />
      <button className="btn primary block" disabled={busy || !plan || !startDate || clash || Number(pay.amount) > total}>
        {busy ? 'Saving…' : `${rejoin ? 'Rejoin' : 'Renew'} until ${fmtDate(renewalDate)}`}
      </button>
    </form>
  )
}
