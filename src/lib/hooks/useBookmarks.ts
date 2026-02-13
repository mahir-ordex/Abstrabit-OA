'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Bookmark, Tag } from '@/types/database.types'
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js'

export interface BookmarkWithTags extends Bookmark {
  tags: Tag[]
}

// BroadcastChannel for cross-tab sync (works when Supabase Realtime might be slow/blocked)
const BROADCAST_CHANNEL_NAME = 'bookmarks-sync'

type BroadcastMessage = {
  type: 'BOOKMARK_CHANGED'
  userId: string
  action: 'insert' | 'update' | 'delete'
  bookmark?: Bookmark
  bookmarkId?: string
}

export function useBookmarks(userId: string) {
  const [bookmarks, setBookmarks] = useState<BookmarkWithTags[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const broadcastChannelRef = useRef<BroadcastChannel | null>(null)

  const fetchBookmarks = useCallback(async () => {
    const supabase = createClient()
    
    // Fetch bookmarks
    const { data: bookmarksData, error: bookmarksError } = await supabase
      .from('bookmarks')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (bookmarksError) {
      setError(bookmarksError.message)
      setLoading(false)
      return
    }

    if (!bookmarksData || bookmarksData.length === 0) {
      setBookmarks([])
      setLoading(false)
      return
    }

    // Fetch tags for all bookmarks
    const { data: bookmarkTags } = await supabase
      .from('bookmark_tags')
      .select('bookmark_id, tag_id')
      .in('bookmark_id', bookmarksData.map(b => b.id))

    const { data: tags } = await supabase
      .from('tags')
      .select('*')
      .eq('user_id', userId)

    // Map tags to bookmarks
    const tagsById = new Map(tags?.map(t => [t.id, t]) || [])
    const bookmarksWithTags = bookmarksData.map(bookmark => ({
      ...bookmark,
      tags: (bookmarkTags || [])
        .filter(bt => bt.bookmark_id === bookmark.id)
        .map(bt => tagsById.get(bt.tag_id))
        .filter((t): t is Tag => t !== undefined)
    }))

    setBookmarks(bookmarksWithTags)
    setLoading(false)
  }, [userId])

  // Handle bookmark changes from any source (realtime or broadcast)
  const handleBookmarkChange = useCallback((
    action: 'insert' | 'update' | 'delete',
    bookmark?: Bookmark,
    bookmarkId?: string
  ) => {
    if (action === 'insert' && bookmark) {
      setBookmarks((prev) => {
        // Avoid duplicates
        if (prev.some(b => b.id === bookmark.id)) return prev
        return [{ ...bookmark, tags: [] }, ...prev]
      })
    } else if (action === 'delete' && bookmarkId) {
      setBookmarks((prev) => prev.filter((b) => b.id !== bookmarkId))
    } else if (action === 'update' && bookmark) {
      setBookmarks((prev) =>
        prev.map((b) =>
          b.id === bookmark.id 
            ? { ...bookmark, tags: b.tags } 
            : b
        )
      )
    }
  }, [])

  // Broadcast change to other tabs
  const broadcastChange = useCallback((message: BroadcastMessage) => {
    try {
      broadcastChannelRef.current?.postMessage(message)
    } catch {
      // BroadcastChannel might not be supported
    }
  }, [])

  useEffect(() => {
    fetchBookmarks()

    const supabase = createClient()

    // Set up BroadcastChannel for cross-tab sync
    try {
      broadcastChannelRef.current = new BroadcastChannel(BROADCAST_CHANNEL_NAME)
      broadcastChannelRef.current.onmessage = (event: MessageEvent<BroadcastMessage>) => {
        const message = event.data
        if (message.type === 'BOOKMARK_CHANGED' && message.userId === userId) {
          console.log('[BroadcastChannel] Received:', message.action)
          handleBookmarkChange(message.action, message.bookmark, message.bookmarkId)
        }
      }
    } catch {
      console.log('[BroadcastChannel] Not supported, relying on Supabase Realtime only')
    }

    // Subscribe to realtime changes - no filter, handle in callback
    const channel = supabase
      .channel(`bookmarks-realtime-${userId}-${Date.now()}`)
      .on<Bookmark>(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bookmarks',
        },
        (payload: RealtimePostgresChangesPayload<Bookmark>) => {
          console.log('[Realtime] Event received:', payload.eventType, payload)
          
          // Filter by user_id client-side
          const newRecord = payload.new as Bookmark | undefined
          const oldRecord = payload.old as Bookmark | undefined
          
          if (payload.eventType === 'INSERT' && newRecord && newRecord.user_id === userId) {
            handleBookmarkChange('insert', newRecord)
            // Also broadcast to other tabs
            broadcastChange({ 
              type: 'BOOKMARK_CHANGED', 
              userId, 
              action: 'insert', 
              bookmark: newRecord 
            })
          } else if (payload.eventType === 'DELETE' && oldRecord && oldRecord.user_id === userId) {
            handleBookmarkChange('delete', undefined, oldRecord.id)
            broadcastChange({ 
              type: 'BOOKMARK_CHANGED', 
              userId, 
              action: 'delete', 
              bookmarkId: oldRecord.id 
            })
          } else if (payload.eventType === 'UPDATE' && newRecord && newRecord.user_id === userId) {
            handleBookmarkChange('update', newRecord)
            broadcastChange({ 
              type: 'BOOKMARK_CHANGED', 
              userId, 
              action: 'update', 
              bookmark: newRecord 
            })
          }
        }
      )
      .subscribe((status) => {
        console.log('[Realtime] Subscription status:', status)
      })

    // Subscribe to bookmark_tags changes to update tags
    const tagsChannel = supabase
      .channel(`bookmark-tags-update-${userId}-${Date.now()}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bookmark_tags',
        },
        () => {
          // Refetch to get updated tags
          fetchBookmarks()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
      supabase.removeChannel(tagsChannel)
      broadcastChannelRef.current?.close()
    }
  }, [userId, fetchBookmarks, handleBookmarkChange, broadcastChange])

  return { bookmarks, loading, error, refetch: fetchBookmarks }
}
