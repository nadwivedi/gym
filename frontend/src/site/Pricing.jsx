import { Link } from 'react-router-dom'
import { Icon } from '../components/ui.jsx'
import Faq from './Faq.jsx'
import { MULTI_GYM, OFFERS, PLANS, PRO, STARTER, perMonth, rupees } from './pricing.js'
import SiteLayout, { AppButton, CtaBand } from './SiteLayout.jsx'
import { whatsappLink } from './whatsapp.js'

const PRICING_URL = whatsappLink('Hi, I want to know the GymSolution gym management software pricing for my gym.')
const planUrl = (plan) => whatsappLink(`Hi, I want the GymSolution ${plan.name} plan (${rupees(plan.price)}/year) for my gym.`)

// What each plan has. [feature, in Starter, in Pro, in Multi-Gym]
const MATRIX = [
  ['Unlimited members', true, true, true],
  ['Renewal tracking and due lists', true, true, true],
  ['Payments, UPI / cash and pending dues', true, true, true],
  ['Expense management with bills', true, true, true],
  ['Income, expense and profit dashboard', true, true, true],
  ['Supplement and stock inventory', true, true, true],
  ['Staff and trainer access', true, true, true],
  ['One-tap call and WhatsApp to members', true, true, true],
  ['Automatic WhatsApp renewal reminders', false, true, true],
  ['Log of every WhatsApp message sent', false, true, true],
  ['Manage several gyms from one login', false, false, true],
  ["Each branch's profit, or all gyms together", false, false, true],
]

// What automatic WhatsApp reminders do for a gym. [icon, colour, heading, text]
const WHATSAPP_BENEFITS = [
  ['chat', 'green', 'No more calling one by one', 'Reminders go out by themselves. Nobody at the front desk has to type or call every member whose plan is ending.'],
  ['calendar', 'purple', 'Always on time', 'Each member gets a message on their renewal date, and again 2 days later if they have not renewed. No reminder is forgotten on a busy day.'],
  ['trend', 'blue', 'More renewals, more income', 'A reminder on the right day brings members back before they drift away. Saving a few renewals a year pays for the whole plan.'],
  ['phone', 'orange', 'From your own number', 'Messages are sent from your gym’s own WhatsApp number, so members know who it is and can reply to you directly.'],
  ['rupee', 'green', 'No charge per message', 'It does not use the paid WhatsApp Business API, so there is nothing extra to pay however many reminders go out.'],
  ['shield', 'purple', 'Safe and polite', 'Sent only between 8 am and 9 pm, a few seconds apart and at most 40 a day, and never to a member who has already renewed.'],
]

// What the Multi-Gym plan adds. [icon, colour, heading, text]
const MULTI_GYM_BENEFITS = [
  ['building', 'purple', 'Every branch, one login', 'Switch between your gyms in one tap, from your phone or computer. No separate accounts to remember.'],
  ['users', 'blue', 'Separate data for each gym', 'Members, payments and expenses are kept separately for every branch, so nothing gets mixed up.'],
  ['chart', 'green', 'Profit per branch and in total', "See each branch's income, expenses and profit, or all your gyms added together."],
  ['plus', 'orange', 'Add a branch any time', 'Opening a new gym? Add it as a new branch and start entering members the same day.'],
  ['chat', 'green', 'WhatsApp reminders for all', 'Automatic WhatsApp renewal reminders work for the members of every branch.'],
  ['shield', 'blue', 'Staff see only their gym', 'Front-desk staff get only the access they need, while you see the whole business.'],
]

// Why the price is low. [icon, colour, heading, text]
const AFFORDABLE = [
  ['rupee', 'green', 'Under ₹10 a day', `The Starter plan is ${rupees(STARTER)} a year: about ₹${perMonth(STARTER)} a month, less per day than a cup of tea, for the whole gym.`],
  ['box', 'blue', 'One software, not five', 'Renewals, billing, expenses, profit, stock and WhatsApp reminders in one app, instead of paying for a separate tool for each job.'],
  ['shield', 'purple', 'No hidden charges', 'No setup fee, no installation charge, no per-member fee and no charge per WhatsApp message.'],
  ['phone', 'orange', 'No hardware to buy', 'Runs on the phone and computer you already own. No server, no special device, no extra computer.'],
  ['users', 'green', 'Unlimited members', 'The price stays the same as your gym grows. Add 50 members or 500, you pay the same plan price.'],
  ['bolt', 'blue', 'Pay once a year', 'One yearly payment and the software runs for 12 months, with no monthly bill to remember.'],
]

// Every plan has these. [icon, colour, heading, text]
const INCLUDED = [
  ['calendar', 'purple', 'Renewal management', 'Overdue, due today and due in the next 7 days, listed for you every morning.'],
  ['users', 'blue', 'Member records', 'Every member with phone, plan, joining date, payment history and pending balance.'],
  ['rupee', 'green', 'Payments and pending dues', 'Record fees in cash, UPI or card, and see every balance still to be collected.'],
  ['receipt', 'orange', 'Expense management', 'Rent, electricity, salaries and repairs written down with bills, by category and by month.'],
  ['chart', 'blue', 'Profit dashboard', 'Income, expenses and profit added up for you, month by month.'],
  ['box', 'purple', 'Supplement stock', 'Protein, creatine and T-shirts: purchases, sales, profit and low-stock alerts.'],
]

// Why gym owners pick it. [heading, text]
const BEST = [
  ['Made for Indian gyms', 'Rupee billing, UPI and cash payments, 10-digit mobile numbers and WhatsApp reminders, the way gyms in India actually work.'],
  ['Simple for the front desk', 'Big buttons and clear lists on the phone. Anyone at the counter can renew a member or take a payment in seconds.'],
  ['All in one single software', 'Members, renewals, money, stock and WhatsApp in one place, so there is one app to learn and one price to pay.'],
  ['Your data stays yours', 'Each gym has its own private data. Export members, payments, expenses and stock to Excel whenever you want.'],
]

// Costs gym owners ask about. [item, GymSolution]
const NO_EXTRA = [
  ['Starter plan', `${rupees(STARTER)} per year`],
  ['Pro plan with WhatsApp', `${rupees(PRO)} per year`],
  ['Multi-Gym plan', `${rupees(MULTI_GYM)} per year`],
  ['Setup or installation fee', '₹0'],
  ['Hardware or server', '₹0'],
  ['WhatsApp reminder messages', '₹0 per message'],
]

// [the cost, registers and diaries, GymSolution]
const COMPARE = [
  ['Yearly cost', 'Registers, diaries, phone calls', `From ${rupees(STARTER)} a year, about ₹${perMonth(STARTER)} a month`],
  ['Time on renewals', 'An hour or more checking registers and calling', 'A few minutes: the list is ready, and on Pro the reminders go out by themselves'],
  ['Missed renewals', 'Easy to forget a member whose plan ended', 'Every overdue member stays on the list until renewed or hidden'],
  ['Uncollected dues', 'Remembered, or written on a slip', 'Every balance tracked against the member until paid'],
  ['Knowing your profit', 'Worked out at the end of the month, if at all', 'Shown for every month with income and expenses'],
]

// How the price pays for itself. [heading, text]
const PAYBACK = [
  ['One renewal covers months', `If a member pays ₹1,000 a month, saving just one renewal you would have missed pays for more than three months of the Starter plan.`],
  ['Dues get collected', 'Pending balances are shown on the member and on the dashboard, so partial payments are not forgotten.'],
  ['Expenses stay in check', 'When every expense is written down by category, it is easy to see where money is leaking and what to cut.'],
]

// [heading, text]
const STEPS = [
  ['Message us on WhatsApp', 'Tell us your gym name and the plan you want: Starter, Pro or Multi-Gym.'],
  ['Get your login', 'Log in on your phone or computer. Your plans and expense categories are already set up.'],
  ['Add your members', 'Enter members with their plan and renewal date. From the next day, renewals (and on Pro, WhatsApp reminders) run for you.'],
]

const FAQS = [
  {
    q: 'What is the price of GymSolution gym management software?',
    a: `GymSolution has three yearly plans: Starter at ${rupees(STARTER)} per year, Pro with automatic WhatsApp reminders at ${rupees(PRO)} per year, and Multi-Gym with several branches and automatic WhatsApp at ${rupees(MULTI_GYM)} per year.`,
  },
  {
    q: 'Which plan should I choose?',
    a: `Choose Starter (${rupees(STARTER)}/year) if you run one gym and are happy to send reminders yourself. Choose Pro (${rupees(PRO)}/year) if you want WhatsApp renewal reminders sent automatically. Choose Multi-Gym (${rupees(MULTI_GYM)}/year) if you own more than one gym or branch.`,
  },
  {
    q: 'Is automatic WhatsApp worth the extra cost?',
    a: `Pro costs ${rupees(PRO - STARTER)} more a year than Starter, about ₹${perMonth(PRO - STARTER)} a month. It sends every renewal reminder for you, on time, from your own number. If it brings back even one or two members a year who would have left, it has paid for itself.`,
    link: ['/whatsapp-automation-for-gyms', 'How the WhatsApp reminders work.'],
  },
  {
    q: 'Do I pay extra for WhatsApp reminder messages?',
    a: 'No. GymSolution sends renewal reminders from your own linked WhatsApp number instead of the paid WhatsApp Business API, so there is no charge per message.',
  },
  {
    q: 'Is there a monthly plan?',
    a: `All plans are paid yearly, which keeps the price low. The Starter plan at ${rupees(STARTER)} a year works out to about ₹${perMonth(STARTER)} a month.`,
  },
  {
    q: 'Why is GymSolution the most affordable gym management software?',
    a: `It replaces several tools with one: renewals, billing, expenses, profit and stock are all in one app from ${rupees(STARTER)} a year. There is no setup fee, no hardware, no per-member charge and no charge per WhatsApp message.`,
    link: ['/affordable-gym-management-software', 'Read why it costs less.'],
  },
  {
    q: 'Does the price go up when my gym gets more members?',
    a: 'No. Members are unlimited on every plan, so the price stays the same whether you have 50 members or 500.',
  },
  {
    q: 'Can I move to a bigger plan later?',
    a: 'Yes. Start with Starter or Pro, and message us on WhatsApp when you want automatic reminders or open another branch.',
  },
  {
    q: 'Can I try it before I pay?',
    a: 'Yes. You can start with a free trial and use GymSolution with your own members before choosing a plan.',
    link: ['/gym-management-app-free', 'Start a free trial.'],
  },
]

// What search engines read about the page: where it sits on the site, and the product with its plans.
// The questions are added by Faq.
const STRUCTURED = [
  {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'GymSolution',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web, Android, iOS, Windows',
    url: 'https://gymsolution.in/gym-management-software-pricing',
    description: 'All-in-one, affordable gym management software for gym owners: members, renewals, payments, expenses, profit, stock, automatic WhatsApp renewal reminders and multi-gym management.',
    offers: OFFERS,
  },
  {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://gymsolution.in/' },
      { '@type': 'ListItem', position: 2, name: 'Gym Management Software Pricing', item: 'https://gymsolution.in/gym-management-software-pricing' },
    ],
  },
]

// A grid of [icon, colour, heading, text] cards.
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

export default function Pricing() {
  return (
    <SiteLayout
      title={`Gym Management Software Pricing – Plans from ${rupees(STARTER)}/year | GymSolution`}
      description={`Affordable gym management software pricing: Starter ${rupees(STARTER)}/year, Pro with automatic WhatsApp reminders ${rupees(PRO)}/year, Multi-Gym ${rupees(MULTI_GYM)}/year. Renewals, members, payments, expenses and stock in one software. No setup fee.`}
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(STRUCTURED) }} />

      <section className="w-hero small">
        <div className="w-container w-page-head">
          <span className="w-eyebrow">Pricing</span>
          <h1>Gym Management Software Pricing</h1>
          <p>
            Simple, affordable yearly plans for every gym, starting at just {rupees(STARTER)} a year (about ₹{perMonth(STARTER)} a month). Renewals, members,
            payments, expenses and profit in one software, with automatic WhatsApp reminders and multi-gym management when you need them.
          </p>
          <div className="w-hero-actions center">
            <a href="#plans" className="w-btn primary">
              See plans
              <Icon name="arrow" />
            </a>
            <Link to="/gym-management-app-free" className="w-btn ghost">
              Start free trial
            </Link>
          </div>
        </div>
      </section>

      <section id="plans" className="w-container w-section">
        <div className="w-section-head">
          <span className="w-eyebrow dark">Plans</span>
          <h2>Three simple yearly plans</h2>
          <p>Every plan has unlimited members, no setup fee and no per-member charge. Pick the one that fits your gym.</p>
        </div>
        <div className="w-plans">
          {PLANS.map((plan, col) => (
            <div key={plan.id} className={`w-plan ${plan.featured ? 'featured' : ''}`}>
              {plan.featured && <span className="w-plan-badge">Most popular</span>}
              <h3>{plan.name}</h3>
              <p className="w-plan-price">
                {rupees(plan.price)}
                <small>/ year</small>
              </p>
              <p className="w-plan-note">
                About ₹{perMonth(plan.price)} a month. {plan.tagline}
              </p>
              <a href={planUrl(plan)} className={`w-btn ${plan.featured ? 'primary' : 'outline'}`} target="_blank" rel="noreferrer">
                Choose {plan.name}
                <Icon name="arrow" />
              </a>
              <ul className="w-plan-list">
                {MATRIX.map(([feature, ...has]) => (
                  <li key={feature} className={has[col] ? '' : 'no'}>
                    <Icon name={has[col] ? 'check' : 'close'} />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <p className="w-after">
          Not sure which plan fits? <a href={PRICING_URL} target="_blank" rel="noreferrer">Ask us on WhatsApp</a> or{' '}
          <Link to="/gym-management-app-free">start with a free trial</Link>.
        </p>
      </section>

      <section className="w-band">
        <div className="w-container w-section">
          <div className="w-section-head">
            <span className="w-eyebrow dark">Compare plans</span>
            <h2>Starter vs Pro vs Multi-Gym</h2>
            <p>The same easy software in every plan. Pro adds automatic WhatsApp, Multi-Gym adds your other branches.</p>
          </div>
          <div className="w-table-wrap">
            <table className="w-compare w-plan-table">
              <thead>
                <tr>
                  <th scope="col">Feature</th>
                  {PLANS.map((plan) => (
                    <th key={plan.id} scope="col">
                      {plan.name}
                      <br />
                      <small>{rupees(plan.price)}/year</small>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {MATRIX.map(([feature, ...has]) => (
                  <tr key={feature}>
                    <th scope="row">{feature}</th>
                    {has.map((yes, i) => (
                      <td key={PLANS[i].id} className={yes ? '' : 'no'} aria-label={yes ? 'Included' : 'Not included'}>
                        <Icon name={yes ? 'check' : 'close'} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="w-container w-section">
        <div className="w-section-head">
          <span className="w-eyebrow dark">Pro plan · {rupees(PRO)}/year</span>
          <h2>Benefits of automated WhatsApp reminders for your gym</h2>
          <p>
            The Pro plan sends every renewal reminder on WhatsApp for you. For about ₹{perMonth(PRO - STARTER)} a month more than Starter, your front desk never
            has to chase a renewal again.
          </p>
        </div>
        <Cards items={WHATSAPP_BENEFITS} />
        <p className="w-after">
          See exactly how it works: <Link to="/whatsapp-automation-for-gyms">WhatsApp automation for gyms</Link>.
        </p>
      </section>

      <section className="w-band">
        <div className="w-container w-section">
          <div className="w-section-head">
            <span className="w-eyebrow dark">Multi-Gym plan · {rupees(MULTI_GYM)}/year</span>
            <h2>Multi-gym management software for gym chains and branches</h2>
            <p>Own more than one gym? Run every branch from one login, with automatic WhatsApp reminders included, for one yearly price.</p>
          </div>
          <Cards items={MULTI_GYM_BENEFITS} />
        </div>
      </section>

      <section className="w-container w-section">
        <div className="w-section-head">
          <span className="w-eyebrow dark">Affordable</span>
          <h2>Why GymSolution is the most affordable gym management software</h2>
          <p>A low price, and nothing extra to pay on top of it. That is what makes it affordable for every gym, big or small.</p>
        </div>
        <Cards items={AFFORDABLE} />
      </section>

      <section className="w-band">
        <div className="w-container w-section">
          <div className="w-price">
            <div className="w-price-card">
              <span>Starts at</span>
              <p className="w-price-amount">
                {rupees(STARTER)}
                <small>/ year</small>
              </p>
              <p>About ₹{perMonth(STARTER)} a month. Unlimited members, no setup fee.</p>
              <a href={PRICING_URL} className="w-btn light" target="_blank" rel="noreferrer">
                Ask on WhatsApp
                <Icon name="arrow" />
              </a>
            </div>
            <div className="w-price-text">
              <span className="w-eyebrow dark">All in one</span>
              <h2>All your gym work in one single software</h2>
              <p>
                Most gyms juggle a register for members, a diary for dues, WhatsApp for reminders and a notebook for expenses. GymSolution puts all of it in
                one single software, so there is one place to look and one low yearly price to pay. What you see below is exactly what you pay:
              </p>
              <ul className="w-ticks">
                {NO_EXTRA.map(([item, value]) => (
                  <li key={item}>
                    <Icon name="check" />
                    <span>
                      <b>{item}:</b> {value}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="w-container w-section">
        <div className="w-section-head">
          <span className="w-eyebrow dark">In every plan</span>
          <h2>What every GymSolution plan includes</h2>
          <p>Even the Starter plan covers the whole gym: the front desk, the money and the stock.</p>
        </div>
        <Cards items={INCLUDED} />
        <p className="w-after">
          Read more about <Link to="/gym-stock-management-software">supplement stock management</Link> and <Link to="/features">all GymSolution features</Link>.
        </p>
      </section>

      <section className="w-band">
        <div className="w-container w-section">
          <div className="w-section-head">
            <span className="w-eyebrow dark">Best for gym owners</span>
            <h2>Why gym owners call it the best gym management software</h2>
            <p>Affordable is only half of it. It also has to be easy enough to use every single day.</p>
          </div>
          <ol className="w-steps">
            {BEST.map(([title, text], i) => (
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
          <span className="w-eyebrow dark">Worth the price</span>
          <h2>How GymSolution pays for itself</h2>
          <p>The software costs less than the money a gym quietly loses without it.</p>
        </div>
        <div className="w-grid three">
          {PAYBACK.map(([title, text]) => (
            <div key={title} className="w-card plain">
              <span className="w-icon tone-green">
                <Icon name="trend" />
              </span>
              <h3>{title}</h3>
              <p>{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="w-band">
        <div className="w-container w-section">
          <div className="w-section-head">
            <span className="w-eyebrow dark">Cost comparison</span>
            <h2>The real cost of running a gym on registers</h2>
            <p>Registers look free, but they cost time, missed renewals and uncollected fees.</p>
          </div>
          <div className="w-table-wrap">
            <table className="w-compare">
              <thead>
                <tr>
                  <th scope="col">Cost</th>
                  <th scope="col">Registers and diaries</th>
                  <th scope="col">GymSolution</th>
                </tr>
              </thead>
              <tbody>
                {COMPARE.map(([cost, byHand, withApp]) => (
                  <tr key={cost}>
                    <th scope="row">{cost}</th>
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
            Looking for the lowest cost option? See why GymSolution is <Link to="/affordable-gym-management-software">affordable gym management software</Link>.
          </p>
        </div>
      </section>

      <section className="w-container w-section">
        <div className="w-section-head">
          <span className="w-eyebrow dark">Getting started</span>
          <h2>Start using GymSolution in three steps</h2>
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
        <div className="w-hero-actions center">
          <a href={PRICING_URL} className="w-btn primary" target="_blank" rel="noreferrer">
            Get started on WhatsApp
            <Icon name="arrow" />
          </a>
          <AppButton className="w-btn outline" />
        </div>
      </section>

      <Faq title="Gym management software pricing: common questions" items={FAQS} band />

      <CtaBand />
    </SiteLayout>
  )
}
