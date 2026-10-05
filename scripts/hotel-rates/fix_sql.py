import re

with open("supabase/migrations/0080_supplier_hotel_rates_import.sql", "r", encoding="utf-8") as f:
    sql = f.read()

# Replace ARRAY["..."] with ARRAY['...']::text[]
# Also handle multiple items: ARRAY["A", "B"] -> ARRAY['A', 'B']::text[]
def fix_array(match):
    content = match.group(1) # e.g. "City View" or "City View", "Haram View"
    # replace double quotes with single quotes
    items = [item.strip() for item in content.split(",")]
    fixed_items = []
    for it in items:
        clean = it.strip('"').strip("'")
        clean = clean.replace("'", "''")
        fixed_items.append(f"'{clean}'")
    return f"ARRAY[{', '.join(fixed_items)}]::text[]"

fixed_sql = re.sub(r'ARRAY\[(.*?)\]', fix_array, sql)

with open("supabase/migrations/0080_supplier_hotel_rates_import.sql", "w", encoding="utf-8") as f:
    f.write(fixed_sql)

print("Fixed ARRAY syntax in 0080_supplier_hotel_rates_import.sql")
