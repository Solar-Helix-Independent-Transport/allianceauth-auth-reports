import { ReportData } from "../apis/Dashboard";
import { renderWithProviders } from "../testUtils";
import { ReportTable } from "./ReportTable";
import { screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

const field = { aggregate: false, pass: 0 };

const reportData = (overrides: Partial<ReportData> = {}): ReportData => ({
  report: { name: "Audit Compliance", corporation: "Corp One" },
  members: 2,
  unknowns: 0,
  show_avatar: false,
  headers: [
    { ...field, rank: 2, header: "Wallet", field: "field-2", checkbox: false, allow_sort: true },
    { ...field, rank: 1, header: "Audit", field: "field-1", checkbox: true, allow_sort: false },
  ],
  data: [
    {
      character: { id: 11, name: "Pilot A" },
      "field-1": { check: true, data: "" },
      "field-2": { check: true, data: 1234567 },
    },
    {
      character: { id: 12, name: "Pilot B" },
      "field-1": { check: false, data: "" },
      "field-2": { check: false, data: "<b>Not linked</b>" },
    },
  ],
  ...overrides,
});

const headerRow = () => screen.getAllByRole("row")[0];

describe("ReportTable", () => {
  it("orders the field columns by rank after the main character", () => {
    renderWithProviders(<ReportTable reportData={reportData()} />);

    const headers = within(headerRow()).getAllByRole("columnheader");
    expect(headers.map((h) => h.textContent)).toEqual(["Main Character", "Audit", "Wallet"]);
  });

  it("shows a pass or fail button for checkbox fields", () => {
    const { container } = renderWithProviders(<ReportTable reportData={reportData()} />);

    expect(container.querySelectorAll("tbody .btn-success .fa-check-circle")).toHaveLength(1);
    expect(container.querySelectorAll("tbody .btn-danger .fa-times-circle")).toHaveLength(1);
  });

  it("formats numbers and renders the HTML messages from filters", () => {
    renderWithProviders(<ReportTable reportData={reportData()} />);

    expect(screen.getByText((1234567).toLocaleString())).toBeInTheDocument();
    expect(screen.getByText("Not linked").tagName).toBe("B");
  });

  it("only lets the fields that allow it be sorted", () => {
    renderWithProviders(<ReportTable reportData={reportData()} />);

    const [, audit, wallet] = within(headerRow()).getAllByRole("columnheader");
    expect(audit.querySelector(".fa-sort")).not.toBeInTheDocument();
    expect(wallet.querySelector(".fa-sort")).toBeInTheDocument();
  });

  it("adds a portrait column when the report shows avatars", () => {
    const { container } = renderWithProviders(
      <ReportTable reportData={reportData({ show_avatar: true })} />
    );

    const headers = within(headerRow()).getAllByRole("columnheader");
    expect(headers).toHaveLength(4);
    expect(container.querySelector('tbody img[src*="11"]')).toBeInTheDocument();
  });

  it("shows the loader until the report has data", () => {
    renderWithProviders(<ReportTable reportData={undefined} />);

    expect(screen.getByText("Loading Report")).toBeInTheDocument();
  });
});
