import { loadCorps } from "../apis/Dashboard";
import { useQuery } from "@tanstack/react-query";
import React from "react";
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

const CorpSelect = () => {
  let { reportID } = useParams();
  const navigate = useNavigate();
  const { isLoading, data, error } = useQuery({
    queryKey: ["corp-select"],
    queryFn: () => loadCorps(),
  });

  const handleChange = (value) => {
    let path = generatePath("/reports/show/:corporationID/:reportID/", {
      reportID: reportID ? reportID : 0,
      corporationID: value,
    });
    navigate(path);
  };
  let options = [];
  if (!isLoading) {
    if (!error) {
      options = data?.map((corp) => {
        return {
          value: corp.corporation_id,
          label: corp.corporation_name,
        };
      });
    }
  }
  return (
    <Select
      className="flex-select"
      isLoading={isLoading}
      styles={colourStyles}
      isDisabled={error}
      options={options}
      onChange={(e) => handleChange(e.value)}
      placeholder="Select Corporation"
    />
  );
};

export default CorpSelect;
