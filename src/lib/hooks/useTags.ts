'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Tag } from '@/types/database.types'

// Predefined tag colors
export const TAG_COLORS = [
  '#3B82F6', // blue
  '#10B981', // green
  '#F59E0B', // amber
  '#EF4444', // red
  '#8B5CF6', // purple
  '#EC4899', // pink
  '#14B8A6', // teal
  '#F97316', // orange
]

export function useTags(userId: string) {
  const [tags, setTags] = useState<Tag[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchTags = useCallback(async () => {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('tags')
      .select('*')
      .eq('user_id', userId)
      .order('name', { ascending: true })

    if (error) {
      setError(error.message)
    } else if (data) {
      setTags(data)
    }
    setLoading(false)
  }, [userId])

  useEffect(() => {
    fetchTags()

    const supabase = createClient()

    // Subscribe to realtime changes
    const channel = supabase
      .channel(`tags-${userId}`)
      .on<Tag>(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tags',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT' && payload.new) {
            setTags((prev) => [...prev, payload.new as Tag].sort((a, b) => a.name.localeCompare(b.name)))
          } else if (payload.eventType === 'DELETE' && payload.old) {
            setTags((prev) => prev.filter((t) => t.id !== (payload.old as Tag).id))
          } else if (payload.eventType === 'UPDATE' && payload.new) {
            setTags((prev) =>
              prev.map((t) => (t.id === (payload.new as Tag).id ? (payload.new as Tag) : t))
            )
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId, fetchTags])

  const createTag = useCallback(async (name: string, color: string = TAG_COLORS[0]) => {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('tags')
      .insert({ name, color, user_id: userId })
      .select()
      .single()

    if (error) {
      throw new Error(error.message)
    }
    return data
  }, [userId])

  const deleteTag = useCallback(async (tagId: string) => {
    const supabase = createClient()
    
    const { error } = await supabase
      .from('tags')
      .delete()
      .eq('id', tagId)

    if (error) {
      throw new Error(error.message)
    }
  }, [])

  const updateTag = useCallback(async (tagId: string, updates: { name?: string; color?: string }) => {
    const supabase = createClient()
    
    const { error } = await supabase
      .from('tags')
      .update(updates)
      .eq('id', tagId)

    if (error) {
      throw new Error(error.message)
    }
  }, [])

  return { tags, loading, error, createTag, deleteTag, updateTag, refetch: fetchTags }
}

// Hook for managing bookmark-tag relationships
export function useBookmarkTags(bookmarkId: string) {
  const [tagIds, setTagIds] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  const fetchTagIds = useCallback(async () => {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('bookmark_tags')
      .select('tag_id')
      .eq('bookmark_id', bookmarkId)

    if (!error && data) {
      setTagIds(data.map((bt) => bt.tag_id))
    }
    setLoading(false)
  }, [bookmarkId])

  useEffect(() => {
    fetchTagIds()

    const supabase = createClient()

    const channel = supabase
      .channel(`bookmark-tags-${bookmarkId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bookmark_tags',
          filter: `bookmark_id=eq.${bookmarkId}`,
        },
        () => {
          fetchTagIds()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [bookmarkId, fetchTagIds])

  const addTag = useCallback(async (tagId: string) => {
    const supabase = createClient()
    
    const { error } = await supabase
      .from('bookmark_tags')
      .insert({ bookmark_id: bookmarkId, tag_id: tagId })

    if (error && !error.message.includes('duplicate')) {
      throw new Error(error.message)
    }
  }, [bookmarkId])

  const removeTag = useCallback(async (tagId: string) => {
    const supabase = createClient()
    
    const { error } = await supabase
      .from('bookmark_tags')
      .delete()
      .eq('bookmark_id', bookmarkId)
      .eq('tag_id', tagId)

    if (error) {
      throw new Error(error.message)
    }
  }, [bookmarkId])

  return { tagIds, loading, addTag, removeTag, refetch: fetchTagIds }
}
