import { loadUnknowns } from "../apis/Dashboard";
import BaseTable from "./Tables/BaseTable/BaseTable";
import { EveWhoButton, ZKillButton } from "@pvyparts/allianceauth-components";
import { useQuery } from "@tanstack/react-query";
import React from "react";
import { Card } from "react-bootstrap";

export const OrphanCharacterTable = ({ cid }) => {
  const { isFetching, data } = useQuery({
    queryKey: ["loadUnknowns", cid],
    queryFn: () => loadUnknowns(cid),
  });

  const columns = React.useMemo(() => {
    let cols = [
      {
        header: "Character",
        accessorKey: "name",
        cell: (row) => (
          <div
            style={{
              display: "flex",
              flexWrap: "nowrap",
              alignContent: "center",
              alignItems: "center",
            }}
          >
            {row.getValue()}
            <div style={{ marginLeft: "auto" }}>
              <ZKillButton character_name={row.getValue()} />
              <EveWhoButton character_id={row.row.original.id} />
            </div>
          </div>
        ),
      },
    ];
    return cols;
  }, []);

  return (
    <Card.Body>
      {data ? (
        <BaseTable {...{ columns, isFetching }} hover={true} data={data?.data} />
      ) : (
        // <PanelLoader title="Loading Orphans" message="Please Wait" />
        <p>Loading</p>
      )}
    </Card.Body>
  );
};
