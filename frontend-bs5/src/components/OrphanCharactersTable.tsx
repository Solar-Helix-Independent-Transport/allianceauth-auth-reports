import { UnknownCharacter, loadUnknowns } from "../apis/Dashboard";
import { EveWhoButton } from "./EveWhoButton";
import BaseTable from "./Tables/BaseTable/BaseTable";
import { useQuery } from "@tanstack/react-query";
import { CellContext, ColumnDef } from "@tanstack/react-table";
import React from "react";
import { Card } from "react-bootstrap";

export const OrphanCharacterTable = ({
  targetType,
  targetID,
}: {
  targetType?: string;
  targetID?: string;
}) => {
  const { isFetching, data } = useQuery({
    queryKey: ["loadUnknowns", targetType, targetID],
    queryFn: () => loadUnknowns(targetType, targetID),
  });

  const columnsOrphan = React.useMemo(() => {
    let cols: ColumnDef<UnknownCharacter, string>[] = [
      {
        header: "Character",
        accessorKey: "character.name",
        cell: (row: CellContext<UnknownCharacter, string>) => (
          <div
            style={{
              display: "flex",
              flexWrap: "nowrap",
              alignContent: "center",
              alignItems: "center",
            }}
          >
            {row.getValue()}
            {row.row.original.character && (
              <div style={{ marginLeft: "auto" }}>
                {/* <ZKillButton character_name={row.getValue()} /> */}
                <EveWhoButton character_id={row.row.original.character.id} />
              </div>
            )}
          </div>
        ),
      },
      {
        header: "Main",
        accessorKey: "main.name",
        cell: (row: CellContext<UnknownCharacter, string>) => (
          <div
            style={{
              display: "flex",
              flexWrap: "nowrap",
              alignContent: "center",
              alignItems: "center",
            }}
          >
            {row.getValue()}
            {row.row.original.main && (
              <div style={{ marginLeft: "auto" }}>
                {/* <ZKillButton character_name={row.getValue()} /> */}
                <EveWhoButton character_id={row.row.original.main.id} />
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
          {(data.corps_without_token ?? 0) > 0 && (
            <p className="text-warning small">
              {data.corps_without_token} member corporation(s) have no membership token, so their
              unknown characters are not counted.
            </p>
          )}
          <BaseTable
            {...{ isFetching }}
            columns={columnsOrphan}
            hover={true}
            data={[...(data.orphans?.data ?? []), ...(data.missing?.data ?? [])]}
          />
        </>
      ) : (
        // <PanelLoader title="Loading Orphans" message="Please Wait" />
        <p>Loading</p>
      )}
    </Card.Body>
  );
};
