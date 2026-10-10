import { Link } from 'react-router-dom'
import { Icon } from '../components/ui.jsx'
import Faq from './Faq.jsx'
import SiteLayout, { CtaBand } from './SiteLayout.jsx'
import { whatsappLink } from './whatsapp.js'

const TRIAL_URL = whatsappLink('Hi, I want to try GymSolution WhatsApp automation for my gym.')

const MESSAGE_POINTS = [
  'The member’s name, your gym’s name and the date are filled in for you',
  'Sent on the renewal date',
  'Sent once more two days later if they still have not renewed',
  'Never more than two reminders for one renewal',
]

const STEPS = [
  ['Link your gym’s WhatsApp number', 'Scan a QR code once from WhatsApp’s Linked devices screen. Your gym number is now connected to GymSolution.'],
  ['Keep your memberships up to date', 'Add members and renewals as usual. The software knows every member’s renewal date.'],
  ['Reminders go out by themselves', 'On the renewal date the member gets a WhatsApp message from your gym number. You just collect the fee.'],
]

// [icon, colour, heading, text]
const AUTOMATED = [
  ['calendar', 'blue', 'Renewal-day reminders', 'Each member gets a WhatsApp reminder on the day their membership is due, without anyone at the gym lifting a finger.'],
  ['chat', 'green', 'A follow-up two days later', 'If the member still has not renewed, one polite follow-up goes out two days after the renewal date.'],
  ['phone', 'purple', 'Your own gym number', 'Messages come from your gym’s WhatsApp number, so members recognise you and reply straight to you.'],
  ['shield', 'orange', 'No unwanted messages', 'Members who have already renewed, or whom you have hidden, are skipped automatically.'],
  ['receipt', 'blue', 'A log of every message', 'See which reminders were sent, which are waiting and which could not be delivered.'],
  ['settings', 'green', 'On or off in one tap', 'Pause the automatic reminders whenever you like, and switch them back on just as easily.'],
]

const ONE_TAP_POINTS = [
  'A WhatsApp button beside every member in the renewal, payment and member lists',
  'The message is already written: pending balance, renewal due or membership expired',
  'Read it, change it if you like, and press send',
]

const FAQS = [
  {
    q: 'What is WhatsApp automation for gyms?',
    a: 'It means routine messages to members, such as renewal reminders, are sent on WhatsApp automatically instead of being typed one by one. GymSolution knows every member’s renewal date and sends the reminder for you.',
  },
  {
    q: 'Which WhatsApp number are the reminders sent from?',
    a: 'From your own gym number, whether it is on WhatsApp or the WhatsApp Business app. You link it once by scanning a QR code, and members see and reply to the number they already know.',
  },
  {
    q: 'Do I need the WhatsApp Business API?',
    a: 'No. You link your number from WhatsApp’s Linked devices screen, the same way you would open WhatsApp on a computer. There is no API to apply for and no message templates to get approved.',
  },
  {
    q: 'How many reminders does a member get, and when?',
    a: 'At most two for each renewal: one on the renewal date and one two days later if they have not renewed, both sent between 8 am and 9 pm. Members who have already renewed, or whom you have hidden, are skipped.',
  },
  {
    q: 'What does the gym fee reminder message say?',
    a: '“Hi [member name], your membership at [gym name] ended on [date]. Please renew to continue your workouts. Thank you!” The name, gym and date are filled in for each member. The automatic text stays the same on purpose, so every reminder is short and polite.',
  },
  {
    q: 'Will my WhatsApp number get blocked for sending reminders?',
    a: 'GymSolution sends at a slow, human pace so your number does not look like a bulk sender: a few seconds apart, at most 10 an hour and 40 a day, and only to your own members about their own membership. Anything over the limit waits for the next hour or day. WhatsApp always has the final say over any account, so keep the number for your gym’s own members.',
  },
  {
    q: 'Can I send a reminder before the renewal date, or for a pending balance?',
    a: 'Yes, in one tap. Every member has a WhatsApp button that opens the chat with the message already written for an upcoming renewal or a pending balance. Read it, change it if you like, and press send.',
  },
  { q: 'Can I see which reminders were sent?', a: 'Yes. The WhatsApp page keeps a log of recent messages with their status: sent, waiting, failed or not needed.' },
]

// What search engines read about the page: the software. The questions are added by Faq.
const STRUCTURED = [
  {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'GymSolution',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    description: 'WhatsApp automation for gyms: automatic renewal reminders to members from the gym’s own WhatsApp number, with member, payment and expense management.',
    offers: { '@type': 'Offer', price: '150', priceCurrency: 'INR', description: 'Free trial available. Paid plans start at this price per month.' },
  },
]

// What a member sees on their phone: the reminder GymSolution sends (the app's own wording), then the follow-up.
function MemberChat() {
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
        <div className="m-wa-date">5 October · renewal date</div>
        <div className="m-bubble">
          Hi Rahul Verma, your membership at Iron Fitness Gym ended on 5 Oct 2026. Please renew to continue your workouts. Thank you!
          <small>9:00 AM</small>
        </div>
        <div className="m-wa-date">7 October · two days later</div>
        <div className="m-bubble">
          Hi Rahul Verma, your membership at Iron Fitness Gym ended on 5 Oct 2026. Please renew to continue your workouts. Thank you!
          <small>9:00 AM</small>
        </div>
        <div className="m-bubble me">
          Sorry sir, coming today to renew 👍
          <small>9:20 AM ✓✓</small>
        </div>
      </div>
    </div>
  )
}

// What the gym owner sees: the messages the app writes when they tap a member's WhatsApp button.
function OwnerChat() {
  return (
    <div className="m-frame m-wa" aria-hidden="true">
      <div className="m-bar wa">
        <span className="m-avatar">PS</span>
        <div className="m-row-main">
          <b>Priya Singh</b>
          <small>Member #24</small>
        </div>
      </div>
      <div className="m-body m-wa-body">
        <div className="m-wa-date">Renewal coming up</div>
        <div className="m-bubble me">
          Hi Priya Singh, your membership at Iron Fitness Gym is due for renewal on 12 Oct 2026.
          <small>6:10 PM ✓✓</small>
        </div>
        <div className="m-wa-date">Balance pending</div>
        <div className="m-bubble me">
          Hi Priya Singh, a balance of ₹500 is pending for your membership at Iron Fitness Gym.
          <small>6:12 PM ✓✓</small>
        </div>
        <div className="m-bubble">
          Ok, I will pay tomorrow
          <small>6:30 PM</small>
        </div>
      </div>
    </div>
  )
}

export default function WhatsAppAutomation() {
  return (
    <SiteLayout
      title="WhatsApp Automation for Gyms – Automatic Renewal Reminders | GymSolution"
      description="WhatsApp automation for gyms with GymSolution: renewal reminders go to your members automatically from your own gym WhatsApp number. See the messages, how it works and how to start free."
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(STRUCTURED) }} />

      <section className="w-hero small">
        <div className="w-container w-page-head">
          <span className="w-eyebrow">WhatsApp reminders on autopilot</span>
          <h1>WhatsApp Automation for Gyms</h1>
          <p>
            GymSolution sends renewal reminders to your members on WhatsApp automatically, from your own gym number. No more calling or messaging members one
            by one.
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
            <span className="w-icon tone-green">
              <Icon name="chat" />
            </span>
            <h2>The WhatsApp message your members receive</h2>
            <p>
              This is the reminder GymSolution sends for you. It is short, polite and personal, and it reaches the member on the app they open most: WhatsApp.
            </p>
            <ul className="w-points">
              {MESSAGE_POINTS.map((point) => (
                <li key={point}>
                  <Icon name="check" />
                  {point}
                </li>
              ))}
            </ul>
          </div>
          <div className="w-feature-visual">
            <MemberChat />
          </div>
        </section>
      </div>

      <section className="w-band">
        <div className="w-container w-section">
          <div className="w-section-head">
            <span className="w-eyebrow dark">How it works</span>
            <h2>How WhatsApp automation works for your gym</h2>
            <p>Set it up once. After that the reminders look after themselves.</p>
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
          <span className="w-eyebrow dark">What gets automated</span>
          <h2>Gym WhatsApp automation that works while you train your members</h2>
          <p>Everything about renewal reminders, handled for you.</p>
        </div>
        <div className="w-grid three">
          {AUTOMATED.map(([icon, tone, title, text]) => (
            <div key={title} className="w-card plain">
              <span className={`w-icon tone-${tone}`}>
                <Icon name={icon} />
              </span>
              <h3>{title}</h3>
              <p>{text}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="w-container">
        <section className="w-feature">
          <div className="w-feature-text">
            <span className="w-icon tone-blue">
              <Icon name="send" />
            </span>
            <h2>Send a WhatsApp message to any member in one tap</h2>
            <p>
              Some messages you want to send yourself. GymSolution writes those too: tap the WhatsApp button beside a member and the chat opens with the
              message ready.
            </p>
            <ul className="w-points">
              {ONE_TAP_POINTS.map((point) => (
                <li key={point}>
                  <Icon name="check" />
                  {point}
                </li>
              ))}
            </ul>
          </div>
          <div className="w-feature-visual">
            <OwnerChat />
          </div>
        </section>
      </div>

      <Faq title="WhatsApp automation for gyms: common questions" items={FAQS} band>
        <p className="w-after">
          <Link to="/gym-management-app-free">Start with a free trial</Link> or <Link to="/affordable-gym-management-software">see GymSolution pricing</Link>.
        </p>
      </Faq>

      <CtaBand />
    </SiteLayout>
  )
}
