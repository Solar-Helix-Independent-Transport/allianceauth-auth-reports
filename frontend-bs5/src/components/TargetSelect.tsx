import { Target, loadTargets } from "../apis/Dashboard";
import { StyledSelect } from "./StyledSelect";
import { useQuery } from "@tanstack/react-query";
import { generatePath, useNavigate, useParams } from "react-router";

const SECTIONS: { type: Target["type"]; label: string }[] = [
  { type: "alliance", label: "Alliances" },
  { type: "corp", label: "Corporations" },
  { type: "group", label: "Groups" },
];

const optionLabel = (t: Target) =>
  t.type === "corp" && t.parent?.ticker ? `${t.name} [${t.parent.ticker}]` : t.name;

const TargetSelect = () => {
  const { targetType, targetID, reportID } = useParams();
  const navigate = useNavigate();
  const { isLoading, data, error } = useQuery({
    queryKey: ["target-select"],
    queryFn: () => loadTargets(),
  });

  const handleChange = (value: string) => {
    const [type, id] = value.split(":");
    navigate(
      generatePath("/reports/show/:targetType/:targetID/:reportID/", {
        targetType: type,
        targetID: id,
        reportID: String(reportID ? reportID : 0),
      })
    );
  };

  let options: any[] = [];
  if (!isLoading && !error && data) {
    options = SECTIONS.map((s) => ({
      label: s.label,
      options: data
        .filter((t) => t.type === s.type)
        .map((t) => ({ value: `${t.type}:${t.id}`, label: optionLabel(t) })),
    })).filter((s) => s.options.length > 0);
  }
  const current = options
    .flatMap((s) => s.options)
    .find((o: any) => o.value === `${targetType}:${targetID}`);

  return (
    <StyledSelect
      isLoading={isLoading}
      isDisabled={error}
      options={options}
      value={current ?? null}
      onChange={(e: any) => handleChange(e.value)}
      placeholder="Select Alliance, Corporation or Group"
    />
  );
};

export default TargetSelect;
