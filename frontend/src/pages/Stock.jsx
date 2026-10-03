import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { addMonths } from '../../../shared/domain.mjs'
import { useLoad } from '../api.js'
import { Badge, Icon, Loading } from '../components/ui.jsx'
import TopMenu from '../components/TopMenu.jsx'
import { useApp } from '../context.js'
import { MONTHS, MONTH_NAMES, fmtDate, money, moveTitle, stockBadge } from '../format.js'
import { MoveDetailSheet, MoveSheet, ProductSheet } from '../sheets/StockSheets.jsx'

const TABS = [
  { key: 'items', label: 'Products' },
  { key: 'history', label: 'Sales and buys' },
]

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
        <h1>
          Stock
          <span className="sub">Protein, creatine, clothes and more</span>
        </h1>
        <TopMenu />
      </header>
      <div className="page">
        <div className="btn-grid three">
          <button className="btn small primary" onClick={() => setSheet({ kind: 'sell' })}>
            + Sell
          </button>
          <button className="btn small" onClick={() => setSheet({ kind: 'buy' })}>
            + Buy stock
          </button>
          <button className="btn small" onClick={() => setSheet({ kind: 'product' })}>
            + New product
          </button>
        </div>

        <div className="tabs" role="tablist">
          {TABS.map((t) => (
            <button key={t.key} role="tab" aria-selected={tab === t.key} className={`tab ${tab === t.key ? 'active' : ''}`} onClick={() => setParams({ tab: t.key }, { replace: true })}>
              {t.label}
            </button>
          ))}
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
  if (!stock.data) return <Loading error={stock.error} />
  const { products, totals } = stock.data
  const q = search.trim().toLowerCase()
  const shown = products.filter((p) => !q || p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q))
  const selling = shown.filter((p) => p.active)
  const groups = [...new Set(selling.map((p) => p.category))]
  const off = shown.filter((p) => !p.active)

  if (!products.length) {
    return (
      <div className="empty">
        No products yet. Tap <b>+ New product</b> to add protein, creatine, T-shirts or anything else you sell.
      </div>
    )
  }

  return (
    <>
      <div className="stat-grid">
        <div className="stat green">
          <span className="stat-icon">
            <Icon name="box" />
          </span>
          <div>
            <b>{totals.units}</b>
            <span>Pieces in stock</span>
            <span>worth {money(totals.value)}</span>
          </div>
        </div>
        <div className={`stat ${totals.low || totals.out ? 'red' : 'purple'}`}>
          <span className="stat-icon">
            <Icon name="receipt" />
          </span>
          <div>
            <b>{totals.low + totals.out}</b>
            <span>Need buying</span>
            <span>
              {totals.out} out · {totals.low} running low
            </span>
          </div>
        </div>
      </div>

      <input className="search" type="search" placeholder="Search products" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search products" />

      {groups.map((category) => (
        <div key={category} className="list">
          <div className="section-title">{category}</div>
          {selling
            .filter((p) => p.category === category)
            .map((p) => (
              <ProductCard key={p.id} p={p} onOpen={onOpen} />
            ))}
        </div>
      ))}
      {off.length > 0 && (
        <div className="list">
          <div className="section-title">Not selling now</div>
          {off.map((p) => (
            <ProductCard key={p.id} p={p} onOpen={onOpen} />
          ))}
        </div>
      )}
      {!shown.length && <div className="empty">No product matches “{search}”.</div>}
    </>
  )
}

function ProductCard({ p, onOpen }) {
  const badge = stockBadge(p)
  return (
    <div className="card member">
      <Link to={`/stock/${p.id}`} className="member-head" aria-label={`${p.name}: stock ledger`}>
        <span className={`avatar stock ${p.active ? '' : 'off'}`}>
          <Icon name="box" />
        </span>
        <div className="row-main">
          <div className="row-title">{p.name}</div>
          <div className="row-sub">
            Sell at {money(p.sellPrice)}
            {p.buyPrice > 0 && ` · bought at ${money(p.buyPrice)}`}
          </div>
        </div>
        <div className="row-side">{p.active ? <Badge tone={badge.tone}>{badge.text}</Badge> : <Badge>Switched off</Badge>}</div>
      </Link>
      <div className="member-body">
        <div className="row-actions">
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
      </div>
    </div>
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
