import React from "react";
import Select from "react-select";
import { components } from "react-select";

function getSelectStyles(multi, size = "") {
  const suffix = size ? `-${size}` : "";
  const multiplicator = multi ? 2 : 1;
  return {
    control: (provided, { isDisabled, isFocused }) => ({
      ...provided,
      // minHeight: `calc((var(--bs-body-line-height)*var(--bs-body-font-size${suffix})) + (var(--bs-form-select-padding-y${suffix})*2) + (var(--bs-form-select-border-width)*2))`,
      minHeight: 30,
    }),
    singleValue: ({ marginLeft, marginRight, ...provided }, { isDisabled }) => ({
      ...provided,
    }),
    valueContainer: (provided, state) => ({
      ...provided,
    }),
    dropdownIndicator: (provided, state) => ({
      height: "100%",
      marginLeft: "4px",
      marginRight: "4px",
      color: "var(--bs-gray-400)",
    }),
    input: ({ margin, paddingTop, paddingBottom, ...provided }, state) => ({
      ...provided,
    }),
    option: (provided, state) => ({
      ...provided,
      color: "black",
      // fontSize: 16
    }),
    menu: ({ marginTop, ...provided }, state) => ({
      ...provided,
    }),
    multiValue: (provided, state) => ({
      ...provided,
    }),
    clearIndicator: ({ padding, ...provided }, state) => ({
      ...provided,
    }),
    multiValueLabel: ({ padding, paddingLeft, fontSize, ...provided }, state) => ({
      ...provided,
    }),
  };
}

function IndicatorSeparator() {
  return null;
}

function DropdownIndicator(props) {
  return (
    <components.DropdownIndicator {...props}>
      <span></span>
    </components.DropdownIndicator>
  );
}

function getSelectTheme(theme) {
  return {
    ...theme,
    borderRadius: "var(--bs-border-radius)",
    colors: {
      ...theme.colors,
      primary: "var(--bs-body-color)",
      danger: "var(--bs-danger)",
    },
  };
}

export const StyledSelect = ({ async, components, size, ...props }) => {
  return (
    <Select
      components={{ ...components }}
      // theme={getSelectTheme}
      styles={getSelectStyles("isMulti" in props, size)}
      {...props}
    />
  );
};
