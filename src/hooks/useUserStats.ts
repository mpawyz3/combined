import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';

interface UserStats {
  portfolio_views: number;
  followers: number;
  rating: number;
  loyalty_points: number;
  projects_completed: number;
}

export function useUserStats() {
  const { user } = useAuth();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      setStats({
        portfolio_views: 0,
        followers: 0,
        rating: 0,
        loyalty_points: 0,
        projects_completed: 0,
      });
      return;
    }

    const fetchUserStats = async () => {
      try {
        const { data, error: supabaseError } = await supabase
          .from('user_stats')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (supabaseError) {
          // Handle all errors gracefully - use default stats
          console.warn('Could not fetch user stats, using defaults:', supabaseError.message);
          setStats({
            portfolio_views: 0,
            followers: 0,
            rating: 0,
            loyalty_points: 0,
            projects_completed: 0,
          });
          setError(null);
          return;
        }

        if (data) {
          setStats({
            portfolio_views: data.portfolio_views || 0,
            followers: data.followers || 0,
            rating: data.rating || 0,
            loyalty_points: data.loyalty_points || 0,
            projects_completed: data.projects_completed || 0,
          });
        }
      } catch (err) {
        console.warn('Unexpected error fetching stats, using defaults:', err);
        setStats({
          portfolio_views: 0,
          followers: 0,
          rating: 0,
          loyalty_points: 0,
          projects_completed: 0,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchUserStats();

    // Subscribe to real-time updates (non-blocking)
    const channel = supabase
      .channel(`user_stats:${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'user_stats', filter: `user_id=eq.${user.id}` },
        (payload) => {
          if (payload.new) {
            setStats({
              portfolio_views: payload.new.portfolio_views || 0,
              followers: payload.new.followers || 0,
              rating: payload.new.rating || 0,
              loyalty_points: payload.new.loyalty_points || 0,
              projects_completed: payload.new.projects_completed || 0,
            });
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [user?.id]);

  return { stats, loading, error };
}
