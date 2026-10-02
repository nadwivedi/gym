import { useState } from 'react'
import { addMonths } from '../../../shared/domain.mjs'
import { useLoad } from '../api.js'
import { ShareBars } from '../components/charts.jsx'
import { Icon, Loading } from '../components/ui.jsx'
import { useApp } from '../context.js'
import { MONTHS, MONTH_NAMES, fmtDate, money } from '../format.js'
import ExpenseSheet from '../sheets/ExpenseSheet.jsx'

const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`

// Money the gym spends, one month at a time.
export default function Expenses() {
  const { today } = useApp()
  const thisMonth = today.slice(0, 7)
  const [month, setMonth] = useState(thisMonth)
  const { data, error, reload } = useLoad(`/expenses?month=${month}`)
  const [sheet, setSheet] = useState(null) // 'new' or an expense
  const step = (n) => setMonth(addMonths(`${month}-01`, n).slice(0, 7))
  const done = () => {
    setSheet(null)
    reload()
  }

  return (
    <>
      <header className="topbar">
        <h1>Expenses</h1>
      </header>
      <div className="page">
      <div className="filters">
        <div className="stepper wide" role="group" aria-label="Month">
          <button className="btn small" onClick={() => step(-1)} aria-label="Previous month">
            <Icon name="back" />
          </button>
          <b>
            {MONTHS[Number(month.slice(5)) - 1]} {month.slice(0, 4)}
          </b>
          <button className="btn small flip" disabled={month >= thisMonth} onClick={() => step(1)} aria-label="Next month">
            <Icon name="back" />
          </button>
        </div>
        <button className="btn small primary" onClick={() => setSheet('new')}>
          + Add expense
        </button>
      </div>

      {!data ? (
        <Loading error={error} />
      ) : (
        <>
          <div className="stat orange">
            <span className="stat-icon">
              <Icon name="receipt" />
            </span>
            <div>
              <b>{money(data.total)}</b>
              <span>
                spent in {MONTH_NAMES[Number(month.slice(5)) - 1]} · {plural(data.items.length, 'expense')}
              </span>
            </div>
          </div>

          {data.byCategory.length > 0 && (
            <div className="card">
              <div className="chart-head">
                <h3>By category</h3>
              </div>
              <ShareBars tone="expense wide" rows={data.byCategory.map((c) => ({ label: c.name, value: c.total }))} format={money} />
            </div>
          )}

          <div className="list">
            {data.items.map((e) => (
              <button key={e.id} className="card row" onClick={() => setSheet(e)} aria-label={`Edit ${e.category} expense of ${money(e.amount)}`}>
                <span className="avatar expense">
                  <Icon name="receipt" />
                </span>
                <div className="row-main">
                  <div className="row-title">{e.category}</div>
                  <div className="row-sub">
                    {fmtDate(e.date)} · {e.mode}
                    {e.note ? ` · ${e.note}` : ''}
                  </div>
                </div>
                <div className="row-side">
                  <b>{money(e.amount)}</b>
                  <span className="row-sub">Tap to fix</span>
                </div>
              </button>
            ))}
            {!data.items.length && <div className="empty">No expenses in this month. Tap + Add expense.</div>}
          </div>
        </>
      )}
      </div>
      {sheet && <ExpenseSheet expense={sheet === 'new' ? null : sheet} onClose={() => setSheet(null)} onDone={done} />}
    </>
  )
}
