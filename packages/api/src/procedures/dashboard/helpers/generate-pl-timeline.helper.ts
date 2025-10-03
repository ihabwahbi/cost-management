// packages/api/src/procedures/dashboard/helpers/generate-pl-timeline.helper.ts

/**
 * Helper: Generate P&L timeline with actual invoices and future promises
 * Used by: getTimelineBudget procedure
 * 
 * Budget as fixed reference line, actual as cumulative invoiced, forecast as future promises
 */
export function generatePLTimeline(
  totalBudget: number,
  invoiceData: Array<{ month: Date; invoiced: string | null }>,
  promiseData: Array<{ month: Date; future: string | null }>
): Array<{
  month: string;
  budget: number;
  actual: number;
  forecast: number;
}> {
  // Build month map for invoices
  const invoiceMap = new Map<string, number>();
  invoiceData.forEach((row) => {
    const key = new Date(row.month).toISOString().slice(0, 7); // YYYY-MM
    invoiceMap.set(key, Number(row.invoiced || 0));
  });

  // Build month map for promises
  const promiseMap = new Map<string, number>();
  promiseData.forEach((row) => {
    const key = new Date(row.month).toISOString().slice(0, 7); // YYYY-MM
    promiseMap.set(key, Number(row.future || 0));
  });

  // Determine date range
  const allDates = [...invoiceData.map(d => new Date(d.month)), ...promiseData.map(d => new Date(d.month))];
  if (allDates.length === 0) {
    return [];
  }

  const startDate = new Date(Math.min(...allDates.map(d => d.getTime())));
  const endDate = new Date(Math.max(...allDates.map(d => d.getTime())));
  
  // Extend end date to include at least 3 months into future for visibility
  const minEndDate = new Date();
  minEndDate.setMonth(minEndDate.getMonth() + 3);
  if (endDate < minEndDate) {
    endDate.setMonth(minEndDate.getMonth());
  }

  // Generate timeline
  const timeline: Array<{ month: string; budget: number; actual: number; forecast: number }> = [];
  const current = new Date(startDate);
  current.setDate(1); // Normalize to first of month
  
  let cumulativeActual = 0;

  while (current <= endDate) {
    const monthKey = current.toISOString().slice(0, 7); // YYYY-MM
    const monthLabel = current.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    
    // Add monthly invoice to cumulative
    const monthlyInvoice = invoiceMap.get(monthKey) || 0;
    cumulativeActual += monthlyInvoice;
    
    // Get forecast for this month (not cumulative - just this month's promise)
    const monthlyForecast = promiseMap.get(monthKey) || 0;

    timeline.push({
      month: monthLabel,
      budget: totalBudget, // Fixed budget reference
      actual: Math.round(cumulativeActual),
      forecast: Math.round(monthlyForecast)
    });

    current.setMonth(current.getMonth() + 1);
  }

  return timeline;
}
