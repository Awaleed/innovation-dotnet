import * as React from "react"
import { useCallback, useEffect } from "react"
import { motion, useMotionTemplate, useMotionValue } from "motion/react"

import { cn } from "@/lib/utils"


interface CardProps extends React.ComponentProps<"div"> {
  enableMagicEffect?: boolean
  gradientSize?: number
  gradientOpacity?: number
}

function Card({ 
  className, 
  enableMagicEffect = true,
  gradientSize = 200,
  gradientOpacity = 0.15,
  children,
  style,
  ...props 
}: CardProps) {
  const mouseX = useMotionValue(-gradientSize)
  const mouseY = useMotionValue(-gradientSize)

  const reset = useCallback(() => {
    mouseX.set(-gradientSize)
    mouseY.set(-gradientSize)
  }, [gradientSize, mouseX, mouseY])

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!enableMagicEffect) return
      const rect = e.currentTarget.getBoundingClientRect()
      mouseX.set(e.clientX - rect.left)
      mouseY.set(e.clientY - rect.top)
    },
    [mouseX, mouseY, enableMagicEffect]
  )

  useEffect(() => {
    if (!enableMagicEffect) return
    reset()
  }, [reset, enableMagicEffect])

  useEffect(() => {
    if (!enableMagicEffect) return

    const handleGlobalPointerOut = (e: PointerEvent) => {
      if (!e.relatedTarget) {
        reset()
      }
    }

    const handleVisibility = () => {
      if (document.visibilityState !== "visible") {
        reset()
      }
    }

    window.addEventListener("pointerout", handleGlobalPointerOut)
    window.addEventListener("blur", reset)
    document.addEventListener("visibilitychange", handleVisibility)

    return () => {
      window.removeEventListener("pointerout", handleGlobalPointerOut)
      window.removeEventListener("blur", reset)
      document.removeEventListener("visibilitychange", handleVisibility)
    }
  }, [reset, enableMagicEffect])

  // Brand colors for gradient effect using CSS variables
  // Border gradient: Primary → Secondary (theme-aware gradient)
  const borderGradientFrom = 'var(--primary)'
  const borderGradientTo = 'var(--secondary)'
  // Hover glow: Muted (subtle accent)
  const hoverGlowColor = 'var(--muted)'

  if (!enableMagicEffect) {
    const hasCustomBackground = style && typeof style === 'object' && 'background' in style
    const hasPaddingOverride = className && /py-\d+|py-0/.test(className)
    
    return (
      <div
        data-slot="card"
        className={cn(
          "text-card-foreground flex flex-col gap-6 rounded-alinma-md border transition-all duration-200",
          // Only apply default padding if not overridden in className
          !hasPaddingOverride && "py-6",
          // Only apply bg-card if no custom background is provided
          !hasCustomBackground && "bg-card",
          className
        )}
        style={style}
        {...props}
      />
    )
  }

  return (
    <div
      data-slot="card"
      className={cn(
        "group relative flex flex-col gap-6 rounded-alinma-md border transition-all duration-200 py-6 overflow-hidden",
        className
      )}
      style={style}
      onPointerMove={handlePointerMove}
      onPointerLeave={reset}
      onPointerEnter={reset}
      {...props}
    >
      {/* Border gradient effect - Alinma Deep Blue → Lavender */}
      <motion.div
        className="pointer-events-none absolute inset-0 rounded-alinma-md duration-300 group-hover:opacity-100"
        style={{
          background: useMotionTemplate`
            radial-gradient(${gradientSize}px circle at ${mouseX}px ${mouseY}px,
            ${borderGradientFrom}, 
            ${borderGradientTo}, 
            transparent 100%
            )
          `,
        }}
      />
      
      {/* Background layer */}
      <div className="bg-card absolute inset-px rounded-alinma-md" />
      
      {/* Hover glow effect - Light Lavender */}
      <motion.div
        className="pointer-events-none absolute inset-px rounded-alinma-md opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background: useMotionTemplate`
            radial-gradient(${gradientSize}px circle at ${mouseX}px ${mouseY}px, ${hoverGlowColor}, transparent 100%)
          `,
          opacity: gradientOpacity,
        }}
      />
      
      {/* Content */}
      <div className="relative text-card-foreground">{children}</div>
    </div>
  )
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn("flex flex-col gap-1.5 px-6 mb-4", className)}
      {...props}
    />
  )
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-title"
      className={cn("leading-none font-semibold font-heading", className)}
      {...props}
    />
  )
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-description"
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  )
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-content"
      className={cn("px-6", className)}
      {...props}
    />
  )
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn("flex items-center px-6", className)}
      {...props}
    />
  )
}

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
