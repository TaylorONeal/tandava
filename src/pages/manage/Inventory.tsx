import { useState } from "react";
import { ManageLayout } from "@/components/manage/ManageLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Search,
  Package,
  MapPin,
  MoreHorizontal,
  ArrowRightLeft,
  ClipboardCheck,
  Plus,
  Minus,
  AlertTriangle,
  TrendingDown,
  Download,
  Filter,
  History,
  Warehouse,
  ShoppingBag,
  RefreshCw,
  Check,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface InventoryItem {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  locationId: string;
  locationName: string;
  onHand: number;
  reserved: number;
  available: number;
  lowStockThreshold: number;
  lastCountedAt: string | null;
  lastMovementAt: string;
}

interface InventoryMovement {
  id: string;
  productName: string;
  sku: string;
  type: "adjustment" | "transfer" | "sale" | "receive" | "return" | "count";
  quantity: number;
  fromLocation: string | null;
  toLocation: string | null;
  reason: string;
  performedBy: string;
  createdAt: string;
}

const locations = [
  { id: "loc1", name: "Main Studio - Retail" },
  { id: "loc2", name: "Main Studio - Storage" },
  { id: "loc3", name: "Downtown Location" },
];

const mockInventory: InventoryItem[] = [
  { id: "inv1", productId: "p1", productName: "Manduka PRO Yoga Mat", sku: "MAT-MAND-PRO", locationId: "loc1", locationName: "Main Studio - Retail", onHand: 8, reserved: 2, available: 6, lowStockThreshold: 5, lastCountedAt: "2025-01-15", lastMovementAt: "2025-01-28" },
  { id: "inv2", productId: "p1", productName: "Manduka PRO Yoga Mat", sku: "MAT-MAND-PRO", locationId: "loc2", locationName: "Main Studio - Storage", onHand: 4, reserved: 0, available: 4, lowStockThreshold: 5, lastCountedAt: "2025-01-15", lastMovementAt: "2025-01-20" },
  { id: "inv3", productId: "p2", productName: "Cork Yoga Block (Set of 2)", sku: "BLK-CORK-2PK", locationId: "loc1", locationName: "Main Studio - Retail", onHand: 5, reserved: 1, available: 4, lowStockThreshold: 10, lastCountedAt: "2025-01-15", lastMovementAt: "2025-01-27" },
  { id: "inv4", productId: "p2", productName: "Cork Yoga Block (Set of 2)", sku: "BLK-CORK-2PK", locationId: "loc3", locationName: "Downtown Location", onHand: 3, reserved: 0, available: 3, lowStockThreshold: 5, lastCountedAt: "2025-01-10", lastMovementAt: "2025-01-25" },
  { id: "inv5", productId: "p3", productName: "Essential Oil Blend - Calm", sku: "OIL-ESS-CALM", locationId: "loc1", locationName: "Main Studio - Retail", onHand: 3, reserved: 0, available: 3, lowStockThreshold: 15, lastCountedAt: "2025-01-15", lastMovementAt: "2025-01-29" },
  { id: "inv6", productId: "p4", productName: "Yoga Strap - 8ft Cotton", sku: "STRP-COT-8FT", locationId: "loc1", locationName: "Main Studio - Retail", onHand: 18, reserved: 0, available: 18, lowStockThreshold: 15, lastCountedAt: "2025-01-15", lastMovementAt: "2025-01-22" },
  { id: "inv7", productId: "p4", productName: "Yoga Strap - 8ft Cotton", sku: "STRP-COT-8FT", locationId: "loc3", locationName: "Downtown Location", onHand: 7, reserved: 1, available: 6, lowStockThreshold: 8, lastCountedAt: "2025-01-10", lastMovementAt: "2025-01-28" },
  { id: "inv8", productId: "p5", productName: "Studio Mat Rental", sku: "RENT-MAT-STD", locationId: "loc1", locationName: "Main Studio - Retail", onHand: 15, reserved: 5, available: 10, lowStockThreshold: 5, lastCountedAt: "2025-01-20", lastMovementAt: "2025-01-29" },
  { id: "inv9", productId: "p5", productName: "Studio Mat Rental", sku: "RENT-MAT-STD", locationId: "loc3", locationName: "Downtown Location", onHand: 5, reserved: 2, available: 3, lowStockThreshold: 3, lastCountedAt: "2025-01-18", lastMovementAt: "2025-01-29" },
  { id: "inv10", productId: "p7", productName: "Meditation Cushion - Zafu", sku: "CUSH-ZAFU-RND", locationId: "loc1", locationName: "Main Studio - Retail", onHand: 0, reserved: 0, available: 0, lowStockThreshold: 8, lastCountedAt: "2025-01-15", lastMovementAt: "2025-01-18" },
  { id: "inv11", productId: "p8", productName: "Organic Herbal Tea - Yoga Blend", sku: "TEA-ORG-YOGA", locationId: "loc1", locationName: "Main Studio - Retail", onHand: 30, reserved: 0, available: 30, lowStockThreshold: 20, lastCountedAt: "2025-01-15", lastMovementAt: "2025-01-26" },
  { id: "inv12", productId: "p8", productName: "Organic Herbal Tea - Yoga Blend", sku: "TEA-ORG-YOGA", locationId: "loc3", locationName: "Downtown Location", onHand: 15, reserved: 0, available: 15, lowStockThreshold: 10, lastCountedAt: "2025-01-10", lastMovementAt: "2025-01-24" },
];

const mockMovements: InventoryMovement[] = [
  { id: "m1", productName: "Manduka PRO Yoga Mat", sku: "MAT-MAND-PRO", type: "sale", quantity: -1, fromLocation: "Main Studio - Retail", toLocation: null, reason: "POS Sale #1234", performedBy: "System", createdAt: "2025-01-29T14:30:00" },
  { id: "m2", productName: "Essential Oil Blend - Calm", sku: "OIL-ESS-CALM", type: "sale", quantity: -2, fromLocation: "Main Studio - Retail", toLocation: null, reason: "POS Sale #1233", performedBy: "System", createdAt: "2025-01-29T11:15:00" },
  { id: "m3", productName: "Yoga Strap - 8ft Cotton", sku: "STRP-COT-8FT", type: "transfer", quantity: 5, fromLocation: "Main Studio - Storage", toLocation: "Downtown Location", reason: "Restock downtown", performedBy: "Sarah Chen", createdAt: "2025-01-28T16:45:00" },
  { id: "m4", productName: "Cork Yoga Block (Set of 2)", sku: "BLK-CORK-2PK", type: "receive", quantity: 10, fromLocation: null, toLocation: "Main Studio - Retail", reason: "PO #2024-015 received", performedBy: "James Park", createdAt: "2025-01-27T09:20:00" },
  { id: "m5", productName: "Meditation Cushion - Zafu", sku: "CUSH-ZAFU-RND", type: "sale", quantity: -3, fromLocation: "Main Studio - Retail", toLocation: null, reason: "POS Sale #1230", performedBy: "System", createdAt: "2025-01-18T15:00:00" },
  { id: "m6", productName: "Organic Herbal Tea - Yoga Blend", sku: "TEA-ORG-YOGA", type: "count", quantity: 2, fromLocation: null, toLocation: "Main Studio - Retail", reason: "Inventory count adjustment", performedBy: "Maya Rodriguez", createdAt: "2025-01-15T10:30:00" },
];

const movementTypeColors: Record<string, string> = {
  adjustment: "bg-accent-gold/20 text-accent-gold",
  transfer: "bg-primary/20 text-primary",
  sale: "bg-muted text-muted-foreground",
  receive: "bg-accent-sage/20 text-accent-sage",
  return: "bg-accent-coral/20 text-accent-coral",
  count: "bg-secondary text-foreground",
};

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function InventoryManage() {
  const { toast } = useToast();
  const [inventory, setInventory] = useState(mockInventory);
  const [movements] = useState(mockMovements);
  const [searchQuery, setSearchQuery] = useState("");
  const [locationFilter, setLocationFilter] = useState("all");
  const [stockFilter, setStockFilter] = useState("all");
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const [countOpen, setCountOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [adjustmentAmount, setAdjustmentAmount] = useState(0);
  const [transferQuantity, setTransferQuantity] = useState(1);
  const [transferDestination, setTransferDestination] = useState("");
  const [countQuantity, setCountQuantity] = useState(0);

  const filteredInventory = inventory.filter((item) => {
    const matchesSearch =
      item.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLocation = locationFilter === "all" || item.locationId === locationFilter;
    const isLowStock = item.onHand <= item.lowStockThreshold && item.onHand > 0;
    const isOutOfStock = item.onHand === 0;
    const matchesStockFilter =
      stockFilter === "all" ||
      (stockFilter === "low" && isLowStock) ||
      (stockFilter === "out" && isOutOfStock);
    return matchesSearch && matchesLocation && matchesStockFilter;
  });

  const lowStockItems = inventory.filter(
    (i) => i.onHand <= i.lowStockThreshold && i.onHand > 0
  );
  const outOfStockItems = inventory.filter((i) => i.onHand === 0);
  const totalOnHand = inventory.reduce((sum, i) => sum + i.onHand, 0);
  const totalReserved = inventory.reduce((sum, i) => sum + i.reserved, 0);

  const handleSelectItem = (itemId: string, checked: boolean) => {
    if (checked) {
      setSelectedItems((prev) => [...prev, itemId]);
    } else {
      setSelectedItems((prev) => prev.filter((id) => id !== itemId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedItems(filteredInventory.map((i) => i.id));
    } else {
      setSelectedItems([]);
    }
  };

  const handleAdjust = (item: InventoryItem) => {
    setSelectedItem(item);
    setAdjustmentAmount(0);
    setAdjustOpen(true);
  };

  const handleTransfer = (item: InventoryItem) => {
    setSelectedItem(item);
    setTransferQuantity(1);
    setTransferDestination("");
    setTransferOpen(true);
  };

  const handleCount = (item: InventoryItem) => {
    setSelectedItem(item);
    setCountQuantity(item.onHand);
    setCountOpen(true);
  };

  const confirmAdjust = () => {
    if (selectedItem) {
      setInventory((prev) =>
        prev.map((i) =>
          i.id === selectedItem.id
            ? {
                ...i,
                onHand: Math.max(0, i.onHand + adjustmentAmount),
                available: Math.max(0, i.onHand + adjustmentAmount - i.reserved),
              }
            : i
        )
      );
      toast({
        title: "Stock adjusted",
        description: `${selectedItem.productName} at ${selectedItem.locationName} adjusted by ${adjustmentAmount > 0 ? "+" : ""}${adjustmentAmount}`,
      });
      setAdjustOpen(false);
    }
  };

  const confirmTransfer = () => {
    if (selectedItem && transferDestination) {
      const destLocation = locations.find((l) => l.id === transferDestination);
      setInventory((prev) =>
        prev.map((i) => {
          if (i.id === selectedItem.id) {
            return {
              ...i,
              onHand: Math.max(0, i.onHand - transferQuantity),
              available: Math.max(0, i.available - transferQuantity),
            };
          }
          if (i.productId === selectedItem.productId && i.locationId === transferDestination) {
            return {
              ...i,
              onHand: i.onHand + transferQuantity,
              available: i.available + transferQuantity,
            };
          }
          return i;
        })
      );
      toast({
        title: "Transfer complete",
        description: `${transferQuantity}x ${selectedItem.productName} transferred to ${destLocation?.name}`,
      });
      setTransferOpen(false);
    }
  };

  const confirmCount = () => {
    if (selectedItem) {
      const diff = countQuantity - selectedItem.onHand;
      setInventory((prev) =>
        prev.map((i) =>
          i.id === selectedItem.id
            ? {
                ...i,
                onHand: countQuantity,
                available: Math.max(0, countQuantity - i.reserved),
                lastCountedAt: new Date().toISOString().split("T")[0],
              }
            : i
        )
      );
      toast({
        title: "Count recorded",
        description: `${selectedItem.productName} count updated${diff !== 0 ? ` (${diff > 0 ? "+" : ""}${diff} variance)` : ""}`,
      });
      setCountOpen(false);
    }
  };

  return (
    <ManageLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Inventory</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {totalOnHand} total units across {locations.length} locations
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Full Count
            </Button>
          </div>
        </div>

        {/* Low Stock Alerts */}
        {(lowStockItems.length > 0 || outOfStockItems.length > 0) && (
          <Card className="border-accent-gold/50 bg-accent-gold/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2 text-accent-gold">
                <AlertTriangle className="h-4 w-4" />
                Stock Alerts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {outOfStockItems.map((item) => (
                  <Badge
                    key={item.id}
                    variant="outline"
                    className="bg-destructive/10 border-destructive/30 text-destructive"
                  >
                    {item.productName} @ {item.locationName} - Out of stock
                  </Badge>
                ))}
                {lowStockItems.map((item) => (
                  <Badge
                    key={item.id}
                    variant="outline"
                    className="bg-accent-gold/10 border-accent-gold/30 text-accent-gold"
                  >
                    {item.productName} @ {item.locationName} - {item.onHand} left (low)
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Total On Hand</p>
                  <p className="text-xl font-bold mt-0.5">{totalOnHand}</p>
                </div>
                <Package className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Reserved</p>
                  <p className="text-xl font-bold mt-0.5">{totalReserved}</p>
                </div>
                <ShoppingBag className="h-5 w-5 text-primary" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Low Stock Items</p>
                  <p className="text-xl font-bold mt-0.5 text-accent-gold">
                    {lowStockItems.length}
                  </p>
                </div>
                <TrendingDown className="h-5 w-5 text-accent-gold" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Out of Stock</p>
                  <p className="text-xl font-bold mt-0.5 text-destructive">
                    {outOfStockItems.length}
                  </p>
                </div>
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={locationFilter} onValueChange={setLocationFilter}>
            <SelectTrigger className="w-48">
              <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
              <SelectValue placeholder="All Locations" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Locations</SelectItem>
              {locations.map((loc) => (
                <SelectItem key={loc.id} value={loc.id}>
                  {loc.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={stockFilter} onValueChange={setStockFilter}>
            <SelectTrigger className="w-40">
              <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
              <SelectValue placeholder="Stock Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Stock Levels</SelectItem>
              <SelectItem value="low">Low Stock Only</SelectItem>
              <SelectItem value="out">Out of Stock Only</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Bulk Actions */}
        {selectedItems.length > 0 && (
          <div className="flex items-center gap-3 p-3 rounded-xl bg-primary/5 border border-primary/20">
            <span className="text-sm font-medium">{selectedItems.length} selected</span>
            <Button variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Bulk Adjust
            </Button>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-1" />
              Export Selected
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="ml-auto"
              onClick={() => setSelectedItems([])}
            >
              Clear Selection
            </Button>
          </div>
        )}

        {/* Inventory Table */}
        <Card>
          <CardContent className="p-0">
            {/* Table Header */}
            <div className="hidden md:grid grid-cols-[auto,2fr,1fr,1fr,1fr,1fr,1fr,auto] gap-4 px-4 py-3 border-b border-border text-xs font-medium text-muted-foreground uppercase tracking-wider items-center">
              <Checkbox
                checked={
                  selectedItems.length === filteredInventory.length &&
                  filteredInventory.length > 0
                }
                onCheckedChange={handleSelectAll}
              />
              <span>Product</span>
              <span>Location</span>
              <span>On Hand</span>
              <span>Reserved</span>
              <span>Available</span>
              <span>Status</span>
              <span></span>
            </div>

            {/* Inventory Rows */}
            {filteredInventory.map((item) => {
              const isLowStock = item.onHand <= item.lowStockThreshold && item.onHand > 0;
              const isOutOfStock = item.onHand === 0;

              return (
                <div
                  key={item.id}
                  className="grid md:grid-cols-[auto,2fr,1fr,1fr,1fr,1fr,1fr,auto] gap-4 px-4 py-3 border-b border-border last:border-0 items-center hover:bg-secondary/30 transition-colors"
                >
                  <Checkbox
                    checked={selectedItems.includes(item.id)}
                    onCheckedChange={(checked) =>
                      handleSelectItem(item.id, checked as boolean)
                    }
                  />
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-secondary/50 flex items-center justify-center shrink-0">
                      <Package className="h-4 w-4 text-muted-foreground/50" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{item.productName}</p>
                      <p className="text-xs text-muted-foreground">{item.sku}</p>
                    </div>
                  </div>
                  <div className="hidden md:flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-sm truncate">{item.locationName}</span>
                  </div>
                  <div className="hidden md:block">
                    <p
                      className={`text-sm font-semibold ${
                        isOutOfStock
                          ? "text-destructive"
                          : isLowStock
                          ? "text-accent-gold"
                          : ""
                      }`}
                    >
                      {item.onHand}
                    </p>
                  </div>
                  <div className="hidden md:block">
                    <p className="text-sm text-muted-foreground">{item.reserved}</p>
                  </div>
                  <div className="hidden md:block">
                    <p className="text-sm font-medium">{item.available}</p>
                  </div>
                  <div className="hidden md:block">
                    {isOutOfStock ? (
                      <Badge className="text-[10px] bg-destructive/20 text-destructive">
                        Out of Stock
                      </Badge>
                    ) : isLowStock ? (
                      <Badge className="text-[10px] bg-accent-gold/20 text-accent-gold">
                        Low Stock
                      </Badge>
                    ) : (
                      <Badge className="text-[10px] bg-accent-sage/20 text-accent-sage">
                        In Stock
                      </Badge>
                    )}
                  </div>
                  <div className="hidden md:block">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-44 rounded-xl">
                        <DropdownMenuItem
                          className="rounded-lg cursor-pointer"
                          onClick={() => handleAdjust(item)}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Adjust Stock
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="rounded-lg cursor-pointer"
                          onClick={() => handleTransfer(item)}
                        >
                          <ArrowRightLeft className="h-4 w-4 mr-2" />
                          Transfer
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="rounded-lg cursor-pointer"
                          onClick={() => handleCount(item)}
                        >
                          <ClipboardCheck className="h-4 w-4 mr-2" />
                          Count
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="rounded-lg cursor-pointer">
                          <History className="h-4 w-4 mr-2" />
                          View History
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Recent Movements */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <History className="h-5 w-5 text-muted-foreground" />
              Recent Movements
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {movements.map((movement) => (
              <div
                key={movement.id}
                className="flex items-center justify-between p-3 rounded-xl bg-secondary/30"
              >
                <div className="flex items-center gap-3">
                  <Badge className={`text-[10px] ${movementTypeColors[movement.type]}`}>
                    {movement.type}
                  </Badge>
                  <div>
                    <p className="text-sm font-medium">{movement.productName}</p>
                    <p className="text-xs text-muted-foreground">
                      {movement.reason} — {movement.performedBy}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p
                    className={`text-sm font-semibold ${
                      movement.quantity > 0 ? "text-accent-sage" : "text-muted-foreground"
                    }`}
                  >
                    {movement.quantity > 0 ? "+" : ""}
                    {movement.quantity}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDateTime(movement.createdAt)}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Adjust Stock Dialog */}
        <Dialog open={adjustOpen} onOpenChange={setAdjustOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Adjust Stock</DialogTitle>
              <DialogDescription>
                {selectedItem?.productName} at {selectedItem?.locationName}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="flex items-center justify-center gap-6">
                <div className="text-center">
                  <p className="text-xs text-muted-foreground mb-1">Current</p>
                  <p className="text-2xl font-bold">{selectedItem?.onHand ?? 0}</p>
                </div>
                <div className="text-2xl text-muted-foreground">→</div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground mb-1">New</p>
                  <p className="text-2xl font-bold">
                    {Math.max(0, (selectedItem?.onHand ?? 0) + adjustmentAmount)}
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Adjustment</Label>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setAdjustmentAmount((prev) => prev - 1)}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <Input
                    type="number"
                    value={adjustmentAmount}
                    onChange={(e) => setAdjustmentAmount(parseInt(e.target.value) || 0)}
                    className="text-center"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setAdjustmentAmount((prev) => prev + 1)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Reason</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select reason..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="received">Received shipment</SelectItem>
                    <SelectItem value="damaged">Damaged/Defective</SelectItem>
                    <SelectItem value="returned">Customer return</SelectItem>
                    <SelectItem value="correction">Correction</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAdjustOpen(false)}>
                Cancel
              </Button>
              <Button onClick={confirmAdjust}>Confirm</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Transfer Dialog */}
        <Dialog open={transferOpen} onOpenChange={setTransferOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Transfer Stock</DialogTitle>
              <DialogDescription>
                Move {selectedItem?.productName} from {selectedItem?.locationName}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Quantity to Transfer</Label>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setTransferQuantity((prev) => Math.max(1, prev - 1))}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <Input
                    type="number"
                    min="1"
                    max={selectedItem?.available ?? 1}
                    value={transferQuantity}
                    onChange={(e) =>
                      setTransferQuantity(
                        Math.min(
                          selectedItem?.available ?? 1,
                          Math.max(1, parseInt(e.target.value) || 1)
                        )
                      )
                    }
                    className="text-center"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() =>
                      setTransferQuantity((prev) =>
                        Math.min(selectedItem?.available ?? prev, prev + 1)
                      )
                    }
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  {selectedItem?.available} available to transfer
                </p>
              </div>
              <div className="space-y-2">
                <Label>Destination Location</Label>
                <Select value={transferDestination} onValueChange={setTransferDestination}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select destination..." />
                  </SelectTrigger>
                  <SelectContent>
                    {locations
                      .filter((loc) => loc.id !== selectedItem?.locationId)
                      .map((loc) => (
                        <SelectItem key={loc.id} value={loc.id}>
                          {loc.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setTransferOpen(false)}>
                Cancel
              </Button>
              <Button onClick={confirmTransfer} disabled={!transferDestination}>
                <ArrowRightLeft className="h-4 w-4 mr-2" />
                Transfer
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Count Dialog */}
        <Dialog open={countOpen} onOpenChange={setCountOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Record Count</DialogTitle>
              <DialogDescription>
                {selectedItem?.productName} at {selectedItem?.locationName}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="flex items-center justify-center gap-6">
                <div className="text-center">
                  <p className="text-xs text-muted-foreground mb-1">System Count</p>
                  <p className="text-2xl font-bold text-muted-foreground">
                    {selectedItem?.onHand ?? 0}
                  </p>
                </div>
                <div className="text-2xl text-muted-foreground">vs</div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground mb-1">Physical Count</p>
                  <p className="text-2xl font-bold">{countQuantity}</p>
                </div>
              </div>
              {countQuantity !== (selectedItem?.onHand ?? 0) && (
                <div className="text-center p-2 rounded-lg bg-accent-gold/10">
                  <p className="text-sm text-accent-gold">
                    Variance: {countQuantity - (selectedItem?.onHand ?? 0) > 0 ? "+" : ""}
                    {countQuantity - (selectedItem?.onHand ?? 0)}
                  </p>
                </div>
              )}
              <div className="space-y-2">
                <Label>Physical Count</Label>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setCountQuantity((prev) => Math.max(0, prev - 1))}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <Input
                    type="number"
                    min="0"
                    value={countQuantity}
                    onChange={(e) => setCountQuantity(Math.max(0, parseInt(e.target.value) || 0))}
                    className="text-center"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setCountQuantity((prev) => prev + 1)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCountOpen(false)}>
                Cancel
              </Button>
              <Button onClick={confirmCount}>
                <Check className="h-4 w-4 mr-2" />
                Record Count
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </ManageLayout>
  );
}
