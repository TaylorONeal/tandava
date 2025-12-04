import { useState } from "react";
import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PromoVisualProps {
  videoUrl?: string;
  imageUrl?: string;
  alt: string;
  className?: string;
}

export function PromoVisual({
  videoUrl,
  imageUrl,
  alt,
  className,
}: PromoVisualProps) {
  const [key, setKey] = useState(0);

  const handleReplay = () => {
    setKey((prev) => prev + 1);
  };

  if (!videoUrl && !imageUrl) return null;

  return (
    <div className={cn("relative rounded-2xl overflow-hidden", className)}>
      {videoUrl ? (
        <>
          <video
            key={key}
            src={videoUrl}
            className="w-full h-full object-cover"
            autoPlay
            muted
            loop
            playsInline
          />
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={handleReplay}
            className="absolute bottom-2 right-2 bg-background/80 hover:bg-background text-foreground"
          >
            <RotateCcw className="h-3 w-3" />
          </Button>
        </>
      ) : imageUrl ? (
        <img
          src={imageUrl}
          alt={alt}
          className="w-full h-full object-cover"
        />
      ) : null}
    </div>
  );
}
