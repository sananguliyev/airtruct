import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Cell, Pie, PieChart } from "recharts";
import {
  Activity,
  AlertTriangle,
  ArrowDownToLine,
  ArrowUpFromLine,
  Loader2,
  Server,
  Workflow,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { fetchAnalytics } from "@/lib/api";
import type { Analytics } from "@/lib/entities";

const STATUS_COLORS: Record<string, string> = {
  active: "hsl(142, 76%, 36%)",
  completed: "hsl(221, 83%, 53%)",
  paused: "hsl(38, 92%, 50%)",
  failed: "hsl(0, 84%, 60%)",
};

const eventsChartConfig = {
  input_events: { label: "Input", color: "hsl(221, 83%, 53%)" },
  output_events: { label: "Output", color: "hsl(142, 76%, 36%)" },
  error_events: { label: "Errors", color: "hsl(0, 84%, 60%)" },
} satisfies ChartConfig;

const statusChartConfig = {
  active: { label: "Active", color: STATUS_COLORS.active },
  completed: { label: "Completed", color: STATUS_COLORS.completed },
  paused: { label: "Paused", color: STATUS_COLORS.paused },
  failed: { label: "Failed", color: STATUS_COLORS.failed },
} satisfies ChartConfig;

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

export default function Home() {
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const analytics = await fetchAnalytics();
        setData(analytics);
      } catch (err) {
        setError("Failed to load analytics");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Dashboard</h1>
        </div>
        <Card>
          <CardContent className="flex items-center justify-center py-10">
            <p className="text-muted-foreground">{error || "No data available"}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const statusData = data.flows_by_status.map((s) => ({
    name: s.status,
    value: s.count,
    fill: STATUS_COLORS[s.status] || "hsl(var(--muted))",
  }));

  const timeSeriesData = data.events_over_time.map((pt) => ({
    date: pt.timestamp,
    input_events: pt.input_events,
    output_events: pt.output_events,
    error_events: pt.error_events,
  }));

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium">Total Flows</CardTitle>
            <Workflow className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.total_flows}</div>
            <div className="flex gap-1.5 mt-2 flex-wrap">
              {data.flows_by_status.map((s) => (
                <Badge key={s.status} variant="secondary" className="text-xs">
                  {s.status}: {s.count}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium">Input Events</CardTitle>
            <ArrowDownToLine className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(data.total_input_events)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Total events ingested across all flows
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium">Output Events</CardTitle>
            <ArrowUpFromLine className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(data.total_output_events)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Total events delivered to outputs
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium">Active Workers</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.active_workers}</div>
            <div className="flex items-center gap-1.5 mt-1">
              {data.total_processor_errors > 0 && (
                <span className="flex items-center text-xs text-destructive">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  {formatNumber(data.total_processor_errors)} processor errors
                </span>
              )}
              {data.total_processor_errors === 0 && (
                <span className="flex items-center text-xs text-muted-foreground">
                  <Activity className="h-3 w-3 mr-1" />
                  No processor errors
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-7 mb-6">
        <Card className="md:col-span-5">
          <CardHeader>
            <CardTitle>Events Over Time</CardTitle>
            <CardDescription>Daily event counts for the last 30 days</CardDescription>
          </CardHeader>
          <CardContent>
            {timeSeriesData.length > 0 ? (
              <ChartContainer config={eventsChartConfig} className="h-[300px] w-full">
                <BarChart data={timeSeriesData} accessibilityLayer>
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => {
                      const d = new Date(value);
                      return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
                    }}
                  />
                  <YAxis tickLine={false} axisLine={false} tickFormatter={formatNumber} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="input_events" fill="var(--color-input_events)" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="output_events" fill="var(--color-output_events)" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="error_events" fill="var(--color-error_events)" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ChartContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                No event data available yet
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Flow Status</CardTitle>
            <CardDescription>Distribution by status</CardDescription>
          </CardHeader>
          <CardContent>
            {statusData.length > 0 ? (
              <ChartContainer config={statusChartConfig} className="h-[300px] w-full">
                <PieChart accessibilityLayer>
                  <ChartTooltip content={<ChartTooltipContent nameKey="name" />} />
                  <Pie data={statusData} dataKey="value" nameKey="name" innerRadius={50} strokeWidth={2}>
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                </PieChart>
              </ChartContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                No flows yet
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Top Input Components</CardTitle>
            <CardDescription>Most used input connectors</CardDescription>
          </CardHeader>
          <CardContent>
            {data.top_input_components.length > 0 ? (
              <div className="space-y-3">
                {data.top_input_components.map((c) => (
                  <div key={c.component} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-blue-500" />
                      <span className="text-sm font-medium">{c.component}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {c.count} {c.count === 1 ? "flow" : "flows"}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No flows configured yet</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Output Components</CardTitle>
            <CardDescription>Most used output connectors</CardDescription>
          </CardHeader>
          <CardContent>
            {data.top_output_components.length > 0 ? (
              <div className="space-y-3">
                {data.top_output_components.map((c) => (
                  <div key={c.component} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-green-500" />
                      <span className="text-sm font-medium">{c.component}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {c.count} {c.count === 1 ? "flow" : "flows"}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No flows configured yet</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
