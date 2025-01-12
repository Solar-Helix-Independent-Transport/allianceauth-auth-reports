import { loadReport } from "../apis/Dashboard";
import { MenuRight } from "../components/HeaderMenu";
import { ReportHeader } from "../components/ReportHeader";
import { ReportTable } from "../components/ReportTable";
import { ErrorLoader, PanelLoader } from "@pvyparts/allianceauth-components";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";

const lessThanOneHourAgo = (date: any) => {
  const HOUR = 1000 * 60 * 60;
  const anHourAgo = Date.now() - HOUR;
  return new Date(date).getTime() > anHourAgo;
};

export const ReportPage = () => {
  let { corporationID, reportID } = useParams();
  const query = useQuery({
    queryKey: ["dashboard", corporationID, reportID],
    queryFn: () => {
      return loadReport(reportID, corporationID);
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
        <PanelLoader title="Please Select a Corporation and Report" />
      ) : (
        <ReportTable reportData={query.data} />
      )}
    </>
  );
};
