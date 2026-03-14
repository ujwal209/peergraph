"use client";

import * as React from "react";
import { Check, ChevronsUpDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface SearchableSelectProps {
  options: { value: string; label: string }[];
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  emptyMessage?: string;
  className?: string;
  disabled?: boolean;
}

export function SearchableSelect({
  options,
  value,
  onValueChange,
  placeholder = "Select option...",
  emptyMessage = "No option found.",
  className,
  disabled = false,
}: SearchableSelectProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between bg-zinc-950 border-zinc-800 text-zinc-300 hover:bg-zinc-900 hover:text-white rounded-xl h-12 px-4 transition-all focus:ring-1 focus:ring-[#00BC7D] outline-none",
            !value && "text-zinc-500",
            className
          )}
          disabled={disabled}
        >
          <span className="truncate">
            {value
              ? options.find((option) => option.value === value)?.label
              : placeholder}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0 bg-zinc-950 border-zinc-800 shadow-2xl rounded-2xl overflow-hidden z-[100]">
        <Command className="bg-transparent">
          <CommandInput 
            placeholder={`Search ${placeholder.toLowerCase()}...`} 
            className="h-12 border-none focus:ring-0 bg-transparent text-zinc-200"
          />
          <CommandList className="max-h-[300px] custom-scrollbar">
            <CommandEmpty className="py-6 text-center text-sm text-zinc-500 font-medium">
                {emptyMessage}
            </CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.label}
                  onSelect={() => {
                    onValueChange(option.value === value ? "" : option.value);
                    setOpen(false);
                  }}
                  className="flex items-center gap-3 px-4 py-3 text-sm text-zinc-400 aria-selected:bg-[#00BC7D]/10 aria-selected:text-[#00BC7D] cursor-pointer transition-colors"
                >
                  <div className={cn(
                    "w-4 h-4 rounded-full border border-zinc-800 flex items-center justify-center transition-all",
                    value === option.value ? "bg-[#00BC7D] border-[#00BC7D]" : "group-hover:border-zinc-600"
                  )}>
                    <Check
                        className={cn(
                        "h-3 w-3 text-black",
                        value === option.value ? "opacity-100" : "opacity-0"
                        )}
                    />
                  </div>
                  <span className="flex-1 font-medium">{option.label}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
