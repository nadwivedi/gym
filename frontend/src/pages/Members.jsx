import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useLoad } from '../api.js'
import { Icon, Loading, MemberRow } from '../components/ui.jsx'
import TopMenu from '../components/TopMenu.jsx'
import { useApp } from '../context.js'

const FILTERS = [
  // All means everyone, hidden members too, so no name can go missing from the full list.
  { key: 'all', label: 'All', test: () => true },
  { key: 'active', label: 'Active', test: (s) => !s.hidden && s.status === 'active' },
  // counted: the button also shows how many members are in it, e.g. "Expired (3)".
  { key: 'expired', label: 'Expired', counted: true, test: (s) => !s.hidden && s.status === 'expired' },
  { key: 'dues', label: 'Due Pending', counted: true, test: (s) => s.balance > 0 },
  { key: 'hidden', label: 'Hidden', test: (s) => s.hidden },
  { key: 'soon', label: 'Expiring soon', counted: true, test: (s) => !s.hidden && s.status === 'active' && s.daysLeft <= 7 },
  { key: 'upcoming', label: 'Not started', test: (s) => !s.hidden && s.status === 'upcoming' },
]

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

  const text = q.trim().toLowerCase()
  const matches = (s) => s.name.toLowerCase().includes(text) || s.phone.includes(text) || String(s.memberNo) === text
  const test = FILTERS.find((f) => f.key === filter).test
  // A search looks through everyone, including hidden members.
  const rows = data ? data.filter((s) => (text ? matches(s) : test(s))) : []
  const showAll = () => {
    setQ('')
    setFilter('all')
  }

  return (
    <>
      <header className="topbar">
        <h1>
          Members
          {data && (
            <span className="sub">
              {rows.length} member{rows.length === 1 ? '' : 's'} shown
            </span>
          )}
        </h1>
        <button className="btn small primary" onClick={openAdd}>
          + Add
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
              + Add
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
                    {f.counted ? ` (${data.filter(f.test).length})` : ''}
                  </button>
                ))}
              </div>
            )}

            {rows.length ? (
              <div className="list">
                {rows.map((s) => (
                  <MemberRow key={s.id} s={s} />
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
    </>
  )
}
