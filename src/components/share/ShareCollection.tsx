'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { SharedCollection } from '@/types/database.types'
import { BookmarkWithTags } from '@/lib/hooks/useBookmarks'

interface ShareCollectionProps {
  userId: string
  bookmarks: BookmarkWithTags[]
}

export function ShareCollection({ userId, bookmarks }: ShareCollectionProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [collections, setCollections] = useState<SharedCollection[]>([])
  const [loading, setLoading] = useState(false)
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const [selectedBookmarkIds, setSelectedBookmarkIds] = useState<string[]>([])
  const [copySuccess, setCopySuccess] = useState<string | null>(null)

  const fetchCollections = useCallback(async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('shared_collections')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    
    if (data) {
      setCollections(data as SharedCollection[])
    }
  }, [userId])

  useEffect(() => {
    if (isOpen) {
      fetchCollections()
    }
  }, [isOpen, fetchCollections])

  const generateSlug = () => {
    return Math.random().toString(36).substring(2, 10)
  }

  const handleCreate = async () => {
    if (!newName.trim() || selectedBookmarkIds.length === 0) return

    setCreating(true)
    const supabase = createClient()

    try {
      const slug = generateSlug()
      
      // Create collection
      const { data: collection, error: collectionError } = await supabase
        .from('shared_collections')
        .insert({
          name: newName.trim(),
          slug,
          user_id: userId,
          is_public: true
        })
        .select()
        .single()

      if (collectionError) throw collectionError

      // Add bookmarks to collection
      const bookmarkEntries = selectedBookmarkIds.map((bookmarkId, index) => ({
        collection_id: collection.id,
        bookmark_id: bookmarkId,
        sort_order: index
      }))

      const { error: bookmarksError } = await supabase
        .from('collection_bookmarks')
        .insert(bookmarkEntries)

      if (bookmarksError) throw bookmarksError

      setNewName('')
      setSelectedBookmarkIds([])
      fetchCollections()
    } catch (error) {
      console.error('Failed to create collection:', error)
    } finally {
      setCreating(false)
    }
  }

  const handleDelete = async (collectionId: string) => {
    if (!confirm('Delete this shared collection?')) return

    const supabase = createClient()
    await supabase.from('shared_collections').delete().eq('id', collectionId)
    fetchCollections()
  }

  const handleCopyLink = (slug: string) => {
    const url = `${window.location.origin}/shared/${slug}`
    navigator.clipboard.writeText(url)
    setCopySuccess(slug)
    setTimeout(() => setCopySuccess(null), 2000)
  }

  const toggleBookmark = (bookmarkId: string) => {
    setSelectedBookmarkIds(prev =>
      prev.includes(bookmarkId)
        ? prev.filter(id => id !== bookmarkId)
        : [...prev, bookmarkId]
    )
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-2 px-3 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors cursor-pointer"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
        </svg>
        Share
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-4 z-20 max-h-[70vh] overflow-y-auto">
          <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-3">Share Collections</h3>
          
          {/* Existing Collections */}
          {collections.length > 0 && (
            <div className="mb-4 space-y-2">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Your shared links</p>
              {collections.map((collection) => (
                <div
                  key={collection.id}
                  className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded-lg"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                      {collection.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      /shared/{collection.slug}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 ml-2">
                    <button
                      onClick={() => handleCopyLink(collection.slug)}
                      className="p-1.5 text-gray-400 hover:text-blue-600 rounded transition-colors cursor-pointer"
                      title="Copy link"
                    >
                      {copySuccess === collection.slug ? (
                        <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                        </svg>
                      )}
                    </button>
                    <button
                      onClick={() => handleDelete(collection.id)}
                      className="p-1.5 text-gray-400 hover:text-red-500 rounded transition-colors cursor-pointer"
                      title="Delete"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Create New Collection */}
          <div className="border-t border-gray-100 dark:border-gray-700 pt-4">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Create new shared link</p>
            
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Collection name"
              className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 mb-3"
            />

            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
              Select bookmarks to share ({selectedBookmarkIds.length} selected)
            </p>
            
            <div className="max-h-40 overflow-y-auto space-y-1 mb-3">
              {bookmarks.map((bookmark) => (
                <label
                  key={bookmark.id}
                  className="flex items-center gap-2 p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedBookmarkIds.includes(bookmark.id)}
                    onChange={() => toggleBookmark(bookmark.id)}
                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300 truncate">
                    {bookmark.title}
                  </span>
                </label>
              ))}
            </div>

            <button
              onClick={handleCreate}
              disabled={!newName.trim() || selectedBookmarkIds.length === 0 || creating}
              className="w-full px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              {creating ? 'Creating...' : 'Create Share Link'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
