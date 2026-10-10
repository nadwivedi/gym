function cell(v) {
  let s = v == null ? '' : String(v)
  // Stop Excel from running a cell that starts like a formula.
  if (/^[=+\-@\t\r]/.test(s) && typeof v !== 'number') s = `'${s}`
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

export function toCsv(headers, rows) {
  // BOM so Excel reads UTF-8 names correctly.
  return '﻿' + [headers, ...rows].map((r) => r.map(cell).join(',')).join('\r\n') + '\r\n'
}
