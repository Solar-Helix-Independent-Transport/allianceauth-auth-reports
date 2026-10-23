import { csvSafe } from "./csvSafe";
import { describe, expect, it } from "vitest";

describe("csvSafe", () => {
  it("prefixes text a spreadsheet would run as a formula", () => {
    expect(csvSafe("=1+1")).toBe("'=1+1");
    expect(csvSafe("@SUM(A1)")).toBe("'@SUM(A1)");
  });

  it("leaves numbers and numeric strings alone", () => {
    expect(csvSafe(-5)).toBe(-5);
    expect(csvSafe("-5")).toBe("-5");
    expect(csvSafe("+1.5")).toBe("+1.5");
    expect(csvSafe(null)).toBe(null);
  });

  it("escapes tab and carriage return prefixes too", () => {
    expect(csvSafe("\t=1")).toBe("'\t=1");
    expect(csvSafe("\r=1")).toBe("'\r=1");
  });
});
