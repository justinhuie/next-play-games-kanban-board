import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Label } from '../types'

const LABEL_COLORS = [
  '#6366f1',
  '#ec4899',
  '#f59e0b',
  '#10b981',
  '#3b82f6',
  '#8b5cf6',
  '#ef4444',
  '#06b6d4',
]

export function useLabels(userId: string | undefined) {
  const [labels, setLabels] = useState<Label[]>([])

  const fetchLabels = async () => {
    if (!userId) return
    const { data } = await supabase
      .from('labels')
      .select('*')
      .eq('user_id', userId)
      .order('name', { ascending: true })
    setLabels(data ?? [])
  }

  useEffect(() => {
    fetchLabels()
  }, [userId])

  const addLabel = async (
    name: string,
    color?: string
  ): Promise<Label | undefined> => {
    if (!userId) return
    const labelColor = color ?? LABEL_COLORS[labels.length % LABEL_COLORS.length]
    const { data, error } = await supabase
      .from('labels')
      .insert({ name, color: labelColor, user_id: userId })
      .select()
      .single()
    if (error) throw error
    setLabels((prev) => [...prev, data])
    return data
  }

  const deleteLabel = async (id: string) => {
    await supabase.from('labels').delete().eq('id', id)
    setLabels((prev) => prev.filter((l) => l.id !== id))
  }

  return { labels, addLabel, deleteLabel, refetch: fetchLabels }
}
