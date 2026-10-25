import { loadOverviewReports, loadReport, loadReports, loadTargets } from "../apis/Dashboard";
import { renderWithProviders } from "../testUtils";
import { ReportPage } from "./ReportPage";
import { act, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../apis/Dashboard", () => ({
  loadOverviewReports: vi.fn(),
  loadReport: vi.fn(),
  loadReports: vi.fn(),
  loadTargets: vi.fn(),
  loadUnknowns: vi.fn(),
}));

const reportData = {
  report: { name: "Audit Compliance" },
  target: { type: "corp", id: 1, name: "Corp One" },
  updated: new Date().toISOString(),
  members: 1,
  unknowns: 0,
  headers: [
    { rank: 1, header: "Audit", field: "field-1", checkbox: true, aggregate: true, pass: 1 },
  ],
  data: [{ character: { id: 11, name: "Pilot A" }, "field-1": { check: true, data: "" } }],
};

const renderPage = (route: string) =>
  renderWithProviders(<ReportPage />, {
    route,
    path: "/reports/show/:targetType/:targetID/:reportID/",
  });

describe("ReportPage", () => {
  beforeEach(() => {
    vi.mocked(loadOverviewReports).mockResolvedValue([]);
    // the menu's ReportSelect drops a report that isn't in this list, which
    // would navigate away mid-test
    vi.mocked(loadReports).mockResolvedValue([{ id: 3, name: "Audit Compliance" }]);
    vi.mocked(loadTargets).mockResolvedValue([]);
  });

  afterEach(() => {
    vi.mocked(loadReport).mockReset();
    vi.restoreAllMocks();
  });

  it("loads the report for the target in the URL", async () => {
    vi.mocked(loadReport).mockResolvedValue(reportData);
    renderPage("/reports/show/corp/1/3/");

    expect(await screen.findByText("Pilot A")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Corp One" })).toBeInTheDocument();
    expect(loadReport).toHaveBeenCalledWith("corp", "1", "3");
  });

  it("asks for a target and report until both are picked", async () => {
    vi.mocked(loadReport).mockResolvedValue(false);
    renderPage("/reports/show/corp/0/0/");

    expect(await screen.findByText("Please Select a Target and Report")).toBeInTheDocument();
  });

  it("shows the loader while the report loads", () => {
    vi.mocked(loadReport).mockReturnValue(new Promise(() => {}));
    renderPage("/reports/show/corp/1/3/");

    expect(screen.getByText("Loading Report")).toBeInTheDocument();
  });

  it("shows an error when the report fails to load", async () => {
    vi.mocked(loadReport).mockRejectedValue(new Error("500"));
    renderPage("/reports/show/corp/1/3/");

    expect(await screen.findByText("API Error")).toBeInTheDocument();
  });
});

describe("ReportPage polling", () => {
  // long enough for a few 3s polls
  const waitPolls = () => act(() => vi.advanceTimersByTimeAsync(10000));

  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.mocked(loadOverviewReports).mockResolvedValue([]);
    vi.mocked(loadReports).mockResolvedValue([{ id: 3, name: "Audit Compliance" }]);
    vi.mocked(loadTargets).mockResolvedValue([]);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.mocked(loadReport).mockReset();
    vi.restoreAllMocks();
  });

  it("polls until stale results are refreshed", async () => {
    vi.mocked(loadReport).mockResolvedValue({ ...reportData, updated: undefined });
    renderPage("/reports/show/corp/1/3/");
    await screen.findByText("Pilot A");

    await waitPolls();

    expect(vi.mocked(loadReport).mock.calls.length).toBeGreaterThan(1);
  });

  it("stops polling once the results are fresh", async () => {
    vi.mocked(loadReport).mockResolvedValue(reportData);
    renderPage("/reports/show/corp/1/3/");
    await screen.findByText("Pilot A");

    await waitPolls();

    expect(loadReport).toHaveBeenCalledTimes(1);
  });

  it("doesn't poll while no target and report are picked", async () => {
    vi.mocked(loadReport).mockResolvedValue(false);
    renderPage("/reports/show/corp/0/0/");
    await screen.findByText("Please Select a Target and Report");

    await waitPolls();

    expect(loadReport).toHaveBeenCalledTimes(1);
  });

  it("doesn't poll an API that refused the request", async () => {
    vi.mocked(loadReport).mockRejectedValue(new Error("403"));
    renderPage("/reports/show/corp/1/3/");
    await screen.findByText("API Error");

    await waitPolls();

    expect(loadReport).toHaveBeenCalledTimes(1);
  });
});
