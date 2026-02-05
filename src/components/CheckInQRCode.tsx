import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  QrCode,
  Smartphone,
  RefreshCw,
  Download,
  Wallet,
  Clock,
  CheckCircle2,
  Copy,
  ExternalLink,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CheckInQRCodeProps {
  memberName: string;
  studioName: string;
  expiresAt?: string;
  showWalletOptions?: boolean;
  compact?: boolean;
}

// Simple QR code visualization (in production, use a QR library like qrcode.react)
function QRCodeDisplay({ data, size = 200 }: { data: string; size?: number }) {
  // This creates a visual placeholder that looks like a QR code
  // In production, use: import QRCode from 'qrcode.react'; <QRCode value={data} size={size} />
  const cells = 25;
  const cellSize = size / cells;

  // Generate pseudo-random pattern based on data hash
  const pattern = Array.from({ length: cells * cells }, (_, i) => {
    const hash = data.split('').reduce((acc, char, idx) => acc + char.charCodeAt(0) * (idx + i + 1), 0);
    return (hash + i * 7) % 3 !== 0;
  });

  return (
    <div
      className="relative bg-white p-4 rounded-xl inline-block"
      style={{ width: size + 32, height: size + 32 }}
    >
      <svg width={size} height={size} viewBox={`0 0 ${cells} ${cells}`}>
        {/* Corner patterns (finder patterns) */}
        <rect x="0" y="0" width="7" height="7" fill="black" />
        <rect x="1" y="1" width="5" height="5" fill="white" />
        <rect x="2" y="2" width="3" height="3" fill="black" />

        <rect x={cells - 7} y="0" width="7" height="7" fill="black" />
        <rect x={cells - 6} y="1" width="5" height="5" fill="white" />
        <rect x={cells - 5} y="2" width="3" height="3" fill="black" />

        <rect x="0" y={cells - 7} width="7" height="7" fill="black" />
        <rect x="1" y={cells - 6} width="5" height="5" fill="white" />
        <rect x="2" y={cells - 5} width="3" height="3" fill="black" />

        {/* Data cells */}
        {pattern.map((filled, i) => {
          const x = i % cells;
          const y = Math.floor(i / cells);

          // Skip finder pattern areas
          if ((x < 8 && y < 8) || (x >= cells - 8 && y < 8) || (x < 8 && y >= cells - 8)) {
            return null;
          }

          return filled ? (
            <rect
              key={i}
              x={x}
              y={y}
              width="1"
              height="1"
              fill="black"
            />
          ) : null;
        })}
      </svg>
    </div>
  );
}

export function CheckInQRCode({
  memberName,
  studioName,
  expiresAt,
  showWalletOptions = true,
  compact = false,
}: CheckInQRCodeProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { toast } = useToast();

  // Mock QR data - in production this comes from the API
  const qrData = JSON.stringify({
    v: 1,
    m: "abc12345",
    s: "xyz98765",
    t: "mock-token-" + Date.now(),
    e: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60,
  });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsRefreshing(false);
    toast({
      title: "QR Code Refreshed",
      description: "Your check-in code has been updated.",
    });
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText("CHECKIN-ABC123");
    toast({
      title: "Code Copied",
      description: "Manual check-in code copied to clipboard.",
    });
  };

  const handleAddToWallet = (wallet: "apple" | "google") => {
    toast({
      title: `Adding to ${wallet === "apple" ? "Apple" : "Google"} Wallet`,
      description: "This would open the wallet pass in production.",
    });
  };

  const daysUntilExpiry = expiresAt
    ? Math.ceil((new Date(expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : 7;

  if (compact) {
    return (
      <div className="flex items-center gap-4 p-4 rounded-xl bg-secondary/30">
        <div className="shrink-0">
          <QRCodeDisplay data={qrData} size={80} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm">Your Check-In Code</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Scan at the studio kiosk for quick check-in
          </p>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="outline" className="text-xs">
              <Clock className="h-3 w-3 mr-1" />
              {daysUntilExpiry}d left
            </Badge>
            <Button variant="ghost" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
              <RefreshCw className={`h-3 w-3 ${isRefreshing ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2">
          <QrCode className="h-5 w-5" />
          Check-In QR Code
        </CardTitle>
        <CardDescription>
          Scan this code at the {studioName} kiosk for instant check-in
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* QR Code Display */}
        <div className="flex justify-center">
          <div className="relative">
            <QRCodeDisplay data={qrData} size={200} />
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2">
              <Badge className="bg-accent-sage text-white">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Active
              </Badge>
            </div>
          </div>
        </div>

        {/* Member Info */}
        <div className="text-center">
          <p className="font-semibold">{memberName}</p>
          <p className="text-sm text-muted-foreground">
            Valid for {daysUntilExpiry} more days
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={handleCopyCode}>
            <Copy className="h-4 w-4 mr-2" />
            Copy Code
          </Button>
        </div>

        {/* Wallet Options */}
        {showWalletOptions && (
          <div className="space-y-3 pt-4 border-t">
            <p className="text-sm text-center text-muted-foreground">
              Add to your phone's wallet for even faster check-in
            </p>
            <div className="flex items-center justify-center gap-3">
              <Button
                variant="outline"
                className="flex-1 max-w-[160px]"
                onClick={() => handleAddToWallet("apple")}
              >
                <Wallet className="h-4 w-4 mr-2" />
                Apple Wallet
              </Button>
              <Button
                variant="outline"
                className="flex-1 max-w-[160px]"
                onClick={() => handleAddToWallet("google")}
              >
                <Smartphone className="h-4 w-4 mr-2" />
                Google Wallet
              </Button>
            </div>
          </div>
        )}

        {/* Manual Code Fallback */}
        <div className="p-3 rounded-lg bg-secondary/50 text-center">
          <p className="text-xs text-muted-foreground mb-1">
            Can't scan? Use this code at the front desk:
          </p>
          <button
            onClick={handleCopyCode}
            className="font-mono text-lg font-bold tracking-wider hover:text-primary transition-colors"
          >
            CHECKIN-ABC123
          </button>
        </div>

        {/* Help Link */}
        <p className="text-xs text-center text-muted-foreground">
          <a href="#" className="inline-flex items-center gap-1 hover:text-primary">
            How does check-in work?
            <ExternalLink className="h-3 w-3" />
          </a>
        </p>
      </CardContent>
    </Card>
  );
}

// Export a hook for managing QR code state (for use in account pages)
export function useCheckInCode(studioId: string) {
  const [code, setCode] = useState<{
    token: string;
    qrData: string;
    expiresAt: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const refreshCode = async () => {
    setIsLoading(true);
    // In production: call API to generate/refresh code
    await new Promise(resolve => setTimeout(resolve, 500));
    setCode({
      token: "mock-token-" + Date.now(),
      qrData: JSON.stringify({ v: 1, t: Date.now() }),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    });
    setIsLoading(false);
  };

  return { code, isLoading, refreshCode };
}
