"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Component, Layers } from "lucide-react"

export function QuickCreate({ isCollapsed }: { isCollapsed: boolean }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)

  const handleCreateComponent = () => {
    setOpen(false)
    router.push("/component-configs/new")
  }

  const handleCreateStream = () => {
    setOpen(false)
    router.push("/streams/new")
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
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
        <DropdownMenuItem onClick={handleCreateComponent}>
          <Component className="mr-2 h-4 w-4" />
          New Component
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleCreateStream}>
          <Layers className="mr-2 h-4 w-4" />
          New Stream
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

