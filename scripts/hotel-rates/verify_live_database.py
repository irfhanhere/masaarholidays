import sys, os, re, json, urllib.request

sys.stdout.reconfigure(encoding='utf-8')

env = {}
with open('.env.local', 'r', encoding='utf-8') as f:
    for line in f:
        m = re.match(r'^([^=]+)=(.*)$', line.strip())
        if m:
            env[m.group(1).strip()] = m.group(2).strip()

SUPABASE_URL = env['NEXT_PUBLIC_SUPABASE_URL']
SUPABASE_KEY = env['SUPABASE_SERVICE_ROLE_KEY']

def supabase_request(endpoint):
    url = f"{SUPABASE_URL}/rest/v1/{endpoint}"
    headers = {
        'apikey': SUPABASE_KEY,
        'Authorization': f"Bearer {SUPABASE_KEY}",
        'Content-Type': 'application/json',
    }
    req = urllib.request.Request(url, headers=headers, method='GET')
    with urllib.request.urlopen(req) as resp:
        content = resp.read().decode('utf-8')
        return json.loads(content) if content else []

print("="*60)
print("RUNNING LIVE DATABASE HEALTH & QUALITY AUDIT")
print("="*60)

hotels = supabase_request("hotels?select=id,name,city,slug,is_active,price_from_aed,star_rating,image_url,walk_time_minutes,distance_from_haram_meters,route_type,terrain_note,data_confidence&order=name.asc")
rooms = supabase_request("hotel_rooms?select=id,hotel_id,room_type,price_ro,price_bb,notes,is_active,view_options,board_basis_options,rate_period_label&order=id.asc")

print(f"Total Hotels in DB: {len(hotels)}")
print(f"Total Rooms in DB: {len(rooms)}")

issues = []
warnings = []

# 1. Slugs & Names
slug_counts = {}
name_counts = {}
for h in hotels:
    slug = h.get('slug')
    name = h.get('name', '').strip()
    slug_counts[slug] = slug_counts.get(slug, 0) + 1
    name_counts[name.lower()] = name_counts.get(name.lower(), 0) + 1

for slug, count in slug_counts.items():
    if count > 1:
        issues.append(f"Duplicate slug found: '{slug}' used {count} times!")

for name, count in name_counts.items():
    if count > 1:
        warnings.append(f"Hotel name appears {count} times (case-insensitive): '{name}'")

# 2. Rooms mapping to hotels
rooms_by_hotel = {}
for r in rooms:
    hid = r['hotel_id']
    if hid not in rooms_by_hotel:
        rooms_by_hotel[hid] = []
    rooms_by_hotel[hid].append(r)

hotels_without_rooms = []
zero_price_rooms = []
hotel_price_mismatches = []

makkah_hotels = [h for h in hotels if h.get('city') == 'Makkah']
madinah_hotels = [h for h in hotels if h.get('city') == 'Madinah']
other_city_hotels = [h for h in hotels if h.get('city') not in ('Makkah', 'Madinah')]

if other_city_hotels:
    issues.append(f"Hotels found with unknown city: {[h['name'] for h in other_city_hotels]}")

for h in hotels:
    hid = h['id']
    hrooms = rooms_by_hotel.get(hid, [])
    if not hrooms:
        hotels_without_rooms.append(h)
    else:
        # compute min price from rooms
        room_prices = []
        for r in hrooms:
            p_ro = r.get('price_ro')
            p_bb = r.get('price_bb')
            if p_ro is not None and p_ro > 0:
                room_prices.append(p_ro)
            if p_bb is not None and p_bb > 0:
                room_prices.append(p_bb)
        if room_prices:
            min_room_price = min(room_prices)
            h_price = h.get('price_from_aed')
            if h_price is None or abs(h_price - min_room_price) > 5:
                hotel_price_mismatches.append({
                    'hotel': h['name'],
                    'city': h['city'],
                    'hotel_price_from_aed': h_price,
                    'min_room_price_aed': min_room_price
                })

for r in rooms:
    p_ro = r.get('price_ro')
    p_bb = r.get('price_bb')
    if (p_ro is None or p_ro <= 0) and (p_bb is None or p_bb <= 0):
        zero_price_rooms.append(r)

print(f"\nHotels by City: Makkah = {len(makkah_hotels)}, Madinah = {len(madinah_hotels)}")
print(f"Hotels with rooms: {len(hotels) - len(hotels_without_rooms)} / {len(hotels)}")
print(f"Hotels without rooms in hotel_rooms table: {len(hotels_without_rooms)}")

if hotels_without_rooms:
    print("\n[NOTE] Hotels without rooms in hotel_rooms table (standalone or legacy):")
    for h in hotels_without_rooms:
        print(f"  - {h['name']} ({h['city']}) [price_from_aed: {h.get('price_from_aed')}]")

if zero_price_rooms:
    issues.append(f"Found {len(zero_price_rooms)} rooms where both price_ro and price_bb are null or <= 0!")

print(f"\nPrice Check:")
print(f"  Rooms with 0/negative/null both prices: {len(zero_price_rooms)}")
print(f"  Hotels where price_from_aed != min(room.price): {len(hotel_price_mismatches)}")

if hotel_price_mismatches:
    print(f"\nSample price differences (hotel.price_from_aed vs min room price, total {len(hotel_price_mismatches)}):")
    for m in hotel_price_mismatches[:5]:
        print(f"  - {m['hotel']}: hotel.price_from_aed = {m['hotel_price_from_aed']}, min_room_price = {m['min_room_price_aed']}")

# 3. Check image_url
hotels_missing_image = [h['name'] for h in hotels if not h.get('image_url')]
print(f"\nHotels without image_url: {len(hotels_missing_image)} / {len(hotels)}")
if hotels_missing_image:
    print(f"  (These use the site-wide luxury hotel banner fallback: /brand/banners/hotel.webp)")

# 4. Check data confidence
confidence_counts = {}
for h in hotels:
    c = h.get('data_confidence', 'unknown')
    confidence_counts[c] = confidence_counts.get(c, 0) + 1
print(f"\nData Confidence Distribution across Hotels:")
for c, cnt in confidence_counts.items():
    print(f"  - {c}: {cnt}")

print("\n" + "="*60)
print("AUDIT FINDINGS SUMMARY:")
print("="*60)
if issues:
    print("[FAIL] CRITICAL ISSUES DETECTED:")
    for iss in issues:
        print(f"  - {iss}")
else:
    print("[PASS] All database integrity checks passed with 0 critical issues!")

if warnings:
    print(f"\n[INFO] {len(warnings)} Warnings / Observations:")
    for w in warnings:
        print(f"  - {w}")
