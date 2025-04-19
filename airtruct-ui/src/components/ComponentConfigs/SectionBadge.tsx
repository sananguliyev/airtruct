import { Badge } from "../../ui/badge";

const colorMap: Record<string, string> = {
  input: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  processor: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
  output: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
};

export const SectionBadge = ({ value }: { value: string }) => (
  <Badge className={colorMap[value] || ""} variant="outline">
    {value}
  </Badge>
);