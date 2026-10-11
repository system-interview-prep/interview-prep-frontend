import { cn } from "@/utils";

export const FOX_DIRECTIONS_SHEET = "/mascot/intervia-fox-directions.webp?v=1";
export const FOX_REACTIONS_SHEET = "/mascot/intervia-fox-reactions.webp?v=1";

// Cells in the 3x3 reactions sheet, row by row (see Mascot.tsx).
const REACTION_CELL = {
  front: -1,
  heart: 1,
  sparkle: 2,
  wink: 4,
  delighted: 8,
} as const;

export type FoxAvatarPose = keyof typeof REACTION_CELL;

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
  const index = REACTION_CELL[pose];
  const fromReactions = index >= 0;
  return (
    <span
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className={cn("inline-block shrink-0 bg-no-repeat", className)}
      style={{
        width: size,
        height: size,
        backgroundImage: `url(${fromReactions ? FOX_REACTIONS_SHEET : FOX_DIRECTIONS_SHEET})`,
        backgroundSize: "300% 300%",
        // Center cell of the directions sheet is the fox looking at the viewer.
        backgroundPosition: cellPosition(fromReactions ? index : 4),
      }}
    />
  );
}

export default FoxAvatar;
