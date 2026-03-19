import { useEffect, useState } from 'react'
import {
  X,
  Trash2,
  Calendar,
  Flag,
  User,
  Tag,
  MessageSquare,
  Activity,
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import type {
  ActivityLog,
  Comment,
  Label,
  Priority,
  Status,
  Task,
  TeamMember,
} from '../types'
import { COLUMNS, PRIORITY_CONFIG, STATUS_LABELS } from '../types'

interface TaskModalProps {
  task: Task
  members: TeamMember[]
  labels: Label[]
  userId: string
  onClose: () => void
  onUpdate: (updates: Partial<Task>) => Promise<void>
  onDelete: () => Promise<void>
  onAddMember: (name: string) => Promise<TeamMember | undefined>
  onDeleteMember: (id: string) => Promise<void>
  onAddLabel: (name: string, color: string) => Promise<Label | undefined>
  onDeleteLabel: (id: string) => Promise<void>
  onRefetch: () => Promise<void>
}

function formatTimeAgo(dateStr: string) {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)
  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  return `${diffDays}d ago`
}

export function TaskModal({
  task,
  members,
  labels,
  userId,
  onClose,
  onUpdate,
  onDelete,
  onAddMember,
  onDeleteMember,
  onAddLabel,
  onDeleteLabel,
  onRefetch,
}: TaskModalProps) {
  const [title, setTitle] = useState(task.title)
  const [description, setDescription] = useState(task.description ?? '')
  const [activeTab, setActiveTab] = useState<'comments' | 'activity'>('comments')
  const [comments, setComments] = useState<Comment[]>([])
  const [activity, setActivity] = useState<ActivityLog[]>([])
  const [newComment, setNewComment] = useState('')
  const [sendingComment, setSendingComment] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [newMemberName, setNewMemberName] = useState('')
  const [newLabelName, setNewLabelName] = useState('')

  const loadComments = async () => {
    const { data } = await supabase
      .from('comments')
      .select('*')
      .eq('task_id', task.id)
      .order('created_at', { ascending: true })
    setComments(data ?? [])
  }

  const loadActivity = async () => {
    const { data } = await supabase
      .from('activity_log')
      .select('*')
      .eq('task_id', task.id)
      .order('created_at', { ascending: false })
    setActivity(data ?? [])
  }

  useEffect(() => {
    setTitle(task.title)
    setDescription(task.description ?? '')
  }, [task.id, task.title, task.description])

  useEffect(() => {
    loadComments()
    loadActivity()
  }, [task.id])

  const handleTitleBlur = async () => {
    if (title.trim() && title !== task.title) {
      await onUpdate({ title: title.trim() })
    }
  }

  const handleDescriptionBlur = async () => {
    const newDesc = description.trim() || null
    if (newDesc !== task.description) {
      await onUpdate({ description: newDesc })
    }
  }

  const handleStatusChange = async (status: Status) => {
    await onUpdate({ status })
  }

  const handlePriorityChange = async (priority: Priority) => {
    await onUpdate({ priority })
  }

  const handleDueDateChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    await onUpdate({ due_date: e.target.value || null })
  }

  const handleSendComment = async () => {
    if (!newComment.trim()) return
    setSendingComment(true)
    const { data, error } = await supabase
      .from('comments')
      .insert({ task_id: task.id, user_id: userId, content: newComment.trim() })
      .select()
      .single()
    if (!error && data) {
      setComments((prev) => [...prev, data])
      setNewComment('')
    }
    setSendingComment(false)
  }

  const handleToggleAssignee = async (member: TeamMember) => {
    const isAssigned = task.assignees.some((a) => a.id === member.id)
    if (isAssigned) {
      await supabase
        .from('task_assignees')
        .delete()
        .match({ task_id: task.id, member_id: member.id })
    } else {
      await supabase
        .from('task_assignees')
        .insert({ task_id: task.id, member_id: member.id })
    }
    await onRefetch()
  }

  const handleToggleLabel = async (label: Label) => {
    const isApplied = task.labels.some((l) => l.id === label.id)
    if (isApplied) {
      await supabase
        .from('task_labels')
        .delete()
        .match({ task_id: task.id, label_id: label.id })
    } else {
      await supabase
        .from('task_labels')
        .insert({ task_id: task.id, label_id: label.id })
    }
    await onRefetch()
  }

  const handleAddMember = async () => {
    if (!newMemberName.trim()) return
    await onAddMember(newMemberName.trim())
    setNewMemberName('')
  }

  const handleAddLabel = async () => {
    if (!newLabelName.trim()) return
    const colors = ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ef4444']
    const color = colors[labels.length % colors.length]
    await onAddLabel(newLabelName.trim(), color)
    setNewLabelName('')
  }

  const handleDelete = async () => {
    if (!confirm('Delete this task? This cannot be undone.')) return
    setDeleting(true)
    await onDelete()
  }

  function getActivityLabel(log: ActivityLog) {
    if (log.action === 'status_changed') {
      const from = STATUS_LABELS[log.old_value as Status] ?? log.old_value
      const to = STATUS_LABELS[log.new_value as Status] ?? log.new_value
      return `Moved from ${from} → ${to}`
    }
    return log.action
  }

  return (
    <div
      className="fixed inset-0 bg-black/25 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-3.5 border-b border-slate-100">
          <select
            value={task.status}
            onChange={(e) => handleStatusChange(e.target.value as Status)}
            className="text-xs font-semibold px-2.5 py-1 rounded-lg border border-slate-200 bg-slate-50 focus:outline-none focus:border-indigo-300 cursor-pointer text-slate-600"
          >
            {COLUMNS.map((col) => (
              <option key={col.id} value={col.id}>
                {col.label}
              </option>
            ))}
          </select>

          <div className="flex items-center gap-1">
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
              title="Delete task"
            >
              <Trash2 size={14} />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X size={14} />
            </button>
          </div>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto">
          <div className="px-6 py-5">
            {/* Title */}
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={handleTitleBlur}
              className="w-full text-xl font-bold text-slate-900 placeholder-slate-300 border-none outline-none bg-transparent leading-tight"
              placeholder="Task title"
            />

            {/* Description */}
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onBlur={handleDescriptionBlur}
              rows={3}
              className="w-full mt-3 text-sm text-slate-600 placeholder-slate-300 border-none outline-none resize-none bg-transparent leading-relaxed"
              placeholder="Add a description..."
            />

            {/* Meta grid */}
            <div className="mt-5 pt-5 border-t border-slate-100 grid grid-cols-2 gap-5">
              {/* Priority */}
              <div>
                <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 mb-2">
                  <Flag size={11} />
                  Priority
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {(
                    Object.entries(PRIORITY_CONFIG) as [
                      Priority,
                      (typeof PRIORITY_CONFIG)[Priority]
                    ][]
                  ).map(([key, cfg]) => (
                    <button
                      key={key}
                      onClick={() => handlePriorityChange(key)}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
                        task.priority === key
                          ? 'border-slate-300 bg-slate-100 text-slate-800'
                          : 'border-transparent text-slate-400 hover:bg-slate-50'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                      {cfg.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Due date */}
              <div>
                <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 mb-2">
                  <Calendar size={11} />
                  Due Date
                </label>
                <input
                  type="date"
                  value={task.due_date ?? ''}
                  onChange={handleDueDateChange}
                  className="text-sm border border-slate-200 rounded-lg px-2.5 py-1.5 outline-none focus:border-indigo-300 focus:ring-1 focus:ring-indigo-100 transition-all text-slate-700"
                />
              </div>
            </div>

            {/* Assignees */}
            <div className="mt-5 pt-5 border-t border-slate-100">
              <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 mb-2.5">
                <User size={11} />
                Assignees
              </label>
              <div className="flex flex-wrap gap-2">
                {members.map((member) => {
                  const isAssigned = task.assignees.some((a) => a.id === member.id)
                  return (
                    <div key={member.id} className="group relative flex items-center">
                      <button
                        onClick={() => handleToggleAssignee(member)}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${
                          isAssigned
                            ? 'text-white border-transparent'
                            : 'border-slate-200 text-slate-600 hover:border-slate-300 bg-white'
                        }`}
                        style={isAssigned ? { backgroundColor: member.color } : {}}
                      >
                        <span
                          className="w-4 h-4 rounded-full flex items-center justify-center text-white text-xs font-bold"
                          style={{ backgroundColor: member.color }}
                        >
                          {member.name[0].toUpperCase()}
                        </span>
                        {member.name}
                      </button>
                      <button
                        onClick={() => onDeleteMember(member.id)}
                        className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-slate-400 text-white text-xs hidden group-hover:flex items-center justify-center hover:bg-red-500 transition-colors"
                        title="Remove member"
                      >
                        ×
                      </button>
                    </div>
                  )
                })}
                <div className="flex items-center gap-1">
                  <input
                    type="text"
                    placeholder="Add member..."
                    value={newMemberName}
                    onChange={(e) => setNewMemberName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddMember()}
                    className="text-xs border border-dashed border-slate-300 rounded-full px-3 py-1 outline-none focus:border-indigo-300 w-28 placeholder-slate-300"
                  />
                  {newMemberName && (
                    <button
                      onClick={handleAddMember}
                      className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold"
                    >
                      Add
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Labels */}
            <div className="mt-5 pt-5 border-t border-slate-100">
              <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 mb-2.5">
                <Tag size={11} />
                Labels
              </label>
              <div className="flex flex-wrap gap-2">
                {labels.map((label) => {
                  const isApplied = task.labels.some((l) => l.id === label.id)
                  return (
                    <div key={label.id} className="group relative flex items-center">
                      <button
                        onClick={() => handleToggleLabel(label)}
                        className={`text-xs px-2.5 py-1 rounded-full font-medium border transition-all ${
                          isApplied
                            ? 'border-transparent'
                            : 'border-slate-200 text-slate-400 hover:border-slate-300'
                        }`}
                        style={
                          isApplied
                            ? {
                                backgroundColor: label.color + '18',
                                color: label.color,
                                outlineColor: label.color + '40',
                              }
                            : {}
                        }
                      >
                        {label.name}
                      </button>
                      <button
                        onClick={() => onDeleteLabel(label.id)}
                        className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-slate-400 text-white text-xs hidden group-hover:flex items-center justify-center hover:bg-red-500 transition-colors"
                        title="Delete label"
                      >
                        ×
                      </button>
                    </div>
                  )
                })}
                <div className="flex items-center gap-1">
                  <input
                    type="text"
                    placeholder="Add label..."
                    value={newLabelName}
                    onChange={(e) => setNewLabelName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddLabel()}
                    className="text-xs border border-dashed border-slate-300 rounded-full px-3 py-1 outline-none focus:border-indigo-300 w-28 placeholder-slate-300"
                  />
                  {newLabelName && (
                    <button
                      onClick={handleAddLabel}
                      className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold"
                    >
                      Add
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Comments / Activity */}
          <div className="border-t border-slate-100">
            <div className="flex border-b border-slate-100 px-6">
              <button
                onClick={() => setActiveTab('comments')}
                className={`flex items-center gap-1.5 px-1 py-3 mr-4 text-sm font-medium border-b-2 transition-colors -mb-px ${
                  activeTab === 'comments'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                <MessageSquare size={13} />
                Comments
                {comments.length > 0 && (
                  <span className="text-xs bg-slate-100 text-slate-500 rounded-full px-1.5 font-semibold">
                    {comments.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('activity')}
                className={`flex items-center gap-1.5 px-1 py-3 text-sm font-medium border-b-2 transition-colors -mb-px ${
                  activeTab === 'activity'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                <Activity size={13} />
                Activity
                {activity.length > 0 && (
                  <span className="text-xs bg-slate-100 text-slate-500 rounded-full px-1.5 font-semibold">
                    {activity.length}
                  </span>
                )}
              </button>
            </div>

            <div className="px-6 py-4">
              {activeTab === 'comments' && (
                <div className="space-y-4">
                  {comments.length === 0 && (
                    <p className="text-sm text-slate-400 text-center py-6">
                      No comments yet. Be the first!
                    </p>
                  )}
                  {comments.map((comment) => (
                    <div key={comment.id} className="flex gap-3">
                      <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-xs font-bold flex-shrink-0">
                        Y
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-semibold text-slate-700">
                            You
                          </span>
                          <span className="text-xs text-slate-400">
                            {formatTimeAgo(comment.created_at)}
                          </span>
                        </div>
                        <p className="text-sm text-slate-700 bg-slate-50 rounded-xl px-3.5 py-2.5 leading-relaxed">
                          {comment.content}
                        </p>
                      </div>
                    </div>
                  ))}
                  {/* Comment input */}
                  <div className="flex gap-3 mt-2">
                    <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-xs font-bold flex-shrink-0">
                      Y
                    </div>
                    <div className="flex-1 flex gap-2">
                      <input
                        type="text"
                        placeholder="Write a comment..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        onKeyDown={(e) =>
                          e.key === 'Enter' && !e.shiftKey && handleSendComment()
                        }
                        className="flex-1 text-sm border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-indigo-300 focus:ring-1 focus:ring-indigo-100 transition-all"
                      />
                      <button
                        onClick={handleSendComment}
                        disabled={!newComment.trim() || sendingComment}
                        className="px-3 py-2 text-xs font-semibold bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-40 transition-colors"
                      >
                        Send
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'activity' && (
                <div className="space-y-3 pb-2">
                  {activity.length === 0 && (
                    <p className="text-sm text-slate-400 text-center py-6">
                      No activity yet.
                    </p>
                  )}
                  {activity.map((log) => (
                    <div key={log.id} className="flex items-start gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-300 mt-2 flex-shrink-0" />
                      <div>
                        <p className="text-sm text-slate-600">
                          {getActivityLabel(log)}
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {formatTimeAgo(log.created_at)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
