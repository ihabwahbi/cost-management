/**
 * PO Table Formatters
 * 
 * Currency and date formatting utilities specific to PO table display.
 * Extracted from po-table.tsx lines 108-123
 */

/**
 * Format amount as Australian dollars without decimals
 * Example: 10000 => "A$10,000"
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

/**
 * Format ISO date string as DD MMM YYYY
 * Example: "2025-01-15" => "15 Jan 2025"
 */
export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-AU", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}
