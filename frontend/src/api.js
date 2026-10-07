import { useCallback, useEffect, useState } from 'react'

const TOKEN_KEY = 'gym_token'

export const getToken = () => localStorage.getItem(TOKEN_KEY) || ''
export const setToken = (t) => (t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY))

export class ApiError extends Error {
  constructor(message, status, data) {
    super(message)
    this.status = status
    this.data = data
  }
}

function signedOut() {
  setToken('')
  window.dispatchEvent(new Event('gym-logout'))
}

export async function api(path, { method = 'GET', body } = {}) {
  let res
  try {
    res = await fetch('/api' + path, {
      method,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
      body: body ? JSON.stringify(body) : undefined,
    })
  } catch {
    throw new ApiError('Cannot reach the gym server. Is it running?', 0, {})
  }
  const data = await res.json().catch(() => ({}))
  if (res.status === 401 && !path.startsWith('/auth/')) signedOut()
  if (!res.ok) throw new ApiError(data.error || 'Something went wrong', res.status, data)
  return data
}

// Sends one file as the whole request (a receipt photo or PDF); `api` above only sends JSON.
export async function upload(path, file) {
  let res
  try {
    res = await fetch('/api' + path, { method: 'PUT', headers: { 'Content-Type': file.type, Authorization: `Bearer ${getToken()}` }, body: file })
  } catch {
    throw new ApiError('Cannot reach the gym server. Is it running?', 0, {})
  }
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new ApiError(data.error || 'The file could not be saved', res.status, data)
  return data
}

// Saves a member, asking once if the phone number already belongs to someone else.
export async function saveWithDuplicateCheck(send) {
  try {
    return await send(false)
  } catch (err) {
    if (err.data?.code !== 'DUPLICATE') throw err
    if (!window.confirm(`${err.message}. Save anyway?`)) return null
    return send(true)
  }
}

export async function download(path, filename) {
  const res = await fetch('/api' + path, { headers: { Authorization: `Bearer ${getToken()}` } })
  if (!res.ok) throw new ApiError('Download failed', res.status, {})
  const url = URL.createObjectURL(await res.blob())
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

// Runs a save action: tracks busy state and keeps the error for display.
// run() gives back the result, or null when it failed.
export function useAction() {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const run = async (fn) => {
    setBusy(true)
    setError(null)
    try {
      return await fn()
    } catch (err) {
      setError(err)
      return null
    } finally {
      setBusy(false)
    }
  }
  return { busy, error, run }
}

// Loads a GET endpoint; keeps showing the old data while reloading.
export function useLoad(path) {
  const [state, setState] = useState({ data: null, error: null, loading: true, path })
  const [tick, setTick] = useState(0)
  useEffect(() => {
    let on = true
    api(path).then(
      (data) => on && setState({ data, error: null, loading: false, path }),
      // A failed refresh (phone waking up before Wi-Fi is back) must not wipe what is on screen.
      (error) => on && setState((s) => ({ data: s.path === path ? s.data : null, error, loading: false, path })),
    )
    return () => {
      on = false
    }
  }, [path, tick])
  const reload = useCallback(() => setTick((t) => t + 1), [])
  // Refresh when the app comes back to the front, so a phone left open overnight
  // or a change made on the other device does not leave old data showing.
  useEffect(() => {
    const onShow = () => document.visibilityState === 'visible' && reload()
    document.addEventListener('visibilitychange', onShow)
    return () => document.removeEventListener('visibilitychange', onShow)
  }, [reload])
  // Data from a previous path must not be shown for the new one.
  const fresh = state.path === path
  return { data: fresh ? state.data : null, error: fresh ? state.error : null, loading: !fresh || state.loading, reload }
}
