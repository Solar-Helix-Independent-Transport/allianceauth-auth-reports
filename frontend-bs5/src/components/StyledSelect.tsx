import Select, { GroupBase, Props, StylesConfig } from "react-select";

// built once, not on every render. The destructured-and-dropped keys strip
// react-select's default spacing so the selects sit tight in AA's navbar.
const selectStyles: StylesConfig = {
  control: (provided) => ({
    ...provided,
    minHeight: 30,
  }),
  singleValue: ({ marginLeft, marginRight, ...provided }) => provided,
  dropdownIndicator: () => ({
    height: "100%",
    marginLeft: "4px",
    marginRight: "4px",
    color: "var(--bs-gray-400)",
  }),
  input: ({ margin, paddingTop, paddingBottom, ...provided }) => provided,
  // the menu is always light, keep its text readable under a dark theme
  option: (provided) => ({
    ...provided,
    color: "black",
  }),
  menu: ({ marginTop, ...provided }) => provided,
  clearIndicator: ({ padding, ...provided }) => provided,
  multiValueLabel: ({ padding, paddingLeft, fontSize, ...provided }) => provided,
};

export interface SelectOption<V> {
  value: V;
  label: string;
}

// generic, so onChange gets the caller's option type
export const StyledSelect = <Option, Group extends GroupBase<Option> = GroupBase<Option>>(
  props: Props<Option, false, Group>
) => {
  return (
    <Select<Option, false, Group>
      styles={selectStyles as StylesConfig<Option, false, Group>}
      {...props}
    />
  );
};
