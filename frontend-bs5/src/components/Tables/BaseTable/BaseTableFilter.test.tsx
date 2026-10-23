import { renderWithProviders } from "../../../testUtils";
import BaseTable from "./BaseTable";
import { MAX_SELECT_OPTIONS } from "./BaseTableFilter";
import { FILTER_DEBOUNCE_MS } from "./useDebouncedFilter";
import { ColumnDef } from "@tanstack/react-table";
import { act, fireEvent, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const renderTable = (columns: ColumnDef<any, any>[], data: any[]) =>
  renderWithProviders(<BaseTable columns={columns} data={data} />);

const bodyText = () =>
  Array.from(document.querySelectorAll("tbody tr")).map((r) => r.textContent ?? "");

// the filter row is the second row of the header
const filterCell = (index: number) =>
  document.querySelectorAll("thead tr")[1].querySelectorAll("th")[index] as HTMLElement;

describe("Filter", () => {
  it("picks the filter from the column's values", () => {
    renderTable(
      [
        { header: "Count", accessorKey: "count" },
        { header: "Pass", accessorKey: "pass" },
        { header: "Tags", accessorKey: "tags" },
        { header: "Name", accessorKey: "name" },
      ],
      [{ count: 1, pass: true, tags: ["a"], name: "Pilot" }]
    );

    expect(within(filterCell(0)).getByPlaceholderText("Set Range")).toBeInTheDocument();
    expect(within(filterCell(1)).getByPlaceholderText("Filter")).toBeInTheDocument();
    expect(within(filterCell(2)).getByPlaceholderText("Search")).toBeInTheDocument();
    expect(within(filterCell(3)).getByPlaceholderText("Search")).toBeInTheDocument();
  });

  it("keeps the filter on text that Date.parse() takes for a date (corptools #308)", () => {
    renderTable([{ header: "Name", accessorKey: "name" }], [{ name: "Pilot 2" }]);

    expect(Date.parse("Pilot 2")).not.toBeNaN();
    expect(within(filterCell(0)).getByPlaceholderText("Search")).toBeInTheDocument();
  });

  it("picks the filter from the first row with a value", () => {
    renderTable([{ header: "Count", accessorKey: "count" }], [{ count: null }, { count: 3 }]);

    expect(within(filterCell(0)).getByPlaceholderText("Set Range")).toBeInTheDocument();
  });
});

describe("NumberFilter", () => {
  it("filters to the range and clears it", () => {
    renderTable(
      [
        { header: "Name", accessorKey: "name" },
        { header: "Count", accessorKey: "count" },
      ],
      [1, 5, 10].map((count) => ({ name: `Pilot ${count}`, count }))
    );

    fireEvent.click(screen.getByPlaceholderText("Set Range"));
    fireEvent.change(screen.getByPlaceholderText("Min"), { target: { value: "2" } });
    fireEvent.change(screen.getByPlaceholderText("Max"), { target: { value: "6" } });

    expect(bodyText()).toEqual(["Pilot 55"]);
    expect(screen.getByPlaceholderText("Set Range")).toHaveValue("2 to 6");

    fireEvent.click(within(filterCell(1)).getByTitle("Clear"));
    expect(bodyText()).toHaveLength(3);
  });
});

describe("BoolFilter", () => {
  const columns = [
    { header: "Name", accessorKey: "name" },
    { header: "Audit", accessorKey: "audit" },
    { header: "Discord", accessorKey: "discord" },
  ];
  const data = [
    { name: "Pilot A", audit: true, discord: false },
    { name: "Pilot B", audit: false, discord: false },
  ];

  it("filters to the picked value and shows it when reopened", () => {
    renderTable(columns, data);
    const audit = within(filterCell(1)).getByPlaceholderText("Filter");

    fireEvent.click(audit);
    fireEvent.click(screen.getByLabelText("True"));

    expect(bodyText()).toHaveLength(1);
    expect(bodyText()[0]).toContain("Pilot A");
    expect(audit).toHaveValue("True");
    expect(screen.getByLabelText("True")).toBeChecked();
  });

  it("gives each column's radios their own group", () => {
    renderTable(columns, data);

    fireEvent.click(within(filterCell(1)).getByPlaceholderText("Filter"));
    fireEvent.click(within(filterCell(2)).getByPlaceholderText("Filter"));

    const radios = screen.getAllByRole("radio") as HTMLInputElement[];
    expect(radios).toHaveLength(4);
    expect(new Set(radios.map((r) => r.name)).size).toBe(2);
    expect(new Set(radios.map((r) => r.id)).size).toBe(4);
  });

  it("clears without opening the popover", () => {
    renderTable(columns, data);
    fireEvent.click(within(filterCell(1)).getByPlaceholderText("Filter"));
    fireEvent.click(screen.getByLabelText("False"));
    fireEvent.click(screen.getByText("Close"));

    fireEvent.click(within(filterCell(1)).getByTitle("Clear"));

    expect(bodyText()).toHaveLength(2);
    expect(within(filterCell(1)).getByPlaceholderText("Filter")).toHaveValue("");
  });
});

describe("text filters", () => {
  type Row = { name: string; tags: string[] };

  const columns: ColumnDef<Row, any>[] = [
    { header: "Name", accessorKey: "name" },
    // an object column gets the plain TextFilter
    {
      header: "Tags",
      accessorKey: "tags",
      cell: (c) => c.getValue().join(","),
      filterFn: (row, id, value: string) =>
        (row.getValue(id) as string[]).some((t) => t.includes(value)),
    },
  ];

  // more unique names than the dropdown shows
  const data: Row[] = Array.from({ length: MAX_SELECT_OPTIONS + 50 }, (_, i) => ({
    name: `Item_${String(i).padStart(3, "0")}`,
    tags: [i % 2 ? "odd" : "even"],
  }));

  const selectInput = () => within(filterCell(0)).getByPlaceholderText("Search");
  const textInput = () => within(filterCell(1)).getByPlaceholderText("Search");
  const anyEven = () => bodyText().some((r) => r.includes("even"));

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("only filters the table once typing pauses", () => {
    renderTable(columns, data);

    fireEvent.change(textInput(), { target: { value: "od" } });
    fireEvent.change(textInput(), { target: { value: "odd" } });
    // the box shows the text at once, the table hasn't refiltered yet
    expect(textInput()).toHaveValue("odd");
    act(() => vi.advanceTimersByTime(FILTER_DEBOUNCE_MS - 1));
    expect(anyEven()).toBe(true);

    act(() => vi.advanceTimersByTime(1));
    expect(anyEven()).toBe(false);
  });

  it("clears the text box and the filter straight away", () => {
    renderTable(columns, data);
    fireEvent.change(textInput(), { target: { value: "odd" } });
    act(() => vi.advanceTimersByTime(FILTER_DEBOUNCE_MS));

    fireEvent.click(within(filterCell(1)).getByTitle("Clear"));

    expect(textInput()).toHaveValue("");
    expect(anyEven()).toBe(true);
  });

  it("caps the select dropdown and says how many more there are", () => {
    renderTable(columns, data);
    fireEvent.click(selectInput());

    expect(document.querySelectorAll(".dropdown-item:not(.disabled)")).toHaveLength(
      MAX_SELECT_OPTIONS
    );
    expect(screen.getByText("50 more, keep typing to narrow down.")).toBeInTheDocument();
  });

  it("narrows the select dropdown by what's typed", () => {
    renderTable(columns, data);
    fireEvent.click(selectInput());
    fireEvent.focus(selectInput());
    fireEvent.change(selectInput(), { target: { value: "item_12" } });

    const items = Array.from(document.querySelectorAll(".dropdown-item")).map((e) => e.textContent);
    expect(items).toEqual(Array.from({ length: 10 }, (_, i) => `Item 12${i}`));
  });

  it("applies a picked option, showing its label while idle and the raw value while editing", () => {
    renderTable(columns, data);
    fireEvent.click(selectInput());
    fireEvent.click(screen.getByText("Item 007"));

    expect(bodyText()).toEqual(["Item_007odd"]);
    expect(selectInput()).toHaveValue("Item 007");

    fireEvent.focus(selectInput());
    expect(selectInput()).toHaveValue("Item_007");
  });

  it("clears the picked option", () => {
    renderTable(columns, data);
    fireEvent.click(selectInput());
    fireEvent.click(screen.getByText("Item 007"));

    fireEvent.click(within(filterCell(0)).getByTitle("Clear"));

    expect(selectInput()).toHaveValue("");
    expect(bodyText()).toHaveLength(15);
  });

  it("leaves empty values out of the dropdown", () => {
    renderTable(
      [{ header: "Issuer", accessorKey: "issuer" }],
      [{ issuer: null }, { issuer: "" }, { issuer: "Pilot A" }]
    );
    fireEvent.click(selectInput());

    const items = Array.from(document.querySelectorAll(".dropdown-item")).map((e) => e.textContent);
    expect(items).toEqual(["Pilot A"]);
  });
});
