export type EsimLaunchMode = "off" | "preview" | "live";

export const ESIM_PREVIEW_COOKIE_NAME = "esim_preview_access";
export const ESIM_PREVIEW_MAX_AGE_SECONDS = 7 * 24 * 60 * 60; // 7 days

/**
 * Returns current eSIM launch mode (default: 'off').
 */
export function getEsimLaunchMode(): EsimLaunchMode {
  const mode = (
    process.env.NEXT_PUBLIC_ESIM_LAUNCH_MODE ||
    process.env.ESIM_LAUNCH_MODE ||
    ""
  )
    .trim()
    .toLowerCase();
  if (mode === "live") return "live";
  if (mode === "preview") return "preview";
  return "off";
}

/**
 * Returns whether eSIM features and links are fully live and public.
 */
export function isEsimLive(): boolean {
  return getEsimLaunchMode() === "live";
}

/**
 * Configured secret key for preview mode access.
 */
export function getEsimPreviewKey(): string {
  return process.env.ESIM_PREVIEW_KEY?.trim() || "";
}
