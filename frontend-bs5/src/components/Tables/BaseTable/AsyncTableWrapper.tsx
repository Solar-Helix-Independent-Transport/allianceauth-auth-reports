import BaseTable from "./BaseTable";
import { useQuery } from "@tanstack/react-query";
import { ColumnDef } from "@tanstack/react-table";

const AsyncTableWrapper = ({
  queryFn,
  queryKey,
  columns,
}: {
  queryFn: any;
  queryKey: any;
  columns: ColumnDef<any, any>[];
}) => {
  const { data, isFetching } = useQuery({
    queryKey: queryFn,
    queryFn: queryKey,
    refetchOnWindowFocus: false,
  });

  return <BaseTable {...{ isFetching, columns, data }} />;
};

export default AsyncTableWrapper;
