import { EveWhoButton } from "./EveWhoButton";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

describe("EveWhoButton", () => {
  it("links to the character on Eve Who without a trailing slash", () => {
    render(<EveWhoButton character_id={1234} />);

    const link = screen.getByTitle("Eve Who");
    expect(link).toHaveAttribute("href", "https://evewho.com/character/1234");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).not.toHaveClass("disabled");
  });

  it("is disabled without a character", () => {
    render(<EveWhoButton />);

    expect(screen.getByTitle("Eve Who")).toHaveClass("disabled");
  });
});
