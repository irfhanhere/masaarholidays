import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

// Parse .env.local
const envPath = path.resolve(process.cwd(), '.env.local');
const env = {};
if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, 'utf-8').split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx !== -1) {
      const key = trimmed.slice(0, idx).trim();
      let val = trimmed.slice(idx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      env[key] = val;
    }
  }
}

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('=== 1. SUPABASE CONNECTION ===');
console.log('URL:', supabaseUrl ? 'Found' : 'Missing');
console.log('Service Key:', env.SUPABASE_SERVICE_ROLE_KEY ? 'Found' : 'Missing');

const supabase = createClient(supabaseUrl, supabaseKey);

async function runAudit() {
  console.log('\n=== 2. TABLE AUDIT ===');
  const targetTables = [
    'documents',
    'document_items',
    'document_sequences',
    'customers',
    'travellers',
    'bookings',
    'booking_items',
    'suppliers',
    'payments',
    'premium_umrah_packages',
    'packages',
    'hotels',
    'transfers',
    'enquiries',
    'admin_audit_logs',
    'profiles',
    'esim_orders'
  ];

  for (const table of targetTables) {
    try {
      const { data, error, count } = await supabase.from(table).select('*', { count: 'exact', head: false }).limit(2);
      if (error) {
        console.log(`Table [${table}]: ERROR - ${error.message}`);
      } else {
        console.log(`Table [${table}]: EXISTS, count = ${count ?? data?.length}, sample fields: ${data && data[0] ? Object.keys(data[0]).join(', ') : 'none'}`);
      }
    } catch (err) {
      console.log(`Table [${table}]: EXCEPTION - ${err.message}`);
    }
  }

  console.log('\n=== 3. BEST SELLING UMRAH PACKAGE VERIFICATION ===');
  const { data: bsp, error: bspErr } = await supabase
    .from('premium_umrah_packages')
    .select('id, slug, name, duration, hotels, quad_price, triple_price, double_price, single_price, child_with_bed_price, inclusions, itinerary')
    .eq('id', '1aa5d09c-0779-4c09-a677-51bfa3f5dd32')
    .single();

  if (bspErr) {
    console.log('Best Selling Package Query Error:', bspErr.message);
  } else {
    console.log('Best Selling Package Found:');
    console.log('ID:', bsp.id);
    console.log('Slug:', bsp.slug);
    console.log('Name:', bsp.name);
    console.log('Duration:', bsp.duration);
    console.log('Hotels:', JSON.stringify(bsp.hotels));
    console.log('Prices:', {
      quad: bsp.quad_price,
      triple: bsp.triple_price,
      double: bsp.double_price,
      single: bsp.single_price,
      child_with_bed: bsp.child_with_bed_price
    });
  }

  console.log('\n=== 4. EXISTING PACKAGES TABLE VERIFICATION ===');
  const { data: allPkgs } = await supabase.from('packages').select('id, name, slug, price, tier').limit(10);
  console.log('Packages in `packages` table:', allPkgs);

  console.log('\n=== 5. EXISTING DOCUMENT SEQUENCES & NUMBERING ===');
  const { data: seqs, error: seqErr } = await supabase.from('document_sequences').select('*');
  if (seqErr) console.log('Sequences Error:', seqErr.message);
  else console.log('Sequences in DB:', seqs);

  console.log('\n=== 6. EXISTING DOCUMENTS IN DB ===');
  const { data: docs, error: docErr } = await supabase.from('documents').select('id, document_number, type, status, total_amount, currency, customer_id, customer_name, metadata').limit(5);
  if (docErr) console.log('Documents Error:', docErr.message);
  else console.log('Recent Documents:', docs);
}

runAudit();
