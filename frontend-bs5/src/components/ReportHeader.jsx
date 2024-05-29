import { OrphanCharacterTable } from "./OrphanCharactersTable";
import { CorporationLogo } from "@pvyparts/allianceauth-components";
import React, { useState } from "react";
import { Modal } from "react-bootstrap";
import Badge from "react-bootstrap/Badge";
import { useParams } from "react-router-dom";
import ReactTimeAgo from "react-time-ago";

export const ReportHeader = ({ reportData, isLoading = false }) => {
  let { corporationID } = useParams();

  const [open, setOpen] = useState(false);

  let aggregates = reportData?.headers?.filter((r) => r?.aggregate);
  return (
    <div>
      <div className="d-flex align-items-center">
        <CorporationLogo
          corporation_id={corporationID}
          size={128}
          style={{ marginRight: "20px" }}
        />
        <div>
          <div>
            <h2>{reportData?.report?.corporation}</h2>
            <h3>{reportData?.report?.name}</h3>
          </div>
        </div>
        <div
          style={{
            marginLeft: "auto",
            marginRight: "30px",
            maxWidth: "600px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}
        >
          <h4 style={{ alignSelf: "center" }}>Summary</h4>
          <div
            style={{
              display: "flex",
              alignSelf: "center",
              flexWrap: "wrap",
              justifyContent: "center",
            }}
          >
            {reportData?.updated ? (
              <Badge bg={"primary"} style={{ margin: "5px" }}>
                Last Updated: <ReactTimeAgo date={new Date(reportData?.updated)} locale="en-US" />
              </Badge>
            ) : (
              <Badge bg={"danger"} style={{ margin: "5px" }}>
                Last Updated: Never
              </Badge>
            )}
            {(aggregates?.length > 0 || reportData?.unknowns > 0) && (
              <>
                {reportData?.unknowns > 0 && (
                  <Badge onClick={() => setOpen(true)} bg={"danger"} style={{ margin: "5px" }}>
                    Unknown Characters: {reportData?.unknowns}
                  </Badge>
                )}
                {aggregates.map((row) => {
                  let passRatio = row.pass / reportData?.members;
                  return (
                    <Badge
                      key={row.header}
                      bg={
                        passRatio > 0.75
                          ? "success"
                          : row.pass / reportData?.members > 0.5
                          ? "warning"
                          : "danger"
                      }
                      style={{ margin: "5px" }}
                    >
                      {row.header}: {row.pass}/{reportData?.members}
                    </Badge>
                  );
                })}
              </>
            )}
          </div>
        </div>
      </div>
      <Modal show={open} size="lg" onHide={() => setOpen(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Orphan Characters </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <OrphanCharacterTable cid={corporationID} />
        </Modal.Body>
      </Modal>
    </div>
  );
};
