export async function exportDashboardToPDF(dashboardElement: HTMLElement, projectName: string) {
  // Simple implementation - in production would use a library like jsPDF or html2canvas
  try {
    // Use browser's print functionality as a simple PDF export
    const printContent = dashboardElement.innerHTML
    const printWindow = window.open('', '_blank')
    
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>${projectName} Dashboard</title>
            <style>
              body { font-family: sans-serif; padding: 20px; }
              @media print {
                body { margin: 0; }
              }
            </style>
          </head>
          <body>
            <h1>${projectName} Dashboard Report</h1>
            <p>Generated: ${new Date().toLocaleString()}</p>
            <hr>
            ${printContent}
          </body>
        </html>
      `)
      printWindow.document.close()
      printWindow.print()
    }
  } catch (error) {
    console.error('Error exporting PDF:', error)
    throw error
  }
}

export async function exportDashboardToExcel(data: any, projectName: string) {
  // Simple CSV export as a fallback - in production would use a library like xlsx
  try {
    const csvContent = generateCSVFromData(data)
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    
    link.setAttribute('href', url)
    link.setAttribute('download', `${projectName}_dashboard_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  } catch (error) {
    console.error('Error exporting Excel:', error)
    throw error
  }
}

function generateCSVFromData(data: any): string {
  const lines: string[] = []
  
  // Add metrics section
  lines.push('METRICS')
  lines.push('Metric,Value')
  if (data.metrics) {
    lines.push(`Total Budget,${data.metrics.totalBudget}`)
    lines.push(`Actual Spend,${data.metrics.actualSpend}`)
    lines.push(`Variance,${data.metrics.variance}`)
    lines.push(`Utilization %,${data.metrics.utilization}`)
    lines.push(`Invoiced Amount,${data.metrics.invoicedAmount}`)
    lines.push(`Open Orders,${data.metrics.openOrders}`)
    lines.push(`PO Count,${data.metrics.poCount}`)
  }
  
  lines.push('')
  lines.push('TIMELINE DATA')
  lines.push('Month,Budget,Actual,Forecast')
  if (data.timeline) {
    data.timeline.forEach((item: any) => {
      lines.push(`${item.month},${item.budget},${item.actual},${item.forecast}`)
    })
  }
  
  lines.push('')
  lines.push('CATEGORY BREAKDOWN')
  lines.push('Category,Budget,Actual Spend')
  if (data.categories) {
    data.categories.forEach((item: any) => {
      lines.push(`${item.name},${item.budget},${item.value}`)
    })
  }
  
  return lines.join('\n')
}