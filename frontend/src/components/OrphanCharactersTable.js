import { loadUnknowns } from "../apis/Dashboard";
import { BaseTable, PanelLoader } from "@pvyparts/allianceauth-components";
import { EveWhoButton, ZKillButton } from "@pvyparts/allianceauth-components";
import React from "react";
import { Panel } from "react-bootstrap";
import { useQuery } from "react-query";

export const OrphanCharacterTable = ({ cid }) => {
  const { isFetching, data } = useQuery(["loadUnknowns", cid], () => loadUnknowns(cid));

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
    <Panel.Body>
      {data ? (
        <BaseTable {...{ columns, isFetching }} hover={true} data={data?.data} />
      ) : (
        <PanelLoader title="Loading Orphans" message="Please Wait" />
      )}
    </Panel.Body>
  );
};
