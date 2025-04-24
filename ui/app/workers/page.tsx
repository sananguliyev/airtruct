"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { InfoIcon } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { Worker } from "@/lib/entities";
import { DataTable } from "@/components/data-table";

export default function WorkersPage() {
  const [workers, setWorkers] = useState<Worker[]>([] as Worker[]);

  useEffect(() => {
    async function fetchWorkers() {
      try {
        const response = await fetch("http://localhost:8080/v0/workers/all");

        if (!response.ok) {
          throw new Error("Response not ok");
        }
        const data = await response.json();
        setWorkers(
          data.data.map((worker: any) => ({
            id: worker.id,
            status: worker.status,
            address: worker.address,
            lastHeartbeat: new Date(worker.last_heartbeat).toLocaleString(),
            activeStreams: Math.floor(Math.random() * 5),
          }))
        );
      } catch (error) {
        console.error("Error fetching workers data:", error);
      }
    }

    fetchWorkers();
  }, []);

  const columns = [
    { key: "id", title: "ID" },
    { key: "address", title: "Address" },
    {
      key: "status" as keyof Worker,
      title: "Status",
      render: (value: string) => {
        const colorMap: Record<string, string> = {
          active:
            "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
          inactive:
            "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300",
        };
        return (
          <Badge
            className={colorMap[value.toLowerCase()] || ""}
            variant="outline"
          >
            {value}
          </Badge>
        );
      },
    },
    {
      key: "activeStreams",
      title: "Active Streams",
    },
    {
      key: "lastHeartbeat" as keyof Worker,
      title: "Last Heartbeat",
    },
  ];

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Workers</h1>
          <p className="text-muted-foreground">
            Workers automatically join the system and cannot be manually created
            or modified
          </p>
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center text-muted-foreground cursor-help">
                <InfoIcon className="h-5 w-5 mr-1" />
                <span>About Workers</span>
              </div>
            </TooltipTrigger>
            <TooltipContent className="max-w-sm">
              <p>
                Workers are processing nodes that automatically register
                themselves with the system. They report their status via
                heartbeats and can run multiple streams simultaneously.
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Active Workers</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable data={workers} columns={columns} />
        </CardContent>
      </Card>
    </div>
  );
}
