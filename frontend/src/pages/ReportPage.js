import { loadReport } from "../apis/Dashboard";
import { ReportHeader } from "../components/ReportHeader";
import { ReportTable } from "../components/ReportTable";
import { ErrorLoader, PanelLoader } from "@pvyparts/allianceauth-components";
import React from "react";
import { isError, useQuery } from "react-query";
import { useParams } from "react-router-dom";

export const ReportPage = () => {
  let { corporationID, reportID } = useParams();
  const { isLoading, error, data, isFetching } = useQuery(
    ["dashboard", corporationID, reportID],
    () => loadReport(reportID, corporationID),
    {
      refetchOnWindowFocus: false,
    }
  );
  return (
    <>
      <ReportHeader reportData={data} />
      {error ? (
        <ErrorLoader title="API Error" message="There was a problem loading data from the API" />
      ) : isLoading ? (
        <PanelLoader
          title="Loading Report"
          message="If this is a large report this may take considerable time"
        />
      ) : data === false ? (
        <PanelLoader title="Please Select a Corporation and Report" />
      ) : (
        <ReportTable reportData={data} />
      )}
    </>
  );
};
