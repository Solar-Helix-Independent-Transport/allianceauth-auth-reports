import { loadReports } from "../apis/Dashboard";
import { StyledSelect } from "./StyledSelect";
import { useQuery } from "@tanstack/react-query";
import { generatePath } from "react-router";
import { useNavigate } from "react-router-dom";
import { useParams } from "react-router-dom";

const ReportSelect = () => {
  let { corporationID } = useParams();
  const navigate = useNavigate();
  const { isLoading, data, error } = useQuery({
    queryKey: ["report-select"],
    queryFn: () => loadReports(),
  });
  const handleChange = (value: any) => {
    let path = generatePath("/reports/show/:corporationID/:reportID/", {
      reportID: value,
      corporationID: String(corporationID ? corporationID : 0),
    });
    navigate(path);
  };
  let options = [];
  if (!isLoading) {
    if (!error) {
      options = data?.map((report: any) => {
        return {
          value: report.id,
          label: report.name,
        };
      });
    }
  }
  return (
    <StyledSelect
      // className="flex-select"
      isLoading={isLoading}
      isDisabled={error}
      options={options}
      onChange={(e: any) => handleChange(e.value)}
      placeholder="Select Report"
    />
  );
};

export default ReportSelect;
