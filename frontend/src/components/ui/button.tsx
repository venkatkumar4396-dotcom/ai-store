import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 active:scale-[0.98]",
  {
    variants: {
      variant: {
        default:
          "bg-indigo-600 text-[#ffffff] shadow-md shadow-indigo-600/10 hover:bg-indigo-500 hover:shadow-indigo-500/20 active:bg-indigo-700",
        destructive:
          "bg-rose-600 text-[#ffffff] shadow-sm hover:bg-rose-500 active:bg-rose-700",
        outline:
          "border border-white/10 bg-white/5 text-white backdrop-blur-sm hover:bg-white/10 hover:text-white active:bg-white/15",
        secondary:
          "bg-violet-600 text-[#ffffff] shadow-md shadow-violet-600/10 hover:bg-violet-500 hover:shadow-violet-500/20 active:bg-violet-700",
        ghost:
          "text-zinc-400 hover:bg-white/5 hover:text-white",
        link:
          "text-indigo-400 underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8 text-sm",
        icon: "h-9 w-9",
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
