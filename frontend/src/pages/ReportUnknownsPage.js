import { loadUnknowns } from "../apis/Dashboard";
import { ReportHeader } from "../components/ReportHeader";
import { ReportMenu } from "../components/ReportMenu";
import { ReportTable } from "../components/ReportTable";
import { UnknownTable } from "../components/UnknownTable";
import { ErrorLoader, PanelLoader } from "@pvyparts/allianceauth-components";
import React from "react";
import { isError, useQuery } from "react-query";
import { useParams } from "react-router-dom";

export const ReportUnknownsPage = () => {
  let { corporationID } = useParams();
  const { isLoading, error, data, isFetching } = useQuery(
    ["unknowns", corporationID],
    () => loadUnknowns(corporationID),
    {
      refetchOnWindowFocus: false,
    }
  );
  return (
    <>
      <ReportMenu />
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
        <UnknownTable reportData={data} />
      )}
    </>
  );
};
