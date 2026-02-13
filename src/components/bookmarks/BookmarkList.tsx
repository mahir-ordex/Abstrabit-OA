'use client'

import { useState, useMemo, useEffect, MutableRefObject } from 'react'
import { useBookmarks } from '@/lib/hooks/useBookmarks'
import { useTags } from '@/lib/hooks/useTags'
import { BookmarkCard } from './BookmarkCard'
import { SearchBar } from './SearchBar'
import { TagFilter } from '@/components/tags/TagFilter'
import { ShareCollection } from '@/components/share/ShareCollection'

interface BookmarkListProps {
  userId: string
  refetchRef?: MutableRefObject<(() => void) | null>
}

export function BookmarkList({ userId, refetchRef }: BookmarkListProps) {
  const { bookmarks, loading, error, refetch } = useBookmarks(userId)
  const { tags } = useTags(userId)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([])

  // Expose refetch to parent
  useEffect(() => {
    if (refetchRef) {
      refetchRef.current = refetch
    }
  }, [refetch, refetchRef])

  const filteredBookmarks = useMemo(() => {
    let filtered = bookmarks

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (bookmark) =>
          bookmark.title.toLowerCase().includes(query) ||
          bookmark.url.toLowerCase().includes(query)
      )
    }

    // Filter by selected tags
    if (selectedTagIds.length > 0) {
      filtered = filtered.filter((bookmark) =>
        selectedTagIds.every((tagId) =>
          bookmark.tags.some((tag) => tag.id === tagId)
        )
      )
    }

    return filtered
  }, [bookmarks, searchQuery, selectedTagIds])

  const handleTagToggle = (tagId: string) => {
    setSelectedTagIds((prev) =>
      prev.includes(tagId)
        ? prev.filter((id) => id !== tagId)
        : [...prev, tagId]
    )
  }

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4 animate-pulse">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2" />
            <div className="h-3 bg-gray-100 dark:bg-gray-600 rounded w-1/2" />
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/30 border border-red-100 dark:border-red-800 rounded-xl p-6 text-center">
        <p className="text-red-600 dark:text-red-400">Failed to load bookmarks: {error}</p>
      </div>
    )
  }

  if (bookmarks.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-12 text-center">
        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
          </svg>
        </div>
        <h3 className="text-gray-900 dark:text-gray-100 font-medium mb-1">No bookmarks yet</h3>
        <p className="text-gray-500 dark:text-gray-400 text-sm">Add your first bookmark above to get started</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <SearchBar value={searchQuery} onChange={setSearchQuery} />
        </div>
        <ShareCollection userId={userId} bookmarks={bookmarks} />
      </div>
      
      {tags.length > 0 && (
        <TagFilter
          tags={tags}
          selectedTagIds={selectedTagIds}
          onTagToggle={handleTagToggle}
          onClear={() => setSelectedTagIds([])}
        />
      )}
      
      {filteredBookmarks.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-8 text-center">
          <p className="text-gray-500 dark:text-gray-400">
            {searchQuery ? `No bookmarks match "${searchQuery}"` : 'No bookmarks with selected tags'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredBookmarks.map((bookmark) => (
            <BookmarkCard 
              key={bookmark.id} 
              bookmark={bookmark}
              allTags={tags}
              onTagsChange={refetch}
            />
          ))}
        </div>
      )}
      
      {(searchQuery || selectedTagIds.length > 0) && filteredBookmarks.length > 0 && (
        <p className="text-sm text-gray-400 dark:text-gray-500 text-center">
          Showing {filteredBookmarks.length} of {bookmarks.length} bookmarks
        </p>
      )}
    </div>
  )
}
