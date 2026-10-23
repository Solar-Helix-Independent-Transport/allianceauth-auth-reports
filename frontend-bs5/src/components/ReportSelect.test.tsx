import { loadReports } from "../apis/Dashboard";
import { renderWithProviders } from "../testUtils";
import ReportSelect from "./ReportSelect";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("../apis/Dashboard", () => ({ loadReports: vi.fn() }));

const reports = [
  { id: 3, name: "Audit Compliance" },
  { id: 4, name: "Discord Linked" },
];

const path = "/reports/show/:targetType/:targetID/:reportID/";

describe("ReportSelect", () => {
  afterEach(() => {
    vi.mocked(loadReports).mockReset();
  });

  it("loads the reports enabled for the target type", async () => {
    vi.mocked(loadReports).mockResolvedValue(reports);
    renderWithProviders(<ReportSelect />, { route: "/reports/show/group/5/3/", path });

    expect(await screen.findByText("Audit Compliance")).toBeInTheDocument();
    expect(loadReports).toHaveBeenCalledWith("group");
  });

  it("keeps the target when switching report", async () => {
    vi.mocked(loadReports).mockResolvedValue(reports);
    const user = userEvent.setup();
    renderWithProviders(<ReportSelect />, { route: "/reports/show/corp/1/3/", path });

    await user.click(await screen.findByText("Audit Compliance"));
    await user.click(screen.getByText("Discord Linked"));

    expect(screen.getByTestId("location").textContent).toBe("/reports/show/corp/1/4");
  });

  it("drops a report that isn't enabled for the target type", async () => {
    vi.mocked(loadReports).mockResolvedValue(reports);
    renderWithProviders(<ReportSelect />, { route: "/reports/show/alliance/9/7/", path });

    await waitFor(() =>
      expect(screen.getByTestId("location").textContent).toBe("/reports/show/alliance/9/0")
    );
  });

  it("leaves the URL alone when no report is picked yet", async () => {
    vi.mocked(loadReports).mockResolvedValue(reports);
    renderWithProviders(<ReportSelect />, { route: "/reports/show/corp/0/0/", path });

    expect(await screen.findByText("Select Report")).toBeInTheDocument();
    expect(screen.getByTestId("location").textContent).toBe("/reports/show/corp/0/0/");
  });
});
