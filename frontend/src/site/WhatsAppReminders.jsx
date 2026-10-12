import { Link } from 'react-router-dom'
import { Icon } from '../components/ui.jsx'
import Faq from './Faq.jsx'
import { DuesChatMock, ReminderChatMock } from './mocks.jsx'
import { OFFERS, PRO, STARTER, rupees } from './pricing.js'
import SiteLayout, { CtaBand } from './SiteLayout.jsx'
import { whatsappLink } from './whatsapp.js'

const PAGE_URL = 'https://gymsolution.in/whatsapp-reminder-software-for-gym'
const TRIAL_URL = whatsappLink('Hi, I want to try GymSolution WhatsApp reminders for my gym.')

// One member's renewal, as the reminder job (services/whatsapp/reminders.js) handles it. [day, heading, text]
const TIMELINE = [
  ['A few days before', 'Upcoming renewal', 'The member shows in “Next 7 days”. Tap WhatsApp beside them and a message with their renewal date is ready to send.'],
  ['Renewal date', 'First automatic reminder', 'If they have not renewed, GymSolution sends: “Hi Rahul, your membership at Iron Fitness ended on 12 Oct. Please renew to continue your workouts.”'],
  ['2 days later', 'One follow-up', 'Still not renewed? One more reminder goes out. That is the last automatic message for this renewal.'],
  ['When they renew', 'Reminders stop', 'Renew the member and any reminder still waiting is marked “Not needed” and never sent.'],
]

// Which reminders exist and how they are sent. [reminder, how it is sent, plan]
const TYPES = [
  ['Expired membership (on the renewal date)', 'Automatic, from your gym’s WhatsApp number', 'Pro and Multi-Gym'],
  ['Follow-up 2 days after expiry', 'Automatic, only if still not renewed', 'Pro and Multi-Gym'],
  ['Upcoming renewal', 'One tap: message written for you, you press send', 'Every plan'],
  ['Pending balance / payment follow-up', 'One tap: message with the exact balance', 'Every plan'],
  ['Offers, festival wishes, broadcasts', 'Not supported: GymSolution does not send marketing messages', '—'],
]

// What the reminder software does. [icon, colour, heading, text]
const FEATURES = [
  ['phone', 'green', 'From your own number', 'Link your gym’s WhatsApp or WhatsApp Business number once by scanning a QR code. Members see a number they know.'],
  ['calendar', 'blue', 'Sent on the right day', 'The software knows every renewal date, so the reminder goes out on the day the membership ends, not when someone remembers.'],
  ['shield', 'purple', 'Never pesters members', 'At most two automatic reminders per renewal. Members who renewed or were hidden are skipped.'],
  ['bell', 'orange', 'Only at sensible hours', 'Messages are sent between 8 am and 9 pm, a few seconds apart, never at night.'],
  ['receipt', 'blue', 'A log of every message', 'See each reminder as Sent, Waiting, Failed or Not needed, with the reason if it could not be delivered.'],
  ['settings', 'green', 'On or off in one tap', 'Pause automatic reminders from the WhatsApp page whenever you want, and switch them back on later.'],
]

// Benefits. [icon, colour, heading, text]
const BENEFITS = [
  ['calendar', 'blue', 'Fewer missed renewals', 'Every expired membership gets a reminder, even on the days nobody at the counter has time.'],
  ['bolt', 'orange', 'Less manual follow-up', 'No more calling members one by one or typing the same message twenty times a week.'],
  ['chat', 'green', 'Better member communication', 'Short, polite messages on the app members open most, from a number they recognise.'],
  ['users', 'purple', 'Better retention', 'Members who lapse are reminded while the habit is still fresh, so more of them come back.'],
]

// Real situations. [heading, text]
const USE_CASES = [
  ['A busy Monday', 'Fifteen memberships end on the 1st of the month. Reminders go out through the day while you handle the rush at the counter.'],
  ['You are away', 'You are at a family function for three days. Reminders keep going out from your gym number without you opening the app.'],
  ['A member who forgot', 'Priya’s quarterly plan ended on Sunday. She gets the reminder on Sunday, renews on Tuesday after the follow-up, and the reminders stop.'],
  ['Collecting a balance', 'Aman still owes ₹1,300. Open Pending Dues, tap WhatsApp, and the message with the exact amount is ready.'],
]

const FAQS = [
  {
    q: 'What is WhatsApp reminder software for gyms?',
    a: 'It is software that sends membership reminders to gym members on WhatsApp for you. GymSolution knows every member’s renewal date and sends the reminder automatically from your gym’s own WhatsApp number when their membership ends.',
  },
  {
    q: 'Which reminders are sent automatically?',
    a: 'Expired-membership reminders: one on the renewal date and one follow-up two days later if the member has not renewed. Reminders for upcoming renewals and pending balances are written for you and sent in one tap, so you decide when to send them.',
  },
  {
    q: 'What does the automatic reminder say?',
    a: '“Hi [name], your membership at [gym name] ended on [date]. Please renew to continue your workouts. Thank you!” The name, gym and date are filled in for each member. The text is fixed so every reminder stays short and polite.',
  },
  {
    q: 'Is there a limit on how many reminders are sent?',
    a: 'Yes, on purpose. To keep your number from looking like a bulk sender, GymSolution sends at most 10 reminders an hour and 40 a day. Anything over the limit waits for the next hour or day and still goes out.',
  },
  {
    q: 'Do I need the WhatsApp Business API?',
    a: 'No. You link your existing gym number by scanning a QR code from WhatsApp’s Linked devices screen. There is no API to apply for, no message templates to get approved and no charge per message.',
    link: ['/whatsapp-automation-for-gyms', 'More on WhatsApp automation for gyms.'],
  },
  {
    q: 'Can I use it for WhatsApp marketing, like offers or festival wishes?',
    a: 'No. GymSolution sends renewal reminders to your own members only, and does not send bulk or promotional messages. This keeps your gym number safe and your members happy.',
  },
  {
    q: 'Will my number get blocked?',
    a: 'GymSolution sends slowly, a few seconds apart, only between 8 am and 9 pm, and only to your own members about their own membership. That is how a person would send them. WhatsApp always has the final say over any account, so keep the number for your gym’s members.',
  },
  {
    q: 'Which plan includes automatic WhatsApp reminders?',
    a: `The Pro plan at ${rupees(PRO)} a year and the Multi-Gym plan. The Starter plan at ${rupees(STARTER)} a year includes the one-tap WhatsApp messages but not the automatic ones.`,
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
      'WhatsApp reminder software for gyms: automatic expired-membership reminders from the gym’s own WhatsApp number on the renewal date and two days later, plus one-tap messages for upcoming renewals and pending dues.',
    featureList: [
      'Automatic WhatsApp reminder on the renewal date',
      'One follow-up two days later if not renewed',
      'One-tap messages for upcoming renewals and pending balances',
      'Sent from the gym’s own WhatsApp number',
      'Message log with sent, waiting, failed and not needed',
    ],
    offers: OFFERS,
  },
  {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://gymsolution.in/' },
      { '@type': 'ListItem', position: 2, name: 'WhatsApp Reminder Software for Gym', item: PAGE_URL },
    ],
  },
]

function Cards({ items, columns = 'three' }) {
  return (
    <div className={`w-grid ${columns}`}>
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

function Steps({ items }) {
  return (
    <ol className="w-steps">
      {items.map(([title, text, extra], i) => (
        <li key={title}>
          <span className="w-step-num">{i + 1}</span>
          <h3>{extra ? `${title}: ${text}` : title}</h3>
          <p>{extra || text}</p>
        </li>
      ))}
    </ol>
  )
}

export default function WhatsAppReminders() {
  return (
    <SiteLayout
      title="WhatsApp Reminder Software for Gym – Automatic Renewal Reminders | GymSolution"
      description={`GymSolution WhatsApp reminder software for gyms sends membership renewal reminders automatically from your own gym number, with one-tap messages for upcoming renewals and pending dues. See exactly how it works.`}
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(STRUCTURED) }} />

      <section className="w-hero small">
        <div className="w-container w-page-head">
          <span className="w-eyebrow">Gym renewal reminder system</span>
          <h1>WhatsApp Reminder Software for Gyms</h1>
          <p>
            When a membership ends, GymSolution reminds the member on WhatsApp from your own gym number, and follows up once if they have not renewed. For
            upcoming renewals and pending dues, the message is written for you and sent in one tap.
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

      <section className="w-container w-section">
        <div className="w-section-head">
          <span className="w-eyebrow dark">How reminders work</span>
          <h2>One member’s renewal, from reminder to renewal</h2>
          <p>Here is exactly what happens around a single renewal date. No guesswork, and no flood of messages.</p>
        </div>
        <Steps items={TIMELINE} />
      </section>

      <section className="w-band">
        <div className="w-container w-section">
          <div className="w-feature">
            <div className="w-feature-text">
              <span className="w-icon tone-green">
                <Icon name="chat" />
              </span>
              <h2>Automated WhatsApp reminders for expired memberships</h2>
              <p>
                This is the message your member receives. It comes from your gym’s number, uses their name and the date, and goes out on its own on the Pro
                plan.
              </p>
              <ul className="w-points">
                <li>
                  <Icon name="check" />
                  On the renewal date, and once more 2 days later
                </li>
                <li>
                  <Icon name="check" />
                  Skipped for members who renewed or were hidden
                </li>
                <li>
                  <Icon name="check" />
                  Sent between 8 am and 9 pm
                </li>
              </ul>
            </div>
            <div className="w-feature-visual">
              <ReminderChatMock />
            </div>
          </div>
        </div>
      </section>

      <section className="w-container w-section">
        <div className="w-section-head">
          <span className="w-eyebrow dark">Every reminder, explained</span>
          <h2>Which gym membership reminders GymSolution sends</h2>
          <p>Some reminders are automatic, some are one tap, and one kind is not offered at all. Here is the full list.</p>
        </div>
        <div className="w-table-wrap">
          <table className="w-compare">
            <thead>
              <tr>
                <th scope="col">Reminder</th>
                <th scope="col">How it is sent</th>
                <th scope="col">Plan</th>
              </tr>
            </thead>
            <tbody>
              {TYPES.map(([kind, how, plan]) => (
                <tr key={kind}>
                  <th scope="row">{kind}</th>
                  <td>{how}</td>
                  <td>{plan}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="w-band">
        <div className="w-container w-section">
          <div className="w-feature">
            <div className="w-feature-text">
              <span className="w-icon tone-orange">
                <Icon name="rupee" />
              </span>
              <h2>Payment follow-ups and upcoming renewals in one tap</h2>
              <p>
                Some messages are better sent by you, at the right moment. Tap the WhatsApp button beside a member in the renewal, dues or member lists and
                the chat opens with the message already written.
              </p>
              <ul className="w-points">
                <li>
                  <Icon name="check" />
                  Upcoming renewal: “your membership is due for renewal on 12 Oct”
                </li>
                <li>
                  <Icon name="check" />
                  Pending balance: “a balance of ₹1,300 is pending”
                </li>
                <li>
                  <Icon name="check" />
                  Read it, change it if you like, and press send
                </li>
              </ul>
              <Link to="/gym-dues-collection-software" className="w-more">
                More on dues collection <Icon name="arrow" />
              </Link>
            </div>
            <div className="w-feature-visual">
              <DuesChatMock />
            </div>
          </div>
        </div>
      </section>

      <section className="w-container w-section">
        <div className="w-section-head">
          <span className="w-eyebrow dark">Features</span>
          <h2>Gym WhatsApp automation that stays polite and safe</h2>
          <p>Built for a gym’s own members and its own number, not for bulk messaging.</p>
        </div>
        <Cards items={FEATURES} />
      </section>

      <section className="w-band">
        <div className="w-container w-section">
          <div className="w-section-head">
            <span className="w-eyebrow dark">Honest limits</span>
            <h2>What the reminder software does not do</h2>
            <p>Knowing the limits up front saves surprises later.</p>
          </div>
          <div className="w-grid three">
            <div className="w-card plain">
              <span className="w-icon tone-orange">
                <Icon name="alert" />
              </span>
              <h3>Not unlimited</h3>
              <p>At most 10 reminders an hour and 40 a day, to protect your number. Extra reminders wait and go out in the next hour or day.</p>
            </div>
            <div className="w-card plain">
              <span className="w-icon tone-purple">
                <Icon name="send" />
              </span>
              <h3>No marketing broadcasts</h3>
              <p>No offers, festival greetings or bulk messages to everyone. Reminders go only to members whose membership has ended.</p>
            </div>
            <div className="w-card plain">
              <span className="w-icon tone-blue">
                <Icon name="edit" />
              </span>
              <h3>Fixed automatic text</h3>
              <p>The automatic reminder text cannot be edited, so it always stays short and polite. One-tap messages can be changed before sending.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="w-container w-section">
        <div className="w-section-head">
          <span className="w-eyebrow dark">Real situations</span>
          <h2>How gyms use WhatsApp reminders every week</h2>
          <p>Ordinary days at a gym, and what the reminder system does for you.</p>
        </div>
        <Steps items={USE_CASES} />
      </section>

      <section className="w-band">
        <div className="w-container w-section">
          <div className="w-section-head">
            <span className="w-eyebrow dark">Why it matters</span>
            <h2>Benefits of a gym renewal reminder system</h2>
            <p>Most members do not leave on purpose. They just were not reminded in time.</p>
          </div>
          <Cards items={BENEFITS} columns="" />
          <p className="w-after">
            Reminders work because they sit on top of your renewal records. See the{' '}
            <Link to="/gym-membership-renewal-software">gym membership renewal software</Link> and the{' '}
            <Link to="/gym-membership-management-software">membership management software</Link>.
          </p>
        </div>
      </section>

      <section className="w-container w-section">
        <div className="w-price">
          <div className="w-price-card">
            <span>Automatic WhatsApp reminders</span>
            <p className="w-price-amount">
              {rupees(PRO)}
              <small>/ year</small>
            </p>
            <p>Pro plan, with the complete gym management software. No charge per message.</p>
            <Link to="/gym-management-software-pricing" className="w-btn light">
              See all plans
              <Icon name="arrow" />
            </Link>
          </div>
          <div className="w-price-text">
            <span className="w-eyebrow dark">More than reminders</span>
            <h2>Reminders inside complete gym management software</h2>
            <p>
              The same account keeps your members, renewals, payments and dues, plus expenses, profit and supplement stock, so the reminders always use
              up-to-date dates and balances.
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
          New to WhatsApp automation? Read <Link to="/whatsapp-automation-for-gyms">WhatsApp automation for gyms</Link>, or{' '}
          <Link to="/gym-management-app-free">start a free trial</Link>.
        </p>
      </section>

      <Faq title="WhatsApp reminder software for gyms: common questions" items={FAQS} band>
        <p className="w-after">
          <Link to="/gym-management-app-free">Start with a free trial</Link> or <Link to="/gym-management-software-pricing">see GymSolution pricing</Link>.
        </p>
      </Faq>

      <CtaBand />
    </SiteLayout>
  )
}
