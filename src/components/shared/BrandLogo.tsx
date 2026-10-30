/* eslint-disable @next/next/no-img-element */
import { cn } from "@/utils";

/**
 * The INTERVIA logo mark (public/logo.jpg), used wherever the product is
 * branded: admin sidebar, sign-in pages, the 404 page. Same file as the
 * candidate side, so both look like one product.
 */
export function BrandLogo({ size = 36, className }: { size?: number; className?: string }) {
  return (
    <span
      className={cn("grid shrink-0 place-items-center overflow-hidden rounded-xl border border-[#DCE4F3] bg-white", className)}
      style={{ width: size, height: size }}
    >
      {/* Zoomed onto the mark: the wordmark inside the image is unreadable at
          this size and the name is written next to it anyway. */}
      <img
        src="/logo.jpg"
        alt="INTERVIA"
        width={size}
        height={size}
        className="h-full w-full scale-[1.7] object-cover"
        style={{ transformOrigin: "50% 33%" }}
      />
    </span>
  );
}

export default BrandLogo;
