import sys, re, json
sys.stdout.reconfigure(encoding='utf-8')

# SAR to AED conversion: SAR 1 = 0.979 AED
# Markup: +10%
# Multiplier: 0.979 * 1.10 = 1.0769
def sar_to_aed(sar_rate):
    if sar_rate is None:
        return None
    return round(sar_rate * 0.979 * 1.10)

print(f"Test conversion:")
print(f"Fairmont 910 SAR -> {sar_to_aed(910)} AED")
print(f"Fairmont 1940 SAR -> {sar_to_aed(1940)} AED")
print(f"Nasamat 80 SAR -> {sar_to_aed(80)} AED")
print(f"Nasamat 150 SAR -> {sar_to_aed(150)} AED")
print(f"Hilton Madinah 755 SAR -> {sar_to_aed(755)} AED")
print(f"Hilton Madinah 2770 SAR -> {sar_to_aed(2770)} AED")
