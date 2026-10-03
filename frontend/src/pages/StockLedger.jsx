import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useLoad } from '../api.js'
import TopMenu from '../components/TopMenu.jsx'
import { Badge, Icon, Loading } from '../components/ui.jsx'
import { fmtDate, money, stockBadge } from '../format.js'
import { MoveDetailSheet, MoveSheet, ProductSheet } from '../sheets/StockSheets.jsx'

// What each ledger line says, under the date.
function entryText(m) {
  if (m.type === 'adjust') return { title: m.note || 'Count change', sub: '' }
  const each = `${money(m.unitPrice)} each`
  return m.type === 'sell'
    ? { title: 'Sold', sub: [each, m.customer, m.mode].filter(Boolean).join(' · ') }
    : { title: 'Bought', sub: [each, m.mode, m.note].filter(Boolean).join(' · ') }
}

// One product: prices, totals, and every stock in / out with the stock left after it.
export default function StockLedger() {
  const { id } = useParams()
  const { data, error, reload } = useLoad(`/stock/products/${id}/ledger`)
  // 'edit' | 'buy' | 'sell' | a ledger row
  const [sheet, setSheet] = useState(null)
  const done = () => {
    setSheet(null)
    reload()
  }
  const back = (
    <Link to="/stock" className="btn small" aria-label="Back to stock">
      <Icon name="back" />
    </Link>
  )

  if (!data) {
    return (
      <>
        <header className="topbar">
          {back}
          <h1>Stock ledger</h1>
          <TopMenu />
        </header>
        <div className="page">
          <Loading error={error} />
        </div>
      </>
    )
  }

  const { product: p, totals, rows } = data
  const badge = stockBadge(p)

  return (
    <>
      <header className="topbar">
        {back}
        <h1>
          {p.name}
          <span className="sub">Stock ledger</span>
        </h1>
        <TopMenu />
      </header>
      <div className="page">
        <div className="card hero">
          <div className="hero-head">
            <span className={`avatar stock ${p.active ? '' : 'off'}`}>
              <Icon name="box" />
            </span>
            <div className="row-main">
              <div className="row-title">{p.name}</div>
              <div className="row-sub">
                {p.category}
                {!p.active && ' · not selling now'}
              </div>
            </div>
            <Badge tone={badge.tone}>{badge.text}</Badge>
          </div>
          <div className="hero-body">
            <div className="money-grid first">
              <div>
                <span>Selling price</span>
                <b>{money(p.sellPrice)}</b>
              </div>
              <div>
                <span>Your cost</span>
                <b>{p.buyPrice ? money(p.buyPrice) : '—'}</b>
              </div>
              <div>
                <span>In stock</span>
                <b>{p.stock}</b>
              </div>
            </div>
            <div className="btn-grid three" style={{ marginTop: 12 }}>
              <button className="btn small primary" disabled={!p.active || p.stock <= 0} onClick={() => setSheet('sell')}>
                Sell
              </button>
              <button className="btn small" disabled={!p.active} onClick={() => setSheet('buy')}>
                Buy stock
              </button>
              <button className="btn small" onClick={() => setSheet('edit')}>
                Edit
              </button>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="tri">
            <div className="tri-box expense">
              <span>Bought</span>
              <b>{totals.boughtUnits}</b>
              <small>{money(totals.bought)}</small>
            </div>
            <div className="tri-box income">
              <span>Sold</span>
              <b>{totals.soldUnits}</b>
              <small>{money(totals.sold)}</small>
            </div>
            <div className="tri-box profit">
              <span>{totals.profit < 0 ? 'Loss' : 'Profit'}</span>
              <b>{money(totals.profit)}</b>
              <small>on items sold</small>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="chart-head">
            <h3>Stock ledger</h3>
            <p>Every entry, newest first. “Left” is the stock after that entry. Tap a line to see it or delete a mistake.</p>
          </div>
          {rows.length ? (
            <div className="table-wrap">
              <table className="table ledger">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Entry</th>
                    <th>In</th>
                    <th>Out</th>
                    <th>Left</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((m) => {
                    const { title, sub } = entryText(m)
                    const added = m.type === 'sell' ? 0 : Math.max(m.qty, 0)
                    const taken = m.type === 'sell' ? m.qty : Math.max(-m.qty, 0)
                    return (
                      <tr key={m.id} onClick={() => setSheet(m)}>
                        <td>{fmtDate(m.date)}</td>
                        <td>
                          <b className={`entry-${m.type}`}>{title}</b>
                          {sub && <small>{sub}</small>}
                        </td>
                        <td className="in">{added ? `+${added}` : ''}</td>
                        <td className="out">{taken ? `−${taken}` : ''}</td>
                        <td>
                          <b>{m.balance}</b>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="hint">No entries yet. Use Buy stock or Sell above.</p>
          )}
        </div>
      </div>

      {sheet === 'edit' && <ProductSheet product={p} categories={data.categories} onClose={() => setSheet(null)} onDone={done} />}
      {(sheet === 'buy' || sheet === 'sell') && <MoveSheet type={sheet} product={p} products={[p]} onClose={() => setSheet(null)} onDone={done} />}
      {sheet && typeof sheet === 'object' && <MoveDetailSheet move={sheet} onClose={() => setSheet(null)} onDone={done} />}
    </>
  )
}
