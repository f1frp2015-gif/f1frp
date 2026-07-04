// Stateless "share this answer" links — no DB table, no server storage.
// The question + answer + citations are base64url-encoded straight into the
// URL, so a shared link works even for anonymous chats and needs no cleanup
// job. Trade-off: the link is only as durable as the URL itself (no revoke,
// no edit-after-share) — fine for "send this to a colleague", not meant as a
// permanent citable page (the /ai/shared route is noindex).
//
// Uses only Web-standard globals (btoa/atob/TextEncoder/TextDecoder), all
// available in both the browser and the Node/Edge server runtime, so this
// one module encodes client-side and decodes server-side.

import type { Citation } from "@/components/ai-message";

// No locale field: the share URL is already locale-prefixed by getPathname()
// in ai-client.tsx, so the viewer sees the same locale chrome the asker did
// without needing to duplicate it inside the payload.
export type SharedAnswerPayload = {
  q: string;
  a: string;
  c: Citation[];
};

export function encodeSharedAnswer(payload: SharedAnswerPayload): string {
  const json = JSON.stringify(payload);
  const bytes = new TextEncoder().encode(json);
  let binary = "";
  bytes.forEach((b) => {
    binary += String.fromCharCode(b);
  });
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function decodeSharedAnswer(encoded: string): SharedAnswerPayload | null {
  try {
    const b64 = encoded.replace(/-/g, "+").replace(/_/g, "/");
    const padded = b64 + "===".slice((b64.length + 3) % 4);
    const binary = atob(padded);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    const json = new TextDecoder().decode(bytes);
    const parsed = JSON.parse(json);
    if (
      typeof parsed?.q === "string" &&
      typeof parsed?.a === "string" &&
      Array.isArray(parsed?.c)
    ) {
      return parsed as SharedAnswerPayload;
    }
    return null;
  } catch {
    return null;
  }
}
