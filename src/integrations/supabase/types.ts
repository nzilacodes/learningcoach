export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      account_lockouts: {
        Row: {
          created_at: string
          email: string
          id: string
          ip_address: string | null
          locked_until: string
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          ip_address?: string | null
          locked_until: string
          reason?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          ip_address?: string | null
          locked_until?: string
          reason?: string
        }
        Relationships: []
      }
      achievements: {
        Row: {
          code: string
          created_at: string
          description: string | null
          icon: string | null
          id: string
          title: string
          xp_reward: number
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          title: string
          xp_reward?: number
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          title?: string
          xp_reward?: number
        }
        Relationships: []
      }
      ai_conversations: {
        Row: {
          context: string | null
          created_at: string
          id: string
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          context?: string | null
          created_at?: string
          id?: string
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          context?: string | null
          created_at?: string
          id?: string
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ai_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          role: string
          user_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "ai_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      app_settings: {
        Row: {
          id: boolean
          min_exam_score: number
          updated_at: string
        }
        Insert: {
          id?: boolean
          min_exam_score?: number
          updated_at?: string
        }
        Update: {
          id?: boolean
          min_exam_score?: number
          updated_at?: string
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          actor_email: string | null
          created_at: string
          entity: string | null
          entity_id: string | null
          id: string
          ip_address: string | null
          metadata: Json
          severity: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          actor_email?: string | null
          created_at?: string
          entity?: string | null
          entity_id?: string | null
          id?: string
          ip_address?: string | null
          metadata?: Json
          severity?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          actor_email?: string | null
          created_at?: string
          entity?: string | null
          entity_id?: string | null
          id?: string
          ip_address?: string | null
          metadata?: Json
          severity?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      certificates: {
        Row: {
          course_id: string | null
          course_title: string | null
          created_at: string
          full_name: string | null
          id: string
          issued_at: string
          level: Database["public"]["Enums"]["cefr_level"]
          pdf_url: string | null
          score: number | null
          signature: string | null
          user_id: string
          verification_code: string
        }
        Insert: {
          course_id?: string | null
          course_title?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          issued_at?: string
          level: Database["public"]["Enums"]["cefr_level"]
          pdf_url?: string | null
          score?: number | null
          signature?: string | null
          user_id: string
          verification_code?: string
        }
        Update: {
          course_id?: string | null
          course_title?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          issued_at?: string
          level?: Database["public"]["Enums"]["cefr_level"]
          pdf_url?: string | null
          score?: number | null
          signature?: string | null
          user_id?: string
          verification_code?: string
        }
        Relationships: [
          {
            foreignKeyName: "certificates_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      community_messages: {
        Row: {
          content: string
          created_at: string
          display_name: string
          id: string
          kind: string
          room: Database["public"]["Enums"]["age_room"]
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          display_name: string
          id?: string
          kind?: string
          room: Database["public"]["Enums"]["age_room"]
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          display_name?: string
          id?: string
          kind?: string
          room?: Database["public"]["Enums"]["age_room"]
          user_id?: string
        }
        Relationships: []
      }
      courses: {
        Row: {
          cover_url: string | null
          created_at: string
          description: string | null
          id: string
          is_published: boolean
          level: Database["public"]["Enums"]["cefr_level"]
          order_index: number
          slug: string
          title: string
          updated_at: string
        }
        Insert: {
          cover_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_published?: boolean
          level: Database["public"]["Enums"]["cefr_level"]
          order_index?: number
          slug: string
          title: string
          updated_at?: string
        }
        Update: {
          cover_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_published?: boolean
          level?: Database["public"]["Enums"]["cefr_level"]
          order_index?: number
          slug?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      diagnostic_results: {
        Row: {
          cefr_level: string
          created_at: string
          feedback: string | null
          grammar_score: number
          id: string
          learning_plan: Json
          listening_score: number
          overall_score: number
          pronunciation_score: number
          raw_answers: Json
          reading_score: number
          speaking_score: number
          strengths: Json
          updated_at: string
          user_id: string
          vocabulary_score: number
          weaknesses: Json
          writing_score: number
        }
        Insert: {
          cefr_level: string
          created_at?: string
          feedback?: string | null
          grammar_score?: number
          id?: string
          learning_plan?: Json
          listening_score?: number
          overall_score?: number
          pronunciation_score?: number
          raw_answers?: Json
          reading_score?: number
          speaking_score?: number
          strengths?: Json
          updated_at?: string
          user_id: string
          vocabulary_score?: number
          weaknesses?: Json
          writing_score?: number
        }
        Update: {
          cefr_level?: string
          created_at?: string
          feedback?: string | null
          grammar_score?: number
          id?: string
          learning_plan?: Json
          listening_score?: number
          overall_score?: number
          pronunciation_score?: number
          raw_answers?: Json
          reading_score?: number
          speaking_score?: number
          strengths?: Json
          updated_at?: string
          user_id?: string
          vocabulary_score?: number
          weaknesses?: Json
          writing_score?: number
        }
        Relationships: []
      }
      exercises: {
        Row: {
          correct_answer: Json | null
          created_at: string
          data: Json | null
          id: string
          lesson_id: string
          order_index: number
          prompt: string
          type: string
          updated_at: string
          xp_reward: number
        }
        Insert: {
          correct_answer?: Json | null
          created_at?: string
          data?: Json | null
          id?: string
          lesson_id: string
          order_index?: number
          prompt: string
          type: string
          updated_at?: string
          xp_reward?: number
        }
        Update: {
          correct_answer?: Json | null
          created_at?: string
          data?: Json | null
          id?: string
          lesson_id?: string
          order_index?: number
          prompt?: string
          type?: string
          updated_at?: string
          xp_reward?: number
        }
        Relationships: [
          {
            foreignKeyName: "exercises_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      friendships: {
        Row: {
          created_at: string
          friend_id: string
          id: string
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          friend_id: string
          id?: string
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          friend_id?: string
          id?: string
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      lesson_progress: {
        Row: {
          completed_at: string | null
          id: string
          lesson_id: string | null
          progress_pct: number
          unit_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          id?: string
          lesson_id?: string | null
          progress_pct?: number
          unit_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          id?: string
          lesson_id?: string | null
          progress_pct?: number
          unit_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      lessons: {
        Row: {
          content: Json | null
          created_at: string
          duration_min: number | null
          id: string
          is_published: boolean
          lesson_type: Database["public"]["Enums"]["lesson_type"] | null
          order_index: number
          slug: string
          summary: string | null
          title: string
          unit_id: string
          updated_at: string
          xp_reward: number
        }
        Insert: {
          content?: Json | null
          created_at?: string
          duration_min?: number | null
          id?: string
          is_published?: boolean
          lesson_type?: Database["public"]["Enums"]["lesson_type"] | null
          order_index?: number
          slug: string
          summary?: string | null
          title: string
          unit_id: string
          updated_at?: string
          xp_reward?: number
        }
        Update: {
          content?: Json | null
          created_at?: string
          duration_min?: number | null
          id?: string
          is_published?: boolean
          lesson_type?: Database["public"]["Enums"]["lesson_type"] | null
          order_index?: number
          slug?: string
          summary?: string | null
          title?: string
          unit_id?: string
          updated_at?: string
          xp_reward?: number
        }
        Relationships: [
          {
            foreignKeyName: "lessons_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      level_exam_attempts: {
        Row: {
          answers: Json | null
          created_at: string
          id: string
          level: Database["public"]["Enums"]["cefr_level"]
          passed: boolean
          score: number
          user_id: string
        }
        Insert: {
          answers?: Json | null
          created_at?: string
          id?: string
          level: Database["public"]["Enums"]["cefr_level"]
          passed: boolean
          score: number
          user_id: string
        }
        Update: {
          answers?: Json | null
          created_at?: string
          id?: string
          level?: Database["public"]["Enums"]["cefr_level"]
          passed?: boolean
          score?: number
          user_id?: string
        }
        Relationships: []
      }
      level_exams: {
        Row: {
          level: Database["public"]["Enums"]["cefr_level"]
          questions: Json
          title: string
          updated_at: string
        }
        Insert: {
          level: Database["public"]["Enums"]["cefr_level"]
          questions: Json
          title: string
          updated_at?: string
        }
        Update: {
          level?: Database["public"]["Enums"]["cefr_level"]
          questions?: Json
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      login_attempts: {
        Row: {
          created_at: string
          email: string
          id: string
          ip_address: string | null
          reason: string | null
          success: boolean
          user_agent: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          ip_address?: string | null
          reason?: string | null
          success?: boolean
          user_agent?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          ip_address?: string | null
          reason?: string | null
          success?: boolean
          user_agent?: string | null
        }
        Relationships: []
      }
      missions: {
        Row: {
          action_type: string
          code: string
          coin_reward: number
          created_at: string
          description: string
          icon: string
          id: string
          is_active: boolean
          scope: string
          target: number
          title: string
          xp_reward: number
        }
        Insert: {
          action_type: string
          code: string
          coin_reward?: number
          created_at?: string
          description?: string
          icon?: string
          id?: string
          is_active?: boolean
          scope: string
          target?: number
          title: string
          xp_reward?: number
        }
        Update: {
          action_type?: string
          code?: string
          coin_reward?: number
          created_at?: string
          description?: string
          icon?: string
          id?: string
          is_active?: boolean
          scope?: string
          target?: number
          title?: string
          xp_reward?: number
        }
        Relationships: []
      }
      notifications: {
        Row: {
          action_url: string | null
          body: string | null
          created_at: string
          id: string
          is_read: boolean
          title: string
          type: string
          user_id: string
        }
        Insert: {
          action_url?: string | null
          body?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          title: string
          type?: string
          user_id: string
        }
        Update: {
          action_url?: string | null
          body?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          activated_by: string | null
          amount_kz: number
          created_at: string
          entity: string
          expires_at: string
          id: string
          invoice_number: string | null
          metadata: Json
          method: Database["public"]["Enums"]["payment_method"] | null
          notes: string | null
          paid_at: string | null
          phone: string | null
          plan_id: string
          provider: string
          provider_transaction_id: string | null
          receipt_url: string | null
          reference: string
          status: Database["public"]["Enums"]["payment_status"]
          subscription_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          activated_by?: string | null
          amount_kz: number
          created_at?: string
          entity?: string
          expires_at?: string
          id?: string
          invoice_number?: string | null
          metadata?: Json
          method?: Database["public"]["Enums"]["payment_method"] | null
          notes?: string | null
          paid_at?: string | null
          phone?: string | null
          plan_id: string
          provider?: string
          provider_transaction_id?: string | null
          receipt_url?: string | null
          reference: string
          status?: Database["public"]["Enums"]["payment_status"]
          subscription_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          activated_by?: string | null
          amount_kz?: number
          created_at?: string
          entity?: string
          expires_at?: string
          id?: string
          invoice_number?: string | null
          metadata?: Json
          method?: Database["public"]["Enums"]["payment_method"] | null
          notes?: string | null
          paid_at?: string | null
          phone?: string | null
          plan_id?: string
          provider?: string
          provider_transaction_id?: string | null
          receipt_url?: string | null
          reference?: string
          status?: Database["public"]["Enums"]["payment_status"]
          subscription_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          age: number | null
          avatar_config: Json
          avatar_url: string | null
          cefr_level: string | null
          coins: number
          country: string | null
          created_at: string
          demo_completed: boolean
          email: string | null
          first_name: string | null
          full_name: string | null
          id: string
          interests: string[]
          last_active_date: string | null
          last_name: string | null
          learning_goal: string | null
          level: number
          native_language: string | null
          onboarding_status: string
          phone: string | null
          selected_plan: string | null
          streak: number
          updated_at: string
          xp: number
        }
        Insert: {
          age?: number | null
          avatar_config?: Json
          avatar_url?: string | null
          cefr_level?: string | null
          coins?: number
          country?: string | null
          created_at?: string
          demo_completed?: boolean
          email?: string | null
          first_name?: string | null
          full_name?: string | null
          id: string
          interests?: string[]
          last_active_date?: string | null
          last_name?: string | null
          learning_goal?: string | null
          level?: number
          native_language?: string | null
          onboarding_status?: string
          phone?: string | null
          selected_plan?: string | null
          streak?: number
          updated_at?: string
          xp?: number
        }
        Update: {
          age?: number | null
          avatar_config?: Json
          avatar_url?: string | null
          cefr_level?: string | null
          coins?: number
          country?: string | null
          created_at?: string
          demo_completed?: boolean
          email?: string | null
          first_name?: string | null
          full_name?: string | null
          id?: string
          interests?: string[]
          last_active_date?: string | null
          last_name?: string | null
          learning_goal?: string | null
          level?: number
          native_language?: string | null
          onboarding_status?: string
          phone?: string | null
          selected_plan?: string | null
          streak?: number
          updated_at?: string
          xp?: number
        }
        Relationships: []
      }
      progress: {
        Row: {
          attempts: number
          completed_at: string | null
          created_at: string
          exercise_id: string | null
          id: string
          lesson_id: string | null
          score: number | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          attempts?: number
          completed_at?: string | null
          created_at?: string
          exercise_id?: string | null
          id?: string
          lesson_id?: string | null
          score?: number | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          attempts?: number
          completed_at?: string | null
          created_at?: string
          exercise_id?: string | null
          id?: string
          lesson_id?: string | null
          score?: number | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "progress_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "progress_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      pronunciation_assessments: {
        Row: {
          accuracy: number | null
          audio_url: string | null
          clarity: number | null
          created_at: string
          expected_text: string
          feedback: string | null
          fluency: number | null
          id: string
          intonation: number | null
          lesson_id: string | null
          overall: number | null
          phoneme_issues: Json
          rhythm: number | null
          transcribed_text: string | null
          user_id: string
          word: string | null
        }
        Insert: {
          accuracy?: number | null
          audio_url?: string | null
          clarity?: number | null
          created_at?: string
          expected_text: string
          feedback?: string | null
          fluency?: number | null
          id?: string
          intonation?: number | null
          lesson_id?: string | null
          overall?: number | null
          phoneme_issues?: Json
          rhythm?: number | null
          transcribed_text?: string | null
          user_id: string
          word?: string | null
        }
        Update: {
          accuracy?: number | null
          audio_url?: string | null
          clarity?: number | null
          created_at?: string
          expected_text?: string
          feedback?: string | null
          fluency?: number | null
          id?: string
          intonation?: number | null
          lesson_id?: string | null
          overall?: number | null
          phoneme_issues?: Json
          rhythm?: number | null
          transcribed_text?: string | null
          user_id?: string
          word?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pronunciation_assessments_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      reading_assessments: {
        Row: {
          accuracy: number | null
          clarity: number | null
          comprehension_score: number | null
          created_at: string
          duration_seconds: number | null
          feedback: string | null
          fluency: number | null
          id: string
          intonation: number | null
          lesson_id: string | null
          mispronounced: Json | null
          overall: number | null
          passage: string
          passage_key: string | null
          pauses: number | null
          pronunciation: number | null
          rhythm: number | null
          transcript: string | null
          user_id: string
          wpm: number | null
        }
        Insert: {
          accuracy?: number | null
          clarity?: number | null
          comprehension_score?: number | null
          created_at?: string
          duration_seconds?: number | null
          feedback?: string | null
          fluency?: number | null
          id?: string
          intonation?: number | null
          lesson_id?: string | null
          mispronounced?: Json | null
          overall?: number | null
          passage: string
          passage_key?: string | null
          pauses?: number | null
          pronunciation?: number | null
          rhythm?: number | null
          transcript?: string | null
          user_id: string
          wpm?: number | null
        }
        Update: {
          accuracy?: number | null
          clarity?: number | null
          comprehension_score?: number | null
          created_at?: string
          duration_seconds?: number | null
          feedback?: string | null
          fluency?: number | null
          id?: string
          intonation?: number | null
          lesson_id?: string | null
          mispronounced?: Json | null
          overall?: number | null
          passage?: string
          passage_key?: string | null
          pauses?: number | null
          pronunciation?: number | null
          rhythm?: number | null
          transcript?: string | null
          user_id?: string
          wpm?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "reading_assessments_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      shop_items: {
        Row: {
          category: string
          code: string
          cost_coins: number
          description: string
          icon: string
          id: string
          is_active: boolean
          name: string
          payload: Json
        }
        Insert: {
          category: string
          code: string
          cost_coins: number
          description?: string
          icon?: string
          id?: string
          is_active?: boolean
          name: string
          payload?: Json
        }
        Update: {
          category?: string
          code?: string
          cost_coins?: number
          description?: string
          icon?: string
          id?: string
          is_active?: boolean
          name?: string
          payload?: Json
        }
        Relationships: []
      }
      study_reminders: {
        Row: {
          enabled: boolean
          interval_minutes: number
          updated_at: string
          user_id: string
        }
        Insert: {
          enabled?: boolean
          interval_minutes?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          enabled?: boolean
          interval_minutes?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      study_sessions: {
        Row: {
          day: string
          id: string
          seconds: number
          updated_at: string
          user_id: string
        }
        Insert: {
          day?: string
          id?: string
          seconds?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          day?: string
          id?: string
          seconds?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      subscription_plans: {
        Row: {
          billing_cycle: Database["public"]["Enums"]["billing_cycle"]
          call_minutes: number
          community_access: boolean
          created_at: string
          duration_days: number
          features: Json
          id: string
          is_active: boolean
          price_kz: number
          tier: Database["public"]["Enums"]["plan_tier"]
        }
        Insert: {
          billing_cycle: Database["public"]["Enums"]["billing_cycle"]
          call_minutes?: number
          community_access?: boolean
          created_at?: string
          duration_days: number
          features?: Json
          id?: string
          is_active?: boolean
          price_kz: number
          tier: Database["public"]["Enums"]["plan_tier"]
        }
        Update: {
          billing_cycle?: Database["public"]["Enums"]["billing_cycle"]
          call_minutes?: number
          community_access?: boolean
          created_at?: string
          duration_days?: number
          features?: Json
          id?: string
          is_active?: boolean
          price_kz?: number
          tier?: Database["public"]["Enums"]["plan_tier"]
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          activation_code: string | null
          created_at: string
          expires_at: string | null
          id: string
          plan_id: string
          starts_at: string | null
          status: Database["public"]["Enums"]["subscription_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          activation_code?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          plan_id: string
          starts_at?: string | null
          status?: Database["public"]["Enums"]["subscription_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          activation_code?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          plan_id?: string
          starts_at?: string | null
          status?: Database["public"]["Enums"]["subscription_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      units: {
        Row: {
          course_id: string
          created_at: string
          description: string | null
          id: string
          order_index: number
          theme: string | null
          title: string
          updated_at: string
        }
        Insert: {
          course_id: string
          created_at?: string
          description?: string | null
          id?: string
          order_index?: number
          theme?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          course_id?: string
          created_at?: string
          description?: string | null
          id?: string
          order_index?: number
          theme?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "units_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      user_achievements: {
        Row: {
          achievement_id: string
          earned_at: string
          id: string
          user_id: string
        }
        Insert: {
          achievement_id: string
          earned_at?: string
          id?: string
          user_id: string
        }
        Update: {
          achievement_id?: string
          earned_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_achievements_achievement_id_fkey"
            columns: ["achievement_id"]
            isOneToOne: false
            referencedRelation: "achievements"
            referencedColumns: ["id"]
          },
        ]
      }
      user_inventory: {
        Row: {
          acquired_at: string
          equipped: boolean
          id: string
          item_id: string
          user_id: string
        }
        Insert: {
          acquired_at?: string
          equipped?: boolean
          id?: string
          item_id: string
          user_id: string
        }
        Update: {
          acquired_at?: string
          equipped?: boolean
          id?: string
          item_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_inventory_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "shop_items"
            referencedColumns: ["id"]
          },
        ]
      }
      user_missions: {
        Row: {
          claimed_at: string | null
          completed_at: string | null
          id: string
          mission_id: string
          period_key: string
          progress: number
          user_id: string
        }
        Insert: {
          claimed_at?: string | null
          completed_at?: string | null
          id?: string
          mission_id: string
          period_key: string
          progress?: number
          user_id: string
        }
        Update: {
          claimed_at?: string | null
          completed_at?: string | null
          id?: string
          mission_id?: string
          period_key?: string
          progress?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_missions_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "missions"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_stats: {
        Row: {
          last_activity_date: string | null
          streak_days: number
          updated_at: string
          user_id: string
          xp: number
        }
        Insert: {
          last_activity_date?: string | null
          streak_days?: number
          updated_at?: string
          user_id: string
          xp?: number
        }
        Update: {
          last_activity_date?: string | null
          streak_days?: number
          updated_at?: string
          user_id?: string
          xp?: number
        }
        Relationships: []
      }
      video_history: {
        Row: {
          channel: string | null
          completed: boolean
          created_at: string
          duration_seconds: number | null
          id: string
          last_watched_at: string
          lesson_id: string | null
          position_seconds: number
          title: string | null
          updated_at: string
          user_id: string
          video_id: string
          video_url: string
        }
        Insert: {
          channel?: string | null
          completed?: boolean
          created_at?: string
          duration_seconds?: number | null
          id?: string
          last_watched_at?: string
          lesson_id?: string | null
          position_seconds?: number
          title?: string | null
          updated_at?: string
          user_id: string
          video_id: string
          video_url: string
        }
        Update: {
          channel?: string | null
          completed?: boolean
          created_at?: string
          duration_seconds?: number | null
          id?: string
          last_watched_at?: string
          lesson_id?: string | null
          position_seconds?: number
          title?: string | null
          updated_at?: string
          user_id?: string
          video_id?: string
          video_url?: string
        }
        Relationships: []
      }
      video_study_packs: {
        Row: {
          age_group: string | null
          channel: string | null
          created_at: string
          level: string | null
          pack: Json
          title: string | null
          topic: string | null
          updated_at: string
          video_id: string
          video_url: string
        }
        Insert: {
          age_group?: string | null
          channel?: string | null
          created_at?: string
          level?: string | null
          pack: Json
          title?: string | null
          topic?: string | null
          updated_at?: string
          video_id: string
          video_url: string
        }
        Update: {
          age_group?: string | null
          channel?: string | null
          created_at?: string
          level?: string | null
          pack?: Json
          title?: string | null
          topic?: string | null
          updated_at?: string
          video_id?: string
          video_url?: string
        }
        Relationships: []
      }
      word_entries: {
        Row: {
          antonyms: Json
          collocations: Json
          created_at: string
          example: string | null
          expressions: Json
          ipa_uk: string | null
          ipa_us: string | null
          part_of_speech: string | null
          phrasal_verbs: Json
          synonyms: Json
          translation_pt: string | null
          updated_at: string
          word: string
        }
        Insert: {
          antonyms?: Json
          collocations?: Json
          created_at?: string
          example?: string | null
          expressions?: Json
          ipa_uk?: string | null
          ipa_us?: string | null
          part_of_speech?: string | null
          phrasal_verbs?: Json
          synonyms?: Json
          translation_pt?: string | null
          updated_at?: string
          word: string
        }
        Update: {
          antonyms?: Json
          collocations?: Json
          created_at?: string
          example?: string | null
          expressions?: Json
          ipa_uk?: string | null
          ipa_us?: string | null
          part_of_speech?: string | null
          phrasal_verbs?: Json
          synonyms?: Json
          translation_pt?: string | null
          updated_at?: string
          word?: string
        }
        Relationships: []
      }
      xp_events: {
        Row: {
          amount: number
          coins: number
          created_at: string
          id: string
          meta: Json
          source: string
          user_id: string
        }
        Insert: {
          amount?: number
          coins?: number
          created_at?: string
          id?: string
          meta?: Json
          source: string
          user_id: string
        }
        Update: {
          amount?: number
          coins?: number
          created_at?: string
          id?: string
          meta?: Json
          source?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      leaderboard: {
        Row: {
          avatar_url: string | null
          cefr_level: string | null
          display_name: string | null
          rank: number | null
          streak: number | null
          user_id: string | null
          xp: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      admin_analytics: { Args: { _days?: number }; Returns: Json }
      admin_security_summary: { Args: never; Returns: Json }
      age_to_room: {
        Args: { _age: number }
        Returns: Database["public"]["Enums"]["age_room"]
      }
      award_activity: {
        Args: { _coins?: number; _meta?: Json; _source: string; _xp: number }
        Returns: Json
      }
      buy_shop_item: { Args: { _item_id: string }; Returns: Json }
      can_i_access_level: {
        Args: { _level: Database["public"]["Enums"]["cefr_level"] }
        Returns: boolean
      }
      cefr_rank: {
        Args: { _level: Database["public"]["Enums"]["cefr_level"] }
        Returns: number
      }
      claim_mission: { Args: { _mission_id: string }; Returns: Json }
      confirm_payment: {
        Args: { _payment_id: string; _provider_tx?: string }
        Returns: {
          activated_by: string | null
          amount_kz: number
          created_at: string
          entity: string
          expires_at: string
          id: string
          invoice_number: string | null
          metadata: Json
          method: Database["public"]["Enums"]["payment_method"] | null
          notes: string | null
          paid_at: string | null
          phone: string | null
          plan_id: string
          provider: string
          provider_transaction_id: string | null
          receipt_url: string | null
          reference: string
          status: Database["public"]["Enums"]["payment_status"]
          subscription_id: string | null
          updated_at: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "payments"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      create_subscription_order: {
        Args: {
          _method: Database["public"]["Enums"]["payment_method"]
          _phone?: string
          _plan_id: string
          _provider?: string
        }
        Returns: Json
      }
      ensure_user_missions: { Args: never; Returns: undefined }
      expire_subscriptions: { Args: never; Returns: undefined }
      is_account_locked: { Args: { _email: string }; Returns: Json }
      issue_certificate: {
        Args: {
          _course_id?: string
          _course_title?: string
          _level: Database["public"]["Enums"]["cefr_level"]
          _score?: number
        }
        Returns: {
          course_id: string | null
          course_title: string | null
          created_at: string
          full_name: string | null
          id: string
          issued_at: string
          level: Database["public"]["Enums"]["cefr_level"]
          pdf_url: string | null
          score: number | null
          signature: string | null
          user_id: string
          verification_code: string
        }
        SetofOptions: {
          from: "*"
          to: "certificates"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      leaderboard: {
        Args: { _limit?: number }
        Returns: {
          cefr_level: string
          display_name: string
          rank: number
          streak: number
          user_id: string
          xp: number
        }[]
      }
      log_audit_event: {
        Args: {
          _action: string
          _entity?: string
          _entity_id?: string
          _ip?: string
          _metadata?: Json
          _severity?: string
          _ua?: string
        }
        Returns: string
      }
      my_max_unlocked_level: {
        Args: never
        Returns: Database["public"]["Enums"]["cefr_level"]
      }
      my_rank: {
        Args: never
        Returns: {
          rank: number
          total: number
          xp: number
        }[]
      }
      record_login_attempt: {
        Args: {
          _email: string
          _ip?: string
          _reason?: string
          _success: boolean
          _ua?: string
        }
        Returns: Json
      }
      verify_certificate: {
        Args: { _code: string }
        Returns: {
          course_title: string
          full_name: string
          issued_at: string
          level: Database["public"]["Enums"]["cefr_level"]
          score: number
          signature: string
          valid: boolean
          verification_code: string
        }[]
      }
      xp_to_level: { Args: { _xp: number }; Returns: number }
    }
    Enums: {
      age_room: "kids" | "teens" | "adults"
      app_role: "admin" | "user"
      billing_cycle: "monthly" | "quarterly" | "semiannual"
      cefr_level: "A1" | "A2" | "B1" | "B2" | "C1" | "C2"
      lesson_type:
        | "vocabulary"
        | "grammar"
        | "reading"
        | "listening"
        | "writing"
        | "speaking"
        | "pronunciation"
        | "ipa"
        | "review"
        | "quiz"
        | "final_test"
        | "project"
      payment_method: "card" | "reference" | "transfer" | "mobile_money"
      payment_status: "pending" | "paid" | "cancelled" | "expired"
      plan_tier: "essential" | "premium" | "vip"
      subscription_status: "pending" | "active" | "expired" | "cancelled"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      age_room: ["kids", "teens", "adults"],
      app_role: ["admin", "user"],
      billing_cycle: ["monthly", "quarterly", "semiannual"],
      cefr_level: ["A1", "A2", "B1", "B2", "C1", "C2"],
      lesson_type: [
        "vocabulary",
        "grammar",
        "reading",
        "listening",
        "writing",
        "speaking",
        "pronunciation",
        "ipa",
        "review",
        "quiz",
        "final_test",
        "project",
      ],
      payment_method: ["card", "reference", "transfer", "mobile_money"],
      payment_status: ["pending", "paid", "cancelled", "expired"],
      plan_tier: ["essential", "premium", "vip"],
      subscription_status: ["pending", "active", "expired", "cancelled"],
    },
  },
} as const
