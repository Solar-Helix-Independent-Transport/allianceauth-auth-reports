import "./index.css";
import { OverviewPage } from "./pages/OverviewPage";
import { ReportPage } from "./pages/ReportPage";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import TimeAgo from "javascript-time-ago";
import en from "javascript-time-ago/locale/en";
import React from "react";
import ReactDOM from "react-dom/client";
import { Navigate, Route, BrowserRouter as Router, Routes, useParams } from "react-router";

TimeAgo.addDefaultLocale(en);

// reports can take a while to build server side, don't refetch one just
// because the window got focus again - polling (refetchInterval) isn't affected
const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 60 * 1000 } },
});

const LegacyCorpRedirect = () => {
  const { corporationID, reportID } = useParams();
  return <Navigate replace to={`/reports/show/corp/${corporationID}/${reportID}/`} />;
};

const ReportsView = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Routes>
          <Route path="reports/show/:targetType/:targetID/:reportID/" element={<ReportPage />} />
          {/* legacy corp route */}
          <Route path="reports/show/:corporationID/:reportID/" element={<LegacyCorpRedirect />} />
          <Route path="reports/show/" element={<Navigate to={"/reports/show/corp/0/0/"} />} />
          <Route path="reports/overview/" element={<OverviewPage />} />
          <Route path="reports/overview/:reportID/" element={<OverviewPage />} />
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
