import { useEffect, useState } from 'react'
import { api, useAction } from '../api.js'
import { ErrorBox, Field, Sheet } from '../components/ui.jsx'
import { capTyped } from '../format.js'

// The small popup behind "+ New" in the expense form: the name of the new category.
export default function NewCategorySheet({ onClose, onAdded }) {
  const [name, setName] = useState('')
  const { busy, error, run } = useAction()

  // Escape closes only this popup, not the expense form underneath it.
  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== 'Escape') return
      e.stopImmediatePropagation()
      onClose()
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [onClose])

  const save = async (e) => {
    e.preventDefault()
    const created = await run(() => api('/expense-categories', { method: 'POST', body: { name } }))
    if (created) onAdded(created)
  }

  return (
    <Sheet title="Add New Category" onClose={onClose} className="pop">
      <form className="form" onSubmit={save}>
        <Field label="Category name">
          <input value={name} onChange={(e) => setName(capTyped(e))} required maxLength={40} placeholder="e.g. Rent" autoFocus />
        </Field>
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
