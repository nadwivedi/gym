import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useLoad } from '../api.js'
import { Avatar, Badge, ContactButtons, Icon, Loading, MemberRow } from '../components/ui.jsx'
import { useApp } from '../context.js'
import { fmtDate, money } from '../format.js'
import PaymentSheet from '../sheets/PaymentSheet.jsx'

const TABS = [
  { key: 'dues', label: 'Pending dues' },
  { key: 'recent', label: 'Received' },
]

export default function Payments() {
  // The tab lives in the address (?tab=recent) so other screens can link straight to one.
  const [params, setParams] = useSearchParams()
  const tab = TABS.some((t) => t.key === params.get('tab')) ? params.get('tab') : 'dues'
  return (
    <>
      <header className="topbar">
        <h1>Payments</h1>
      </header>
      <div className="page">
        <div className="tabs" role="tablist">
          {TABS.map((t) => (
            <button key={t.key} role="tab" aria-selected={tab === t.key} className={`tab ${tab === t.key ? 'active' : ''}`} onClick={() => setParams({ tab: t.key }, { replace: true })}>
              {t.label}
            </button>
          ))}
        </div>
        {tab === 'dues' ? <Dues /> : <Recent />}
      </div>
    </>
  )
}

function promiseNote(s, today) {
  if (!s.promisedDate) return null
  return s.promisedDate < today ? `Promised date ${fmtDate(s.promisedDate)} has passed` : `Promised by ${fmtDate(s.promisedDate)}`
}

function Dues() {
  const { today } = useApp()
  const { data, error, reload } = useLoad('/members')
  const [payFor, setPayFor] = useState(null)
  if (!data) return <Loading error={error} />
  const rows = data.filter((s) => s.balance > 0).sort((a, b) => b.balance - a.balance)
  const total = rows.reduce((sum, s) => sum + s.balance, 0)
  return (
    <>
      <div className="stat red">
        <span className="stat-icon">
          <Icon name="rupee" />
        </span>
        <div>
          <b>{money(total)}</b>
          <span>
            to collect from {rows.length} member{rows.length === 1 ? '' : 's'}
          </span>
        </div>
      </div>
      <div className="list">
        {rows.map((s) => (
          <MemberRow key={s.id} s={s} note={promiseNote(s, today)}>
            <button className="btn small primary" onClick={() => setPayFor(s)}>
              Record payment
            </button>
            <ContactButtons s={s} />
          </MemberRow>
        ))}
        {!rows.length && <div className="empty">No pending dues.</div>}
      </div>
      {payFor && (
        <PaymentSheet
          memberId={payFor.id}
          onClose={() => setPayFor(null)}
          onDone={() => {
            setPayFor(null)
            reload()
          }}
        />
      )}
    </>
  )
}

function Recent() {
  const { data, error } = useLoad('/payments')
  if (!data) return <Loading error={error} />
  return (
    <div className="list">
      {data.map((p) => (
        <Link key={p.id} to={`/members/${p.memberId}`} className="card row">
          <Avatar name={p.memberName} off={p.voided} />
          <div className={`row-main ${p.voided ? 'struck' : ''}`}>
            <div className="row-title">{p.memberName}</div>
            <div className="row-sub">
              {fmtDate(p.date)} · {p.mode}
              {p.note ? ` · ${p.note}` : ''}
            </div>
          </div>
          <div className="row-side">
            <b className={p.voided ? 'struck' : ''}>
              {p.type === 'refund' ? '− ' : ''}
              {money(p.amount)}
            </b>
            {p.voided ? <Badge tone="danger">Cancelled</Badge> : p.type === 'refund' && <Badge tone="warn">Refund</Badge>}
          </div>
        </Link>
      ))}
      {!data.length && <div className="empty">No payments recorded yet.</div>}
    </div>
  )
}
