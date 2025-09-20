const { createClient } = require('@supabase/supabase-js')

// Get Supabase credentials from environment
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function debugPLData() {
  console.log('=== Debugging P&L Data Flow ===\n')

  // 1. Get Shell Crux project
  const { data: projects, error: projectError } = await supabase
    .from('projects')
    .select('id, name, sub_business_line')
    .eq('name', 'Shell Crux Project')
  
  if (projectError) {
    console.error('Error fetching project:', projectError)
    return
  }
  
  console.log('Project found:', projects[0])
  const projectId = projects[0]?.id
  
  if (!projectId) {
    console.error('No Shell Crux project found')
    return
  }

  // 2. Check cost breakdown
  const { data: costBreakdown, error: cbError } = await supabase
    .from('cost_breakdown')
    .select('id, cost_line, spend_type, budget_cost')
    .eq('project_id', projectId)
    .limit(5)
  
  if (cbError) {
    console.error('Error fetching cost breakdown:', cbError)
  } else {
    console.log('\nCost breakdown (first 5):', costBreakdown)
    console.log('Total cost breakdown items:', costBreakdown?.length)
  }

  // 3. Check PO mappings
  const { data: mappings, error: mappingError } = await supabase
    .from('po_mappings')
    .select(`
      id,
      mapped_amount,
      po_line_item_id,
      cost_breakdown_id,
      cost_breakdown!inner(
        cost_line,
        spend_type
      )
    `)
    .in('cost_breakdown_id', costBreakdown?.map(cb => cb.id) || [])
    .limit(5)
  
  if (mappingError) {
    console.error('Error fetching PO mappings:', mappingError)
  } else {
    console.log('\nPO Mappings (first 5):', JSON.stringify(mappings, null, 2))
    console.log('Total PO mappings:', mappings?.length)
  }

  // 4. Check PO line items with invoice data
  const { data: lineItems, error: lineError } = await supabase
    .from('po_line_items')
    .select(`
      id,
      line_value,
      invoiced_value_usd,
      invoice_date,
      supplier_promise_date,
      pos!inner(
        po_number,
        vendor_name
      )
    `)
    .not('invoiced_value_usd', 'is', null)
    .limit(5)
  
  if (lineError) {
    console.error('Error fetching line items:', lineError)
  } else {
    console.log('\nPO Line Items with invoice data (first 5):', JSON.stringify(lineItems, null, 2))
    console.log('Total invoiced line items:', lineItems?.length)
  }

  // 5. Check the join - this is what pl-tracking-service.ts does
  const { data: joinedData, error: joinError } = await supabase
    .from('po_mappings')
    .select(`
      mapped_amount,
      po_line_item_id,
      po_line_items!inner (
        line_value,
        invoiced_value_usd,
        invoice_date,
        supplier_promise_date
      )
    `)
    .in('cost_breakdown_id', costBreakdown?.map(cb => cb.id) || [])
    .limit(5)
  
  if (joinError) {
    console.error('Error fetching joined data:', joinError)
  } else {
    console.log('\nJoined PO mappings with line items (first 5):', JSON.stringify(joinedData, null, 2))
    
    // Calculate totals
    let totalCommitted = 0
    let totalInvoiced = 0
    
    if (joinedData) {
      joinedData.forEach(item => {
        totalCommitted += Number(item.mapped_amount) || 0
        if (item.po_line_items?.invoiced_value_usd) {
          const ratio = item.mapped_amount / (item.po_line_items.line_value || 1)
          totalInvoiced += (item.po_line_items.invoiced_value_usd || 0) * ratio
        }
      })
    }
    
    console.log('\n=== Summary ===')
    console.log('Total Committed (from mappings):', totalCommitted)
    console.log('Total Invoiced (calculated):', totalInvoiced)
  }

  // 6. Get all cost breakdown IDs and check total budget
  const { data: allCostBreakdown } = await supabase
    .from('cost_breakdown')
    .select('id, budget_cost')
    .eq('project_id', projectId)
  
  const totalBudget = allCostBreakdown?.reduce((sum, cb) => sum + (Number(cb.budget_cost) || 0), 0) || 0
  console.log('Total Budget:', totalBudget)

  // 7. Get ALL PO mappings for this project
  const { data: allMappings } = await supabase
    .from('po_mappings')
    .select('mapped_amount')
    .in('cost_breakdown_id', allCostBreakdown?.map(cb => cb.id) || [])
  
  const totalMappedAmount = allMappings?.reduce((sum, m) => sum + (Number(m.mapped_amount) || 0), 0) || 0
  console.log('Total Mapped Amount (all POs):', totalMappedAmount)
}

debugPLData().catch(console.error)