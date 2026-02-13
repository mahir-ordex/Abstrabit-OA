'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Tag } from '@/types/database.types'
import { BookmarkWithTags } from '@/lib/hooks/useBookmarks'
import { TagBadge } from '@/components/tags/TagBadge'
import Image from 'next/image'

interface BookmarkCardProps {
  bookmark: BookmarkWithTags
  allTags?: Tag[]
  onTagsChange?: () => void
}

export function BookmarkCard({ bookmark, allTags = [], onTagsChange }: BookmarkCardProps) {
  const [deleting, setDeleting] = useState(false)
  const [faviconError, setFaviconError] = useState(false)
  const [showTagMenu, setShowTagMenu] = useState(false)

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this bookmark?')) return
    
    setDeleting(true)
    const supabase = createClient()
    await supabase.from('bookmarks').delete().eq('id', bookmark.id)
    
    // Broadcast to other tabs for instant cross-tab sync
    try {
      const broadcastChannel = new BroadcastChannel('bookmarks-sync')
      broadcastChannel.postMessage({
        type: 'BOOKMARK_CHANGED',
        userId: bookmark.user_id,
        action: 'delete',
        bookmarkId: bookmark.id
      })
      broadcastChannel.close()
    } catch {
      // BroadcastChannel might not be supported
    }
  }

  const handleToggleTag = async (tagId: string) => {
    const supabase = createClient()
    const hasTag = bookmark.tags.some(t => t.id === tagId)
    
    if (hasTag) {
      await supabase
        .from('bookmark_tags')
        .delete()
        .eq('bookmark_id', bookmark.id)
        .eq('tag_id', tagId)
    } else {
      await supabase
        .from('bookmark_tags')
        .insert({ bookmark_id: bookmark.id, tag_id: tagId })
    }
    
    onTagsChange?.()
  }

  const formatUrl = (url: string) => {
    try {
      const urlObj = new URL(url)
      return urlObj.hostname.replace('www.', '')
    } catch {
      return url
    }
  }

  const getFaviconUrl = (url: string) => {
    try {
      const urlObj = new URL(url)
      return `https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=32`
    } catch {
      return null
    }
  }

  const faviconUrl = getFaviconUrl(bookmark.url)

  return (
    <div className="group bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4 hover:shadow-md hover:border-gray-200 dark:hover:border-gray-600 transition-all duration-200">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          {/* Favicon */}
          <div className="shrink-0 w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center overflow-hidden">
            {faviconUrl && !faviconError ? (
              <Image
                src={faviconUrl}
                alt=""
                width={20}
                height={20}
                className="w-5 h-5"
                onError={() => setFaviconError(true)}
                unoptimized
              />
            ) : (
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <a
              href={bookmark.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block"
            >
              <h3 className="font-medium text-gray-900 dark:text-gray-100 truncate hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                {bookmark.title}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 truncate mt-1">
                {formatUrl(bookmark.url)}
              </p>
            </a>
            
            {/* Tags */}
            <div className="flex items-center gap-1.5 mt-2 flex-wrap">
              {bookmark.tags.map((tag) => (
                <TagBadge key={tag.id} tag={tag} />
              ))}
              
              {/* Add tag button */}
              {allTags.length > 0 && (
                <div className="relative">
                  <button
                    onClick={() => setShowTagMenu(!showTagMenu)}
                    className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                    aria-label="Add tag"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </button>
                  
                  {showTagMenu && (
                    <div className="absolute z-10 left-0 top-full mt-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-2 min-w-30">
                      <div className="flex flex-wrap gap-1">
                        {allTags.map((tag) => (
                          <TagBadge
                            key={tag.id}
                            tag={tag}
                            selected={bookmark.tags.some(t => t.id === tag.id)}
                            onClick={() => handleToggleTag(tag.id)}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <button
          onClick={handleDelete}
          disabled={deleting}
          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-all duration-200 opacity-0 group-hover:opacity-100 disabled:opacity-50 cursor-pointer"
          aria-label="Delete bookmark"
        >
          {deleting ? (
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          )}
        </button>
      </div>
    </div>
  )
}
