import { renderWithProviders } from "../../../testUtils";
import BaseTable, { BaseTableProps } from "./BaseTable";
import { FILTER_DEBOUNCE_MS } from "./useDebouncedFilter";
import { act, fireEvent, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

type Row = { name: string; score: number };

const columns = [
  { header: "Name", accessorKey: "name" },
  { header: "Score", accessorKey: "score" },
];

// 20 rows, so the default page size of 15 splits them over two pages
const data: Row[] = Array.from({ length: 20 }, (_, i) => ({
  name: `Pilot ${i + 1}`,
  score: i + 1,
}));

const renderTable = (props: Partial<BaseTableProps<Row>> = {}) =>
  renderWithProviders(<BaseTable<Row> columns={columns} data={data} {...props} />);

const bodyRows = () => within(screen.getAllByRole("rowgroup")[1]).queryAllByRole("row");

// jsdom's Blob has no text()
const readBlob = (blob: Blob) =>
  new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.readAsText(blob);
  });

describe("BaseTable", () => {
  it("pages the rows 15 at a time", async () => {
    const user = userEvent.setup();
    const { container } = renderTable();

    expect(bodyRows()).toHaveLength(15);
    expect(screen.getByText("1 of 2")).toBeInTheDocument();

    await user.click(container.querySelector(".fa-caret-right")!);

    expect(bodyRows()).toHaveLength(5);
    expect(screen.getByText("2 of 2")).toBeInTheDocument();
    expect(screen.getByText("Pilot 20")).toBeInTheDocument();
  });

  it("changes the page size, including showing every row", () => {
    renderTable();

    fireEvent.change(screen.getByRole("combobox"), { target: { value: "1000000" } });

    expect(bodyRows()).toHaveLength(20);
    expect(screen.getByText("1 of 1")).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Show All" })).toBeInTheDocument();
  });

  it("keeps the default page size when given other initial state", () => {
    renderTable({ initialState: { sorting: [{ id: "score", desc: true }] } });

    expect(bodyRows()).toHaveLength(15);
    expect(within(bodyRows()[0]).getByText("Pilot 20")).toBeInTheDocument();
  });

  it("is on page 1 of 1 with no rows", () => {
    renderTable({ data: [] });

    expect(bodyRows()).toHaveLength(0);
    expect(screen.getByText("1 of 1")).toBeInTheDocument();
  });

  it("right aligns numbers", () => {
    renderTable({ data: data.slice(0, 1) });

    expect(screen.getByText("Pilot 1")).toHaveStyle({ textAlign: "left" });
    expect(screen.getByText("1")).toHaveStyle({ textAlign: "right" });
  });

  it("sorts by a column when its header is clicked", async () => {
    const user = userEvent.setup();
    renderTable({ data: data.slice(0, 3) });

    // numbers sort descending first
    await user.click(screen.getByText("Score"));
    expect(within(bodyRows()[0]).getByText("Pilot 3")).toBeInTheDocument();

    await user.click(screen.getByText("Score"));
    expect(within(bodyRows()[0]).getByText("Pilot 1")).toBeInTheDocument();
  });
});

describe("BaseTable data loaded time", () => {
  const hoverLoaded = async (container: HTMLElement) => {
    fireEvent.mouseOver(container.querySelector(".fa-check-circle")!.closest("button")!);
    return screen.findByRole("tooltip");
  };

  afterEach(() => {
    vi.useRealTimers();
  });

  it("shows when the fetch finished, not when the table last rendered", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.setSystemTime(new Date("2026-01-01T10:00:00"));
    const table = (isFetching: boolean) => (
      <BaseTable<Row> columns={columns} data={data} isFetching={isFetching} />
    );
    const { container, rerender } = renderWithProviders(table(true));
    rerender(table(false));

    vi.setSystemTime(new Date("2026-01-01T12:00:00"));
    rerender(table(false)); // a later re-render, with no new fetch

    const tooltip = await hoverLoaded(container);
    expect(tooltip).toHaveTextContent(new Date("2026-01-01T10:00:00").toLocaleString());
  });

  it("shows no time for a table that never fetched", async () => {
    const { container } = renderTable();

    const tooltip = await hoverLoaded(container);
    expect(tooltip.textContent?.trim()).toBe("Data Loaded");
  });
});

describe("BaseTable CSV export", () => {
  let createObjectURL: ReturnType<typeof vi.fn>;
  let revokeObjectURL: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    createObjectURL = vi.fn(() => "blob:report");
    revokeObjectURL = vi.fn();
    URL.createObjectURL = createObjectURL as unknown as typeof URL.createObjectURL;
    URL.revokeObjectURL = revokeObjectURL as unknown as typeof URL.revokeObjectURL;
    // jsdom can't follow the download link
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  const exportedCsv = async () => {
    fireEvent.click(screen.getByText("Export Table to CSV"));
    const blob = createObjectURL.mock.calls[0][0] as Blob;
    expect(blob.type).toBe("text/csv;charset=utf8;");
    return (await readBlob(blob)).trim().split("\n");
  };

  it("exports every row, not just the current page", async () => {
    renderTable({ exportFileName: "Pilots" });

    const lines = await exportedCsv();
    expect(lines[0]).toBe("Name,Score");
    expect(lines).toHaveLength(21);
    expect(lines[20]).toBe("Pilot 20,20");
  });

  it("exports only the rows the filters leave", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    renderTable();

    const nameFilter = within(
      document.querySelectorAll("thead tr")[1] as HTMLElement
    ).getAllByPlaceholderText("Search")[0];
    fireEvent.focus(nameFilter);
    fireEvent.change(nameFilter, { target: { value: "Pilot 1" } });
    act(() => vi.advanceTimersByTime(FILTER_DEBOUNCE_MS));

    // Pilot 1 and Pilot 10-19
    expect(await exportedCsv()).toHaveLength(12);
  });

  it("escapes player-written text that a spreadsheet would run as a formula", async () => {
    renderTable({
      data: [
        { name: '=HYPERLINK("http://evil","click")', score: -5 },
        { name: "@SUM(A1)", score: 1 },
        { name: "+cmd", score: 2 },
        { name: "-1+2", score: 3 },
        { name: "Plain name", score: 4 },
      ],
    });

    const csv = (await exportedCsv()).join("\n");
    expect(csv).toContain(`"'=HYPERLINK(""http://evil"",""click"")",-5`);
    expect(csv).toContain("'@SUM(A1),1");
    expect(csv).toContain("'+cmd,2");
    expect(csv).toContain("'-1+2,3");
    expect(csv).toContain("Plain name,4");
  });

  it("uses the column id as the header when the header is rendered by a function", async () => {
    renderTable({
      columns: [
        { accessorKey: "name", header: () => <span>Name</span> },
        { id: "doubled", accessorFn: (r) => r.score * 2, header: () => <span>Doubled</span> },
      ],
      data: [{ name: "a", score: 2 }],
    });

    expect(await exportedCsv()).toEqual(["name,doubled", "a,4"]);
  });

  it("frees the download's object URL afterwards", () => {
    vi.useFakeTimers();
    renderTable();

    fireEvent.click(screen.getByText("Export Table to CSV"));
    expect(revokeObjectURL).not.toHaveBeenCalled();
    vi.runAllTimers();

    expect(revokeObjectURL).toHaveBeenCalledWith("blob:report");
  });
});
