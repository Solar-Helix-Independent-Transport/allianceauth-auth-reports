import axios from "axios";

axios.defaults.xsrfHeaderName = "X-CSRFToken";

export async function loadReport(rid, cid) {
  if (rid !== 0 && cid !== 0) {
    console.log(`get report from api`, cid, rid);
    const api = await axios.get(`/reports/api/get_report/${rid}/${cid}`);
    return api.data;
  } else {
    return false;
  }
}

export async function loadCorps() {
  const api = await axios.get(`/reports/api/get_corps`);
  console.log(`get corps from api`);
  return api.data;
}

export async function loadReports() {
  const api = await axios.get(`/reports/api/get_reports`);
  console.log(`get corps from api`);
  return api.data;
}
