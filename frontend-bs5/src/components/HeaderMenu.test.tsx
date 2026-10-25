import { loadOverviewReports, loadReports, loadTargets } from "../apis/Dashboard";
import { renderWithProviders } from "../testUtils";
import { MenuRight } from "./HeaderMenu";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../apis/Dashboard", () => ({
  loadOverviewReports: vi.fn(),
  loadReports: vi.fn(),
  loadTargets: vi.fn(),
}));

const navRight = () => document.getElementById("nav-right")!;

describe("MenuRight", () => {
  beforeEach(() => {
    vi.mocked(loadReports).mockResolvedValue([]);
    vi.mocked(loadTargets).mockResolvedValue([]);
  });

  afterEach(() => {
    vi.mocked(loadOverviewReports).mockReset();
  });

  it("replaces AA's placeholder nav items with list items", async () => {
    navRight().innerHTML = "<li>placeholder</li>";
    vi.mocked(loadOverviewReports).mockResolvedValue([]);
    renderWithProviders(<MenuRight />);

    expect(await screen.findByText("Add Token")).toBeInTheDocument();
    expect(screen.queryByText("placeholder")).not.toBeInTheDocument();
    for (const child of Array.from(navRight().children)) {
      expect(child.tagName).toBe("LI");
    }
  });

  it("shows the target and report pickers by default", async () => {
    vi.mocked(loadOverviewReports).mockResolvedValue([]);
    renderWithProviders(<MenuRight />);

    expect(await screen.findByText("Select Alliance, Corporation or Group")).toBeInTheDocument();
    expect(screen.getByText("Select Report")).toBeInTheDocument();
  });

  it("swaps the pickers for its children", async () => {
    vi.mocked(loadOverviewReports).mockResolvedValue([]);
    renderWithProviders(
      <MenuRight>
        <li>Custom Picker</li>
      </MenuRight>
    );

    expect(await screen.findByText("Custom Picker")).toBeInTheDocument();
    expect(screen.queryByText("Select Report")).not.toBeInTheDocument();
  });

  it("links to the overview only when a report is on it", async () => {
    vi.mocked(loadOverviewReports).mockResolvedValue([{ id: 1, name: "Audit" }]);
    renderWithProviders(<MenuRight />);

    expect(await screen.findByText("Overview")).toHaveAttribute("href", "/reports/overview/");
  });

  it("hides the overview link with nothing on the overview", async () => {
    vi.mocked(loadOverviewReports).mockResolvedValue([]);
    renderWithProviders(<MenuRight />);

    await screen.findByText("Add Token");
    expect(screen.queryByText("Overview")).not.toBeInTheDocument();
  });

  it("lists the token types in the add token dropdown", async () => {
    vi.mocked(loadOverviewReports).mockResolvedValue([]);
    renderWithProviders(<MenuRight />);

    await userEvent.click(await screen.findByText("Add Token"));
    expect(screen.getByText("Membership Token").closest("a")).toHaveAttribute(
      "href",
      "/reports/add_corp_token"
    );
    expect(screen.getByText("Director Token (Last Login)").closest("a")).toHaveAttribute(
      "href",
      "/reports/add_director_token"
    );
  });
});
