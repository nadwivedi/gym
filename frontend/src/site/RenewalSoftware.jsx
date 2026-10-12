import { Link } from 'react-router-dom'
import { Icon } from '../components/ui.jsx'
import Faq from './Faq.jsx'
import { ReminderChatMock, RenewalsMock } from './mocks.jsx'
import { OFFERS, PRO, STARTER, perMonth, rupees } from './pricing.js'
import SiteLayout, { CtaBand } from './SiteLayout.jsx'
import { whatsappLink } from './whatsapp.js'

const PAGE_URL = 'https://gymsolution.in/gym-membership-renewal-software'
const TRIAL_URL = whatsappLink('Hi, I want to try the GymSolution gym membership renewal software for my gym.')

// The renewal lists, as the app shows them.
const FIND_POINTS = [
  'Overdue: memberships that ended and were not renewed',
  'Due today: members to catch at the counter today',
  'Next 7 days: renewals coming up this week',
  'Starting soon: renewals paid in advance, waiting to begin',
  'Search any list by member name or mobile number',
  'Call or WhatsApp the member in one tap from the list',
]

// Why renewals slip through. [icon, colour, heading, text]
const PROBLEMS = [
  ['receipt', 'orange', 'Renewal dates hide in registers', 'When dates are written in a register, nobody sees that a membership ended until the member has already stopped coming.'],
  ['phone', 'purple', 'No time to call everyone', 'Calling members one by one takes hours. On a busy day the calls are skipped, and those members are lost.'],
  ['alert', 'blue', 'No follow-up after expiry', 'A member who did not renew last week is easy to forget. Without a list, nobody follows up again.'],
]

// [heading, text]
const RENEW_STEPS = [
  ['Find the member', 'Open the renewal list, or search by name or mobile number. Every member whose plan is ending is already there.'],
  ['Tap Renew and pick the plan', 'Renew on the same plan or a new one. The new membership continues from the old renewal date, so no days are lost or added by mistake.'],
  ['Take the payment', 'Record the full fee, or a part payment with the date the rest is promised. Cash, UPI, card and bank payments are kept separately.'],
  ['Next renewal date is set', 'GymSolution works out the next renewal date for you and moves the member off the due list.'],
]

// Everything tracked per member. [icon, colour, heading, text]
const TRACKED = [
  ['calendar', 'purple', 'Renewal date and plan', 'Each member’s current plan, start date, renewal date and days left, always up to date.'],
  ['receipt', 'blue', 'Full renewal history', 'Every admission, renewal and rejoin the member has ever had, with the plan and fee of each.'],
  ['rupee', 'green', 'Payments and pending dues', 'Every payment against each renewal, and the balance still due, so part payments are never forgotten.'],
  ['bell', 'orange', 'Promised payment dates', 'When a member says “I will pay the rest on Friday”, note the date and see it on their profile and in the dues list.'],
  ['users', 'blue', 'Members who stopped coming', 'Members overdue for a long time are flagged as likely not coming. Hide them to keep the list clean, and bring them back if they rejoin.'],
  ['upload', 'purple', 'Export to Excel', 'Download members with their plan, renewal date and balance to Excel whenever you want.'],
]

// The automatic messages (Pro plan).
const MESSAGE_POINTS = [
  'Sent automatically on the renewal date',
  'Sent again 2 days later if the member has not renewed',
  'Never sent to members who already renewed or were hidden',
  'From your own gym WhatsApp number, with the member’s name and date',
  'Only between 8 am and 9 pm, at a safe, human pace',
  'A log of every message: sent, waiting or failed',
]

// [the job, by hand, with GymSolution]
const COMPARE = [
  ['Finding renewals', 'Turning register pages every morning', 'Overdue, due today and next 7 days, listed for you'],
  ['Reminding members', 'Calling or messaging each member yourself', 'Automatic WhatsApp message on the renewal date (Pro plan)'],
  ['Renewal date', 'Counted by hand, easy to get wrong', 'Worked out for you from the plan'],
  ['Part payments', 'Written on a slip or remembered', 'Balance and promised date kept with the member'],
  ['Members who left', 'Stay in the register forever', 'Flagged, hidden, and brought back if they rejoin'],
]

const FAQS = [
  {
    q: 'What is gym membership renewal software?',
    a: 'It is software that keeps every member’s renewal date for you, lists whose membership is ending or has ended, and helps you renew them and remind them on time. GymSolution does all of this, and can also send the renewal reminder on WhatsApp automatically.',
  },
  {
    q: 'How does GymSolution find members whose renewal is due?',
    a: 'It works out every member’s renewal date from their plan and start date, and sorts members into lists: overdue, due today, due in the next 7 days, and starting soon. The lists update by themselves every day.',
  },
  {
    q: 'Can it send renewal reminders to members automatically?',
    a: `Yes, on the Pro plan (${rupees(PRO)} a year). A WhatsApp message goes to the member on the renewal date, and again 2 days later if they have not renewed, from your own gym number. Members who already renewed are skipped.`,
    link: ['/whatsapp-automation-for-gyms', 'How the WhatsApp reminders work.'],
  },
  {
    q: 'What happens when a member renews late?',
    a: 'The new membership can continue from the old renewal date, so the member does not get free days, or start from today if they were away for a long time. GymSolution shows both choices and sets the new renewal date.',
  },
  {
    q: 'Can I take a part payment on a renewal?',
    a: 'Yes. Record whatever the member pays now, and the balance stays on the member until it is paid. You can also note the date they promised to pay the rest.',
    link: ['/gym-dues-collection-software', 'More on the gym dues collection software.'],
  },
  {
    q: 'What about members who stopped coming?',
    a: 'Members who have been overdue for many days are flagged as likely not coming. Hide them so the renewal list shows only members you can still win back. If they return, rejoin them in one tap with their history intact.',
  },
  {
    q: 'How much does the gym membership renewal software cost?',
    a: `Renewal tracking is in every plan, starting at ${rupees(STARTER)} a year (about ₹${perMonth(STARTER)} a month). Automatic WhatsApp renewal reminders come with the Pro plan at ${rupees(PRO)} a year.`,
    link: ['/gym-management-software-pricing', 'See all plans.'],
  },
  {
    q: 'Does it work on my phone?',
    a: 'Yes. GymSolution runs in the browser on any phone or computer, so you can check renewals at the counter or from home. There is nothing to install.',
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
    description: 'Gym membership renewal software: lists overdue and due renewals, tracks renewal dates, payments and dues, and sends automatic WhatsApp renewal reminders to members.',
    featureList: [
      'Overdue, due today and next 7 days renewal lists',
      'One-tap membership renewal with automatic renewal date',
      'Part payments and pending dues',
      'Automatic WhatsApp renewal reminders',
      'Renewal and payment history for every member',
    ],
    offers: OFFERS,
  },
  {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://gymsolution.in/' },
      { '@type': 'ListItem', position: 2, name: 'Gym Membership Renewal Software', item: PAGE_URL },
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

export default function RenewalSoftware() {
  return (
    <SiteLayout
      title="Gym Membership Renewal Software – Track Renewals & Send Reminders | GymSolution"
      description={`GymSolution gym membership renewal software finds every renewal that is due or overdue, tracks each member’s plan, payments and dues, and sends automatic WhatsApp renewal reminders. From ${rupees(STARTER)}/year.`}
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(STRUCTURED) }} />

      <section className="w-hero small">
        <div className="w-container w-page-head">
          <span className="w-eyebrow">Never miss a renewal</span>
          <h1>Gym Membership Renewal Software</h1>
          <p>
            GymSolution finds every member whose membership is due or overdue, keeps all their renewal details in one place, and sends renewal reminders on
            WhatsApp automatically. Renew a member in a few taps, from your phone or computer.
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
              <Icon name="calendar" />
            </span>
            <h2>Find every membership renewal in one screen</h2>
            <p>
              Open GymSolution in the morning and the day’s renewals are waiting. No register to turn, no dates to count: every member is sorted by when
              their membership ends.
            </p>
            <Points items={FIND_POINTS} />
          </div>
          <div className="w-feature-visual">
            <RenewalsMock />
          </div>
        </section>
      </div>

      <section className="w-band">
        <div className="w-container w-section">
          <div className="w-section-head">
            <span className="w-eyebrow dark">The problem</span>
            <h2>Why gyms lose members at renewal time</h2>
            <p>Most members do not leave on purpose. Their membership ends, nobody reminds them, and the habit breaks.</p>
          </div>
          <Cards items={PROBLEMS} />
        </div>
      </section>

      <section className="w-container w-section">
        <div className="w-section-head">
          <span className="w-eyebrow dark">Renew in seconds</span>
          <h2>How to renew a gym membership in GymSolution</h2>
          <p>Four quick steps at the counter, and the member is renewed with the right dates and payment.</p>
        </div>
        <ol className="w-steps">
          {RENEW_STEPS.map(([title, text], i) => (
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
            <h2>Track every detail of every membership renewal</h2>
            <p>Each member’s renewals, payments and dues in one place, so you always know where every membership stands.</p>
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
            <h2>Automatic renewal reminders on WhatsApp</h2>
            <p>
              The best renewal reminder is the one nobody has to remember to send. On the Pro plan, GymSolution messages each member on WhatsApp when their
              membership ends, so they come back to renew without a single phone call from you.
            </p>
            <Points items={MESSAGE_POINTS} />
            <Link to="/whatsapp-automation-for-gyms" className="w-more">
              More on WhatsApp automation <Icon name="arrow" />
            </Link>
          </div>
          <div className="w-feature-visual">
            <ReminderChatMock />
          </div>
        </section>
      </div>

      <section className="w-band">
        <div className="w-container w-section">
          <div className="w-section-head">
            <span className="w-eyebrow dark">Register or software</span>
            <h2>Gym renewals in a register vs with renewal software</h2>
            <p>The same renewal work, with far less effort and far fewer members lost.</p>
          </div>
          <div className="w-table-wrap">
            <table className="w-compare">
              <thead>
                <tr>
                  <th scope="col">Renewal job</th>
                  <th scope="col">Register and phone calls</th>
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
        </div>
      </section>

      <section className="w-container w-section">
        <div className="w-price">
          <div className="w-price-card">
            <span>Renewal software from</span>
            <p className="w-price-amount">
              {rupees(STARTER)}
              <small>/ year</small>
            </p>
            <p>About ₹{perMonth(STARTER)} a month. Automatic WhatsApp reminders from {rupees(PRO)} a year.</p>
            <Link to="/gym-management-software-pricing" className="w-btn light">
              See all plans
              <Icon name="arrow" />
            </Link>
          </div>
          <div className="w-price-text">
            <span className="w-eyebrow dark">More than renewals</span>
            <h2>Renewal software that also runs the rest of your gym</h2>
            <p>
              Renewals are where a gym earns most of its income, so GymSolution starts there. The same app also keeps your member records, payments,
              expenses, monthly profit and supplement stock, so you do not need a second software for the rest.
            </p>
            <ul className="w-ticks">
              <li>
                <Icon name="check" />
                Member records
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
          See <Link to="/features">all GymSolution features</Link>, or read why it is <Link to="/affordable-gym-management-software">affordable gym management software</Link>.
        </p>
      </section>

      <Faq title="Gym membership renewal software: common questions" items={FAQS} band>
        <p className="w-after">
          <Link to="/gym-management-app-free">Start with a free trial</Link> or <Link to="/gym-management-software-pricing">see GymSolution pricing</Link>.
        </p>
      </Faq>

      <CtaBand />
    </SiteLayout>
  )
}
