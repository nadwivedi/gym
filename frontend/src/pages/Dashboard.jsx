import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useLoad } from '../api.js'
import { ColumnChart, GroupedChart, ShareBars, TrendChart } from '../components/charts.jsx'
import { Icon, Loading } from '../components/ui.jsx'
import TopMenu from '../components/TopMenu.jsx'
import { useApp } from '../context.js'
import { MONTHS, MONTH_NAMES, fmtDate, money, moneyShort } from '../format.js'
import ExpenseSheet from '../sheets/ExpenseSheet.jsx'

const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`

const SERIES = [
  { label: 'Income', tone: 'income' },
  { label: 'Expenses', tone: 'expense' },
]

export default function Dashboard() {
  const { settings, today, modes } = useApp()
  const thisYear = Number(today.slice(0, 4))
  const thisMonth = Number(today.slice(5, 7))
  const [year, setYear] = useState(thisYear)
  // 0 = the whole year, 1-12 = one month.
  const [month, setMonth] = useState(thisMonth)
  const [adding, setAdding] = useState(false)
  const { data, error, loading, reload } = useLoad(`/stats?year=${year}`)
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
      <TopMenu />
    </header>
  )
  if (!stats) {
    return (
      <>
        {header}
        <div className="page dash">
          <Loading error={error} />
        </div>
      </>
    )
  }

  const pickYear = (y) => {
    setYear(y)
    // A past year opens on the whole year; this year opens on the current month.
    setMonth(y === thisYear ? thisMonth : 0)
  }
  const scope = month ? stats.months[month - 1] : stats.total
  const scopeName = month ? `${MONTH_NAMES[month - 1]} ${stats.year}` : `Full year ${stats.year}`
  const future = (m) => `${stats.year}-${String(m.month).padStart(2, '0')}-01` > stats.today
  const categoryRows = Object.entries(scope.byCategory)
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value)

  return (
    <>
      {header}
      <div className="page dash" style={{ opacity: loading && !data ? 0.6 : 1 }}>
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
          <Link to="/members" className="stat green">
            <span className="stat-icon">
              <Icon name="users" />
            </span>
            <div>
              <b>{stats.members.active}</b>
              <span>Active members</span>
              <span>of {stats.members.total} total</span>
            </div>
          </Link>
          <Link to="/payments" className="stat red">
            <span className="stat-icon">
              <Icon name="wallet" />
            </span>
            <div>
              <b>{moneyShort(stats.dues.total)}</b>
              <span>Pending dues</span>
              <span>{plural(stats.dues.count, 'member')}</span>
            </div>
          </Link>
        </div>

        <div className="card half dash-sum">
          <div className="chart-head">
            <h3>{scopeName}</h3>
            <p>{month ? 'Income, expenses and profit for the selected month.' : 'Income, expenses and profit for the whole year.'}</p>
          </div>
          <div className="tri">
            <div className="tri-box income">
              <span>Income</span>
              <b>{moneyShort(scope.net)}</b>
              <small>
                {plural(scope.count, 'payment')}
                {scope.shopSalesCount > 0 && ` · ${plural(scope.shopSalesCount, 'sale')}`}
              </small>
            </div>
            <Link to="/expenses" className="tri-box expense">
              <span>Expenses</span>
              <b>{moneyShort(scope.expense)}</b>
              <small>{plural(scope.expenseCount, 'expense')}</small>
            </Link>
            <div className="tri-box profit">
              <span>{scope.profit < 0 ? 'Loss' : 'Profit'}</span>
              <b>{moneyShort(scope.profit)}</b>
              <small>after expenses</small>
            </div>
          </div>
          {month > 0 && (
            <button className="year-strip" onClick={() => setMonth(0)}>
              <span>Full year {stats.year}</span>
              <b>
                {moneyShort(stats.total.net)} in · {moneyShort(stats.total.expense)} out · {moneyShort(stats.total.profit)} {stats.total.profit < 0 ? 'loss' : 'profit'}
              </b>
            </button>
          )}
          <div className="btn-grid" style={{ marginTop: 12 }}>
            <button className="btn small primary" onClick={() => setAdding(true)}>
              + Add expense
            </button>
            <Link className="btn small" to="/expenses">
              See expenses
            </Link>
          </div>
        </div>

        <div className="card half">
          <div className="chart-head">
            <h3>Income vs expenses</h3>
            <p>Each month of {stats.year}. Tap a month to see its details.</p>
          </div>
          <GroupedChart
            title={`Income and expenses by month in ${stats.year}`}
            series={SERIES}
            data={stats.months.map((m, i) => ({
              label: MONTHS[i],
              name: `${MONTH_NAMES[i]} ${stats.year}`,
              values: future(m) ? null : [m.net, m.expense],
              extra: [{ label: m.profit < 0 ? 'Loss' : 'Profit', value: m.profit }],
            }))}
            selected={month ? month - 1 : null}
            onSelect={(i) => setMonth(i + 1)}
            format={moneyShort}
            formatFull={money}
          />
        </div>

        <div className="card half">
          <div className="chart-head">
            <h3>Profit by month</h3>
            <p>Income minus expenses, {stats.year}. A bar below the line is a loss.</p>
          </div>
          <ColumnChart
            tone="profit"
            title={`Profit by month in ${stats.year}`}
            data={stats.months.map((m, i) => ({
              label: MONTHS[i],
              name: `${MONTH_NAMES[i]} ${stats.year}`,
              value: future(m) ? null : m.profit,
              note: m.profit < 0 ? 'loss' : 'profit',
            }))}
            selected={month ? month - 1 : null}
            onSelect={(i) => setMonth(i + 1)}
            format={moneyShort}
            formatFull={money}
          />
        </div>

        <div className="card half late">
          <div className="chart-head">
            <h3>Details · {scopeName}</h3>
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
              <span>Shop sales</span>
              <b className={scope.shopSales > 0 ? 'paid' : ''}>{money(scope.shopSales)}</b>
            </div>
          </div>
          <div className="kv">
            <span>Total income (memberships + shop)</span>
            <b>{money(scope.net)}</b>
          </div>
          {scope.shopBuys > 0 && (
            <div className="kv">
              <span>Stock bought (in expenses)</span>
              <span>{money(scope.shopBuys)}</span>
            </div>
          )}
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
            <p>Memberships and shop sales together.</p>
          </div>
          <ShareBars rows={modes.map((m) => ({ label: m, value: scope.byMode[m] || 0 }))} format={money} />
          <div className="chart-head sub">
            <h3>Expenses by category</h3>
          </div>
          {categoryRows.length ? <ShareBars tone="expense wide" rows={categoryRows} format={money} /> : <p className="hint">No expenses recorded for this period.</p>}
        </div>

        <div className="card half">
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

        <div className="card half late">
          <div className="chart-head">
            <h3>Month by month, {stats.year}</h3>
          </div>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Month</th>
                  <th className="hide-narrow">Active</th>
                  <th>Income</th>
                  <th>Expenses</th>
                  <th>Profit</th>
                </tr>
              </thead>
              <tbody>
                {stats.months.map((m, i) => (
                  <tr key={m.month} className={month === m.month ? 'on' : ''} onClick={() => setMonth(m.month)}>
                    <td>{MONTHS[i]}</td>
                    <td className="hide-narrow">{m.active ?? '—'}</td>
                    <td>{future(m) ? '—' : money(m.net)}</td>
                    <td>{future(m) ? '—' : money(m.expense)}</td>
                    <td className={m.profit < 0 ? 'loss' : ''}>{future(m) ? '—' : money(m.profit)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className={month ? '' : 'on'} onClick={() => setMonth(0)}>
                  <td>Year</td>
                  <td className="hide-narrow" />
                  <td>{money(stats.total.net)}</td>
                  <td>{money(stats.total.expense)}</td>
                  <td className={stats.total.profit < 0 ? 'loss' : ''}>{money(stats.total.profit)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
      {adding && (
        <ExpenseSheet
          expense={null}
          onClose={() => setAdding(false)}
          onDone={() => {
            setAdding(false)
            reload()
          }}
        />
      )}
    </>
  )
}
