// packages/api/src/procedures/dashboard/helpers/split-mapped-amount.helper.ts

import { FALLBACK_INVOICE_RATIO } from './constants';

/**
 * Helper: Calculate actual vs future P&L from line item
 * Used by: getPLMetrics, getPLTimeline, getPromiseDates, getFinancialControlMetrics
 * 
 * Splits mapped amount into:
 * - actual: Amount already invoiced (P&L impact realized)
 * - future: Amount not yet invoiced (P&L impact pending)
 */
export function splitMappedAmount(
  mappedAmount: number, 
  lineItem: { lineValue: any; invoicedValueUsd: any }
): { actual: number; future: number } {
  const lineValue = Number(lineItem.lineValue || 0);
  const invoiceValue = Number(lineItem.invoicedValueUsd || 0);
  const hasInvoiceField = lineItem.invoicedValueUsd !== null;
  
  const safeLineValue = lineValue > 0 ? lineValue : mappedAmount;
  const ratio = safeLineValue > 0 ? Math.min(mappedAmount / safeLineValue, 1) : 1;
  
  if (hasInvoiceField) {
    const actual = invoiceValue * ratio;
    const future = Math.max(mappedAmount - actual, 0);
    return { actual, future };
  }
  
  // Fallback when invoice data unavailable
  const inferredActual = mappedAmount * FALLBACK_INVOICE_RATIO;
  return {
    actual: inferredActual,
    future: Math.max(mappedAmount - inferredActual, 0)
  };
}
