import { useState } from 'react'
import { Link } from 'react-router-dom'
import { api, useAction, useLoad } from '../api.js'
import { Avatar, Badge, ContactButtons, ErrorBox, Icon, Loading } from '../components/ui.jsx'
import TopMenu from '../components/TopMenu.jsx'
import { useApp } from '../context.js'
import { dueInfo, fmtDate, money } from '../format.js'
import { HideSheet } from '../sheets/MemberSheets.jsx'
import PaymentSheet from '../sheets/PaymentSheet.jsx'
import RenewSheet from '../sheets/RenewSheet.jsx'

const TABS = [
  { key: 'overdue', label: 'Overdue', title: 'Overdue members', emptyTitle: 'All caught up!', empty: 'No one is overdue. Great job!' },
  { key: 'today', label: 'Due Today', title: 'Due today', emptyTitle: 'Nothing due today', empty: 'No renewals due today.' },
  { key: 'week', label: 'Next 7 Days', title: 'Due in the next 7 days', emptyTitle: 'Nothing this week', empty: 'No renewals in the next 7 days.' },
  { key: 'starting', label: 'Starting Soon', title: 'Starting soon', emptyTitle: 'Nothing waiting', empty: 'No memberships waiting to start.' },
  { key: 'hidden', label: 'Hidden', title: 'Hidden members', emptyTitle: 'No hidden members', empty: 'Members you hide are listed here.' },
]

// The Filter button: narrow every list by whether money is still pending.
const DUES = [
  { key: 'all', label: 'All', test: () => true },
  { key: 'dues', label: 'Dues pending', test: (s) => s.balance > 0 },
  { key: 'paid', label: 'No dues', test: (s) => !(s.balance > 0) },
]

function Head() {
  const { today } = useApp()
  return (
    <header className="topbar rn-head">
      <span className="head-icon">
        <Icon name="calendar" />
      </span>
      <h1>
        Renewals
        <span className="sub">
          <Icon name="calendar" />
          {fmtDate(today)}
        </span>
      </h1>
      <TopMenu icon="dots" />
    </header>
  )
}

export default function Renewals() {
  const { settings } = useApp()
  const { data, error, reload } = useLoad('/dashboard')
  const [tab, setTab] = useState(null)
  const [sheet, setSheet] = useState(null) // { type, s }
  const [q, setQ] = useState('')
  const [dues, setDues] = useState('all')
  const [filterOpen, setFilterOpen] = useState(false)
  const unhide = useAction()

  if (!data) {
    return (
      <>
        <Head />
        <div className="page rn">
          <Loading error={error} />
        </div>
      </>
    )
  }

  const { buckets, stats } = data
  // Open on the first list that needs attention.
  const active = tab || ['overdue', 'today', 'week'].find((k) => buckets[k].length) || 'overdue'
  const text = q.trim().toLowerCase()
  const duesTest = DUES.find((d) => d.key === dues).test
  const keep = (s) => duesTest(s) && (!text || s.name.toLowerCase().includes(text) || s.phone.includes(text) || String(s.memberNo) === text)
  // The search and the filter narrow every list, so the counts on the tabs show where the matches are.
  const shown = Object.fromEntries(TABS.map((t) => [t.key, buckets[t.key].filter(keep)]))
  const rows = shown[active]
  const current = TABS.find((t) => t.key === active)
  const narrowed = buckets[active].length > 0
  const done = () => {
    setSheet(null)
    reload()
  }
  const showAgain = async (s) => {
    if (await unhide.run(() => api(`/members/${s.id}/unhide`, { method: 'POST' }))) reload()
  }

  return (
    <>
      <Head />
      <div className="page rn">
        <div className="rn-stats">
          <Link to="/members" className="rn-stat">
            <span className="rn-stat-icon">
              <Icon name="users" />
            </span>
            <div>
              <b>{stats.active}</b>
              <span>Active Members</span>
            </div>
            <span className="flip">
              <Icon name="back" />
            </span>
          </Link>
          <Link to="/payments" className="rn-stat danger">
            <span className="rn-stat-icon">
              <Icon name="rupee" />
            </span>
            <div>
              <b>{money(stats.duesTotal)}</b>
              <span>
                Dues · {stats.duesCount} member{stats.duesCount === 1 ? '' : 's'}
              </span>
            </div>
            <span className="flip">
              <Icon name="back" />
            </span>
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
              <span className="count">{shown[t.key].length}</span>
            </button>
          ))}
        </div>

        <div className="searchbar">
          <label className="searchbar-box">
            <Icon name="search" />
            <input
              className="search"
              type="search"
              placeholder="Search member name or mobile..."
              aria-label="Search member name or mobile"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </label>
          <button className={`btn ${dues === 'all' ? '' : 'on'}`} aria-label="Filter" aria-expanded={filterOpen || dues !== 'all'} onClick={() => setFilterOpen((o) => !o)}>
            <Icon name="filter" />
            <span>Filter</span>
          </button>
        </div>
        {(filterOpen || dues !== 'all') && (
          <div className="chips wrap" role="group" aria-label="Filter by dues">
            {DUES.map((d) => (
              <button key={d.key} className={`chip ${dues === d.key ? 'active' : ''}`} aria-pressed={dues === d.key} onClick={() => setDues(d.key)}>
                {d.label}
              </button>
            ))}
          </div>
        )}

        <ErrorBox error={unhide.error} />
        {rows.length ? (
          <div className="card rn-list">
            <div className="list-head">
              <b>{current.title}</b>
              <span>
                {rows.length} member{rows.length === 1 ? '' : 's'}
              </span>
            </div>
            {rows.map((s) => {
              const likelyLeft = active === 'overdue' && -s.daysLeft >= settings.overdueDays
              const note =
                active === 'hidden'
                  ? `Hidden ${fmtDate(s.hiddenAt)}${s.hiddenReason ? ` · ${s.hiddenReason}` : ''}`
                  : likelyLeft
                    ? `Not renewed for ${-s.daysLeft} days. Likely not coming, you can hide them.`
                    : null
              return (
                <RenewalRow key={s.id} s={s} note={note}>
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
                </RenewalRow>
              )
            })}
          </div>
        ) : narrowed ? (
          <div className="card blank plain">
            <span className="blank-icon">
              <Icon name="search" />
            </span>
            <h3>No members match</h3>
            <p>Try another name or mobile number, or clear the filter.</p>
          </div>
        ) : (
          <div className="card blank">
            <span className="blank-icon">
              <Icon name="check" />
            </span>
            <h3>{current.emptyTitle}</h3>
            <p>{current.empty}</p>
          </div>
        )}
      </div>

      {sheet?.type === 'renew' && <RenewSheet memberId={sheet.s.id} onClose={() => setSheet(null)} onDone={done} />}
      {sheet?.type === 'pay' && <PaymentSheet memberId={sheet.s.id} onClose={() => setSheet(null)} onDone={done} />}
      {sheet?.type === 'hide' && <HideSheet member={sheet.s} onClose={() => setSheet(null)} onDone={done} />}
    </>
  )
}

// One member in a renewal list: who, plan, date, dues and status, then the actions.
function RenewalRow({ s, note, children }) {
  const due = dueInfo(s)
  const [dateLabel, date] = s.status === 'upcoming' ? ['Starts on', s.startsOn] : [s.daysLeft < 0 ? 'Expired on' : 'Renewal date', s.renewalDate]
  return (
    <div className="rn-row">
      <Link to={`/members/${s.id}`} className="rn-row-head">
        <Avatar name={s.name} off={s.hidden} />
        <div className="row-main">
          <div className="row-title">{s.name}</div>
          <div className="row-sub">
            #{s.memberNo}
            {s.phone ? ` · ${s.phone}` : ''}
          </div>
        </div>
        <Badge tone={s.hidden ? '' : due.tone}>{s.hidden ? 'Hidden' : due.text}</Badge>
      </Link>
      <div className="rn-facts">
        <div>
          <span>Plan</span>
          <b>{s.planName || '—'}</b>
        </div>
        <div>
          <span>{dateLabel}</span>
          <b>{fmtDate(date)}</b>
        </div>
        <div>
          <span>Amount due</span>
          <b className={s.balance > 0 ? 'due' : ''}>{s.balance > 0 ? money(s.balance) : 'No dues'}</b>
        </div>
      </div>
      <div className="member-body">
        {note && <div className="note">{note}</div>}
        <div className="row-actions">{children}</div>
      </div>
    </div>
  )
}
