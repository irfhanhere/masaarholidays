import sys, json, re
sys.stdout.reconfigure(encoding='utf-8')

import urllib.request

# Load env
env = {}
with open('.env.local', 'r', encoding='utf-8') as f:
    for line in f:
        m = re.match(r'^([^=]+)=(.*)$', line.strip())
        if m:
            env[m.group(1).strip()] = m.group(2).strip()

url = env['NEXT_PUBLIC_SUPABASE_URL'] + '/rest/v1/hotels?select=id,name,city,slug,is_active,distance_from_haram_meters'
req = urllib.request.Request(url, headers={
    'apikey': env['SUPABASE_SERVICE_ROLE_KEY'],
    'Authorization': 'Bearer ' + env['SUPABASE_SERVICE_ROLE_KEY']
})

with urllib.request.urlopen(req) as resp:
    hotels = json.loads(resp.read().decode('utf-8'))

print(f'Total DB hotels: {len(hotels)}')

# Define our canonical match mapping
makkah_pdf_hotels = [
    ("Dar Al Tawhid Hotel Makkah", "Intercontinental Dar Al Tawhid"),
    ("Fairmont Hotel Makkah", "Makkah Clock Royal Tower"),
    ("Swissotel Makkah", "Swissôtel Makkah"),
    ("Swissotel Al Maqam", "Swissôtel Al Maqam"),
    ("Hyatt Regency Hotel", "Jabal Omar Hyatt Regency"),
    ("Movenpick Hajjar Makkah", "Mövenpick Hotel & Residences Hajar Tower Makkah"),
    ("Pullman Zamzam Makkah", "Zamzam Pullman"),
    ("Al Marwa Rayhaan by Rotana", "Al Marwa Rayhaan"),
    ("Makkah Hotel", "Makkah Hotel & Towers"),
    ("Makkah Towers", "Makkah Hotel & Towers"), # Could be child or distinct
    ("Address Jabal Omar", "Address Jabal Omar"),
    ("Rotana Jabal Omar", None),
    ("Hilton Suite Jabal Omar", "Hilton Suites Makkah"),
    ("Conrad Hotel Makkah", "Conrad Jabal Omar"),
    ("Hilton Convention Center", "Hilton Convention Makkah"),
    ("Doubletree by Hilton Makkah", "DoubleTree Jabal Omar"),
    ("Marriott Hotel Jabal Omar", "Jabal Omar Marriott"),
    ("Sheraton Jabal Kaaba", "Sheraton Jabal Al Kaaba"),
    ("El Ebaa Hotel Makkah", None),
    ("VOCO MAKKAH HOTEL", "voco Makkah"),
    ("ADDRESS AJYAD HOTEL", None),
    ("LULUAT AL TAWHEED HOTEL", None),
    ("POINCIANA HOTEL", None),
    ("KUDI TOWER HOTEL", None),
    ("AL REFA AL SUD HOTEL", None),
    ("BARAKAT AL REFA HOTEL", None),
    ("FAJR AL BADEA 1 HOTEL", None),
    ("NASAMAT AL KHAYR HOTEL", None)
]

madinah_pdf_hotels = [
    ("THE BILTMORE HOTEL", None),
    ("HILTON MADINAH HOTEL", "Madinah Hilton"),
    ("Dar Al Iman Intercontinental Hotel Madinah", "Intercontinental Madinah - Dar Al Iman by IHG"),
    ("DAR AL TAQWA HOTEL MADINAH", "Dar Al Taqwa"),
    ("Anwar Al Madinah Mövenpick", "Anwar Al Madinah Mövenpick"),
    ("MAKAREM BURJ ALMADINAH", "Makarem Burj Al Madinah"),
    ("Dar Al Hijrah Intercontinental Hotel", "InterContinental Dar Al Hijra Madinah"),
    ("PENINSULA WORTH HOTEL -MADINAH", None),
    ("PULLMAN ZAMAM HOTEL MADINAH", "Pullman Zamzam Madina"),
    ("CROWNE PLAZA HOTEL MADINAH", "Crowne Plaza Madinah"),
    ("AL MANAKHA ROTANA HOTEL", "Al Manakha Rotana Madinah"),
    ("TAIBA FRONT HOTEL MADINAH", None),
    ("MADEN HOTEL MADINAH", None),
    ("MADEN AL ROWDA HOTEL MADINAH", None),
    ("MADEN TAIBA HOTEL MADINAH", None),
    ("NOZOL ROYAL INN HOTEL", None),
    ("ELAF TAIBA HOTEL MADINAH", None),
    ("ELAF AL TAQWA HOTEL MADINAH", "Elaf Al Taqwa"),
    ("MUNA KAREEM HOTEL MADINAH", "Leader Al Muna Kareem Hotel"),
    ("SAJA BY WARWICK MADINAH", "Saja by Warwick Madinah")
]

db_names = {h['name'].lower(): h for h in hotels}

def test_matches(list_items, city):
    print(f"\n=== MATCH CHECK FOR {city} ===")
    for pdf_name, target in list_items:
        if target:
            matched = db_names.get(target.lower())
            if matched:
                print(f"MATCH: '{pdf_name}' -> DB '{matched['name']}' (ID: {matched['id']}, dist: {matched['distance_from_haram_meters']})")
            else:
                print(f"FAILED TO FIND TARGET: '{target}' in DB!")
        else:
            print(f"NEW HOTEL: '{pdf_name}' will be inserted into DB for {city}")

test_matches(makkah_pdf_hotels, 'Makkah')
test_matches(madinah_pdf_hotels, 'Madinah')
