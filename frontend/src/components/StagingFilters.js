import React from "react";
import Select from "react-select";

const colourStyles = {
  option: (styles) => {
    return {
      ...styles,
      color: "black",
    };
  },
};

export const StagingSelect = ({ setFilter, data = [], labelText, isFetching }) => {
  let options = data.map((ref) => {
    return {
      value: ref,
      label: ref,
    };
  });
  const handleState = (entry) => {
    let values = entry.map((o) => {
      return o.value;
    });
    console.log(values.sort().join(","));
    setFilter(values.sort());
  };

  return (
    <div className="flex-label-container">
      <div className="flex-label">
        <h5>{labelText}</h5>
      </div>
      <Select
        className="flex-select"
        styles={colourStyles}
        options={options}
        isLoading={isFetching}
        isMulti={true}
        onChange={handleState}
      />
    </div>
  );
};
