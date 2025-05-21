import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  TrendingUp,
  ArrowUpRight,
  Database,
  FileOutput,
  GitCompare,
} from "lucide-react";

export default function Home() {
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
      </div>
      <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-6" role="alert">
        <p className="font-bold">Sample Data</p>
        <p>All numbers and metrics shown are sample numbers. Implementation is still in progress.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium">
              Extracted Records
            </CardTitle>
            <div className="flex items-center text-green-600 text-xs font-medium">
              <TrendingUp className="h-4 w-4 mr-1" />
              +12.5%
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,452,890</div>
            <p className="text-xs text-muted-foreground mt-1">
              +12.5% from last week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium">Loaded Data</CardTitle>
            <div className="flex items-center text-green-600 text-xs font-medium">
              <TrendingUp className="h-4 w-4 mr-1" />
              +8.2%
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1.2 TB</div>
            <p className="text-xs text-muted-foreground mt-1">
              +8.2% from last week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium">
              Transformations
            </CardTitle>
            <div className="flex items-center text-green-600 text-xs font-medium">
              <TrendingUp className="h-4 w-4 mr-1" />
              +15%
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">245</div>
            <p className="text-xs text-muted-foreground mt-1">
              +15% from last week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium">
              Active Streams
            </CardTitle>
            <div className="flex items-center text-green-600 text-xs font-medium">
              <ArrowUpRight className="h-4 w-4 mr-1" />
              +3
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">18</div>
            <p className="text-xs text-muted-foreground mt-1">
              +3 since yesterday
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-7">
        <Card className="md:col-span-5">
          <CardHeader>
            <CardTitle>Processing Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <div className="flex items-center justify-between mb-4">
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">1.5M</div>
                  <div className="text-xs text-muted-foreground">1.0M</div>
                  <div className="text-xs text-muted-foreground">500K</div>
                  <div className="text-xs text-muted-foreground">250K</div>
                  <div className="text-xs text-muted-foreground">0</div>
                </div>
                <div className="flex-1 h-[250px] flex items-end justify-between px-2">
                  {[
                    "Jan",
                    "Feb",
                    "Mar",
                    "Apr",
                    "May",
                    "Jun",
                    "Jul",
                    "Aug",
                    "Sep",
                    "Oct",
                    "Nov",
                    "Dec",
                  ].map((month, i) => (
                    <div key={month} className="flex flex-col items-center">
                      <div
                        className="w-8 bg-gray-900 dark:bg-gray-100"
                        style={{
                          height: `${Math.max(
                            20,
                            Math.floor(Math.random() * 200)
                          )}px`,
                        }}
                      ></div>
                      <div className="mt-2 text-xs">{month}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Recent Jobs</CardTitle>
            <p className="text-sm text-muted-foreground">
              Last 5 completed ELT jobs
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {[
                {
                  icon: <Database className="h-4 w-4" />,
                  name: "Customer Data Import",
                  source: "MySQL",
                  status: "Completed",
                  records: "125K",
                },
                {
                  icon: <FileOutput className="h-4 w-4" />,
                  name: "Product Catalog",
                  source: "MongoDB",
                  status: "Completed",
                  records: "56K",
                },
                {
                  icon: <GitCompare className="h-4 w-4" />,
                  name: "Order History",
                  source: "PostgreSQL",
                  status: "Completed",
                  records: "89K",
                },
                {
                  icon: <Database className="h-4 w-4" />,
                  name: "User Analytics",
                  source: "Kafka",
                  status: "Completed",
                  records: "230K",
                },
                {
                  icon: <FileOutput className="h-4 w-4" />,
                  name: "Inventory Sync",
                  source: "REST API",
                  status: "Completed",
                  records: "45K",
                },
              ].map((job, index) => (
                <div key={index} className="flex items-center">
                  <div className="mr-4 h-9 w-9 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-sm font-medium">
                    {job.icon}
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {job.name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Source: {job.source}
                    </p>
                  </div>
                  <div className="text-sm font-medium text-green-600">
                    {job.records}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
