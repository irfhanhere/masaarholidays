import "server-only";
import { cookies } from "next/headers";
import {
  getEsimLaunchMode,
  getEsimPreviewKey,
  ESIM_PREVIEW_COOKIE_NAME,
} from "./esim-launch";

export { ESIM_PREVIEW_COOKIE_NAME, ESIM_PREVIEW_MAX_AGE_SECONDS } from "./esim-launch";

/**
 * Validates whether the current request or user context has permission to view/order eSIM.
 * Access is granted if:
 * 1. Launch mode is 'live'
 * 2. Or the request contains a valid preview query parameter matching ESIM_PREVIEW_KEY
 * 3. Or the request contains a valid esim_preview_access cookie
 */
export async function verifyEsimAccess(options?: {
  previewParam?: string | null;
  cookieValue?: string | null;
}): Promise<boolean> {
  const mode = getEsimLaunchMode();
  if (mode === "live") return true;

  const validKey = getEsimPreviewKey();
  if (!validKey) return false;

  // Check explicit query param if passed
  if (options?.previewParam && options.previewParam === validKey) {
    return true;
  }

  // Check explicit cookie value if passed
  if (options?.cookieValue && options.cookieValue === validKey) {
    return true;
  }

  // Check incoming cookies from next/headers
  try {
    const cookieStore = await cookies();
    const storedVal = cookieStore.get(ESIM_PREVIEW_COOKIE_NAME)?.value;
    if (storedVal && storedVal === validKey) {
      return true;
    }
  } catch {
    // In environments where cookies() cannot be evaluated, deny if not live
  }

  return false;
}
