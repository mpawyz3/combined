import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';

export interface Challenge {
  id: string;
  title: string;
  description?: string;
  progress: number;
  reward: string;
  status: 'active' | 'completed' | 'expired';
}

export function useChallenges() {
  const { user } = useAuth();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      setChallenges([]);
      return;
    }

    const fetchChallenges = async () => {
      try {
        const { data, error: supabaseError } = await supabase
          .from('challenges')
          .select('*')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .limit(3);

        if (supabaseError) {
          console.warn('Could not fetch challenges, using empty list:', supabaseError.message);
          setChallenges([]);
          setError(null);
          return;
        }

        if (data) {
          setChallenges(data as Challenge[]);
        }
      } catch (err) {
        console.warn('Unexpected error fetching challenges, using empty list:', err);
        setChallenges([]);
      } finally {
        setLoading(false);
      }
    };

    fetchChallenges();

    // Subscribe to real-time updates
    const channel = supabase
      .channel(`challenges:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'challenges',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          // Refetch on any change
          fetchChallenges();
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [user?.id]);

  return { challenges, loading, error };
}
