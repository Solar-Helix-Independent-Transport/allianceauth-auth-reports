import { loadUnknowns } from "../apis/Dashboard";
import BaseTable from "./Tables/BaseTable/BaseTable";
import { EveWhoButton, ZKillButton } from "@pvyparts/allianceauth-components";
import { useQuery } from "@tanstack/react-query";
import React from "react";
import { Card } from "react-bootstrap";

export const OrphanCharacterTable = ({ cid }: any) => {
  const { isFetching, data } = useQuery({
    queryKey: ["loadUnknowns", cid],
    queryFn: () => loadUnknowns(cid),
  });

  const columnsUnknown = React.useMemo(() => {
    let cols = [
      {
        header: "Character",
        accessorKey: "name",
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
            <div style={{ marginLeft: "auto" }}>
              <ZKillButton character_name={row.getValue()} />
              <EveWhoButton character_id={row.row.original.id} />
            </div>
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
        <>
          {data?.missing?.data.length > 0 && (
            <>
              {" "}
              <Card.Title>Missing Characters</Card.Title>
              <BaseTable
                {...{ isFetching }}
                columns={columnsUnknown}
                hover={true}
                data={data?.missing?.data}
              />
            </>
          )}
          {data?.orphans?.data.length > 0 && (
            <>
              <Card.Title>Orphan Characters</Card.Title>
              <BaseTable
                {...{ isFetching }}
                columns={columnsOrphan}
                hover={true}
                data={data?.orphans?.data}
              />
            </>
          )}
        </>
      ) : (
        // <PanelLoader title="Loading Orphans" message="Please Wait" />
        <p>Loading</p>
      )}
    </Card.Body>
  );
};
