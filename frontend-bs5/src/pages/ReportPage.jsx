import { loadReport } from "../apis/Dashboard";
import { MenuRight } from "../components/HeaderMenu";
import { ReportHeader } from "../components/ReportHeader";
import { ReportMenu } from "../components/ReportMenu";
import { ReportTable } from "../components/ReportTable";
import { ErrorLoader, PanelLoader } from "@pvyparts/allianceauth-components";
import { useQuery } from "@tanstack/react-query";
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

export const ReportPage = () => {
  let { corporationID, reportID } = useParams();
  const [enabled, setEnabled] = useState(3000);

  useEffect(() => {
    setEnabled(3000);
  }, [corporationID, reportID]);

  const { isLoading, error, data, isFetching } = useQuery({
    queryKey: ["dashboard", corporationID, reportID],
    queryFn: () => loadReport(reportID, corporationID),

    options: {
      //refetchOnWindowFocus: false,
      refetchInterval: enabled,
    },
  });
  // what about cached data
  if (data?.data && enabled) {
    setEnabled(null);
  }

  return (
    <>
      <MenuRight />
      <ReportMenu />
      <ReportHeader reportData={data} isLoading={isFetching | enabled} />
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
