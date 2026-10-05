import sys
sys.stdout.reconfigure(encoding='utf-8')

def parse_pages(path, label):
    with open(path, encoding='utf-8') as f:
        text = f.read()
    pages = text.split('=== PAGE ')
    print(f'*** {label}: {len(pages)-1} pages ***')
    for idx, p in enumerate(pages[1:], 1):
        lines = [l.strip() for l in p.split('\n') if l.strip()]
        header = [l for l in lines[:10] if l != 'Asfar Al Safwah' and 'ﺓﻮﻔﺼﻟﺍ' not in l and not l.startswith('===')]
        print(f"Page {idx}: {' || '.join(header[:3])}")

parse_pages(r'D:\Work\MASAAR\scripts\hotel-rates\Makkah_text.txt', 'MAKKAH')
print()
parse_pages(r'D:\Work\MASAAR\scripts\hotel-rates\Madinah_text.txt', 'MADINAH')
