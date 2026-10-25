import { ReportData, ReportHeaderField } from "../apis/Dashboard";
import { passVariant, percentOf } from "../utils/thresholds";
import { AllianceLogo, CorporationLogo } from "./EveImages/EveImages";
import { OrphanCharacterTable } from "./OrphanCharactersTable";
import { useState } from "react";
import { Modal } from "react-bootstrap";
import Badge from "react-bootstrap/Badge";
import OverlayTrigger from "react-bootstrap/OverlayTrigger";
import Tooltip from "react-bootstrap/Tooltip";
import { useParams } from "react-router";
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

interface TargetLogoProps {
  targetType?: string;
  targetID?: string;
  name?: string;
}

const TargetLogo = ({ targetType, targetID, name }: TargetLogoProps) => {
  // nothing picked yet, there's no logo to show
  if (!Number(targetID)) return null;
  if (targetType === "alliance") {
    return <AllianceLogo alliance_id={Number(targetID)} size={128} alt={name} />;
  }
  if (targetType === "group") {
    return <i className="fas fa-users fa-fw fa-5x" style={{ width: 128 }}></i>;
  }
  return <CorporationLogo corporation_id={Number(targetID)} size={128} alt={name} />;
};

// false until a target and report are picked
export const ReportHeader = ({ reportData }: { reportData?: ReportData | false }) => {
  let { targetType, targetID } = useParams();
  const report = reportData || undefined;
  // results cached before targets existed only carry report.corporation
  const targetName = report?.target?.name ?? report?.report?.corporation;
  const showUnknowns = targetType !== "group";

  const [open, setOpen] = useState(false);

  let aggregates = report?.headers?.filter((r) => r.aggregate);
  return (
    <div>
      <div className="d-flex align-items-center mb-3">
        <div className="me-3">
          <TargetLogo targetType={targetType} targetID={targetID} name={targetName} />
        </div>
        <div>
          <div>
            <h2>{targetName}</h2>
            <h3>{report?.report?.name}</h3>
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
            {report?.updated ? (
              <OverlayTrigger placement="left" overlay={updateTooltip}>
                <Badge bg={"primary"} style={{ margin: "5px" }}>
                  Last Updated: <ReactTimeAgo date={new Date(report.updated)} locale="en-US" />
                </Badge>
              </OverlayTrigger>
            ) : (
              <OverlayTrigger placement="left" overlay={neverTooltip}>
                <Badge bg={"danger"} style={{ margin: "5px" }}>
                  Last Updated: Never
                </Badge>
              </OverlayTrigger>
            )}
            {((aggregates?.length ?? 0) > 0 || (report?.unknowns ?? 0) > 0) && (
              <>
                {showUnknowns && (
                  <OverlayTrigger placement="left" overlay={unknownTooltip}>
                    {/* a real button, so it can be reached and opened from the keyboard */}
                    <Badge
                      as="button"
                      type="button"
                      className="border-0"
                      onClick={() => setOpen(true)}
                      bg={(report?.unknowns ?? 0) > 0 ? "danger" : "success"}
                      style={{ margin: "5px" }}
                    >
                      <i className="fa-solid fa-arrow-up-right-from-square"></i> | Unknown
                      Characters: {report?.unknowns}
                    </Badge>
                  </OverlayTrigger>
                )}
                {(report?.members_without_main ?? 0) > 0 && (
                  <Badge bg="secondary" style={{ margin: "5px" }}>
                    Members without a main: {report?.members_without_main}
                  </Badge>
                )}
                {aggregates?.map((row: ReportHeaderField) => {
                  return (
                    <Badge
                      key={row.header}
                      bg={passVariant(percentOf(row.pass, report?.members))}
                      style={{ margin: "5px" }}
                    >
                      {row.header}: {row.pass}/{report?.members}
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
