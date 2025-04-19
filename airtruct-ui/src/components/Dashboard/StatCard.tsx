import { TrendingUp, ArrowUpRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { StatCardProps } from "./types";

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  percentage,
  description,
  icon,
}) => {
  return (
    <Card>
      <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="flex items-center text-green-600 text-xs font-medium">
          {icon === "TrendingUp" ? (
            <TrendingUp className="h-4 w-4 mr-1" />
          ) : (
            <ArrowUpRight className="h-4 w-4 mr-1" />
          )}
          {percentage}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      </CardContent>
    </Card>
  );
};
