import { describe, expect, it } from "vitest";
import { sanitizeInternalRedirect } from "./redirect";

describe("sanitizeInternalRedirect", () => {
  it("accepts a normal internal path", () => {
    expect(sanitizeInternalRedirect("/sources")).toBe("/sources");
  });

  it("accepts a normal internal sub-path", () => {
    expect(sanitizeInternalRedirect("/sources/new")).toBe("/sources/new");
  });

  it("accepts an internal path with a dynamic id segment", () => {
    expect(sanitizeInternalRedirect("/sources/123e4567-e89b-12d3-a456-426614174000")).toBe(
      "/sources/123e4567-e89b-12d3-a456-426614174000",
    );
  });

  it("rejects a protocol-relative URL", () => {
    expect(sanitizeInternalRedirect("//evil.com")).toBe("/sources");
  });

  it("rejects a triple-slash protocol-relative URL", () => {
    expect(sanitizeInternalRedirect("///evil.com")).toBe("/sources");
  });

  it("rejects an absolute https URL", () => {
    expect(sanitizeInternalRedirect("https://evil.com")).toBe("/sources");
  });

  it("rejects an absolute http URL", () => {
    expect(sanitizeInternalRedirect("http://evil.com")).toBe("/sources");
  });

  it("rejects a javascript: URL", () => {
    expect(sanitizeInternalRedirect("javascript:alert(1)")).toBe("/sources");
  });

  it("rejects a data: URL", () => {
    expect(sanitizeInternalRedirect("data:text/html,evil")).toBe("/sources");
  });

  it("rejects a backslash-based protocol-relative trick", () => {
    expect(sanitizeInternalRedirect("/\\evil.com")).toBe("/sources");
  });

  it("rejects a tab-obfuscated protocol-relative trick", () => {
    expect(sanitizeInternalRedirect("/\t/evil.com")).toBe("/sources");
  });

  it("rejects a relative path with no leading slash", () => {
    expect(sanitizeInternalRedirect("not-a-path")).toBe("/sources");
  });

  it("defaults an empty value to /sources", () => {
    expect(sanitizeInternalRedirect("")).toBe("/sources");
  });

  it("defaults a missing (null) value to /sources", () => {
    expect(sanitizeInternalRedirect(null)).toBe("/sources");
  });

  it("defaults a missing (undefined) value to /sources", () => {
    expect(sanitizeInternalRedirect(undefined)).toBe("/sources");
  });

  it("defaults a non-string value (e.g. a File) to /sources", () => {
    expect(sanitizeInternalRedirect(new File(["x"], "x.txt"))).toBe("/sources");
  });

  it("preserves a query string on an accepted internal path", () => {
    expect(sanitizeInternalRedirect("/sources?tab=recent")).toBe("/sources?tab=recent");
  });

  it("preserves a hash fragment on an accepted internal path", () => {
    expect(sanitizeInternalRedirect("/sources#section")).toBe("/sources#section");
  });

  it("preserves a query string that itself looks like another redirect param", () => {
    expect(sanitizeInternalRedirect("/sources?next=/other")).toBe("/sources?next=/other");
  });

  it("honors a custom fallback when provided", () => {
    expect(sanitizeInternalRedirect("//evil.com", "/login")).toBe("/login");
  });
});
