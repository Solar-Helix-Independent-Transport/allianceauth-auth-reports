import { loadReports } from "../apis/Dashboard";
import React from "react";
import { useQuery } from "react-query";
import { generatePath } from "react-router";
import { useNavigate } from "react-router-dom";
import { useParams } from "react-router-dom";
import Select from "react-select";

const colourStyles = {
  option: (styles) => {
    return {
      ...styles,
      color: "black",
    };
  },
};

const ReportSelect = () => {
  let { corporationID } = useParams();
  const navigate = useNavigate();
  const { isLoading, data } = useQuery(["report-select"], () => loadReports());
  const handleChange = (value) => {
    let path = generatePath("/reports/show/:corporationID/:reportID/", {
      reportID: value,
      corporationID: corporationID ? corporationID : 0,
    });
    navigate(path);
  };
  let options = [];
  if (!isLoading) {
    options = data?.map((report) => {
      return {
        value: report.id,
        label: report.name,
      };
    });
  }
  return (
    <Select
      className="flex-select"
      isLoading={isLoading}
      styles={colourStyles}
      options={options}
      onChange={(e) => handleChange(e.value)}
      placeholder="Select Report"
    />
  );
};

export default ReportSelect;
