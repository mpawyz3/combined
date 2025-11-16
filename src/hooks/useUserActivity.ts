import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';

export interface UserActivity {
  id: string;
  action: string;
  action_type: 'update' | 'follower' | 'approval' | 'achievement';
  created_at: string;
}

export function useUserActivity(limit: number = 10) {
  const { user } = useAuth();
  const [activities, setActivities] = useState<UserActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      setActivities([]);
      return;
    }

    const fetchUserActivity = async () => {
      try {
        const { data, error: supabaseError } = await supabase
          .from('user_activity')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(limit);

        if (supabaseError) {
          console.warn('Could not fetch user activity, using empty list:', supabaseError.message);
          setActivities([]);
          setError(null);
          return;
        }

        if (data) {
          setActivities(data as UserActivity[]);
        }
      } catch (err) {
        console.warn('Unexpected error fetching activity, using empty list:', err);
        setActivities([]);
      } finally {
        setLoading(false);
      }
    };

    fetchUserActivity();

    // Subscribe to real-time updates
    const channel = supabase
      .channel(`user_activity:${user.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'user_activity', filter: `user_id=eq.${user.id}` },
        (payload) => {
          if (payload.new) {
            setActivities((prev) => [payload.new as UserActivity, ...prev.slice(0, limit - 1)]);
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [user?.id, limit]);

  return { activities, loading, error };
}
