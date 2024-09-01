import { OpenInGameButton } from "./OpenInGameButton";
import { EveWhoButton, ZKillButton } from "@pvyparts/allianceauth-components";
import React from "react";
import { Button, ButtonGroup } from "react-bootstrap";

export const OpenCharacterButtonGroup = ({ character_id, character_name }) => {
  return (
    <ButtonGroup bsSize="small" style={{ display: "flex" }}>
      <OpenInGameButton {...{ character_id }} />
      <Button disabled={character_id ? true : false} style={{ flexGrow: 1 }}>
        {character_name}
      </Button>
      <ZKillButton {...{ character_name }} />
      <EveWhoButton {...{ character_id }} />
    </ButtonGroup>
  );
};
