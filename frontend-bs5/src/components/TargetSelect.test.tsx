import { Target, loadTargets } from "../apis/Dashboard";
import { renderWithProviders } from "../testUtils";
import TargetSelect from "./TargetSelect";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("../apis/Dashboard", () => ({ loadTargets: vi.fn() }));

const targets: Target[] = [
  {
    type: "corp",
    id: 1,
    name: "Corp One",
    parent: { type: "alliance", id: 9, name: "Ally", ticker: "ALY" },
  },
  { type: "corp", id: 2, name: "Corp Two", parent: null },
  { type: "alliance", id: 9, name: "Ally", ticker: "ALY" },
  { type: "group", id: 5, name: "Fleet Commanders" },
];

const path = "/reports/show/:targetType/:targetID/:reportID/";

describe("TargetSelect", () => {
  afterEach(() => {
    vi.mocked(loadTargets).mockReset();
  });

  it("groups the targets by type, with the alliance ticker on corps", async () => {
    vi.mocked(loadTargets).mockResolvedValue(targets);
    const user = userEvent.setup();
    renderWithProviders(<TargetSelect />, { route: "/reports/show/corp/0/0/", path });

    await user.click(await screen.findByText("Select Alliance, Corporation or Group"));

    const groups = ["Alliances", "Corporations", "Groups"];
    groups.forEach((g) => expect(screen.getByText(g)).toBeInTheDocument());
    expect(screen.getByText("Corp One [ALY]")).toBeInTheDocument();
    expect(screen.getByText("Corp Two")).toBeInTheDocument();
    expect(screen.getByText("Fleet Commanders")).toBeInTheDocument();
  });

  it("leaves out the sections with no targets", async () => {
    vi.mocked(loadTargets).mockResolvedValue([targets[1]]);
    const user = userEvent.setup();
    renderWithProviders(<TargetSelect />, { route: "/reports/show/corp/0/0/", path });

    await user.click(await screen.findByText("Select Alliance, Corporation or Group"));

    expect(screen.getByText("Corporations")).toBeInTheDocument();
    expect(screen.queryByText("Alliances")).not.toBeInTheDocument();
    expect(screen.queryByText("Groups")).not.toBeInTheDocument();
  });

  it("shows the target from the URL as the current value", async () => {
    vi.mocked(loadTargets).mockResolvedValue(targets);
    renderWithProviders(<TargetSelect />, { route: "/reports/show/group/5/3/", path });

    expect(await screen.findByText("Fleet Commanders")).toBeInTheDocument();
  });

  it("keeps the report when switching target", async () => {
    vi.mocked(loadTargets).mockResolvedValue(targets);
    const user = userEvent.setup();
    renderWithProviders(<TargetSelect />, { route: "/reports/show/corp/1/3/", path });

    await user.click(await screen.findByText("Corp One [ALY]"));
    await user.click(screen.getByText("Ally"));

    expect(screen.getByTestId("location").textContent).toBe("/reports/show/alliance/9/3");
  });
});
