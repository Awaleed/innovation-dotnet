import * as React from "react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => (
    <input
      type={type}
      ref={ref}
      data-slot="input"
      data-testid="input"
      className={cn(
        "flex h-9 w-full min-w-0 rounded-alinma-xs border border-input bg-white px-3 py-1 text-base shadow-xs transition-all duration-200 outline-none",
        "placeholder:text-muted-foreground selection:bg-accent selection:text-accent-foreground",
        "file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
        "focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:shadow-sm",
        "hover:border-ring/50",
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        "aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/50",
        "md:text-sm",
        className
      )}
      {...props}
    />
  )
)
Input.displayName = "Input"

export { Input }
