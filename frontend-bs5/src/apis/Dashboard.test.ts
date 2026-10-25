import {
  loadOverview,
  loadOverviewReports,
  loadReport,
  loadReports,
  loadTargets,
  loadUnknowns,
} from "./Dashboard";
import axios from "axios";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("axios", () => ({ default: { get: vi.fn(), defaults: {} } }));

const get = vi.mocked(axios.get);

describe("Dashboard api", () => {
  beforeEach(() => {
    get.mockResolvedValue({ data: "payload" });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    get.mockReset();
  });

  it("sends the csrf token in Django's header", () => {
    expect(axios.defaults.xsrfHeaderName).toBe("X-CSRFToken");
  });

  it("loads a report for a target", async () => {
    await expect(loadReport("alliance", 99, 3)).resolves.toBe("payload");
    expect(get).toHaveBeenCalledWith("/reports/api/report/alliance/99/3");
  });

  it("skips the report call until a target and report are picked", async () => {
    await expect(loadReport("corp", 0, 3)).resolves.toBe(false);
    await expect(loadReport("corp", 99, "0")).resolves.toBe(false);
    expect(get).not.toHaveBeenCalled();
  });

  it("loads the targets", async () => {
    await expect(loadTargets()).resolves.toBe("payload");
    expect(get).toHaveBeenCalledWith("/reports/api/targets");
  });

  it("filters the reports by target type when given one", async () => {
    await loadReports("group");
    expect(get).toHaveBeenCalledWith("/reports/api/reports", {
      params: { target_type: "group" },
    });

    await loadReports();
    expect(get).toHaveBeenLastCalledWith("/reports/api/reports", { params: {} });
  });

  it("loads the unknowns for a target", async () => {
    await loadUnknowns("corp", 42);
    expect(get).toHaveBeenCalledWith("/reports/api/unknowns/corp/42");
  });

  it("loads the overview reports", async () => {
    await loadOverviewReports();
    expect(get).toHaveBeenCalledWith("/reports/api/overview");
  });

  it("loads an overview, filtered by target type when given one", async () => {
    await loadOverview(5, "alliance");
    expect(get).toHaveBeenCalledWith("/reports/api/overview/5", {
      params: { target_type: "alliance" },
    });

    await loadOverview(5, null);
    expect(get).toHaveBeenLastCalledWith("/reports/api/overview/5", { params: {} });
  });

  it("skips the overview call until a report is picked", async () => {
    await expect(loadOverview(0)).resolves.toBe(false);
    expect(get).not.toHaveBeenCalled();
  });
});
