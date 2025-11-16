import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';

export interface UpdateUserStatsInput {
  portfolio_views?: number;
  followers?: number;
  rating?: number;
  loyalty_points?: number;
  projects_completed?: number;
}

export function useUpdateUserStats() {
  const { user } = useAuth();

  const updateStats = async (updates: UpdateUserStatsInput) => {
    if (!user?.id) {
      throw new Error('User not authenticated');
    }

    try {
      const { data, error } = await supabase
        .from('user_stats')
        .update(updates)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating user stats:', error);
        throw new Error(error.message || 'Failed to update stats');
      }

      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('Unexpected error updating stats:', err);
      throw new Error(errorMessage);
    }
  };

  return { updateStats };
}
