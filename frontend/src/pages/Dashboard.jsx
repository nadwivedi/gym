import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useLoad } from '../api.js'
import { ColumnChart, ShareBars, TrendChart } from '../components/charts.jsx'
import { Icon, Loading } from '../components/ui.jsx'
import { useApp } from '../context.js'
import { MONTHS, MONTH_NAMES, fmtDate, money, moneyShort } from '../format.js'

const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`

export default function Dashboard() {
  const { settings, today, modes } = useApp()
  const thisYear = Number(today.slice(0, 4))
  const [year, setYear] = useState(thisYear)
  // 0 = the whole year, 1-12 = one month.
  const [month, setMonth] = useState(Number(today.slice(5, 7)))
  const { data, error, loading } = useLoad(`/stats?year=${year}`)
  // While another year loads, keep the last one on screen instead of flashing a spinner.
  const [shown, setShown] = useState(null)
  if (data && data !== shown) setShown(data)
  const stats = data || shown

  const header = (
    <header className="topbar">
      <h1>
        {settings.gymName}
        <span className="sub">Dashboard · {fmtDate(today)}</span>
      </h1>
      <Link to="/more" className="btn small" aria-label="Settings">
        <Icon name="settings" />
      </Link>
    </header>
  )
  if (!stats) {
    return (
      <>
        {header}
        <div className="page">
          <Loading error={error} />
        </div>
      </>
    )
  }

  const pickYear = (y) => {
    setYear(y)
    // A past year opens on the whole year; this year opens on the current month.
    setMonth(y === thisYear ? Number(today.slice(5, 7)) : 0)
  }
  const scope = month ? stats.months[month - 1] : stats.total
  // The month tile follows the selected month; on "Full year" it shows the latest month of that year.
  const tileMonth = stats.months[(month || (stats.year === thisYear ? Number(today.slice(5, 7)) : 12)) - 1]
  const scopeName = month ? `${MONTH_NAMES[month - 1]} ${stats.year}` : `Full year ${stats.year}`
  const future = (m) => `${stats.year}-${String(m.month).padStart(2, '0')}-01` > stats.today
  const modeRows = modes.map((m) => ({ label: m, value: scope.byMode[m] || 0 }))

  return (
    <>
      {header}
      <div className="page" style={{ opacity: loading && !data ? 0.6 : 1 }}>
        <div className="filters">
          <div className="stepper" role="group" aria-label="Year">
            <button className="btn small" disabled={year <= stats.firstYear} onClick={() => pickYear(year - 1)} aria-label="Previous year">
              <Icon name="back" />
            </button>
            <b>{year}</b>
            <button className="btn small flip" disabled={year >= stats.lastYear} onClick={() => pickYear(year + 1)} aria-label="Next year">
              <Icon name="back" />
            </button>
          </div>
          <select className="search" value={month} onChange={(e) => setMonth(Number(e.target.value))} aria-label="Month">
            <option value={0}>Full year</option>
            {MONTH_NAMES.map((name, i) => (
              <option key={name} value={i + 1}>
                {name}
              </option>
            ))}
          </select>
        </div>

        <div className="stat-grid">
          <Link to="/members" className="stat">
            <span className="stat-icon">
              <Icon name="users" />
            </span>
            <div>
              <b>{stats.members.active}</b>
              <span>Active members</span>
              <span>of {stats.members.total} total</span>
            </div>
          </Link>
          <Link to="/payments" className="stat orange">
            <span className="stat-icon">
              <Icon name="wallet" />
            </span>
            <div>
              <b>{moneyShort(stats.dues.total)}</b>
              <span>Pending dues</span>
              <span>{plural(stats.dues.count, 'member')}</span>
            </div>
          </Link>
          <button className={`stat green ${month ? 'on' : ''}`} onClick={() => setMonth(tileMonth.month)}>
            <span className="stat-icon">
              <Icon name="rupee" />
            </span>
            <div>
              <b>{moneyShort(tileMonth.net)}</b>
              <span>{MONTHS[tileMonth.month - 1]} collection</span>
              <span>{plural(tileMonth.count, 'payment')}</span>
            </div>
          </button>
          <button className={`stat purple ${month ? '' : 'on'}`} onClick={() => setMonth(0)}>
            <span className="stat-icon">
              <Icon name="chart" />
            </span>
            <div>
              <b>{moneyShort(stats.total.net)}</b>
              <span>{stats.year} collection</span>
              <span>{plural(stats.total.count, 'payment')}</span>
            </div>
          </button>
        </div>

        <div className="card">
          <div className="chart-head">
            <h3>Monthly collection</h3>
            <p>Money received minus refunds, {stats.year}. Tap a month to see its details.</p>
          </div>
          <ColumnChart
            title={`Monthly collection in ${stats.year}`}
            data={stats.months.map((m, i) => ({
              label: MONTHS[i],
              name: `${MONTH_NAMES[i]} ${stats.year}`,
              value: future(m) ? null : m.net,
              note: plural(m.count, 'payment'),
            }))}
            selected={month ? month - 1 : null}
            onSelect={(i) => setMonth(i + 1)}
            format={moneyShort}
            formatFull={money}
          />
        </div>

        <div className="card">
          <div className="chart-head">
            <h3>{scopeName}</h3>
            <p>{month ? 'Collection for the selected month.' : 'Collection for the whole year.'}</p>
          </div>
          <div className="money-grid first">
            <div>
              <span>Received</span>
              <b className="paid">{money(scope.collected)}</b>
            </div>
            <div>
              <span>Refunded</span>
              <b className={scope.refunded > 0 ? 'due' : ''}>{money(scope.refunded)}</b>
            </div>
            <div>
              <span>Net</span>
              <b>{money(scope.net)}</b>
            </div>
          </div>
          <div className="kv">
            <span>New admissions and rejoins</span>
            <span>{scope.admissions}</span>
          </div>
          <div className="kv">
            <span>Renewals</span>
            <span>{scope.renewals}</span>
          </div>
          <div className="chart-head sub">
            <h3>Received by payment mode</h3>
          </div>
          <ShareBars rows={modeRows} format={money} />
        </div>

        <div className="card">
          <div className="chart-head">
            <h3>Active members</h3>
            <p>Members with a running membership at the end of each month, {stats.year}.</p>
          </div>
          <TrendChart
            title={`Active members by month in ${stats.year}`}
            data={stats.months.map((m, i) => ({ label: MONTHS[i], name: `${MONTH_NAMES[i]} ${stats.year}`, value: m.active }))}
            format={(v) => String(v)}
            unit="active"
          />
        </div>

        <div className="card">
          <div className="chart-head">
            <h3>Month by month, {stats.year}</h3>
          </div>
          <table className="table">
            <thead>
              <tr>
                <th>Month</th>
                <th>Active</th>
                <th>Payments</th>
                <th>Collection</th>
              </tr>
            </thead>
            <tbody>
              {stats.months.map((m, i) => (
                <tr key={m.month} className={month === m.month ? 'on' : ''} onClick={() => setMonth(m.month)}>
                  <td>{MONTH_NAMES[i]}</td>
                  <td>{m.active ?? '—'}</td>
                  <td>{future(m) ? '—' : m.count}</td>
                  <td>{future(m) ? '—' : money(m.net)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className={month ? '' : 'on'} onClick={() => setMonth(0)}>
                <td>Full year</td>
                <td />
                <td>{stats.total.count}</td>
                <td>{money(stats.total.net)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </>
  )
}
