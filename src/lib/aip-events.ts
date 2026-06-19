/**
 * Lightweight pub/sub for AIP section changes.
 *
 * The Admin panel (aip-sections-admin.tsx) mutates AIP sections via the API
 * (upload .md, create, update, delete). Other components — notably the AIP
 * Publication Browser — need to refresh their view of the section tree when
 * this happens, so that uploaded .md content appears immediately without a
 * full page reload.
 *
 * We use a simple CustomEvent on `window` so there is no shared state to
 * manage and no import cycle between admin and browser components.
 */

export const AIP_SECTIONS_CHANGED_EVENT = "aip:sections-changed";

/** Emitted whenever AIP sections are created, updated, or deleted. */
export function emitAipSectionsChanged(detail?: {
  action?: "upload" | "create" | "update" | "delete";
  sectionCodes?: string[];
}) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent(AIP_SECTIONS_CHANGED_EVENT, { detail: detail ?? {} })
  );
}

/** Subscribe to AIP section changes. Returns an unsubscribe function. */
export function onAipSectionsChanged(
  handler: (detail: {
    action?: "upload" | "create" | "update" | "delete";
    sectionCodes?: string[];
  }) => void
): () => void {
  if (typeof window === "undefined") return () => {};
  const listener = (e: Event) => {
    const ce = e as CustomEvent;
    handler(ce.detail ?? {});
  };
  window.addEventListener(AIP_SECTIONS_CHANGED_EVENT, listener);
  return () => window.removeEventListener(AIP_SECTIONS_CHANGED_EVENT, listener);
}
