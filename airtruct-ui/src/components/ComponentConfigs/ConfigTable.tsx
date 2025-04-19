import { DataTable } from "../dataTable";
import { ComponentConfig } from "./types";
import { SectionBadge } from "./SectionBadge";
import { Badge } from "../../ui/badge";
import { Column } from "../../components/dataTable";


interface Props {
  data: ComponentConfig[];
  onEdit: (item: ComponentConfig) => void;
  onDelete: (item: ComponentConfig) => void;
}

export const ConfigTable = ({ data, onEdit, onDelete }: Props) => {
  const columns = [
    { key: "name", title: "Name" },
    {
      key: "section",
      title: "Section",
      render: (value: string) => <SectionBadge value={value} />,
    },
    {
      key: "component",
      title: "Component",
      render: (value: string) => <Badge variant="outline">{value}</Badge>,
    },
    { key: "createdAt", title: "Last versioned at" },
  ] as Column<ComponentConfig>[];;

  return <DataTable data={data} columns={columns} onEdit={onEdit} onDelete={onDelete} />;
};