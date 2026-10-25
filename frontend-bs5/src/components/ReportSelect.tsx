import { loadReports } from "../apis/Dashboard";
import { SelectOption, StyledSelect } from "./StyledSelect";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { generatePath, useNavigate, useParams } from "react-router";

const ReportSelect = () => {
  let { targetType, targetID, reportID } = useParams();
  const navigate = useNavigate();
  const { isLoading, data, error } = useQuery({
    queryKey: ["report-select", targetType],
    queryFn: () => loadReports(targetType),
  });
  const goTo = (value: number) => {
    let path = generatePath("/reports/show/:targetType/:targetID/:reportID/", {
      targetType: String(targetType ? targetType : "corp"),
      targetID: String(targetID ? targetID : 0),
      reportID: String(value),
    });
    navigate(path);
  };

  // the current report may not be enabled for this target type
  useEffect(() => {
    if (data && Number(reportID) !== 0 && !data.some((r) => String(r.id) === reportID)) {
      goTo(0);
    }
  }, [data, reportID]);

  const options: SelectOption<number>[] =
    isLoading || error
      ? []
      : (data ?? []).map((report) => ({ value: report.id, label: report.name }));
  const current = options.find((o) => String(o.value) === reportID);
  return (
    <StyledSelect
      // className="flex-select"
      isLoading={isLoading}
      isDisabled={!!error}
      options={options}
      value={current ?? null}
      onChange={(o) => o && goTo(o.value)}
      placeholder="Select Report"
    />
  );
};

export default ReportSelect;
