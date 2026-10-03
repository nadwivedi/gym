import { useState } from 'react'
import { Link } from 'react-router-dom'
import { api, useAction, useLoad } from '../api.js'
import { ContactButtons, ErrorBox, Icon, Loading, MemberRow } from '../components/ui.jsx'
import TopMenu from '../components/TopMenu.jsx'
import { useApp } from '../context.js'
import { fmtDate, money } from '../format.js'
import { HideSheet } from '../sheets/MemberSheets.jsx'
import PaymentSheet from '../sheets/PaymentSheet.jsx'
import RenewSheet from '../sheets/RenewSheet.jsx'

const TABS = [
  { key: 'overdue', label: 'Overdue', empty: 'No one is overdue.' },
  { key: 'today', label: 'Due today', empty: 'No renewals due today.' },
  { key: 'week', label: 'Next 7 days', empty: 'No renewals in the next 7 days.' },
  { key: 'starting', label: 'Starting soon', empty: 'No memberships waiting to start.' },
  { key: 'hidden', label: 'Hidden', empty: 'No hidden members.' },
]

export default function Renewals() {
  const { settings, today } = useApp()
  const { data, error, reload } = useLoad('/dashboard')
  const [tab, setTab] = useState(null)
  const [sheet, setSheet] = useState(null) // { type, s }
  const unhide = useAction()

  if (!data) {
    return (
      <>
        <header className="topbar">
          <h1>Renewals</h1>
          <TopMenu />
        </header>
        <div className="page">
          <Loading error={error} />
        </div>
      </>
    )
  }

  const { buckets, stats } = data
  // Open on the first list that needs attention.
  const active = tab || ['overdue', 'today', 'week'].find((k) => buckets[k].length) || 'overdue'
  const rows = buckets[active]
  const done = () => {
    setSheet(null)
    reload()
  }
  const showAgain = async (s) => {
    if (await unhide.run(() => api(`/members/${s.id}/unhide`, { method: 'POST' }))) reload()
  }

  return (
    <>
      <header className="topbar">
        <h1>
          Renewals
          <span className="sub">{fmtDate(today)}</span>
        </h1>
        <TopMenu />
      </header>
      <div className="page">
        <div className="stat-grid">
          <Link to="/members" className="stat green">
            <span className="stat-icon">
              <Icon name="users" />
            </span>
            <div>
              <b>{stats.active}</b>
              <span>Active members</span>
            </div>
          </Link>
          <Link to="/payments" className="stat red">
            <span className="stat-icon">
              <Icon name="rupee" />
            </span>
            <div>
              <b>{money(stats.duesTotal)}</b>
              <span>
                Dues · {stats.duesCount} member{stats.duesCount === 1 ? '' : 's'}
              </span>
            </div>
          </Link>
        </div>

        <div className="tabs" role="tablist">
          {TABS.map((t) => (
            <button
              key={t.key}
              role="tab"
              aria-selected={active === t.key}
              className={`tab ${active === t.key ? 'active' : ''} ${t.key === 'overdue' && buckets.overdue.length ? 'alert' : ''}`}
              onClick={() => setTab(t.key)}
            >
              {t.label}
              <span className="count">{buckets[t.key].length}</span>
            </button>
          ))}
        </div>

        <ErrorBox error={unhide.error} />
        <div className="list">
          {rows.map((s) => {
            const likelyLeft = active === 'overdue' && -s.daysLeft >= settings.overdueDays
            const note =
              active === 'hidden'
                ? `Hidden ${fmtDate(s.hiddenAt)}${s.hiddenReason ? ` · ${s.hiddenReason}` : ''}`
                : likelyLeft
                  ? `Not renewed for ${-s.daysLeft} days. Likely not coming, you can hide them.`
                  : null
            return (
              <MemberRow key={s.id} s={s} note={note}>
                {active === 'hidden' ? (
                  <>
                    <button className="btn small primary" onClick={() => setSheet({ type: 'renew', s })}>
                      Rejoin
                    </button>
                    <button className="btn small" disabled={unhide.busy} onClick={() => showAgain(s)}>
                      Show again
                    </button>
                  </>
                ) : active === 'starting' ? (
                  s.balance > 0 && (
                    <button className="btn small primary" onClick={() => setSheet({ type: 'pay', s })}>
                      Record payment
                    </button>
                  )
                ) : (
                  <button className="btn small primary" onClick={() => setSheet({ type: 'renew', s })}>
                    Renew
                  </button>
                )}
                <ContactButtons s={s} />
                {(active === 'overdue' || active === 'today') && (
                  <button className={`btn small ${likelyLeft ? 'danger' : ''}`} onClick={() => setSheet({ type: 'hide', s })}>
                    Hide
                  </button>
                )}
              </MemberRow>
            )
          })}
          {!rows.length && <div className="empty">{TABS.find((t) => t.key === active).empty}</div>}
        </div>
      </div>

      {sheet?.type === 'renew' && <RenewSheet memberId={sheet.s.id} onClose={() => setSheet(null)} onDone={done} />}
      {sheet?.type === 'pay' && <PaymentSheet memberId={sheet.s.id} onClose={() => setSheet(null)} onDone={done} />}
      {sheet?.type === 'hide' && <HideSheet member={sheet.s} onClose={() => setSheet(null)} onDone={done} />}
    </>
  )
}
