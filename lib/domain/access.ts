/**
 * Ownership guard used by every server action / route handler before it
 * returns or mutates a row, on top of (not instead of) Postgres RLS. See
 * docs/PRODUCT_ARCHITECTURE.md — ownership must be enforced server-side,
 * never left to UI filtering alone.
 */
export class OwnershipError extends Error {
  constructor(resource: string) {
    super(`Not found or not owned by the current user: ${resource}`);
    this.name = "OwnershipError";
  }
}

export function isOwnedBy(
  resourceOwnerId: string | null | undefined,
  userId: string | null | undefined,
): boolean {
  return Boolean(userId) && resourceOwnerId === userId;
}

/**
 * Throws `OwnershipError` unless `resourceOwnerId` matches `userId`. Deliberately
 * indistinguishable from "not found" to callers — ownership failures should
 * never leak whether a resource exists for another user.
 */
export function assertOwnedBy(
  resourceOwnerId: string | null | undefined,
  userId: string | null | undefined,
  resource: string,
): void {
  if (!isOwnedBy(resourceOwnerId, userId)) {
    throw new OwnershipError(resource);
  }
}
