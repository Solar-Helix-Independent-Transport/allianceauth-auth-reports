import { Button } from "react-bootstrap";

// no trailing slash, Eve Who doesn't serve it (#15)
export const EveWhoButton = ({ character_id }: { character_id?: number }) => (
  <Button
    target="_blank"
    rel="noopener noreferrer"
    disabled={!character_id}
    title="Eve Who"
    href={`https://evewho.com/character/${character_id}`}
  >
    <i className="fas fa-user"></i>
  </Button>
);
