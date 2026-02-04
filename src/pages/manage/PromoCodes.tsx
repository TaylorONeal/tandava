import { useState } from "react";
import { ManageLayout } from "@/components/manage/ManageLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import {
  Tag,
  Plus,
  Copy,
  MoreHorizontal,
  Search,
  Percent,
  DollarSign,
  Gift,
  Users,
  Calendar,
  TrendingUp,
  Trash2,
  Pause,
  Play,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PromoCodeRow {
  id: string;
  code: string;
  name: string;
  discountType: "percentage" | "fixed_amount" | "free_classes";
  discountValue: number;
  status: "active" | "scheduled" | "expired" | "disabled";
  appliesTo: string[];
  newStudentsOnly: boolean;
  currentUses: number;
  maxUses: number | null;
  startsAt: string;
  expiresAt: string | null;
  revenue: number; // total revenue attributed to this promo
}

const mockPromos: PromoCodeRow[] = [
  {
    id: "p1", code: "WELCOME20", name: "New Student Welcome",
    discountType: "percentage", discountValue: 20,
    status: "active", appliesTo: ["membership", "class_pack"],
    newStudentsOnly: true, currentUses: 47, maxUses: null,
    startsAt: "2025-01-01", expiresAt: null, revenue: 6580,
  },
  {
    id: "p2", code: "SUMMER10", name: "Summer Sale",
    discountType: "fixed_amount", discountValue: 1000,
    status: "active", appliesTo: ["membership"],
    newStudentsOnly: false, currentUses: 23, maxUses: 100,
    startsAt: "2025-06-01", expiresAt: "2025-08-31", revenue: 3220,
  },
  {
    id: "p3", code: "FRIEND15", name: "Refer a Friend",
    discountType: "percentage", discountValue: 15,
    status: "active", appliesTo: ["drop_in", "class_pack"],
    newStudentsOnly: false, currentUses: 89, maxUses: null,
    startsAt: "2025-01-15", expiresAt: null, revenue: 8940,
  },
  {
    id: "p4", code: "BOGO2024", name: "Holiday BOGO",
    discountType: "free_classes", discountValue: 1,
    status: "expired", appliesTo: ["drop_in"],
    newStudentsOnly: false, currentUses: 156, maxUses: 200,
    startsAt: "2024-12-20", expiresAt: "2025-01-05", revenue: 3900,
  },
  {
    id: "p5", code: "TEACHER25", name: "Teacher Appreciation",
    discountType: "percentage", discountValue: 25,
    status: "disabled", appliesTo: ["membership", "class_pack", "drop_in"],
    newStudentsOnly: false, currentUses: 12, maxUses: 50,
    startsAt: "2025-03-01", expiresAt: "2025-03-31", revenue: 1440,
  },
];

function formatDiscount(type: string, value: number): string {
  if (type === "percentage") return `${value}% off`;
  if (type === "fixed_amount") return `$${(value / 100).toFixed(0)} off`;
  if (type === "free_classes") return `${value} free class${value > 1 ? "es" : ""}`;
  return "";
}

const statusColor: Record<string, string> = {
  active: "bg-accent-sage/20 text-accent-sage",
  scheduled: "bg-primary/20 text-primary",
  expired: "bg-muted text-muted-foreground",
  disabled: "bg-destructive/20 text-destructive",
};

export default function PromoCodesManage() {
  const { toast } = useToast();
  const [promos] = useState(mockPromos);
  const [searchQuery, setSearchQuery] = useState("");
  const [createOpen, setCreateOpen] = useState(false);

  // New promo form state
  const [newCode, setNewCode] = useState("");
  const [newName, setNewName] = useState("");
  const [newDiscountType, setNewDiscountType] = useState<string>("percentage");
  const [newDiscountValue, setNewDiscountValue] = useState("");
  const [newMaxUses, setNewMaxUses] = useState("");
  const [newStudentsOnly, setNewStudentsOnly] = useState(false);
  const [newExpiresAt, setNewExpiresAt] = useState("");

  const filteredPromos = promos.filter((p) =>
    p.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalRevenue = promos.reduce((sum, p) => sum + p.revenue, 0);
  const totalRedemptions = promos.reduce((sum, p) => sum + p.currentUses, 0);
  const activeCount = promos.filter((p) => p.status === "active").length;

  const handleCreate = () => {
    toast({ title: "Promo code created", description: `${newCode} is now active.` });
    setCreateOpen(false);
    setNewCode("");
    setNewName("");
    setNewDiscountValue("");
    setNewMaxUses("");
    setNewExpiresAt("");
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard?.writeText(code);
    toast({ title: "Copied", description: `${code} copied to clipboard.` });
  };

  return (
    <ManageLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Promo Codes</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Manage discounts, intro offers, and promotional campaigns
            </p>
          </div>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Promo
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Active Promos", value: activeCount, icon: Tag },
            { label: "Total Redemptions", value: totalRedemptions, icon: Users },
            { label: "Revenue Attributed", value: `$${(totalRevenue / 100).toLocaleString()}`, icon: TrendingUp },
            { label: "Avg Redemptions", value: Math.round(totalRedemptions / promos.length), icon: Percent },
          ].map((stat) => (
            <Card key={stat.label}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                    <p className="text-xl font-bold mt-0.5">{stat.value}</p>
                  </div>
                  <stat.icon className="h-5 w-5 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Search */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search promo codes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Promo List */}
        <div className="space-y-3">
          {filteredPromos.map((promo) => (
            <Card key={promo.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      {promo.discountType === "percentage" && <Percent className="h-5 w-5 text-primary" />}
                      {promo.discountType === "fixed_amount" && <DollarSign className="h-5 w-5 text-primary" />}
                      {promo.discountType === "free_classes" && <Gift className="h-5 w-5 text-primary" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-semibold">{promo.name}</h3>
                        <Badge className={`text-[10px] ${statusColor[promo.status]}`}>
                          {promo.status}
                        </Badge>
                        {promo.newStudentsOnly && (
                          <Badge variant="outline" className="text-[10px]">New students only</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <code className="text-xs font-mono bg-secondary px-2 py-0.5 rounded-md">{promo.code}</code>
                        <button
                          onClick={() => handleCopyCode(promo.code)}
                          className="text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <Copy className="h-3 w-3" />
                        </button>
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span className="font-medium text-foreground">{formatDiscount(promo.discountType, promo.discountValue)}</span>
                        <span>{promo.currentUses}{promo.maxUses ? `/${promo.maxUses}` : ""} uses</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {promo.expiresAt ? `Expires ${promo.expiresAt}` : "No expiry"}
                        </span>
                        <span>Applies to: {promo.appliesTo.join(", ")}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    {promo.status === "active" ? (
                      <Button variant="ghost" size="icon" className="h-8 w-8" title="Disable">
                        <Pause className="h-3.5 w-3.5" />
                      </Button>
                    ) : promo.status === "disabled" ? (
                      <Button variant="ghost" size="icon" className="h-8 w-8" title="Enable">
                        <Play className="h-3.5 w-3.5" />
                      </Button>
                    ) : null}
                    <Button variant="ghost" size="icon" className="h-8 w-8" title="Delete">
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Create Dialog */}
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Create Promo Code</DialogTitle>
              <DialogDescription>
                Create a discount code students can apply at checkout
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="promoCode">Code</Label>
                  <Input
                    id="promoCode"
                    placeholder="e.g. WELCOME20"
                    value={newCode}
                    onChange={(e) => setNewCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))}
                    className="font-mono uppercase"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="promoName">Display Name</Label>
                  <Input
                    id="promoName"
                    placeholder="e.g. New Student Welcome"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Discount Type</Label>
                  <Select value={newDiscountType} onValueChange={setNewDiscountType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Percentage Off</SelectItem>
                      <SelectItem value="fixed_amount">Fixed Amount Off</SelectItem>
                      <SelectItem value="free_classes">Free Classes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="discountVal">
                    {newDiscountType === "percentage" ? "Percentage" :
                     newDiscountType === "fixed_amount" ? "Amount ($)" : "Classes"}
                  </Label>
                  <Input
                    id="discountVal"
                    type="number"
                    placeholder={newDiscountType === "percentage" ? "20" : "10"}
                    value={newDiscountValue}
                    onChange={(e) => setNewDiscountValue(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="maxUses">Max Total Uses</Label>
                  <Input
                    id="maxUses"
                    type="number"
                    placeholder="Unlimited"
                    value={newMaxUses}
                    onChange={(e) => setNewMaxUses(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expiresAt">Expires</Label>
                  <Input
                    id="expiresAt"
                    type="date"
                    value={newExpiresAt}
                    onChange={(e) => setNewExpiresAt(e.target.value)}
                  />
                </div>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">New students only</p>
                  <p className="text-xs text-muted-foreground">Only students who haven't booked before</p>
                </div>
                <Switch checked={newStudentsOnly} onCheckedChange={setNewStudentsOnly} />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
              <Button onClick={handleCreate} disabled={!newCode || !newName || !newDiscountValue}>
                Create Promo Code
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </ManageLayout>
  );
}
