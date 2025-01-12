import BaseTable from "./Tables/BaseTable/BaseTable";
import { EveWhoButton, ZKillButton } from "@pvyparts/allianceauth-components";
import { useMemo } from "react";
import { Card } from "react-bootstrap";

export const UnknownTable = ({ reportData }: any) => {
  const columns = useMemo(() => {
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
        cell: (row: any) => (
          <div className="text-right" style={{ width: "100px" }}>
            <ZKillButton character_name={row.getValue()} />
            <EveWhoButton character_id={row.getValue()} />
          </div>
        ),
      },
    ];
  }, []);

  let data = reportData["data"];
  return (
    <Card.Body>
      <BaseTable {...{ data, columns }} />
    </Card.Body>
  );
};
