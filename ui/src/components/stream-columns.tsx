import { Stream } from "@/lib/entities";
import { Badge } from "./ui/badge";
import { useRelativeTime } from "@/lib/utils";

export const columns = () => [
  { key: "name" as keyof Stream, title: "Name" },
  {
    key: "status" as keyof Stream,
    title: "Status",
    render: (value: string) => {
      const colorMap: Record<string, string> = {
        active: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
        completed:
          "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
        paused:
          "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
        failed: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
      };
      return (
        <Badge className={colorMap[value] || ""} variant="outline">
          {value}
        </Badge>
      );
    },
  },
  {
    key: "inputLabel" as keyof Stream,
    title: "Input",
    render: (value: string, record: Stream) => {
      const suffix = record.isHttpServer ? ` - /ingest/${record.parentID}` : "";
      return `${value}${suffix}`;
    },
  },
  { key: "outputLabel" as keyof Stream, title: "Output" },
  {
    key: "createdAt" as keyof Stream,
    title: "Last versioned",
    render: (value: string) => {
      const RelativeTime = () => {
        const time = useRelativeTime(value);
        return <>{time}</>;
      };
      return <RelativeTime />;
    }
  },
];
