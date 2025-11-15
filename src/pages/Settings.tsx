import React, { useEffect, useMemo, useState } from 'react';
import { useUserStats } from '../hooks/useUserStats';
import { useUpdateUserStats } from '../hooks/useUpdateUserStats';
import { useAuth } from '../context/AuthContext';
import { CheckCircle2, Loader2, Save, AlertTriangle } from 'lucide-react';

export default function Settings() {
  const { user } = useAuth();
  const { stats, loading } = useUserStats();
  const { updateStats } = useUpdateUserStats();

  const [portfolioViews, setPortfolioViews] = useState<number>(0);
  const [followers, setFollowers] = useState<number>(0);
  const [rating, setRating] = useState<number>(0);
  const [loyaltyPoints, setLoyaltyPoints] = useState<number>(0);
  const [projectsCompleted, setProjectsCompleted] = useState<number>(0);

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (stats) {
      setPortfolioViews(stats.portfolio_views || 0);
      setFollowers(stats.followers || 0);
      setRating(stats.rating || 0);
      setLoyaltyPoints(stats.loyalty_points || 0);
      setProjectsCompleted(stats.projects_completed || 0);
    }
  }, [stats]);

  const hasChanges = useMemo(() => {
    if (!stats) return false;
    return (
      portfolioViews !== (stats.portfolio_views || 0) ||
      followers !== (stats.followers || 0) ||
      Number(rating.toFixed(2)) !== Number((stats.rating || 0).toFixed(2)) ||
      loyaltyPoints !== (stats.loyalty_points || 0) ||
      projectsCompleted !== (stats.projects_completed || 0)
    );
  }, [stats, portfolioViews, followers, rating, loyaltyPoints, projectsCompleted]);

  const onSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;

    // Basic validation
    if (rating < 0 || rating > 5) {
      setError('Rating must be between 0 and 5');
      return;
    }
    if ([portfolioViews, followers, loyaltyPoints, projectsCompleted].some((n) => n < 0)) {
      setError('Values cannot be negative');
      return;
    }

    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      await updateStats({
        portfolio_views: Math.floor(portfolioViews),
        followers: Math.floor(followers),
        rating: Number(rating),
        loyalty_points: Math.floor(loyaltyPoints),
        projects_completed: Math.floor(projectsCompleted),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save changes';
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen pt-20 pb-12 px-4">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-playfair font-bold text-white mb-2">Settings</h1>
        <p className="text-gray-300 mb-8">Edit your public stats. Changes reflect on your dashboard in real-time.</p>

        {!user && (
          <div className="glass-effect p-4 rounded-xl text-amber-300 flex items-center space-x-2 mb-6">
            <AlertTriangle className="w-5 h-5" />
            <span>Please sign in to edit your stats.</span>
          </div>
        )}

        <form onSubmit={onSave} className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="glass-effect p-5 rounded-xl">
              <label className="block text-sm text-gray-400 mb-2">Portfolio Views</label>
              <input
                type="number"
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                value={portfolioViews}
                min={0}
                onChange={(e) => setPortfolioViews(Number(e.target.value))}
              />
            </div>
            <div className="glass-effect p-5 rounded-xl">
              <label className="block text-sm text-gray-400 mb-2">Followers</label>
              <input
                type="number"
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                value={followers}
                min={0}
                onChange={(e) => setFollowers(Number(e.target.value))}
              />
            </div>
            <div className="glass-effect p-5 rounded-xl">
              <label className="block text-sm text-gray-400 mb-2">Rating (0 - 5)</label>
              <input
                type="number"
                step="0.1"
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                value={rating}
                min={0}
                max={5}
                onChange={(e) => setRating(Number(e.target.value))}
              />
            </div>
            <div className="glass-effect p-5 rounded-xl">
              <label className="block text-sm text-gray-400 mb-2">Loyalty Points</label>
              <input
                type="number"
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                value={loyaltyPoints}
                min={0}
                onChange={(e) => setLoyaltyPoints(Number(e.target.value))}
              />
            </div>
            <div className="glass-effect p-5 rounded-xl md:col-span-2">
              <label className="block text-sm text-gray-400 mb-2">Projects Completed</label>
              <input
                type="number"
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                value={projectsCompleted}
                min={0}
                onChange={(e) => setProjectsCompleted(Number(e.target.value))}
              />
            </div>
          </div>

          {error && (
            <div className="glass-effect p-4 rounded-xl text-red-300">{error}</div>
          )}

          <div className="flex items-center space-x-3">
            <button
              type="submit"
              disabled={saving || loading || !hasChanges}
              className={`px-5 py-2 rounded-lg flex items-center space-x-2 transition-all font-medium ${
                saving || loading || !hasChanges
                  ? 'bg-white/10 text-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-rose-500 to-purple-600 text-white hover:shadow-lg'
              }`}
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save Changes</span>
                </>
              )}
            </button>
            {saved && (
              <div className="flex items-center text-green-400">
                <CheckCircle2 className="w-5 h-5 mr-1" /> Saved
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
