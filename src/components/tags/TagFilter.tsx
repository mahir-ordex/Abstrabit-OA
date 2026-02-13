'use client'

import { Tag } from '@/types/database.types'
import { TagBadge } from './TagBadge'

interface TagFilterProps {
  tags: Tag[]
  selectedTagIds: string[]
  onTagToggle: (tagId: string) => void
  onClear: () => void
}

export function TagFilter({ tags, selectedTagIds, onTagToggle, onClear }: TagFilterProps) {
  if (tags.length === 0) return null

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm text-gray-500 dark:text-gray-400">Filter:</span>
      {tags.map((tag) => (
        <TagBadge
          key={tag.id}
          tag={tag}
          selected={selectedTagIds.includes(tag.id)}
          onClick={() => onTagToggle(tag.id)}
        />
      ))}
      {selectedTagIds.length > 0 && (
        <button
          onClick={onClear}
          className="text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors cursor-pointer"
        >
          Clear
        </button>
      )}
    </div>
  )
}
