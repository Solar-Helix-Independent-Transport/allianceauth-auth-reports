import axios from "axios";

axios.defaults.xsrfHeaderName = "X-CSRFToken";

// route params come in as strings (or not at all)
type ID = string | number | undefined;

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

export interface ReportListItem {
  id: number;
  name: string;
}

export interface CharacterRef {
  id: number;
  name: string;
}

// a report column, from generate_report in tasks.py
export interface ReportHeaderField {
  rank: number;
  header: string;
  // the row key holding this column's value, "field-<id>"
  field: string;
  checkbox: boolean;
  aggregate: boolean;
  // members passing this field
  pass: number;
  description?: string;
  // missing on results cached before sorting was configurable
  allow_sort?: boolean;
}

export interface ReportFieldValue {
  check: boolean;
  // the field's message, rendered as HTML unless a number; "" on checkbox fields
  data: string | number;
}

export interface ReportRow {
  character: CharacterRef;
  [field: `field-${number}`]: ReportFieldValue;
}

export interface ReportData {
  // corporation is the target's label, kept for results cached before targets
  report: { name: string; corporation: string };
  // missing on results cached before targets existed
  target?: TargetRef;
  // missing, and data false, until the report's first run
  headers?: ReportHeaderField[];
  data: ReportRow[] | false;
  members: number;
  unknowns: number;
  updated?: string;
  show_avatar?: boolean;
  // groups only
  members_without_main?: number;
  // alliances only
  corps_without_token?: number;
}

export interface UnknownCharacter {
  character: CharacterRef;
  // orphans only - missing characters have no auth account
  main?: CharacterRef & { cid: number; cname: string };
}

export interface UnknownList {
  name: string;
  corporation: string;
  members: number;
  data: UnknownCharacter[];
}

export interface UnknownsData {
  missing: UnknownList;
  orphans: UnknownList;
  // alliances only
  corps_without_token?: number;
}

export interface OverviewField {
  field: string;
  header: string;
  description: string;
}

// members, unknowns, updated and all_pass are null until the target's first run
export interface OverviewRow {
  target: Target;
  members: number | null;
  // also null for groups, which have no unknowns
  unknowns: number | null;
  updated: string | null;
  // members passing each aggregate field, by OverviewField.field
  fields: Record<string, number>;
  // null when the report has no aggregate fields
  all_pass: number | null;
}

export interface OverviewData {
  report: ReportListItem;
  target_types: TargetType[];
  fields: OverviewField[];
  rows: OverviewRow[];
}

// false when the target or report isn't picked yet
export async function loadReport(
  targetType: string | undefined,
  targetID: ID,
  reportID: ID
): Promise<ReportData | false> {
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

export async function loadReports(targetType?: string): Promise<ReportListItem[]> {
  const api = await axios.get(`/reports/api/reports`, {
    params: targetType ? { target_type: targetType } : {},
  });
  return api.data;
}

export async function loadUnknowns(
  targetType: string | undefined,
  targetID: ID
): Promise<UnknownsData> {
  const api = await axios.get(`/reports/api/unknowns/${targetType}/${targetID}`);
  return api.data;
}

export async function loadOverviewReports(): Promise<ReportListItem[]> {
  const api = await axios.get(`/reports/api/overview`);
  return api.data;
}

// false when no report is picked yet
export async function loadOverview(
  reportID: ID,
  targetType?: string | null
): Promise<OverviewData | false> {
  if (Number(reportID) === 0) {
    return false;
  }
  const api = await axios.get(`/reports/api/overview/${reportID}`, {
    params: targetType ? { target_type: targetType } : {},
  });
  return api.data;
}
