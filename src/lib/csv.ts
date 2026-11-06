/** Quote a CSV cell when needed (commas, quotes, line breaks). */
function cell(value: string | number): string {
  const text = String(value)
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

export function toCsv(header: string[], rows: Array<Array<string | number>>): string {
  return [header, ...rows].map((row) => row.map(cell).join(',')).join('\r\n')
}

/** Save a CSV file in the browser. The BOM makes Excel read UTF-8 correctly. */
export function downloadCsv(fileName: string, csv: string): void {
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
}
