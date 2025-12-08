import { CorporationLogo } from "./EveImages/EveImages";
import { OrphanCharacterTable } from "./OrphanCharactersTable";
import { useState } from "react";
import { Modal } from "react-bootstrap";
import Badge from "react-bootstrap/Badge";
import OverlayTrigger from "react-bootstrap/OverlayTrigger";
import Tooltip from "react-bootstrap/Tooltip";
import { useParams } from "react-router-dom";
import ReactTimeAgo from "react-time-ago";

const updateTooltip = (
  <Tooltip id="updateTooltip" style={{ position: "fixed" }}>
    Reports will automatically update if the last update is more than 1 hour ago, or if the report
    fields are updated.
  </Tooltip>
);

const neverTooltip = (
  <Tooltip id="neverTooltip" style={{ position: "fixed" }}>
    Reports is being generated, please wait. This page will refresh when it is ready.
  </Tooltip>
);

const unknownTooltip = (
  <Tooltip id="unknownTooltip" style={{ position: "fixed" }}>
    Click to show unknown characters.
  </Tooltip>
);

// const unknownFailedTooltip = (
//   <Tooltip id="unknownFailedTooltip">
//     Unable to calculate unknown characters, have you added a Membership Token?
//   </Tooltip>
// );

<p className="text-center small">* </p>;

export const ReportHeader = ({ reportData }: any) => {
  let { corporationID } = useParams();

  const [open, setOpen] = useState(false);

  let aggregates = reportData?.headers?.filter((r: any) => r?.aggregate);
  return (
    <div>
      <div className="d-flex align-items-center mb-3">
        <div className="me-3">
          <CorporationLogo
            corporation_id={Number(corporationID)}
            size={128}
            className="me-3"
            // style={{ marginRight: "20px" }}
          />
        </div>
        <div>
          <div>
            <h2>{reportData?.report?.corporation}</h2>
            <h3>{reportData?.report?.name}</h3>
          </div>
        </div>
        {/* <h4 style={{ alignSelf: "center", marginLeft: "auto" }}>Summary</h4> */}
        <div
          className="m-2 ms-auto"
          style={{
            marginRight: "30px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              display: "flex",
              alignSelf: "center",
              flexWrap: "wrap",
              justifyContent: "center",
            }}
          >
            {reportData?.updated ? (
              <OverlayTrigger placement="left" overlay={updateTooltip}>
                <Badge bg={"primary"} style={{ margin: "5px" }}>
                  Last Updated: <ReactTimeAgo date={new Date(reportData?.updated)} locale="en-US" />
                </Badge>
              </OverlayTrigger>
            ) : (
              <OverlayTrigger placement="left" overlay={neverTooltip}>
                <Badge bg={"danger"} style={{ margin: "5px" }}>
                  Last Updated: Never
                </Badge>
              </OverlayTrigger>
            )}
            {(aggregates?.length > 0 || reportData?.unknowns > 0) && (
              <>
                <OverlayTrigger placement="left" overlay={unknownTooltip}>
                  <Badge
                    onClick={() => setOpen(true)}
                    bg={reportData?.unknowns > 0 ? "danger" : "success"}
                    style={{ margin: "5px" }}
                  >
                    <i className="fa-solid fa-arrow-up-right-from-square"></i> | Unknown Characters:{" "}
                    {reportData?.unknowns}
                  </Badge>
                </OverlayTrigger>
                {aggregates.map((row: any) => {
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
        <Modal.Header closeButton></Modal.Header>
        <Modal.Body>
          <OrphanCharacterTable cid={corporationID} />
        </Modal.Body>
      </Modal>
    </div>
  );
};
