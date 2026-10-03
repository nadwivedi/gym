import { Icon } from '../components/ui.jsx'
import { FEATURES } from './features.js'
import { DashboardMock, ExpensesMock, InventoryMock, MembersMock, MultiGymMock, RenewalsMock, StaffMock, TrainersMock, WhatsAppMock } from './mocks.jsx'
import SiteLayout, { CtaBand } from './SiteLayout.jsx'

const MOCKS = {
  renewals: RenewalsMock,
  members: MembersMock,
  whatsapp: WhatsAppMock,
  expenses: ExpensesMock,
  dashboard: DashboardMock,
  'multi-gym': MultiGymMock,
  staff: StaffMock,
  trainers: TrainersMock,
  inventory: InventoryMock,
}

export default function Features() {
  return (
    <SiteLayout title="Features – GymSolution Gym Management Software">
      <section className="w-hero small">
        <div className="w-container w-page-head">
          <span className="w-eyebrow">Features</span>
          <h1>Everything you need to manage your gym</h1>
          <p>From the first admission to supplement sales and monthly profit — GymSolution is a complete gym management software for gym owners.</p>
          <div className="w-chips">
            {FEATURES.map((f) => (
              <a key={f.id} href={`#${f.id}`} className="w-chip">
                <Icon name={f.icon} />
                {f.title}
              </a>
            ))}
          </div>
        </div>
      </section>

      <div className="w-container">
        {FEATURES.map((f) => {
          const Mock = MOCKS[f.id]
          return (
            <section key={f.id} id={f.id} className="w-feature">
              <div className="w-feature-text">
                <span className={`w-icon tone-${f.tone}`}>
                  <Icon name={f.icon} />
                </span>
                <h2>{f.title}</h2>
                <p>{f.short}</p>
                <ul className="w-points">
                  {f.points.map((pt) => (
                    <li key={pt}>
                      <Icon name="check" />
                      {pt}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="w-feature-visual">
                <Mock />
              </div>
            </section>
          )
        })}
      </div>

      <CtaBand />
    </SiteLayout>
  )
}
