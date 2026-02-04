import { useState } from "react";
import { ManageLayout } from "@/components/manage/ManageLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Search,
  Plus,
  MoreHorizontal,
  Clock,
  Users,
  DollarSign,
  Flame,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface OfferingItem {
  id: string;
  name: string;
  style: string;
  level: string;
  duration: number;
  capacity: number;
  dropInPrice: number;
  isHeated: boolean;
  isActive: boolean;
  weeklySlots: number;
  avgAttendance: number;
}

const mockOfferings: OfferingItem[] = [
  { id: "1", name: "Morning Vinyasa", style: "Vinyasa", level: "All Levels", duration: 75, capacity: 25, dropInPrice: 2500, isHeated: false, isActive: true, weeklySlots: 3, avgAttendance: 20 },
  { id: "2", name: "Gentle Flow", style: "Hatha", level: "Beginner", duration: 60, capacity: 20, dropInPrice: 2500, isHeated: false, isActive: true, weeklySlots: 2, avgAttendance: 13 },
  { id: "3", name: "Power Yoga", style: "Power", level: "Intermediate", duration: 60, capacity: 30, dropInPrice: 3000, isHeated: false, isActive: true, weeklySlots: 2, avgAttendance: 28 },
  { id: "4", name: "Hot Vinyasa", style: "Vinyasa", level: "All Levels", duration: 75, capacity: 30, dropInPrice: 3000, isHeated: true, isActive: true, weeklySlots: 2, avgAttendance: 27 },
  { id: "5", name: "Yin Restore", style: "Yin", level: "All Levels", duration: 75, capacity: 20, dropInPrice: 2500, isHeated: false, isActive: true, weeklySlots: 2, avgAttendance: 10 },
  { id: "6", name: "Ashtanga Primary", style: "Ashtanga", level: "Intermediate", duration: 90, capacity: 20, dropInPrice: 3000, isHeated: false, isActive: true, weeklySlots: 2, avgAttendance: 15 },
  { id: "7", name: "Sunrise Meditation", style: "Meditation", level: "All Levels", duration: 45, capacity: 15, dropInPrice: 2000, isHeated: false, isActive: true, weeklySlots: 1, avgAttendance: 10 },
  { id: "8", name: "Restorative", style: "Restorative", level: "All Levels", duration: 90, capacity: 18, dropInPrice: 2500, isHeated: false, isActive: true, weeklySlots: 1, avgAttendance: 16 },
  { id: "9", name: "Prenatal Yoga", style: "Prenatal", level: "All Levels", duration: 60, capacity: 12, dropInPrice: 2500, isHeated: false, isActive: false, weeklySlots: 0, avgAttendance: 0 },
];

export default function OfferingsManage() {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredOfferings = mockOfferings.filter(
    (o) =>
      o.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.style.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeOfferings = filteredOfferings.filter((o) => o.isActive);
  const inactiveOfferings = filteredOfferings.filter((o) => !o.isActive);

  return (
    <ManageLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Offerings</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Class types and their configurations — {mockOfferings.filter(o => o.isActive).length} active
            </p>
          </div>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            New Offering
          </Button>
        </div>

        {/* Search */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search offerings..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Active Offerings */}
        <div className="space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Active Offerings</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeOfferings.map((offering) => (
              <Card key={offering.id} className="hover:border-primary/30 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-semibold">{offering.name}</h3>
                        {offering.isHeated && (
                          <Flame className="h-3.5 w-3.5 text-destructive" />
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">{offering.style}</Badge>
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">{offering.level}</Badge>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40 rounded-xl">
                        <DropdownMenuItem className="rounded-lg cursor-pointer">Edit</DropdownMenuItem>
                        <DropdownMenuItem className="rounded-lg cursor-pointer">Duplicate</DropdownMenuItem>
                        <DropdownMenuItem className="rounded-lg cursor-pointer text-destructive">Deactivate</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-4 pt-3 border-t border-border">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>{offering.duration} min</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Users className="h-3 w-3" />
                      <span>{offering.capacity} spots</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <DollarSign className="h-3 w-3" />
                      <span>${(offering.dropInPrice / 100).toFixed(0)} drop-in</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <span>{offering.weeklySlots}x/week</span>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-border">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Avg attendance</span>
                      <span className="text-xs font-semibold">
                        {offering.avgAttendance}/{offering.capacity}
                        <span className="text-muted-foreground ml-1">
                          ({Math.round((offering.avgAttendance / offering.capacity) * 100)}%)
                        </span>
                      </span>
                    </div>
                    <div className="mt-1.5 h-1.5 bg-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all"
                        style={{ width: `${Math.round((offering.avgAttendance / offering.capacity) * 100)}%` }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Inactive Offerings */}
        {inactiveOfferings.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Inactive</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {inactiveOfferings.map((offering) => (
                <Card key={offering.id} className="opacity-60">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-sm font-semibold">{offering.name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0">{offering.style}</Badge>
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Inactive</Badge>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" className="text-xs">Reactivate</Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </ManageLayout>
  );
}
