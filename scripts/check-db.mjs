import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Read .env.local manually
const envContent = fs.readFileSync('.env.local', 'utf8');
const env = {};
for (const line of envContent.split('\n')) {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    env[match[1].trim()] = match[2].trim();
  }
}

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { data: transfers, error: tErr } = await supabase.from('transfers').select('*');
  console.log('TRANSFERS COUNT:', transfers?.length, 'error:', tErr?.message);
  if (transfers && transfers.length > 0) {
    console.log('TRANSFERS COLS:', Object.keys(transfers[0]));
    console.log('SAMPLE TRANSFER:', JSON.stringify(transfers[0], null, 2));
  }

  const { data: vehicles, error: vErr } = await supabase.from('transfer_vehicles').select('*');
  console.log('VEHICLES COUNT:', vehicles?.length, 'error:', vErr?.message);
  if (vehicles && vehicles.length > 0) {
    console.log('VEHICLES COLS:', Object.keys(vehicles[0]));
    console.log('ALL VEHICLES:', JSON.stringify(vehicles, null, 2));
  }

  const { data: rates, error: rErr } = await supabase.from('transfer_route_rates').select('*');
  console.log('RATES COUNT:', rates?.length, 'error:', rErr?.message);
  if (rates && rates.length > 0) {
    console.log('SAMPLE RATES:', JSON.stringify(rates.slice(0, 5), null, 2));
  }

  const { data: cats, error: cErr } = await supabase.from('transfer_categories').select('*');
  console.log('TRANSFER_CATEGORIES COUNT:', cats?.length, 'error:', cErr?.message);
}

run();
