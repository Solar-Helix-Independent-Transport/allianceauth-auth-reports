// pass-rate colouring shared by the report header and overview
export const passVariant = (percent: number) =>
  percent > 75 ? "success" : percent > 50 ? "warning" : "danger";

export const percentOf = (n: number, d: number) => (d ? Math.round((n / d) * 100) : 0);
