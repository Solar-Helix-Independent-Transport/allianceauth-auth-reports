import { BaseTable, PanelLoader } from "@pvyparts/allianceauth-components";
import { CharacterPortrait } from "@pvyparts/allianceauth-components";
import React from "react";
import { Button, Panel } from "react-bootstrap";

export const ReportTable = ({ reportData }) => {
  const columns = React.useMemo(() => {
    let character = [
      {
        header: "Main Character",
        accessorKey: "character.name",
        cell: (row) => <>{row.getValue()}</>,
      },
    ];
    let dataColumns = reportData?.headers
      ?.sort((a, b) => a.rank > b.rank)
      .map((ob) => {
        if (ob?.checkbox) {
          return {
            header: ob?.header,
            accessorKey: `${ob?.field}.check`,
            enableSorting: ob?.allow_sort ? true : false,
            cell: (row) =>
              row.getValue() ? (
                <Button bsStyle="success" bsSize="small">
                  <i class="fas fa-check-circle"></i>
                </Button>
              ) : (
                <Button bsStyle="danger" bsSize="small">
                  <i class="fas fa-times-circle"></i>
                </Button>
              ),
            // enableColumnFilter: false,
          };
        } else {
          //   return {
          //     header: ob?.header,
          //     accessorKey: `${ob?.field}.data`,
          //     enableSorting: ob?.allow_sort ? true : false,
          //     cell: (row) => <>$ row.getValue().toLocaleString()</>,
          //     // enableColumnFilter: false,
          //   };
          // } else {
          return {
            header: ob?.header,
            accessorKey: `${ob?.field}.data`,
            enableSorting: ob?.allow_sort ? true : false,
            cell: (row) =>
              typeof row.getValue() === "number" ? (
                <>{row.getValue().toLocaleString()}</>
              ) : (
                <div dangerouslySetInnerHTML={{ __html: row.getValue() }} />
              ),
            // enableColumnFilter: false,
          };
          // }
        }
      });
    let characterPortrait = [
      {
        header: " ",
        accessorKey: "character.id",
        enableColumnFilter: false,
        enableSorting: false,
        cell: (row) => (
          <h4>
            <CharacterPortrait character_id={row.getValue()} size={128} height={64} width={64} />
          </h4>
        ),
      },
    ];
    if (reportData?.show_avatar) {
      return characterPortrait.concat(character, dataColumns);
    } else {
      return character.concat(dataColumns);
    }
  }, [reportData]);

  let data = reportData?.data;
  return (
    <Panel.Body>
      {data ? (
        <BaseTable {...{ data, columns }} hover={true} />
      ) : (
        <PanelLoader
          title="Loading Report"
          message="If this is a large report this may take considerable time"
        />
      )}
    </Panel.Body>
  );
};
