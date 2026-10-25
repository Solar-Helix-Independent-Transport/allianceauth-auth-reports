import { ReportData, ReportFieldValue, ReportRow } from "../apis/Dashboard";
import ErrorBoundary from "./ErrorBoundary";
import { CharacterPortrait } from "./EveImages/EveImages";
import { PanelLoader } from "./Loaders/loaders";
import BaseTable from "./Tables/BaseTable/BaseTable";
import { CellContext, ColumnDef } from "@tanstack/react-table";
import React from "react";
import { Button, Card } from "react-bootstrap";

type Column = ColumnDef<ReportRow, any>;

export const ReportTable = ({ reportData }: { reportData?: ReportData }) => {
  const columns = React.useMemo(() => {
    let character: Column[] = [
      {
        header: "Main Character",
        accessorKey: "character.name",
        cell: (row: CellContext<ReportRow, string>) => <>{row.getValue()}</>,
      },
    ];
    // sort a copy, sorting the query's cached data in place defeats its
    // structural sharing so every refetch looks like new data
    let dataColumns: Column[] = [...(reportData?.headers ?? [])]
      .sort((a, b) => a.rank - b.rank)
      .map((ob): Column => {
        if (ob.checkbox) {
          return {
            header: ob.header,
            accessorKey: `${ob.field}.check`,
            enableSorting: !!ob.allow_sort,
            cell: (row: CellContext<ReportRow, boolean>) =>
              row.getValue() ? (
                <Button variant="success" size="sm">
                  <i className="fas fa-check-circle"></i>
                </Button>
              ) : (
                <Button variant="danger" size="sm">
                  <i className="fas fa-times-circle"></i>
                </Button>
              ),
          };
        }
        return {
          header: ob.header,
          accessorKey: `${ob.field}.data`,
          enableSorting: !!ob.allow_sort,
          cell: (row: CellContext<ReportRow, ReportFieldValue["data"]>) => {
            const value = row.getValue();
            return typeof value === "number" ? (
              <>{value.toLocaleString()}</>
            ) : (
              // trusted HTML: a field's message is rendered as is, so every
              // field must escape what it puts in it (see ReportFieldAlts)
              <div dangerouslySetInnerHTML={{ __html: value }} />
            );
          },
        };
      });
    let characterPortrait: Column[] = [
      {
        header: " ",
        accessorKey: "character.id",
        enableColumnFilter: false,
        enableSorting: false,
        cell: (row: CellContext<ReportRow, number>) => (
          <h4>
            <CharacterPortrait
              character_id={row.getValue()}
              alt={row.row.original.character?.name}
              size={128}
              height={64}
              width={64}
            />
          </h4>
        ),
      },
    ];
    if (reportData?.show_avatar) {
      return [...characterPortrait, ...character, ...dataColumns];
    } else {
      return [...character, ...dataColumns];
    }
  }, [reportData]);

  let data = reportData?.data;
  return (
    <Card.Body>
      <ErrorBoundary>
        {data ? (
          <BaseTable {...{ data, columns }} hover={true} />
        ) : (
          <PanelLoader
            title="Loading Report"
            message="If this is a large report this may take considerable time"
          />
        )}
      </ErrorBoundary>
    </Card.Body>
  );
};
