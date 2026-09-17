import Link from "next/link";

type Variant = "gradient" | "primary" | "outline" | "surface" | "danger";
type Size = "sm" | "md" | "lg";

export default function AdminButton({
  children,
  href,
  icon,
  iconFill = false,
  variant = "primary",
  size = "md",
  className = "",
  type = "button",
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  href?: string;
  icon?: string;
  iconFill?: boolean;
  variant?: Variant;
  size?: Size;
  className?: string;
  type?: "button" | "submit" | "reset";
  onClick?: () => void;
  disabled?: boolean;
}) {
  const base =
    "inline-flex items-center justify-center gap-2 border-2 border-[#234196] font-bold tracking-tight transition-all active:translate-x-0.5 active:translate-y-0.5 active:shadow-none disabled:pointer-events-none disabled:opacity-50";

  const sizeClass =
    size === "sm"
      ? "text-xs px-4 py-2 rounded-lg"
      : size === "lg"
        ? "text-sm px-8 py-4 rounded-xl"
        : "text-sm px-6 py-3 rounded-xl";

  const variantClass =
    variant === "gradient"
      ? "bg-[#FCB625] text-[#234196] shadow-[3px_3px_0_#234196] hover:bg-[#FFC33F]"
      : variant === "primary"
        ? "bg-[#FCB625] text-[#234196] shadow-[3px_3px_0_#234196] hover:bg-[#FFC33F]"
        : variant === "outline"
          ? "bg-white text-[#234196] shadow-[3px_3px_0_#234196] hover:bg-[#F0F4FC]"
          : variant === "surface"
            ? "bg-white text-[#234196] shadow-[3px_3px_0_#234196] hover:bg-[#F0F4FC]"
            : "border-[#D32F2F] bg-[#FFEBEE] text-[#D32F2F] shadow-[3px_3px_0_#D32F2F] hover:bg-[#FFE1E5]";

  const cls = `${base} ${sizeClass} ${variantClass} ${className}`.trim();

  const iconNode = icon ? (
    <span
      className="material-symbols-outlined"
      data-icon={icon}
      style={iconFill ? { fontVariationSettings: "'FILL' 1" } : undefined}
    >
      {icon}
    </span>
  ) : null;

  if (href) {
    return (
      <Link className={cls} href={href}>
        {iconNode}
        {children}
      </Link>
    );
  }

  return (
    <button className={cls} type={type} onClick={onClick} disabled={disabled}>
      {iconNode}
      {children}
    </button>
  );
}

