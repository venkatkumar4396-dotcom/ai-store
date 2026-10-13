import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-[0.06em] transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border border-[#C7D2FE] bg-[#EEF2FF] text-[#4338CA] dark:border-indigo-500/30 dark:bg-indigo-600/20 dark:text-indigo-400",
        secondary:
          "border border-[#CBD5E1] bg-[#F1F5F9] text-[#334155] dark:bg-zinc-800 dark:text-zinc-300",
        destructive:
          "border border-[#FECACA] bg-[#FEE2E2] text-[#B91C1C] dark:border-rose-500/30 dark:bg-rose-500/20 dark:text-rose-400",
        outline:
          "border border-[#CBD5E1] dark:border-white/10 bg-white dark:bg-white/5 text-[#334155] dark:text-zinc-400",
        success:
          "border border-[#BBF7D0] bg-[#DCFCE7] text-[#166534] dark:border-emerald-500/30 dark:bg-emerald-500/20 dark:text-emerald-400",
        warning:
          "border border-[#FDE68A] bg-[#FEF3C7] text-[#92400E] dark:border-amber-500/30 dark:bg-amber-500/20 dark:text-amber-400",
        info:
          "border border-[#BAE6FD] bg-[#E0F2FE] text-[#0369A1] dark:border-cyan-500/30 dark:bg-cyan-500/20 dark:text-cyan-400",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
