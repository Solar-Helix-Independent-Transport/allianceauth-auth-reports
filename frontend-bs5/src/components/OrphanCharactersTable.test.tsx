import { loadUnknowns } from "../apis/Dashboard";
import { renderWithProviders } from "../testUtils";
import { OrphanCharacterTable } from "./OrphanCharactersTable";
import { screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("../apis/Dashboard", () => ({ loadUnknowns: vi.fn() }));

const unknowns = {
  orphans: {
    data: [{ character: { id: 7, name: "Lost Alt" }, main: { id: 8, name: "Known Main" } }],
  },
  // missing characters have no auth account, so no main
  missing: { data: [{ character: { id: 9, name: "Never Registered" } }] },
};

describe("OrphanCharacterTable", () => {
  afterEach(() => {
    vi.mocked(loadUnknowns).mockReset();
  });

  it("lists orphans and missing characters together", async () => {
    vi.mocked(loadUnknowns).mockResolvedValue(unknowns);
    renderWithProviders(<OrphanCharacterTable targetType="corp" targetID="1" />);

    expect(await screen.findByText("Lost Alt")).toBeInTheDocument();
    expect(screen.getByText("Known Main")).toBeInTheDocument();
    expect(screen.getByText("Never Registered")).toBeInTheDocument();
    // a link each for the orphan, its main and the missing character
    expect(screen.getAllByTitle("Eve Who")).toHaveLength(3);
  });

  it("warns about member corps that have no membership token", async () => {
    vi.mocked(loadUnknowns).mockResolvedValue({ ...unknowns, corps_without_token: 2 });
    renderWithProviders(<OrphanCharacterTable targetType="alliance" targetID="9" />);

    expect(
      await screen.findByText(/2 member corporation\(s\) have no membership token/)
    ).toBeInTheDocument();
  });

  it("shows a loading message until the unknowns arrive", () => {
    vi.mocked(loadUnknowns).mockReturnValue(new Promise(() => {}));
    renderWithProviders(<OrphanCharacterTable targetType="corp" targetID="1" />);

    expect(screen.getByText("Loading")).toBeInTheDocument();
  });
});
