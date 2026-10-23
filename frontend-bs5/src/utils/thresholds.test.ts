import { passVariant, percentOf } from "./thresholds";
import { describe, expect, it } from "vitest";

describe("passVariant", () => {
  it("is success above 75%", () => {
    expect(passVariant(76)).toBe("success");
    expect(passVariant(100)).toBe("success");
  });

  it("is warning above 50% up to 75%", () => {
    expect(passVariant(75)).toBe("warning");
    expect(passVariant(51)).toBe("warning");
  });

  it("is danger at 50% and below", () => {
    expect(passVariant(50)).toBe("danger");
    expect(passVariant(0)).toBe("danger");
  });
});

describe("percentOf", () => {
  it("rounds to a whole percent", () => {
    expect(percentOf(1, 3)).toBe(33);
    expect(percentOf(2, 3)).toBe(67);
  });

  it("is 0 rather than NaN when there are no members", () => {
    expect(percentOf(0, 0)).toBe(0);
    expect(percentOf(5, 0)).toBe(0);
  });
});
