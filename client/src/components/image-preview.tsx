import { useState } from "react";
import { Theater, Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface ImagePreviewProps {
  src?: string;
  alt: string;
  title?: string;
  subtitle?: string;
  className?: string;
  fallbackIcon?: React.ReactNode;
  showOverlay?: boolean;
  aspectRatio?: "square" | "portrait" | "landscape" | "auto";
  onError?: () => void;
}

export function ImagePreview({
  src,
  alt,
  title,
  subtitle,
  className = "",
  fallbackIcon,
  showOverlay = false,
  aspectRatio = "auto",
  onError
}: ImagePreviewProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const handleImageLoad = () => {
    setImageLoaded(true);
    setImageError(false);
  };

  const handleImageError = () => {
    setImageError(true);
    setImageLoaded(false);
    onError?.();
  };

  const getAspectRatioClass = () => {
    switch (aspectRatio) {
      case "square":
        return "aspect-square";
      case "portrait":
        return "aspect-[3/4]";
      case "landscape":
        return "aspect-[4/3]";
      default:
        return "aspect-auto";
    }
  };

  const defaultFallbackIcon = fallbackIcon || <Theater className="w-24 h-24 text-claret-yellow" />;

  if (!src || imageError) {
    return (
      <div className={cn(
        "w-full bg-gradient-to-br from-claret-blue to-claret-navy rounded-xl shadow-2xl flex items-center justify-center",
        getAspectRatioClass(),
        className
      )}>
        <div className="text-center text-white">
          {defaultFallbackIcon}
          {title && (
            <h3 className="text-2xl font-bold mb-2 mt-4">{title}</h3>
          )}
          {subtitle && (
            <p className="text-blue-200">{subtitle}</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("relative group", className)}>
      {/* Loading state */}
      {!imageLoaded && (
        <div className={cn(
          "absolute inset-0 bg-gray-200 rounded-xl flex items-center justify-center z-10",
          getAspectRatioClass()
        )}>
          <div className="text-center">
            <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-2 animate-pulse" />
            <p className="text-sm text-gray-500">Cargando imagen...</p>
          </div>
        </div>
      )}

      {/* Main image */}
      <img
        src={src}
        alt={alt}
        className={cn(
          "w-full h-auto rounded-xl shadow-2xl object-cover transition-all duration-300",
          getAspectRatioClass(),
          showOverlay && "group-hover:scale-105",
          imageLoaded ? "opacity-100" : "opacity-0"
        )}
        onLoad={handleImageLoad}
        onError={handleImageError}
      />

      {/* Hover overlay */}
      {showOverlay && (
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-300 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100">
          <div className="text-center text-white transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
            <Theater className="w-16 h-16 text-claret-yellow mx-auto mb-3" />
            {title && (
              <h3 className="text-xl font-bold mb-1">{title}</h3>
            )}
            {subtitle && (
              <p className="text-yellow-200">{subtitle}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
