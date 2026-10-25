import { loadReport } from "../apis/Dashboard";
import { MenuRight } from "../components/HeaderMenu";
import { ErrorLoader, PanelLoader } from "../components/Loaders/loaders";
import { ReportHeader } from "../components/ReportHeader";
import { ReportTable } from "../components/ReportTable";
import { lessThanOneHourAgo } from "../utils/freshness";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router";

export const ReportPage = () => {
  let { targetType, targetID, reportID } = useParams();
  const query = useQuery({
    queryKey: ["dashboard", targetType, targetID, reportID],
    queryFn: () => {
      return loadReport(targetType, targetID, reportID);
    },
    refetchIntervalInBackground: true,
    // poll until the API has fresh results, but not while nothing is picked
    // (data is false) or the API is refusing (403/404) - neither will change
    refetchInterval: (query) => {
      if (query.state.data === false || query.state.status === "error") return false;
      return lessThanOneHourAgo(query.state.data?.updated) ? false : 3000;
    },
  });

  return (
    <>
      <MenuRight />
      <ReportHeader reportData={query.data} />
      {query.error ? (
        <ErrorLoader title="API Error" message="There was a problem loading data from the API" />
      ) : query.isLoading ? (
        <PanelLoader
          title="Loading Report"
          message="If this is a large report this may take considerable time"
        />
      ) : query.data === false ? (
        <PanelLoader title="Please Select a Target and Report" />
      ) : (
        <ReportTable reportData={query.data} />
      )}
    </>
  );
};
