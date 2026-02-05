import { useState } from "react";
import { ManageLayout } from "@/components/manage/ManageLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Users,
  Plus,
  Search,
  Filter,
  RefreshCw,
  MoreVertical,
  Pencil,
  Copy,
  Trash2,
  UserPlus,
  TrendingUp,
  Clock,
  Tag,
  DollarSign,
  Calendar,
  Zap,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

// Mock segments data
const mockSegments = [
  {
    id: "1",
    name: "Active Members",
    description: "Members with active unlimited or class pack membership",
    filters: { membership_status: ["active"] },
    member_count: 847,
    is_dynamic: true,
    last_calculated_at: "2025-01-15T10:30:00Z",
    created_at: "2024-06-01T00:00:00Z",
  },
  {
    id: "2",
    name: "At-Risk Members",
    description: "Haven't visited in 14+ days with active membership",
    filters: { membership_status: ["active"], last_visit: { operator: "more_than", days: 14 } },
    member_count: 123,
    is_dynamic: true,
    last_calculated_at: "2025-01-15T10:30:00Z",
    created_at: "2024-08-15T00:00:00Z",
  },
  {
    id: "3",
    name: "VIP Members",
    description: "Lifetime value over $2,000",
    filters: { lifetime_value: { operator: ">=", value: 2000 } },
    member_count: 156,
    is_dynamic: true,
    last_calculated_at: "2025-01-15T10:30:00Z",
    created_at: "2024-09-01T00:00:00Z",
  },
  {
    id: "4",
    name: "New This Month",
    description: "Members who joined in the last 30 days",
    filters: { joined: { operator: "within", days: 30 } },
    member_count: 42,
    is_dynamic: true,
    last_calculated_at: "2025-01-15T10:30:00Z",
    created_at: "2024-10-01T00:00:00Z",
  },
  {
    id: "5",
    name: "Yoga Enthusiasts",
    description: "Members tagged with yoga-related interests",
    filters: { tags: ["yoga", "yoga-lover", "vinyasa"] },
    member_count: 312,
    is_dynamic: true,
    last_calculated_at: "2025-01-15T10:30:00Z",
    created_at: "2024-07-20T00:00:00Z",
  },
  {
    id: "6",
    name: "Expired - Winback",
    description: "Members whose membership expired in last 90 days",
    filters: { membership_status: ["expired"], expired_within_days: 90 },
    member_count: 89,
    is_dynamic: true,
    last_calculated_at: "2025-01-15T10:30:00Z",
    created_at: "2024-11-01T00:00:00Z",
  },
];

const filterTypes = [
  { id: "membership_status", label: "Membership Status", icon: Tag },
  { id: "membership_type", label: "Membership Type", icon: Users },
  { id: "last_visit", label: "Last Visit", icon: Calendar },
  { id: "total_visits", label: "Total Visits", icon: TrendingUp },
  { id: "lifetime_value", label: "Lifetime Value", icon: DollarSign },
  { id: "tags", label: "Member Tags", icon: Tag },
  { id: "joined", label: "Join Date", icon: Clock },
];

export default function AudienceSegments() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedSegment, setSelectedSegment] = useState<typeof mockSegments[0] | null>(null);

  // New segment form state
  const [newSegment, setNewSegment] = useState({
    name: "",
    description: "",
    is_dynamic: true,
    filters: [] as { type: string; operator: string; value: string }[],
  });

  const filteredSegments = mockSegments.filter(
    (seg) =>
      seg.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      seg.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleRefreshCount = (segmentId: string) => {
    toast({
      title: "Refreshing segment",
      description: "Member count is being recalculated...",
    });
  };

  const handleDuplicate = (segment: typeof mockSegments[0]) => {
    toast({
      title: "Segment duplicated",
      description: `"${segment.name} (Copy)" has been created.`,
    });
  };

  const handleDelete = (segment: typeof mockSegments[0]) => {
    toast({
      title: "Segment deleted",
      description: `"${segment.name}" has been removed.`,
      variant: "destructive",
    });
  };

  const addFilter = () => {
    setNewSegment((prev) => ({
      ...prev,
      filters: [...prev.filters, { type: "", operator: "", value: "" }],
    }));
  };

  const removeFilter = (index: number) => {
    setNewSegment((prev) => ({
      ...prev,
      filters: prev.filters.filter((_, i) => i !== index),
    }));
  };

  const handleCreateSegment = () => {
    toast({
      title: "Segment created",
      description: `"${newSegment.name}" has been created with ${newSegment.filters.length} filter(s).`,
    });
    setIsCreateOpen(false);
    setNewSegment({ name: "", description: "", is_dynamic: true, filters: [] });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getFilterSummary = (filters: Record<string, unknown>) => {
    const parts: string[] = [];
    if (filters.membership_status) parts.push(`Status: ${(filters.membership_status as string[]).join(", ")}`);
    if (filters.last_visit) parts.push(`Last visit: ${(filters.last_visit as { days: number }).days}+ days`);
    if (filters.lifetime_value) parts.push(`LTV: $${(filters.lifetime_value as { value: number }).value}+`);
    if (filters.tags) parts.push(`Tags: ${(filters.tags as string[]).slice(0, 2).join(", ")}${(filters.tags as string[]).length > 2 ? "..." : ""}`);
    return parts.length > 0 ? parts.join(" · ") : "No filters";
  };

  return (
    <ManageLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Audience Segments</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Create and manage member segments for targeted campaigns
            </p>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Segment
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Create Audience Segment</DialogTitle>
                <DialogDescription>
                  Define filters to create a dynamic or static member segment
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Segment Name</Label>
                  <Input
                    id="name"
                    placeholder="e.g., VIP Members, At-Risk, New This Month"
                    value={newSegment.name}
                    onChange={(e) => setNewSegment((p) => ({ ...p, name: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    placeholder="Brief description of this segment"
                    value={newSegment.description}
                    onChange={(e) => setNewSegment((p) => ({ ...p, description: e.target.value }))}
                  />
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                  <div>
                    <p className="font-medium text-sm">Dynamic Segment</p>
                    <p className="text-xs text-muted-foreground">
                      Automatically updates as members match filters
                    </p>
                  </div>
                  <Switch
                    checked={newSegment.is_dynamic}
                    onCheckedChange={(v) => setNewSegment((p) => ({ ...p, is_dynamic: v }))}
                  />
                </div>

                {/* Filters */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Filters</Label>
                    <Button variant="outline" size="sm" onClick={addFilter}>
                      <Plus className="h-3 w-3 mr-1" />
                      Add Filter
                    </Button>
                  </div>

                  {newSegment.filters.length === 0 ? (
                    <div className="text-center py-6 text-muted-foreground border border-dashed rounded-lg">
                      <Filter className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No filters added yet</p>
                      <p className="text-xs">Click "Add Filter" to define segment criteria</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {newSegment.filters.map((filter, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-2 p-3 rounded-lg border bg-background"
                        >
                          <Select
                            value={filter.type}
                            onValueChange={(v) => {
                              const updated = [...newSegment.filters];
                              updated[index].type = v;
                              setNewSegment((p) => ({ ...p, filters: updated }));
                            }}
                          >
                            <SelectTrigger className="w-[160px]">
                              <SelectValue placeholder="Filter type" />
                            </SelectTrigger>
                            <SelectContent>
                              {filterTypes.map((ft) => (
                                <SelectItem key={ft.id} value={ft.id}>
                                  {ft.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>

                          <Select
                            value={filter.operator}
                            onValueChange={(v) => {
                              const updated = [...newSegment.filters];
                              updated[index].operator = v;
                              setNewSegment((p) => ({ ...p, filters: updated }));
                            }}
                          >
                            <SelectTrigger className="w-[120px]">
                              <SelectValue placeholder="Operator" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="equals">equals</SelectItem>
                              <SelectItem value="not_equals">not equals</SelectItem>
                              <SelectItem value="greater_than">greater than</SelectItem>
                              <SelectItem value="less_than">less than</SelectItem>
                              <SelectItem value="contains">contains</SelectItem>
                              <SelectItem value="within">within</SelectItem>
                            </SelectContent>
                          </Select>

                          <Input
                            className="flex-1"
                            placeholder="Value"
                            value={filter.value}
                            onChange={(e) => {
                              const updated = [...newSegment.filters];
                              updated[index].value = e.target.value;
                              setNewSegment((p) => ({ ...p, filters: updated }));
                            }}
                          />

                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeFilter(index)}
                          >
                            <Trash2 className="h-4 w-4 text-muted-foreground" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateSegment} disabled={!newSegment.name}>
                  Create Segment
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{mockSegments.length}</p>
                  <p className="text-xs text-muted-foreground">Total Segments</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-accent-sage/20 flex items-center justify-center">
                  <Zap className="h-5 w-5 text-accent-sage" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {mockSegments.filter((s) => s.is_dynamic).length}
                  </p>
                  <p className="text-xs text-muted-foreground">Dynamic</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-accent-lilac/30 flex items-center justify-center">
                  <UserPlus className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {mockSegments.reduce((sum, s) => sum + s.member_count, 0).toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground">Total Reach</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">847</p>
                  <p className="text-xs text-muted-foreground">Largest Segment</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search segments..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Segments Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Segment</TableHead>
                  <TableHead>Filters</TableHead>
                  <TableHead className="text-right">Members</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Last Updated</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSegments.map((segment) => (
                  <TableRow key={segment.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{segment.name}</p>
                        <p className="text-xs text-muted-foreground">{segment.description}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm text-muted-foreground">
                        {getFilterSummary(segment.filters)}
                      </p>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="font-semibold">{segment.member_count.toLocaleString()}</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={segment.is_dynamic ? "default" : "secondary"}>
                        {segment.is_dynamic ? "Dynamic" : "Static"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(segment.last_calculated_at)}
                      </p>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setSelectedSegment(segment)}>
                            <Pencil className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleRefreshCount(segment.id)}>
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Refresh Count
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDuplicate(segment)}>
                            <Copy className="h-4 w-4 mr-2" />
                            Duplicate
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => handleDelete(segment)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Tips Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Segmentation Best Practices</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span><strong>At-Risk:</strong> Target members who haven't visited in 14+ days with re-engagement campaigns</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span><strong>VIP:</strong> Create exclusive offers for high-value members (LTV &gt; $1,000)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span><strong>New Members:</strong> Send welcome series to members in their first 30 days</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span><strong>Winback:</strong> Target expired members within 90 days for return offers</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </ManageLayout>
  );
}
