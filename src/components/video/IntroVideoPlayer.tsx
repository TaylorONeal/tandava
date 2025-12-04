import { useState, useRef } from "react";
import { Play, Pause, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface IntroVideoPlayerProps {
  videoUrl: string;
  thumbnailUrl?: string;
  title: string;
  className?: string;
}

export function IntroVideoPlayer({
  videoUrl,
  thumbnailUrl,
  title,
  className,
}: IntroVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showVideo, setShowVideo] = useState(false);

  const handlePlay = () => {
    setShowVideo(true);
    setTimeout(() => {
      if (videoRef.current) {
        videoRef.current.play();
        setIsPlaying(true);
      }
    }, 100);
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  return (
    <div className={cn("relative rounded-2xl overflow-hidden bg-muted", className)}>
      {!showVideo ? (
        // Thumbnail with play button
        <div className="relative aspect-video">
          {thumbnailUrl ? (
            <img
              src={thumbnailUrl}
              alt={title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/20 to-accent-lilac/30" />
          )}
          <div className="absolute inset-0 bg-foreground/20 flex items-center justify-center">
            <button
              onClick={handlePlay}
              className="h-16 w-16 rounded-full bg-primary flex items-center justify-center shadow-lg hover:scale-105 transition-transform"
            >
              <Play className="h-7 w-7 text-primary-foreground ml-1" />
            </button>
          </div>
          <div className="absolute bottom-3 left-3 right-3">
            <p className="text-sm text-background font-medium drop-shadow-md">
              {title}
            </p>
          </div>
        </div>
      ) : (
        // Video player
        <div className="relative aspect-video">
          <video
            ref={videoRef}
            src={videoUrl}
            className="w-full h-full object-cover"
            onEnded={() => setIsPlaying(false)}
            playsInline
          />
          
          {/* Controls overlay */}
          <div className="absolute bottom-0 inset-x-0 p-3 bg-gradient-to-t from-foreground/60 to-transparent">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={togglePlay}
                className="text-background hover:text-background hover:bg-background/20"
              >
                {isPlaying ? (
                  <Pause className="h-4 w-4" />
                ) : (
                  <Play className="h-4 w-4 ml-0.5" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={toggleMute}
                className="text-background hover:text-background hover:bg-background/20"
              >
                {isMuted ? (
                  <VolumeX className="h-4 w-4" />
                ) : (
                  <Volume2 className="h-4 w-4" />
                )}
              </Button>
              <span className="text-xs text-background ml-auto">{title}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
