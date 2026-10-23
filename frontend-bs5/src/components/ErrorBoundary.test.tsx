import ErrorBoundary from "./ErrorBoundary";
import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const Broken = (): JSX.Element => {
  throw new Error("boom");
};

describe("ErrorBoundary", () => {
  beforeEach(() => {
    // React logs caught render errors, keep the test output clean
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders its children when nothing throws", () => {
    render(
      <ErrorBoundary>
        <p>All good</p>
      </ErrorBoundary>
    );

    expect(screen.getByText("All good")).toBeInTheDocument();
  });

  it("swaps a crashing child for the error loader", () => {
    const { container } = render(
      <ErrorBoundary>
        <Broken />
      </ErrorBoundary>
    );

    expect(container.querySelector(".bi-exclamation-triangle")).toBeInTheDocument();
  });
});
