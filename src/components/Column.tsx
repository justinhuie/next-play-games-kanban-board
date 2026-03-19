import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { Plus } from 'lucide-react'
import { COLUMNS } from '../types'
import type { Status, Task } from '../types'
import { TaskCard } from './TaskCard'

interface ColumnProps {
  status: Status
  tasks: Task[]
  onTaskClick: (task: Task) => void
  onAddTask: (status: Status) => void
}

export function Column({ status, tasks, onTaskClick, onAddTask }: ColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: status })
  const config = COLUMNS.find((c) => c.id === status)!

  return (
    <div className="flex flex-col w-72 flex-shrink-0">
      {/* Column header */}
      <div className="flex items-center justify-between mb-3 px-0.5">
        <div className="flex items-center gap-2">
          <div className={`w-2.5 h-2.5 rounded-full ${config.dot}`} />
          <h3 className={`text-sm font-semibold ${config.headerColor}`}>
            {config.label}
          </h3>
          <span className="text-xs text-slate-400 bg-slate-100 rounded-full px-1.5 py-0.5 font-medium tabular-nums">
            {tasks.length}
          </span>
        </div>
        <button
          onClick={() => onAddTask(status)}
          className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
          title="Add task"
        >
          <Plus size={14} />
        </button>
      </div>

      {/* Drop zone */}
      <div
        ref={setNodeRef}
        className={`flex flex-col gap-2.5 min-h-32 rounded-2xl p-2.5 transition-all duration-150 ${
          isOver
            ? `bg-indigo-50 ring-2 ring-indigo-300 ring-inset`
            : 'bg-slate-100/60'
        }`}
      >
        <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} onClick={() => onTaskClick(task)} />
          ))}
        </SortableContext>

        {tasks.length === 0 && (
          <div
            className={`flex flex-col items-center justify-center py-10 transition-opacity ${
              isOver ? 'opacity-0' : 'opacity-100'
            }`}
          >
            <p className="text-xs text-slate-400 text-center">{config.emptyText}</p>
          </div>
        )}
      </div>
    </div>
  )
}
