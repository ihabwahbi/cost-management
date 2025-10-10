const FALLBACK_INVOICE_RATIO = 0.6

export interface NormalizedLineItem {
  id: string
  lineValue: number
  invoiceValue: number
  invoiceDate: string | null
  promiseDate: string | null
  createdAt: string | null
  hasInvoiceField: boolean
  hasPromiseField: boolean
}

const toNumber = (value: any): number => {
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : 0
}

const hasProp = (obj: any, key: string) => Object.prototype.hasOwnProperty.call(obj, key)

export function normalizeLineItem(raw: any): NormalizedLineItem {
  if (!raw || !raw.id) {
    throw new Error('Unable to normalize PO line item without an id')
  }

  const lineValue = toNumber(raw.line_value ?? raw.value ?? raw.total_value ?? 0)
  const invoiceValue = toNumber(
    raw.invoiced_value_usd ??
    raw.invoiced_value ??
    raw.invoice_value_usd ??
    raw.invoice_value ??
    raw.actual_value ??
    0
  )

  const hasInvoiceField =
    hasProp(raw, 'invoiced_value_usd') ||
    hasProp(raw, 'invoiced_value') ||
    hasProp(raw, 'invoice_value_usd') ||
    hasProp(raw, 'invoice_value')

  const hasPromiseField =
    hasProp(raw, 'supplier_promise_date') ||
    hasProp(raw, 'promise_date')

  return {
    id: raw.id,
    lineValue,
    invoiceValue,
    invoiceDate: raw.invoice_date ?? null,
    promiseDate: raw.supplier_promise_date ?? raw.promise_date ?? null,
    createdAt: raw.created_at ?? raw.updated_at ?? null,
    hasInvoiceField,
    hasPromiseField
  }
}

export function splitMappedAmount(mappedAmount: number, lineItem: NormalizedLineItem) {
  const safeLineValue = lineItem.lineValue > 0 ? lineItem.lineValue : mappedAmount
  const ratio = safeLineValue > 0 ? Math.min(mappedAmount / safeLineValue, 1) : 1

  if (lineItem.hasInvoiceField) {
    const actual = lineItem.invoiceValue * ratio
    const future = Math.max(mappedAmount - actual, 0)
    return { actual, future }
  }

  const inferredActual = mappedAmount * FALLBACK_INVOICE_RATIO
  return {
    actual: inferredActual,
    future: Math.max(mappedAmount - inferredActual, 0)
  }
}

export function getEffectiveInvoiceDate(lineItem: NormalizedLineItem): string | null {
  return lineItem.invoiceDate ?? lineItem.createdAt ?? null
}

export function getEffectivePromiseDate(lineItem: NormalizedLineItem): string | null {
  return lineItem.promiseDate ?? null
}

export { FALLBACK_INVOICE_RATIO }
