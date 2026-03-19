import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { Task } from '../types'
import { PRIORITY_CONFIG } from '../types'

function getDueDateStatus(dueDate: string | null, status: string) {
  if (!dueDate || status === 'done') return null
  const due = new Date(dueDate)
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const diffDays = Math.ceil(
    (due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  )
  if (diffDays < 0)
    return {
      label: `${Math.abs(diffDays)}d overdue`,
      cls: 'bg-red-50 text-red-600 ring-1 ring-red-200',
    }
  if (diffDays === 0)
    return { label: 'Due today', cls: 'bg-orange-50 text-orange-600 ring-1 ring-orange-200' }
  if (diffDays <= 3)
    return {
      label: `${diffDays}d left`,
      cls: diffDays <= 1
        ? 'bg-orange-50 text-orange-600 ring-1 ring-orange-300'
        : 'bg-amber-50 text-amber-600 ring-1 ring-amber-200',
    }
  return {
    label: due.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    cls: 'bg-slate-50 text-slate-500 ring-1 ring-slate-200',
  }
}

interface TaskCardProps {
  task: Task
  onClick: () => void
}

export function TaskCard({ task, onClick }: TaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    touchAction: 'none',
  }

  const priority = PRIORITY_CONFIG[task.priority]
  const dueDateStatus = getDueDateStatus(task.due_date, task.status)

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onClick={onClick}
      className={`rounded-xl border p-3.5 cursor-pointer select-none transition-all duration-150 ${
        isDragging
          ? 'opacity-0'
          : task.status === 'done'
          ? 'bg-emerald-50 border-emerald-100 shadow-sm hover:shadow-md hover:border-emerald-200 hover:-translate-y-0.5'
          : 'bg-white border-slate-100 shadow-sm hover:shadow-md hover:border-slate-200 hover:-translate-y-0.5'
      }`}
    >
      {/* Priority + title */}
      <div className="flex items-start gap-2.5">
        <div
          className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${priority.dot}`}
        />
        <p className="text-sm font-medium text-slate-800 leading-snug line-clamp-2 flex-1">
          {task.title}
        </p>
      </div>

      {/* Labels */}
      {task.labels.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2.5 ml-4.5">
          {task.labels.map((label) => (
            <span
              key={label.id}
              className="text-xs px-2 py-0.5 rounded-full font-medium"
              style={{
                backgroundColor: label.color + '18',
                color: label.color,
                outline: `1px solid ${label.color}30`,
              }}
            >
              {label.name}
            </span>
          ))}
        </div>
      )}

      {/* Footer */}
      {(dueDateStatus || task.assignees.length > 0) && (
        <div className="flex items-center justify-between mt-2.5 ml-4.5">
          <div>
            {dueDateStatus && (
              <span className={`text-xs px-1.5 py-0.5 rounded-md font-medium ${dueDateStatus.cls}`}>
                {dueDateStatus.label}
              </span>
            )}
          </div>

          {task.assignees.length > 0 && (
            <div className="flex -space-x-1.5">
              {task.assignees.slice(0, 3).map((member) => (
                <div
                  key={member.id}
                  className="relative group"
                >
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-semibold border-2 border-white ring-1 ring-slate-100"
                    style={{ backgroundColor: member.color }}
                  >
                    {member.name[0].toUpperCase()}
                  </div>
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-0.5 bg-slate-800 text-white text-xs rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                    {member.name}
                  </div>
                </div>
              ))}
              {task.assignees.length > 3 && (
                <div className="w-5 h-5 rounded-full flex items-center justify-center bg-slate-100 text-slate-500 text-xs font-semibold border-2 border-white">
                  +{task.assignees.length - 3}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
