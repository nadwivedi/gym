import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useLoad } from '../api.js'
import { Avatar, Badge, Icon, Loading, Sheet } from '../components/ui.jsx'
import TopMenu from '../components/TopMenu.jsx'
import { useApp } from '../context.js'
import { dueInfo, fmtDate, money, reminderText, telLink, waLink } from '../format.js'
import { DeleteMemberSheet, EditMemberSheet } from '../sheets/MemberSheets.jsx'
import PaymentSheet from '../sheets/PaymentSheet.jsx'

const FILTERS = [
  // All means everyone, hidden members too, so no name can go missing from the full list.
  { key: 'all', label: 'All', test: () => true },
  { key: 'active', label: 'Active', test: (s) => !s.hidden && s.status === 'active' },
  { key: 'expired', label: 'Expired', test: (s) => !s.hidden && s.status === 'expired' },
  { key: 'dues', label: 'Due Pending', test: (s) => s.balance > 0 },
  { key: 'hidden', label: 'Hidden', test: (s) => s.hidden },
  { key: 'soon', label: 'Expiring soon', test: (s) => !s.hidden && s.status === 'active' && s.daysLeft <= 7 },
  { key: 'upcoming', label: 'Not started', test: (s) => !s.hidden && s.status === 'upcoming' },
]

// Where a membership stands: the badge on a card, and the colour of the card's edge.
function memberStatus(s) {
  if (s.hidden) return { text: 'Hidden', tone: '' }
  if (s.status === 'none') return { text: 'No membership', tone: '' }
  if (s.status === 'upcoming') return { text: 'Not started', tone: 'info' }
  if (s.status === 'expired') return { text: 'Expired', tone: 'danger' }
  return s.daysLeft <= 7 ? { text: 'Expiring soon', tone: 'warn' } : { text: 'Active', tone: 'ok' }
}

export default function Members() {
  const { openAdd } = useApp()
  const { data, error, reload } = useLoad('/members')
  // A new admission lands back here (AddMemberSheet): the list on screen is from before it, so load it again.
  const added = useLocation().state?.added
  useEffect(() => {
    if (added) reload()
  }, [added, reload])
  const [q, setQ] = useState('')
  const [filter, setFilter] = useState('all')
  const [sheet, setSheet] = useState(null) // { type: 'edit' | 'pay' | 'delete', s }

  const text = q.trim().toLowerCase()
  const matches = (s) => s.name.toLowerCase().includes(text) || s.phone.includes(text) || String(s.memberNo) === text
  const test = FILTERS.find((f) => f.key === filter).test
  // A search looks through everyone, including hidden members.
  const rows = data ? data.filter((s) => (text ? matches(s) : test(s))) : []
  const showAll = () => {
    setQ('')
    setFilter('all')
  }
  const close = () => setSheet(null)
  const done = () => {
    close()
    reload()
  }

  return (
    <>
      <header className="topbar">
        <span className="head-icon">
          <Icon name="users" />
        </span>
        <h1>
          Members
          {data && (
            <span className="sub">
              {data.length} member{data.length === 1 ? '' : 's'}
              {rows.length !== data.length && ` · ${rows.length} shown`}
            </span>
          )}
        </h1>
        <button className="btn small primary mb-add" onClick={openAdd} aria-label="Add Member">
          <Icon name="plus" />
          Add<span>Member</span>
        </button>
        <TopMenu />
      </header>
      <div className="page mb">
        {!data ? (
          <Loading error={error} />
        ) : !data.length ? (
          <div className="card blank info">
            <span className="blank-icon">
              <Icon name="users" />
            </span>
            <h3>No members yet</h3>
            <p>Admit your first member to get started.</p>
            <button className="btn small primary" onClick={openAdd}>
              <Icon name="plus" />
              Add Member
            </button>
          </div>
        ) : (
          <>
            <div className="searchbar">
              <label className="searchbar-box">
                <Icon name="search" />
                <input className="search" type="search" placeholder="Search name, phone or member number" aria-label="Search members" value={q} onChange={(e) => setQ(e.target.value)} />
              </label>
            </div>
            {!text && (
              <div className="chips">
                {FILTERS.map((f) => (
                  <button key={f.key} className={`chip ${filter === f.key ? 'active' : ''}`} aria-pressed={filter === f.key} onClick={() => setFilter(f.key)}>
                    {f.label}
                    <span className="count">{data.filter(f.test).length}</span>
                  </button>
                ))}
              </div>
            )}

            {rows.length ? (
              <div className="list">
                {rows.map((s) => (
                  <MemberCard key={s.id} s={s} open={(type) => setSheet({ type, s })} />
                ))}
              </div>
            ) : (
              <div className="card blank plain">
                <span className="blank-icon">
                  <Icon name="search" />
                </span>
                <h3>No members match</h3>
                <p>Try another name or number, or a different filter.</p>
                <button className="btn small" onClick={showAll}>
                  Show all members
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {sheet?.type === 'edit' && <EditMember id={sheet.s.id} onClose={close} onDone={done} />}
      {sheet?.type === 'pay' && <PaymentSheet memberId={sheet.s.id} onClose={close} onDone={done} />}
      {sheet?.type === 'delete' && <DeleteMemberSheet member={sheet.s} onClose={close} onDeleted={done} />}
    </>
  )
}

// One member: who they are and where they stand, the three facts (laptop only), then the buttons.
function MemberCard({ s, open }) {
  const { settings } = useApp()
  const status = memberStatus(s)
  const profile = `/members/${s.id}`
  return (
    <div className={`card mcard ${status.tone ? `is-${status.tone}` : ''} ${s.hidden ? 'is-off' : ''}`}>
      <Link to={profile} className="mcard-head">
        <Avatar name={s.name} off={s.hidden} />
        <div className="row-main">
          <div className="row-title">{s.name}</div>
          <div className="row-sub">
            #{s.memberNo}
            {s.planName ? ` · ${s.planName}` : ''}
          </div>
          {s.renewalDate && <div className="row-sub only-narrow">Renewal {fmtDate(s.renewalDate)}</div>}
        </div>
        <div className="row-side">
          <Badge tone={status.tone}>{status.text}</Badge>
          {s.balance > 0 && <Badge tone="danger">Due {money(s.balance)}</Badge>}
        </div>
      </Link>
      <div className="rn-facts">
        <div>
          <span>Plan</span>
          <b>{s.planName || '—'}</b>
        </div>
        <div>
          <span>Renewal</span>
          <b>{fmtDate(s.renewalDate)}</b>
        </div>
        <div>
          <span>{s.hidden ? 'Status' : 'Time left'}</span>
          <b>{s.hidden ? 'Hidden' : dueInfo(s).text}</b>
        </div>
      </div>
      <div className="mcard-acts">
        <Link to={profile} className="btn small" title="View" aria-label={`View ${s.name}`}>
          <Icon name="eye" />
          <span>View</span>
        </Link>
        <button className="btn small" title="Edit" aria-label={`Edit ${s.name}`} onClick={() => open('edit')}>
          <Icon name="edit" />
          <span>Edit</span>
        </button>
        {s.balance > 0 && (
          <button className="btn small primary" onClick={() => open('pay')} aria-label={`Record payment for ${s.name}`}>
            <Icon name="rupee" />
            Payment
          </button>
        )}
        {s.phone && (
          <>
            <a className="btn small call ico push" href={telLink(s.phone)} title="Call" aria-label={`Call ${s.name}`}>
              <Icon name="phone" />
            </a>
            <a
              className="btn small wa ico"
              href={waLink(s.phone, settings.countryCode, reminderText(s, settings.gymName))}
              target="_blank"
              rel="noreferrer"
              title="WhatsApp"
              aria-label={`WhatsApp ${s.name}`}
            >
              <Icon name="chat" />
            </a>
          </>
        )}
        <button className={`btn small danger ico ${s.phone ? '' : 'push'}`} title="Delete" aria-label={`Delete ${s.name}`} onClick={() => open('delete')}>
          <Icon name="trash" />
        </button>
      </div>
    </div>
  )
}

// The list has only a summary of each member; the edit form needs the full record.
function EditMember({ id, onClose, onDone }) {
  const { data, error } = useLoad(`/members/${id}`)
  if (!data) {
    return (
      <Sheet title="Edit member" onClose={onClose}>
        <Loading error={error} />
      </Sheet>
    )
  }
  return <EditMemberSheet member={data.member} onClose={onClose} onDone={onDone} onDeleted={onDone} />
}
