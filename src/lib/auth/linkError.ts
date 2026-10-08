/**
 * Reads the error Supabase appends to an auth redirect when an emailed link
 * cannot be used (expired, already used, or opened by a mail scanner first).
 * It arrives in the hash (`#error=access_denied&error_code=otp_expired&...`)
 * and sometimes in the query string.
 */
export interface AuthLinkError {
  code: string;
  description: string;
  /** Expired or already used: the fix is a new link, not a different password. */
  expired: boolean;
}

export function readAuthLinkError(hash: string, search: string): AuthLinkError | null {
  for (const raw of [hash.replace(/^#/, ""), search.replace(/^\?/, "")]) {
    const params = new URLSearchParams(raw);
    const error = params.get("error");
    const code = params.get("error_code");
    if (!error && !code) continue;
    const description = params.get("error_description")?.replace(/\+/g, " ") ?? "";
    const c = code ?? error ?? "unknown";
    const expired = c === "otp_expired" || /expired|invalid/i.test(description);
    return { code: c, description, expired };
  }
  return null;
}
