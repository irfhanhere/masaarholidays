/**
 * Intelligent image resolver for Quotation & Document sections.
 * Ensures Hotel sections display actual luxury hotel architecture/interiors (never Ziyarat/mountain views)
 * and Transportation displays accurate vehicles (Sedan vs SUV vs Van).
 */

export function getHotelImage(name?: string | null, city?: string | null): string {
  const n = (name || "").toLowerCase();

  // Dar Al Tawheed Intercontinental Makkah
  if (n.includes("tawhid") || n.includes("tawheed") || (n.includes("intercontinental") && !n.includes("hijra"))) {
    return "/hotels/intercontinental-dar-al-tawhid/hero.webp";
  }

  // Intercontinental Dar Al Hijra Madinah
  if (n.includes("hijra") || (n.includes("intercontinental") && n.includes("madinah"))) {
    return "/hotels/intercontinental-dar-al-hijra-madinah/hero.webp";
  }

  // Swissôtel Makkah & Swissôtel Al Maqam
  if (n.includes("swiss") || n.includes("maqam")) {
    if (n.includes("maqam")) return "/hotels/swissotel-al-maqam/hero.jpg";
    return "/hotels/swissotel-makkah/hero.jpg";
  }

  // Makkah Clock Royal Tower / Fairmont
  if (n.includes("fairmont") || n.includes("clock") || n.includes("royal tower")) {
    return "/hotels/makkah-clock-royal-tower/hero.jpg";
  }

  // Raffles Makkah Palace
  if (n.includes("raffles")) {
    return "/hotels/raffles-makkah-palace/hero.webp";
  }

  // Conrad Jabal Omar
  if (n.includes("conrad")) {
    return "/hotels/conrad-jabal-omar/hero.jpg";
  }

  // Jumeirah Jabal Omar
  if (n.includes("jumeirah")) {
    return "/hotels/jumeirah-jabal-omar/hero.jpg";
  }

  // Hilton Suites Makkah
  if (n.includes("hilton suites")) {
    return "/hotels/hilton-suites-makkah/hero.jpg";
  }

  // Hilton Convention Makkah
  if (n.includes("hilton convention")) {
    return "/hotels/hilton-convention-makkah/hero.jpg";
  }

  // Madinah Hilton
  if (n.includes("madinah hilton") || (n.includes("hilton") && (n.includes("madinah") || city === "Madinah"))) {
    return "/hotels/madinah-hilton/hero.jpg";
  }

  // Voco Makkah
  if (n.includes("voco")) {
    return "/hotels/voco-makkah/hero.webp";
  }

  // Pullman Zamzam (Makkah & Madinah)
  if (n.includes("zamzam")) {
    if (n.includes("madina") || n.includes("madinah") || city === "Madinah") {
      return "/hotels/pullman-zamzam-madina/hero.jpg";
    }
    return "/hotels/zamzam-pullman/hero.jpg";
  }

  // Jabal Omar Marriott
  if (n.includes("marriott")) {
    return "/hotels/jabal-omar-marriott/hero.jpg";
  }

  // Le Meridien Makkah
  if (n.includes("meridien")) {
    return "/hotels/le-meridien-makkah/hero.jpg";
  }

  // Sofitel Shahd Al Madinah
  if (n.includes("sofitel") || n.includes("shahd")) {
    return "/hotels/sofitel-shahd-al-madinah/hero.jpg";
  }

  // Al Manakha Rotana Madinah
  if (n.includes("rotana") || n.includes("manakha")) {
    return "/hotels/al-manakha-rotana-madinah/hero.jpg";
  }

  // Anwar Al Madinah Mövenpick
  if (n.includes("anwar") || (n.includes("movenpick") && n.includes("madinah"))) {
    return "/hotels/anwar-al-madinah-movenpick/hero.jpg";
  }

  // Crowne Plaza Madinah
  if (n.includes("crowne")) {
    return "/hotels/crowne-plaza-madinah/hero.webp";
  }

  // City-based luxury hotel fallbacks (guaranteed hotel photo, never Ziyarat)
  if (n.includes("madinah") || city === "Madinah") {
    return "/hotels/madinah-hilton/hero.jpg";
  }
  if (n.includes("makkah") || city === "Makkah") {
    return "/hotels/intercontinental-dar-al-tawhid/hero.webp";
  }

  return "/brand/heroes/hotel-hero.jpg";
}

export function getTransportImage(title?: string | null, details?: string | null): string {
  const text = `${title || ""} ${details || ""}`.toLowerCase();

  // Sedan (Toyota Camry, Lexus ES, Mercedes E/S Class)
  if (
    text.includes("sedan") ||
    text.includes("camry") ||
    text.includes("lexus") ||
    text.includes("mercedes") ||
    text.includes("saloon")
  ) {
    return "/vehicles/sedan.jpg";
  }

  // SUV (GMC Yukon XL, Chevrolet Suburban, Tahoe)
  if (
    text.includes("gmc") ||
    text.includes("yukon") ||
    text.includes("suv") ||
    text.includes("suburban") ||
    text.includes("tahoe")
  ) {
    return "/vehicles/gmc-yukon-suburban.jpg";
  }

  // Van / Minivan (Hyundai Staria, Toyota HiAce)
  if (
    text.includes("staria") ||
    text.includes("van") ||
    text.includes("hiace") ||
    text.includes("minivan") ||
    text.includes("h1") ||
    text.includes("h-1")
  ) {
    return "/vehicles/staria.jpg";
  }

  // Default to sedan if not specified as SUV
  return "/vehicles/sedan.jpg";
}
