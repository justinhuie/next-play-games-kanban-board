import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core'
import confetti from 'canvas-confetti'
import { LayoutGrid, Plus, Search, SlidersHorizontal, X } from 'lucide-react'
import { useRef, useState, useEffect } from 'react'
import { useTasks } from '../hooks/useTasks'
import { useTeamMembers } from '../hooks/useTeamMembers'
import { useLabels } from '../hooks/useLabels'
import { COLUMNS } from '../types'
import type { Status, Task } from '../types'
import { Column } from './Column'
import { TaskCard } from './TaskCard'
import { TaskModal } from './TaskModal'
import { CreateTaskModal } from './CreateTaskModal'

interface BoardProps {
  userId: string
}

export function Board({ userId }: BoardProps) {
  const { tasks, loading, error, createTask, updateTask, deleteTask, reorderTasks, refetch } =
    useTasks(userId)
  const { members, addMember, deleteMember } = useTeamMembers(userId)
  const { labels, addLabel, deleteLabel } = useLabels(userId)

  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  const [createStatus, setCreateStatus] = useState<Status | null>(null)
  const [activeTask, setActiveTask] = useState<Task | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterOpen, setFilterOpen] = useState(false)
  const [filterPriority, setFilterPriority] = useState<string>('')
  const [filterAssignee, setFilterAssignee] = useState<string>('')
  const [filterLabel, setFilterLabel] = useState<string>('')
  const filterRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setFilterOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const selectedTask = tasks.find((t) => t.id === selectedTaskId) ?? null

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )

  function handleDragStart(event: DragStartEvent) {
    const task = tasks.find((t) => t.id === event.active.id)
    setActiveTask(task ?? null)
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    setActiveTask(null)
    if (!over || active.id === over.id) return
    const draggedTask = tasks.find((t) => t.id === active.id)
    if (!draggedTask) return
    const isOverColumn = COLUMNS.some((c) => c.id === over.id)
    const overTask = tasks.find((t) => t.id === over.id)
    const targetStatus = isOverColumn ? (over.id as Status) : overTask?.status ?? draggedTask.status
    if (targetStatus !== draggedTask.status) {
      updateTask(draggedTask.id, { status: targetStatus })
      if (targetStatus === 'done') {
        confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } })
      }
    } else if (!isOverColumn && overTask) {
      reorderTasks(draggedTask.status, draggedTask.id, overTask.id)
    }
  }

  const activeFilterCount = [filterPriority, filterAssignee, filterLabel].filter(Boolean).length

  const filteredTasks = tasks.filter((t) => {
    if (!t.title.toLowerCase().includes(searchQuery.toLowerCase())) return false
    if (filterPriority && t.priority !== filterPriority) return false
    if (filterAssignee && !t.assignees.some((a) => a.id === filterAssignee)) return false
    if (filterLabel && !t.labels.some((l) => l.id === filterLabel)) return false
    return true
  })

  const totalTasks = tasks.length
  const doneTasks = tasks.filter((t) => t.status === 'done').length
  const overdueTasks = tasks.filter((t) => {
    if (!t.due_date || t.status === 'done') return false
    return new Date(t.due_date) < new Date()
  }).length

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-500">Loading your board...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="text-center">
          <p className="text-red-500 font-semibold">Something went wrong</p>
          <p className="text-slate-500 text-sm mt-1">{error}</p>
          <button
            onClick={() => refetch()}
            className="mt-3 text-sm text-indigo-600 hover:underline"
          >
            Try again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center shadow-sm">
            <LayoutGrid size={14} className="text-white" />
          </div>
          <span className="text-base font-bold text-slate-900 tracking-tight">
            Kanban Board
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Stats */}
          <div className="hidden sm:flex items-center gap-3 text-xs text-slate-500 border-r border-slate-200 pr-4 mr-1">
            <span>
              <span className="font-bold text-slate-700">{totalTasks}</span> total
            </span>
            <span>
              <span className="font-bold text-emerald-600">{doneTasks}</span> done
            </span>
            {overdueTasks > 0 && (
              <span>
                <span className="font-bold text-red-500">{overdueTasks}</span> overdue
              </span>
            )}
          </div>

          {/* Filter */}
          <div className="relative" ref={filterRef}>
            <button
              onClick={() => setFilterOpen((o) => !o)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-sm border rounded-lg transition-all ${
                activeFilterCount > 0
                  ? 'border-indigo-300 bg-indigo-50 text-indigo-700'
                  : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-white'
              }`}
            >
              <SlidersHorizontal size={13} />
              Filter
              {activeFilterCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-indigo-600 text-white text-xs flex items-center justify-center font-bold">
                  {activeFilterCount}
                </span>
              )}
            </button>

            {filterOpen && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-lg z-20 p-3 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-700">Filters</span>
                  {activeFilterCount > 0 && (
                    <button
                      onClick={() => { setFilterPriority(''); setFilterAssignee(''); setFilterLabel('') }}
                      className="text-xs text-indigo-600 hover:underline flex items-center gap-1"
                    >
                      <X size={10} /> Clear all
                    </button>
                  )}
                </div>

                <div>
                  <label className="text-xs text-slate-500 mb-1 block">Priority</label>
                  <select
                    value={filterPriority}
                    onChange={(e) => setFilterPriority(e.target.value)}
                    className="w-full text-sm border border-slate-200 rounded-lg px-2 py-1.5 outline-none focus:border-indigo-300 bg-white"
                  >
                    <option value="">All priorities</option>
                    <option value="high">High</option>
                    <option value="normal">Normal</option>
                    <option value="low">Low</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs text-slate-500 mb-1 block">Assignee</label>
                  <select
                    value={filterAssignee}
                    onChange={(e) => setFilterAssignee(e.target.value)}
                    className="w-full text-sm border border-slate-200 rounded-lg px-2 py-1.5 outline-none focus:border-indigo-300 bg-white"
                  >
                    <option value="">All assignees</option>
                    {members.map((m) => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs text-slate-500 mb-1 block">Label</label>
                  <select
                    value={filterLabel}
                    onChange={(e) => setFilterLabel(e.target.value)}
                    className="w-full text-sm border border-slate-200 rounded-lg px-2 py-1.5 outline-none focus:border-indigo-300 bg-white"
                  >
                    <option value="">All labels</option>
                    {labels.map((l) => (
                      <option key={l.id} value={l.id}>{l.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Search */}
          <div className="relative">
            <Search
              size={13}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
            />
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-sm border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 outline-none transition-all w-40 focus:w-52"
            />
          </div>

          <button
            onClick={() => setCreateStatus('todo')}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 active:scale-95 transition-all shadow-sm"
          >
            <Plus size={14} />
            New Task
          </button>
        </div>
      </header>

      {/* Board */}
      <main className="p-6 pb-12">
        <DndContext
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-5 overflow-x-auto pb-4">
            {COLUMNS.map((col) => (
              <Column
                key={col.id}
                status={col.id}
                tasks={filteredTasks.filter((t) => t.status === col.id)}
                onTaskClick={(task) => setSelectedTaskId(task.id)}
                onAddTask={setCreateStatus}
              />
            ))}
          </div>

          <DragOverlay dropAnimation={null}>
            {activeTask && (
              <div className="rotate-1 scale-105 opacity-95 w-72">
                <TaskCard task={activeTask} onClick={() => {}} />
              </div>
            )}
          </DragOverlay>
        </DndContext>
      </main>

      {/* Task detail modal */}
      {selectedTask && (
        <TaskModal
          task={selectedTask}
          members={members}
          labels={labels}
          userId={userId}
          onClose={() => setSelectedTaskId(null)}
          onUpdate={async (updates) => {
            await updateTask(selectedTask.id, updates)
          }}
          onDelete={async () => {
            await deleteTask(selectedTask.id)
            setSelectedTaskId(null)
          }}
          onAddMember={addMember}
          onDeleteMember={deleteMember}
          onAddLabel={addLabel}
          onDeleteLabel={deleteLabel}
          onRefetch={refetch}
        />
      )}

      {/* Create task modal */}
      {createStatus && (
        <CreateTaskModal
          status={createStatus}
          members={members}
          labels={labels}
          onClose={() => setCreateStatus(null)}
          onCreate={async (data) => {
            await createTask(data)
            setCreateStatus(null)
          }}
        />
      )}
    </div>
  )
}
