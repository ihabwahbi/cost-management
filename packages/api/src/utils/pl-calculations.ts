/**
 * P&L Calculation Utilities
 * Shared logic for dashboard procedures involving P&L calculations
 */

/**
 * Fallback invoice ratio when actual invoice data unavailable
 * Used to split mapped amounts into actual (60%) vs future (40%)
 */
export const FALLBACK_INVOICE_RATIO = 0.6

/**
 * Split mapped amount into actual and future based on invoice data
 * @param mappedAmount - Total mapped amount from po_mappings
 * @param lineItem - PO line item with invoice data
 * @returns { actual, future } split
 */
export function splitMappedAmount(
  mappedAmount: number,
  lineItem: {
    lineValue: number | null
    invoicedValueUsd: number | null
    invoicedQuantity: number | null
  }
): { actual: number; future: number } {
  const lineValue = Number(lineItem.lineValue || 0)
  const invoicedValue = Number(lineItem.invoicedValueUsd || 0)
  const invoicedQty = Number(lineItem.invoicedQuantity || 0)
  
  // If no invoice data, use fallback ratio
  if (invoicedValue === 0 && invoicedQty === 0) {
    return {
      actual: mappedAmount * FALLBACK_INVOICE_RATIO,
      future: mappedAmount * (1 - FALLBACK_INVOICE_RATIO)
    }
  }
  
  // Calculate invoice percentage
  const invoicePercentage = lineValue > 0 
    ? Math.min(invoicedValue / lineValue, 1.0)
    : FALLBACK_INVOICE_RATIO
  
  return {
    actual: mappedAmount * invoicePercentage,
    future: mappedAmount * (1 - invoicePercentage)
  }
}

/**
 * Normalize line item data from Drizzle query
 * Converts numeric strings to numbers
 */
export function normalizeLineItem(raw: any): {
  id: string
  lineValue: number
  invoicedValueUsd: number
  invoicedQuantity: number
  invoiceDate: Date | null
} {
  return {
    id: raw.id,
    lineValue: Number(raw.lineValue || 0),
    invoicedValueUsd: Number(raw.invoicedValueUsd || 0),
    invoicedQuantity: Number(raw.invoicedQuantity || 0),
    invoiceDate: raw.invoiceDate ? new Date(raw.invoiceDate) : null
  }
}

export type NormalizedLineItem = ReturnType<typeof normalizeLineItem>
