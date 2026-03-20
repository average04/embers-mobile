/**
 * Supabase Database Types
 * Auto-generated from schema.sql
 * These types are shared between embers-web-app and embers-mobile
 */

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          username: string
          created_at: string
          updated_at: string
          embers_hidden: boolean
          is_moderator: boolean
        }
        Insert: {
          id: string
          username: string
          created_at?: string
          updated_at?: string
          embers_hidden?: boolean
          is_moderator?: boolean
        }
        Update: {
          id?: string
          username?: string
          created_at?: string
          updated_at?: string
          embers_hidden?: boolean
          is_moderator?: boolean
        }
        Relationships: [
          {
            foreignKeyName: 'profiles_id_fkey'
            columns: ['id']
            isOneToOne: true
            referencedRelation: 'users'
            referencedColumns: ['id']
          }
        ]
      }
      embers: {
        Row: {
          id: string
          thought: string
          lat: number
          lng: number
          created_at: string
          ember_type: string | null
          user_id: string | null
          username: string | null
          relit_at: string | null
          relight_count: number
          tiktok_link: string | null
          show_tiktok: boolean
        }
        Insert: {
          id?: string
          thought: string
          lat: number
          lng: number
          created_at?: string
          ember_type?: string | null
          user_id?: string | null
          username?: string | null
          relit_at?: string | null
          relight_count?: number
          tiktok_link?: string | null
          show_tiktok?: boolean
        }
        Update: {
          id?: string
          thought?: string
          lat?: number
          lng?: number
          created_at?: string
          ember_type?: string | null
          user_id?: string | null
          username?: string | null
          relit_at?: string | null
          relight_count?: number
          tiktok_link?: string | null
          show_tiktok?: boolean
        }
        Relationships: [
          {
            foreignKeyName: 'embers_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          }
        ]
      }
      blue_embers: {
        Row: {
          id: string
          title: string
          audio_url: string
          audio_duration: number
          user_id: string
          username: string
          lat: number
          lng: number
          created_at: string
          relit_at: string | null
          relight_count: number
        }
        Insert: {
          id?: string
          title: string
          audio_url: string
          audio_duration: number
          user_id: string
          username: string
          lat: number
          lng: number
          created_at?: string
          relit_at?: string | null
          relight_count?: number
        }
        Update: {
          id?: string
          title?: string
          audio_url?: string
          audio_duration?: number
          user_id?: string
          username?: string
          lat?: number
          lng?: number
          created_at?: string
          relit_at?: string | null
          relight_count?: number
        }
        Relationships: [
          {
            foreignKeyName: 'blue_embers_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          }
        ]
      }
      ember_comments: {
        Row: {
          id: string
          ember_id: string
          user_id: string
          username: string
          content: string
          created_at: string
        }
        Insert: {
          id?: string
          ember_id: string
          user_id: string
          username: string
          content: string
          created_at?: string
        }
        Update: {
          id?: string
          ember_id?: string
          user_id?: string
          username?: string
          content?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'ember_comments_ember_id_fkey'
            columns: ['ember_id']
            isOneToOne: false
            referencedRelation: 'embers'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'ember_comments_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          }
        ]
      }
      blue_ember_comments: {
        Row: {
          id: string
          blue_ember_id: string
          user_id: string
          username: string
          content: string
          created_at: string
        }
        Insert: {
          id?: string
          blue_ember_id: string
          user_id: string
          username: string
          content: string
          created_at?: string
        }
        Update: {
          id?: string
          blue_ember_id?: string
          user_id?: string
          username?: string
          content?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'blue_ember_comments_blue_ember_id_fkey'
            columns: ['blue_ember_id']
            isOneToOne: false
            referencedRelation: 'blue_embers'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'blue_ember_comments_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          }
        ]
      }
      ember_reactions: {
        Row: {
          id: string
          ember_id: string | null
          user_id: string | null
          reaction_type: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          ember_id?: string | null
          user_id?: string | null
          reaction_type: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          ember_id?: string | null
          user_id?: string | null
          reaction_type?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'ember_reactions_ember_id_fkey'
            columns: ['ember_id']
            isOneToOne: false
            referencedRelation: 'embers'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'ember_reactions_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          }
        ]
      }
      blue_ember_reactions: {
        Row: {
          id: string
          blue_ember_id: string | null
          user_id: string | null
          reaction_type: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          blue_ember_id?: string | null
          user_id?: string | null
          reaction_type: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          blue_ember_id?: string | null
          user_id?: string | null
          reaction_type?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'blue_ember_reactions_blue_ember_id_fkey'
            columns: ['blue_ember_id']
            isOneToOne: false
            referencedRelation: 'blue_embers'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'blue_ember_reactions_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          }
        ]
      }
      ember_relights: {
        Row: {
          id: string
          ember_id: string | null
          user_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          ember_id?: string | null
          user_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          ember_id?: string | null
          user_id?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'ember_relights_ember_id_fkey'
            columns: ['ember_id']
            isOneToOne: false
            referencedRelation: 'embers'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'ember_relights_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          }
        ]
      }
      blue_ember_relights: {
        Row: {
          id: string
          blue_ember_id: string
          user_id: string
          created_at: string
        }
        Insert: {
          id?: string
          blue_ember_id: string
          user_id: string
          created_at?: string
        }
        Update: {
          id?: string
          blue_ember_id?: string
          user_id?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'blue_ember_relights_blue_ember_id_fkey'
            columns: ['blue_ember_id']
            isOneToOne: false
            referencedRelation: 'blue_embers'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'blue_ember_relights_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          }
        ]
      }
      ember_reports: {
        Row: {
          id: string
          ember_id: string | null
          blue_ember_id: string | null
          reporter_id: string
          reason: string
          status: string
          created_at: string
        }
        Insert: {
          id?: string
          ember_id?: string | null
          blue_ember_id?: string | null
          reporter_id: string
          reason: string
          status?: string
          created_at?: string
        }
        Update: {
          id?: string
          ember_id?: string | null
          blue_ember_id?: string | null
          reporter_id?: string
          reason?: string
          status?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'ember_reports_blue_ember_id_fkey'
            columns: ['blue_ember_id']
            isOneToOne: false
            referencedRelation: 'blue_embers'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'ember_reports_ember_id_fkey'
            columns: ['ember_id']
            isOneToOne: false
            referencedRelation: 'embers'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'ember_reports_reporter_id_fkey'
            columns: ['reporter_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          }
        ]
      }
      profanity_reports: {
        Row: {
          id: string
          ip_address: string | null
          user_id: string | null
          ember_id: string | null
          thought: string
          flagged_words: string[] | null
          status: string
          created_at: string
        }
        Insert: {
          id?: string
          ip_address?: string | null
          user_id?: string | null
          ember_id?: string | null
          thought: string
          flagged_words?: string[] | null
          status?: string
          created_at?: string
        }
        Update: {
          id?: string
          ip_address?: string | null
          user_id?: string | null
          ember_id?: string | null
          thought?: string
          flagged_words?: string[] | null
          status?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'profanity_reports_ember_id_fkey'
            columns: ['ember_id']
            isOneToOne: false
            referencedRelation: 'embers'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'profanity_reports_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          }
        ]
      }
      notifications: {
        Row: {
          id: string
          recipient_id: string
          actor_id: string | null
          actor_username: string | null
          ember_id: string | null
          blue_ember_id: string | null
          type: string
          reaction_type: string | null
          read: boolean
          message: string | null
          created_at: string
        }
        Insert: {
          id?: string
          recipient_id: string
          actor_id?: string | null
          actor_username?: string | null
          ember_id?: string | null
          blue_ember_id?: string | null
          type: string
          reaction_type?: string | null
          read?: boolean
          message?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          recipient_id?: string
          actor_id?: string | null
          actor_username?: string | null
          ember_id?: string | null
          blue_ember_id?: string | null
          type?: string
          reaction_type?: string | null
          read?: boolean
          message?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'notifications_actor_id_fkey'
            columns: ['actor_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'notifications_blue_ember_id_fkey'
            columns: ['blue_ember_id']
            isOneToOne: false
            referencedRelation: 'blue_embers'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'notifications_ember_id_fkey'
            columns: ['ember_id']
            isOneToOne: false
            referencedRelation: 'embers'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'notifications_recipient_id_fkey'
            columns: ['recipient_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          }
        ]
      }
      moderator_logs: {
        Row: {
          id: string
          moderator_id: string
          moderator_username: string
          action: string
          target_id: string | null
          target_type: string | null
          target_preview: string | null
          reason: string | null
          metadata: Record<string, unknown> | null
          created_at: string
        }
        Insert: {
          id?: string
          moderator_id: string
          moderator_username: string
          action: string
          target_id?: string | null
          target_type?: string | null
          target_preview?: string | null
          reason?: string | null
          metadata?: Record<string, unknown> | null
          created_at?: string
        }
        Update: {
          id?: string
          moderator_id?: string
          moderator_username?: string
          action?: string
          target_id?: string | null
          target_type?: string | null
          target_preview?: string | null
          reason?: string | null
          metadata?: Record<string, unknown> | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'moderator_logs_moderator_id_fkey'
            columns: ['moderator_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          }
        ]
      }
      blocked_ips: {
        Row: {
          id: string
          ip_address: string
          reason: string | null
          created_at: string
        }
        Insert: {
          id?: string
          ip_address: string
          reason?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          ip_address?: string
          reason?: string | null
          created_at?: string
        }
        Relationships: []
      }
      blocks: {
        Row: {
          id: string
          blocker_id: string
          blocked_id: string
          created_at: string
        }
        Insert: {
          id?: string
          blocker_id: string
          blocked_id: string
          created_at?: string
        }
        Update: {
          id?: string
          blocker_id?: string
          blocked_id?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'blocks_blocked_id_fkey'
            columns: ['blocked_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'blocks_blocker_id_fkey'
            columns: ['blocker_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          }
        ]
      }
      follows: {
        Row: {
          id: string
          follower_id: string
          following_id: string
          created_at: string
        }
        Insert: {
          id?: string
          follower_id: string
          following_id: string
          created_at?: string
        }
        Update: {
          id?: string
          follower_id?: string
          following_id?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'follows_follower_id_fkey'
            columns: ['follower_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'follows_following_id_fkey'
            columns: ['following_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          }
        ]
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
