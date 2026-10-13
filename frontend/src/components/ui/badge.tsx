import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border border-indigo-200/80 bg-indigo-50 text-indigo-700 dark:border-indigo-500/30 dark:bg-indigo-600/20 dark:text-indigo-400",
        secondary:
          "border border-slate-200 bg-slate-100 text-slate-700 dark:bg-zinc-800 dark:text-zinc-300",
        destructive:
          "border border-rose-200/80 bg-rose-50 text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/20 dark:text-rose-400",
        outline:
          "border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-700 dark:text-zinc-400",
        success:
          "border border-emerald-200/80 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/20 dark:text-emerald-400",
        warning:
          "border border-amber-200/80 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/20 dark:text-amber-400",
        info:
          "border border-cyan-200/80 bg-cyan-50 text-cyan-700 dark:border-cyan-500/30 dark:bg-cyan-500/20 dark:text-cyan-400",
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
