import { lessThanOneHourAgo } from "./freshness";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("lessThanOneHourAgo", () => {
  const now = new Date("2026-01-01T12:00:00Z");

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(now);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("is true for a date inside the last hour", () => {
    expect(lessThanOneHourAgo("2026-01-01T11:30:00Z")).toBe(true);
  });

  it("is false for a date over an hour old", () => {
    expect(lessThanOneHourAgo("2026-01-01T10:59:00Z")).toBe(false);
  });

  it("is false when the report has never run", () => {
    expect(lessThanOneHourAgo(null)).toBe(false);
    expect(lessThanOneHourAgo(undefined)).toBe(false);
  });
});
