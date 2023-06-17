import CorpSelect from "./CorpSelect";
import ReportSelect from "./ReportSelect";
import { CorporationLogo } from "@pvyparts/allianceauth-components";
import React from "react";
import { Nav, NavItem, Navbar } from "react-bootstrap";
import { useParams } from "react-router-dom";

export const ReportHeader = ({ reportData }) => {
  let { corporationID } = useParams();

  return (
    <>
      <br />
      <Navbar>
        <Navbar.Header>
          <Navbar.Brand>Auth Report</Navbar.Brand>
        </Navbar.Header>
        <Nav pullRight>
          <li role="presentation">
            <div style={{ paddingTop: "7px", width: "300px" }}>
              <CorpSelect />
            </div>
          </li>
          <li role="presentation">
            <div style={{ paddingTop: "7px", width: "300px" }}>
              <ReportSelect />
            </div>
          </li>
        </Nav>
      </Navbar>
    </>
  );
};
