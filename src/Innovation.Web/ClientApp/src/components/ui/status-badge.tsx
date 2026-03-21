import { Badge } from "@/components/ui/badge"
import { getStatusColor, getPriorityColor } from "@/lib/constants"

interface StatusBadgeProps {
  status: string
  variant?: "status" | "priority"
  className?: string
}

export function StatusBadge({ status, variant = "status", className }: StatusBadgeProps) {
  const colorClass = variant === "status" ? getStatusColor(status) : getPriorityColor(status)

  return (
    <Badge variant="outline" className={`${colorClass} ${className || ""}`}>
      {status}
    </Badge>
  )
}
