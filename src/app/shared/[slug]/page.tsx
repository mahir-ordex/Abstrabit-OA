import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'

interface PageProps {
  params: Promise<{ slug: string }>
}

export default async function SharedCollectionPage({ params }: PageProps) {
  const { slug } = await params
  const supabase = await createClient()

  // Fetch the shared collection
  const { data: collection } = await supabase
    .from('shared_collections')
    .select('*')
    .eq('slug', slug)
    .eq('is_public', true)
    .single()

  if (!collection) {
    notFound()
  }

  // Fetch bookmarks in this collection
  const { data: collectionBookmarks } = await supabase
    .from('collection_bookmarks')
    .select('bookmark_id, sort_order')
    .eq('collection_id', collection.id)
    .order('sort_order', { ascending: true })

  const bookmarkIds = collectionBookmarks?.map(cb => cb.bookmark_id) || []

  // Fetch the actual bookmarks
  const { data: bookmarks } = await supabase
    .from('bookmarks')
    .select('*')
    .in('id', bookmarkIds)

  // Sort bookmarks by the sort order in collection_bookmarks
  const sortedBookmarks = bookmarkIds
    .map(id => bookmarks?.find(b => b.id === id))
    .filter(Boolean)

  const getFaviconUrl = (url: string) => {
    try {
      const urlObj = new URL(url)
      return `https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=32`
    } catch {
      return null
    }
  }

  const formatUrl = (url: string) => {
    try {
      const urlObj = new URL(url)
      return urlObj.hostname.replace('www.', '')
    } catch {
      return url
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
        <div className="max-w-2xl mx-auto px-4 py-6">
          <Link 
            href="/"
            className="inline-flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 mb-4"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Smart Bookmarks
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{collection.name}</h1>
          {collection.description && (
            <p className="text-gray-600 dark:text-gray-400 mt-2">{collection.description}</p>
          )}
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
            {sortedBookmarks.length} bookmark{sortedBookmarks.length !== 1 ? 's' : ''}
          </p>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        {sortedBookmarks.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-12 text-center">
            <p className="text-gray-500 dark:text-gray-400">This collection is empty</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sortedBookmarks.map((bookmark) => {
              if (!bookmark) return null
              const faviconUrl = getFaviconUrl(bookmark.url)
              
              return (
                <a
                  key={bookmark.id}
                  href={bookmark.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4 hover:shadow-md hover:border-gray-200 dark:hover:border-gray-600 transition-all duration-200"
                >
                  <div className="flex items-center gap-3">
                    <div className="shrink-0 w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center overflow-hidden">
                      {faviconUrl ? (
                        <Image
                          src={faviconUrl}
                          alt=""
                          width={20}
                          height={20}
                          className="w-5 h-5"
                          unoptimized
                        />
                      ) : (
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                        </svg>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 dark:text-gray-100 truncate hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                        {bookmark.title}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 truncate mt-0.5">
                        {formatUrl(bookmark.url)}
                      </p>
                    </div>
                    <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </div>
                </a>
              )
            })}
          </div>
        )}
      </main>

      <footer className="max-w-2xl mx-auto px-4 py-8 text-center">
        <p className="text-sm text-gray-400 dark:text-gray-500">
          Shared via{' '}
          <Link href="/" className="text-blue-600 dark:text-blue-400 hover:underline">
            Smart Bookmarks
          </Link>
        </p>
      </footer>
    </div>
  )
}
