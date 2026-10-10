// Small drawn previews of the app screens for the website. All names and numbers are examples.
import { Icon } from '../components/ui.jsx'

function Frame({ title, icon, children }) {
  return (
    <div className="m-frame" aria-hidden="true">
      <div className="m-bar">
        <span className="m-bar-icon">
          <Icon name={icon} />
        </span>
        {title}
      </div>
      <div className="m-body">{children}</div>
    </div>
  )
}

function Person({ initials, name, sub, children }) {
  return (
    <div className="m-row">
      <span className="m-avatar">{initials}</span>
      <div className="m-row-main">
        <b>{name}</b>
        <small>{sub}</small>
      </div>
      {children}
    </div>
  )
}

const MONTHS = [
  ['May', 98, 46],
  ['Jun', 110, 52],
  ['Jul', 105, 49],
  ['Aug', 118, 50],
  ['Sep', 121, 53],
  ['Oct', 124.5, 51.7],
]
const MAX = 130

export function DashboardMock() {
  return (
    <Frame title="Dashboard · October" icon="chart">
      <div className="m-tiles">
        <div className="m-tile income">
          <small>Revenue</small>
          <b>₹1,24,500</b>
        </div>
        <div className="m-tile expense">
          <small>Expense</small>
          <b>₹51,700</b>
        </div>
        <div className="m-tile profit">
          <small>Profit</small>
          <b>₹72,800</b>
        </div>
      </div>
      <div className="m-chart">
        {MONTHS.map(([m, rev, exp]) => (
          <div key={m} className="m-chart-col">
            <div className="m-chart-bars">
              <span className="income" style={{ height: `${(rev / MAX) * 100}%` }} />
              <span className="expense" style={{ height: `${(exp / MAX) * 100}%` }} />
            </div>
            <small>{m}</small>
          </div>
        ))}
      </div>
      <div className="m-legend">
        <span className="income">Revenue</span>
        <span className="expense">Expense</span>
      </div>
    </Frame>
  )
}

export function RenewalsMock() {
  return (
    <Frame title="Renewals" icon="calendar">
      <div className="m-tabs">
        <span className="on">Today 6</span>
        <span>This week 14</span>
        <span>Overdue 3</span>
      </div>
      <Person initials="RV" name="Rahul Verma" sub="Monthly · ₹1,200">
        <span className="m-badge warn">Due today</span>
      </Person>
      <Person initials="PS" name="Priya Singh" sub="Quarterly · ₹3,300">
        <span className="m-badge warn">Due today</span>
      </Person>
      <Person initials="AG" name="Aman Gupta" sub="Monthly · ₹1,200">
        <span className="m-badge bad">3 days late</span>
      </Person>
      <Person initials="NP" name="Neha Patel" sub="Yearly · ₹10,000">
        <span className="m-badge info">In 4 days</span>
      </Person>
    </Frame>
  )
}

export function MembersMock() {
  return (
    <Frame title="Member profile" icon="idcard">
      <div className="m-profile">
        <span className="m-avatar big">RV</span>
        <div>
          <b>Rahul Verma</b>
          <small>+91 98765 43210 · Joined 5 Jan 2026</small>
        </div>
      </div>
      <div className="m-kv">
        <span>Plan</span>
        <b>Quarterly</b>
        <span>Renewal date</span>
        <b>5 Oct 2026</b>
        <span>Balance due</span>
        <b className="good">₹0</b>
      </div>
      <div className="m-sub-title">History</div>
      <div className="m-line">
        <span>5 Jul · Quarterly renewal</span>
        <b>₹3,300</b>
      </div>
      <div className="m-line">
        <span>5 Apr · Quarterly renewal</span>
        <b>₹3,300</b>
      </div>
    </Frame>
  )
}

export function WhatsAppMock() {
  return (
    <div className="m-frame m-wa" aria-hidden="true">
      <div className="m-bar wa">
        <span className="m-avatar">IF</span>
        <div className="m-row-main">
          <b>Iron Fitness Gym</b>
          <small>online</small>
        </div>
      </div>
      <div className="m-body m-wa-body">
        <div className="m-wa-date">Today</div>
        <div className="m-bubble">
          Hi Rahul, your <b>Monthly</b> membership at <b>Iron Fitness Gym</b> is due for renewal today (<b>5 Oct</b>). Please renew to keep training without a break. 💪
          <small>9:00 AM</small>
        </div>
        <div className="m-bubble me">
          Ok sir, I will pay today evening 👍
          <small>9:14 AM ✓✓</small>
        </div>
      </div>
    </div>
  )
}

const EXPENSES = [
  ['Rent', 'Bank · 1 Oct', '₹25,000'],
  ['Trainer salary', 'UPI · 1 Oct', '₹18,000'],
  ['Electricity', 'UPI · 6 Oct', '₹6,200'],
  ['Equipment repair', 'Cash · 9 Oct', '₹2,500'],
]

export function ExpensesMock() {
  return (
    <Frame title="Expenses · October" icon="receipt">
      {EXPENSES.map(([name, sub, amt]) => (
        <div key={name} className="m-row">
          <span className="m-avatar tone-orange">
            <Icon name="receipt" />
          </span>
          <div className="m-row-main">
            <b>{name}</b>
            <small>{sub}</small>
          </div>
          <b>{amt}</b>
        </div>
      ))}
      <div className="m-total">
        <span>Total this month</span>
        <b>₹51,700</b>
      </div>
    </Frame>
  )
}

const GYMS = [
  ['Iron Fitness · Civil Lines', '212 members · profit ₹72,800', true],
  ['Iron Fitness · Station Road', '148 members · profit ₹41,300', false],
  ['Iron Fitness · Ladies Wing', '96 members · profit ₹27,900', false],
]

export function MultiGymMock() {
  return (
    <Frame title="Switch gym" icon="building">
      {GYMS.map(([name, sub, on]) => (
        <div key={name} className={`m-row m-pick ${on ? 'on' : ''}`}>
          <span className="m-avatar tone-purple">
            <Icon name="building" />
          </span>
          <div className="m-row-main">
            <b>{name}</b>
            <small>{sub}</small>
          </div>
          {on && (
            <span className="m-check">
              <Icon name="check" />
            </span>
          )}
        </div>
      ))}
      <div className="m-total">
        <span>All 3 gyms · profit</span>
        <b>₹1,42,000</b>
      </div>
    </Frame>
  )
}

const ACCESS = [
  ['Add new members', true],
  ['Renewals and payments', true],
  ['View member list', true],
  ['Expenses', false],
  ['Profit and reports', false],
  ['Delete records', false],
]

export function StaffMock() {
  return (
    <Frame title="Staff access" icon="shield">
      <Person initials="RK" name="Ravi Kumar" sub="Front desk · own login" />
      <div className="m-sub-title">Can access</div>
      {ACCESS.map(([label, on]) => (
        <div key={label} className="m-toggle-row">
          <span>{label}</span>
          <span className={`m-toggle ${on ? 'on' : ''}`} />
        </div>
      ))}
    </Frame>
  )
}

const STOCK = [
  ['Whey Protein 1 kg', '₹2,400', 'good', '12 in stock'],
  ['Creatine 250 g', '₹900', 'warn', 'Only 3 left'],
  ['Pre-workout 300 g', '₹1,600', 'bad', 'Out of stock'],
  ['Shaker bottle', '₹250', 'good', '25 in stock'],
]

export function InventoryMock() {
  return (
    <Frame title="Stock · Supplements" icon="box">
      {STOCK.map(([name, price, tone, left]) => (
        <div key={name} className="m-row">
          <span className="m-avatar tone-blue">
            <Icon name="box" />
          </span>
          <div className="m-row-main">
            <b>{name}</b>
            <small>Sale price {price}</small>
          </div>
          <span className={`m-badge ${tone}`}>{left}</span>
        </div>
      ))}
      <div className="m-total">
        <span>46 sold this month</span>
        <b>Profit ₹18,400</b>
      </div>
    </Frame>
  )
}

// One product's ledger, newest first: [icon, colour, what happened, details, change, left after it].
// 20 bought − 7 sold − 1 damaged = 12 left; profit 7 × (₹2,400 − ₹1,900) = ₹3,500.
const LEDGER = [
  ['rupee', 'blue', 'Sold 2', '8 Oct · Rahul Verma · UPI', '12 left'],
  ['rupee', 'blue', 'Sold 1', '5 Oct · Cash', '14 left'],
  ['box', 'purple', 'Bought 10', '1 Oct · Bill no. 245', '15 left'],
  ['edit', 'orange', 'Count corrected −1', '30 Sep · 1 damaged', '5 left'],
]

export function StockLedgerMock() {
  return (
    <Frame title="Whey Protein 1 kg · Ledger" icon="box">
      <div className="m-tiles">
        <div className="m-tile">
          <small>Bought</small>
          <b>20 pcs</b>
        </div>
        <div className="m-tile income">
          <small>Sold</small>
          <b>7 pcs</b>
        </div>
        <div className="m-tile profit">
          <small>Profit</small>
          <b>₹3,500</b>
        </div>
      </div>
      <div className="m-sub-title">Every entry</div>
      {LEDGER.map(([icon, tone, title, sub, left]) => (
        <div key={title + sub} className="m-row">
          <span className={`m-avatar tone-${tone}`}>
            <Icon name={icon} />
          </span>
          <div className="m-row-main">
            <b>{title}</b>
            <small>{sub}</small>
          </div>
          <span className="m-badge info">{left}</span>
        </div>
      ))}
    </Frame>
  )
}

const TRAINERS = [
  ['VS', 'Vikram Singh', 18, 42],
  ['SM', 'Sonal Mehta', 12, 30],
  ['AJ', 'Arjun Joshi', 9, 21],
]

export function TrainersMock() {
  return (
    <Frame title="Trainers · October" icon="dumbbell">
      {TRAINERS.map(([ini, name, clients, sessions]) => (
        <div key={name} className="m-trainer">
          <Person initials={ini} name={name} sub={`${clients} clients · ${sessions} sessions`} />
          <div className="m-meter">
            <span style={{ width: `${(sessions / 50) * 100}%` }} />
          </div>
        </div>
      ))}
    </Frame>
  )
}

