import * as React from "react"
import * as SheetPrimitive from "@radix-ui/react-dialog"
import { XIcon, MaximizeIcon, MinimizeIcon, GripVerticalIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { useRTL } from "../rtl-provider"
import { Button } from "./button"

function Sheet({ ...props }: React.ComponentProps<typeof SheetPrimitive.Root>) {
  return <SheetPrimitive.Root data-slot="sheet" {...props} />
}

function SheetTrigger({
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Trigger>) {
  return <SheetPrimitive.Trigger data-slot="sheet-trigger" {...props} />
}

function SheetClose({
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Close>) {
  return <SheetPrimitive.Close data-slot="sheet-close" {...props} />
}

function SheetPortal({
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Portal>) {
  return <SheetPrimitive.Portal data-slot="sheet-portal" {...props} />
}

function SheetOverlay({
  className,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Overlay>) {
  return (
    <SheetPrimitive.Overlay
      data-slot="sheet-overlay"
      className={cn(
        "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/60",
        "sheet-overlay-progressive-blur",
        className
      )}
      style={{
        backdropFilter: 'blur(0px)',
        WebkitBackdropFilter: 'blur(0px)',
        backgroundColor: 'rgba(0, 0, 0, 0)',
        animation: 'progressive-overlay-in 700ms ease-in-out forwards',
      }}
      {...props}
    />
  )
}

const SHEET_WIDTHS = {
  sm: "sm:max-w-sm",
  md: "sm:max-w-md",
  lg: "sm:max-w-lg",
  xl: "sm:max-w-xl",
  "2xl": "sm:max-w-2xl",
  full: "sm:max-w-full"
} as const

type SheetWidth = keyof typeof SHEET_WIDTHS

interface SheetContentProps extends React.ComponentProps<typeof SheetPrimitive.Content> {
  side?: "top" | "right" | "bottom" | "left" | "start" | "end"
  resizable?: boolean
  maximizable?: boolean
  defaultMaximized?: boolean
  defaultWidth?: SheetWidth
  minWidth?: string
  onWidthChange?: (width: SheetWidth) => void
  headerActions?: React.ReactNode
}

function SheetContent({
  className,
  children,
  side = "right",
  resizable = false,
  maximizable = false,
  defaultMaximized = false,
  defaultWidth = "sm",
  minWidth = "320px",
  onWidthChange,
  headerActions,
  ...props
}: SheetContentProps) {

  const {isRtl} = useRTL();
  const [isMaximized, setIsMaximized] = React.useState(defaultMaximized)
  const [currentWidth, setCurrentWidth] = React.useState<SheetWidth>(defaultWidth)
  const [isResizing, setIsResizing] = React.useState(false)
  const contentRef = React.useRef<HTMLDivElement>(null)

  if(side == "start" || side == "end") {
    side = isRtl ?  "left" : "right";
  }

  const handleMaximize = () => {
    const newMaximized = !isMaximized
    setIsMaximized(newMaximized)
    const newWidth = newMaximized ? "full" : defaultWidth
    setCurrentWidth(newWidth)
    onWidthChange?.(newWidth)
  }

  const handleResizeStart = (e: React.MouseEvent) => {
    if (!resizable || !contentRef.current) return

    setIsResizing(true)
    const startX = e.clientX
    const startWidth = contentRef.current.offsetWidth

    const handleMouseMove = (e: MouseEvent) => {
      if (!contentRef.current) return

      const deltaX = side === "right" ? startX - e.clientX : e.clientX - startX
      const newWidth = Math.min(Math.max(startWidth + deltaX, parseInt(minWidth)), window.innerWidth * 0.9)

      contentRef.current.style.maxWidth = `${newWidth}px`
      contentRef.current.style.width = `${newWidth}px`
      contentRef.current.style.minWidth = `${newWidth}px`
    }

    const handleMouseUp = () => {
      setIsResizing(false)
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }

  const getWidthClass = () => {
    if (isMaximized) return "sm:max-w-full w-full"
    return SHEET_WIDTHS[currentWidth]
  }

  return (
    <SheetPortal>
      <SheetOverlay />
      <SheetPrimitive.Content
        ref={contentRef}
        data-slot="sheet-content"
        className={cn(
          "bg-background data-[state=open]:animate-in data-[state=closed]:animate-out fixed z-50 flex flex-col gap-4 shadow-lg transition-all ease-in-out data-[state=closed]:duration-300 data-[state=open]:duration-[700ms] p-4",
          side === "right" &&
            `data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right inset-y-0 right-0 h-full w-3/4 border-l ${getWidthClass()}`,
          side === "left" &&
            `data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left inset-y-0 left-0 h-full w-3/4 border-r ${getWidthClass()}`,
          side === "top" &&
            "data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top inset-x-0 top-0 h-auto border-b",
          side === "bottom" &&
            "data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom inset-x-0 bottom-0 h-auto border-t",
          isResizing && "select-none",
          className
        )}
        {...props}
      >
        {/* Header Controls */}
        {(maximizable || headerActions) && (
          <div className="absolute top-2 right-2 rtl:right-auto rtl:left-2 flex items-center gap-1 z-10">
            {headerActions}

            {maximizable && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleMaximize}
                className="h-6 w-6 p-0 flex items-center justify-center"
              >
                {isMaximized ? <MinimizeIcon className="size-3" /> : <MaximizeIcon className="size-3" />}
              </Button>
            )}

            <SheetPrimitive.Close className="ring-offset-background focus:ring-ring data-[state=open]:bg-secondary h-6 w-6 p-0 rounded-xs opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none flex items-center justify-center">
              <XIcon className="size-3" />
              <span className="sr-only">Close</span>
            </SheetPrimitive.Close>
          </div>
        )}

        {/* Default close button */}
        {!maximizable && !headerActions && (
          <SheetPrimitive.Close className="ring-offset-background focus:ring-ring data-[state=open]:bg-secondary absolute top-4 right-4 rtl:right-auto rtl:left-4 rounded-xs opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none">
            <XIcon className="size-4" />
            <span className="sr-only">Close</span>
          </SheetPrimitive.Close>
        )}

        {/* Resize handle */}
        {resizable && !isMaximized && (side === "right" || side === "left") && (
          <div
            className={cn(
              "absolute top-0 bottom-0 w-1 cursor-col-resize hover:bg-border transition-colors block group",
              side === "right" ? "left-0" : "right-0"
            )}
            onMouseDown={handleResizeStart}
          >
            <div className={cn(
              "absolute top-1/2 -translate-y-1/2 w-4 h-8 flex items-center justify-center bg-muted rounded-sm opacity-0 group-hover:opacity-100 transition-opacity",
              side === "right" ? "-left-2" : "-right-2"
            )}>
              <GripVerticalIcon className="size-3 text-muted-foreground" />
            </div>
          </div>
        )}

        {children}
      </SheetPrimitive.Content>
    </SheetPortal>
  )
}

function SheetHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-header"
      className={cn("flex flex-col gap-1.5 p-4", className)}
      {...props}
    />
  )
}

function SheetFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-footer"
      className={cn("mt-auto flex flex-col gap-2 p-4", className)}
      {...props}
    />
  )
}

function SheetTitle({
  className,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Title>) {
  return (
    <SheetPrimitive.Title
      data-slot="sheet-title"
      className={cn("text-foreground font-semibold", className)}
      {...props}
    />
  )
}

function SheetDescription({
  className,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Description>) {
  return (
    <SheetPrimitive.Description
      data-slot="sheet-description"
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  )
}

export {
  Sheet,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
}
