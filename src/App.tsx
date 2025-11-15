import { useEffect, useState } from 'react';
import { supabase, Profile } from './lib/supabase';
import AuthForm from './components/AuthForm';
import ProfileCard from './components/ProfileCard';
import { LogOut } from 'lucide-react';

function App() {
  const [session, setSession] = useState<{ user: { id: string } } | null>(null);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session as { user: { id: string } } | null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      (async () => {
        setSession(session as { user: { id: string } } | null);
      })();
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session) {
      fetchProfiles();
    }
  }, [session]);

  const fetchProfiles = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(3);

    setProfiles(data || []);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-100 flex items-center justify-center">
        <div className="text-xl font-medium text-slate-700">Loading...</div>
      </div>
    );
  }

  if (!session) {
    return <AuthForm onSuccess={() => {}} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-100">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-800">Social Profiles</h1>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {profiles.map((profile) => (
            <ProfileCard
              key={profile.id}
              profile={profile}
              currentUserId={session.user.id}
            />
          ))}
        </div>

        {profiles.length === 0 && (
          <div className="text-center py-12">
            <p className="text-slate-600 text-lg">No profiles found. Create some users to get started!</p>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
