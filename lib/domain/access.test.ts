import { describe, expect, it } from "vitest";
import { OwnershipError, assertOwnedBy, isOwnedBy } from "./access";

describe("isOwnedBy", () => {
  it("is true when the resource owner matches the user", () => {
    expect(isOwnedBy("user-1", "user-1")).toBe(true);
  });

  it("is false when the resource owner differs from the user", () => {
    expect(isOwnedBy("user-1", "user-2")).toBe(false);
  });

  it("is false when there is no current user", () => {
    expect(isOwnedBy("user-1", null)).toBe(false);
    expect(isOwnedBy("user-1", undefined)).toBe(false);
  });

  it("is false when the resource has no owner recorded", () => {
    expect(isOwnedBy(null, "user-1")).toBe(false);
  });
});

describe("assertOwnedBy", () => {
  it("does not throw when the user owns the resource", () => {
    expect(() => assertOwnedBy("user-1", "user-1", "source")).not.toThrow();
  });

  it("throws OwnershipError when the user does not own the resource", () => {
    expect(() => assertOwnedBy("user-1", "user-2", "source")).toThrow(OwnershipError);
  });

  it("throws OwnershipError, not a generic error, when there is no user", () => {
    try {
      assertOwnedBy("user-1", null, "source");
      throw new Error("expected assertOwnedBy to throw");
    } catch (err) {
      expect(err).toBeInstanceOf(OwnershipError);
    }
  });
});
