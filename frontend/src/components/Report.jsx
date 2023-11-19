import { ReportHeader } from "./ReportHeader";
import { ReportTable } from "./ReportTable";
import React from "react";

export const Report = ({ reportData }) => {
  return (
    <div>
      <ReportHeader {...{ reportData }} />
      <ReportTable {...{ reportData }} />
    </div>
  );
};
