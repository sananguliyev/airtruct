import React from "react"
import { useNavigate } from "react-router-dom"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Layers } from "lucide-react"

export function QuickCreate({ isCollapsed }: { isCollapsed: boolean }) {
  const navigate = useNavigate()

  const handleCreateStream = () => {
    navigate("/streams/new")
  }

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
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

