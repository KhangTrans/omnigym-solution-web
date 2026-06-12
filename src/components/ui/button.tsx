import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow hover:bg-primary hover:text-primary-foreground",
        destructive: "border border-red-200 bg-red-50 text-red-600 shadow-sm hover:bg-red-100 hover:text-red-700",
        "danger-glass": "border border-red-200/80 bg-red-50/70 text-red-600 shadow-sm shadow-red-950/5 backdrop-blur hover:border-red-300 hover:bg-red-100/80 hover:text-red-700",
        outline:
          "border border-input bg-background text-foreground shadow-sm hover:bg-background hover:text-foreground hover:border-input",
        secondary: "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
        "success-glass": "border border-emerald-200/80 bg-emerald-50/70 text-emerald-700 shadow-sm shadow-emerald-950/5 backdrop-blur hover:border-emerald-300 hover:bg-emerald-100/80 hover:text-emerald-800",
        ghost: "hover:bg-background hover:text-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        // Custom emerald variant for primary actions
        emerald: "bg-emerald-600 text-white hover:bg-emerald-700 shadow-md",
        // Emerald outline for secondary actions (matches non‑center button style)
        "emerald-outline": "border border-slate-200 bg-white hover:bg-slate-50 text-slate-700",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
