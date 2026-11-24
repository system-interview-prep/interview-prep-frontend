import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/utils';

export const cardVariants = cva(
  'rounded-2xl transition-all duration-200 overflow-hidden',
  {
    variants: {
      variant: {
        default: 'bg-white rounded-2xl border border-slate-100 shadow-[0_4px_20px_-2px_rgba(32,65,149,0.05),0_2px_6px_-1px_rgba(0,0,0,0.02)] hover:-translate-y-0.5 hover:shadow-md transition-all duration-200',
        chunky: 'bg-white rounded-2xl border-2 border-[#204195] shadow-[6px_6px_0_#204195] hover:-translate-y-0.5 transition-all duration-200',
        interactive: 'bg-white rounded-2xl border border-slate-100 shadow-[0_4px_20px_-2px_rgba(32,65,149,0.05)] hover:border-[#FCB625] hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200',
        flat: 'bg-[#F8FAFC] rounded-2xl border border-slate-100',
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
