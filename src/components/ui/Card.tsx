import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/utils';

export const cardVariants = cva(
  'rounded-2xl transition-all duration-200 overflow-hidden',
  {
    variants: {
      variant: {
        default: 'bg-white border border-slate-100 hover:-translate-y-0.5 hover:shadow-md transition-all duration-200',
        chunky: 'bg-white border-2 border-[#204195] shadow-[6px_6px_0_#204195] hover:-translate-y-0.5 transition-all duration-200',
        interactive: 'bg-white border border-slate-100 shadow-sm hover:border-[#204195]/40 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200',
        flat: 'bg-[#F8FAFC] border border-slate-100',
      },
      padding: {
        none: 'p-0',
        sm: 'p-4',
        md: 'p-6',
        lg: 'p-8',
      },
    },
    defaultVariants: {
      variant: 'default',
      padding: 'md',
    },
  }
);

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {}

export const Card: React.FC<CardProps> = ({
  className,
  variant,
  padding,
  children,
  ...props
}) => {
  return (
    <div
      className={cn(cardVariants({ variant, padding, className }))}
      {...props}
    >
      {children}
    </div>
  );
};

export default Card;
