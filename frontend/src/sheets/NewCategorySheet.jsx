import { useEffect, useState } from 'react'
import { EXPENSE_ICONS } from '../../../shared/domain.mjs'
import { api, useAction } from '../api.js'
import { ErrorBox, Field, Group, Icon, Sheet } from '../components/ui.jsx'
import { capTyped } from '../format.js'

// The small popup behind "+ New" in the expense form: a name and, if wanted, a picture for the new category.
export default function NewCategorySheet({ onClose, onAdded }) {
  const [name, setName] = useState('')
  const [icon, setIcon] = useState('')
  const { busy, error, run } = useAction()

  // Escape closes only this popup, not the expense form underneath it.
  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== 'Escape') return
      e.stopPropagation()
      onClose()
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [onClose])

  const save = async (e) => {
    e.preventDefault()
    const created = await run(() => api('/expense-categories', { method: 'POST', body: { name, icon } }))
    if (created) onAdded(created)
  }

  return (
    <Sheet title="Add New Category" onClose={onClose} className="pop">
      <form className="form" onSubmit={save}>
        <Field label="Category name">
          <input value={name} onChange={(e) => setName(capTyped(e))} required maxLength={40} placeholder="e.g. Rent" autoFocus />
        </Field>
        <Group label="Icon (optional)">
          <div className="icon-grid">
            {EXPENSE_ICONS.map((i) => (
              <button type="button" key={i} className={`icon-pick ${icon === i ? 'active' : ''}`} aria-pressed={icon === i} aria-label={`${i} icon`} onClick={() => setIcon(icon === i ? '' : i)}>
                <Icon name={i} />
              </button>
            ))}
          </div>
        </Group>
        <ErrorBox error={error} />
        <div className="btn-grid">
          <button type="button" className="btn" disabled={busy} onClick={onClose}>
            Cancel
          </button>
          <button className="btn primary" disabled={busy || !name.trim()}>
            {busy ? 'Adding…' : 'Add Category'}
          </button>
        </div>
      </form>
    </Sheet>
  )
}
