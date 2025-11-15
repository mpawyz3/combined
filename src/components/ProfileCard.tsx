import { useState, useEffect } from 'react';
import { Heart, UserPlus, UserMinus, MessageCircle, Send } from 'lucide-react';
import { supabase, Profile } from '../lib/supabase';

interface ProfileCardProps {
  profile: Profile;
  currentUserId: string;
}

interface Comment {
  id: string;
  content: string;
  user_id: string;
  created_at?: string;
}

export default function ProfileCard({ profile, currentUserId }: ProfileCardProps) {
  const [likesCount, setLikesCount] = useState(0);
  const [followsCount, setFollowsCount] = useState(0);
  const [commentsCount, setCommentsCount] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');

  const fetchCounts = async () => {
    const [likesRes, followsRes, commentsRes] = await Promise.all([
      supabase.from('likes').select('*', { count: 'exact' }).eq('profile_id', profile.id),
      supabase.from('follows').select('*', { count: 'exact' }).eq('following_id', profile.id),
      supabase.from('comments').select('*', { count: 'exact' }).eq('profile_id', profile.id),
    ]);

    setLikesCount(likesRes.count || 0);
    setFollowsCount(followsRes.count || 0);
    setCommentsCount(commentsRes.count || 0);
  };

  const fetchUserStatus = async () => {
    const [likeRes, followRes] = await Promise.all([
      supabase.from('likes').select('*').eq('profile_id', profile.id).eq('user_id', currentUserId).maybeSingle(),
      supabase.from('follows').select('*').eq('following_id', profile.id).eq('follower_id', currentUserId).maybeSingle(),
    ]);

    setIsLiked(!!likeRes.data);
    setIsFollowing(!!followRes.data);
  };

  const fetchComments = async () => {
    const { data } = await supabase
      .from('comments')
      .select('*')
      .eq('profile_id', profile.id)
      .order('created_at', { ascending: false });

    setComments(data || []);
  };

  useEffect(() => {
    fetchCounts();
    fetchUserStatus();
    fetchComments();

    const channelName = `profile-${profile.id}`;
    const channel = supabase.channel(channelName);

    channel
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'likes',
          filter: `profile_id=eq.${profile.id}`,
        },
        async () => {
          await fetchCounts();
          await fetchUserStatus();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'follows',
          filter: `following_id=eq.${profile.id}`,
        },
        async () => {
          await fetchCounts();
          await fetchUserStatus();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'comments',
          filter: `profile_id=eq.${profile.id}`,
        },
        async () => {
          await fetchCounts();
          await fetchComments();
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [profile.id, currentUserId]);

  const toggleLike = async () => {
    const previousLiked = isLiked;
    const previousCount = likesCount;

    setIsLiked(!isLiked);
    setLikesCount(isLiked ? likesCount - 1 : likesCount + 1);

    try {
      if (previousLiked) {
        await supabase.from('likes').delete().eq('profile_id', profile.id).eq('user_id', currentUserId);
      } else {
        await supabase.from('likes').insert([{ profile_id: profile.id, user_id: currentUserId }]);
      }
    } catch (error) {
      setIsLiked(previousLiked);
      setLikesCount(previousCount);
    }
  };

  const toggleFollow = async () => {
    const previousFollowing = isFollowing;
    const previousCount = followsCount;

    setIsFollowing(!isFollowing);
    setFollowsCount(isFollowing ? followsCount - 1 : followsCount + 1);

    try {
      if (previousFollowing) {
        await supabase.from('follows').delete().eq('following_id', profile.id).eq('follower_id', currentUserId);
      } else {
        await supabase.from('follows').insert([{ following_id: profile.id, follower_id: currentUserId }]);
      }
    } catch (error) {
      setIsFollowing(previousFollowing);
      setFollowsCount(previousCount);
    }
  };

  const addComment = async () => {
    if (!newComment.trim()) return;

    const commentText = newComment.trim();
    const tempId = `temp-${Date.now()}`;

    const optimisticComment: Comment = {
      id: tempId,
      content: commentText,
      user_id: currentUserId,
      created_at: new Date().toISOString(),
    };

    setNewComment('');
    setComments((prev) => [optimisticComment, ...prev]);
    setCommentsCount(commentsCount + 1);

    try {
      const { data } = await supabase.from('comments').insert([{
        profile_id: profile.id,
        user_id: currentUserId,
        content: commentText,
      }]).select().single();

      if (data) {
        setComments((prev) =>
          prev.map((comment) =>
            comment.id === tempId ? { ...comment, id: data.id, created_at: data.created_at } : comment
          )
        );
      }
    } catch (error) {
      setComments((prev) => prev.filter((comment) => comment.id !== tempId));
      setCommentsCount(commentsCount);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
      <div className="bg-gradient-to-r from-blue-500 to-cyan-500 h-24"></div>

      <div className="px-6 pb-6">
        <div className="flex items-center justify-between -mt-12 mb-4">
          <div className="w-24 h-24 bg-slate-200 rounded-full border-4 border-white shadow-md flex items-center justify-center text-3xl font-bold text-slate-600">
            {profile.username.charAt(0).toUpperCase()}
          </div>
        </div>

        <h2 className="text-2xl font-bold text-slate-800 mb-1">{profile.username}</h2>
        <p className="text-slate-600 text-sm mb-4">{profile.bio || 'No bio yet'}</p>

        <div className="flex gap-3 mb-4">
          <button
            onClick={toggleLike}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition ${
              isLiked
                ? 'bg-red-50 text-red-600 hover:bg-red-100'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Heart className={`w-5 h-5 ${isLiked ? 'fill-red-600' : ''}`} />
            <span>{likesCount}</span>
          </button>

          <button
            onClick={toggleFollow}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition ${
              isFollowing
                ? 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            {isFollowing ? <UserMinus className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
            <span>{followsCount}</span>
          </button>

          <button
            onClick={() => setShowComments(!showComments)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium bg-slate-100 text-slate-700 hover:bg-slate-200 transition"
          >
            <MessageCircle className="w-5 h-5" />
            <span>{commentsCount}</span>
          </button>
        </div>

        {showComments && (
          <div className="border-t pt-4">
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addComment()}
                placeholder="Write a comment..."
                className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
              <button
                onClick={addComment}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto">
              {comments.map((comment) => (
                <div key={comment.id} className="bg-slate-50 p-3 rounded-lg">
                  <p className="text-sm text-slate-800">{comment.content}</p>
                </div>
              ))}
              {comments.length === 0 && (
                <p className="text-sm text-slate-500 text-center py-4">No comments yet</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
