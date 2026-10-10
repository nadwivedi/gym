import { Link } from 'react-router-dom'
import { Icon } from '../components/ui.jsx'
import Faq from './Faq.jsx'
import SiteLayout, { AppButton, CtaBand } from './SiteLayout.jsx'
import { WHATSAPP_URL } from './whatsapp.js'

// The price this page is about. It is also in the page title, the description and the search-engine data below.
const PRICE = 150

const INCLUDED = [
  'Member records and renewal tracking',
  'Payments and pending dues',
  'Automatic WhatsApp renewal reminders',
  'Expenses and monthly profit',
  'Supplement and stock inventory',
  'Works on your phone and computer',
]

// [icon, colour, heading, text]
const REASONS = [
  ['rupee', 'green', 'A low monthly price', `Plans start at ₹${PRICE} per month, so even a small neighbourhood gym can move from registers to software.`],
  ['phone', 'blue', 'No new hardware to buy', 'GymSolution runs in the browser on the phone and computer you already own. There is nothing to install.'],
  ['chat', 'green', 'Less manual work', 'Renewal lists, due amounts and WhatsApp reminders are prepared for you, so the front desk spends minutes on them, not hours.'],
  ['calendar', 'purple', 'Fewer missed renewals', 'Every overdue and due-today member is on one screen, with Call and WhatsApp one tap away.'],
  ['chart', 'orange', 'Clear profit every month', 'Income, expenses and profit are added up for you month by month, so you always know where the gym stands.'],
  ['building', 'blue', 'Grows with your gym', 'Use it for a single gym or several branches, with staff and trainer access when you need it.'],
]

// [the job, by hand, with GymSolution]
const COMPARE = [
  ['Renewals', 'Checked in a register, easy to miss', 'Overdue, due today and next 7 days, listed for you'],
  ['Reminders', 'Call or message every member yourself', 'WhatsApp reminders sent automatically on the due date'],
  ['Pending dues', 'Remembered, or written on a slip', 'Every balance tracked against the member until it is paid'],
  ['Expenses and profit', 'Added up at the end of the month', 'Income, expenses and profit shown for every month'],
  ['Supplement stock', 'Counted on the shelf', 'Purchases, sales and low stock recorded item by item'],
]

const FAQS = [
  {
    q: 'How much does GymSolution gym management software cost?',
    a: `GymSolution plans start at ₹${PRICE} per month, about ₹${PRICE / 30} a day, for software that keeps your members, renewals, payments and reminders in order. Message us on WhatsApp and we will suggest the plan that fits your gym.`,
  },
  {
    q: 'What does this affordable gym management software include?',
    a: 'Member records, renewal tracking, payments and pending dues, automatic WhatsApp reminders, expense and profit tracking, and supplement and stock inventory, all in one app.',
    link: ['/features', 'See each feature in detail.'],
  },
  {
    q: 'Are there hidden costs, like hardware or WhatsApp message charges?',
    a: 'There is no hardware to buy: GymSolution runs on the phone or computer you already own. WhatsApp reminders go out from your own linked number rather than the paid WhatsApp Business API, so there is no charge per message.',
  },
  {
    q: 'Is it affordable for a small gym with under 100 members?',
    a: `Yes. GymSolution is built for owners who run the gym themselves, and plans start at ₹${PRICE} a month. It is simple enough for the front desk, and a small gym can replace its registers and diaries with it.`,
    link: ['/gym-management-app-free', 'Try it free with your own members.'],
  },
  {
    q: 'How does gym software save a gym money every month?',
    a: 'It stops small losses that are easy to miss by hand: renewals nobody followed up and balances never collected. GymSolution lists every overdue member, keeps each pending balance against the member, and sends the renewal reminder on the due date for you.',
  },
]

// What search engines read about the page: the product with its starting price. The questions are added by Faq.
const STRUCTURED = [
  {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'GymSolution',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    description: 'Affordable gym management software for gym owners: members, renewals, payments, expenses, stock and automatic WhatsApp reminders.',
    offers: { '@type': 'Offer', price: String(PRICE), priceCurrency: 'INR', description: 'Starting price per month' },
  },
]

export default function Affordable() {
  return (
    <SiteLayout
      title={`Affordable Gym Management Software from ₹${PRICE}/month – GymSolution`}
      description={`GymSolution is affordable gym management software starting at ₹${PRICE} per month. Manage members, renewals, payments, expenses, stock and automatic WhatsApp reminders in one simple app.`}
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(STRUCTURED) }} />

      <section className="w-hero small">
        <div className="w-container w-page-head">
          <span className="w-eyebrow">Plans from ₹{PRICE} per month</span>
          <h1>Affordable Gym Management Software</h1>
          <p>
            GymSolution gives gym owners member records, renewal tracking, payments, expenses, stock and automatic WhatsApp reminders in one simple app, with
            plans starting at just ₹{PRICE} per month.
          </p>
          <div className="w-hero-actions center">
            <AppButton />
            <a href={WHATSAPP_URL} className="w-btn ghost" target="_blank" rel="noreferrer">
              Ask about pricing
            </a>
          </div>
        </div>
      </section>

      <section className="w-container w-section">
        <div className="w-price">
          <div className="w-price-card">
            <span>Starts at</span>
            <p className="w-price-amount">
              ₹{PRICE}
              <small>/ month</small>
            </p>
            <p>About ₹{PRICE / 30} a day for your whole gym.</p>
            <AppButton className="w-btn light" />
          </div>
          <div className="w-price-text">
            <span className="w-eyebrow dark">Low-cost gym software</span>
            <h2>Gym software at a price every gym can afford</h2>
            <p>
              Most gyms lose money in small, quiet ways: a renewal nobody followed up, a balance that was never collected, an expense that was never written
              down. GymSolution keeps all of it in one place for ₹{PRICE} a month. A single renewal you would otherwise have missed can pay for many months of
              the software.
            </p>
            <ul className="w-ticks">
              {INCLUDED.map((item) => (
                <li key={item}>
                  <Icon name="check" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="w-band">
        <div className="w-container w-section">
          <div className="w-section-head">
            <span className="w-eyebrow dark">Why it costs less</span>
            <h2>Why GymSolution is an affordable gym software</h2>
            <p>A low price is only part of it. The real saving is the time and the missed money you get back every month.</p>
          </div>
          <div className="w-grid three">
            {REASONS.map(([icon, tone, title, text]) => (
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

      <section className="w-container w-section">
        <div className="w-section-head">
          <span className="w-eyebrow dark">Register or software</span>
          <h2>Managing a gym by hand vs with GymSolution</h2>
          <p>The same daily jobs, with far less effort.</p>
        </div>
        <div className="w-table-wrap">
          <table className="w-compare">
            <thead>
              <tr>
                <th scope="col">Daily job</th>
                <th scope="col">Registers and spreadsheets</th>
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
          Want the details of each tool? <Link to="/features">See all GymSolution features</Link>. New to GymSolution?{' '}
          <Link to="/gym-management-app-free">Start with a free trial of the gym management app</Link>.
        </p>
      </section>

      <Faq title="Affordable gym management software: common questions" items={FAQS} band />

      <CtaBand />
    </SiteLayout>
  )
}
