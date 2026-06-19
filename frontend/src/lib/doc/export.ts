/**
 * Tiny client-side document helpers used by the SOP / CV / LOR generators and outreach templates
 * (page-audit §3.3). No backend — copy uses the Clipboard API, download builds a Blob URL. Both
 * degrade safely (copy returns false on failure so the caller can show a message).
 */

/** Copy plain text to the clipboard; returns true on success, false if blocked/unavailable. */
export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

/** Trigger a client-side download of `text` as a file. */
export function downloadText(filename: string, text: string, mime = "text/plain"): void {
  const blob = new Blob([text], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/** Make a filesystem-safe slug from a title, falling back when empty. */
export function fileSlug(s: string, fallback = "document"): string {
  const slug = s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return slug || fallback;
}

/** A short, collision-resistant id for client-side list items (no backend sequence). */
export function uid(prefix = "id"): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.floor(Math.random() * 1e6).toString(36)}`;
}
