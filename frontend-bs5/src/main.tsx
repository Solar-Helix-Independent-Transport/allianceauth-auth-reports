import "./index.css";
import { ReportPage } from "./pages/ReportPage";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import TimeAgo from "javascript-time-ago";
import en from "javascript-time-ago/locale/en";
import React from "react";
import ReactDOM from "react-dom/client";
import { Navigate, Route, BrowserRouter as Router, Routes } from "react-router-dom";

TimeAgo.addDefaultLocale(en);

const queryClient = new QueryClient();

const ReportsView = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Routes>
          <Route path="reports/show/:corporationID/:reportID/" element={<ReportPage />} />
          <Route path="reports/show/" element={<Navigate to={"/reports/show/0/0/"} />} />
        </Routes>
      </Router>
      <ReactQueryDevtools initialIsOpen={true} />
    </QueryClientProvider>
  );
};

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ReportsView />
  </React.StrictMode>
);
