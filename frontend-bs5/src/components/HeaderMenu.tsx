// import styles from "./CharMenu.module.css";
import { loadOverviewReports } from "../apis/Dashboard";
import ReportSelect from "./ReportSelect";
import TargetSelect from "./TargetSelect";
import { useIsFetching, useQuery } from "@tanstack/react-query";
import React from "react";
import { Nav } from "react-bootstrap";
import Spinner from "react-bootstrap/Spinner";
import ReactDOM from "react-dom";
import { Link } from "react-router-dom";

const menuRoot = document.getElementById("nav-right");

// children replace the default target and report pickers
const MenuRight = ({ children }: { children?: React.ReactNode }) => {
  const [innerHtmlEmptied, setInnerHtmlEmptied] = React.useState(false);
  const isFetching = useIsFetching();
  const overviewReports = useQuery({
    queryKey: ["overview-reports"],
    queryFn: () => loadOverviewReports(),
  });

  React.useEffect(() => {
    if (!innerHtmlEmptied) {
      if (menuRoot) {
        menuRoot.innerHTML = "";
        setInnerHtmlEmptied(true);
      }
    }
  }, [innerHtmlEmptied]);

  if (!innerHtmlEmptied) return null;
  if (!menuRoot) {
    return <></>;
  }
  // menuRoot is AA's <ul id="nav-right">, so every item is an <li> (#11)
  return ReactDOM.createPortal(
    <>
      {isFetching > 0 && (
        <li className="nav-item my-auto">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
        </li>
      )}
      {overviewReports.data?.length > 0 && (
        <li className="nav-item">
          <Nav.Link as={Link} to="/reports/overview/">
            <i className="fas fa-table-list fa-fw"></i> Overview
          </Nav.Link>
        </li>
      )}
      <li className="nav-item">
        <Nav.Link href="/reports/add_corp_token">
          <i className="fas fa-plus fa-fw"></i> Add Membership Token
        </Nav.Link>
      </li>
      {children ?? (
        <>
          <li className="nav-item mx-1 my-auto p-0" style={{ width: "300px" }}>
            <TargetSelect />
          </li>
          <li className="nav-item mx-1 my-auto p-0" style={{ width: "300px" }}>
            <ReportSelect />
          </li>
        </>
      )}
    </>,
    menuRoot
  );
};

export { MenuRight };
