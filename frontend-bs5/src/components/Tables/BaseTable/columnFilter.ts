import { FilterFn, filterFns } from "@tanstack/react-table";

/** A select filter's value once an option is picked - matched exactly, where
 * typed text (a plain string) matches anywhere in the value. */
export interface ExactFilterValue {
  exact: string;
}

export const isExact = (value: unknown): value is ExactFilterValue =>
  typeof value === "object" && value !== null && !Array.isArray(value) && "exact" in value;

/** The text a filter box shows for a filter value. */
export const filterText = (value: unknown) =>
  isExact(value) ? value.exact : typeof value === "string" ? value : "";

/** The default filterFn, picked by the filter's value rather than the column's.
 * "auto" can't tell a picked option from typed text, and it picks from the
 * first row only - so a column whose first row is empty (e.g. an overview
 * target that hasn't run) got `==`, and range filters on it matched nothing. */
export const columnFilter: FilterFn<any> = (row, columnId, filterValue, addMeta) => {
  if (isExact(filterValue)) return String(row.getValue(columnId) ?? "") === filterValue.exact;
  // a NumberFilter's [min, max]
  if (Array.isArray(filterValue))
    return filterFns.inNumberRange(row, columnId, filterValue as [number, number], addMeta);
  if (typeof filterValue === "boolean")
    return filterFns.equals(row, columnId, filterValue, addMeta);
  return filterFns.includesString(row, columnId, filterValue, addMeta);
};

// the range's text inputs give strings, inNumberRange parses them
columnFilter.resolveFilterValue = (value) =>
  Array.isArray(value)
    ? filterFns.inNumberRange.resolveFilterValue!(value as [number, number])
    : value;

columnFilter.autoRemove = (value) =>
  isExact(value)
    ? !value.exact
    : Array.isArray(value)
    ? filterFns.inNumberRange.autoRemove!(value)
    : value === undefined || value === null || value === "";
