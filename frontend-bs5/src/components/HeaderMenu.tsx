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
  return ReactDOM.createPortal(
    <>
      {isFetching ? (
        <div style={{ margin: "auto" }}>
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
        </div>
      ) : (
        <></>
      )}
      {overviewReports.data?.length > 0 && (
        <Nav.Link as={Link} to="/reports/overview/">
          <i className="fas fa-table-list fa-fw"></i> Overview
        </Nav.Link>
      )}
      <Nav.Link href="/reports/add_corp_token">
        <i className="fas fa-plus fa-fw"></i> Add Membership Token
      </Nav.Link>
      {children ?? (
        <>
          <div className="mx-1 my-auto p-0" style={{ width: "300px" }}>
            <TargetSelect />
          </div>
          <div className="mx-1 my-auto p-0" style={{ width: "300px" }}>
            <ReportSelect />
          </div>
        </>
      )}
      <div className="vr ms-2"></div>
    </>,
    menuRoot
  );
};

export { MenuRight };
