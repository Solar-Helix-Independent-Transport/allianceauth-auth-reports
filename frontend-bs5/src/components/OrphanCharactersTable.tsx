import { loadUnknowns } from "../apis/Dashboard";
import BaseTable from "./Tables/BaseTable/BaseTable";
import { EveWhoButton } from "@pvyparts/allianceauth-components";
import { useQuery } from "@tanstack/react-query";
import React from "react";
import { Card } from "react-bootstrap";

export const OrphanCharacterTable = ({ cid }: any) => {
  const { isFetching, data } = useQuery({
    queryKey: ["loadUnknowns", cid],
    queryFn: () => loadUnknowns(cid),
  });

  const columnsOrphan = React.useMemo(() => {
    let cols = [
      {
        header: "Character",
        accessorKey: "character.name",
        cell: (row: any) => (
          <div
            style={{
              display: "flex",
              flexWrap: "nowrap",
              alignContent: "center",
              alignItems: "center",
            }}
          >
            {row.getValue()}
            {row?.row?.original?.character && (
              <div style={{ marginLeft: "auto" }}>
                {/* <ZKillButton character_name={row.getValue()} /> */}
                <EveWhoButton character_id={row?.row?.original?.character?.id} />
              </div>
            )}
          </div>
        ),
      },
      {
        header: "Main",
        accessorKey: "main.name",
        cell: (row: any) => (
          <div
            style={{
              display: "flex",
              flexWrap: "nowrap",
              alignContent: "center",
              alignItems: "center",
            }}
          >
            {row.getValue()}
            {row?.row?.original?.main && (
              <div style={{ marginLeft: "auto" }}>
                {/* <ZKillButton character_name={row.getValue()} /> */}
                <EveWhoButton character_id={row?.row?.original?.main?.id} />
              </div>
            )}
          </div>
        ),
      },
    ];
    return cols;
  }, []);

  return (
    <Card.Body>
      {data ? (
        <>
          <Card.Title className="mb-1">Orphan Characters</Card.Title>
          <BaseTable
            {...{ isFetching }}
            columns={columnsOrphan}
            hover={true}
            data={[...data?.orphans?.data, ...data?.missing?.data]}
          />
        </>
      ) : (
        // <PanelLoader title="Loading Orphans" message="Please Wait" />
        <p>Loading</p>
      )}
    </Card.Body>
  );
};
