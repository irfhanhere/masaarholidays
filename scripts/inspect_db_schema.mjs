import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

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
const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectSchema() {
  console.log('=== CHECKING TYPES AND TABLES IN DATABASE ===');
  
  // Let's check a sample document
  const { data: doc } = await supabase.from('documents').select('*').limit(1);
  console.log('Documents sample:', doc ? doc[0] : 'None');

  const { data: item } = await supabase.from('document_items').select('*').limit(1);
  console.log('Document items sample:', item ? item[0] : 'None');

  const { data: settings } = await supabase.from('document_settings').select('*').limit(1);
  console.log('Document settings sample:', settings ? settings[0] : 'None');

  const { data: templates } = await supabase.from('document_templates').select('*').limit(2);
  console.log('Document templates sample:', templates ? templates[0] : 'None');

  const { data: shares } = await supabase.from('document_shares').select('*').limit(1);
  console.log('Document shares sample:', shares ? shares[0] : 'None');

  const { data: versions } = await supabase.from('document_versions').select('*').limit(1);
  console.log('Document versions sample:', versions ? versions[0] : 'None');

  // Let's check pricing in premium_umrah_packages
  const { data: pup } = await supabase.from('premium_umrah_packages').select('id, slug, title, pricing, hotels, inclusions').eq('id', '1aa5d09c-0779-4c09-a677-51bfa3f5dd32');
  console.log('Best selling package details:', JSON.stringify(pup, null, 2));
}

inspectSchema();
