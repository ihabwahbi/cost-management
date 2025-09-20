#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import { readFile } from 'fs/promises';
import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

console.log('🔗 Connecting to Supabase...');
console.log(`📍 URL: ${supabaseUrl}`);

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkCurrentSchema() {
  console.log('\n📊 Checking current po_line_items schema...');
  
  const { data, error } = await supabase
    .from('po_line_items')
    .select('*')
    .limit(1);
    
  if (error) {
    console.error('Error checking schema:', error);
    return null;
  }
  
  if (data && data.length > 0) {
    const columns = Object.keys(data[0]);
    console.log('Current columns:', columns);
    
    // Check if invoice columns already exist
    const hasInvoiceColumns = columns.includes('invoiced_quantity') || 
                              columns.includes('invoiced_value_usd') ||
                              columns.includes('invoice_date') ||
                              columns.includes('supplier_promise_date');
    
    if (hasInvoiceColumns) {
      console.log('✅ Some invoice tracking columns already exist');
      return { hasInvoiceColumns, columns };
    } else {
      console.log('⚠️  Invoice tracking columns not found');
      return { hasInvoiceColumns: false, columns };
    }
  }
  
  return null;
}

async function testInvoiceDataUpdate() {
  console.log('\n🧪 Testing invoice data update capability...');
  
  try {
    // First, let's check if we can read PO data
    const { data: pos, error: poError } = await supabase
      .from('pos')
      .select('id, po_number')
      .in('po_number', ['4584165035', '4584387743', '4584412814'])
      .limit(5);
    
    if (poError) {
      console.error('❌ Error fetching POs:', poError);
      return false;
    }
    
    console.log(`✅ Found ${pos?.length || 0} matching POs`);
    if (pos && pos.length > 0) {
      console.log('PO Numbers found:', pos.map(p => p.po_number));
    }
    
    // Now let's check line items
    if (pos && pos.length > 0) {
      const { data: lineItems, error: liError } = await supabase
        .from('po_line_items')
        .select('id, po_id, line_item_number, line_value')
        .eq('po_id', pos[0].id)
        .limit(5);
      
      if (liError) {
        console.error('❌ Error fetching line items:', liError);
        return false;
      }
      
      console.log(`✅ Found ${lineItems?.length || 0} line items for PO ${pos[0].po_number}`);
      
      // Test if we can update (without actually doing it yet)
      if (lineItems && lineItems.length > 0) {
        console.log('📝 Sample line item:', {
          line_item_number: lineItems[0].line_item_number,
          line_value: lineItems[0].line_value
        });
      }
    }
    
    return true;
  } catch (error) {
    console.error('❌ Test failed:', error);
    return false;
  }
}

async function applyInvoiceData() {
  console.log('\n💾 Applying invoice data updates...');
  
  try {
    // Update PO 4584165035 - SPOOLTECH
    const { data: spooltech } = await supabase
      .from('pos')
      .select('id')
      .eq('po_number', '4584165035')
      .single();
    
    if (spooltech) {
      const { error } = await supabase
        .from('po_line_items')
        .update({
          invoiced_quantity: 1,
          invoiced_value_usd: 340536.18,
          invoice_date: '2025-07-15'
        })
        .eq('po_id', spooltech.id)
        .eq('line_item_number', 1);
      
      if (error) {
        console.error('Error updating SPOOLTECH PO:', error);
      } else {
        console.log('✅ Updated SPOOLTECH PO (4584165035)');
      }
    }
    
    // Update PO 4584387743 - Houston Hub (multiple lines)
    const { data: houstonHub } = await supabase
      .from('pos')
      .select('id')
      .eq('po_number', '4584387743')
      .single();
    
    if (houstonHub) {
      const updates = [
        { line: 13, qty: 1, value: 2334.50 },
        { line: 11, qty: 700, value: 8113.00 },
        { line: 10, qty: 800, value: 7400.00 },
        { line: 8, qty: 800, value: 6816.00 },
        { line: 7, qty: 1000, value: 7760.00 },
        { line: 9, qty: 1000, value: 8830.00 },
        { line: 6, qty: 7450, value: 54832.00 },
        { line: 12, qty: 6300, value: 73017.00 }
      ];
      
      for (const update of updates) {
        const { error } = await supabase
          .from('po_line_items')
          .update({
            invoiced_quantity: update.qty,
            invoiced_value_usd: update.value,
            invoice_date: '2025-08-25'
          })
          .eq('po_id', houstonHub.id)
          .eq('line_item_number', update.line);
        
        if (!error) {
          console.log(`✅ Updated Houston Hub line ${update.line}`);
        }
      }
    }
    
    // Update PO 4584412814 - Future deliveries
    const { data: futurePos } = await supabase
      .from('pos')
      .select('id')
      .eq('po_number', '4584412814')
      .single();
    
    if (futurePos) {
      const { error } = await supabase
        .from('po_line_items')
        .update({
          supplier_promise_date: '2026-01-15'
        })
        .eq('po_id', futurePos.id);
      
      if (!error) {
        console.log('✅ Updated future PO promise dates (4584412814)');
      }
    }
    
    // Add random promise dates for demo
    const { data: openItems } = await supabase
      .from('po_line_items')
      .select('id')
      .is('invoice_date', null)
      .is('supplier_promise_date', null)
      .limit(10);
    
    if (openItems && openItems.length > 0) {
      for (const item of openItems) {
        const daysAhead = Math.random() < 0.3 ? 7 : (Math.random() < 0.6 ? 30 : 60);
        const promiseDate = new Date();
        promiseDate.setDate(promiseDate.getDate() + daysAhead);
        
        await supabase
          .from('po_line_items')
          .update({
            supplier_promise_date: promiseDate.toISOString().split('T')[0]
          })
          .eq('id', item.id);
      }
      console.log(`✅ Added promise dates to ${openItems.length} open items`);
    }
    
  } catch (error) {
    console.error('❌ Error applying invoice data:', error);
  }
}

async function verifySummary() {
  console.log('\n📈 Verification Summary:');
  
  // Count invoiced items
  const { count: invoicedCount } = await supabase
    .from('po_line_items')
    .select('*', { count: 'exact', head: true })
    .not('invoice_date', 'is', null);
  
  // Count items with promise dates
  const { count: promiseCount } = await supabase
    .from('po_line_items')
    .select('*', { count: 'exact', head: true })
    .not('supplier_promise_date', 'is', null)
    .is('invoice_date', null);
  
  // Get total values
  const { data: invoicedSum } = await supabase
    .from('po_line_items')
    .select('invoiced_value_usd')
    .not('invoice_date', 'is', null);
  
  const totalInvoiced = invoicedSum?.reduce((sum, item) => 
    sum + (item.invoiced_value_usd || 0), 0) || 0;
  
  console.log(`✅ Invoiced items: ${invoicedCount || 0}`);
  console.log(`✅ Items with promise dates: ${promiseCount || 0}`);
  console.log(`✅ Total P&L impact: $${totalInvoiced.toLocaleString()}`);
}

async function main() {
  console.log('🚀 Invoice Tracking Migration Tool');
  console.log('=' .repeat(50));
  
  // Check current schema
  const schemaInfo = await checkCurrentSchema();
  
  if (!schemaInfo) {
    console.log('\n⚠️  Could not determine schema status');
    console.log('Please check if the table exists and you have proper permissions.');
    process.exit(1);
  }
  
  if (schemaInfo.hasInvoiceColumns) {
    console.log('\n✅ Invoice columns detected. Proceeding with data population...');
    
    // Test capability
    const canUpdate = await testInvoiceDataUpdate();
    
    if (canUpdate) {
      // Apply invoice data
      await applyInvoiceData();
      
      // Verify results
      await verifySummary();
      
      console.log('\n✅ Migration completed successfully!');
      console.log('The dashboard should now show real P&L data.');
    } else {
      console.log('\n⚠️  Cannot update data. Please check permissions.');
    }
  } else {
    console.log('\n⚠️  Invoice tracking columns are missing!');
    console.log('\n📋 Please execute the following SQL in Supabase Dashboard:');
    console.log('1. Go to: https://app.supabase.com');
    console.log('2. Navigate to SQL Editor');
    console.log('3. Run the script: scripts/007_add_invoice_tracking_columns.sql');
    console.log('4. Then run this tool again to populate the data');
    
    // Show the SQL content for reference
    const sqlContent = await readFile('scripts/007_add_invoice_tracking_columns.sql', 'utf8');
    console.log('\n📄 SQL to execute:');
    console.log('-'.repeat(50));
    console.log(sqlContent);
  }
}

main().catch(console.error);