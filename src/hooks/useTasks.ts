import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Label, Priority, Status, Task, TeamMember } from '../types'
import { arrayMove } from '@dnd-kit/sortable'

export function useTasks(userId: string | undefined) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchTasks = useCallback(async () => {
    if (!userId) return
    const { data, error } = await supabase
      .from('tasks')
      .select(
        `*, task_assignees(team_members(*)), task_labels(labels(*))`
      )
      .eq('user_id', userId)
      .order('position', { ascending: true })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    type RawTask = Omit<Task, 'assignees' | 'labels'> & {
      task_assignees: { team_members: TeamMember | null }[]
      task_labels: { labels: Label | null }[]
    }

    const transformed = (data as RawTask[] ?? []).map((task) => ({
      ...task,
      assignees: task.task_assignees
        ?.map((a) => a.team_members)
        .filter((m): m is TeamMember => m !== null) ?? [],
      labels: task.task_labels
        ?.map((l) => l.labels)
        .filter((l): l is Label => l !== null) ?? [],
    }))

    setTasks(transformed)
    setLoading(false)
  }, [userId])

  useEffect(() => {
    if (userId) fetchTasks()
  }, [fetchTasks, userId])

  const createTask = async (taskData: {
    title: string
    description?: string
    priority?: Priority
    due_date?: string
    status?: Status
  }) => {
    if (!userId) return
    const status = taskData.status ?? 'todo'
    const position = tasks.filter((t) => t.status === status).length

    const { error } = await supabase
      .from('tasks')
      .insert({ ...taskData, status, user_id: userId, position })

    if (error) throw error
    await fetchTasks()
  }

  const updateTask = async (id: string, updates: Partial<Task>) => {
    const oldTask = tasks.find((t) => t.id === id)

    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...updates } : t))
    )

    const { error } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', id)

    if (error) {
      setTasks((prev) =>
        prev.map((t) => (t.id === id && oldTask ? oldTask : t))
      )
      throw error
    }

    if (
      updates.status &&
      oldTask &&
      updates.status !== oldTask.status &&
      userId
    ) {
      await supabase.from('activity_log').insert({
        task_id: id,
        user_id: userId,
        action: 'status_changed',
        old_value: oldTask.status,
        new_value: updates.status,
      })
    }
  }

  const deleteTask = async (id: string) => {
    const { error } = await supabase.from('tasks').delete().eq('id', id)
    if (error) throw error
    setTasks((prev) => prev.filter((t) => t.id !== id))
  }

  const reorderTasks = async (status: Status, activeId: string, overId: string) => {
    const columnTasks = tasks
      .filter((t) => t.status === status)
      .sort((a, b) => a.position - b.position)
    const oldIndex = columnTasks.findIndex((t) => t.id === activeId)
    const newIndex = columnTasks.findIndex((t) => t.id === overId)
    if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return
    const reordered = arrayMove(columnTasks, oldIndex, newIndex)
    setTasks((prev) => {
      const others = prev.filter((t) => t.status !== status)
      return [...others, ...reordered.map((t, i) => ({ ...t, position: i }))]
    })
    await Promise.all(
      reordered.map((t, i) => supabase.from('tasks').update({ position: i }).eq('id', t.id))
    )
  }

  return {
    tasks,
    loading,
    error,
    createTask,
    updateTask,
    deleteTask,
    reorderTasks,
    refetch: fetchTasks,
  }
}
