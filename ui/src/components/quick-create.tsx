import React from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Layers, KeyRound, MemoryStick, Gauge } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function QuickCreate({ isCollapsed }: { isCollapsed: boolean }) {
  const navigate = useNavigate();

  const handleCreateStream = () => {
    navigate("/streams/new");
  };

  const handleCreateCache = () => {
    navigate("/caches/new");
  };

  const handleCreateRateLimit = () => {
    navigate("/rate-limits/new");
  };

  const handleCreateSecret = () => {
    navigate("/secrets?create=true");
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {isCollapsed ? (
          <Button variant="default" size="icon" className="w-full h-8">
            <Plus className="h-4 w-4" />
            <span className="sr-only">Quick Create</span>
          </Button>
        ) : (
          <Button className="w-full justify-start">
            <Plus className="mr-2 h-4 w-4" />
            Quick Create
          </Button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuItem onSelect={handleCreateStream}>
          <Layers className="mr-2 h-4 w-4" />
          New Stream
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={handleCreateSecret}>
          <KeyRound className="mr-2 h-4 w-4" />
          New Secret
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={handleCreateCache}>
          <MemoryStick className="mr-2 h-4 w-4" />
          New Cache
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={handleCreateRateLimit}>
          <Gauge className="mr-2 h-4 w-4" />
          New Rate Limit
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
