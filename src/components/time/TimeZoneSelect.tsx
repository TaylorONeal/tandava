import { useMemo, useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { timeZoneLabel, timeZoneOptions } from "@/lib/time/timeZones";
import { zoneName } from "@/lib/time/classTime";

export function TimeZoneSelect({ id, value, onChange }: {
  id: string;
  value: string;
  onChange: (zone: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const zones = useMemo(() => timeZoneOptions(value), [value]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button id={id} variant="outline" aria-expanded={open} className="min-h-11 w-full min-w-0 justify-between px-3 font-normal">
          <span className="truncate">{timeZoneLabel(value)}</span>
          <ChevronsUpDown className="ms-2 h-4 w-4 shrink-0 opacity-50" aria-hidden="true" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-80 max-w-[calc(100vw-2rem)] p-0">
        <Command>
          <CommandInput placeholder="Search by city or region…" aria-label="Search time zones" />
          <CommandList>
            <CommandEmpty>No matching time zone. Try a nearby city.</CommandEmpty>
            <CommandGroup>
              {zones.map(zone => (
                <CommandItem key={zone} value={`${zone} ${timeZoneLabel(zone)}`} keywords={[zoneName(zone)]} onSelect={() => { onChange(zone); setOpen(false); }} className="min-h-11">
                  <Check className={`me-2 h-4 w-4 shrink-0 ${value === zone ? "opacity-100" : "opacity-0"}`} aria-hidden="true" />
                  {timeZoneLabel(zone)}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
