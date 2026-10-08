import { useState } from 'react'
import { addMonths } from '../../../shared/domain.mjs'
import { useLoad } from '../api.js'
import { ShareBars } from '../components/charts.jsx'
import { Badge, Icon, Loading } from '../components/ui.jsx'
import TopMenu from '../components/TopMenu.jsx'
import { useApp } from '../context.js'
import { MONTHS, MONTH_NAMES, fmtDate, money, moneyShort } from '../format.js'
import ExpenseSheet from '../sheets/ExpenseSheet.jsx'

const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`

// The picture beside an expense, from a word in its category's name. Categories are the owner's own, so many fall to the last one.
const CATEGORY_ICONS = [
  [/electric|power|light|bijli/i, 'bolt'],
  [/rent|lease|building/i, 'building'],
  [/salary|staff|trainer|wage/i, 'users'],
  [/repair|mainten|service/i, 'tool'],
  [/equip|machine|weight/i, 'dumbbell'],
  [/stock|supplement|product/i, 'box'],
  [/phone|mobile|internet|recharge/i, 'phone'],
  [/^/, 'receipt'],
]
const categoryIcon = (name) => CATEGORY_ICONS.find(([word]) => word.test(name))[1]

// Money the gym spends, one month at a time.
export default function Expenses() {
  const { today, modes, expenseCategories } = useApp()
  const thisMonth = today.slice(0, 7)
  const [month, setMonth] = useState(thisMonth)
  const { data, error, reload } = useLoad(`/expenses?month=${month}`)
  const [sheet, setSheet] = useState(null) // 'new' or an expense
  const step = (n) => setMonth(addMonths(`${month}-01`, n).slice(0, 7))
  const done = () => {
    setSheet(null)
    reload()
  }
  const monthName = MONTH_NAMES[Number(month.slice(5)) - 1]
  // Each category keeps one of four colours, by its place in the owner's list.
  const tone = (e) => `t${Math.max(expenseCategories.findIndex((c) => c.id === e.categoryId), 0) % 4}`

  return (
    <>
      <header className="topbar">
        <h1>
          Expenses
          <span className="sub">Track gym spending</span>
        </h1>
        <button className="btn small primary ex-add" onClick={() => setSheet('new')} aria-label="Add Expense">
          <Icon name="plus" />
          Add<span>Expense</span>
        </button>
        <TopMenu />
      </header>
      <div className="page ex">
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
        </div>

        {!data ? (
          <Loading error={error} />
        ) : (
          <>
            <div className="tiles">
              <div className="stat purple">
                <span className="stat-icon">
                  <Icon name="wallet" />
                </span>
                <div>
                  <b>{moneyShort(data.summary.allTime)}</b>
                  <span>Total Expenses</span>
                  <span>all time</span>
                </div>
              </div>
              <div className="stat orange">
                <span className="stat-icon">
                  <Icon name="calendar" />
                </span>
                <div>
                  <b>{moneyShort(data.total)}</b>
                  <span>{month === thisMonth ? 'This Month' : `${monthName} ${month.slice(0, 4)}`}</span>
                  <span>{plural(data.items.length, 'expense')}</span>
                </div>
              </div>
              <div className="stat">
                <span className="stat-icon">
                  <Icon name="receipt" />
                </span>
                <div>
                  <b>{moneyShort(data.summary.today)}</b>
                  <span>Today</span>
                  <span>{fmtDate(today)}</span>
                </div>
              </div>
              <div className="stat red">
                <span className="stat-icon">
                  <Icon name="alert" />
                </span>
                <div>
                  <b>{moneyShort(data.summary.pendingTotal)}</b>
                  <span>Pending</span>
                  <span>{plural(data.summary.pendingCount, 'unpaid bill')}</span>
                </div>
              </div>
            </div>

            {data.items.length ? (
              <>
                <div className="ex-over">
                  <div className="card">
                    <div className="chart-head">
                      <h3>By category</h3>
                      <p>Where the money went in {monthName}.</p>
                    </div>
                    <ShareBars tone="expense wide" rows={data.byCategory.map((c) => ({ label: c.name, value: c.total }))} format={money} />
                  </div>
                  <div className="card ex-modes">
                    <div className="chart-head">
                      <h3>By payment method</h3>
                      <p>How it was paid in {monthName}.</p>
                    </div>
                    <ShareBars
                      tone="expense"
                      rows={modes.map((m) => ({ label: m, value: data.items.reduce((sum, e) => sum + (e.mode === m ? e.amount : 0), 0) }))}
                      format={money}
                    />
                  </div>
                </div>

                <div className="card ex-list">
                  <div className="list-head">
                    <b>
                      {monthName} {month.slice(0, 4)}
                    </b>
                    <span>
                      {plural(data.items.length, 'expense')} · {money(data.total)}
                    </span>
                  </div>
                  <div className="ex-cols" aria-hidden="true">
                    <span />
                    <span>Expense</span>
                    <span>Category</span>
                    <span>Date</span>
                    <span>Method</span>
                    <span>Status</span>
                    <span>Amount</span>
                    <span />
                  </div>
                  {data.items.map((e) => (
                    <button key={e.id} className="ex-row" onClick={() => setSheet(e)} aria-label={`Edit ${e.name || e.category} expense of ${money(e.amount)}`}>
                      <span className={`ex-ic ${tone(e)}`}>
                        <Icon name={expenseCategories.find((c) => c.id === e.categoryId)?.icon || categoryIcon(e.category)} />
                      </span>
                      <span className="ex-name">
                        <b>{e.name || e.category}</b>
                        <small>
                          {[e.paidAmount < e.amount && `${money(e.amount - e.paidAmount)} pending`, e.paidTo, e.invoiceNo && `#${e.invoiceNo}`, e.note, e.receiptName && 'Receipt attached']
                            .filter(Boolean)
                            .join(' · ')}
                        </small>
                      </span>
                      <span className="ex-meta">
                        <span>
                          <Badge>{e.category}</Badge>
                        </span>
                        <span>{fmtDate(e.date)}</span>
                        <span className="ex-mode">{e.mode}</span>
                      </span>
                      <span className="ex-status">{e.status === 'pending' ? <Badge tone="warn">Pending</Badge> : <Badge tone="ok">Paid</Badge>}</span>
                      <b className="ex-amt">{money(e.amount)}</b>
                      <span className="ex-act btn small">
                        <Icon name="edit" />
                        Edit
                      </span>
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <div className="card blank info">
                <span className="blank-icon">
                  <Icon name="receipt" />
                </span>
                <h3>No expenses in {monthName}</h3>
                <p>Add rent, electricity, salaries or anything else the gym paid for.</p>
                <button className="btn small primary" onClick={() => setSheet('new')}>
                  <Icon name="plus" />
                  Add Expense
                </button>
              </div>
            )}
          </>
        )}
      </div>
      {sheet && <ExpenseSheet expense={sheet === 'new' ? null : sheet} onClose={() => setSheet(null)} onDone={done} />}
    </>
  )
}
