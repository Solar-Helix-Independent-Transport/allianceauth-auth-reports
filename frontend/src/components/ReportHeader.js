import { CorporationLogo } from "@pvyparts/allianceauth-components";
import React from "react";
import { Label, Nav, Navbar, ProgressBar } from "react-bootstrap";
import { useParams } from "react-router-dom";

export const ReportHeader = ({ reportData, isLoading = false }) => {
  let { corporationID } = useParams();

  let aggregates = reportData?.headers?.filter((r) => r?.aggregate);
  return (
    <div>
      {isLoading && <ProgressBar active now={100} style={{ margin: "0", height: "3px" }} />}
      <div className="panel" style={{ display: "flex" }}>
        <CorporationLogo
          corporation_id={corporationID}
          size={128}
          style={{ marginRight: "20px" }}
        />
        <div>
          <h2>{reportData?.report?.corporation}</h2>
          <h3>{reportData?.report?.name}</h3>
        </div>

        {(aggregates?.length > 0 || reportData?.unknowns > 0) && (
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
              <>
                {reportData?.unknowns > 0 && (
                  <Label bsStyle={"danger"} style={{ margin: "5px" }}>
                    Unknown Characters: {reportData?.unknowns}
                  </Label>
                )}
                {aggregates.map((row) => {
                  let passRatio = row.pass / reportData?.members;
                  return (
                    <Label
                      bsStyle={
                        passRatio > 0.75
                          ? "success"
                          : row.pass / reportData?.members > 0.5
                          ? "warning"
                          : "danger"
                      }
                      style={{ margin: "5px" }}
                    >
                      {row.header}: {row.pass}/{reportData?.members}
                    </Label>
                  );
                })}
              </>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
