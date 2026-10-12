import { Link } from 'react-router-dom'
import { Icon } from '../components/ui.jsx'
import Faq from './Faq.jsx'
import { DashboardMock, ExpensesMock } from './mocks.jsx'
import { OFFERS, STARTER, perMonth, rupees } from './pricing.js'
import SiteLayout, { CtaBand } from './SiteLayout.jsx'
import { whatsappLink } from './whatsapp.js'

const PAGE_URL = 'https://gymsolution.in/gym-expense-tracking-software'
const TRIAL_URL = whatsappLink('Hi, I want to try the GymSolution gym expense tracking software for my gym.')

// What one expense entry keeps, as the app's expense form saves it.
const ENTRY_POINTS = [
  'Amount, date and category: rent, electricity, salaries, repairs or your own',
  'Paid by cash, UPI, card or bank',
  'Who it was paid to and the bill or invoice number',
  'A photo or PDF of the bill, kept with the expense',
  'Part paid? Enter what you paid and the rest shows as pending',
  'A short note for anything else worth remembering',
]

// Why gym spending gets lost. [icon, colour, heading, text]
const PROBLEMS = [
  ['receipt', 'orange', 'Bills on paper slips', 'Electricity bills, repair slips and supplier invoices get lost in a drawer, and nobody can say what the gym spent last month.'],
  ['wallet', 'purple', 'Cash spent without a record', 'Small cash payments for cleaning, water or a quick repair are never written down, yet they add up to thousands every month.'],
  ['chart', 'blue', 'Profit is a guess', 'Without expenses next to income, you only know the fees you collected, not what the gym actually earned.'],
]

// How tracking works, step by step. [heading, text]
const STEPS = [
  ['Add the expense', 'Tap Add expense, enter the amount and pick a category. The date is today unless you change it.'],
  ['Snap the bill', 'Attach a photo or PDF of the bill from your phone, so the proof is always with the expense.'],
  ['Mark paid or pending', 'Paid in full, or part paid with the balance still pending. Unpaid bills are counted until you clear them.'],
  ['See where the money went', 'The month’s total, the split by category and by payment mode, and your profit after expenses update straight away.'],
]

// Everything the expense tracker shows. [icon, colour, heading, text]
const TRACKED = [
  ['calendar', 'blue', 'Month by month', 'Every expense in a month, newest first, with the month’s total. Step back to any earlier month in one tap.'],
  ['chart', 'purple', 'Spending by category', 'See at a glance how much went on rent, electricity, salaries, maintenance or equipment this month.'],
  ['rupee', 'green', 'Cash, UPI, card and bank', 'See how each month’s expenses were paid, so cash going out of the counter is never a mystery.'],
  ['alert', 'orange', 'Pending bills', 'The total still unpaid and the number of unpaid bills, so you know what the gym owes before the supplier calls.'],
  ['receipt', 'blue', 'Bills and receipts', 'Each expense keeps its bill photo or PDF, invoice number and who it was paid to. No more searching for a slip.'],
  ['box', 'purple', 'Stock purchases included', 'Protein, creatine and other stock you buy for the gym shop is counted in expenses automatically, so profit is right.'],
]

// The profit view.
const PROFIT_POINTS = [
  'Income from membership fees and shop sales, minus every expense',
  'Profit or loss for each month and for the whole year',
  'Income vs expenses by month, side by side',
  'Expenses by category for the month or year you pick',
]

// How it makes the owner's work simpler. [icon, colour, heading, text]
const SIMPLER = [
  ['phone', 'blue', 'Ten seconds from your phone', 'Add an expense at the counter, in the shop or at home. No register, no Excel sheet, no laptop needed.'],
  ['bolt', 'orange', 'No adding up at month end', 'Totals by month, category and payment mode are worked out for you. Month-end accounts are already done.'],
  ['shield', 'green', 'Proof for every rupee', 'The bill is attached to the expense, so partners, your accountant or you a year later can check any payment.'],
  ['upload', 'purple', 'Ready for your accountant', 'Download every expense to Excel with date, category, amount, paid amount, mode, invoice number and status.'],
  ['settings', 'blue', 'Your own categories', 'Start with Electricity, Cleaning, Maintenance and Repair, then add your own: Rent, Salaries, Equipment, Marketing.'],
  ['trend', 'green', 'Spot rising costs early', 'When the electricity bill or repair costs jump, it shows in the category split before it eats your profit.'],
]

// [the job, by hand, with GymSolution]
const COMPARE = [
  ['Recording an expense', 'Written in a register, if someone remembers', 'Added from the phone in seconds'],
  ['Keeping the bill', 'Paper slip in a drawer', 'Photo or PDF attached to the expense'],
  ['Monthly total', 'Added up by hand at month end', 'Shown for every month, always up to date'],
  ['Where the money went', 'Not known', 'Split by category and payment mode'],
  ['Unpaid bills', 'Remembered, or forgotten', 'Pending total and count of unpaid bills'],
  ['Monthly profit', 'A rough guess', 'Income minus expenses, month by month'],
]

const FAQS = [
  {
    q: 'What is gym expense tracking software?',
    a: 'It is software that records everything your gym spends, such as rent, electricity, salaries, repairs and equipment, and shows the totals by month and category. GymSolution also puts your expenses next to your membership income, so you see the gym’s real profit.',
  },
  {
    q: 'How do I track gym expenses in GymSolution?',
    a: 'Tap Add expense, enter the amount, pick a category and the payment mode, and save. You can also add who it was paid to, the invoice number, a note and a photo or PDF of the bill. The month’s totals update straight away.',
  },
  {
    q: 'Can I create my own expense categories?',
    a: 'Yes. GymSolution starts with Electricity, Cleaning, Maintenance, Repair and Other, and you can add your own, such as Rent, Salaries, Equipment or Marketing, each with its own icon. You can rename a category or stop using it, and old expenses keep their category.',
  },
  {
    q: 'Can I keep a photo of the bill?',
    a: 'Yes. Attach a JPG, PNG or WebP photo, or a PDF, to any expense. It stays with that expense, and you can open it, replace it or remove it later.',
  },
  {
    q: 'What if I have only paid part of a bill?',
    a: 'Enter the amount paid so far. The expense is marked pending with the rest still due, and the Expenses page shows the total pending and the number of unpaid bills. Update it when you pay the rest.',
  },
  {
    q: 'Does it show my gym’s monthly profit?',
    a: 'Yes. The dashboard shows income from membership fees and shop sales, your expenses, and the profit or loss for each month and the whole year, with charts of income against expenses.',
  },
  {
    q: 'Are supplement and stock purchases counted as expenses?',
    a: 'Yes. Stock you buy for the gym shop, like protein or creatine, is counted in expenses automatically, and shop sales are counted as income, so your profit includes the shop.',
    link: ['/gym-stock-management-software', 'More on gym stock management.'],
  },
  {
    q: 'Can I export my gym expenses to Excel?',
    a: 'Yes. Download all expenses as a CSV file, which opens in Excel or Google Sheets, with the date, category, amount, amount paid, payment mode, paid to, invoice number and status.',
  },
  {
    q: 'How much does the gym expense tracking software cost?',
    a: `Expense tracking is in every GymSolution plan, starting at ${rupees(STARTER)} a year (about ₹${perMonth(STARTER)} a month), together with members, renewals, payments and stock.`,
    link: ['/gym-management-software-pricing', 'See all plans.'],
  },
]

// What search engines read about the page: the product, its plans, and where the page sits. The questions are added by Faq.
const STRUCTURED = [
  {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'GymSolution',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web, Android, iOS, Windows',
    url: PAGE_URL,
    description:
      'Gym expense tracking software: record every gym expense with its category, payment mode and bill, track pending bills, and see monthly spending and profit next to membership income.',
    featureList: [
      'Expense entry with category, payment mode, paid to and invoice number',
      'Bill photo or PDF attached to each expense',
      'Pending and part-paid bills',
      'Monthly totals by category and payment mode',
      'Monthly and yearly profit after expenses',
      'Export expenses to Excel',
    ],
    offers: OFFERS,
  },
  {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://gymsolution.in/' },
      { '@type': 'ListItem', position: 2, name: 'Gym Expense Tracking Software', item: PAGE_URL },
    ],
  },
]

function Points({ items }) {
  return (
    <ul className="w-points">
      {items.map((point) => (
        <li key={point}>
          <Icon name="check" />
          {point}
        </li>
      ))}
    </ul>
  )
}

function Cards({ items }) {
  return (
    <div className="w-grid three">
      {items.map(([icon, tone, title, text]) => (
        <div key={title} className="w-card plain">
          <span className={`w-icon tone-${tone}`}>
            <Icon name={icon} />
          </span>
          <h3>{title}</h3>
          <p>{text}</p>
        </div>
      ))}
    </div>
  )
}

export default function ExpenseTracking() {
  return (
    <SiteLayout
      title="Gym Expense Tracking Software – Track Spending & Profit | GymSolution"
      description={`GymSolution gym expense tracking software records every gym expense with its category, payment mode and bill photo, tracks pending bills, and shows monthly spending and profit. From ${rupees(STARTER)}/year.`}
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(STRUCTURED) }} />

      <section className="w-hero small">
        <div className="w-container w-page-head">
          <span className="w-eyebrow">Know where every rupee goes</span>
          <h1>Gym Expense Tracking Software</h1>
          <p>
            GymSolution records everything your gym spends, from rent and electricity to salaries and repairs, keeps the bill with each expense, and shows
            your spending and profit for every month. Add an expense from your phone in seconds.
          </p>
          <div className="w-hero-actions center">
            <a href={TRIAL_URL} className="w-btn primary" target="_blank" rel="noreferrer">
              Start free trial
              <Icon name="arrow" />
            </a>
            <Link to="/gym-management-software-pricing" className="w-btn ghost">
              See pricing
            </Link>
          </div>
        </div>
      </section>

      <div className="w-container">
        <section className="w-feature">
          <div className="w-feature-text">
            <span className="w-icon tone-orange">
              <Icon name="receipt" />
            </span>
            <h2>Record every gym expense in seconds</h2>
            <p>
              Each expense takes a few taps, and keeps everything you need to know about it later. No register to fill, no slips to file, no Excel sheet to
              keep updated.
            </p>
            <Points items={ENTRY_POINTS} />
          </div>
          <div className="w-feature-visual">
            <ExpensesMock />
          </div>
        </section>
      </div>

      <section className="w-band">
        <div className="w-container w-section">
          <div className="w-section-head">
            <span className="w-eyebrow dark">The problem</span>
            <h2>Why gym owners lose track of expenses</h2>
            <p>Most gyms know what they collect in fees. Far fewer know what they spend, and that is where the profit leaks.</p>
          </div>
          <Cards items={PROBLEMS} />
        </div>
      </section>

      <section className="w-container w-section">
        <div className="w-section-head">
          <span className="w-eyebrow dark">How it works</span>
          <h2>How GymSolution tracks your gym expenses</h2>
          <p>Four quick steps, and every expense is recorded, proven and counted.</p>
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
      </section>

      <section className="w-band">
        <div className="w-container w-section">
          <div className="w-section-head">
            <span className="w-eyebrow dark">Track everything</span>
            <h2>Every gym expense, tracked and sorted for you</h2>
            <p>The Expenses page answers the questions every gym owner asks at month end.</p>
          </div>
          <Cards items={TRACKED} />
        </div>
      </section>

      <div className="w-container">
        <section className="w-feature">
          <div className="w-feature-text">
            <span className="w-icon tone-green">
              <Icon name="trend" />
            </span>
            <h2>See your gym’s real profit, not just its fees</h2>
            <p>
              Expense tracking matters because of what it tells you: how much the gym really earns. GymSolution puts your expenses next to your membership
              and shop income on the dashboard, so the profit is worked out for you.
            </p>
            <Points items={PROFIT_POINTS} />
          </div>
          <div className="w-feature-visual">
            <DashboardMock />
          </div>
        </section>
      </div>

      <section className="w-band">
        <div className="w-container w-section">
          <div className="w-section-head">
            <span className="w-eyebrow dark">Less work</span>
            <h2>How expense tracking software simplifies your work</h2>
            <p>Less writing, no adding up, and answers in one screen.</p>
          </div>
          <Cards items={SIMPLER} />
        </div>
      </section>

      <section className="w-container w-section">
        <div className="w-section-head">
          <span className="w-eyebrow dark">Register or software</span>
          <h2>Gym expenses in a register vs with expense tracking software</h2>
          <p>The same expenses, recorded once and understood at a glance.</p>
        </div>
        <div className="w-table-wrap">
          <table className="w-compare">
            <thead>
              <tr>
                <th scope="col">Job</th>
                <th scope="col">Register and paper slips</th>
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
      </section>

      <section className="w-band">
        <div className="w-container w-section">
          <div className="w-price">
            <div className="w-price-card">
              <span>Expense tracking from</span>
              <p className="w-price-amount">
                {rupees(STARTER)}
                <small>/ year</small>
              </p>
              <p>About ₹{perMonth(STARTER)} a month, in every plan. No extra charge for expenses.</p>
              <Link to="/gym-management-software-pricing" className="w-btn light">
                See all plans
                <Icon name="arrow" />
              </Link>
            </div>
            <div className="w-price-text">
              <span className="w-eyebrow dark">More than expenses</span>
              <h2>Expense tracking inside complete gym management software</h2>
              <p>
                Expenses only make sense next to income. That is why GymSolution keeps both in one app: your members, renewals and fee payments, your
                expenses, your supplement stock and your monthly profit.
              </p>
              <ul className="w-ticks">
                <li>
                  <Icon name="check" />
                  Members and renewals
                </li>
                <li>
                  <Icon name="check" />
                  Payments and dues
                </li>
                <li>
                  <Icon name="check" />
                  Expenses and profit
                </li>
                <li>
                  <Icon name="check" />
                  Supplement stock
                </li>
              </ul>
            </div>
          </div>
          <p className="w-after">
            See <Link to="/features">all GymSolution features</Link>, the <Link to="/gym-membership-renewal-software">gym membership renewal software</Link>,
            or read why it is <Link to="/affordable-gym-management-software">affordable gym management software</Link>.
          </p>
        </div>
      </section>

      <Faq title="Gym expense tracking software: common questions" items={FAQS}>
        <p className="w-after">
          <Link to="/gym-management-app-free">Start with a free trial</Link> or <Link to="/gym-management-software-pricing">see GymSolution pricing</Link>.
        </p>
      </Faq>

      <CtaBand />
    </SiteLayout>
  )
}
