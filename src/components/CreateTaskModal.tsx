import { useState } from 'react'
import { X } from 'lucide-react'
import { COLUMNS, PRIORITY_CONFIG } from '../types'
import type { Priority, Status, TeamMember, Label } from '../types'

interface CreateTaskModalProps {
  status: Status
  members: TeamMember[]
  labels: Label[]
  onClose: () => void
  onCreate: (data: {
    title: string
    description?: string
    priority: Priority
    due_date?: string
    status: Status
  }) => Promise<void>
}

export function CreateTaskModal({
  status,
  onClose,
  onCreate,
}: CreateTaskModalProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<Priority>('normal')
  const [dueDate, setDueDate] = useState('')
  const [selectedStatus, setSelectedStatus] = useState<Status>(status)
  const [saving, setSaving] = useState(false)

  const statusConfig = COLUMNS.find((c) => c.id === selectedStatus)!

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    setSaving(true)
    try {
      await onCreate({
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
        due_date: dueDate || undefined,
        status: selectedStatus,
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/25 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${statusConfig.dot}`} />
            <h2 className="text-sm font-semibold text-slate-700">New task in</h2>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as Status)}
              className="text-xs font-semibold border border-slate-200 rounded-lg px-2 py-1 outline-none focus:border-indigo-300 text-slate-700 bg-white"
            >
              {COLUMNS.map((col) => (
                <option key={col.id} value={col.id}>{col.label}</option>
              ))}
            </select>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X size={15} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5">
          <input
            type="text"
            placeholder="Task title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            autoFocus
            required
            className="w-full text-base font-medium text-slate-900 placeholder-slate-300 border-none outline-none bg-transparent mb-2"
          />
          <textarea
            placeholder="Add a description..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="w-full text-sm text-slate-600 placeholder-slate-300 border-none outline-none resize-none bg-transparent leading-relaxed"
          />

          {/* Options row */}
          <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-100 flex-wrap">
            {/* Priority */}
            <div className="flex items-center gap-1">
              {(Object.entries(PRIORITY_CONFIG) as [Priority, typeof PRIORITY_CONFIG[Priority]][]).map(
                ([key, cfg]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setPriority(key)}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
                      priority === key
                        ? 'border-slate-300 bg-slate-100 text-slate-700'
                        : 'border-transparent text-slate-400 hover:bg-slate-50'
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                    {cfg.label}
                  </button>
                )
              )}
            </div>

            {/* Due date */}
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="text-xs border border-slate-200 rounded-lg px-2 py-1 outline-none focus:border-indigo-300 text-slate-600 ml-auto"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-sm text-slate-500 hover:text-slate-700 font-medium rounded-lg hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!title.trim() || saving}
              className="px-4 py-1.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-40 transition-colors"
            >
              {saving ? 'Creating...' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
