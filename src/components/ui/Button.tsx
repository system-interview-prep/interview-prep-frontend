import React from 'react';
import Link from 'next/link';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/utils';
import { Sparkles, UserPlus, Plus, Headset, HelpCircle } from 'lucide-react';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  auto_awesome: Sparkles,
  person_add: UserPlus,
  add: Plus,
  support_agent: Headset,
  help: HelpCircle,
};

export const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 font-bold tracking-tight transition-all duration-200 active:scale-95 disabled:pointer-events-none disabled:opacity-50 select-none cursor-pointer',
  {
    variants: {
      variant: {
        primary:
          'bg-[#204195] text-white hover:bg-[#183275] hover:shadow-[0_0_14px_rgba(252,182,37,0.35)] active:scale-[0.98]',
        secondary:
          'bg-[#FCB625] text-[#204195] hover:bg-[#E59E10] shadow-[0_4px_14px_rgba(252,182,37,0.35)]',
        ghost:
          'bg-transparent text-[#204195] hover:bg-[#204195]/10',
        danger:
          'border-2 border-[#D32F2F] bg-[#FFEBEE] text-[#D32F2F] shadow-[3px_3px_0_#D32F2F] hover:bg-[#FFE1E5]',
        gradient:
          'bg-[#FCB625] text-[#204195] border-2 border-[#204195] shadow-[3px_3px_0_#204195] hover:bg-[#FFC33F]',
        outline:
          'bg-white text-[#204195] border-2 border-[#204195] hover:bg-[#204195] hover:text-white',
        surface:
          'bg-white text-[#204195] border-2 border-[#204195] shadow-[3px_3px_0_#204195] hover:bg-[#F0F4FC]',
        admin:
          'bg-[#FCB625] text-[#204195] border-2 border-[#204195] shadow-[3px_3px_0_#204195] hover:bg-[#FFC33F]',
      },
      size: {
        sm: 'px-3 py-1.5 text-xs rounded-lg',
        md: 'px-4 py-2 text-sm rounded-xl',
        lg: 'px-6 py-3 text-base rounded-2xl',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  href?: string;
  icon?: React.ReactNode;
  iconFill?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  className,
  variant,
  size,
  children,
  href,
  icon,
  iconFill = false,
  ...props
}) => {
  const cls = cn(buttonVariants({ variant, size, className }));

  let iconNode: React.ReactNode = null;
  if (icon) {
    if (typeof icon === 'string') {
      const IconComponent = iconMap[icon];
      if (IconComponent) {
        iconNode = <IconComponent className="size-4 shrink-0" />;
      } else {
        iconNode = <span className="inline-flex text-sm">{icon}</span>;
      }
    } else {
      iconNode = icon;
    }
  }

  if (href) {
    return (
      <Link href={href} className={cls}>
        {iconNode}
        {children}
      </Link>
    );
  }

  return (
    <button className={cls} {...props}>
      {iconNode}
      {children}
    </button>
  );
};

export default Button;
