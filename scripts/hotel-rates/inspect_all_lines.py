import sys, re
sys.stdout.reconfigure(encoding='utf-8')

with open(r'D:\Work\MASAAR\scripts\hotel-rates\Makkah_text.txt', encoding='utf-8') as f:
    m_text = f.read()
with open(r'D:\Work\MASAAR\scripts\hotel-rates\Madinah_text.txt', encoding='utf-8') as f:
    d_text = f.read()

m_pages = m_text.split('=== PAGE ')[1:]
d_pages = d_text.split('=== PAGE ')[1:]

for i, page in enumerate(m_pages, 1):
    lines = [l.strip() for l in page.split('\n') if l.strip()]
    header = [l for l in lines[:10] if l != 'Asfar Al Safwah' and 'ﺓﻮﻔﺼﻟﺍ' not in l and not l.startswith('===')]
    name = header[0] if header else f"Hotel {i}"
    print(f"\n================ [MAKKAH {i}: {name}] ================")
    for l in lines:
        if any(char.isdigit() for char in l) or 'room' in l.lower() or 'breakfast' in l.lower() or 'incl' in l.lower() or 'sr' in l.lower() or 'sar' in l.lower():
            print(f"  {l}")

for i, page in enumerate(d_pages, 1):
    lines = [l.strip() for l in page.split('\n') if l.strip()]
    header = [l for l in lines[:10] if l != 'Asfar Al Safwah' and 'ﺓﻮﻔﺼﻟﺍ' not in l and not l.startswith('===')]
    name = header[0] if header else f"Hotel {i}"
    print(f"\n================ [MADINAH {i}: {name}] ================")
    for l in lines:
        if any(char.isdigit() for char in l) or 'room' in l.lower() or 'breakfast' in l.lower() or 'incl' in l.lower() or 'sr' in l.lower() or 'sar' in l.lower():
            print(f"  {l}")
