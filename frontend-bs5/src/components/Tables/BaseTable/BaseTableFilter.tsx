import Styles from "./BaseTableFilter.module.css";
import { ExactFilterValue, filterText } from "./columnFilter";
import { useDebouncedFilter } from "./useDebouncedFilter";
import { Column, Table as ReactTable } from "@tanstack/react-table";
import { FormEvent, useId, useMemo, useState } from "react";
import { Button, Dropdown, Form, OverlayTrigger, Popover } from "react-bootstrap";

const isHTML = RegExp.prototype.test.bind(/(<([^>]+)>)/i);

// the filters' <form>s aren't meant to submit - with a single text input,
// Enter would otherwise submit it and reload the page, dropping every filter
const preventSubmit = (event: FormEvent) => event.preventDefault();

const SearchIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    className={Styles.searchIcon}
  >
    <path
      fill="currentColor"
      fillRule="evenodd"
      d="M15.62 17.03a9 9 0 1 1 1.41-1.41l4.68 4.67a1 1 0 0 1-1.42 1.42l-4.67-4.68ZM17 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z"
      clipRule="evenodd"
    ></path>
  </svg>
);

const DropDownIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 512 512"
    className={`${Styles.searchIcon} ${Styles.dropDownIcon}`}
  >
    {/* <!--!Font Awesome Free 6.7.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2024 Fonticons, Inc.--> */}
    <path
      fill="currentColor"
      d="M233.4 406.6c12.5 12.5 32.8 12.5 45.3 0l192-192c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L256 338.7 86.6 169.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l192 192z"
    />
  </svg>
);

// a plain button, not type="reset" - inside an OverlayTrigger the click would
// also toggle the popover, so it stops the event before clearing
const ClearButton = ({ onClear }: { onClear: () => void }) => (
  <button
    type="button"
    title="Clear"
    onClick={(event) => {
      event.stopPropagation();
      onClear();
    }}
  >
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      className={Styles.xIcon}
    >
      <path
        fill="currentColor"
        d="M17.3 18.7a1 1 0 0 0 1.4-1.4L13.42 12l5.3-5.3a1 1 0 0 0-1.42-1.4L12 10.58l-5.3-5.3a1 1 0 0 0-1.4 1.42L10.58 12l-5.3 5.3a1 1 0 1 0 1.42 1.4L12 13.42l5.3 5.3Z"
      ></path>
    </svg>
  </button>
);

export const NumberFilter = ({ column }: { column: Column<any, any> }) => {
  const fromToNumber = column.getFilterValue() as [string, string] | undefined;

  const popoverNumber = (
    <Popover id="popover-positioned-top" className={Styles.popover}>
      <Popover.Body>
        <input
          type="number"
          value={fromToNumber?.[0] ?? ""}
          onChange={(e) =>
            column.setFilterValue((old: [number, number]) => [e.target.value, old?.[1]])
          }
          placeholder="Min"
          className="form-control"
        />
        <p className="text-center">to</p>
        <input
          type="number"
          value={fromToNumber?.[1] ?? ""}
          onChange={(e) =>
            column.setFilterValue((old: [number, number]) => [old?.[0], e.target.value])
          }
          placeholder="Max"
          className="form-control"
        />
        <Button
          variant="secondary"
          size="sm"
          className="w-100 mt-2"
          onClick={() => document.body.click()}
        >
          Close
        </Button>
      </Popover.Body>
    </Popover>
  );

  const [min, max] = fromToNumber ?? [];
  const hasRange = min !== undefined || max !== undefined;
  return (
    <OverlayTrigger trigger="click" placement="bottom" rootClose={true} overlay={popoverNumber}>
      <form className={Styles.searchWrapperFrom} onSubmit={preventSubmit}>
        <div className={Styles.searchWrapper}>
          <Form.Control
            className={Styles.searchInput}
            readOnly={true}
            type="text"
            placeholder="Set Range"
            value={
              hasRange
                ? `${min === undefined || min === "" ? "-∞" : min.toLocaleString()} to ${
                    max === undefined || max === "" ? "∞" : max.toLocaleString()
                  }`
                : ""
            }
          />
          <DropDownIcon />
          <ClearButton onClear={() => column.setFilterValue(() => [undefined, undefined])} />
        </div>
      </form>
    </OverlayTrigger>
  );
};

export const BoolFilter = ({ column }: { column: Column<any, any> }) => {
  const passFail = column.getFilterValue();
  // per filter, so two bool columns on one page aren't one radio group
  const id = useId();

  const popoverBool = (
    <Popover id="popover-positioned-top" className={Styles.popover}>
      <Popover.Body className={Styles.radioWrapper}>
        <Form.Check
          label="True"
          name={id}
          type="radio"
          id={`${id}-true`}
          checked={passFail === true}
          onChange={() => column.setFilterValue(true)}
        />
        <Form.Check
          label="False"
          name={id}
          type="radio"
          id={`${id}-false`}
          checked={passFail === false}
          onChange={() => column.setFilterValue(false)}
        />
        <Button
          variant="secondary"
          size="sm"
          className="w-100"
          onClick={() => document.body.click()}
        >
          Close
        </Button>
      </Popover.Body>
    </Popover>
  );

  return (
    <OverlayTrigger trigger="click" placement="bottom" rootClose={true} overlay={popoverBool}>
      <form className={Styles.searchWrapperFrom} onSubmit={preventSubmit}>
        <div className={Styles.searchWrapper}>
          <Form.Control
            className={Styles.searchInput}
            readOnly={true}
            type="text"
            placeholder="Filter"
            value={typeof passFail === "undefined" ? "" : passFail ? "True" : "False"}
          />
          <DropDownIcon />
          <ClearButton onClear={() => column.setFilterValue(() => undefined)} />
        </div>
      </form>
    </OverlayTrigger>
  );
};

export const TextFilter = ({ column }: { column: Column<any, any> }) => {
  const [value, setValue] = useDebouncedFilter(column);
  return (
    <div className={Styles.searchWrapper}>
      <Form.Control
        className={Styles.searchInput}
        type="text"
        placeholder="Search"
        value={value}
        onChange={(event) => setValue(event.target.value)}
      />
      <SearchIcon />
      <ClearButton
        onClear={() => {
          setValue("");
          column.setFilterValue("");
        }}
      />
    </div>
  );
};

// How many options the dropdown renders - a column can have thousands of
// unique values, and rendering them all made opening the dropdown slow.
// Typing narrows the list.
export const MAX_SELECT_OPTIONS = 100;

const optionLabel = (value: string) => value.replace(/_/g, " ");

/** The dropdown's options. Its own component so the work (sorting the
 * column's unique values, matching them against the search) only happens
 * while the dropdown is open, not on every render of the table. */
const SelectFilterOptions = ({ column, search }: { column: Column<any, any>; search: string }) => {
  const uniqueValues = column.getFacetedUniqueValues();

  const allOptions = useMemo(() => {
    // drop null/undefined first, a stray null would otherwise trip the
    // object check below and hide every option in the column
    const sorted = Array.from(uniqueValues.keys())
      .filter((v) => v !== null && v !== undefined && v !== "")
      .sort();
    if (isHTML(sorted[0]) || typeof sorted[0] === "object") return [];
    return (sorted as string[]).map((value) => ({
      value,
      label: optionLabel(value),
      search: String(value).toLowerCase(),
    }));
  }, [uniqueValues]);

  const needle = search.toLowerCase();
  const matching = needle ? allOptions.filter((o) => o.search.includes(needle)) : allOptions;
  const shown = matching.slice(0, MAX_SELECT_OPTIONS);

  if (shown.length === 0) {
    return <Dropdown.Item disabled>Start typing to search.</Dropdown.Item>;
  }
  return (
    <>
      {shown.map((item) => (
        <Dropdown.Item
          key={item.value}
          className={Styles.capitaliseWords}
          eventKey={item.value}
          onClick={() => {
            // picked, so only this value - typed text matches anywhere
            const picked: ExactFilterValue = { exact: item.value };
            column.setFilterValue(picked);
            document.body.click();
          }}
        >
          {item.label}
        </Dropdown.Item>
      ))}
      {matching.length > shown.length && (
        <Dropdown.Item disabled>
          {matching.length - shown.length} more, keep typing to narrow down.
        </Dropdown.Item>
      )}
    </>
  );
};

export const SelectFilter = ({ column }: { column: Column<any, any> }) => {
  // the box shows the applied value's label while idle, and the literal
  // text while typing, which is what gets matched and applied
  const [isEditing, setIsEditing] = useState(false);
  const [search, setSearch] = useDebouncedFilter(column);
  const currentFilterValue = filterText(column.getFilterValue());

  return (
    <OverlayTrigger
      trigger="click"
      placement="bottom-start"
      rootClose={true}
      // a function so the overlay's positioning props land on a plain div -
      // Dropdown would pass the popper-only ones through to the DOM
      overlay={({
        arrowProps,
        hasDoneInitialMeasure,
        popper,
        placement,
        show,
        ...overlayProps
      }) => (
        <div {...overlayProps}>
          <Dropdown show drop={"down-centered"}>
            <Dropdown.Menu className={Styles.dropDown}>
              <SelectFilterOptions column={column} search={search} />
            </Dropdown.Menu>
          </Dropdown>
        </div>
      )}
    >
      <form className={Styles.searchWrapperFrom} onSubmit={preventSubmit}>
        <div className={Styles.searchWrapper}>
          <Form.Control
            className={Styles.searchInput}
            type="text"
            placeholder="Search"
            value={isEditing ? search : optionLabel(currentFilterValue)}
            onFocus={(event) => {
              setIsEditing(true);
              // so the next keystroke replaces the label rather than editing it
              event.target.select();
            }}
            onBlur={() => setIsEditing(false)}
            onChange={(event) => setSearch(event.target.value)}
          />
          <SearchIcon />
          <ClearButton
            onClear={() => {
              setIsEditing(false);
              setSearch("");
              column.setFilterValue(() => undefined);
            }}
          />
        </div>
      </form>
    </OverlayTrigger>
  );
};

export const Filter = ({ column, table }: { column: Column<any, any>; table: ReactTable<any> }) => {
  // pick the filter from the first row that has a value for this column
  const firstValue: any = table
    .getPreFilteredRowModel()
    .flatRows.map((row) => row.getValue(column.id))
    .find((value) => value !== null && value !== undefined);
  if (typeof firstValue === "number") {
    return <NumberFilter {...{ column }} />;
  } else if (typeof firstValue === "boolean") {
    return <BoolFilter {...{ column }} />;
  } else if (typeof firstValue === "object") {
    return <TextFilter {...{ column }} />;
  }
  // No date check here - Date.parse() accepts plenty of ordinary text, which
  // made the filter vanish from text columns (corptools #308).
  return <SelectFilter {...{ column }} />;
};

export default Filter;
