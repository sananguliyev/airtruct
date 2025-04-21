import { GitCompare, Database, FileOutput } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { Job } from "./types";

export const RecentJob = () => {
  const jobs: Job[] = [
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
  ];

  return (
    <Card className="md:col-span-2">
      <CardHeader>
        <CardTitle>Recent Jobs</CardTitle>
        <p className="text-sm text-muted-foreground">Last 5 completed ELT jobs</p>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {jobs.map((job, index) => (
            <div key={index} className="flex items-center">
              <div className="mr-4 h-9 w-9 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-sm font-medium">
                {job.icon}
              </div>
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium leading-none">{job.name}</p>
                <p className="text-sm text-muted-foreground">Source: {job.source}</p>
              </div>
              <div className="text-sm font-medium text-green-600">{job.records}</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
