import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: window.localStorage
  }
});

export interface Profile {
  id: string;
  username: string;
  avatar_url: string;
  bio: string;
  created_at: string;
}

export interface Like {
  id: string;
  user_id: string;
  profile_id: string;
  created_at: string;
}

export interface Follow {
  id: string;
  follower_id: string;
  following_id: string;
  created_at: string;
}

export interface Comment {
  id: string;
  user_id: string;
  profile_id: string;
  content: string;
  created_at: string;
}
