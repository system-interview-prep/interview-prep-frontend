import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/utils';

export const cardVariants = cva(
  'rounded-2xl transition-all duration-200 overflow-hidden',
  {
    variants: {
      variant: {
        default: 'bg-white border-2 border-[#204195]/15 shadow-sm',
        chunky: 'bg-white border-2 border-[#204195] shadow-[6px_6px_0_#204195]',
        interactive: 'bg-white border-2 border-[#204195]/20 shadow-md hover:border-[#204195] hover:shadow-xl hover:-translate-y-0.5',
        flat: 'bg-[#F8FAFC] border border-[#204195]/10',
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
