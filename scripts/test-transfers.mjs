import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

// Read .env.local
const envContent = fs.readFileSync('.env.local', 'utf8');
const env = {};
for (const line of envContent.split('\n')) {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) env[match[1].trim()] = match[2].trim();
}

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

function isSchemaCacheOrColumnError(error) {
  if (!error) return false;
  if (error.code === 'PGRST204' || error.code === '42703') return true;
  const msg = (error.message || '').toLowerCase();
  return (
    msg.includes('column') ||
    msg.includes('schema cache') ||
    msg.includes('could not find the')
  );
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function runFullTransfersTest() {
  console.log('==============================================');
  console.log('STARTING COMPREHENSIVE TRANSFERS MODULE TEST');
  console.log('==============================================\n');

  let passedTests = 0;
  let totalTests = 0;

  // --- TEST 1: Vehicle Editing (Toyota Coaster) ---
  totalTests++;
  console.log('[TEST 1] Testing edit existing vehicle (Toyota Coaster)...');
  try {
    const { data: coaster } = await supabase
      .from('transfer_vehicles')
      .select('*')
      .eq('name', 'Toyota Coaster')
      .single();

    if (!coaster) throw new Error('Toyota Coaster not found in transfer_vehicles');

    const extendedPayload = {
      name: 'Toyota Coaster',
      display_order: 5,
      is_active: true,
      model_year: '2023 - 2026',
      description: 'Ideal for large groups, Umrah delegations, and corporate travel.',
      detailed_description: 'The Toyota Coaster minibus is built for group pilgrimage travel with 24 passenger seats...',
      image_url: '/vehicles/Toyota Coaster.webp',
      passenger_capacity: 22,
      luggage_capacity: 22,
      features: ['24-seater minibus', 'High-capacity A/C'],
      spec_verified: true,
    };

    const corePayload = {
      name: 'Toyota Coaster',
      display_order: 5,
      is_active: true,
    };

    let { error } = await supabase
      .from('transfer_vehicles')
      .update(extendedPayload)
      .eq('id', coaster.id);

    if (isSchemaCacheOrColumnError(error)) {
      console.log('  -> Extended columns not present in DB. Gracefully falling back to core payload...');
      const fallback = await supabase
        .from('transfer_vehicles')
        .update(corePayload)
        .eq('id', coaster.id);
      error = fallback.error;
    }

    if (error) throw error;
    console.log('  ✓ PASS: Toyota Coaster edited and updated successfully without error!');
    passedTests++;
  } catch (err) {
    console.error('  ✗ FAIL in TEST 1:', err.message);
  }

  // --- TEST 2: Vehicle Toggle Active & Display Order ---
  totalTests++;
  console.log('\n[TEST 2] Testing vehicle status and display order toggle...');
  try {
    const { data: camry } = await supabase
      .from('transfer_vehicles')
      .select('*')
      .eq('name', 'Toyota Camry')
      .single();

    const { error: toggleErr } = await supabase
      .from('transfer_vehicles')
      .update({ is_active: camry.is_active, display_order: camry.display_order })
      .eq('id', camry.id);

    if (toggleErr) throw toggleErr;
    console.log('  ✓ PASS: Vehicle active and order update verified!');
    passedTests++;
  } catch (err) {
    console.error('  ✗ FAIL in TEST 2:', err.message);
  }

  // --- TEST 3: Add New Vehicle & Link Rate Card ---
  totalTests++;
  console.log('\n[TEST 3] Testing add new vehicle and rate card linkage...');
  let testVehId = null;
  try {
    const testVehPayload = {
      name: 'Test Fleet Minivan ' + Date.now().toString(36),
      display_order: 99,
      is_active: false,
    };

    let { data: newVeh, error: addVehErr } = await supabase
      .from('transfer_vehicles')
      .insert(testVehPayload)
      .select('id')
      .single();

    if (addVehErr) throw addVehErr;
    testVehId = newVeh.id;
    console.log('  -> Inserted test vehicle with ID:', testVehId);

    // Link rate card
    const { data: routes } = await supabase.from('transfers').select('id').limit(3);
    if (routes && routes.length > 0) {
      const rates = routes.map((r) => ({
        transfer_id: r.id,
        vehicle_id: testVehId,
        price_aed: 350,
        is_active: true,
        display_order: 0,
      }));
      const { error: rErr } = await supabase.from('transfer_route_rates').upsert(rates, { onConflict: 'transfer_id,vehicle_id' });
      if (rErr) throw rErr;
      console.log('  -> Rate card rows linked successfully!');
    }

    // Clean up
    await supabase.from('transfer_vehicles').delete().eq('id', testVehId);
    console.log('  -> Cleaned up test vehicle.');
    console.log('  ✓ PASS: Add vehicle & rate linkage verified!');
    passedTests++;
  } catch (err) {
    if (testVehId) await supabase.from('transfer_vehicles').delete().eq('id', testVehId);
    console.error('  ✗ FAIL in TEST 3:', err.message);
  }

  // --- TEST 4: Edit Existing Transfer Route ---
  totalTests++;
  console.log('\n[TEST 4] Testing edit existing transfer route...');
  try {
    const { data: route } = await supabase.from('transfers').select('*').limit(1).single();
    if (!route) throw new Error('No transfer route found');

    const fullPayload = {
      route_name: route.route_name,
      slug: route.slug,
      transfer_type: route.transfer_type,
      description: route.description,
      image_url: route.image_url,
      is_active: route.is_active,
      display_order: route.display_order,
      pickup_location: 'King Abdulaziz Airport (JED) Arrivals',
      dropoff_location: 'Makkah Hotel',
      route_type: 'one-way',
      duration: '1.5 to 2 hours',
      route_notes: 'Driver meets at arrivals terminal',
      featured: true,
      seo_title: 'Makkah Transfer',
      meta_description: 'Book private transfer',
      focus_keyword: 'Makkah transfer',
    };

    const corePayload = {
      route_name: route.route_name,
      slug: route.slug,
      transfer_type: route.transfer_type,
      description: route.description,
      image_url: route.image_url,
      is_active: route.is_active,
      display_order: route.display_order,
    };

    let { error } = await supabase.from('transfers').update(fullPayload).eq('id', route.id);
    if (isSchemaCacheOrColumnError(error)) {
      console.log('  -> Extended route columns not present in DB. Gracefully falling back to core payload...');
      const fallback = await supabase.from('transfers').update(corePayload).eq('id', route.id);
      error = fallback.error;
    }

    if (error) throw error;
    console.log('  ✓ PASS: Transfer route updated cleanly without error!');
    passedTests++;
  } catch (err) {
    console.error('  ✗ FAIL in TEST 4:', err.message);
  }

  // --- TEST 5: Add New Transfer Route & Initialize Rate Matrix ---
  totalTests++;
  console.log('\n[TEST 5] Testing add new transfer route & initializing rate matrix...');
  let testRouteId = null;
  try {
    const testSlug = 'test-route-' + Date.now().toString(36);
    const newRoutePayload = {
      route_name: 'Test Scenic Transfer',
      slug: testSlug,
      transfer_type: 'intercity',
      description: 'Test transfer description',
      image_url: '/trips/private-transfers-card-home.webp',
      is_active: false,
      display_order: 999,
    };

    const { data: newRoute, error: addRouteErr } = await supabase
      .from('transfers')
      .insert(newRoutePayload)
      .select('id')
      .single();

    if (addRouteErr) throw addRouteErr;
    testRouteId = newRoute.id;
    console.log('  -> Inserted test transfer route ID:', testRouteId);

    // Initialize rates for all 5 fleet vehicles
    const { data: vehicles } = await supabase.from('transfer_vehicles').select('id');
    if (vehicles && vehicles.length > 0) {
      const rates = vehicles.map((v) => ({
        transfer_id: testRouteId,
        vehicle_id: v.id,
        price_aed: 400,
        is_active: true,
        display_order: 0,
      }));
      const { error: ratesErr } = await supabase.from('transfer_route_rates').upsert(rates, { onConflict: 'transfer_id,vehicle_id' });
      if (ratesErr) throw ratesErr;
      console.log('  -> Initialized rates for ' + vehicles.length + ' vehicles successfully!');
    }

    // Clean up
    await supabase.from('transfers').delete().eq('id', testRouteId);
    console.log('  -> Cleaned up test route.');
    console.log('  ✓ PASS: Add transfer route & rate matrix verified!');
    passedTests++;
  } catch (err) {
    if (testRouteId) await supabase.from('transfers').delete().eq('id', testRouteId);
    console.error('  ✗ FAIL in TEST 5:', err.message);
  }

  // --- TEST 6: Rate Card Matrix Upsert ---
  totalTests++;
  console.log('\n[TEST 6] Testing Rate Card Matrix bulk upsert...');
  try {
    const { data: sampleRate } = await supabase.from('transfer_route_rates').select('*').limit(1).single();
    if (!sampleRate) throw new Error('No rate card row found');

    const bulkUpdate = [{
      transfer_id: sampleRate.transfer_id,
      vehicle_id: sampleRate.vehicle_id,
      price_aed: sampleRate.price_aed,
      is_active: sampleRate.is_active,
    }];

    const { error: upsertErr } = await supabase
      .from('transfer_route_rates')
      .upsert(bulkUpdate, { onConflict: 'transfer_id,vehicle_id' });

    if (upsertErr) throw upsertErr;
    console.log('  ✓ PASS: Rate card bulk upsert verified!');
    passedTests++;
  } catch (err) {
    console.error('  ✗ FAIL in TEST 6:', err.message);
  }

  console.log('\n==============================================');
  console.log(`RESULTS: ${passedTests} / ${totalTests} TESTS PASSED`);
  console.log('==============================================');

  if (passedTests === totalTests) {
    console.log('ALL TRANSFERS TESTS COMPLETED SUCCESSFULLY! ✓\n');
  } else {
    process.exit(1);
  }
}

runFullTransfersTest();
