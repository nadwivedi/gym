import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { memberAge } from '../../../shared/domain.mjs'
import { api, useAction, useLoad } from '../api.js'
import { Avatar, Badge, ContactButtons, ErrorBox, Icon, Loading } from '../components/ui.jsx'
import { useApp } from '../context.js'
import { dueInfo, fmtDate, money } from '../format.js'
import { EditMemberSheet, HideSheet } from '../sheets/MemberSheets.jsx'
import PaymentEditSheet from '../sheets/PaymentEditSheet.jsx'
import PaymentSheet from '../sheets/PaymentSheet.jsx'
import { EditPeriodSheet, RefundSheet, WaiveSheet } from '../sheets/PeriodSheets.jsx'
import RenewSheet from '../sheets/RenewSheet.jsx'

const STATE = {
  active: { text: 'Running', tone: 'ok' },
  upcoming: { text: 'Not started', tone: 'info' },
  expired: { text: 'Finished', tone: '' },
  ended: { text: 'Ended early', tone: 'warn' },
  cancelled: { text: 'Cancelled', tone: 'danger' },
}

export default function MemberProfile() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data, error, reload } = useLoad(`/members/${id}`)
  const [sheet, setSheet] = useState(null) // { type, period?, payment? }
  const action = useAction()
  const { today } = useApp()

  const back = (
    <button className="btn small" onClick={() => navigate(-1)} aria-label="Back">
      <Icon name="back" />
    </button>
  )
  if (!data) {
    return (
      <>
        <header className="topbar">{back}</header>
        <div className="page">
          <Loading error={error} />
        </div>
      </>
    )
  }

  const { member, summary: s, periods, payments } = data
  const due = dueInfo(s)
  const age = memberAge(member, today)
  const noMembership = s.status === 'none'
  const close = () => setSheet(null)
  const done = () => {
    close()
    reload()
  }
  const post = async (path, body) => {
    if (await action.run(() => api(path, { method: 'POST', body }))) reload()
  }
  const cancelPeriod = (p) => {
    const reason = window.prompt('Cancel this membership? Use this for a wrong entry.\n\nReason (optional):', '')
    if (reason !== null) post(`/periods/${p.id}/cancel`, { reason })
  }

  return (
    <>
      <header className="topbar">
        {back}
        <h1>{member.name}</h1>
        <button className="btn small" onClick={() => setSheet({ type: 'editMember' })}>
          Edit
        </button>
      </header>

      <div className="page">
        <div className="card hero">
          <div className="hero-head">
            <Avatar name={member.name} big off={member.hidden} />
            <div className="row-main">
              <div className="row-title">Member #{member.memberNo}</div>
              {member.phone && <div className="row-sub">{member.phone}</div>}
              <div className="row-sub">Joined {fmtDate(member.joinDate)}</div>
            </div>
            <div className="row-side">
              <Badge tone={due.tone}>{due.text}</Badge>
              {member.hidden && <Badge>Hidden</Badge>}
            </div>
          </div>
          <div className="hero-body">
          {!noMembership && (
            <div className="kv">
              <span>Next renewal date</span>
              <span>{fmtDate(s.renewalDate)}</span>
            </div>
          )}
          <div className="kv">
            <span>Balance due</span>
            <span>{money(s.balance)}</span>
          </div>
          {s.promisedDate && (
            <div className="kv">
              <span>Balance promised by</span>
              <span>{fmtDate(s.promisedDate)}</span>
            </div>
          )}
          {member.hidden && (
            <div className="box warn">
              Hidden from renewals on {fmtDate(member.hiddenAt)}
              {member.hiddenReason ? `: ${member.hiddenReason}` : ''}
            </div>
          )}
          {member.dob && (
            <div className="kv">
              <span>Date of birth</span>
              <span>{fmtDate(member.dob)}</span>
            </div>
          )}
          {age != null && (
            <div className="kv">
              <span>Age</span>
              <span>{age} years</span>
            </div>
          )}
          {member.address && (
            <div className="kv">
              <span>Address</span>
              <span className="multiline">{member.address}</span>
            </div>
          )}
          {member.notes && <p className="row-sub">{member.notes}</p>}
          <div className="row-actions">
            <button className="btn small primary" onClick={() => setSheet({ type: 'renew' })}>
              {member.hidden || noMembership ? 'Rejoin' : 'Renew'}
            </button>
            {periods.some((p) => p.status === 'ok') && (
              <button className="btn small" onClick={() => setSheet({ type: 'pay' })}>
                Record payment
              </button>
            )}
            <ContactButtons s={s} />
            {member.hidden ? (
              <button className="btn small" disabled={action.busy} onClick={() => post(`/members/${member.id}/unhide`)}>
                Show again
              </button>
            ) : (
              <button className="btn small" onClick={() => setSheet({ type: 'hide' })}>
                Hide
              </button>
            )}
          </div>
          </div>
        </div>
        <ErrorBox error={action.error} />

        <div className="section-title">Memberships</div>
        <div className="list">
          {periods.map((p) => (
            <div className="card" key={p.id}>
              <div className="row">
                <div className="row-main">
                  <div className={`row-title ${p.status === 'cancelled' ? 'struck' : ''}`}>{p.planName}</div>
                  <div className="row-sub">
                    {fmtDate(p.startDate)} → {fmtDate(p.renewalDate)}
                  </div>
                </div>
                <div className="row-side">
                  <Badge tone={STATE[p.state].tone}>{STATE[p.state].text}</Badge>
                  {p.balance > 0 && <Badge tone="danger">Due {money(p.balance)}</Badge>}
                </div>
              </div>
              <div className="money-grid">
                <div>
                  <span>Total fee</span>
                  <b>{money(p.total)}</b>
                </div>
                <div>
                  <span>Paid</span>
                  <b className="paid">{money(p.paid)}</b>
                </div>
                <div>
                  <span>Balance</span>
                  <b className={p.balance > 0 ? 'due' : ''}>{money(p.balance)}</b>
                </div>
              </div>
              {p.admissionFee > 0 && (
                <div className="kv">
                  <span>Includes admission fee</span>
                  <span>{money(p.admissionFee)}</span>
                </div>
              )}
              {p.refunded > 0 && (
                <div className="kv">
                  <span>Refunded</span>
                  <span>− {money(p.refunded)}</span>
                </div>
              )}
              {p.waived > 0 && (
                <div className="kv">
                  <span>Waived</span>
                  <span>
                    {money(p.waived)}{' '}
                    {p.status === 'ok' && (
                      <button className="link" disabled={action.busy} onClick={() => post(`/periods/${p.id}/waive`, { undo: true })}>
                        Undo
                      </button>
                    )}
                  </span>
                </div>
              )}
              {p.extra > 0 && <div className="box warn">Paid {money(p.extra)} more than the fee. Refund it or correct the fee.</div>}
              {p.promisedDate && p.balance > 0 && (
                <div className="kv">
                  <span>Balance promised by</span>
                  <span>{fmtDate(p.promisedDate)}</span>
                </div>
              )}
              {p.status !== 'cancelled' && (
                <div className="row-actions">
                  <button className="btn small" onClick={() => setSheet({ type: 'editPeriod', period: p })}>
                    Change dates / fee
                  </button>
                  {p.netPaid > 0 && (
                    <button className="btn small" onClick={() => setSheet({ type: 'refund', period: p })}>
                      Refund
                    </button>
                  )}
                  {p.balance > 0 && (
                    <button className="btn small" onClick={() => setSheet({ type: 'waive', period: p })}>
                      Waive balance
                    </button>
                  )}
                  {p.netPaid <= 0 && (
                    <button className="btn small danger" disabled={action.busy} onClick={() => cancelPeriod(p)}>
                      Cancel
                    </button>
                  )}
                </div>
              )}
              {p.history?.length > 0 && (
                <details className="log">
                  <summary>Changes ({p.history.length})</summary>
                  <ul>
                    {p.history.map((h, i) => (
                      <li key={i}>
                        {fmtDate(h.at.slice(0, 10))}: {h.text}
                      </li>
                    ))}
                  </ul>
                </details>
              )}
            </div>
          ))}
          {!periods.length && <div className="empty">No memberships.</div>}
        </div>

        <div className="section-title">Payments</div>
        <div className="list">
          {payments.map((pay) => (
            <button key={pay.id} className="card row" style={{ textAlign: 'left', cursor: 'pointer' }} onClick={() => setSheet({ type: 'editPayment', payment: pay })}>
              <div className={`row-main ${pay.voided ? 'struck' : ''}`}>
                <div className="row-title">
                  {pay.type === 'refund' ? '− ' : ''}
                  {money(pay.amount)}
                </div>
                <div className="row-sub">
                  {fmtDate(pay.date)} · {pay.mode}
                  {pay.note ? ` · ${pay.note}` : ''}
                </div>
              </div>
              <div className="row-side">
                {pay.voided ? <Badge tone="danger">Cancelled</Badge> : pay.type === 'refund' ? <Badge tone="warn">Refund</Badge> : <Badge tone="ok">Paid</Badge>}
                <span className="row-sub">Tap to fix</span>
              </div>
            </button>
          ))}
          {!payments.length && <div className="empty">No payments recorded yet.</div>}
        </div>
      </div>

      {sheet?.type === 'renew' && <RenewSheet memberId={member.id} onClose={close} onDone={done} />}
      {sheet?.type === 'pay' && <PaymentSheet memberId={member.id} onClose={close} onDone={done} />}
      {sheet?.type === 'hide' && <HideSheet member={member} onClose={close} onDone={done} />}
      {sheet?.type === 'editMember' && (
        <EditMemberSheet member={member} onClose={close} onDone={done} onDeleted={() => navigate('/members', { replace: true })} />
      )}
      {sheet?.type === 'editPeriod' && <EditPeriodSheet period={sheet.period} onClose={close} onDone={done} />}
      {sheet?.type === 'refund' && <RefundSheet period={sheet.period} onClose={close} onDone={done} />}
      {sheet?.type === 'waive' && <WaiveSheet period={sheet.period} onClose={close} onDone={done} />}
      {sheet?.type === 'editPayment' && <PaymentEditSheet payment={sheet.payment} onClose={close} onDone={done} />}
    </>
  )
}
