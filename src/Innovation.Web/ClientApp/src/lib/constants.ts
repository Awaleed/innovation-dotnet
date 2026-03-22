export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-800 border-gray-300',
    upcoming: 'bg-blue-100 text-blue-800 border-blue-300',
    open: 'bg-green-100 text-green-800 border-green-300',
    closed: 'bg-red-100 text-red-800 border-red-300',
    judging: 'bg-purple-100 text-purple-800 border-purple-300',
    voting: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    completed: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    cancelled: 'bg-slate-100 text-slate-800 border-slate-300',
  };
  return colors[status.toLowerCase()] ?? 'bg-gray-100 text-gray-800 border-gray-300';
}

export function getPriorityColor(priority: string): string {
  const colors: Record<string, string> = {
    high: 'bg-red-100 text-red-800 border-red-300',
    medium: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    low: 'bg-green-100 text-green-800 border-green-300',
  };
  return colors[priority.toLowerCase()] ?? 'bg-gray-100 text-gray-800 border-gray-300';
}
