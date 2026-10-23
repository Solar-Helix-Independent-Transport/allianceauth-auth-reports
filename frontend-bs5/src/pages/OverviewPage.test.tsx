import { loadOverview, loadOverviewReports } from "../apis/Dashboard";
import { renderWithProviders } from "../testUtils";
import { OverviewPage } from "./OverviewPage";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("../apis/Dashboard", () => ({
  loadOverview: vi.fn(),
  loadOverviewReports: vi.fn(),
}));

const reports = [
  { id: 3, name: "Audit Compliance" },
  { id: 4, name: "Discord Linked" },
];

const now = new Date().toISOString();

const overview = {
  report: { id: 3, name: "Audit Compliance" },
  fields: [{ field: "field-1", header: "Audit" }],
  rows: [
    {
      target: {
        type: "corp",
        id: 1,
        name: "Corp One",
        parent: { type: "alliance", id: 9, name: "Ally", ticker: "ALY" },
      },
      members: 4,
      unknowns: 1,
      updated: now,
      fields: { "field-1": 3 },
      all_pass: 2,
    },
    {
      target: { type: "alliance", id: 9, name: "Ally", ticker: "ALY" },
      members: 10,
      unknowns: 0,
      updated: now,
      fields: { "field-1": 10 },
      all_pass: 10,
    },
    {
      // queued, the API hasn't run it yet
      target: { type: "group", id: 5, name: "FCs" },
      members: null,
      unknowns: null,
      updated: null,
      fields: {},
      all_pass: null,
    },
  ],
};

const renderPage = (route: string) =>
  renderWithProviders(<OverviewPage />, { route, path: "/reports/overview/:reportID?/" });

const rowFor = (name: string) => screen.getByRole("link", { name }).closest("tr")!;

describe("OverviewPage", () => {
  afterEach(() => {
    vi.mocked(loadOverview).mockReset();
    vi.mocked(loadOverviewReports).mockReset();
  });

  it("explains how to add a report when the overview is empty", async () => {
    vi.mocked(loadOverviewReports).mockResolvedValue([]);
    renderPage("/reports/overview/");

    expect(await screen.findByText("No reports on the overview")).toBeInTheDocument();
    expect(loadOverview).not.toHaveBeenCalled();
  });

  it("lands on the first overview report", async () => {
    vi.mocked(loadOverviewReports).mockResolvedValue(reports);
    vi.mocked(loadOverview).mockResolvedValue(overview);
    renderPage("/reports/overview/");

    await waitFor(() =>
      expect(screen.getByTestId("location").textContent).toBe("/reports/overview/3/")
    );
    expect(loadOverview).toHaveBeenCalledWith("3");
  });

  it("lists every target with links into its report", async () => {
    vi.mocked(loadOverviewReports).mockResolvedValue(reports);
    vi.mocked(loadOverview).mockResolvedValue(overview);
    renderPage("/reports/overview/3/");

    const corp = await screen.findByRole("link", { name: "Corp One" });
    expect(corp).toHaveAttribute("href", "/reports/show/corp/1/3/");
    expect(screen.getByRole("link", { name: "Ally" })).toHaveAttribute(
      "href",
      "/reports/show/alliance/9/3/"
    );
    expect(screen.getByRole("link", { name: "FCs" })).toHaveAttribute(
      "href",
      "/reports/show/group/5/3/"
    );
  });

  it("shows each target's alliance ticker", async () => {
    vi.mocked(loadOverviewReports).mockResolvedValue(reports);
    vi.mocked(loadOverview).mockResolvedValue(overview);
    renderPage("/reports/overview/3/");

    await screen.findByRole("link", { name: "Corp One" });
    expect(within(rowFor("Corp One")).getByText("[ALY]")).toBeInTheDocument();
    expect(within(rowFor("Ally")).getByText("[ALY]")).toBeInTheDocument();
    expect(within(rowFor("FCs")).queryByText(/\[/)).not.toBeInTheDocument();
  });

  it("shows pass bars for each field and for all fields", async () => {
    vi.mocked(loadOverviewReports).mockResolvedValue(reports);
    vi.mocked(loadOverview).mockResolvedValue(overview);
    renderPage("/reports/overview/3/");

    await screen.findByRole("link", { name: "Corp One" });
    const corp = within(rowFor("Corp One"));
    expect(corp.getByText("3/4")).toBeInTheDocument();
    expect(corp.getByText("50%")).toBeInTheDocument();
    expect(within(rowFor("Ally")).getByText("100%")).toBeInTheDocument();
  });

  it("marks targets that haven't run yet as queued", async () => {
    vi.mocked(loadOverviewReports).mockResolvedValue(reports);
    vi.mocked(loadOverview).mockResolvedValue(overview);
    renderPage("/reports/overview/3/");

    await screen.findByRole("link", { name: "FCs" });
    const group = within(rowFor("FCs"));
    // the field and the all fields columns
    expect(group.getAllByText("Queued")).toHaveLength(2);
    expect(group.getByText("n/a")).toBeInTheDocument();
  });

  it("leaves out the all fields column when the report has no aggregate fields", async () => {
    vi.mocked(loadOverviewReports).mockResolvedValue(reports);
    vi.mocked(loadOverview).mockResolvedValue({ ...overview, fields: [] });
    renderPage("/reports/overview/3/");

    await screen.findByRole("link", { name: "Corp One" });
    expect(screen.queryByText("All fields")).not.toBeInTheDocument();
  });

  it("switches report from the menu", async () => {
    vi.mocked(loadOverviewReports).mockResolvedValue(reports);
    vi.mocked(loadOverview).mockResolvedValue(overview);
    const user = userEvent.setup();
    renderPage("/reports/overview/3/");

    // the report name is also in the table's export button, so pick it in the menu
    const menu = within(document.getElementById("nav-right")!);
    await user.click(await menu.findByText("Audit Compliance"));
    await user.click(menu.getByText("Discord Linked"));

    expect(screen.getByTestId("location").textContent).toBe("/reports/overview/4/");
  });

  it("shows an error when the overview fails to load", async () => {
    vi.mocked(loadOverviewReports).mockResolvedValue(reports);
    vi.mocked(loadOverview).mockRejectedValue(new Error("500"));
    renderPage("/reports/overview/3/");

    expect(await screen.findByText("API Error")).toBeInTheDocument();
  });
});
