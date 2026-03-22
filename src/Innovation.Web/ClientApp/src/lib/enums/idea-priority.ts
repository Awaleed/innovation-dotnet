export type IdeaPriority = 'high' | 'medium' | 'low';

export function getPriorityColor(priority: IdeaPriority): string {
  switch (priority) {
    case 'high': return 'red';
    case 'medium': return 'yellow';
    case 'low': return 'gray';
    default: return 'gray';
  }
}

export function getPriorityLabel(priority: IdeaPriority): string {
  switch (priority) {
    case 'high': return 'High';
    case 'medium': return 'Medium';
    case 'low': return 'Low';
    default: return 'Unknown';
  }
}
