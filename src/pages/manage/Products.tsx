import { useState } from "react";
import { ManageLayout } from "@/components/manage/ManageLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus,
  Search,
  Package,
  Grid3X3,
  List,
  MoreHorizontal,
  Edit,
  Archive,
  TrendingDown,
  ImagePlus,
  Barcode,
  Tag,
  DollarSign,
  Box,
  Repeat,
  Download as DownloadIcon,
  ShoppingBag,
  Droplets,
  Layers,
  Monitor,
  Filter,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Product {
  id: string;
  name: string;
  description: string;
  sku: string;
  barcode: string | null;
  type: "physical" | "consumable" | "rental" | "digital";
  category: string;
  tags: string[];
  price: number;
  cost: number;
  images: string[];
  trackInventory: boolean;
  lowStockThreshold: number;
  stockOnHand: number;
  status: "active" | "inactive" | "out_of_stock";
  createdAt: string;
}

const mockProducts: Product[] = [
  {
    id: "p1",
    name: "Manduka PRO Yoga Mat",
    description: "Professional-grade 6mm yoga mat with superior cushioning and grip",
    sku: "MAT-MAND-PRO",
    barcode: "810013460001",
    type: "physical",
    category: "Mats",
    tags: ["Premium", "Best Seller"],
    price: 12000,
    cost: 7200,
    images: [],
    trackInventory: true,
    lowStockThreshold: 5,
    stockOnHand: 12,
    status: "active",
    createdAt: "2024-06-15",
  },
  {
    id: "p2",
    name: "Cork Yoga Block (Set of 2)",
    description: "Eco-friendly cork blocks for support and alignment",
    sku: "BLK-CORK-2PK",
    barcode: "810013460002",
    type: "physical",
    category: "Props",
    tags: ["Eco-Friendly"],
    price: 3500,
    cost: 1800,
    images: [],
    trackInventory: true,
    lowStockThreshold: 10,
    stockOnHand: 8,
    status: "active",
    createdAt: "2024-07-01",
  },
  {
    id: "p3",
    name: "Essential Oil Blend - Calm",
    description: "Lavender and chamomile blend for relaxation",
    sku: "OIL-ESS-CALM",
    barcode: "810013460003",
    type: "consumable",
    category: "Wellness",
    tags: ["Aromatherapy"],
    price: 2200,
    cost: 850,
    images: [],
    trackInventory: true,
    lowStockThreshold: 15,
    stockOnHand: 3,
    status: "active",
    createdAt: "2024-08-10",
  },
  {
    id: "p4",
    name: "Yoga Strap - 8ft Cotton",
    description: "Durable cotton strap with metal D-ring buckle",
    sku: "STRP-COT-8FT",
    barcode: "810013460004",
    type: "physical",
    category: "Props",
    tags: [],
    price: 1500,
    cost: 600,
    images: [],
    trackInventory: true,
    lowStockThreshold: 15,
    stockOnHand: 25,
    status: "active",
    createdAt: "2024-05-20",
  },
  {
    id: "p5",
    name: "Studio Mat Rental",
    description: "Clean mat rental for drop-in students",
    sku: "RENT-MAT-STD",
    barcode: null,
    type: "rental",
    category: "Rentals",
    tags: ["Service"],
    price: 300,
    cost: 0,
    images: [],
    trackInventory: true,
    lowStockThreshold: 5,
    stockOnHand: 20,
    status: "active",
    createdAt: "2024-01-01",
  },
  {
    id: "p6",
    name: "Online Workshop Recording Access",
    description: "Lifetime access to workshop recording library",
    sku: "DIG-WKSHP-LIB",
    barcode: null,
    type: "digital",
    category: "Digital",
    tags: ["On-Demand"],
    price: 4900,
    cost: 0,
    images: [],
    trackInventory: false,
    lowStockThreshold: 0,
    stockOnHand: 0,
    status: "active",
    createdAt: "2024-09-01",
  },
  {
    id: "p7",
    name: "Meditation Cushion - Zafu",
    description: "Traditional round meditation cushion with buckwheat hull filling",
    sku: "CUSH-ZAFU-RND",
    barcode: "810013460007",
    type: "physical",
    category: "Props",
    tags: ["Meditation"],
    price: 5500,
    cost: 2800,
    images: [],
    trackInventory: true,
    lowStockThreshold: 8,
    stockOnHand: 0,
    status: "out_of_stock",
    createdAt: "2024-04-15",
  },
  {
    id: "p8",
    name: "Organic Herbal Tea - Yoga Blend",
    description: "Caffeine-free blend with tulsi, ginger, and lemongrass",
    sku: "TEA-ORG-YOGA",
    barcode: "810013460008",
    type: "consumable",
    category: "Wellness",
    tags: ["Organic", "Beverages"],
    price: 1200,
    cost: 450,
    images: [],
    trackInventory: true,
    lowStockThreshold: 20,
    stockOnHand: 45,
    status: "active",
    createdAt: "2024-07-20",
  },
];

const categories = ["All", "Mats", "Props", "Wellness", "Rentals", "Digital", "Apparel"];

const typeIcons: Record<string, typeof Package> = {
  physical: Box,
  consumable: Droplets,
  rental: Repeat,
  digital: Monitor,
};

const statusColors: Record<string, string> = {
  active: "bg-accent-sage/20 text-accent-sage",
  inactive: "bg-muted text-muted-foreground",
  out_of_stock: "bg-destructive/20 text-destructive",
};

function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export default function ProductsManage() {
  const { toast } = useToast();
  const [products, setProducts] = useState(mockProducts);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [createOpen, setCreateOpen] = useState(false);
  const [adjustStockOpen, setAdjustStockOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [stockAdjustment, setStockAdjustment] = useState(0);

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.barcode && p.barcode.includes(searchQuery));
    const matchesCategory = categoryFilter === "All" || p.category === categoryFilter;
    const matchesStatus = statusFilter === "all" || p.status === statusFilter;
    const matchesType = typeFilter === "all" || p.type === typeFilter;
    return matchesSearch && matchesCategory && matchesStatus && matchesType;
  });

  const lowStockProducts = products.filter(
    (p) => p.trackInventory && p.stockOnHand <= p.lowStockThreshold && p.stockOnHand > 0
  );
  const outOfStockProducts = products.filter((p) => p.trackInventory && p.stockOnHand === 0);
  const totalInventoryValue = products.reduce((sum, p) => sum + p.cost * p.stockOnHand, 0);
  const totalRetailValue = products.reduce((sum, p) => sum + p.price * p.stockOnHand, 0);

  const handleAdjustStock = (product: Product) => {
    setSelectedProduct(product);
    setStockAdjustment(0);
    setAdjustStockOpen(true);
  };

  const confirmStockAdjustment = () => {
    if (selectedProduct) {
      setProducts((prev) =>
        prev.map((p) =>
          p.id === selectedProduct.id
            ? {
                ...p,
                stockOnHand: Math.max(0, p.stockOnHand + stockAdjustment),
                status:
                  p.stockOnHand + stockAdjustment <= 0
                    ? "out_of_stock"
                    : p.status === "out_of_stock"
                    ? "active"
                    : p.status,
              }
            : p
        )
      );
      toast({
        title: "Stock adjusted",
        description: `${selectedProduct.name} stock updated by ${stockAdjustment > 0 ? "+" : ""}${stockAdjustment}`,
      });
      setAdjustStockOpen(false);
    }
  };

  const handleDeactivate = (product: Product) => {
    setProducts((prev) =>
      prev.map((p) =>
        p.id === product.id
          ? { ...p, status: p.status === "active" ? "inactive" : "active" }
          : p
      )
    );
    toast({
      title: product.status === "active" ? "Product deactivated" : "Product activated",
      description: product.name,
    });
  };

  return (
    <ManageLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Products</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {products.length} products — {formatPrice(totalRetailValue)} retail value
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <DownloadIcon className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button size="sm" onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Product
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Active Products</p>
                  <p className="text-xl font-bold mt-0.5">
                    {products.filter((p) => p.status === "active").length}
                  </p>
                </div>
                <Package className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Low Stock</p>
                  <p className="text-xl font-bold mt-0.5 text-accent-gold">
                    {lowStockProducts.length}
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
                    {outOfStockProducts.length}
                  </p>
                </div>
                <Archive className="h-5 w-5 text-destructive" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Inventory Value</p>
                  <p className="text-xl font-bold mt-0.5">{formatPrice(totalInventoryValue)}</p>
                </div>
                <DollarSign className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, SKU, or barcode..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="physical">Physical</SelectItem>
              <SelectItem value="consumable">Consumable</SelectItem>
              <SelectItem value="rental">Rental</SelectItem>
              <SelectItem value="digital">Digital</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="out_of_stock">Out of Stock</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex border border-border rounded-lg p-0.5">
            <Button
              variant={viewMode === "grid" ? "secondary" : "ghost"}
              size="sm"
              className="h-8 px-2"
              onClick={() => setViewMode("grid")}
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "secondary" : "ghost"}
              size="sm"
              className="h-8 px-2"
              onClick={() => setViewMode("list")}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Products Grid/List */}
        {viewMode === "grid" ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredProducts.map((product) => {
              const TypeIcon = typeIcons[product.type];
              const margin = product.cost > 0 ? ((product.price - product.cost) / product.price) * 100 : 100;
              const isLowStock =
                product.trackInventory && product.stockOnHand <= product.lowStockThreshold;

              return (
                <Card key={product.id} className="overflow-hidden">
                  <div className="aspect-square bg-secondary/30 flex items-center justify-center">
                    {product.images.length > 0 ? (
                      <img
                        src={product.images[0]}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <ShoppingBag className="h-12 w-12 text-muted-foreground/30" />
                    )}
                  </div>
                  <CardContent className="p-3">
                    <div className="flex items-start justify-between mb-1">
                      <div className="flex items-center gap-1.5">
                        <TypeIcon className="h-3.5 w-3.5 text-muted-foreground" />
                        <Badge
                          variant="outline"
                          className="text-[9px] px-1 py-0 capitalize"
                        >
                          {product.type}
                        </Badge>
                      </div>
                      <Badge className={`text-[9px] ${statusColors[product.status]}`}>
                        {product.status.replace("_", " ")}
                      </Badge>
                    </div>
                    <h3 className="text-sm font-semibold line-clamp-2 mb-1">{product.name}</h3>
                    <p className="text-xs text-muted-foreground mb-2">{product.sku}</p>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-lg font-bold">{formatPrice(product.price)}</span>
                      {product.cost > 0 && (
                        <span className="text-xs text-muted-foreground">
                          {margin.toFixed(0)}% margin
                        </span>
                      )}
                    </div>
                    {product.trackInventory && (
                      <div
                        className={`flex items-center gap-1.5 text-xs ${
                          product.stockOnHand === 0
                            ? "text-destructive"
                            : isLowStock
                            ? "text-accent-gold"
                            : "text-muted-foreground"
                        }`}
                      >
                        <Layers className="h-3 w-3" />
                        <span>
                          {product.stockOnHand} in stock
                          {isLowStock && product.stockOnHand > 0 && " (low)"}
                        </span>
                      </div>
                    )}
                    {product.tags.length > 0 && (
                      <div className="flex gap-1 mt-2 flex-wrap">
                        {product.tags.map((tag) => (
                          <Badge key={tag} variant="outline" className="text-[9px] px-1.5 py-0">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                    <div className="flex gap-1 mt-3 pt-3 border-t border-border">
                      <Button variant="outline" size="sm" className="flex-1 h-8 text-xs">
                        <Edit className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44 rounded-xl">
                          {product.trackInventory && (
                            <DropdownMenuItem
                              className="rounded-lg cursor-pointer"
                              onClick={() => handleAdjustStock(product)}
                            >
                              <Layers className="h-4 w-4 mr-2" />
                              Adjust Stock
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem className="rounded-lg cursor-pointer">
                            <Tag className="h-4 w-4 mr-2" />
                            Edit Tags
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="rounded-lg cursor-pointer text-destructive"
                            onClick={() => handleDeactivate(product)}
                          >
                            <Archive className="h-4 w-4 mr-2" />
                            {product.status === "active" ? "Deactivate" : "Activate"}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card>
            <CardContent className="p-0">
              {/* Table Header */}
              <div className="hidden md:grid grid-cols-[2fr,1fr,1fr,1fr,1fr,auto] gap-4 px-4 py-3 border-b border-border text-xs font-medium text-muted-foreground uppercase tracking-wider">
                <span>Product</span>
                <span>Type</span>
                <span>Price</span>
                <span>Stock</span>
                <span>Status</span>
                <span></span>
              </div>
              {filteredProducts.map((product) => {
                const TypeIcon = typeIcons[product.type];
                const isLowStock =
                  product.trackInventory && product.stockOnHand <= product.lowStockThreshold;

                return (
                  <div
                    key={product.id}
                    className="grid md:grid-cols-[2fr,1fr,1fr,1fr,1fr,auto] gap-4 px-4 py-3 border-b border-border last:border-0 items-center hover:bg-secondary/30 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-secondary/50 flex items-center justify-center shrink-0">
                        {product.images.length > 0 ? (
                          <img
                            src={product.images[0]}
                            alt={product.name}
                            className="w-full h-full object-cover rounded-lg"
                          />
                        ) : (
                          <ShoppingBag className="h-4 w-4 text-muted-foreground/50" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{product.name}</p>
                        <p className="text-xs text-muted-foreground">{product.sku}</p>
                      </div>
                    </div>
                    <div className="hidden md:flex items-center gap-1.5">
                      <TypeIcon className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-sm capitalize">{product.type}</span>
                    </div>
                    <div className="hidden md:block">
                      <p className="text-sm font-semibold">{formatPrice(product.price)}</p>
                      {product.cost > 0 && (
                        <p className="text-xs text-muted-foreground">
                          Cost: {formatPrice(product.cost)}
                        </p>
                      )}
                    </div>
                    <div className="hidden md:block">
                      {product.trackInventory ? (
                        <p
                          className={`text-sm ${
                            product.stockOnHand === 0
                              ? "text-destructive font-semibold"
                              : isLowStock
                              ? "text-accent-gold font-semibold"
                              : ""
                          }`}
                        >
                          {product.stockOnHand} units
                        </p>
                      ) : (
                        <p className="text-sm text-muted-foreground">Not tracked</p>
                      )}
                    </div>
                    <div className="hidden md:block">
                      <Badge className={`text-[10px] ${statusColors[product.status]}`}>
                        {product.status.replace("_", " ")}
                      </Badge>
                    </div>
                    <div className="hidden md:block">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44 rounded-xl">
                          <DropdownMenuItem className="rounded-lg cursor-pointer">
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Product
                          </DropdownMenuItem>
                          {product.trackInventory && (
                            <DropdownMenuItem
                              className="rounded-lg cursor-pointer"
                              onClick={() => handleAdjustStock(product)}
                            >
                              <Layers className="h-4 w-4 mr-2" />
                              Adjust Stock
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="rounded-lg cursor-pointer text-destructive"
                            onClick={() => handleDeactivate(product)}
                          >
                            <Archive className="h-4 w-4 mr-2" />
                            {product.status === "active" ? "Deactivate" : "Activate"}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}

        {/* Create Product Dialog */}
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add Product</DialogTitle>
              <DialogDescription>
                Create a new product for your retail inventory
              </DialogDescription>
            </DialogHeader>
            <Tabs defaultValue="basic" className="mt-2">
              <TabsList className="grid grid-cols-3 w-full">
                <TabsTrigger value="basic">Basic Info</TabsTrigger>
                <TabsTrigger value="pricing">Pricing</TabsTrigger>
                <TabsTrigger value="inventory">Inventory</TabsTrigger>
              </TabsList>
              <TabsContent value="basic" className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="productName">Product Name</Label>
                  <Input id="productName" placeholder="e.g. Manduka PRO Yoga Mat" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="productDesc">Description</Label>
                  <Textarea
                    id="productDesc"
                    placeholder="Describe the product..."
                    className="min-h-[80px]"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="productSku">SKU</Label>
                    <Input id="productSku" placeholder="MAT-MAND-PRO" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="productBarcode">Barcode (optional)</Label>
                    <div className="relative">
                      <Barcode className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input id="productBarcode" placeholder="UPC or EAN" className="pl-10" />
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Product Type</Label>
                    <Select defaultValue="physical">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="physical">Physical Product</SelectItem>
                        <SelectItem value="consumable">Consumable</SelectItem>
                        <SelectItem value="rental">Rental Item</SelectItem>
                        <SelectItem value="digital">Digital Product</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Select defaultValue="props">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mats">Mats</SelectItem>
                        <SelectItem value="props">Props</SelectItem>
                        <SelectItem value="wellness">Wellness</SelectItem>
                        <SelectItem value="apparel">Apparel</SelectItem>
                        <SelectItem value="rentals">Rentals</SelectItem>
                        <SelectItem value="digital">Digital</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="productTags">Tags (comma-separated)</Label>
                  <Input id="productTags" placeholder="Premium, Best Seller, Eco-Friendly" />
                </div>
                <div className="space-y-2">
                  <Label>Product Images</Label>
                  <div className="border-2 border-dashed border-border rounded-xl p-6 text-center hover:border-primary/50 transition-colors cursor-pointer">
                    <ImagePlus className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Click to upload or drag and drop
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">PNG, JPG up to 5MB</p>
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="pricing" className="space-y-4 pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="productPrice">Retail Price ($)</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="productPrice"
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="productCost">Cost ($)</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="productCost"
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        className="pl-10"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">Used to calculate margin</p>
                  </div>
                </div>
                <Card className="bg-secondary/30">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Calculated Margin</span>
                      <span className="text-lg font-semibold">-- %</span>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="inventory" className="space-y-4 pt-4">
                <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/30">
                  <div>
                    <p className="text-sm font-medium">Track Inventory</p>
                    <p className="text-xs text-muted-foreground">
                      Monitor stock levels and get low stock alerts
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="initialStock">Initial Stock Quantity</Label>
                    <Input id="initialStock" type="number" placeholder="0" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lowStockThreshold">Low Stock Threshold</Label>
                    <Input id="lowStockThreshold" type="number" placeholder="10" />
                    <p className="text-xs text-muted-foreground">
                      Alert when stock falls below this level
                    </p>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
            <DialogFooter className="mt-4">
              <Button variant="outline" onClick={() => setCreateOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => {
                  setCreateOpen(false);
                  toast({
                    title: "Product created",
                    description: "Your new product has been added to the catalog.",
                  });
                }}
              >
                Create Product
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Adjust Stock Dialog */}
        <Dialog open={adjustStockOpen} onOpenChange={setAdjustStockOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Adjust Stock</DialogTitle>
              <DialogDescription>
                {selectedProduct?.name}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="flex items-center justify-center gap-6">
                <div className="text-center">
                  <p className="text-xs text-muted-foreground mb-1">Current Stock</p>
                  <p className="text-2xl font-bold">{selectedProduct?.stockOnHand ?? 0}</p>
                </div>
                <div className="text-2xl text-muted-foreground">→</div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground mb-1">New Stock</p>
                  <p className="text-2xl font-bold">
                    {Math.max(0, (selectedProduct?.stockOnHand ?? 0) + stockAdjustment)}
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Adjustment Amount</Label>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setStockAdjustment((prev) => prev - 1)}
                  >
                    -
                  </Button>
                  <Input
                    type="number"
                    value={stockAdjustment}
                    onChange={(e) => setStockAdjustment(parseInt(e.target.value) || 0)}
                    className="text-center"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setStockAdjustment((prev) => prev + 1)}
                  >
                    +
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground text-center">
                  Use positive numbers to add stock, negative to remove
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="adjustReason">Reason (optional)</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select reason..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="received">Received from supplier</SelectItem>
                    <SelectItem value="sold">Sold</SelectItem>
                    <SelectItem value="damaged">Damaged/Defective</SelectItem>
                    <SelectItem value="returned">Customer return</SelectItem>
                    <SelectItem value="correction">Inventory correction</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAdjustStockOpen(false)}>
                Cancel
              </Button>
              <Button onClick={confirmStockAdjustment}>Confirm Adjustment</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </ManageLayout>
  );
}
