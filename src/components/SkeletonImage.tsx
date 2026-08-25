import { useEffect, useRef, useState, type ImgHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

interface SkeletonImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, "src"> {
  src?: string | null | undefined;
  className?: string;
  wrapperClassName?: string;
  skeletonClassName?: string;
  fallbackSrc?: string;
}

export function SkeletonImage({
  src,
  className,
  wrapperClassName,
  skeletonClassName,
  fallbackSrc,
  alt = "",
  ...imgProps
}: SkeletonImageProps) {
  const imgRef = useRef<HTMLImageElement>(null);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(src ?? "");

  useEffect(() => {
    setCurrentSrc(src ?? "");
    setFailed(false);

    const cached = imgRef.current?.complete && (imgRef.current?.naturalWidth ?? 0) > 0;
    setLoaded(Boolean(src) && Boolean(cached));
  }, [src]);

  const showSkeleton = !loaded && !failed;

  return (
    <span className={cn("relative block h-full w-full overflow-hidden", wrapperClassName)}>
      {showSkeleton && (
        <span
          aria-hidden="true"
          className={cn(
            "absolute inset-0 z-10 block animate-shimmer bg-[linear-gradient(90deg,#ececec_25%,#f7f7f7_37%,#ececec_63%)] bg-[length:400%_100%]",
            skeletonClassName,
          )}
        />
      )}

      {failed && (
        <span
          aria-hidden="true"
          className={cn("absolute inset-0 z-10 block bg-[#efefef]", skeletonClassName)}
        />
      )}

      {currentSrc && (
        <img
          ref={imgRef}
          src={currentSrc}
          alt={alt}
          referrerPolicy="no-referrer"
          onLoad={() => setLoaded(true)}
          onError={() => {
            if (fallbackSrc && currentSrc !== fallbackSrc) {
              setCurrentSrc(fallbackSrc);
              return;
            }
            setFailed(true);
          }}
          className={cn(
            "h-full w-full object-cover transition-opacity duration-300",
            loaded ? "opacity-100" : "opacity-0",
            className,
          )}
          {...imgProps}
        />
      )}
    </span>
  );
}
