import { Link } from 'react-router-dom'
import { Icon } from '../components/ui.jsx'

// A page's questions as an accordion, with the same questions for search engines (FAQPage).
// items: [{ q, a, link?: [address, words] }]. The link is shown after the answer; search engines get the answer text alone.
// children: shown below the questions, e.g. a closing link.
export default function Faq({ title, intro, items, band = false, children }) {
  const structured = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map(({ q, a }) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })),
  }

  return (
    <section id="faq" className={band ? 'w-band' : ''}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structured) }} />
      <div className="w-container w-section">
        <div className="w-section-head">
          <span className="w-eyebrow dark">FAQs</span>
          <h2>{title}</h2>
          {intro && <p>{intro}</p>}
        </div>
        <div className="w-accordion">
          {items.map(({ q, a, link }, i) => (
            // One open at a time (name); the first is open so the section never looks empty.
            <details key={q} name="faq" open={i === 0}>
              <summary>
                <h3>{q}</h3>
                <Icon name="down" />
              </summary>
              <div className="w-accordion-a">
                <p>
                  {a}
                  {link && (
                    <>
                      {' '}
                      <Link to={link[0]}>{link[1]}</Link>
                    </>
                  )}
                </p>
              </div>
            </details>
          ))}
        </div>
        {children}
      </div>
    </section>
  )
}
