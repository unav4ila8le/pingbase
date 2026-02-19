export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      graphql: {
        Args: {
          extensions?: Json;
          operationName?: string;
          query?: string;
          variables?: Json;
        };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  public: {
    Tables: {
      profiles: {
        Row: {
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
          user_id: string;
          username: string | null;
        };
        Insert: {
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
          user_id: string;
          username?: string | null;
        };
        Update: {
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
          user_id?: string;
          username?: string | null;
        };
        Relationships: [];
      };
      signals: {
        Row: {
          community: string;
          content_excerpt: string;
          created_at: string;
          date_posted: string;
          evidence_quote: string | null;
          external_id: string;
          fit_grade: string;
          id: string;
          platform: string;
          promo_risk: string;
          raw_payload: Json;
          reason: string;
          rejection_reason: string | null;
          score: number;
          score_version: string;
          scorer_confidence: number;
          specific_ask: boolean;
          stage1_score: number | null;
          status: Database["public"]["Enums"]["signal_status"];
          target_id: string;
          title: string | null;
          type: Database["public"]["Enums"]["signal_type"];
          updated_at: string;
          url: string;
          user_id: string;
          validator_confidence: number | null;
          validator_decision: string | null;
          validator_reason: string | null;
        };
        Insert: {
          community: string;
          content_excerpt: string;
          created_at?: string;
          date_posted: string;
          evidence_quote?: string | null;
          external_id: string;
          fit_grade?: string;
          id?: string;
          platform: string;
          promo_risk?: string;
          raw_payload?: Json;
          reason: string;
          rejection_reason?: string | null;
          score: number;
          score_version?: string;
          scorer_confidence?: number;
          specific_ask?: boolean;
          stage1_score?: number | null;
          status?: Database["public"]["Enums"]["signal_status"];
          target_id: string;
          title?: string | null;
          type: Database["public"]["Enums"]["signal_type"];
          updated_at?: string;
          url: string;
          user_id: string;
          validator_confidence?: number | null;
          validator_decision?: string | null;
          validator_reason?: string | null;
        };
        Update: {
          community?: string;
          content_excerpt?: string;
          created_at?: string;
          date_posted?: string;
          evidence_quote?: string | null;
          external_id?: string;
          fit_grade?: string;
          id?: string;
          platform?: string;
          promo_risk?: string;
          raw_payload?: Json;
          reason?: string;
          rejection_reason?: string | null;
          score?: number;
          score_version?: string;
          scorer_confidence?: number;
          specific_ask?: boolean;
          stage1_score?: number | null;
          status?: Database["public"]["Enums"]["signal_status"];
          target_id?: string;
          title?: string | null;
          type?: Database["public"]["Enums"]["signal_type"];
          updated_at?: string;
          url?: string;
          user_id?: string;
          validator_confidence?: number | null;
          validator_decision?: string | null;
          validator_reason?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "signals_target_id_fkey";
            columns: ["target_id"];
            isOneToOne: false;
            referencedRelation: "targets";
            referencedColumns: ["id"];
          },
        ];
      };
      targets: {
        Row: {
          created_at: string;
          description: string;
          exclusions: string[];
          id: string;
          keywords: string[];
          last_scanned_at: string | null;
          name: string;
          subreddits: string[];
          updated_at: string;
          url: string | null;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          description: string;
          exclusions?: string[];
          id?: string;
          keywords?: string[];
          last_scanned_at?: string | null;
          name: string;
          subreddits?: string[];
          updated_at?: string;
          url?: string | null;
          user_id: string;
        };
        Update: {
          created_at?: string;
          description?: string;
          exclusions?: string[];
          id?: string;
          keywords?: string[];
          last_scanned_at?: string | null;
          name?: string;
          subreddits?: string[];
          updated_at?: string;
          url?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      signal_status: "new" | "ignored" | "replied";
      signal_type: "post" | "comment";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      signal_status: ["new", "ignored", "replied"],
      signal_type: ["post", "comment"],
    },
  },
} as const;
