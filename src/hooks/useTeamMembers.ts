import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { TeamMember } from '../types'

const MEMBER_COLORS = [
  '#6366f1',
  '#ec4899',
  '#f59e0b',
  '#10b981',
  '#3b82f6',
  '#8b5cf6',
  '#ef4444',
  '#06b6d4',
]

export function useTeamMembers(userId: string | undefined) {
  const [members, setMembers] = useState<TeamMember[]>([])

  const fetchMembers = async () => {
    if (!userId) return
    const { data } = await supabase
      .from('team_members')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true })
    setMembers(data ?? [])
  }

  useEffect(() => {
    fetchMembers()
  }, [userId])

  const addMember = async (name: string): Promise<TeamMember | undefined> => {
    if (!userId) return
    const color = MEMBER_COLORS[members.length % MEMBER_COLORS.length]
    const { data, error } = await supabase
      .from('team_members')
      .insert({ name, color, user_id: userId })
      .select()
      .single()
    if (error) throw error
    setMembers((prev) => [...prev, data])
    return data
  }

  const deleteMember = async (id: string) => {
    await supabase.from('team_members').delete().eq('id', id)
    setMembers((prev) => prev.filter((m) => m.id !== id))
  }

  return { members, addMember, deleteMember, refetch: fetchMembers }
}
