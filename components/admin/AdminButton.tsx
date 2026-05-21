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
    "inline-flex items-center justify-center gap-2 font-bold tracking-tight transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none";

  const sizeClass =
    size === "sm"
      ? "text-xs px-4 py-2 rounded-lg"
      : size === "lg"
        ? "text-sm px-8 py-4 rounded-xl"
        : "text-sm px-6 py-3 rounded-xl";

  const variantClass =
    variant === "gradient"
      ? "bg-gradient-to-r from-primary to-tertiary text-white shadow-lg shadow-primary/20 hover:opacity-95"
      : variant === "primary"
        ? "bg-primary text-white shadow-lg shadow-primary/10 hover:bg-primary-container"
        : variant === "outline"
          ? "border border-outline-variant/20 bg-transparent text-primary hover:bg-surface-container"
          : variant === "surface"
            ? "bg-surface-container-lowest text-on-primary-fixed-variant border border-outline-variant/20 hover:bg-surface-container"
            : "bg-error-container/30 text-error hover:bg-error-container/50";

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

