import { loadReports } from "../apis/Dashboard";
import { useQuery } from "@tanstack/react-query";
import React from "react";
import { generatePath } from "react-router";
import { useNavigate } from "react-router-dom";
import { useParams } from "react-router-dom";
import Select from "react-select";

const controlStyles = {
  base: (style) => {
    return {
      ...style,
      fontSize: "1rem",
    };
  },
  control: (style) => {
    return {
      ...style,
      fontSize: "12px",
      color: "var(--bs-body-color)",
      backgroundColor: "var(--bs-body-bg)",
      backgroundImage: "var(--bs-form-select-bg-img), var(--bs-form-select-bg-icon, none)",
      borderWidth: "var(--bs-border-width)",
      borderColor: "var(--bs-border-color)",
      borderPosition: "right .75rem center",
      borderRadius: "var(--bs-border-radius)",
    };
  },
  input: (style) => {
    return {
      ...style,
      fontSize: "12px",
      color: "var(--bs-body-color)",
    };
  },

  singleValue: (style) => {
    return {
      ...style,
      fontSize: "12px",
      color: "var(--bs-body-color)",
    };
  },

  placeholder: (style) => {
    return { ...style, lineHeight: "12px" };
  },
  option: (styles) => {
    return {
      ...styles,
      color: "var(--bs-body-color)",
      backgroundColor: "var(--bs-body-bg)",
      backgroundImage: "var(--bs-form-select-bg-img), var(--bs-form-select-bg-icon, none)",
      borderWidth: "var(--bs-border-width)",
      borderColor: "var(--bs-border-color)",
      borderPosition: "right .75rem center",
      borderRadius: "var(--bs-border-radius)",
    };
  },
  menu: (styles) => {
    return {
      ...styles,
      color: "var(--bs-body-color)",
      backgroundColor: "var(--bs-body-bg)",
      backgroundImage: "var(--bs-form-select-bg-img), var(--bs-form-select-bg-icon, none)",
      borderWidth: "var(--bs-border-width)",
      borderColor: "var(--bs-border-color)",
      borderPosition: "right .75rem center",
      borderRadius: "var(--bs-border-radius)",
    };
  },
  dropdownIndicator: (style) => {
    return { ...style, paddingTop: "1px", paddingBottom: "1px", fontSize: "12px" };
  },
  indicatorsContainer: (style) => {
    return { ...style };
  },
  clearIndicator: (style) => {
    return { ...style, paddingTop: "1px", paddingBottom: "1px", fontSize: "12px" };
  },
};
const ReportSelect = () => {
  let { corporationID } = useParams();
  const navigate = useNavigate();
  const { isLoading, data, error } = useQuery({
    queryKey: ["report-select"],
    queryFn: () => loadReports(),
  });
  const handleChange = (value) => {
    let path = generatePath("/reports/show/:corporationID/:reportID/", {
      reportID: value,
      corporationID: corporationID ? corporationID : 0,
    });
    navigate(path);
  };
  let options = [];
  if (!isLoading) {
    if (!error) {
      options = data?.map((report) => {
        return {
          value: report.id,
          label: report.name,
        };
      });
    }
  }
  return (
    <Select
      className="flex-select"
      isLoading={isLoading}
      styles={controlStyles}
      isDisabled={error}
      options={options}
      onChange={(e) => handleChange(e.value)}
      placeholder="Select Report"
    />
  );
};

export default ReportSelect;
