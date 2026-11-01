import type { OrderStatus, ReturnStatus } from '../api/types'

const formatters = new Map<string, Intl.NumberFormat>()

/** Money is integer cents everywhere in the API. */
export function formatMoney(cents: number, currency = 'USD') {
  let fmt = formatters.get(currency)
  if (!fmt) {
    fmt = new Intl.NumberFormat('en-US', { style: 'currency', currency })
    formatters.set(currency, fmt)
  }
  return fmt.format(cents / 100)
}

export function formatDate(value: string | Date | null | undefined) {
  if (!value) return '-'
  return new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(new Date(value))
}

export function formatDateTime(value: string | Date | null | undefined) {
  if (!value) return '-'
  return new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
}

/** 1250 -> "12.50" (for form inputs). */
export function centsToInput(cents: number | null | undefined) {
  if (cents === null || cents === undefined) return ''
  return (cents / 100).toFixed(2)
}

const MONEY_RE = /^\d+(\.\d{1,2})?$/

export function isMoneyInput(value: string) {
  return MONEY_RE.test(value.trim())
}

/** "12.50" -> 1250. Returns null for empty / invalid values. */
export function inputToCents(value: string): number | null {
  const v = value.trim()
  if (!MONEY_RE.test(v)) return null
  return Math.round(Number(v) * 100)
}

export function statusLabel(status: OrderStatus | ReturnStatus | string) {
  const s = status.replace(/_/g, ' ').toLowerCase()
  return s.charAt(0).toUpperCase() + s.slice(1)
}

/** ISO string -> yyyy-mm-dd in local time (for <input type="date">). */
export function isoToDateInput(iso: string | null | undefined) {
  if (!iso) return ''
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export function dateInputToIso(value: string, endOfDay = false) {
  if (!value) return null
  const d = new Date(`${value}T${endOfDay ? '23:59:59' : '00:00:00'}`)
  return Number.isNaN(d.getTime()) ? null : d.toISOString()
}
