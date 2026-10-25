import React from "react";
import { Image } from "react-bootstrap";

type Sizes = 32 | 64 | 128 | 256 | 512;

interface EveImageProps {
  size: Sizes;
  height?: number;
  width?: number;
  style?: Partial<React.CSSProperties>;
  className?: string;
  // a generic description by default, pass the name when it's known
  alt?: string;
}

export interface CharacterPortraitProps extends EveImageProps {
  character_id?: number | string | undefined;
}

export const CharacterPortrait = (props: CharacterPortraitProps) => {
  return (
    <Image
      height={props.height}
      width={props.width}
      style={props.style}
      className={props.className}
      alt={props.alt ?? "Character portrait"}
      src={`https://images.evetech.net/characters/${props.character_id}/portrait?size=${props.size}`}
    />
  );
};

export interface CorporationLogoProps extends EveImageProps {
  corporation_id?: number | string | null | undefined;
}

export const CorporationLogo = (props: CorporationLogoProps) => {
  return (
    <Image
      height={props.height}
      width={props.width}
      style={props.style}
      className={props.className}
      alt={props.alt ?? "Corporation logo"}
      src={`https://images.evetech.net/corporations/${props.corporation_id}/logo?size=${props.size}`}
    />
  );
};

export interface AllianceLogoProps extends EveImageProps {
  alliance_id?: number | string | undefined;
}

export const AllianceLogo = (props: AllianceLogoProps) => {
  return (
    <Image
      height={props.height}
      width={props.width}
      style={props.style}
      className={props.className}
      alt={props.alt ?? "Alliance logo"}
      src={`https://images.evetech.net/alliances/${props.alliance_id}/logo?size=${props.size}`}
    />
  );
};
