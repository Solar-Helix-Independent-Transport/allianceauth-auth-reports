// pass-rate colouring shared by the report header and overview
export const passVariant = (percent: number) =>
  percent > 75 ? "success" : percent > 50 ? "warning" : "danger";

// 0 when there's nothing to divide by, e.g. a target that hasn't run (null)
export const percentOf = (n: number, d: number | null | undefined) =>
  d ? Math.round((n / d) * 100) : 0;
