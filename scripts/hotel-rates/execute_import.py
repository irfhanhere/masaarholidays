import sys, os, re, json, urllib.request
from hotels_data import HOTEL_CATALOG

sys.stdout.reconfigure(encoding='utf-8')

# Conversion formula: 1 SAR = 0.979 AED, +10% markup
def to_aed(sar):
    if sar is None:
        return None
    return round(sar * 0.979 * 1.10)

def slugify(text):
    text = text.lower().strip()
    text = re.sub(r'[^a-z0-9]+', '-', text)
    return text.strip('-')

# Read env
env = {}
with open('.env.local', 'r', encoding='utf-8') as f:
    for line in f:
        m = re.match(r'^([^=]+)=(.*)$', line.strip())
        if m:
            env[m.group(1).strip()] = m.group(2).strip()

SUPABASE_URL = env['NEXT_PUBLIC_SUPABASE_URL']
SUPABASE_KEY = env['SUPABASE_SERVICE_ROLE_KEY']

def supabase_request(endpoint, method='GET', data=None):
    url = f"{SUPABASE_URL}/rest/v1/{endpoint}"
    headers = {
        'apikey': SUPABASE_KEY,
        'Authorization': f"Bearer {SUPABASE_KEY}",
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
    }
    body = json.dumps(data).encode('utf-8') if data is not None else None
    req = urllib.request.Request(url, data=body, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as resp:
            content = resp.read().decode('utf-8')
            return json.loads(content) if content else None
    except urllib.error.HTTPError as e:
        err_msg = e.read().decode('utf-8')
        print(f"HTTP ERROR on {method} {url}: {e.code} - {err_msg}")
        raise e

# 1. Fetch all existing hotels and rooms
existing_hotels = supabase_request("hotels?select=id,name,city,slug,is_active,price_from_aed,distance_from_haram_meters")
hotels_by_name = {h['name'].lower(): h for h in existing_hotels}
print(f"Loaded {len(existing_hotels)} existing hotels from DB.")

existing_rooms = supabase_request("hotel_rooms?select=id,hotel_id,room_type,price_ro,price_bb")
rooms_by_hotel_and_type = {}
for r in existing_rooms:
    key = (r['hotel_id'], r['room_type'].lower().strip())
    rooms_by_hotel_and_type[key] = r
print(f"Loaded {len(existing_rooms)} existing hotel rooms from DB.")

# Plan summary counters
created_hotels_count = 0
matched_hotels_count = 0
inserted_rooms_count = 0
updated_rooms_count = 0

sql_statements = ["-- Migration 0080: Import supplier hotel rates from Asfar Al Safwah rate sheets\n"]

for hotel_info in HOTEL_CATALOG:
    pdf_name = hotel_info['pdf_name']
    target_name = hotel_info['target_db_name'] or pdf_name
    city = hotel_info['city']
    
    # Check if hotel exists in DB
    existing = hotels_by_name.get(target_name.lower())
    if not existing:
        # Check by pdf_name as fallback
        existing = hotels_by_name.get(pdf_name.lower())
    
    hotel_id = None
    if existing:
        hotel_id = existing['id']
        matched_hotels_count += 1
        print(f"MATCH: '{pdf_name}' -> DB '{existing['name']}' (ID: {hotel_id})")
    else:
        # Create new hotel record
        new_slug = slugify(pdf_name)
        # Ensure slug uniqueness
        slug_check = supabase_request(f"hotels?slug=eq.{new_slug}&select=id")
        if slug_check and len(slug_check) > 0:
            new_slug = f"{new_slug}-{city.lower()}"
        
        hotel_payload = {
            "name": pdf_name,
            "city": city,
            "slug": new_slug,
            "category": hotel_info.get("category", "Standard"),
            "star_rating": hotel_info.get("star_rating"),
            "is_active": True,
            "data_confidence": "needs_verification",
            "admin_caution_note": "Imported from Asfar Al Safwah rate sheet. Walking distance and terrain pending verification."
        }
        res = supabase_request("hotels", method='POST', data=hotel_payload)
        hotel_id = res[0]['id']
        hotels_by_name[pdf_name.lower()] = res[0]
        created_hotels_count += 1
        print(f"CREATED NEW HOTEL: '{pdf_name}' ({city}) -> ID: {hotel_id}")
        sql_statements.append(f"-- Insert new hotel: {pdf_name}\nINSERT INTO public.hotels (id, name, city, slug, category, star_rating, is_active, data_confidence, admin_caution_note) VALUES ('{hotel_id}', '{pdf_name}', '{city}', '{new_slug}', '{hotel_payload['category']}', {hotel_payload['star_rating'] or 'NULL'}, true, 'needs_verification', 'Imported from Asfar Al Safwah rate sheet. Walking distance and terrain pending verification.') ON CONFLICT (id) DO NOTHING;\n")

    # Now process rooms for this hotel
    min_hotel_price = None
    for r_idx, room in enumerate(hotel_info['rooms']):
        r_type = room['room_type']
        low_sar = room['net_sar_low']
        sell_aed = to_aed(low_sar)
        if min_hotel_price is None or sell_aed < min_hotel_price:
            min_hotel_price = sell_aed
        
        price_ro = None
        price_bb = None
        if "Room Only" in room['meal_basis']:
            price_ro = sell_aed
        else:
            price_bb = sell_aed
        
        room_payload = {
            "hotel_id": hotel_id,
            "room_type": r_type,
            "price_ro": price_ro,
            "price_bb": price_bb,
            "notes": room['notes'],
            "rate_period_label": room['period_label'],
            "view_options": room['view_options'],
            "board_basis_options": room['board_basis_options'],
            "is_active": True,
            "display_order": r_idx
        }
        
        room_key = (hotel_id, r_type.lower().strip())
        existing_room = rooms_by_hotel_and_type.get(room_key)
        
        if existing_room:
            # Update existing room
            supabase_request(f"hotel_rooms?id=eq.{existing_room['id']}", method='PATCH', data=room_payload)
            updated_rooms_count += 1
        else:
            # Insert room
            supabase_request("hotel_rooms", method='POST', data=room_payload)
            inserted_rooms_count += 1
            
        sql_statements.append(f"INSERT INTO public.hotel_rooms (hotel_id, room_type, price_ro, price_bb, notes, rate_period_label, view_options, board_basis_options, is_active, display_order) VALUES ('{hotel_id}', '{r_type}', {price_ro or 'NULL'}, {price_bb or 'NULL'}, '{room['notes']}', '{room['period_label']}', ARRAY{json.dumps(room['view_options'])}, ARRAY{json.dumps(room['board_basis_options'])}, true, {r_idx}) ON CONFLICT (hotel_id, room_type) DO UPDATE SET price_ro = EXCLUDED.price_ro, price_bb = EXCLUDED.price_bb, notes = EXCLUDED.notes, rate_period_label = EXCLUDED.rate_period_label, view_options = EXCLUDED.view_options, board_basis_options = EXCLUDED.board_basis_options;\n")

    # Update hotel.price_from_aed
    if min_hotel_price is not None:
        supabase_request(f"hotels?id=eq.{hotel_id}", method='PATCH', data={"price_from_aed": min_hotel_price})
        sql_statements.append(f"UPDATE public.hotels SET price_from_aed = {min_hotel_price} WHERE id = '{hotel_id}';\n")

print(f"\n================ IMPORT COMPLETE ================")
print(f"Matched existing hotels (not duplicated): {matched_hotels_count}")
print(f"Created new hotels: {created_hotels_count}")
print(f"Inserted new rooms: {inserted_rooms_count}")
print(f"Updated existing rooms: {updated_rooms_count}")

# Save migration file
with open("supabase/migrations/0080_supplier_hotel_rates_import.sql", "w", encoding="utf-8") as f:
    f.writelines(sql_statements)
print("Saved migration file to supabase/migrations/0080_supplier_hotel_rates_import.sql")
