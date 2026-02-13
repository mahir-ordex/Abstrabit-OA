'use client'

import { Tag } from '@/types/database.types'

interface TagBadgeProps {
  tag: Tag
  onRemove?: () => void
  onClick?: () => void
  selected?: boolean
  size?: 'sm' | 'md'
}

export function TagBadge({ tag, onRemove, onClick, selected, size = 'sm' }: TagBadgeProps) {
  const sizeClasses = size === 'sm' 
    ? 'text-xs px-2 py-0.5' 
    : 'text-sm px-2.5 py-1'

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-medium transition-all ${sizeClasses} ${
        onClick ? 'cursor-pointer hover:opacity-80' : ''
      } ${selected ? 'ring-2 ring-offset-1 ring-blue-500' : ''}`}
      style={{
        backgroundColor: `${tag.color}20`,
        color: tag.color,
      }}
      onClick={onClick}
    >
      {tag.name}
      {onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onRemove()
          }}
          className="ml-0.5 hover:bg-black/10 rounded-full p-0.5 cursor-pointer"
          aria-label={`Remove ${tag.name} tag`}
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </span>
  )
}
