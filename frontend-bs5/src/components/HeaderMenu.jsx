// import styles from "./CharMenu.module.css";
import CorpSelect from "./CorpSelect";
import ReportSelect from "./ReportSelect";
import { useIsFetching } from "@tanstack/react-query";
import React from "react";
import { Nav } from "react-bootstrap";
import Spinner from "react-bootstrap/Spinner";
import ReactDOM from "react-dom";

const menuRoot = document.getElementById("nav-right");

const MenuRight = () => {
  const [innerHtmlEmptied, setInnerHtmlEmptied] = React.useState(false);
  const isFetching = useIsFetching();

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
      <Nav.Link href="/reports/add_corp_token">
        <i class="fas fa-plus fa-fw"></i> Add Membership Token
      </Nav.Link>
      <div className="mx-1 my-auto p-0" style={{ width: "300px" }}>
        <CorpSelect />
      </div>
      <div className="mx-1 my-auto p-0" style={{ width: "300px" }}>
        <ReportSelect />
      </div>
      <div class="vr ms-2"></div>
    </>,
    menuRoot
  );
};

export { MenuRight };
