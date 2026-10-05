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
    with urllib.request.urlopen(req) as resp:
        content = resp.read().decode('utf-8')
        return json.loads(content) if content else None

hotels = supabase_request("hotels?select=id,name,city,price_from_aed")
rooms = supabase_request("hotel_rooms?select=id,hotel_id,price_ro,price_bb")

rooms_by_hotel = {}
for r in rooms:
    hid = r['hotel_id']
    if hid not in rooms_by_hotel:
        rooms_by_hotel[hid] = []
    rooms_by_hotel[hid].append(r)

updated_count = 0
for h in hotels:
    hid = h['id']
    hrooms = rooms_by_hotel.get(hid, [])
    if not hrooms:
        continue
    
    room_prices = []
    for r in hrooms:
        if r.get('price_ro') and r['price_ro'] > 0:
            room_prices.append(r['price_ro'])
        if r.get('price_bb') and r['price_bb'] > 0:
            room_prices.append(r['price_bb'])
    
    if not room_prices:
        continue
    
    min_room_price = min(room_prices)
    curr_h_price = h.get('price_from_aed')
    
    if curr_h_price != min_room_price:
        supabase_request(f"hotels?id=eq.{hid}", method='PATCH', data={"price_from_aed": min_room_price})
        print(f"Updated '{h['name']}': price_from_aed {curr_h_price} -> {min_room_price} AED")
        updated_count += 1

print(f"\nDone! Synchronized {updated_count} hotels to match their exact minimum room rate.")
