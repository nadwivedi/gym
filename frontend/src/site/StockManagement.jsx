import { Link } from 'react-router-dom'
import { Icon } from '../components/ui.jsx'
import Faq from './Faq.jsx'
import { InventoryMock, StockLedgerMock } from './mocks.jsx'
import SiteLayout, { CtaBand } from './SiteLayout.jsx'
import { whatsappLink } from './whatsapp.js'

const TRIAL_URL = whatsappLink('Hi, I want to try GymSolution stock management for my gym.')

const STOCK_POINTS = [
  'A live count of every product, updated with every purchase and sale',
  'In stock, low stock and out of stock at a glance',
  'Your own low-stock level for each product',
  'Total pieces on the shelf and their value at selling price',
  'Search by name, and filter by category or stock status',
]

// [icon, colour, heading, text]
const BENEFITS = [
  ['bell', 'orange', 'Never run out of best-sellers', 'Set a low-stock level for each product and see what needs reordering before a member asks for something you no longer have.'],
  ['chart', 'purple', 'Profit on every product', 'GymSolution remembers what each piece cost you, so every sale shows its real profit, not just the money that came in.'],
  ['shield', 'green', 'No stock goes missing unnoticed', 'Every purchase, sale and count correction is on record, so a gap between the shelf and the app is easy to trace.'],
  ['receipt', 'blue', 'Shop and gym in one set of accounts', 'Stock you buy is added to your expenses and stock you sell to your income, so the monthly profit includes your supplement shop.'],
  ['wallet', 'green', 'Every sale recorded properly', 'Note each sale with how it was paid, by cash, UPI, card or bank, and who bought it.'],
  ['phone', 'blue', 'No extra hardware', 'No barcode scanner or billing machine to buy. Record a sale from the front-desk phone or computer in a few taps.'],
]

const LEDGER_POINTS = [
  'Pieces bought, pieces sold and profit for each product',
  'Opening stock, purchases, sales and corrections in one list',
  'Correct the count for damaged, lost or miscounted pieces',
  'Delete a wrong entry and the stock goes back by itself',
  'A sale cannot take more pieces than are on the shelf',
]

const STEPS = [
  [
    'Add your products',
    'Enter each item with its selling price, your cost and how many you have now. Protein, creatine, mass gainer, T-shirts and lowers are ready as types, and you can add your own.',
  ],
  ['Record purchases', 'When a supplier delivers, note the quantity, the cost per piece and the bill number. The stock goes up and the cost is added to your expenses.'],
  ['Sell at the front desk', 'Pick the product, the quantity and how the member paid. The stock goes down, the sale is added to your income and its profit is worked out.'],
]

// [the job, in a notebook, with GymSolution]
const COMPARE = [
  ['Stock count', 'Counted on the shelf when someone remembers', 'Updated with every purchase and sale'],
  ['Low stock', 'Noticed when a member asks for it', 'Low and out-of-stock items shown at a glance'],
  ['Profit per product', 'Rarely worked out', 'Worked out from your cost on every sale'],
  ['Purchases', 'Bills kept in a drawer', 'Each purchase recorded with cost, date and bill number'],
  ['Monthly accounts', 'Shop money mixed with membership fees', 'Shop sales and purchases inside your monthly profit'],
]

// From Google autocomplete for gym stock and inventory searches, and the questions competitor and supplement-retail guides answer.
const FAQS = [
  {
    q: 'What is gym stock management software?',
    a: 'It is software that keeps count of the products a gym sells, such as protein, creatine and gym clothing, and records every purchase and sale. GymSolution does this inside the same app you use for members, renewals and payments, so your shop and your memberships share one set of accounts.',
  },
  {
    q: 'Is gym inventory management the same as tracking gym equipment?',
    a: 'Not in GymSolution. Its inventory management is for the things your gym sells, like supplements, shakers and clothing, with prices, sales and profit. It does not keep a register of machines, weights or their servicing.',
  },
  {
    q: 'How does GymSolution work out profit on supplement sales?',
    a: 'Each product has your cost per piece, which updates to the latest price whenever you record a purchase. On every sale, the profit is what the member paid minus that cost, and you see it for each product and for each month.',
  },
  {
    q: 'Can I sell a product at a discount?',
    a: 'Yes. The selling price is filled in for you, but you can change the price per piece on any sale. The profit is worked out from what the member actually paid.',
  },
  {
    q: 'What if the stock in the app does not match the shelf?',
    a: 'Count the shelf and enter the real number. GymSolution records the difference as a count correction, separate from sales, so damaged, lost or miscounted pieces are on record without changing your income.',
  },
  {
    q: 'Can I add the stock I already have when I start?',
    a: 'Yes. When you add a product, enter how many pieces you have now. It is recorded as opening stock, and no purchase cost is added to your expenses for it.',
  },
  {
    q: 'Does the supplement shop show in my gym’s monthly profit?',
    a: 'Yes. On the dashboard, shop sales are added to membership income and stock purchases to expenses, so the monthly profit you see covers the whole gym.',
    link: ['/features', 'See the revenue and expense dashboard.'],
  },
  {
    q: 'Is stock management a paid add-on?',
    a: 'No. Stock and inventory management comes with GymSolution, together with members, renewals, payments, expenses and WhatsApp reminders. Plans start at ₹150 per month, and you can begin with a free trial.',
    link: ['/affordable-gym-management-software', 'See GymSolution pricing.'],
  },
]

// What search engines read about the page: the software, and where the page sits on the site. The questions are added by Faq.
const STRUCTURED = [
  {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'GymSolution',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    description:
      'Gym stock management software: track supplement, protein and gym clothing stock, purchases, sales, low stock and profit per product, together with members, renewals and payments.',
    featureList: [
      'Live stock count for every product',
      'Low-stock and out-of-stock status',
      'Purchase and sale recording with payment mode',
      'Profit per product from cost price',
      'Stock ledger with count corrections',
      'Shop sales and purchases in monthly profit',
    ],
    offers: { '@type': 'Offer', price: '150', priceCurrency: 'INR', description: 'Free trial available. Paid plans start at this price per month.' },
  },
  {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://gymsolution.in/' },
      { '@type': 'ListItem', position: 2, name: 'Gym Stock Management Software', item: 'https://gymsolution.in/gym-stock-management-software' },
    ],
  },
]

const Points = ({ items }) => (
  <ul className="w-points">
    {items.map((point) => (
      <li key={point}>
        <Icon name="check" />
        {point}
      </li>
    ))}
  </ul>
)

export default function StockManagement() {
  return (
    <SiteLayout
      title="Gym Stock Management Software – Supplement Inventory | GymSolution"
      description="Gym stock management software by GymSolution: track supplement and protein stock, purchases, sales, low stock and profit per product. Plans from ₹150/month."
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(STRUCTURED) }} />

      <section className="w-hero small">
        <div className="w-container w-page-head">
          <span className="w-eyebrow">Stock and inventory management</span>
          <h1>Gym Stock Management Software</h1>
          <p>
            GymSolution is gym stock management software for everything your gym sells: protein, creatine, mass gainers, pre-workout, shakers, T-shirts and
            lowers. Record every purchase and sale, see what is running low and know the profit on every product, in the same app you use for members and
            renewals.
          </p>
          <div className="w-hero-actions center">
            <a href={TRIAL_URL} className="w-btn primary" target="_blank" rel="noreferrer">
              Start free trial
              <Icon name="arrow" />
            </a>
            <Link to="/affordable-gym-management-software" className="w-btn ghost">
              See pricing
            </Link>
          </div>
        </div>
      </section>

      <div className="w-container">
        <section className="w-feature">
          <div className="w-feature-text">
            <span className="w-icon tone-blue">
              <Icon name="box" />
            </span>
            <h2>Stock and inventory management built for gyms</h2>
            <p>
              Many gyms keep supplement stock in a notebook, or only in the owner’s head, and find out a product is finished when a member asks for it.
              GymSolution keeps a live count of every item on your shelf.
            </p>
            <Points items={STOCK_POINTS} />
          </div>
          <div className="w-feature-visual">
            <InventoryMock />
          </div>
        </section>
      </div>

      <section className="w-band">
        <div className="w-container w-section">
          <div className="w-section-head">
            <span className="w-eyebrow dark">Benefits</span>
            <h2>Benefits of gym stock management software</h2>
            <p>What changes when your supplement shop runs on GymSolution instead of a notebook.</p>
          </div>
          <div className="w-grid three">
            {BENEFITS.map(([icon, tone, title, text]) => (
              <div key={title} className="w-card plain">
                <span className={`w-icon tone-${tone}`}>
                  <Icon name={icon} />
                </span>
                <h3>{title}</h3>
                <p>{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="w-container">
        <section className="w-feature">
          <div className="w-feature-text">
            <span className="w-icon tone-purple">
              <Icon name="receipt" />
            </span>
            <h2>A stock ledger for every product</h2>
            <p>
              Open any product to see its full history: every purchase, every sale and every count change, with the stock left after each one. Supplement
              inventory you can actually check.
            </p>
            <Points items={LEDGER_POINTS} />
          </div>
          <div className="w-feature-visual">
            <StockLedgerMock />
          </div>
        </section>
      </div>

      <section className="w-band">
        <div className="w-container w-section">
          <div className="w-section-head">
            <span className="w-eyebrow dark">How it works</span>
            <h2>How gym inventory management works in GymSolution</h2>
            <p>Three everyday jobs, and the stock count looks after itself.</p>
          </div>
          <ol className="w-steps">
            {STEPS.map(([title, text], i) => (
              <li key={title}>
                <span className="w-step-num">{i + 1}</span>
                <h3>{title}</h3>
                <p>{text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="w-container w-section">
        <div className="w-section-head">
          <span className="w-eyebrow dark">Notebook or software</span>
          <h2>Gym stock register vs gym stock management software</h2>
          <p>The same shop, with far less guesswork.</p>
        </div>
        <div className="w-table-wrap">
          <table className="w-compare">
            <thead>
              <tr>
                <th scope="col">Job</th>
                <th scope="col">Notebook or Excel</th>
                <th scope="col">GymSolution</th>
              </tr>
            </thead>
            <tbody>
              {COMPARE.map(([job, byHand, withApp]) => (
                <tr key={job}>
                  <th scope="row">{job}</th>
                  <td>{byHand}</td>
                  <td>
                    <Icon name="check" />
                    {withApp}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="w-after">
          Stock is one part of the app. <Link to="/features">See all GymSolution features</Link>, or{' '}
          <Link to="/whatsapp-automation-for-gyms">see how WhatsApp renewal reminders work</Link>.
        </p>
      </section>

      <Faq title="Gym stock management software: common questions" items={FAQS} band>
        <p className="w-after">
          <a href={TRIAL_URL} target="_blank" rel="noreferrer">
            Try gym stock management free on WhatsApp
          </a>
        </p>
      </Faq>

      <CtaBand />
    </SiteLayout>
  )
}
