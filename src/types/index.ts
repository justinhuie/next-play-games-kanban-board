export type Status = 'todo' | 'in_progress' | 'in_review' | 'done'
export type Priority = 'low' | 'normal' | 'high'

export interface Task {
  id: string
  title: string
  description: string | null
  status: Status
  priority: Priority
  due_date: string | null
  position: number
  user_id: string
  created_at: string
  updated_at: string
  assignees: TeamMember[]
  labels: Label[]
}

export interface Comment {
  id: string
  task_id: string
  user_id: string
  content: string
  created_at: string
}

export interface ActivityLog {
  id: string
  task_id: string
  user_id: string
  action: string
  old_value: string | null
  new_value: string | null
  created_at: string
}

export interface Label {
  id: string
  name: string
  color: string
  user_id: string
}

export interface TeamMember {
  id: string
  name: string
  color: string
  user_id: string
}

export const COLUMNS: {
  id: Status
  label: string
  dot: string
  ring: string
  headerColor: string
  emptyText: string
}[] = [
  {
    id: 'todo',
    label: 'To Do',
    dot: 'bg-slate-400',
    ring: 'ring-slate-200',
    headerColor: 'text-slate-600',
    emptyText: 'No tasks to do',
  },
  {
    id: 'in_progress',
    label: 'In Progress',
    dot: 'bg-blue-500',
    ring: 'ring-blue-200',
    headerColor: 'text-blue-600',
    emptyText: 'Nothing in progress',
  },
  {
    id: 'in_review',
    label: 'In Review',
    dot: 'bg-amber-500',
    ring: 'ring-amber-200',
    headerColor: 'text-amber-600',
    emptyText: 'Nothing in review',
  },
  {
    id: 'done',
    label: 'Done',
    dot: 'bg-emerald-500',
    ring: 'ring-emerald-200',
    headerColor: 'text-emerald-600',
    emptyText: 'Nothing completed yet',
  },
]

export const STATUS_LABELS: Record<Status, string> = {
  todo: 'To Do',
  in_progress: 'In Progress',
  in_review: 'In Review',
  done: 'Done',
}

export const PRIORITY_CONFIG: Record<Priority, { label: string; dot: string; text: string }> = {
  high: { label: 'High', dot: 'bg-red-500', text: 'text-red-600' },
  normal: { label: 'Normal', dot: 'bg-blue-400', text: 'text-blue-600' },
  low: { label: 'Low', dot: 'bg-slate-300', text: 'text-slate-500' },
}
