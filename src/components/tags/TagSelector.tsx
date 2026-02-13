'use client'

import { useState, useRef, useEffect } from 'react'
import { Tag } from '@/types/database.types'
import { TagBadge } from './TagBadge'
import { TAG_COLORS } from '@/lib/hooks/useTags'

interface TagSelectorProps {
  tags: Tag[]
  selectedTagIds: string[]
  onTagToggle: (tagId: string) => void
  onCreateTag: (name: string, color: string) => Promise<Tag | null>
  disabled?: boolean
}

export function TagSelector({ tags, selectedTagIds, onTagToggle, onCreateTag, disabled }: TagSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [newTagName, setNewTagName] = useState('')
  const [newTagColor, setNewTagColor] = useState(TAG_COLORS[0])
  const [creating, setCreating] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleCreateTag = async () => {
    if (!newTagName.trim() || creating) return

    setCreating(true)
    try {
      const tag = await onCreateTag(newTagName.trim(), newTagColor)
      if (tag) {
        onTagToggle(tag.id)
        setNewTagName('')
        setNewTagColor(TAG_COLORS[Math.floor(Math.random() * TAG_COLORS.length)])
      }
    } catch {
      // Error handled by parent
    } finally {
      setCreating(false)
    }
  }

  const selectedTags = tags.filter((t) => selectedTagIds.includes(t.id))

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Selected tags display */}
      <div className="flex flex-wrap gap-1.5 mb-2">
        {selectedTags.map((tag) => (
          <TagBadge
            key={tag.id}
            tag={tag}
            onRemove={() => onTagToggle(tag.id)}
          />
        ))}
      </div>

      {/* Add tag button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
        className="inline-flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer disabled:opacity-50"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
        </svg>
        {selectedTags.length === 0 ? 'Add tags' : 'Edit tags'}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-20 mt-2 w-64 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-3">
          {/* Existing tags */}
          {tags.length > 0 && (
            <div className="mb-3">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Your tags</p>
              <div className="flex flex-wrap gap-1.5">
                {tags.map((tag) => (
                  <TagBadge
                    key={tag.id}
                    tag={tag}
                    selected={selectedTagIds.includes(tag.id)}
                    onClick={() => onTagToggle(tag.id)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Create new tag */}
          <div className="border-t border-gray-100 dark:border-gray-700 pt-3">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Create new tag</p>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreateTag()}
                placeholder="Tag name"
                className="flex-1 px-2 py-1.5 text-sm border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
              <button
                type="button"
                onClick={handleCreateTag}
                disabled={!newTagName.trim() || creating}
                className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors cursor-pointer"
              >
                {creating ? '...' : 'Add'}
              </button>
            </div>
            <div className="flex gap-1.5">
              {TAG_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setNewTagColor(color)}
                  className={`w-5 h-5 rounded-full transition-transform cursor-pointer ${
                    newTagColor === color ? 'ring-2 ring-offset-1 ring-gray-400 scale-110' : 'hover:scale-110'
                  }`}
                  style={{ backgroundColor: color }}
                  aria-label={`Select color ${color}`}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
