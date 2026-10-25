import { UnknownCharacter, UnknownList } from "./apis/Dashboard";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render } from "@testing-library/react";
import React from "react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router";

// renders the current path so tests can assert where a component navigated to
const LocationDisplay = () => {
  const location = useLocation();
  return <div data-testid="location">{location.pathname}</div>;
};

interface RenderOptions {
  // the URL the router starts on
  route?: string;
  // the route pattern the component is mounted under, so useParams works
  path?: string;
}

export const renderWithProviders = (
  ui: React.ReactElement,
  { route = "/", path = "*" }: RenderOptions = {}
) => {
  // no retries, so a rejected query surfaces its error straight away
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const wrap = (element: React.ReactElement) => (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[route]}>
        <Routes>
          <Route path={path} element={element} />
          {path !== "*" && <Route path="*" element={<></>} />}
        </Routes>
        <LocationDisplay />
      </MemoryRouter>
    </QueryClientProvider>
  );
  const result = render(wrap(ui));
  // rerender inside the same providers, keeping the query cache
  return { ...result, rerender: (element: React.ReactElement) => result.rerender(wrap(element)) };
};

// an unknowns API list, the characters are all a test cares about
export const unknownList = (data: UnknownCharacter[]): UnknownList => ({
  name: "Unknown Characters",
  corporation: "Corp One",
  members: 1,
  data,
});
