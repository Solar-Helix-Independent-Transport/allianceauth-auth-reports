import { ReportHeader } from "./ReportHeader";
import { ReportTable } from "./ReportTable";

export const Report = ({ reportData }: any) => {
  return (
    <div>
      <ReportHeader {...{ reportData }} />
      <ReportTable {...{ reportData }} />
    </div>
  );
};
