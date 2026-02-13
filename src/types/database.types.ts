export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      bookmarks: {
        Row: {
          id: string
          user_id: string
          url: string
          title: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          url: string
          title: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          url?: string
          title?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'bookmarks_user_id_fkey'
            columns: ['user_id']
            referencedRelation: 'users'
            referencedColumns: ['id']
          }
        ]
      }
      tags: {
        Row: {
          id: string
          user_id: string
          name: string
          color: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          color?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          color?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'tags_user_id_fkey'
            columns: ['user_id']
            referencedRelation: 'users'
            referencedColumns: ['id']
          }
        ]
      }
      bookmark_tags: {
        Row: {
          bookmark_id: string
          tag_id: string
        }
        Insert: {
          bookmark_id: string
          tag_id: string
        }
        Update: {
          bookmark_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'bookmark_tags_bookmark_id_fkey'
            columns: ['bookmark_id']
            referencedRelation: 'bookmarks'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'bookmark_tags_tag_id_fkey'
            columns: ['tag_id']
            referencedRelation: 'tags'
            referencedColumns: ['id']
          }
        ]
      }
      shared_collections: {
        Row: {
          id: string
          user_id: string
          name: string
          slug: string
          description: string | null
          is_public: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          slug: string
          description?: string | null
          is_public?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          slug?: string
          description?: string | null
          is_public?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'shared_collections_user_id_fkey'
            columns: ['user_id']
            referencedRelation: 'users'
            referencedColumns: ['id']
          }
        ]
      }
      collection_bookmarks: {
        Row: {
          collection_id: string
          bookmark_id: string
          sort_order: number
        }
        Insert: {
          collection_id: string
          bookmark_id: string
          sort_order?: number
        }
        Update: {
          collection_id?: string
          bookmark_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: 'collection_bookmarks_collection_id_fkey'
            columns: ['collection_id']
            referencedRelation: 'shared_collections'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'collection_bookmarks_bookmark_id_fkey'
            columns: ['bookmark_id']
            referencedRelation: 'bookmarks'
            referencedColumns: ['id']
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

export type Bookmark = Database['public']['Tables']['bookmarks']['Row']
export type BookmarkInsert = Database['public']['Tables']['bookmarks']['Insert']
export type Tag = Database['public']['Tables']['tags']['Row']
export type TagInsert = Database['public']['Tables']['tags']['Insert']
export type BookmarkTag = Database['public']['Tables']['bookmark_tags']['Row']

// Extended bookmark type with tags
export interface BookmarkWithTags extends Bookmark {
  tags?: Tag[]
}

// Shared collection types
export interface SharedCollection {
  id: string
  user_id: string
  name: string
  slug: string
  description: string | null
  is_public: boolean
  created_at: string
  updated_at: string
}

export interface CollectionBookmark {
  collection_id: string
  bookmark_id: string
  sort_order: number
}

export interface SharedCollectionWithBookmarks extends SharedCollection {
  bookmarks: Bookmark[]
}
