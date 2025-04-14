"use client";

import * as React from "react";
import { Dialog, DialogTitle, DialogContent } from "@/components/ui/dialog";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { useRouter } from "next/navigation";
import {
  Moon,
  Sun,
  LayoutDashboard,
  Component,
  Cpu,
  MemoryStick,
  Layers,
  ScanLine,
  Waypoints,
} from "lucide-react";
import { useTheme } from "next-themes";

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const router = useRouter();
  const { setTheme } = useTheme();
  const [inputValue, setInputValue] = React.useState("");

  const handleSelect = (callback: () => void) => {
    callback();
    onOpenChange(false);
    setInputValue("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTitle className="text-lg font-semibold hidden">
        Command Palette
      </DialogTitle>
      <DialogContent className="p-0 gap-0 max-w-[640px] overflow-hidden rounded-lg">
        <Command className="rounded-lg border shadow-md">
          <CommandInput
            placeholder="Search..."
            value={inputValue}
            onValueChange={setInputValue}
          />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup heading="General">
              <CommandItem
                onSelect={() => handleSelect(() => router.push("/"))}
              >
                <LayoutDashboard className="mr-2 h-4 w-4" />
                Dashboard
              </CommandItem>
              <CommandItem
                onSelect={() => handleSelect(() => router.push("/components"))}
              >
                <Component className="mr-2 h-4 w-4" />
                Components
              </CommandItem>
              <CommandItem
                onSelect={() => handleSelect(() => router.push("/streams"))}
              >
                <Waypoints className="mr-2 h-4 w-4" />
                Streams
              </CommandItem>
              <CommandItem
                onSelect={() => handleSelect(() => router.push("/workers"))}
              >
                <Cpu className="mr-2 h-4 w-4" />
                Workers
              </CommandItem>
            </CommandGroup>
            <CommandGroup heading="Other">
              <CommandItem
                onSelect={() => handleSelect(() => router.push("/caches"))}
              >
                <MemoryStick className="mr-2 h-4 w-4" />
                Caches
              </CommandItem>
              <CommandItem
                onSelect={() => handleSelect(() => router.push("/buffers"))}
              >
                <Layers className="mr-2 h-4 w-4" />
                Buffers
              </CommandItem>
              <CommandItem
                onSelect={() => handleSelect(() => router.push("/scanners"))}
              >
                <ScanLine className="mr-2 h-4 w-4" />
                Scanners
              </CommandItem>
            </CommandGroup>
            <CommandGroup heading="Theme">
              <CommandItem
                onSelect={() => handleSelect(() => setTheme("light"))}
              >
                <Sun className="mr-2 h-4 w-4" />
                Light
              </CommandItem>
              <CommandItem
                onSelect={() => handleSelect(() => setTheme("dark"))}
              >
                <Moon className="mr-2 h-4 w-4" />
                Dark
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  );
}

