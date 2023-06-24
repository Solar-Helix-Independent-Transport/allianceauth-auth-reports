import "./index.css";
import { ReportPage } from "./pages/ReportPage";
import { ReportUnknownsPage } from "./pages/ReportUnknownsPage";
import TimeAgo from "javascript-time-ago";
import en from "javascript-time-ago/locale/en";
import React from "react";
import { render } from "react-dom";
import { QueryClient, QueryClientProvider } from "react-query";
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
    </QueryClientProvider>
  );
};

const appDiv = document.getElementById("root");
render(<ReportsView />, appDiv);
