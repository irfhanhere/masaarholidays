/**
 * Helper utilities for quotation flight itinerary metadata & screenshot attachments.
 */

export interface FlightMetadata {
  cleanDetails: string;
  screenshotUrl?: string;
  screenshotName?: string;
  airline?: string;
  pnr?: string;
  departureArrival?: string;
}

export function extractFlightMetadata(details?: string | null): FlightMetadata {
  if (!details || typeof details !== "string") {
    return { cleanDetails: "" };
  }

  let screenshotUrl: string | undefined;
  let screenshotName: string | undefined;
  let airline: string | undefined;
  let pnr: string | undefined;
  let departureArrival: string | undefined;

  // Extract screenshot URL tag: [screenshot: URL name: filename] or [screenshot_url: URL]
  const urlMatch = details.match(/\[screenshot(?:_url)?:\s*([^\s\]]+)(?:\s+name:\s*([^\]]+))?\]/i);
  if (urlMatch) {
    screenshotUrl = urlMatch[1].trim();
    if (urlMatch[2]) screenshotName = urlMatch[2].trim();
  }

  // Extract PNR: [pnr: XYZ]
  const pnrMatch = details.match(/\[pnr:\s*([^\]]+)\]/i);
  if (pnrMatch) {
    pnr = pnrMatch[1].trim();
  }

  // Extract Airline: [airline: XYZ]
  const airlineMatch = details.match(/\[airline:\s*([^\]]+)\]/i);
  if (airlineMatch) {
    airline = airlineMatch[1].trim();
  }

  // Extract Departure / Arrival times: [departure_arrival: XYZ]
  const timesMatch = details.match(/\[departure_arrival:\s*([^\]]+)\]/i);
  if (timesMatch) {
    departureArrival = timesMatch[1].trim();
  }

  // Clean details of metadata tags for human reading
  const cleanDetails = details
    .replace(/\[screenshot(?:_url)?:[^\]]+\]/gi, "")
    .replace(/\[pnr:[^\]]+\]/gi, "")
    .replace(/\[airline:[^\]]+\]/gi, "")
    .replace(/\[departure_arrival:[^\]]+\]/gi, "")
    .replace(/•?\s*\[price_[^\]]+\]/g, "")
    .replace(/\s*•\s*•\s*/g, " • ")
    .replace(/^•\s*|\s*•$/g, "")
    .trim();

  return {
    cleanDetails,
    screenshotUrl,
    screenshotName,
    airline,
    pnr,
    departureArrival,
  };
}

export function formatFlightDetails({
  cleanDetails,
  screenshotUrl,
  screenshotName,
  airline,
  pnr,
  departureArrival,
}: {
  cleanDetails: string;
  screenshotUrl?: string;
  screenshotName?: string;
  airline?: string;
  pnr?: string;
  departureArrival?: string;
}): string {
  const parts: string[] = [];

  const baseText = cleanDetails
    .replace(/\[screenshot(?:_url)?:[^\]]+\]/gi, "")
    .replace(/\[pnr:[^\]]+\]/gi, "")
    .replace(/\[airline:[^\]]+\]/gi, "")
    .replace(/\[departure_arrival:[^\]]+\]/gi, "")
    .trim();

  if (baseText) parts.push(baseText);
  if (airline) parts.push(`[airline: ${airline.trim()}]`);
  if (pnr) parts.push(`[pnr: ${pnr.trim()}]`);
  if (departureArrival) parts.push(`[departure_arrival: ${departureArrival.trim()}]`);
  if (screenshotUrl) {
    const namePart = screenshotName ? ` name: ${screenshotName.trim()}` : "";
    parts.push(`[screenshot: ${screenshotUrl.trim()}${namePart}]`);
  }

  return parts.join(" • ");
}

