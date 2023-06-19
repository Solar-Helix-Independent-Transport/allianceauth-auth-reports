import { BaseTable } from "@pvyparts/allianceauth-components";
import { CharacterPortrait, EveWhoButton, ZKillButton } from "@pvyparts/allianceauth-components";
import React from "react";
import { Button, Panel } from "react-bootstrap";

export const UnknownTable = ({ reportData }) => {
  const columns = React.useMemo(() => {
    return [
      {
        header: "Character",
        accessorKey: "name",
      },
      {
        header: "Links",
        accessorKey: "id",
        enableColumnFilter: false,
        enableSorting: false,
        cell: (row) => (
          <div className="text-right" style={{ width: "100px" }}>
            <ZKillButton character_name={row.getValue()} character_id={row.getValue()} />
            <EveWhoButton character_name={row.getValue()} character_id={row.getValue()} />
          </div>
        ),
      },
    ];
  }, []);

  let data = reportData["data"];
  return (
    <Panel.Body>
      <BaseTable {...{ data, columns }} />
    </Panel.Body>
  );
};
