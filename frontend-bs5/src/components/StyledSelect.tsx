import Select from "react-select";

function getSelectStyles() {
  return {
    control: (provided: any, {}) => ({
      ...provided,
      // minHeight: `calc((var(--bs-body-line-height)*var(--bs-body-font-size${suffix})) + (var(--bs-form-select-padding-y${suffix})*2) + (var(--bs-form-select-border-width)*2))`,
      minHeight: 30,
    }),
    singleValue: ({ marginLeft, marginRight, ...provided }: any) => ({
      ...provided,
    }),
    valueContainer: (provided: any) => ({
      ...provided,
    }),
    dropdownIndicator: () => ({
      height: "100%",
      marginLeft: "4px",
      marginRight: "4px",
      color: "var(--bs-gray-400)",
    }),
    input: ({ margin, paddingTop, paddingBottom, ...provided }: any) => ({
      ...provided,
    }),
    option: (provided: any) => ({
      ...provided,
      color: "black",
      // fontSize: 16
    }),
    menu: ({ marginTop, ...provided }: any) => ({
      ...provided,
    }),
    multiValue: (provided: any) => ({
      ...provided,
    }),
    clearIndicator: ({ padding, ...provided }: any) => ({
      ...provided,
    }),
    multiValueLabel: ({ padding, paddingLeft, fontSize, ...provided }: any) => ({
      ...provided,
    }),
  };
}

export const StyledSelect = ({ async, components, size, ...props }: any) => {
  return (
    <Select
      components={{ ...components }}
      // theme={getSelectTheme}
      styles={getSelectStyles()}
      {...props}
    />
  );
};
