import { passVariant, percentOf } from "../utils/thresholds";
import { AllianceLogo, CorporationLogo } from "./EveImages/EveImages";
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

const TargetLogo = ({ targetType, targetID }: any) => {
  if (targetType === "alliance") {
    return <AllianceLogo alliance_id={Number(targetID)} size={128} />;
  }
  if (targetType === "group") {
    return <i className="fas fa-users fa-fw fa-5x" style={{ width: 128 }}></i>;
  }
  return <CorporationLogo corporation_id={Number(targetID)} size={128} className="me-3" />;
};

export const ReportHeader = ({ reportData }: any) => {
  let { targetType, targetID } = useParams();
  // results cached before targets existed only carry report.corporation
  const targetName = reportData?.target?.name ?? reportData?.report?.corporation;
  const showUnknowns = targetType !== "group";

  const [open, setOpen] = useState(false);

  let aggregates = reportData?.headers?.filter((r: any) => r?.aggregate);
  return (
    <div>
      <div className="d-flex align-items-center mb-3">
        <div className="me-3">
          <TargetLogo targetType={targetType} targetID={targetID} />
        </div>
        <div>
          <div>
            <h2>{targetName}</h2>
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
                {showUnknowns && (
                  <OverlayTrigger placement="left" overlay={unknownTooltip}>
                    <Badge
                      onClick={() => setOpen(true)}
                      bg={reportData?.unknowns > 0 ? "danger" : "success"}
                      style={{ margin: "5px" }}
                    >
                      <i className="fa-solid fa-arrow-up-right-from-square"></i> | Unknown
                      Characters: {reportData?.unknowns}
                    </Badge>
                  </OverlayTrigger>
                )}
                {reportData?.members_without_main > 0 && (
                  <Badge bg="secondary" style={{ margin: "5px" }}>
                    Members without a main: {reportData?.members_without_main}
                  </Badge>
                )}
                {aggregates.map((row: any) => {
                  return (
                    <Badge
                      key={row.header}
                      bg={passVariant(percentOf(row.pass, reportData?.members))}
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
          {showUnknowns && <OrphanCharacterTable targetType={targetType} targetID={targetID} />}
        </Modal.Body>
      </Modal>
    </div>
  );
};
