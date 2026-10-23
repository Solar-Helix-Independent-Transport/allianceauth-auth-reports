import { loadUnknowns } from "../apis/Dashboard";
import { renderWithProviders } from "../testUtils";
import { ReportHeader } from "./ReportHeader";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("../apis/Dashboard", () => ({ loadUnknowns: vi.fn() }));

const path = "/reports/show/:targetType/:targetID/:reportID/";

const reportData = {
  report: { name: "Audit Compliance", corporation: "Legacy Name" },
  target: { type: "corp", id: 1, name: "Corp One" },
  updated: new Date().toISOString(),
  members: 4,
  unknowns: 2,
  members_without_main: 0,
  headers: [
    { header: "Audit", field: "field-1", aggregate: true, pass: 4 },
    { header: "Discord", field: "field-2", aggregate: true, pass: 1 },
    { header: "Notes", field: "field-3", aggregate: false, pass: 0 },
  ],
};

const renderHeader = (data: any, route = "/reports/show/corp/1/3/") =>
  renderWithProviders(<ReportHeader reportData={data} />, { route, path });

describe("ReportHeader", () => {
  afterEach(() => {
    vi.mocked(loadUnknowns).mockReset();
  });

  it("shows the target and report names", () => {
    renderHeader(reportData);

    expect(screen.getByRole("heading", { name: "Corp One" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Audit Compliance" })).toBeInTheDocument();
  });

  it("falls back to the legacy corporation name on old cached results", () => {
    renderHeader({ ...reportData, target: undefined });

    expect(screen.getByRole("heading", { name: "Legacy Name" })).toBeInTheDocument();
  });

  it("flags a report that has never run", () => {
    renderHeader({ ...reportData, updated: null });

    expect(screen.getByText("Last Updated: Never")).toHaveClass("bg-danger");
  });

  it("shows a pass badge per aggregate field, coloured by pass rate", () => {
    renderHeader(reportData);

    expect(screen.getByText("Audit: 4/4")).toHaveClass("bg-success");
    expect(screen.getByText("Discord: 1/4")).toHaveClass("bg-danger");
    expect(screen.queryByText(/Notes:/)).not.toBeInTheDocument();
  });

  it("shows members without a main only when there are some", () => {
    const { unmount } = renderHeader(reportData);
    expect(screen.queryByText(/Members without a main/)).not.toBeInTheDocument();
    unmount();

    renderHeader({ ...reportData, members_without_main: 3 });
    expect(screen.getByText("Members without a main: 3")).toBeInTheDocument();
  });

  it("opens the orphan list from the unknowns badge", async () => {
    vi.mocked(loadUnknowns).mockResolvedValue({
      orphans: {
        data: [{ character: { id: 7, name: "Lost Alt" }, main: { id: 8, name: "Main" } }],
      },
      missing: { data: [] },
    });
    const user = userEvent.setup();
    renderHeader(reportData);

    const badge = screen.getByText(/Unknown\s+Characters: 2/);
    expect(badge).toHaveClass("bg-danger");
    await user.click(badge);

    expect(await screen.findByText("Lost Alt")).toBeInTheDocument();
    expect(loadUnknowns).toHaveBeenCalledWith("corp", "1");
  });

  it("hides the unknowns for groups, which have no membership to compare", () => {
    renderHeader(
      { ...reportData, target: { type: "group", id: 5, name: "FCs" } },
      "/reports/show/group/5/3/"
    );

    expect(screen.queryByText(/Unknown\s+Characters/)).not.toBeInTheDocument();
    expect(screen.getByText("Audit: 4/4")).toBeInTheDocument();
  });
});
