import sys, os, re, json
sys.stdout.reconfigure(encoding='utf-8')

with open(r'D:\Work\MASAAR\scripts\hotel-rates\Makkah_text.txt', encoding='utf-8') as f:
    m_text = f.read()
with open(r'D:\Work\MASAAR\scripts\hotel-rates\Madinah_text.txt', encoding='utf-8') as f:
    d_text = f.read()

m_pages = m_text.split('=== PAGE ')[1:]
d_pages = d_text.split('=== PAGE ')[1:]

print(f"Makkah pages: {len(m_pages)}, Madinah pages: {len(d_pages)}")

def dump_page_analysis(pages, city):
    print(f"\n==================== {city} ({len(pages)} HOTELS) ====================")
    for idx, page in enumerate(pages, 1):
        lines = [l.strip() for l in page.split('\n') if l.strip()]
        header = [l for l in lines[:10] if l != 'Asfar Al Safwah' and 'ﺓﻮﻔﺼﻟﺍ' not in l and not l.startswith('===')]
        print(f"\n[{city} #{idx}] {header[0] if header else 'Unknown'}")
        for l in lines:
            # print lines that look like rates or room info
            if any(char.isdigit() for char in l) or 'room' in l.lower() or 'double' in l.lower() or 'period' in l.lower() or 'breakfast' in l.lower():
                print(f"   {l}")

dump_page_analysis(m_pages, "MAKKAH")
dump_page_analysis(d_pages, "MADINAH")
