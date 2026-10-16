import { loadOverview, loadOverviewReports } from "../apis/Dashboard";
import ErrorBoundary from "../components/ErrorBoundary";
import { MenuRight } from "../components/HeaderMenu";
import { ErrorLoader, PanelLoader } from "../components/Loaders/loaders";
import { StyledSelect } from "../components/StyledSelect";
import BaseTable from "../components/Tables/BaseTable/BaseTable";
import { passVariant, percentOf } from "../utils/thresholds";
import { useQuery } from "@tanstack/react-query";
import React, { useEffect } from "react";
import { Card, ProgressBar } from "react-bootstrap";
import { Link, useNavigate, useParams } from "react-router-dom";
import ReactTimeAgo from "react-time-ago";

const TYPE_LABELS: Record<string, string> = {
  corp: "Corporation",
  alliance: "Alliance",
  group: "Group",
};

const TYPE_ICONS: Record<string, string> = {
  corp: "fa-building",
  alliance: "fa-users-rectangle",
  group: "fa-users",
};

const PassBar = ({ passed, members, label }: any) => {
  const percent = percentOf(passed, members);
  return (
    <ProgressBar
      style={{ minWidth: "140px", height: "1.25rem" }}
      variant={passVariant(percent)}
      now={percent}
      label={label ?? `${passed}/${members}`}
    />
  );
};

const NotRun = () => <span className="text-muted fst-italic">Queued</span>;

const OverviewReportSelect = () => {
  const { reportID } = useParams();
  const navigate = useNavigate();
  const { isLoading, data } = useQuery({
    queryKey: ["overview-reports"],
    queryFn: () => loadOverviewReports(),
  });
  const options = data?.map((r: any) => ({ value: r.id, label: r.name })) ?? [];
  return (
    <li className="nav-item mx-1 my-auto p-0" style={{ width: "300px" }}>
      <StyledSelect
        isLoading={isLoading}
        options={options}
        value={options.find((o: any) => String(o.value) === reportID) ?? null}
        onChange={(e: any) => navigate(`/reports/overview/${e.value}/`)}
        placeholder="Select Report"
      />
    </li>
  );
};

const OverviewTable = ({ overview, reportID }: any) => {
  const columns = React.useMemo(() => {
    const fields: any[] = overview?.fields ?? [];
    const notRun = (row: any) => row.members === null;
    return [
      {
        id: "type",
        header: "Type",
        accessorFn: (row: any) => TYPE_LABELS[row.target.type],
        cell: (cell: any) => (
          <span className="text-nowrap">
            <i className={`fas ${TYPE_ICONS[cell.row.original.target.type]} fa-fw me-1`}></i>
            {cell.getValue()}
          </span>
        ),
      },
      {
        id: "target",
        header: "Target",
        accessorFn: (row: any) => row.target.name,
        cell: (cell: any) => {
          const t = cell.row.original.target;
          return <Link to={`/reports/show/${t.type}/${t.id}/${reportID}/`}>{cell.getValue()}</Link>;
        },
      },
      {
        id: "members",
        header: "Members",
        accessorFn: (row: any) => row.members ?? undefined,
        cell: (cell: any) => cell.getValue() ?? "–",
      },
      {
        id: "unknowns",
        header: "Unknowns",
        accessorFn: (row: any) => row.unknowns ?? undefined,
        cell: (cell: any) => cell.getValue() ?? "n/a",
      },
      ...fields.map((f) => ({
        id: f.field,
        header: f.header,
        // percentage so sorting and range filters compare targets of different sizes
        accessorFn: (row: any) =>
          notRun(row) ? undefined : percentOf(row.fields[f.field] ?? 0, row.members),
        cell: (cell: any) => {
          const row = cell.row.original;
          return notRun(row) ? (
            <NotRun />
          ) : (
            <PassBar passed={row.fields[f.field] ?? 0} members={row.members} />
          );
        },
      })),
      // all_pass is null when the report has no aggregate fields
      ...(fields.length === 0
        ? []
        : [
            {
              id: "all_pass",
              header: "All fields",
              accessorFn: (row: any) =>
                notRun(row) ? undefined : percentOf(row.all_pass, row.members),
              cell: (cell: any) =>
                cell.getValue() === undefined ? (
                  <NotRun />
                ) : (
                  <PassBar
                    passed={cell.row.original.all_pass}
                    members={cell.row.original.members}
                    label={`${cell.getValue()}%`}
                  />
                ),
            },
          ]),
      {
        id: "updated",
        header: "Updated",
        accessorFn: (row: any) => row.updated ?? undefined,
        enableColumnFilter: false,
        cell: (cell: any) =>
          cell.getValue() ? (
            <span className="text-nowrap">
              <ReactTimeAgo date={new Date(cell.getValue())} locale="en-US" />
            </span>
          ) : (
            "–"
          ),
      },
    ];
  }, [overview, reportID]);

  return (
    <BaseTable
      data={overview.rows}
      columns={columns}
      hover={true}
      exportFileName={`Overview_${overview.report?.name ?? reportID}`}
    />
  );
};

export const OverviewPage = () => {
  const { reportID } = useParams();
  const navigate = useNavigate();

  const reports = useQuery({
    queryKey: ["overview-reports"],
    queryFn: () => loadOverviewReports(),
  });

  // land on the first overview report
  useEffect(() => {
    if (!reportID && reports.data?.length) {
      navigate(`/reports/overview/${reports.data[0].id}/`, { replace: true });
    }
  }, [reportID, reports.data]);

  const overview = useQuery({
    queryKey: ["overview", reportID],
    queryFn: () => loadOverview(reportID ?? 0),
    enabled: !!reportID,
    refetchInterval: 60000,
  });

  return (
    <>
      <MenuRight>
        <OverviewReportSelect />
      </MenuRight>
      <h2 className="mb-3">Global Overview</h2>
      {reports.data?.length === 0 ? (
        <PanelLoader
          title="No reports on the overview"
          message="Enable “Shown on the global overview” on a report in the admin site."
        />
      ) : overview.error ? (
        <ErrorLoader title="API Error" message="There was a problem loading data from the API" />
      ) : !overview.data ? (
        <PanelLoader title="Loading Overview" message="Please wait" />
      ) : (
        <Card.Body>
          <ErrorBoundary>
            <OverviewTable overview={overview.data} reportID={reportID} />
          </ErrorBoundary>
        </Card.Body>
      )}
    </>
  );
};
