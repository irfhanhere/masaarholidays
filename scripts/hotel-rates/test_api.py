import sys, os, re, json, urllib.request

sys.stdout.reconfigure(encoding='utf-8')

# Formula:
# 1 SAR = 0.979 AED
# Markup = +10%
# Sell AED = round(Rate_SAR * 0.979 * 1.10)
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
    with urllib.request.urlopen(req) as resp:
        content = resp.read().decode('utf-8')
        return json.loads(content) if content else None

print("Checking Supabase connection...")
existing_hotels = supabase_request("hotels?select=id,name,city,slug,is_active,price_from_aed")
print(f"Loaded {len(existing_hotels)} existing hotels from DB.")
