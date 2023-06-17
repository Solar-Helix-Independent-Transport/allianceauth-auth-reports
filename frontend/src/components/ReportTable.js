import { BaseTable } from "@pvyparts/allianceauth-components";
import { CharacterPortrait } from "@pvyparts/allianceauth-components";
import React from "react";
import { Button, Panel } from "react-bootstrap";

export const ReportTable = ({ reportData }) => {
  const columns = React.useMemo(() => {
    let characterKey = [
      {
        header: "",
        accessorKey: "character.id",
        cell: (row) => (
          <CharacterPortrait character_id={row.getValue()} size={128} height={64} width={64} />
        ),
        enableColumnFilter: false,
        enableSorting: false,
      },
      {
        header: "Character",
        accessorKey: "character.name",
      },
    ];
    let dataColumns = reportData?.headers
      .sort((a, b) => a.rank > b.rank)
      .map((ob) => {
        if (ob?.checkbox) {
          return {
            header: ob?.header,
            accessorKey: `${ob?.field}.check`,
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
          return {
            header: ob?.header,
            accessorKey: `${ob?.field}.data`,
            cell: (row) => <div dangerouslySetInnerHTML={{ __html: row.getValue() }} />,
            // enableColumnFilter: false,
          };
        }
      });
    return characterKey.concat(dataColumns);
  }, [reportData]);

  let data = reportData["data"];
  return (
    <Panel.Body>
      <BaseTable {...{ data, columns }} />
    </Panel.Body>
  );
};
