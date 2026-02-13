'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

interface AddBookmarkFormProps {
  userId: string
  onSuccess?: () => void
}

export function AddBookmarkForm({ userId, onSuccess }: AddBookmarkFormProps) {
  const [url, setUrl] = useState('')
  const [title, setTitle] = useState('')
  const [loading, setLoading] = useState(false)
  const [fetchingTitle, setFetchingTitle] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [titleManuallyEdited, setTitleManuallyEdited] = useState(false)

  // Auto-fetch title when URL changes
  const fetchTitle = useCallback(async (urlToFetch: string) => {
    if (!urlToFetch || titleManuallyEdited) return

    // Validate URL before fetching
    try {
      new URL(urlToFetch)
    } catch {
      return
    }

    setFetchingTitle(true)
    try {
      const response = await fetch('/api/fetch-title', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: urlToFetch }),
      })

      if (response.ok) {
        const data = await response.json()
        if (data.title && !titleManuallyEdited) {
          setTitle(data.title)
        }
      }
    } catch {
      // Silently fail - user can enter title manually
    } finally {
      setFetchingTitle(false)
    }
  }, [titleManuallyEdited])

  // Debounce URL changes
  useEffect(() => {
    const timer = setTimeout(() => {
      if (url && !titleManuallyEdited) {
        fetchTitle(url)
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [url, fetchTitle, titleManuallyEdited])

  const handleTitleChange = (value: string) => {
    setTitle(value)
    setTitleManuallyEdited(true)
  }

  const handleUrlChange = (value: string) => {
    setUrl(value)
    // Reset manual edit flag when URL changes
    if (!titleManuallyEdited || !title) {
      setTitleManuallyEdited(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!url || !title) return

    setLoading(true)
    setError(null)

    const supabase = createClient()

    const { data: insertedBookmark, error: insertError } = await supabase
      .from('bookmarks')
      .insert({
        url,
        title,
        user_id: userId,
      })
      .select()
      .single()

    if (insertError) {
      setError(insertError.message)
    } else {
      // Broadcast to other tabs for instant cross-tab sync
      try {
        const broadcastChannel = new BroadcastChannel('bookmarks-sync')
        broadcastChannel.postMessage({
          type: 'BOOKMARK_CHANGED',
          userId,
          action: 'insert',
          bookmark: insertedBookmark
        })
        broadcastChannel.close()
      } catch {
        // BroadcastChannel might not be supported
      }
      
      setUrl('')
      setTitle('')
      setTitleManuallyEdited(false)
      onSuccess?.()
    }

    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 space-y-4 transition-colors">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Add Bookmark</h2>
      
      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/30 border border-red-100 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm">
          {error}
        </div>
      )}

      <div className="space-y-3">
        <div className="relative">
          <input
            type="url"
            placeholder="https://example.com"
            value={url}
            onChange={(e) => handleUrlChange(e.target.value)}
            required
            className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 bg-white dark:bg-gray-700"
          />
        </div>
        <div className="relative">
          <input
            type="text"
            placeholder={fetchingTitle ? "Fetching title..." : "Title (auto-filled from URL)"}
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            required
            className="w-full px-4 py-3 pr-10 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 bg-white dark:bg-gray-700"
          />
          {fetchingTitle && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <svg className="animate-spin w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            </div>
          )}
        </div>
      </div>

      <button
        type="submit"
        disabled={loading || !url || !title}
        className="w-full py-3 px-4 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 cursor-pointer"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Adding...
          </span>
        ) : (
          'Add Bookmark'
        )}
      </button>
    </form>
  )
}
