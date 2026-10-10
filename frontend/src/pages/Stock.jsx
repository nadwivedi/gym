import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { addMonths } from '../../../shared/domain.mjs'
import { useLoad } from '../api.js'
import { Badge, Icon, Loading } from '../components/ui.jsx'
import TopMenu from '../components/TopMenu.jsx'
import { useApp } from '../context.js'
import { MONTHS, MONTH_NAMES, fmtDate, money, moveTitle } from '../format.js'
import { MoveDetailSheet, MoveSheet, ProductSheet } from '../sheets/StockSheets.jsx'

const TABS = [
  { key: 'items', label: 'Products' },
  { key: 'history', label: 'Sales and buys' },
]

// A product's state: the server's stock level, or "off" when it is not sold any more.
const statusOf = (p) => (p.active ? p.status : 'off')
const STATUS = {
  ok: { label: 'In Stock', tone: 'ok', icon: 'check', card: 'green' },
  low: { label: 'Low Stock', tone: 'warn', icon: 'alert', card: 'orange' },
  out: { label: 'Out of Stock', tone: 'danger', icon: 'close', card: 'red' },
  off: { label: 'Switched off', tone: '' },
}

// Things the gym sells: protein, creatine, mass gainer, T-shirts, lowers…
export default function Stock() {
  const [params, setParams] = useSearchParams()
  const tab = params.get('tab') === 'history' ? 'history' : 'items'
  const stock = useLoad('/stock')
  const [historyKey, setHistoryKey] = useState(0)
  // { kind: 'product' } (new) | { kind: 'buy' | 'sell', product } | { kind: 'move', move }
  const [sheet, setSheet] = useState(null)
  const done = () => {
    setSheet(null)
    stock.reload()
    setHistoryKey((k) => k + 1)
  }

  return (
    <>
      <header className="topbar">
        <span className="head-icon">
          <Icon name="box" />
        </span>
        <h1>
          Stock
          <span className="sub">Protein, creatine, clothes and more</span>
        </h1>
        <TopMenu />
      </header>
      <div className="page st">
        <div className="st-bar">
          <div className="st-actions">
            <button className="btn small" onClick={() => setSheet({ kind: 'sell' })}>
              <Icon name="rupee" />
              Sell
            </button>
            <button className="btn small" onClick={() => setSheet({ kind: 'buy' })}>
              <Icon name="box" />
              Buy stock
            </button>
            <button className="btn small primary" onClick={() => setSheet({ kind: 'product' })}>
              <Icon name="plus" />
              Add Item
            </button>
          </div>
          <div className="tabs" role="tablist">
            {TABS.map((t) => (
              <button key={t.key} role="tab" aria-selected={tab === t.key} className={`tab ${tab === t.key ? 'active' : ''}`} onClick={() => setParams({ tab: t.key }, { replace: true })}>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {tab === 'items' ? <Products stock={stock} onOpen={setSheet} /> : <History key={historyKey} onOpen={(move) => setSheet({ kind: 'move', move })} />}
      </div>

      {sheet?.kind === 'product' && <ProductSheet product={null} categories={stock.data?.categories || []} onClose={() => setSheet(null)} onDone={done} />}
      {(sheet?.kind === 'buy' || sheet?.kind === 'sell') && (
        <MoveSheet type={sheet.kind} product={sheet.product} products={stock.data?.products || []} onClose={() => setSheet(null)} onDone={done} />
      )}
      {sheet?.kind === 'move' && <MoveDetailSheet move={sheet.move} onClose={() => setSheet(null)} onDone={done} />}
    </>
  )
}

function Products({ stock, onOpen }) {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')
  const [status, setStatus] = useState('all')
  if (!stock.data) return <Loading error={stock.error} />
  const { products, totals } = stock.data

  if (!products.length) {
    return (
      <div className="card blank info">
        <span className="blank-icon">
          <Icon name="box" />
        </span>
        <h3>No items yet</h3>
        <p>Add protein, creatine, T-shirts or anything else you sell.</p>
        <button className="btn small primary" onClick={() => onOpen({ kind: 'product' })}>
          <Icon name="plus" />
          Add Item
        </button>
      </div>
    )
  }

  const count = (key) => products.filter((p) => statusOf(p) === key).length
  const off = count('off')
  const categories = [...new Set(products.map((p) => p.category))]
  const q = search.trim().toLowerCase()
  const shown = products
    .filter((p) => !q || p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q))
    .filter((p) => category === 'all' || p.category === category)
    .filter((p) => status === 'all' || statusOf(p) === status)
    // Products still on sale first, the switched-off ones at the end.
    .sort((a, b) => b.active - a.active)
  const clear = () => {
    setSearch('')
    setCategory('all')
    setStatus('all')
  }

  return (
    <>
      <div className="tiles">
        <button className={`stat ${status === 'all' ? 'on' : ''}`} aria-pressed={status === 'all'} onClick={() => setStatus('all')}>
          <span className="stat-icon">
            <Icon name="box" />
          </span>
          <div>
            <b>{products.length}</b>
            <span>Total Items</span>
            {off > 0 && <span>{off} switched off</span>}
          </div>
        </button>
        {['ok', 'low', 'out'].map((key) => (
          <button key={key} className={`stat ${STATUS[key].card} ${status === key ? 'on' : ''}`} aria-pressed={status === key} onClick={() => setStatus(key)}>
            <span className="stat-icon">
              <Icon name={STATUS[key].icon} />
            </span>
            <div>
              <b>{count(key)}</b>
              <span>{STATUS[key].label}</span>
            </div>
          </button>
        ))}
      </div>

      <div className="searchbar st-filters">
        <label className="searchbar-box">
          <Icon name="search" />
          <input className="search" type="search" placeholder="Search items or categories..." aria-label="Search items" value={search} onChange={(e) => setSearch(e.target.value)} />
        </label>
        <select className="search" aria-label="Category" value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="all">All categories</option>
          {categories.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <select className="search" aria-label="Stock status" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="all">All statuses</option>
          {Object.entries(STATUS).map(([key, st]) => (
            <option key={key} value={key}>
              {st.label}
            </option>
          ))}
        </select>
      </div>

      {shown.length ? (
        <div className="card rlist">
          <div className="list-head">
            <b>
              {shown.length} item{shown.length === 1 ? '' : 's'}
            </b>
            <span>
              {totals.units} piece{totals.units === 1 ? '' : 's'} in stock · worth {money(totals.value)}
            </span>
          </div>
          <table className="rtable">
            <thead>
              <tr>
                <th>Item Name</th>
                <th>Category</th>
                <th>Quantity</th>
                <th>Price</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((p) => (
                <ProductRow key={p.id} p={p} onOpen={onOpen} />
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="card blank plain">
          <span className="blank-icon">
            <Icon name="search" />
          </span>
          <h3>No items match</h3>
          <p>Try another name, category or status.</p>
          <button className="btn small" onClick={clear}>
            Clear filters
          </button>
        </div>
      )}
    </>
  )
}

// One product: a table row on a wide screen, a card on a narrow one (index.css lays the same cells out both ways).
function ProductRow({ p, onOpen }) {
  const st = STATUS[statusOf(p)]
  return (
    <tr className={p.active ? '' : 'off'}>
      <td className="rt-item">
        <Link to={`/stock/${p.id}`} aria-label={`${p.name}: stock ledger`}>
          <span className={`avatar stock ${p.active ? '' : 'off'}`}>
            <Icon name="box" />
          </span>
          <b>{p.name}</b>
        </Link>
      </td>
      <td data-label="Category">{p.category}</td>
      <td data-label="Quantity">
        <b>{p.stock}</b>
      </td>
      <td data-label="Price">
        <b>{money(p.sellPrice)}</b>
        {p.buyPrice > 0 && <small>Cost {money(p.buyPrice)}</small>}
      </td>
      <td className="rt-status">
        <Badge tone={st.tone}>{st.label}</Badge>
      </td>
      <td className="rt-acts">
        <div>
          {p.active && (
            <>
              <button className="btn small primary" disabled={p.stock <= 0} onClick={() => onOpen({ kind: 'sell', product: p })}>
                Sell
              </button>
              <button className="btn small" onClick={() => onOpen({ kind: 'buy', product: p })}>
                Buy stock
              </button>
            </>
          )}
          <Link to={`/stock/${p.id}`} className="btn small">
            <Icon name="receipt" />
            Ledger
          </Link>
        </div>
      </td>
    </tr>
  )
}

const MOVE_LOOK = {
  sell: { icon: 'rupee', tone: 'sell' },
  buy: { icon: 'box', tone: 'buy' },
  adjust: { icon: 'settings', tone: 'adjust' },
}

// One month of sales, purchases and count changes.
function History({ onOpen }) {
  const { today } = useApp()
  const thisMonth = today.slice(0, 7)
  const [month, setMonth] = useState(thisMonth)
  const { data, error } = useLoad(`/stock/moves?month=${month}`)
  const step = (n) => setMonth(addMonths(`${month}-01`, n).slice(0, 7))
  const monthName = MONTH_NAMES[Number(month.slice(5)) - 1]

  return (
    <>
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
          <div className="card">
            <div className="tri">
              <div className="tri-box income">
                <span>Sold</span>
                <b>{money(data.totals.sold)}</b>
                <small>{data.totals.soldUnits} pieces</small>
              </div>
              <div className="tri-box expense">
                <span>Bought</span>
                <b>{money(data.totals.bought)}</b>
                <small>{data.totals.boughtUnits} pieces</small>
              </div>
              <div className="tri-box profit">
                <span>{data.totals.profit < 0 ? 'Loss' : 'Profit'}</span>
                <b>{money(data.totals.profit)}</b>
                <small>on items sold</small>
              </div>
            </div>
            <p className="hint" style={{ marginTop: 10 }}>
              Profit = selling price minus what you paid for those pieces, in {monthName}.
              {data.totals.noCost && ' Some products have no cost price yet, so their full price counts as profit. Add “Your cost” on the product.'}
            </p>
          </div>
          <div className="list">
            {data.items.map((m) => {
              const look = MOVE_LOOK[m.type]
              return (
                <button key={m.id} className="card row" onClick={() => onOpen(m)} aria-label={`Details of: ${moveTitle(m)}`}>
                  <span className={`avatar move-${look.tone}`}>
                    <Icon name={look.icon} />
                  </span>
                  <div className="row-main">
                    <div className="row-title">{moveTitle(m)}</div>
                    <div className="row-sub">
                      {fmtDate(m.date)}
                      {m.type !== 'adjust' && ` · ${m.mode}`}
                      {m.customer && ` · ${m.customer}`}
                      {m.note && ` · ${m.note}`}
                    </div>
                  </div>
                  {m.type !== 'adjust' && (
                    <div className="row-side">
                      <b className={m.type === 'sell' ? 'paid' : ''}>
                        {m.type === 'sell' ? '+' : '−'}
                        {money(m.amount)}
                      </b>
                    </div>
                  )}
                </button>
              )
            })}
            {!data.items.length && <div className="empty">Nothing sold or bought in {monthName}.</div>}
          </div>
        </>
      )}
    </>
  )
}
