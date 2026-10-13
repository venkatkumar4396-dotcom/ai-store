import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4F46E5] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-70 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 active:scale-[0.98] cursor-pointer",
  {
    variants: {
      variant: {
        default:
          "bg-[#4F46E5] text-white shadow-md hover:bg-[#4338CA] hover:-translate-y-px active:translate-y-0",
        destructive:
          "bg-[#B91C1C] text-white shadow-sm hover:bg-[#991B1B] active:bg-[#7F1D1D]",
        outline:
          "bg-white border-[1.5px] border-[#CBD5E1] text-[#1E1B4B] hover:border-[#4F46E5] hover:bg-[#EEF2FF] hover:text-[#4338CA] shadow-xs dark:bg-transparent dark:border-white/10 dark:text-zinc-200 dark:hover:bg-white/5",
        secondary:
          "bg-[#F1F5F9] text-[#334155] hover:bg-[#E2E8F0] dark:bg-white/10 dark:text-white dark:hover:bg-white/15",
        ghost:
          "text-[#475569] hover:bg-[#F1F5F9] hover:text-[#0F172A] dark:text-zinc-400 dark:hover:bg-white/5 dark:hover:text-white",
        link:
          "text-[#4F46E5] underline-offset-4 hover:underline dark:text-indigo-400",
      },
      size: {
        default: "h-10 px-5 py-2",
        sm: "h-8 rounded-lg px-3 text-xs",
        lg: "h-12 rounded-xl px-8 text-base",
        icon: "h-9 w-9 rounded-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
