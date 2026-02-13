'use client'

import { useRef } from 'react'
import { AddBookmarkForm } from './AddBookmarkForm'
import { BookmarkList } from './BookmarkList'

interface BookmarkManagerProps {
  userId: string
}

export function BookmarkManager({ userId }: BookmarkManagerProps) {
  const refetchRef = useRef<(() => void) | null>(null)

  const handleBookmarkAdded = () => {
    // Trigger refetch as backup (realtime should also handle this)
    refetchRef.current?.()
  }

  return (
    <div className="space-y-6">
      <AddBookmarkForm userId={userId} onSuccess={handleBookmarkAdded} />
      <BookmarkList userId={userId} refetchRef={refetchRef} />
    </div>
  )
}
