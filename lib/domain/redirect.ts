/**
 * Sanitizes a user-controlled "redirect to after this action" value (e.g.
 * a `next` query/form parameter) down to a safe, same-origin, absolute
 * application path — or a fallback if the value is missing or unsafe.
 *
 * This exists because a bare `value.startsWith("/")` check is NOT
 * sufficient to prevent an open redirect: browsers treat a leading `//`
 * (or `///`, or a leading `/\`) as a protocol-relative URL, so
 * `redirect(next)` with `next = "//evil.com"` would send a signed-in user
 * off-site immediately after a legitimate login. See
 * docs/PRODUCT_ARCHITECTURE.md / PR #2 review.
 *
 * The check works by resolving `value` against a fixed, unrelated base
 * origin using the platform's own WHATWG URL parser (the exact algorithm
 * browsers use for redirect targets, including its handling of stray
 * slashes, backslashes, and control characters), then requiring the
 * resolved origin to be unchanged. Only the path, query string, and hash
 * of the result are returned — never a full URL — so the caller can never
 * accidentally redirect off-origin even by misusing this function's output.
 */
export function sanitizeInternalRedirect(
  value: unknown,
  fallback = "/sources",
): string {
  if (typeof value !== "string") {
    return fallback;
  }

  const trimmed = value.trim();

  // Must be an absolute path with no backslashes. This alone rejects
  // absolute URLs (https://..., javascript:, data:, etc.) and relative
  // paths without a leading slash, before any URL parsing happens.
  if (!trimmed || !trimmed.startsWith("/") || trimmed.includes("\\")) {
    return fallback;
  }

  try {
    const base = "http://sanitize.invalid";
    const resolved = new URL(trimmed, base);

    // Catches //evil.com, ///evil.com, and any other input the URL parser
    // would resolve to a different origin than the fixed base.
    if (resolved.origin !== base) {
      return fallback;
    }

    const safePath = `${resolved.pathname}${resolved.search}${resolved.hash}`;
    return safePath.startsWith("/") ? safePath : fallback;
  } catch {
    return fallback;
  }
}
