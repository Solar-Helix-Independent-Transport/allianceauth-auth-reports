import axios from "axios";

axios.defaults.xsrfHeaderName = "X-CSRFToken";

export type TargetType = "corp" | "alliance" | "group";

export interface TargetRef {
  type: TargetType;
  id: number;
  name: string;
  ticker?: string | null;
}

export interface Target extends TargetRef {
  parent?: TargetRef | null;
}

export async function loadReport(targetType: any, targetID: any, reportID: any) {
  if (Number(reportID) !== 0 && Number(targetID) !== 0) {
    const api = await axios.get(`/reports/api/report/${targetType}/${targetID}/${reportID}`);
    return api.data;
  } else {
    return false;
  }
}

export async function loadTargets(): Promise<Target[]> {
  const api = await axios.get(`/reports/api/targets`);
  return api.data;
}

export async function loadReports(targetType?: string) {
  const api = await axios.get(`/reports/api/reports`, {
    params: targetType ? { target_type: targetType } : {},
  });
  return api.data;
}

export async function loadUnknowns(targetType: any, targetID: any) {
  const api = await axios.get(`/reports/api/unknowns/${targetType}/${targetID}`);
  return api.data;
}

export async function loadOverviewReports() {
  const api = await axios.get(`/reports/api/overview`);
  return api.data;
}

export async function loadOverview(reportID: any, targetType?: string | null) {
  if (Number(reportID) === 0) {
    return false;
  }
  const api = await axios.get(`/reports/api/overview/${reportID}`, {
    params: targetType ? { target_type: targetType } : {},
  });
  return api.data;
}
