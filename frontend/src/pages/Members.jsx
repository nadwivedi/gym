import { useState } from 'react'
import { useLoad } from '../api.js'
import { Loading, MemberRow } from '../components/ui.jsx'
import TopMenu from '../components/TopMenu.jsx'
import { useApp } from '../context.js'

const FILTERS = [
  // All means everyone, hidden members too, so no name can go missing from the full list.
  { key: 'all', label: 'All', test: () => true },
  { key: 'active', label: 'Active', test: (s) => !s.hidden && s.status === 'active' },
  // counted: the button also shows how many members are in it, e.g. "Expired (3)".
  { key: 'expired', label: 'Expired', counted: true, test: (s) => !s.hidden && s.status === 'expired' },
  { key: 'dues', label: 'Dues pending', counted: true, test: (s) => s.balance > 0 },
  { key: 'hidden', label: 'Hidden', counted: true, test: (s) => s.hidden },
  { key: 'upcoming', label: 'Not started', test: (s) => !s.hidden && s.status === 'upcoming' },
]

export default function Members() {
  const { openAdd } = useApp()
  const { data, error } = useLoad('/members')
  const [q, setQ] = useState('')
  const [filter, setFilter] = useState('all')

  const text = q.trim().toLowerCase()
  const matches = (s) => s.name.toLowerCase().includes(text) || s.phone.includes(text) || String(s.memberNo) === text
  const test = FILTERS.find((f) => f.key === filter).test
  // A search looks through everyone, including hidden members.
  const rows = data ? data.filter((s) => (text ? matches(s) : test(s))) : []

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
      <div className="page">
        <div className="search-box">
          <input className="search" type="search" placeholder="Search name, phone or number" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        {!text && (
          <div className="chips">
            {FILTERS.map((f) => (
              <button key={f.key} className={`chip ${filter === f.key ? 'active' : ''}`} onClick={() => setFilter(f.key)}>
                {f.label}
                {f.counted && data ? ` (${data.filter(f.test).length})` : ''}
              </button>
            ))}
          </div>
        )}
        {!data ? (
          <Loading error={error} />
        ) : (
          <div className="list">
            {rows.map((s) => (
              <MemberRow key={s.id} s={s} />
            ))}
            {!rows.length && <div className="empty">{data.length ? 'No members match.' : 'No members yet. Tap + Add to admit your first member.'}</div>}
          </div>
        )}
      </div>
    </>
  )
}
