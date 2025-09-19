import { createClient } from '@/lib/supabase/client'

interface ProjectMetrics {
  totalBudget: number
  actualSpend: number
  variance: number
  variancePercent: number
  utilization: number
  invoicedAmount: number
  openOrders: number
  burnRate: number
  poCount: number
  lineItemCount: number
}

interface DashboardFilters {
  dateRange?: { from: Date; to: Date }
  costLine?: string
  spendType?: string
}

export async function calculateProjectMetrics(
  projectId: string,
  filters?: DashboardFilters
): Promise<ProjectMetrics> {
  const supabase = createClient()
  
  // Get total budget from cost_breakdown
  let budgetQuery = supabase
    .from('cost_breakdown')
    .select('id, budget_cost, cost_line, spend_type')
    .eq('project_id', projectId)
  
  // Apply filters to budget query
  if (filters?.costLine && filters.costLine !== 'all') {
    budgetQuery = budgetQuery.eq('cost_line', filters.costLine)
  }
  if (filters?.spendType && filters.spendType !== 'all') {
    budgetQuery = budgetQuery.eq('spend_type', filters.spendType)
  }
  
  const { data: budgetData, error: budgetError } = await budgetQuery
  
  if (budgetError) {
    console.error('Error fetching budget data:', budgetError)
    throw budgetError
  }
  
  const totalBudget = budgetData?.reduce((sum, item) => sum + (Number(item.budget_cost) || 0), 0) || 0
  
  // Get actual spend from po_mappings
  const { data: mappings, error: mappingsError } = await supabase
    .from('po_mappings')
    .select(`
      id,
      mapped_amount,
      cost_breakdown_id,
      po_line_item_id
    `)
    .in('cost_breakdown_id', budgetData?.map(item => item.id) || [])
  
  if (mappingsError) {
    console.error('Error fetching PO mappings:', mappingsError)
  }
  
  // Get PO line item details if mappings exist
  let actualSpend = 0
  let invoicedAmount = 0
  let openOrders = 0
  let poCount = 0
  let lineItemCount = 0
  
  if (mappings && mappings.length > 0) {
    const lineItemIds = [...new Set(mappings.map(m => m.po_line_item_id).filter(Boolean))]
    
    if (lineItemIds.length > 0) {
      const { data: lineItems, error: lineItemsError } = await supabase
        .from('po_line_items')
        .select(`
          id,
          line_value,
          po_id
        `)
        .in('id', lineItemIds)
      
      if (!lineItemsError && lineItems) {
        // Calculate totals based on mapped amounts
        mappings.forEach(mapping => {
          const amount = Number(mapping.mapped_amount) || 0
          actualSpend += amount
          // For demo purposes, assume 60% is invoiced
          const invoiced = amount * 0.6
          invoicedAmount += invoiced
          openOrders += (amount - invoiced)
        })
        
        // Count unique POs and line items
        const uniquePOs = new Set(lineItems.map(item => item.po_id))
        poCount = uniquePOs.size
        lineItemCount = lineItems.length
      }
    }
  }
  
  // Calculate derived metrics
  const variance = totalBudget - actualSpend
  const variancePercent = totalBudget > 0 ? (variance / totalBudget) * 100 : 0
  const utilization = totalBudget > 0 ? (actualSpend / totalBudget) * 100 : 0
  
  // Calculate burn rate (monthly average)
  const projectStartDate = new Date(2024, 0, 1) // Assume project started Jan 2024
  const monthsElapsed = Math.max(1, Math.floor((Date.now() - projectStartDate.getTime()) / (1000 * 60 * 60 * 24 * 30)))
  const burnRate = actualSpend / monthsElapsed
  
  return {
    totalBudget,
    actualSpend,
    variance,
    variancePercent,
    utilization,
    invoicedAmount,
    openOrders,
    burnRate,
    poCount,
    lineItemCount
  }
}

export async function getTimelineData(projectId: string, filters?: DashboardFilters) {
  const supabase = createClient()
  
  // For demo purposes, generate sample timeline data
  // In production, this would aggregate actual data by month
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const currentMonth = new Date().getMonth()
  
  const timelineData = []
  let cumulativeBudget = 0
  let cumulativeActual = 0
  let cumulativeForecast = 0
  
  for (let i = 0; i <= currentMonth; i++) {
    // Simulate gradual spending
    const monthlyBudget = 100000 + Math.random() * 50000
    const monthlyActual = monthlyBudget * (0.7 + Math.random() * 0.4)
    const monthlyForecast = monthlyBudget * (0.8 + Math.random() * 0.3)
    
    cumulativeBudget += monthlyBudget
    cumulativeActual += monthlyActual
    cumulativeForecast += monthlyForecast
    
    timelineData.push({
      month: months[i],
      budget: Math.round(cumulativeBudget),
      actual: Math.round(cumulativeActual),
      forecast: Math.round(cumulativeForecast)
    })
  }
  
  return timelineData
}

export async function getCategoryBreakdown(projectId: string, filters?: DashboardFilters) {
  const supabase = createClient()
  
  // Get cost breakdown grouped by spend_type
  let query = supabase
    .from('cost_breakdown')
    .select('spend_type, budget_cost, id')
    .eq('project_id', projectId)
  
  if (filters?.costLine && filters.costLine !== 'all') {
    query = query.eq('cost_line', filters.costLine)
  }
  
  const { data: costData, error } = await query
  
  if (error) {
    console.error('Error fetching category data:', error)
    return []
  }
  
  // Get PO mappings for actual spend
  const costIds = costData?.map(c => c.id) || []
  const { data: mappings } = await supabase
    .from('po_mappings')
    .select('cost_breakdown_id, mapped_amount')
    .in('cost_breakdown_id', costIds)
  
  // Aggregate by spend type
  const categories: Record<string, { name: string; value: number; budget: number }> = {}
  
  costData?.forEach(item => {
    if (!categories[item.spend_type]) {
      categories[item.spend_type] = {
        name: item.spend_type,
        value: 0,
        budget: 0
      }
    }
    categories[item.spend_type].budget += Number(item.budget_cost) || 0
  })
  
  // Add actual spend from mappings
  mappings?.forEach(mapping => {
    const cost = costData?.find(c => c.id === mapping.cost_breakdown_id)
    if (cost && categories[cost.spend_type]) {
      categories[cost.spend_type].value += Number(mapping.mapped_amount) || 0
    }
  })
  
  return Object.values(categories)
}

export async function getHierarchicalBreakdown(projectId: string, filters?: DashboardFilters) {
  const supabase = createClient()
  
  // Get all cost breakdown items
  let query = supabase
    .from('cost_breakdown')
    .select('*')
    .eq('project_id', projectId)
    .order('sub_business_line, cost_line, spend_type, spend_sub_category')
  
  if (filters?.costLine && filters.costLine !== 'all') {
    query = query.eq('cost_line', filters.costLine)
  }
  if (filters?.spendType && filters.spendType !== 'all') {
    query = query.eq('spend_type', filters.spendType)
  }
  
  const { data: costData, error } = await query
  
  if (error) {
    console.error('Error fetching breakdown data:', error)
    return []
  }
  
  // Get PO mappings for actual spend
  const costIds = costData?.map(c => c.id) || []
  const { data: mappings } = await supabase
    .from('po_mappings')
    .select('cost_breakdown_id, mapped_amount')
    .in('cost_breakdown_id', costIds)
  
  // Create a map of actual spend by cost breakdown id
  const actualSpendMap: Record<string, number> = {}
  mappings?.forEach(mapping => {
    actualSpendMap[mapping.cost_breakdown_id] = 
      (actualSpendMap[mapping.cost_breakdown_id] || 0) + (Number(mapping.mapped_amount) || 0)
  })
  
  // Build hierarchical structure
  const hierarchy: Record<string, any> = {}
  
  costData?.forEach(item => {
    const { sub_business_line, cost_line, spend_type, spend_sub_category } = item
    const budget = Number(item.budget_cost) || 0
    const actual = actualSpendMap[item.id] || 0
    
    // Initialize business line level
    if (!hierarchy[sub_business_line]) {
      hierarchy[sub_business_line] = {
        id: `bl_${sub_business_line}`,
        level: 'business_line',
        name: sub_business_line,
        budget: 0,
        actual: 0,
        variance: 0,
        utilization: 0,
        children: {}
      }
    }
    
    // Initialize cost line level
    if (!hierarchy[sub_business_line].children[cost_line]) {
      hierarchy[sub_business_line].children[cost_line] = {
        id: `cl_${sub_business_line}_${cost_line}`,
        level: 'cost_line',
        name: cost_line,
        budget: 0,
        actual: 0,
        variance: 0,
        utilization: 0,
        children: {}
      }
    }
    
    // Initialize spend type level
    if (!hierarchy[sub_business_line].children[cost_line].children[spend_type]) {
      hierarchy[sub_business_line].children[cost_line].children[spend_type] = {
        id: `st_${sub_business_line}_${cost_line}_${spend_type}`,
        level: 'spend_type',
        name: spend_type,
        budget: 0,
        actual: 0,
        variance: 0,
        utilization: 0,
        children: []
      }
    }
    
    // Add sub-category level
    const subCategoryItem = {
      id: item.id,
      level: 'sub_category',
      name: spend_sub_category,
      budget,
      actual,
      variance: budget - actual,
      utilization: budget > 0 ? (actual / budget) * 100 : 0
    }
    
    hierarchy[sub_business_line].children[cost_line].children[spend_type].children.push(subCategoryItem)
    
    // Roll up totals
    hierarchy[sub_business_line].children[cost_line].children[spend_type].budget += budget
    hierarchy[sub_business_line].children[cost_line].children[spend_type].actual += actual
    
    hierarchy[sub_business_line].children[cost_line].budget += budget
    hierarchy[sub_business_line].children[cost_line].actual += actual
    
    hierarchy[sub_business_line].budget += budget
    hierarchy[sub_business_line].actual += actual
  })
  
  // Convert to array format and calculate derived values
  const result: any[] = []
  
  Object.values(hierarchy).forEach((businessLine: any) => {
    businessLine.variance = businessLine.budget - businessLine.actual
    businessLine.utilization = businessLine.budget > 0 
      ? (businessLine.actual / businessLine.budget) * 100 
      : 0
    
    const costLines: any[] = []
    Object.values(businessLine.children).forEach((costLine: any) => {
      costLine.variance = costLine.budget - costLine.actual
      costLine.utilization = costLine.budget > 0 
        ? (costLine.actual / costLine.budget) * 100 
        : 0
      
      const spendTypes: any[] = []
      Object.values(costLine.children).forEach((spendType: any) => {
        spendType.variance = spendType.budget - spendType.actual
        spendType.utilization = spendType.budget > 0 
          ? (spendType.actual / spendType.budget) * 100 
          : 0
        
        spendTypes.push({
          ...spendType,
          children: spendType.children
        })
      })
      
      costLines.push({
        ...costLine,
        children: spendTypes
      })
    })
    
    result.push({
      ...businessLine,
      children: costLines
    })
  })
  
  return result
}