#!/usr/bin/env node
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs').promises;
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration(sqlFile) {
  try {
    console.log(`\n📋 Running migration: ${sqlFile}`);
    console.log('=' .repeat(50));
    
    const sqlContent = await fs.readFile(sqlFile, 'utf8');
    
    // Since Supabase client doesn't directly execute raw SQL through the JS SDK,
    // we'll use the Supabase REST API with the service role key
    // For now, let's try using the rpc method if available
    
    console.log('⚠️  Note: Direct SQL execution requires service role key or database URL.');
    console.log('The anon key has limited permissions.');
    console.log('\nSQL to execute:');
    console.log('-'.repeat(50));
    console.log(sqlContent.substring(0, 500) + '...');
    
    // Try to execute through Supabase RPC if you have a function set up
    // Otherwise, this will need to be done through the Supabase dashboard
    
    console.log('\n⚠️  Please execute the following SQL scripts manually through:');
    console.log('1. Supabase Dashboard SQL Editor (https://app.supabase.com)');
    console.log('2. Or use the Supabase CLI with proper authentication');
    console.log(`3. SQL file location: ${sqlFile}`);
    
    return { success: false, message: 'Manual execution required' };
    
  } catch (error) {
    console.error(`❌ Error reading migration file: ${error.message}`);
    return { success: false, error };
  }
}

async function main() {
  const migrations = [
    'scripts/007_add_invoice_tracking_columns.sql',
    'scripts/008_populate_invoice_data.sql'
  ];
  
  console.log('🚀 Starting database migrations...');
  console.log(`📍 Supabase URL: ${supabaseUrl}`);
  
  for (const migration of migrations) {
    const fullPath = path.join(process.cwd(), migration);
    await runMigration(fullPath);
  }
  
  console.log('\n✅ Migration script completed');
  console.log('Please check the Supabase dashboard to verify the changes.');
}

main().catch(console.error);