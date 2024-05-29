import { postOpenChar } from "../apis/Dashboard";
import React from "react";
import { Button } from "react-bootstrap";

export const OpenInGameButton = ({ character_id }) => {
  return (
    <Button
      bsStyle={"info"}
      disabled={character_id ? false : true}
      onClick={() => {
        postOpenChar(character_id);
      }}
    >
      <i class="fas fa-external-link-alt"></i>
    </Button>
  );
};
