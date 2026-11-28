import { cn } from "@/utils";

export const FOX_DIRECTIONS_SHEET = "/mascot/intervia-fox-directions.webp?v=1";
export const FOX_REACTIONS_SHEET = "/mascot/intervia-fox-reactions.webp?v=1";

// Cells in the 3x3 sheets, row by row (see Mascot.tsx): "directions" for where
// the fox looks, "reactions" for its face.
const POSES = {
  front: { sheet: "directions", cell: 4 },
  think: { sheet: "directions", cell: 0 },
  heart: { sheet: "reactions", cell: 1 },
  sparkle: { sheet: "reactions", cell: 2 },
  surprised: { sheet: "reactions", cell: 3 },
  wink: { sheet: "reactions", cell: 4 },
  sleepy: { sheet: "reactions", cell: 6 },
  dizzy: { sheet: "reactions", cell: 7 },
  delighted: { sheet: "reactions", cell: 8 },
} as const;

export type FoxAvatarPose = keyof typeof POSES;

function cellPosition(index: number) {
  return `${(index % 3) * 50}% ${Math.floor(index / 3) * 50}%`;
}

/**
 * A still frame of the fox, used where an icon would otherwise sit
 * (brand mark, empty states, minimized mascot).
 */
export function FoxAvatar({
  size = 36,
  pose = "front",
  className,
  label,
}: {
  size?: number;
  pose?: FoxAvatarPose;
  className?: string;
  /** Leave empty when the fox is decorative. */
  label?: string;
}) {
  const { sheet, cell } = POSES[pose];
  return (
    <span
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className={cn("inline-block shrink-0 bg-no-repeat", className)}
      style={{
        width: size,
        height: size,
        backgroundImage: `url(${sheet === "reactions" ? FOX_REACTIONS_SHEET : FOX_DIRECTIONS_SHEET})`,
        backgroundSize: "300% 300%",
        backgroundPosition: cellPosition(cell),
      }}
    />
  );
}

export default FoxAvatar;
