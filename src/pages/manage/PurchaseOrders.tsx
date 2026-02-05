import { useState } from "react";
import { ManageLayout } from "@/components/manage/ManageLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
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
  Plus,
  MoreHorizontal,
  FileText,
  Package,
  Truck,
  CheckCircle2,
  XCircle,
  Clock,
  Building2,
  Calendar,
  DollarSign,
  ChevronRight,
  Trash2,
  Eye,
  PackageCheck,
  Send,
  Download,
  Filter,
  AlertCircle,
  X,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Vendor {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  leadTimeDays: number;
}

interface POLineItem {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  quantityOrdered: number;
  quantityReceived: number;
  unitCost: number;
  totalCost: number;
}

interface PurchaseOrder {
  id: string;
  poNumber: string;
  vendorId: string;
  vendorName: string;
  status: "draft" | "submitted" | "confirmed" | "shipped" | "partial" | "received" | "cancelled";
  lineItems: POLineItem[];
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  notes: string;
  expectedDate: string | null;
  createdAt: string;
  submittedAt: string | null;
  receivedAt: string | null;
}

const vendors: Vendor[] = [
  { id: "v1", name: "Manduka Wholesale", email: "orders@manduka.com", phone: "+1 800-555-0100", address: "1234 Yoga Way, Los Angeles, CA 90001", leadTimeDays: 7 },
  { id: "v2", name: "Gaiam Direct", email: "wholesale@gaiam.com", phone: "+1 800-555-0101", address: "5678 Wellness Blvd, Boulder, CO 80301", leadTimeDays: 5 },
  { id: "v3", name: "YogaAccessories.com", email: "b2b@yogaaccessories.com", phone: "+1 800-555-0102", address: "910 Props Lane, Austin, TX 78701", leadTimeDays: 3 },
  { id: "v4", name: "Essential Oils Co", email: "orders@essentialoilsco.com", phone: "+1 800-555-0103", address: "2468 Aromatherapy Dr, Portland, OR 97201", leadTimeDays: 4 },
];

const availableProducts = [
  { id: "p1", name: "Manduka PRO Yoga Mat", sku: "MAT-MAND-PRO", cost: 7200 },
  { id: "p2", name: "Cork Yoga Block (Set of 2)", sku: "BLK-CORK-2PK", cost: 1800 },
  { id: "p3", name: "Essential Oil Blend - Calm", sku: "OIL-ESS-CALM", cost: 850 },
  { id: "p4", name: "Yoga Strap - 8ft Cotton", sku: "STRP-COT-8FT", cost: 600 },
  { id: "p7", name: "Meditation Cushion - Zafu", sku: "CUSH-ZAFU-RND", cost: 2800 },
  { id: "p8", name: "Organic Herbal Tea - Yoga Blend", sku: "TEA-ORG-YOGA", cost: 450 },
];

const mockPurchaseOrders: PurchaseOrder[] = [
  {
    id: "po1",
    poNumber: "PO-2025-001",
    vendorId: "v1",
    vendorName: "Manduka Wholesale",
    status: "partial",
    lineItems: [
      { id: "li1", productId: "p1", productName: "Manduka PRO Yoga Mat", sku: "MAT-MAND-PRO", quantityOrdered: 20, quantityReceived: 12, unitCost: 7200, totalCost: 144000 },
      { id: "li2", productId: "p7", productName: "Meditation Cushion - Zafu", sku: "CUSH-ZAFU-RND", quantityOrdered: 15, quantityReceived: 0, unitCost: 2800, totalCost: 42000 },
    ],
    subtotal: 186000,
    shipping: 2500,
    tax: 0,
    total: 188500,
    notes: "Rush order for spring inventory",
    expectedDate: "2025-02-05",
    createdAt: "2025-01-20T10:00:00",
    submittedAt: "2025-01-20T10:30:00",
    receivedAt: null,
  },
  {
    id: "po2",
    poNumber: "PO-2025-002",
    vendorId: "v3",
    vendorName: "YogaAccessories.com",
    status: "shipped",
    lineItems: [
      { id: "li3", productId: "p2", productName: "Cork Yoga Block (Set of 2)", sku: "BLK-CORK-2PK", quantityOrdered: 30, quantityReceived: 0, unitCost: 1800, totalCost: 54000 },
      { id: "li4", productId: "p4", productName: "Yoga Strap - 8ft Cotton", sku: "STRP-COT-8FT", quantityOrdered: 50, quantityReceived: 0, unitCost: 600, totalCost: 30000 },
    ],
    subtotal: 84000,
    shipping: 1500,
    tax: 0,
    total: 85500,
    notes: "",
    expectedDate: "2025-01-30",
    createdAt: "2025-01-22T14:00:00",
    submittedAt: "2025-01-22T14:15:00",
    receivedAt: null,
  },
  {
    id: "po3",
    poNumber: "PO-2025-003",
    vendorId: "v4",
    vendorName: "Essential Oils Co",
    status: "received",
    lineItems: [
      { id: "li5", productId: "p3", productName: "Essential Oil Blend - Calm", sku: "OIL-ESS-CALM", quantityOrdered: 24, quantityReceived: 24, unitCost: 850, totalCost: 20400 },
    ],
    subtotal: 20400,
    shipping: 800,
    tax: 0,
    total: 21200,
    notes: "Monthly reorder",
    expectedDate: "2025-01-25",
    createdAt: "2025-01-18T09:00:00",
    submittedAt: "2025-01-18T09:10:00",
    receivedAt: "2025-01-24T11:30:00",
  },
  {
    id: "po4",
    poNumber: "PO-2025-004",
    vendorId: "v2",
    vendorName: "Gaiam Direct",
    status: "draft",
    lineItems: [
      { id: "li6", productId: "p8", productName: "Organic Herbal Tea - Yoga Blend", sku: "TEA-ORG-YOGA", quantityOrdered: 48, quantityReceived: 0, unitCost: 450, totalCost: 21600 },
    ],
    subtotal: 21600,
    shipping: 0,
    tax: 0,
    total: 21600,
    notes: "Pending approval",
    expectedDate: null,
    createdAt: "2025-01-28T16:00:00",
    submittedAt: null,
    receivedAt: null,
  },
  {
    id: "po5",
    poNumber: "PO-2024-089",
    vendorId: "v1",
    vendorName: "Manduka Wholesale",
    status: "cancelled",
    lineItems: [
      { id: "li7", productId: "p1", productName: "Manduka PRO Yoga Mat", sku: "MAT-MAND-PRO", quantityOrdered: 10, quantityReceived: 0, unitCost: 7200, totalCost: 72000 },
    ],
    subtotal: 72000,
    shipping: 1500,
    tax: 0,
    total: 73500,
    notes: "Cancelled - vendor out of stock",
    expectedDate: null,
    createdAt: "2024-12-15T10:00:00",
    submittedAt: "2024-12-15T10:05:00",
    receivedAt: null,
  },
];

const statusConfig: Record<string, { color: string; icon: typeof Clock; label: string }> = {
  draft: { color: "bg-muted text-muted-foreground", icon: FileText, label: "Draft" },
  submitted: { color: "bg-primary/20 text-primary", icon: Send, label: "Submitted" },
  confirmed: { color: "bg-accent-gold/20 text-accent-gold", icon: CheckCircle2, label: "Confirmed" },
  shipped: { color: "bg-accent-coral/20 text-accent-coral", icon: Truck, label: "Shipped" },
  partial: { color: "bg-accent-gold/20 text-accent-gold", icon: Package, label: "Partial" },
  received: { color: "bg-accent-sage/20 text-accent-sage", icon: PackageCheck, label: "Received" },
  cancelled: { color: "bg-destructive/20 text-destructive", icon: XCircle, label: "Cancelled" },
};

function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function PurchaseOrdersManage() {
  const { toast } = useToast();
  const [purchaseOrders, setPurchaseOrders] = useState(mockPurchaseOrders);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [vendorFilter, setVendorFilter] = useState("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [receiveOpen, setReceiveOpen] = useState(false);
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);

  // Create PO form state
  const [newPOVendor, setNewPOVendor] = useState("");
  const [newPOLineItems, setNewPOLineItems] = useState<
    { productId: string; quantity: number; unitCost: number }[]
  >([]);
  const [newPOShipping, setNewPOShipping] = useState(0);
  const [newPONotes, setNewPONotes] = useState("");
  const [productSearch, setProductSearch] = useState("");

  // Receive inventory state
  const [receiveQuantities, setReceiveQuantities] = useState<Record<string, number>>({});

  const filteredOrders = purchaseOrders.filter((po) => {
    const matchesSearch =
      po.poNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      po.vendorName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || po.status === statusFilter;
    const matchesVendor = vendorFilter === "all" || po.vendorId === vendorFilter;
    return matchesSearch && matchesStatus && matchesVendor;
  });

  const pendingCount = purchaseOrders.filter(
    (po) => ["submitted", "confirmed", "shipped", "partial"].includes(po.status)
  ).length;
  const totalPendingValue = purchaseOrders
    .filter((po) => ["submitted", "confirmed", "shipped", "partial"].includes(po.status))
    .reduce((sum, po) => sum + po.total, 0);

  const handleViewDetail = (po: PurchaseOrder) => {
    setSelectedPO(po);
    setDetailOpen(true);
  };

  const handleReceive = (po: PurchaseOrder) => {
    setSelectedPO(po);
    const initialQuantities: Record<string, number> = {};
    po.lineItems.forEach((item) => {
      initialQuantities[item.id] = 0;
    });
    setReceiveQuantities(initialQuantities);
    setReceiveOpen(true);
  };

  const handleAddLineItem = (product: (typeof availableProducts)[0]) => {
    const existing = newPOLineItems.find((li) => li.productId === product.id);
    if (existing) {
      setNewPOLineItems((prev) =>
        prev.map((li) =>
          li.productId === product.id ? { ...li, quantity: li.quantity + 1 } : li
        )
      );
    } else {
      setNewPOLineItems((prev) => [
        ...prev,
        { productId: product.id, quantity: 1, unitCost: product.cost },
      ]);
    }
    setProductSearch("");
  };

  const handleRemoveLineItem = (productId: string) => {
    setNewPOLineItems((prev) => prev.filter((li) => li.productId !== productId));
  };

  const handleUpdateQuantity = (productId: string, quantity: number) => {
    setNewPOLineItems((prev) =>
      prev.map((li) =>
        li.productId === productId ? { ...li, quantity: Math.max(1, quantity) } : li
      )
    );
  };

  const handleUpdateCost = (productId: string, cost: number) => {
    setNewPOLineItems((prev) =>
      prev.map((li) =>
        li.productId === productId ? { ...li, unitCost: Math.max(0, cost) } : li
      )
    );
  };

  const newPOSubtotal = newPOLineItems.reduce(
    (sum, li) => sum + li.quantity * li.unitCost,
    0
  );
  const newPOTotal = newPOSubtotal + newPOShipping * 100;

  const handleCreatePO = (asDraft: boolean) => {
    if (!newPOVendor || newPOLineItems.length === 0) return;

    const vendor = vendors.find((v) => v.id === newPOVendor);
    const poNumber = `PO-2025-${String(purchaseOrders.length + 1).padStart(3, "0")}`;

    const newPO: PurchaseOrder = {
      id: `po${Date.now()}`,
      poNumber,
      vendorId: newPOVendor,
      vendorName: vendor?.name || "",
      status: asDraft ? "draft" : "submitted",
      lineItems: newPOLineItems.map((li, idx) => {
        const product = availableProducts.find((p) => p.id === li.productId);
        return {
          id: `li${Date.now()}-${idx}`,
          productId: li.productId,
          productName: product?.name || "",
          sku: product?.sku || "",
          quantityOrdered: li.quantity,
          quantityReceived: 0,
          unitCost: li.unitCost,
          totalCost: li.quantity * li.unitCost,
        };
      }),
      subtotal: newPOSubtotal,
      shipping: newPOShipping * 100,
      tax: 0,
      total: newPOTotal,
      notes: newPONotes,
      expectedDate: asDraft
        ? null
        : new Date(Date.now() + (vendor?.leadTimeDays || 7) * 24 * 60 * 60 * 1000)
            .toISOString()
            .split("T")[0],
      createdAt: new Date().toISOString(),
      submittedAt: asDraft ? null : new Date().toISOString(),
      receivedAt: null,
    };

    setPurchaseOrders((prev) => [newPO, ...prev]);
    setCreateOpen(false);
    setNewPOVendor("");
    setNewPOLineItems([]);
    setNewPOShipping(0);
    setNewPONotes("");

    toast({
      title: asDraft ? "Draft saved" : "Purchase order submitted",
      description: `${poNumber} ${asDraft ? "saved as draft" : "submitted to " + vendor?.name}`,
    });
  };

  const handleConfirmReceive = () => {
    if (!selectedPO) return;

    const totalReceiving = Object.values(receiveQuantities).reduce((sum, q) => sum + q, 0);
    if (totalReceiving === 0) return;

    setPurchaseOrders((prev) =>
      prev.map((po) => {
        if (po.id !== selectedPO.id) return po;

        const updatedItems = po.lineItems.map((item) => ({
          ...item,
          quantityReceived: item.quantityReceived + (receiveQuantities[item.id] || 0),
        }));

        const allReceived = updatedItems.every(
          (item) => item.quantityReceived >= item.quantityOrdered
        );
        const someReceived = updatedItems.some((item) => item.quantityReceived > 0);

        return {
          ...po,
          lineItems: updatedItems,
          status: allReceived ? "received" : someReceived ? "partial" : po.status,
          receivedAt: allReceived ? new Date().toISOString() : po.receivedAt,
        };
      })
    );

    toast({
      title: "Inventory received",
      description: `${totalReceiving} items received for ${selectedPO.poNumber}`,
    });
    setReceiveOpen(false);
  };

  const filteredProducts = availableProducts.filter(
    (p) =>
      p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.sku.toLowerCase().includes(productSearch.toLowerCase())
  );

  return (
    <ManageLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Purchase Orders</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {pendingCount} pending orders — {formatPrice(totalPendingValue)} total value
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button size="sm" onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New Purchase Order
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Pending Orders</p>
                  <p className="text-xl font-bold mt-0.5">{pendingCount}</p>
                </div>
                <Clock className="h-5 w-5 text-accent-gold" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Shipped</p>
                  <p className="text-xl font-bold mt-0.5">
                    {purchaseOrders.filter((po) => po.status === "shipped").length}
                  </p>
                </div>
                <Truck className="h-5 w-5 text-accent-coral" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Received (30d)</p>
                  <p className="text-xl font-bold mt-0.5">
                    {purchaseOrders.filter((po) => po.status === "received").length}
                  </p>
                </div>
                <PackageCheck className="h-5 w-5 text-accent-sage" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Total Pending Value</p>
                  <p className="text-xl font-bold mt-0.5">{formatPrice(totalPendingValue)}</p>
                </div>
                <DollarSign className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by PO number or vendor..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="submitted">Submitted</SelectItem>
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="shipped">Shipped</SelectItem>
              <SelectItem value="partial">Partial</SelectItem>
              <SelectItem value="received">Received</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          <Select value={vendorFilter} onValueChange={setVendorFilter}>
            <SelectTrigger className="w-48">
              <Building2 className="h-4 w-4 mr-2 text-muted-foreground" />
              <SelectValue placeholder="Vendor" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Vendors</SelectItem>
              {vendors.map((vendor) => (
                <SelectItem key={vendor.id} value={vendor.id}>
                  {vendor.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Purchase Orders List */}
        <div className="space-y-3">
          {filteredOrders.map((po) => {
            const status = statusConfig[po.status];
            const StatusIcon = status.icon;
            const itemCount = po.lineItems.reduce((sum, li) => sum + li.quantityOrdered, 0);
            const receivedCount = po.lineItems.reduce(
              (sum, li) => sum + li.quantityReceived,
              0
            );

            return (
              <Card
                key={po.id}
                className="hover:bg-secondary/30 transition-colors cursor-pointer"
                onClick={() => handleViewDetail(po)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div
                        className={`h-10 w-10 rounded-lg flex items-center justify-center ${status.color}`}
                      >
                        <StatusIcon className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-semibold">{po.poNumber}</h3>
                          <Badge className={`text-[10px] ${status.color}`}>
                            {status.label}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Building2 className="h-3 w-3" />
                            {po.vendorName}
                          </span>
                          <span className="flex items-center gap-1">
                            <Package className="h-3 w-3" />
                            {po.lineItems.length} items ({itemCount} units)
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Created {formatDate(po.createdAt)}
                          </span>
                        </div>
                        {po.status === "partial" && (
                          <div className="flex items-center gap-1 mt-1.5 text-xs text-accent-gold">
                            <AlertCircle className="h-3 w-3" />
                            <span>
                              {receivedCount}/{itemCount} units received
                            </span>
                          </div>
                        )}
                        {po.expectedDate && po.status !== "received" && po.status !== "cancelled" && (
                          <div className="flex items-center gap-1 mt-1.5 text-xs text-muted-foreground">
                            <Truck className="h-3 w-3" />
                            <span>Expected {formatDate(po.expectedDate)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-sm font-semibold">{formatPrice(po.total)}</p>
                        <p className="text-xs text-muted-foreground">Total</p>
                      </div>
                      <div onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-44 rounded-xl">
                            <DropdownMenuItem
                              className="rounded-lg cursor-pointer"
                              onClick={() => handleViewDetail(po)}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            {["shipped", "partial", "confirmed"].includes(po.status) && (
                              <DropdownMenuItem
                                className="rounded-lg cursor-pointer"
                                onClick={() => handleReceive(po)}
                              >
                                <PackageCheck className="h-4 w-4 mr-2" />
                                Receive Items
                              </DropdownMenuItem>
                            )}
                            {po.status === "draft" && (
                              <>
                                <DropdownMenuItem className="rounded-lg cursor-pointer">
                                  <Send className="h-4 w-4 mr-2" />
                                  Submit Order
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="rounded-lg cursor-pointer text-destructive">
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete Draft
                                </DropdownMenuItem>
                              </>
                            )}
                            {["submitted", "confirmed"].includes(po.status) && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="rounded-lg cursor-pointer text-destructive">
                                  <XCircle className="h-4 w-4 mr-2" />
                                  Cancel Order
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Create PO Dialog */}
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Purchase Order</DialogTitle>
              <DialogDescription>
                Order inventory from your vendors
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6 py-4">
              {/* Vendor Selection */}
              <div className="space-y-2">
                <Label>Vendor</Label>
                <Select value={newPOVendor} onValueChange={setNewPOVendor}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a vendor..." />
                  </SelectTrigger>
                  <SelectContent>
                    {vendors.map((vendor) => (
                      <SelectItem key={vendor.id} value={vendor.id}>
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          <span>{vendor.name}</span>
                          <span className="text-xs text-muted-foreground">
                            ({vendor.leadTimeDays} day lead time)
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Line Items */}
              <div className="space-y-3">
                <Label>Line Items</Label>

                {/* Product Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search products to add..."
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    className="pl-10"
                  />
                  {productSearch && (
                    <Card className="absolute z-10 w-full mt-1 max-h-48 overflow-y-auto">
                      <CardContent className="p-1">
                        {filteredProducts.map((product) => (
                          <div
                            key={product.id}
                            className="flex items-center justify-between p-2 hover:bg-secondary/50 rounded-lg cursor-pointer"
                            onClick={() => handleAddLineItem(product)}
                          >
                            <div>
                              <p className="text-sm font-medium">{product.name}</p>
                              <p className="text-xs text-muted-foreground">{product.sku}</p>
                            </div>
                            <span className="text-sm">{formatPrice(product.cost)}</span>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  )}
                </div>

                {/* Added Items */}
                {newPOLineItems.length > 0 ? (
                  <div className="space-y-2">
                    {newPOLineItems.map((item) => {
                      const product = availableProducts.find((p) => p.id === item.productId);
                      return (
                        <div
                          key={item.productId}
                          className="flex items-center gap-3 p-3 rounded-xl bg-secondary/30"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{product?.name}</p>
                            <p className="text-xs text-muted-foreground">{product?.sku}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) =>
                                handleUpdateQuantity(item.productId, parseInt(e.target.value) || 1)
                              }
                              className="w-20 text-center"
                            />
                            <span className="text-xs text-muted-foreground">x</span>
                            <div className="relative">
                              <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                              <Input
                                type="number"
                                step="0.01"
                                value={(item.unitCost / 100).toFixed(2)}
                                onChange={(e) =>
                                  handleUpdateCost(
                                    item.productId,
                                    Math.round(parseFloat(e.target.value) * 100) || 0
                                  )
                                }
                                className="w-24 pl-6"
                              />
                            </div>
                            <span className="text-sm font-medium w-20 text-right">
                              {formatPrice(item.quantity * item.unitCost)}
                            </span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-destructive"
                              onClick={() => handleRemoveLineItem(item.productId)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground border border-dashed border-border rounded-xl">
                    <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No items added yet</p>
                    <p className="text-xs">Search for products above to add them</p>
                  </div>
                )}
              </div>

              {/* Shipping & Notes */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="shipping">Shipping Cost ($)</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="shipping"
                      type="number"
                      step="0.01"
                      min="0"
                      value={newPOShipping}
                      onChange={(e) => setNewPOShipping(parseFloat(e.target.value) || 0)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes (optional)</Label>
                  <Input
                    id="notes"
                    value={newPONotes}
                    onChange={(e) => setNewPONotes(e.target.value)}
                    placeholder="Internal notes..."
                  />
                </div>
              </div>

              {/* Totals */}
              <Card className="bg-secondary/30">
                <CardContent className="p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>{formatPrice(newPOSubtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Shipping</span>
                    <span>{formatPrice(newPOShipping * 100)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-base font-semibold">
                    <span>Total</span>
                    <span>{formatPrice(newPOTotal)}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="outline"
                onClick={() => handleCreatePO(true)}
                disabled={!newPOVendor || newPOLineItems.length === 0}
              >
                Save as Draft
              </Button>
              <Button
                onClick={() => handleCreatePO(false)}
                disabled={!newPOVendor || newPOLineItems.length === 0}
              >
                <Send className="h-4 w-4 mr-2" />
                Submit Order
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* PO Detail Dialog */}
        <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {selectedPO?.poNumber}
                {selectedPO && (
                  <Badge className={`text-xs ${statusConfig[selectedPO.status].color}`}>
                    {statusConfig[selectedPO.status].label}
                  </Badge>
                )}
              </DialogTitle>
              <DialogDescription>
                {selectedPO?.vendorName} — Created {selectedPO && formatDate(selectedPO.createdAt)}
              </DialogDescription>
            </DialogHeader>
            {selectedPO && (
              <div className="space-y-6 py-4">
                {/* Status Timeline */}
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-muted-foreground">Created</span>
                  <ChevronRight className="h-3 w-3 text-muted-foreground" />
                  {selectedPO.submittedAt && (
                    <>
                      <span className="text-muted-foreground">Submitted</span>
                      <ChevronRight className="h-3 w-3 text-muted-foreground" />
                    </>
                  )}
                  {selectedPO.status === "received" && selectedPO.receivedAt && (
                    <span className="text-accent-sage font-medium">
                      Received {formatDate(selectedPO.receivedAt)}
                    </span>
                  )}
                  {selectedPO.status === "cancelled" && (
                    <span className="text-destructive font-medium">Cancelled</span>
                  )}
                  {["shipped", "partial", "confirmed", "submitted"].includes(selectedPO.status) &&
                    selectedPO.expectedDate && (
                      <span className="text-muted-foreground">
                        Expected {formatDate(selectedPO.expectedDate)}
                      </span>
                    )}
                </div>

                {/* Line Items */}
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold">Line Items</h4>
                  <Card>
                    <CardContent className="p-0">
                      <div className="grid grid-cols-[2fr,1fr,1fr,1fr,1fr] gap-2 px-4 py-2 border-b border-border text-xs font-medium text-muted-foreground uppercase">
                        <span>Product</span>
                        <span className="text-right">Qty</span>
                        <span className="text-right">Received</span>
                        <span className="text-right">Unit Cost</span>
                        <span className="text-right">Total</span>
                      </div>
                      {selectedPO.lineItems.map((item) => (
                        <div
                          key={item.id}
                          className="grid grid-cols-[2fr,1fr,1fr,1fr,1fr] gap-2 px-4 py-3 border-b border-border last:border-0 items-center"
                        >
                          <div>
                            <p className="text-sm font-medium">{item.productName}</p>
                            <p className="text-xs text-muted-foreground">{item.sku}</p>
                          </div>
                          <p className="text-sm text-right">{item.quantityOrdered}</p>
                          <p
                            className={`text-sm text-right ${
                              item.quantityReceived < item.quantityOrdered
                                ? "text-accent-gold"
                                : "text-accent-sage"
                            }`}
                          >
                            {item.quantityReceived}
                          </p>
                          <p className="text-sm text-right">{formatPrice(item.unitCost)}</p>
                          <p className="text-sm text-right font-medium">
                            {formatPrice(item.totalCost)}
                          </p>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>

                {/* Totals */}
                <div className="flex justify-end">
                  <Card className="w-64">
                    <CardContent className="p-4 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Subtotal</span>
                        <span>{formatPrice(selectedPO.subtotal)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Shipping</span>
                        <span>{formatPrice(selectedPO.shipping)}</span>
                      </div>
                      {selectedPO.tax > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Tax</span>
                          <span>{formatPrice(selectedPO.tax)}</span>
                        </div>
                      )}
                      <Separator />
                      <div className="flex justify-between font-semibold">
                        <span>Total</span>
                        <span>{formatPrice(selectedPO.total)}</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Notes */}
                {selectedPO.notes && (
                  <div className="space-y-1">
                    <h4 className="text-sm font-semibold">Notes</h4>
                    <p className="text-sm text-muted-foreground">{selectedPO.notes}</p>
                  </div>
                )}
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setDetailOpen(false)}>
                Close
              </Button>
              {selectedPO &&
                ["shipped", "partial", "confirmed"].includes(selectedPO.status) && (
                  <Button
                    onClick={() => {
                      setDetailOpen(false);
                      handleReceive(selectedPO);
                    }}
                  >
                    <PackageCheck className="h-4 w-4 mr-2" />
                    Receive Items
                  </Button>
                )}
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Receive Items Dialog */}
        <Dialog open={receiveOpen} onOpenChange={setReceiveOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Receive Inventory</DialogTitle>
              <DialogDescription>
                {selectedPO?.poNumber} from {selectedPO?.vendorName}
              </DialogDescription>
            </DialogHeader>
            {selectedPO && (
              <div className="space-y-4 py-4">
                {selectedPO.lineItems.map((item) => {
                  const remaining = item.quantityOrdered - item.quantityReceived;
                  const receiving = receiveQuantities[item.id] || 0;

                  return (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-3 rounded-xl bg-secondary/30"
                    >
                      <div className="flex-1">
                        <p className="text-sm font-medium">{item.productName}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.quantityReceived}/{item.quantityOrdered} received
                          {remaining > 0 && ` — ${remaining} remaining`}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          disabled={receiving <= 0}
                          onClick={() =>
                            setReceiveQuantities((prev) => ({
                              ...prev,
                              [item.id]: Math.max(0, receiving - 1),
                            }))
                          }
                        >
                          -
                        </Button>
                        <Input
                          type="number"
                          min="0"
                          max={remaining}
                          value={receiving}
                          onChange={(e) =>
                            setReceiveQuantities((prev) => ({
                              ...prev,
                              [item.id]: Math.min(
                                remaining,
                                Math.max(0, parseInt(e.target.value) || 0)
                              ),
                            }))
                          }
                          className="w-16 text-center"
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          disabled={receiving >= remaining}
                          onClick={() =>
                            setReceiveQuantities((prev) => ({
                              ...prev,
                              [item.id]: Math.min(remaining, receiving + 1),
                            }))
                          }
                        >
                          +
                        </Button>
                        {remaining > 0 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs"
                            onClick={() =>
                              setReceiveQuantities((prev) => ({
                                ...prev,
                                [item.id]: remaining,
                              }))
                            }
                          >
                            All
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
                <div className="flex items-center justify-between pt-2 border-t border-border">
                  <span className="text-sm font-medium">Total Receiving</span>
                  <span className="text-lg font-bold">
                    {Object.values(receiveQuantities).reduce((sum, q) => sum + q, 0)} units
                  </span>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setReceiveOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleConfirmReceive}
                disabled={
                  Object.values(receiveQuantities).reduce((sum, q) => sum + q, 0) === 0
                }
              >
                <PackageCheck className="h-4 w-4 mr-2" />
                Confirm Receipt
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </ManageLayout>
  );
}
