import { Link } from 'react-router-dom'
import { Icon } from '../components/ui.jsx'
import Faq from './Faq.jsx'
import { DashboardMock, ExpensesMock } from './mocks.jsx'
import { OFFERS, PRO, STARTER, perMonth, rupees } from './pricing.js'
import SiteLayout, { CtaBand } from './SiteLayout.jsx'
import { whatsappLink } from './whatsapp.js'

const PAGE_URL = 'https://gymsolution.in/gym-profit-loss-report-software'
const TRIAL_URL = whatsappLink('Hi, I want to see my gym’s profit and loss with GymSolution.')

// A worked month, following the dashboard's own sums (services/statsService.js). [label, amount, kind]
const EXAMPLE = [
  ['Membership fees received', '₹1,24,500', 'in'],
  ['Refunds given', '− ₹2,000', 'in'],
  ['Supplement shop sales', '+ ₹18,000', 'in'],
  ['Income', '₹1,40,500', 'total'],
  ['Expenses: rent, electricity, salaries, repairs', '₹38,000', 'out'],
  ['Stock bought for the shop', '+ ₹14,000', 'out'],
  ['Expenses', '₹52,000', 'total'],
  ['Profit for October', '₹88,500', 'profit'],
]

// What the report shows. [icon, colour, heading, text]
const REPORT = [
  ['chart', 'blue', 'Income vs expenses', 'A chart of income against expenses for every month of the year, so good and bad months stand out.'],
  ['trend', 'green', 'Profit by month', 'Profit or loss for each month. A month below the line is a loss.'],
  ['receipt', 'orange', 'Expenses by category', 'Rent, electricity, salaries, repairs, stock bought and your own categories, for the month or year.'],
  ['wallet', 'purple', 'Received by payment mode', 'How much came in by cash, UPI, card and bank.'],
  ['calendar', 'blue', 'Month by month table', 'Income, expenses and profit for every month of the year in one table.'],
  ['users', 'green', 'Members alongside money', 'Active members, new admissions and renewals for the same period, next to the numbers.'],
]

// Questions the report answers. [heading, text]
const DECISIONS = [
  ['Was this month better than last month?', 'The profit by month chart shows it at a glance. Open the month to see whether income dropped or expenses rose.'],
  ['Where is the money going?', 'Expenses by category shows the biggest costs. If electricity or repairs jump, you see it the same month.'],
  ['Is the supplement shop worth it?', 'Shop sales are counted as income and stock bought as an expense, so you can compare the two for any month.'],
  ['How much is still owed to the gym?', 'Pending dues are shown separately, with the number of members who owe, so you know what could still come in.'],
]

// Benefits. [icon, colour, heading, text]
const BENEFITS = [
  ['bolt', 'orange', 'No manual calculations', 'Every payment, refund, sale and expense is added up for you, month by month.'],
  ['chart', 'blue', 'Understand performance', 'See how the gym is really doing, not just how much was collected.'],
  ['search', 'purple', 'Identify costs', 'Spot rising expenses by category before they eat into the profit.'],
  ['trend', 'green', 'Better business decisions', 'Decide on prices, offers and spending with real monthly numbers in front of you.'],
  ['upload', 'blue', 'Ready for your accountant', 'Download payments and expenses to Excel whenever your accountant needs them.'],
  ['phone', 'orange', 'On your phone', 'Check this month’s profit from anywhere, on your phone or laptop.'],
]

const FAQS = [
  {
    q: 'What is gym profit and loss report software?',
    a: 'It is software that adds up a gym’s income and expenses for a period and shows whether the gym made a profit or a loss. In GymSolution, the dashboard does this for every month and the whole year, from the payments, shop sales and expenses you record.',
  },
  {
    q: 'How does GymSolution calculate my gym’s profit?',
    a: 'Income is the membership payments received, minus refunds, plus supplement shop sales. Expenses are every expense you record plus stock bought for the shop. Profit is income minus expenses, for the month or year you choose.',
  },
  {
    q: 'Are pending dues counted as income?',
    a: 'No. Income counts money when it is actually received, on the payment date. Pending dues are shown separately, so you can see what is still owed without it inflating your profit.',
    link: ['/gym-dues-collection-software', 'More on dues collection.'],
  },
  {
    q: 'Are unpaid bills counted as expenses?',
    a: 'Yes. An expense counts on its date even if part of it is still unpaid. The Expenses page shows how much of your bills is still pending.',
    link: ['/gym-expense-tracking-software', 'More on expense tracking.'],
  },
  {
    q: 'Is GymSolution accounting software?',
    a: 'No. It is gym management software with income, expense and profit reports. It does not do bookkeeping, GST or tax calculations, balance sheets or depreciation. For those, download your payments and expenses to Excel and share them with your accountant.',
  },
  {
    q: 'Can I see profit for a single month and for the whole year?',
    a: 'Yes. Pick a year and, if you like, a month on the dashboard. You see the income, expenses and profit for that period, plus a month-by-month table for the year.',
  },
  {
    q: 'Does it include supplement sales and stock purchases?',
    a: 'Yes. Supplement shop sales count as income and stock bought counts as an expense, so the profit includes your gym shop.',
    link: ['/gym-stock-management-software', 'More on stock management.'],
  },
  {
    q: 'How much does it cost?',
    a: `Profit and loss reports are in every plan, from ${rupees(STARTER)} a year (about ₹${perMonth(STARTER)} a month). The Pro plan with automatic WhatsApp reminders is ${rupees(PRO)} a year.`,
    link: ['/gym-management-software-pricing', 'Compare all plans.'],
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
      'Gym profit and loss report software: membership payments, refunds and shop sales as income, expenses and stock purchases as spending, and profit or loss for every month and year.',
    featureList: [
      'Monthly and yearly profit or loss',
      'Income vs expenses chart',
      'Expenses by category',
      'Income by payment mode',
      'Pending dues shown separately',
      'Export payments and expenses to Excel',
    ],
    offers: OFFERS,
  },
  {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://gymsolution.in/' },
      { '@type': 'ListItem', position: 2, name: 'Gym Profit and Loss Report Software', item: PAGE_URL },
    ],
  },
]

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

export default function ProfitLossReport() {
  return (
    <SiteLayout
      title="Gym Profit and Loss Report Software – Income, Expenses & Profit | GymSolution"
      description={`GymSolution shows your gym’s profit and loss for every month: membership income, shop sales, expenses by category and profit, worked out from what you record. From ${rupees(STARTER)}/year.`}
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(STRUCTURED) }} />

      <section className="w-hero small">
        <div className="w-container w-page-head">
          <span className="w-eyebrow">Gym financial management</span>
          <h1>Gym Profit and Loss Report Software</h1>
          <p>
            Collecting fees is not the same as making money. GymSolution adds up what your gym takes in and what it spends, and shows the profit or loss
            for every month, without a spreadsheet or a calculator.
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
            <span className="w-icon tone-blue">
              <Icon name="chart" />
            </span>
            <h2>Your gym’s income, expenses and profit on one dashboard</h2>
            <p>
              Pick a month or a whole year. The dashboard shows what came in, what went out, and the profit or loss, with active members and pending dues at
              the top.
            </p>
            <ul className="w-points">
              <li>
                <Icon name="check" />
                Membership fees received, refunds and shop sales
              </li>
              <li>
                <Icon name="check" />
                Every expense, including stock bought
              </li>
              <li>
                <Icon name="check" />
                Profit or loss for the month and the year
              </li>
              <li>
                <Icon name="check" />
                Pending dues kept separate from income
              </li>
            </ul>
          </div>
          <div className="w-feature-visual">
            <DashboardMock />
          </div>
        </section>
      </div>

      <section className="w-band">
        <div className="w-container w-section">
          <div className="w-section-head">
            <span className="w-eyebrow dark">How profit is worked out</span>
            <h2>A gym profit and loss example, the way GymSolution calculates it</h2>
            <p>No hidden formulas. This is exactly how one month adds up, using example numbers.</p>
          </div>
          <div className="w-table-wrap">
            <table className="w-compare">
              <tbody>
                {EXAMPLE.map(([label, amount, kind]) => (
                  <tr key={label}>
                    <th scope="row">{kind === 'total' || kind === 'profit' ? <b>{label}</b> : label}</th>
                    <td>{kind === 'total' || kind === 'profit' ? <b>{amount}</b> : amount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="w-after">
            Income counts money when it is received. Pending dues are not counted until they are paid. Expenses count on their date, even if part of the bill
            is still unpaid.
          </p>
        </div>
      </section>

      <section className="w-container w-section">
        <div className="w-section-head">
          <span className="w-eyebrow dark">What the report shows</span>
          <h2>Gym revenue tracking and expense reports in one place</h2>
          <p>Everything on the dashboard, for the month or year you choose.</p>
        </div>
        <Cards items={REPORT} />
      </section>

      <section className="w-band">
        <div className="w-container w-section">
          <div className="w-feature">
            <div className="w-feature-text">
              <span className="w-icon tone-orange">
                <Icon name="receipt" />
              </span>
              <h2>A gym income and expense tracker that fills the report</h2>
              <p>
                The report is only as good as what goes into it. GymSolution makes recording easy: payments are taken as you admit and renew members, shop
                sales as you sell, and expenses with a photo of the bill.
              </p>
              <ul className="w-points">
                <li>
                  <Icon name="check" />
                  Payments by cash, UPI, card or bank
                </li>
                <li>
                  <Icon name="check" />
                  Expenses in your own categories
                </li>
                <li>
                  <Icon name="check" />
                  Refunds recorded without creating new dues
                </li>
              </ul>
              <Link to="/gym-expense-tracking-software" className="w-more">
                More on expense tracking <Icon name="arrow" />
              </Link>
            </div>
            <div className="w-feature-visual">
              <ExpensesMock />
            </div>
          </div>
        </div>
      </section>

      <section className="w-container w-section">
        <div className="w-section-head">
          <span className="w-eyebrow dark">Better decisions</span>
          <h2>Business questions your profit and loss report answers</h2>
          <p>Practical questions gym owners ask, and where the answer is.</p>
        </div>
        <ol className="w-steps">
          {DECISIONS.map(([title, text], i) => (
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
            <span className="w-eyebrow dark">Know the limits</span>
            <h2>Gym financial reports, not full accounting software</h2>
            <p>GymSolution shows the numbers a gym owner needs every month. It does not replace your accountant.</p>
          </div>
          <div className="w-grid three">
            <div className="w-card plain">
              <span className="w-icon tone-green">
                <Icon name="check" />
              </span>
              <h3>What it does</h3>
              <p>Monthly and yearly income, expenses and profit from your payments, shop sales and expenses, with charts and breakdowns.</p>
            </div>
            <div className="w-card plain">
              <span className="w-icon tone-orange">
                <Icon name="alert" />
              </span>
              <h3>What it does not do</h3>
              <p>Bookkeeping, GST or income tax calculations, balance sheets, depreciation or bank reconciliation.</p>
            </div>
            <div className="w-card plain">
              <span className="w-icon tone-blue">
                <Icon name="upload" />
              </span>
              <h3>Working with your accountant</h3>
              <p>Download payments and expenses as Excel-ready CSV files and hand them over, already organised.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="w-container w-section">
        <div className="w-section-head">
          <span className="w-eyebrow dark">Why it helps</span>
          <h2>Benefits of a gym profit and loss report</h2>
          <p>Clear numbers every month, with no adding up.</p>
        </div>
        <Cards items={BENEFITS} />
      </section>

      <section className="w-band">
        <div className="w-container w-section">
          <div className="w-price">
            <div className="w-price-card">
              <span>Profit reports from</span>
              <p className="w-price-amount">
                {rupees(STARTER)}
                <small>/ year</small>
              </p>
              <p>About ₹{perMonth(STARTER)} a month, in every plan.</p>
              <Link to="/gym-management-software-pricing" className="w-btn light">
                See all plans
                <Icon name="arrow" />
              </Link>
            </div>
            <div className="w-price-text">
              <span className="w-eyebrow dark">The whole gym in one place</span>
              <h2>Profit reports inside complete gym management software</h2>
              <p>
                The numbers come straight from your daily work: members, renewals, payments, dues, expenses and stock. Nothing is entered twice.
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
            See the <Link to="/gym-management-app">gym management app</Link>, the{' '}
            <Link to="/best-software-for-gym-management">guide to choosing gym software</Link>, or <Link to="/features">all features</Link>.
          </p>
        </div>
      </section>

      <Faq title="Gym profit and loss report software: common questions" items={FAQS}>
        <p className="w-after">
          <Link to="/gym-management-app-free">Start with a free trial</Link> or <Link to="/gym-management-software-pricing">see GymSolution pricing</Link>.
        </p>
      </Faq>

      <CtaBand />
    </SiteLayout>
  )
}
