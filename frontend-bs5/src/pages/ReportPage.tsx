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
    refetchInterval: (query) => {
      console.log("qry", query.state.data?.updated, lessThanOneHourAgo(query.state.data?.updated));
      return query.state.data
        ? lessThanOneHourAgo(query.state.data?.updated)
          ? undefined
          : 3000
        : 3000;
    },
  });

  console.log(query);

  return (
    <>
      <MenuRight />
      <ReportHeader reportData={query.data} isLoading={query.isFetching} />
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
