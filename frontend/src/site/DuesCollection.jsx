import { Link } from 'react-router-dom'
import { Icon } from '../components/ui.jsx'
import Faq from './Faq.jsx'
import { DuesChatMock, DuesMock } from './mocks.jsx'
import { OFFERS, STARTER, perMonth, rupees } from './pricing.js'
import SiteLayout, { CtaBand } from './SiteLayout.jsx'
import { whatsappLink } from './whatsapp.js'

const PAGE_URL = 'https://gymsolution.in/gym-dues-collection-software'
const TRIAL_URL = whatsappLink('Hi, I want to try the GymSolution gym dues collection software for my gym.')

// The Pending Dues list, as the app shows it.
const LIST_POINTS = [
  'Every member with a balance, biggest due first',
  'The total to collect and from how many members',
  'The date each member promised to pay, and whether it has passed',
  'Record a payment straight from the list',
  'Call or WhatsApp the member in one tap',
  'The list updates the moment a due is paid',
]

// Why dues go uncollected. [icon, colour, heading, text]
const PROBLEMS = [
  ['receipt', 'orange', '“I will pay the rest later”', 'A member pays half at the counter and promises the rest. It goes on a slip of paper, and by next month nobody remembers.'],
  ['users', 'purple', 'Nobody knows the total', 'Dues are spread across register pages, so you never know how much money members actually owe the gym.'],
  ['phone', 'blue', 'Awkward follow-ups', 'Without the exact amount and date in hand, asking a member for money feels uncomfortable, so it is put off.'],
]

// How a due is created and collected. [heading, text]
const STEPS = [
  ['Take a part payment', 'At admission or renewal, record what the member pays now. Cash, UPI, card or bank.'],
  ['The balance is kept', 'The rest is saved as a due on that membership. Add the date the member promised to pay it.'],
  ['Remind in one tap', 'Open Pending Dues, tap WhatsApp beside the member, and the message with the exact amount is ready to send.'],
  ['Collect and clear', 'Record the payment when it comes in. The due leaves the list and the member’s history shows it paid.'],
]

// Everything tracked for each due. [icon, colour, heading, text]
const TRACKED = [
  ['rupee', 'green', 'Fee, paid and balance', 'For every membership: the plan fee, admission fee, what has been paid and what is still due, worked out for you.'],
  ['bell', 'orange', 'Promised payment dates', 'Note when the member said they would pay. The dues list shows the date, and warns you when it has passed.'],
  ['receipt', 'blue', 'Every payment, with its mode', 'Each payment is saved with its date and mode, cash, UPI, card or bank, against the right membership.'],
  ['calendar', 'purple', 'Dues on old memberships too', 'A balance left on last month’s membership is not lost when the member renews. Pay it off against the right one.'],
  ['shield', 'green', 'Waive with a reason, undo later', 'Let a small balance go when you choose to. It leaves the dues list with a note, and you can bring it back.'],
  ['edit', 'blue', 'Corrections are logged', 'Payments can be edited, moved or cancelled when a mistake is made, and every change is kept in the history.'],
]

// The one-tap balance message.
const MESSAGE_POINTS = [
  'A WhatsApp button beside every member with a due',
  'The message is written for you with the member’s name, the exact balance and your gym name',
  'Read it, change it if you like, and send it from your own number',
  'Or call the member in one tap from the same list',
]

// How it helps the owner collect. [icon, colour, heading, text]
const BENEFITS = [
  ['trend', 'green', 'Collect more of what you are owed', 'When every due is listed with its amount, dues get followed up and paid instead of quietly written off.'],
  ['chart', 'blue', 'Know the total at a glance', 'The dashboard shows the pending dues total and how many members owe, next to your income and profit.'],
  ['bolt', 'orange', 'Follow up in seconds', 'No searching registers or working out amounts. The list, the amount and the message are ready.'],
  ['users', 'purple', 'Polite, exact reminders', 'Members get the exact amount in a short, friendly message, so there is no argument and no awkwardness.'],
  ['phone', 'blue', 'Works on your phone', 'Check dues and take payments at the counter, on the gym floor or from home. Nothing to install.'],
  ['upload', 'green', 'Export to Excel', 'Download members with their balance, and every payment, to Excel whenever you want.'],
]

// [the job, by hand, with GymSolution]
const COMPARE = [
  ['Recording a part payment', 'A note on a slip or in the register', 'Saved on the membership, with the balance worked out'],
  ['Knowing who owes', 'Turning every register page', 'One Pending Dues list, biggest first'],
  ['Total dues', 'Not known', 'Shown on the dues list and the dashboard'],
  ['Promised dates', 'Remembered, or forgotten', 'Saved and flagged when they pass'],
  ['Reminding the member', 'Typing out the amount yourself', 'WhatsApp message ready in one tap'],
  ['Mistakes', 'Crossed out in pen', 'Edited, with every change logged'],
]

const FAQS = [
  {
    q: 'What is gym dues collection software?',
    a: 'It is software that keeps track of how much each member still owes the gym, lists every pending due in one place, and helps you remind members and record their payments. GymSolution does this as part of its member and payment management.',
  },
  {
    q: 'How does GymSolution know a member has a due?',
    a: 'Every membership has a plan fee and, for new members, an admission fee. GymSolution subtracts the payments recorded against it, and anything left is the member’s balance. It shows on the member’s profile and in the Pending Dues list.',
  },
  {
    q: 'Can members pay their fee in parts?',
    a: 'Yes. Record each part payment with its date and mode. The balance updates every time, and you can note the date the member promised to pay the rest.',
  },
  {
    q: 'How do I remind a member about a pending due?',
    a: 'Tap the WhatsApp button beside the member in the Pending Dues list. The chat opens from your own WhatsApp number with a message that already says the exact balance and your gym name. You can also call them in one tap.',
  },
  {
    q: 'Are dues reminders sent automatically?',
    a: 'Dues reminders are sent by you, in one tap, so you choose when to ask. The automatic WhatsApp messages on the Pro plan are for renewals: they go out on the renewal date and two days later if the member has not renewed.',
    link: ['/whatsapp-automation-for-gyms', 'How the automatic WhatsApp reminders work.'],
  },
  {
    q: 'What if a member renews while an old due is still pending?',
    a: 'The old balance stays on the old membership and is still in the dues list. When the member pays, choose which membership the payment is for, and GymSolution suggests the oldest one with a balance.',
  },
  {
    q: 'Can I write off a small balance?',
    a: 'Yes. Waive the balance with a note and it leaves the dues list. If you change your mind, you can undo it.',
  },
  {
    q: 'How do I see the total dues of my gym?',
    a: 'The Pending Dues list shows the total to collect and from how many members, and the dashboard shows the same total next to your income, expenses and profit.',
  },
  {
    q: 'How much does the gym dues collection software cost?',
    a: `Dues tracking is in every GymSolution plan, starting at ${rupees(STARTER)} a year (about ₹${perMonth(STARTER)} a month), with members, renewals, expenses and stock included.`,
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
      'Gym dues collection software: tracks part payments and pending member dues, lists who owes how much with promised payment dates, and sends one-tap WhatsApp balance reminders.',
    featureList: [
      'Pending dues list with total to collect',
      'Part payments with automatic balance',
      'Promised payment dates',
      'One-tap WhatsApp and call reminders with the exact balance',
      'Waive a balance with a note',
      'Payment history by cash, UPI, card and bank',
    ],
    offers: OFFERS,
  },
  {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://gymsolution.in/' },
      { '@type': 'ListItem', position: 2, name: 'Gym Dues Collection Software', item: PAGE_URL },
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

export default function DuesCollection() {
  return (
    <SiteLayout
      title="Gym Dues Collection Software – Track & Collect Pending Fees | GymSolution"
      description={`GymSolution gym dues collection software tracks part payments and pending member dues, shows who owes how much and when they promised to pay, and sends WhatsApp balance reminders in one tap. From ${rupees(STARTER)}/year.`}
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(STRUCTURED) }} />

      <section className="w-hero small">
        <div className="w-container w-page-head">
          <span className="w-eyebrow">Collect every rupee you are owed</span>
          <h1>Gym Dues Collection Software</h1>
          <p>
            GymSolution keeps track of every member’s pending fee, lists who owes how much and when they promised to pay, and lets you remind them on
            WhatsApp in one tap. Stop losing money to forgotten part payments.
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
              <Icon name="rupee" />
            </span>
            <h2>All your gym’s pending dues in one list</h2>
            <p>
              Open Pending Dues and see exactly who owes the gym money, how much, and since when. No register to search and no amounts to work out: the list
              is always up to date.
            </p>
            <Points items={LIST_POINTS} />
          </div>
          <div className="w-feature-visual">
            <DuesMock />
          </div>
        </section>
      </div>

      <section className="w-band">
        <div className="w-container w-section">
          <div className="w-section-head">
            <span className="w-eyebrow dark">The problem</span>
            <h2>Why gyms fail to collect pending dues</h2>
            <p>Most dues are not refused. They are forgotten, because nobody keeps a proper list.</p>
          </div>
          <Cards items={PROBLEMS} />
        </div>
      </section>

      <section className="w-container w-section">
        <div className="w-section-head">
          <span className="w-eyebrow dark">How it works</span>
          <h2>How GymSolution helps you collect gym dues</h2>
          <p>From the first part payment to the last rupee collected, in four simple steps.</p>
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
            <h2>Track every due, payment and promise</h2>
            <p>Each member’s fees, payments and balance in one place, so no due is ever lost.</p>
          </div>
          <Cards items={TRACKED} />
        </div>
      </section>

      <div className="w-container">
        <section className="w-feature">
          <div className="w-feature-text">
            <span className="w-icon tone-green">
              <Icon name="chat" />
            </span>
            <h2>Remind members about dues on WhatsApp in one tap</h2>
            <p>
              Asking for money is easier when the message is already written. GymSolution writes a short, polite balance reminder with the exact amount, and
              opens it in WhatsApp from your own gym number.
            </p>
            <Points items={MESSAGE_POINTS} />
          </div>
          <div className="w-feature-visual">
            <DuesChatMock />
          </div>
        </section>
      </div>

      <section className="w-band">
        <div className="w-container w-section">
          <div className="w-section-head">
            <span className="w-eyebrow dark">Why it helps</span>
            <h2>How dues collection software helps your gym</h2>
            <p>More money collected, with less chasing and no awkward conversations.</p>
          </div>
          <Cards items={BENEFITS} />
        </div>
      </section>

      <section className="w-container w-section">
        <div className="w-section-head">
          <span className="w-eyebrow dark">Register or software</span>
          <h2>Gym dues in a register vs with dues collection software</h2>
          <p>The same dues, tracked properly and collected on time.</p>
        </div>
        <div className="w-table-wrap">
          <table className="w-compare">
            <thead>
              <tr>
                <th scope="col">Job</th>
                <th scope="col">Register and memory</th>
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
              <span>Dues collection from</span>
              <p className="w-price-amount">
                {rupees(STARTER)}
                <small>/ year</small>
              </p>
              <p>About ₹{perMonth(STARTER)} a month, in every plan. Collect one forgotten due and it has paid for itself.</p>
              <Link to="/gym-management-software-pricing" className="w-btn light">
                See all plans
                <Icon name="arrow" />
              </Link>
            </div>
            <div className="w-price-text">
              <span className="w-eyebrow dark">More than dues</span>
              <h2>Dues collection inside complete gym management software</h2>
              <p>
                Dues come from memberships, so GymSolution keeps them together: your members, renewals and payments, plus your expenses, supplement stock
                and monthly profit, in one app.
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
            See the <Link to="/gym-membership-renewal-software">gym membership renewal software</Link>, the{' '}
            <Link to="/gym-expense-tracking-software">gym expense tracking software</Link>, or <Link to="/features">all GymSolution features</Link>.
          </p>
        </div>
      </section>

      <Faq title="Gym dues collection software: common questions" items={FAQS}>
        <p className="w-after">
          <Link to="/gym-management-app-free">Start with a free trial</Link> or <Link to="/gym-management-software-pricing">see GymSolution pricing</Link>.
        </p>
      </Faq>

      <CtaBand />
    </SiteLayout>
  )
}
