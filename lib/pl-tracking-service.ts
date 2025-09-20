/**
 * P&L Tracking Service
 * Provides functions for tracking actual P&L impact vs committed spend
 * and forecasting future P&L impact based on supplier promise dates
 */

import { createClient } from '@/lib/supabase/client'
import {
  FALLBACK_INVOICE_RATIO,
  getEffectiveInvoiceDate,
  getEffectivePromiseDate,
  normalizeLineItem,
  splitMappedAmount
} from '@/lib/supabase/line-items'
import { buildInFilter } from '@/lib/supabase/filters'

interface PLMetrics {
  totalBudget: number
  totalCommitted: number  // Total PO value
  actualPLImpact: number  // Invoiced amounts that hit P&L
  futurePLImpact: number  // Open POs that will hit P&L
  plGap: number  // Committed but not yet in P&L
}

interface PLTimelineEntry {
  month: string
  year: number
  actualPL: number  // Historical P&L impact
  projectedPL: number  // Future P&L based on promises
  cumulative: number
}

interface SupplierPerformance {
  supplierId: string
  supplierName: string
  onTimeDeliveryRate: number
  averageDaysToInvoice: number
  totalPLImpact: number
  openPOValue: number
}

/**
 * Get P&L metrics for a project
 */
export async function getProjectPLMetrics(
  projectId: string,
  filters?: { costLine?: string; spendType?: string }
): Promise<PLMetrics> {
  const supabase = createClient()

  // Get total budget
  let budgetQuery = supabase
    .from('cost_breakdown')
    .select('id, budget_cost')
    .eq('project_id', projectId)

  if (filters?.costLine) {
    budgetQuery = budgetQuery.eq('cost_line', filters.costLine)
  }
  if (filters?.spendType) {
    budgetQuery = budgetQuery.eq('spend_type', filters.spendType)
  }

  const { data: budgetData, error: budgetError } = await budgetQuery

  if (budgetError) {
    throw budgetError
  }

  const totalBudget = budgetData?.reduce((sum, item) => 
    sum + (Number(item.budget_cost) || 0), 0) || 0

  const costBreakdownFilter = buildInFilter(budgetData?.map(b => b.id) || [])

  if (!costBreakdownFilter) {
    return {
      totalBudget,
      totalCommitted: 0,
      actualPLImpact: 0,
      futurePLImpact: 0,
      plGap: 0
    }
  }

  // Get PO mappings
  const { data: mappings, error: mappingsError } = await supabase
    .from('po_mappings')
    .select('mapped_amount, po_line_item_id')
    .filter('cost_breakdown_id', 'in', costBreakdownFilter)

  if (mappingsError) {
    throw mappingsError
  }

  let totalCommitted = 0
  let actualPLImpact = 0
  let futurePLImpact = 0

  const lineItemFilter = buildInFilter((mappings || []).map((mapping: any) => mapping.po_line_item_id))
  const lineItemMap = new Map<string, ReturnType<typeof normalizeLineItem>>()

  if (lineItemFilter) {
    const { data: lineItems, error: lineItemsError } = await supabase
      .from('po_line_items')
      .select('*')
      .filter('id', 'in', lineItemFilter)

    if (lineItemsError) {
      throw lineItemsError
    }

    lineItems?.forEach(item => {
      try {
        const normalized = normalizeLineItem(item)
        lineItemMap.set(normalized.id, normalized)
      } catch (error) {
        console.warn('Skipping malformed PO line item record', error)
      }
    })
  }

  if (mappings) {
    mappings.forEach((mapping: any) => {
      const mappedAmount = Number(mapping.mapped_amount) || 0
      totalCommitted += mappedAmount

      const lineItem = mapping.po_line_item_id ? lineItemMap.get(mapping.po_line_item_id) : undefined
      if (!lineItem) {
        const inferredActual = mappedAmount * FALLBACK_INVOICE_RATIO
        actualPLImpact += inferredActual
        futurePLImpact += Math.max(mappedAmount - inferredActual, 0)
        return
      }

      const { actual, future } = splitMappedAmount(mappedAmount, lineItem)
      actualPLImpact += actual
      futurePLImpact += future
    })
  }

  return {
    totalBudget,
    totalCommitted,
    actualPLImpact,
    futurePLImpact,
    plGap: totalCommitted - actualPLImpact
  }
}

/**
 * Get P&L impact by month (historical and projected)
 */
export async function getPLImpactByMonth(
  projectId: string,
  startDate: Date,
  endDate: Date
): Promise<PLTimelineEntry[]> {
  const supabase = createClient()

  // Get cost breakdown IDs for the project
  const { data: costBreakdown, error: costBreakdownError } = await supabase
    .from('cost_breakdown')
    .select('id')
    .eq('project_id', projectId)

  if (costBreakdownError) {
    throw costBreakdownError
  }

  const costIds = costBreakdown?.map(c => c.id) || []
  const costFilter = buildInFilter(costIds)

  if (!costFilter) {
    return []
  }

  // Fetch PO mappings to derive relevant line items
  const { data: poMappings, error: poMappingError } = await supabase
    .from('po_mappings')
    .select('mapped_amount, po_line_item_id')
    .filter('cost_breakdown_id', 'in', costFilter)

  if (poMappingError) {
    throw poMappingError
  }

  const lineItemFilter = buildInFilter((poMappings || []).map((item: any) => item.po_line_item_id))

  if (!lineItemFilter) {
    return []
  }

  // Fetch line item data separately to avoid PostgREST join limitations
  const { data: lineItems, error: lineItemsError } = await supabase
    .from('po_line_items')
    .select('*')
    .filter('id', 'in', lineItemFilter)

  if (lineItemsError) {
    throw lineItemsError
  }

  const lineItemMap = new Map<string, ReturnType<typeof normalizeLineItem>>()
  let hasInvoiceField = false

  lineItems?.forEach(item => {
    try {
      const normalized = normalizeLineItem(item)
      lineItemMap.set(normalized.id, normalized)
      hasInvoiceField = hasInvoiceField || normalized.hasInvoiceField
    } catch (error) {
      console.warn('Skipping malformed PO line item record', error)
    }
  })

  const monthlyData: Map<string, { actual: number; projected: number }> = new Map()

  const clampToWindow = (dateStr: string | null | undefined) => {
    if (!dateStr) return null
    const date = new Date(dateStr)
    if (Number.isNaN(date.getTime())) return null
    if (date < startDate || date > endDate) return null
    return date
  }

  const addToMonth = (date: Date | null, key: 'actual' | 'projected', amount: number) => {
    if (!date || amount <= 0) return
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    const current = monthlyData.get(monthKey) || { actual: 0, projected: 0 }
    current[key] += amount
    monthlyData.set(monthKey, current)
  }

  (poMappings || []).forEach((mapping: any) => {
    const mappedAmount = Number(mapping.mapped_amount) || 0
    const lineItem = mapping.po_line_item_id ? lineItemMap.get(mapping.po_line_item_id) : undefined

    if (!lineItem) {
      const inferredActual = hasInvoiceField ? 0 : mappedAmount * FALLBACK_INVOICE_RATIO
      const inferredFuture = Math.max(mappedAmount - inferredActual, 0)
      addToMonth(new Date(startDate), 'actual', inferredActual)
      if (inferredFuture > 0) {
        addToMonth(new Date(endDate), 'projected', inferredFuture)
      }
      return
    }

    const { actual, future } = splitMappedAmount(mappedAmount, lineItem)

    const invoiceDate = clampToWindow(getEffectiveInvoiceDate(lineItem))
    const promiseDate = clampToWindow(getEffectivePromiseDate(lineItem))

    const fallbackInvoiceDate = invoiceDate ?? clampToWindow(lineItem.createdAt)
    const fallbackPromiseDate = promiseDate ?? fallbackInvoiceDate ?? new Date(endDate)

    addToMonth(fallbackInvoiceDate, 'actual', actual)
    if (future > 0) {
      addToMonth(fallbackPromiseDate, 'projected', future)
    }
  })

  // Convert to timeline array
  const timeline: PLTimelineEntry[] = []
  let cumulative = 0

  // Sort months chronologically
  const sortedMonths = Array.from(monthlyData.keys()).sort()

  sortedMonths.forEach(monthKey => {
    const [year, month] = monthKey.split('-')
    const data = monthlyData.get(monthKey)!
    
    cumulative += data.actual + data.projected
    
    timeline.push({
      month: getMonthName(parseInt(month)),
      year: parseInt(year),
      actualPL: data.actual,
      projectedPL: data.projected,
      cumulative
    })
  })

  return timeline
}

/**
 * Get open POs grouped by promise date
 */
export async function getOpenPOsByPromiseDate(
  projectId: string
): Promise<Map<string, number>> {
  const supabase = createClient()

  // Get cost breakdown IDs
  const { data: costBreakdown, error: costBreakdownError } = await supabase
    .from('cost_breakdown')
    .select('id')
    .eq('project_id', projectId)

  if (costBreakdownError) {
    throw costBreakdownError
  }

  const costIds = costBreakdown?.map(c => c.id) || []
  const costFilter = buildInFilter(costIds)

  if (!costFilter) {
    return new Map<string, number>()
  }

  const { data: poMappings, error: poMappingError } = await supabase
    .from('po_mappings')
    .select('mapped_amount, po_line_item_id')
    .filter('cost_breakdown_id', 'in', costFilter)

  if (poMappingError) {
    throw poMappingError
  }

  const lineItemFilter = buildInFilter((poMappings || []).map((mapping: any) => mapping.po_line_item_id))

  if (!lineItemFilter) {
    return new Map<string, number>()
  }

  const { data: lineItems, error: lineItemsError } = await supabase
    .from('po_line_items')
    .select('*')
    .filter('id', 'in', lineItemFilter)

  if (lineItemsError) {
    throw lineItemsError
  }

  const lineItemMap = new Map<string, ReturnType<typeof normalizeLineItem>>()

  lineItems?.forEach(item => {
    try {
      const normalized = normalizeLineItem(item)
      lineItemMap.set(normalized.id, normalized)
    } catch (error) {
      console.warn('Skipping malformed PO line item record', error)
    }
  })

  const promiseDateMap = new Map<string, number>()

  if (poMappings) {
    poMappings.forEach((mapping: any) => {
      const mappedAmount = Number(mapping.mapped_amount) || 0
      const lineItem = mapping.po_line_item_id ? lineItemMap.get(mapping.po_line_item_id) : undefined

      if (!lineItem) {
        return
      }

      const { future } = splitMappedAmount(mappedAmount, lineItem)

      if (future <= 0) {
        return
      }

      const promiseDate = getEffectivePromiseDate(lineItem)

      if (!promiseDate) {
        return
      }

      const dateKey = new Date(promiseDate).toISOString().split('T')[0]
      const existing = promiseDateMap.get(dateKey) || 0
      promiseDateMap.set(dateKey, existing + future)
    })
  }

  return promiseDateMap
}

/**
 * Calculate P&L velocity (burn rate)
 */
export async function getPLVelocity(
  projectId: string,
  months: number = 3
): Promise<{ currentRate: number; acceleration: number; projection: number }> {
  const endDate = new Date()
  const startDate = new Date()
  startDate.setMonth(startDate.getMonth() - months)

  const timeline = await getPLImpactByMonth(projectId, startDate, endDate)
  
  if (timeline.length < 2) {
    return { currentRate: 0, acceleration: 0, projection: 0 }
  }

  // Calculate average monthly P&L impact
  const totalPL = timeline.reduce((sum, entry) => sum + entry.actualPL, 0)
  const currentRate = totalPL / timeline.length

  // Calculate acceleration (change in rate)
  const firstHalf = timeline.slice(0, Math.floor(timeline.length / 2))
  const secondHalf = timeline.slice(Math.floor(timeline.length / 2))
  
  const firstHalfRate = firstHalf.reduce((sum, e) => sum + e.actualPL, 0) / firstHalf.length
  const secondHalfRate = secondHalf.reduce((sum, e) => sum + e.actualPL, 0) / secondHalf.length
  
  const acceleration = ((secondHalfRate - firstHalfRate) / firstHalfRate) * 100

  // Project next month
  const projection = currentRate * (1 + acceleration / 100)

  return { currentRate, acceleration, projection }
}

/**
 * Get supplier performance metrics
 */
export async function getSupplierPerformanceMetrics(
  projectId: string
): Promise<SupplierPerformance[]> {
  const supabase = createClient()

  // Get all POs related to the project
  const { data: costBreakdown } = await supabase
    .from('cost_breakdown')
    .select('id')
    .eq('project_id', projectId)

  const costIds = costBreakdown?.map(c => c.id) || []
  const costFilter = buildInFilter(costIds)

  if (!costFilter) {
    return []
  }

  // Get PO data with supplier info
  const { data: poData } = await supabase
    .from('po_mappings')
    .select(`
      mapped_amount,
      po_line_items!inner (*, pos (*))
    `)
    .filter('cost_breakdown_id', 'in', costFilter)

  // Aggregate by supplier
  const supplierMap = new Map<string, {
    invoicedOnTime: number
    totalInvoiced: number
    totalDaysToInvoice: number
    invoiceCount: number
    totalPLImpact: number
    openPOValue: number
  }>()

  if (poData) {
    poData.forEach((item: any) => {
      const mappedAmount = Number(item.mapped_amount) || 0
      const lineItem = item.po_line_items
      const po = lineItem?.pos

      if (!po) {
        return
      }

      let normalizedLineItem: ReturnType<typeof normalizeLineItem>
      try {
        normalizedLineItem = normalizeLineItem(lineItem)
      } catch (error) {
        console.warn('Skipping malformed PO line item in supplier performance', error)
        return
      }

      const vendorName = po.vendor_name
      const existing = supplierMap.get(vendorName) || {
        invoicedOnTime: 0,
        totalInvoiced: 0,
        totalDaysToInvoice: 0,
        invoiceCount: 0,
        totalPLImpact: 0,
        openPOValue: 0
      }

      const { actual, future } = splitMappedAmount(mappedAmount, normalizedLineItem)

      if (normalizedLineItem.invoiceDate) {
        // Calculate days to invoice
        const poDate = new Date(po.po_creation_date)
        const invoiceDate = new Date(normalizedLineItem.invoiceDate)
        const daysToInvoice = Math.floor((invoiceDate.getTime() - poDate.getTime()) / (1000 * 60 * 60 * 24))

        existing.totalDaysToInvoice += daysToInvoice
        existing.invoiceCount += 1
        existing.totalPLImpact += actual

        // Check if on time (assuming 45 days is standard)
        if (daysToInvoice <= 45) {
          existing.invoicedOnTime += 1
        }
        existing.totalInvoiced += 1
      } else {
        // Open PO
        existing.openPOValue += future
      }

      supplierMap.set(vendorName, existing)
    })
  }

  // Convert to array
  const suppliers: SupplierPerformance[] = []
  
  supplierMap.forEach((data, name) => {
    suppliers.push({
      supplierId: name,  // Using name as ID for now
      supplierName: name,
      onTimeDeliveryRate: data.totalInvoiced > 0 
        ? (data.invoicedOnTime / data.totalInvoiced) * 100 
        : 0,
      averageDaysToInvoice: data.invoiceCount > 0 
        ? data.totalDaysToInvoice / data.invoiceCount 
        : 0,
      totalPLImpact: data.totalPLImpact,
      openPOValue: data.openPOValue
    })
  })

  return suppliers
}

// Helper function
function getMonthName(month: number): string {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return months[month - 1] || ''
}