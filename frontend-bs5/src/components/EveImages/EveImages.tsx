import React from "react";
import { Image } from "react-bootstrap";

type Sizes = 32 | 64 | 128 | 256 | 512;

export interface CharacterPortraitProps extends Partial<Element> {
  character_id?: number | string | undefined;
  size: Sizes;
  height?: number;
  width?: number;
  style?: Partial<React.CSSProperties>;
  className?: string;
}

export const CharacterPortrait = (props: CharacterPortraitProps) => {
  return (
    <Image
      height={props.height && props.height}
      width={props.width && props.width}
      style={props.style && props.style}
      className={props.className && props.className}
      src={`https://images.evetech.net/characters/${props.character_id}/portrait?size=${props.size}`}
    />
  );
};

export interface CorporationLogoProps extends Partial<Element> {
  corporation_id?: number | string | null | undefined;
  size: Sizes;
  height?: number;
  width?: number;
  style?: Partial<React.CSSProperties>;
}

export const CorporationLogo = (props: CorporationLogoProps) => {
  return (
    <Image
      height={props.height && props.height}
      width={props.width && props.width}
      style={props.style && props.style}
      src={`https://images.evetech.net/corporations/${props.corporation_id}/logo?size=${props.size}`}
    />
  );
};

export interface AllianceLogoProps extends Partial<Element> {
  alliance_id?: number | string | undefined;
  size: Sizes;
  height?: number;
  width?: number;
  style?: Partial<React.CSSProperties>;
}

export const AllianceLogo = (props: AllianceLogoProps) => {
  return (
    <Image
      height={props.height && props.height}
      width={props.width && props.width}
      style={props.style && props.style}
      src={`https://images.evetech.net/alliances/${props.alliance_id}/logo?size=${props.size}`}
    />
  );
};
