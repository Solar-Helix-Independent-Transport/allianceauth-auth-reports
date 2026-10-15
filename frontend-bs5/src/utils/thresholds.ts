// pass-rate colouring shared by the report header and overview
export const passVariant = (percent: number) =>
  percent >= 95 ? "success" : percent >= 80 ? "warning" : "danger";

export const percentOf = (n: number, d: number) => (d ? Math.round((n / d) * 100) : 0);
