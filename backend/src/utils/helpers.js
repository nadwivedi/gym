// Mongo document -> API shape (_id becomes id).
export function out(doc) {
  if (!doc) return doc
  const { _id, ...rest } = doc.toObject ? doc.toObject() : doc
  return { id: String(_id), ...rest }
}

// One line of a record's change history.
export const logEntry = (text) => ({ at: new Date().toISOString(), text })

// A value as it is written in the change history.
export const show = (v) => (v === '' || v == null ? 'none' : v)

export const round2 = (n) => Math.round(n * 100) / 100
