import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import TimeAgo from "javascript-time-ago";
import en from "javascript-time-ago/locale/en";
import { afterEach } from "vitest";

// Mirrors the same call in main.tsx - react-time-ago throws "No locale data
// has been registered" without it, and main.tsx never runs when a test
// imports a component directly.
TimeAgo.addDefaultLocale(en);

// HeaderMenu grabs AA's <ul id="nav-right"> when the module loads, so it has
// to exist before any test file imports a page.
const navRight = document.createElement("ul");
navRight.id = "nav-right";
document.body.appendChild(navRight);

// vitest isn't run with `globals: true`, so @testing-library/react's own
// auto-cleanup never registers. Without this, components from a previous
// test stay in the DOM and leak into the next test's queries.
afterEach(() => cleanup());
