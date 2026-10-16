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
    console.log(`get report from api`, targetType, targetID, reportID);
    const api = await axios.get(`/reports/api/report/${targetType}/${targetID}/${reportID}`);
    return api.data;
  } else {
    return false;
  }
}

export async function loadTargets(): Promise<Target[]> {
  const api = await axios.get(`/reports/api/targets`);
  console.log(`get targets from api`);
  return api.data;
}

export async function loadReports(targetType?: string) {
  const api = await axios.get(`/reports/api/reports`, {
    params: targetType ? { target_type: targetType } : {},
  });
  console.log(`get reports from api`);
  return api.data;
}

export async function loadUnknowns(targetType: any, targetID: any) {
  const api = await axios.get(`/reports/api/unknowns/${targetType}/${targetID}`);
  console.log(`get unknowns from api`);
  return api.data;
}

export async function loadOverviewReports() {
  const api = await axios.get(`/reports/api/overview`);
  console.log(`get overview reports from api`);
  return api.data;
}

export async function loadOverview(reportID: any, targetType?: string | null) {
  if (Number(reportID) === 0) {
    return false;
  }
  const api = await axios.get(`/reports/api/overview/${reportID}`, {
    params: targetType ? { target_type: targetType } : {},
  });
  console.log(`get overview from api`, reportID, targetType);
  return api.data;
}
