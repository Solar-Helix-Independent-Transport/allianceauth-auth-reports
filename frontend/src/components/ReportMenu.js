import CorpSelect from "./CorpSelect";
import ReportSelect from "./ReportSelect";
import { CorporationLogo } from "@pvyparts/allianceauth-components";
import React from "react";
import { Button, Nav, NavItem, Navbar } from "react-bootstrap";
import { useParams } from "react-router-dom";

export const ReportMenu = ({ reportData }) => {
  let { corporationID } = useParams();

  return (
    <>
      <br />
      <Navbar style={{ marginBottom: "0", backgroundColor: "transparent" }}>
        <Navbar.Header>
          <Navbar.Brand>Auth Reports</Navbar.Brand>
        </Navbar.Header>
        <Nav pullRight>
          <li role="presentation">
            <div style={{ paddingTop: "9px", width: "300px" }}>
              <CorpSelect />
            </div>
          </li>
          <li role="presentation">
            <div style={{ paddingTop: "9px", width: "300px" }}>
              <ReportSelect />
            </div>
          </li>
          <NavItem href="/reports/add_corp_token">
            <i class="fas fa-plus fa-fw"></i>
          </NavItem>
        </Nav>
      </Navbar>
    </>
  );
};
