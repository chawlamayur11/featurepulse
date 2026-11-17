import React, { useState } from 'react';
import { X, ChevronUp, MessageSquare, Send, Tag, Clock, User, ShieldCheck } from 'lucide-react';
import { Post, Comment, PostDetail } from '../types';
import { api } from '../api';

interface FeedbackDetailModalProps {
  post: Post | null;
  onClose: () => void;
  onVote: (postId: number) => void;
  onCommentAdded: () => void;
}

export const FeedbackDetailModal: React.FC<FeedbackDetailModalProps> = ({
  post,
  onClose,
  onVote,
  onCommentAdded,
}) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    if (!post) return;
    setLoadingComments(true);
    api.getPostDetail(post.id)
      .then((detail) => {
        setComments(detail.comments || []);
      })
      .catch((err) => {
        console.error('Error fetching comments:', err);
      })
      .finally(() => {
        setLoadingComments(false);
      });
  }, [post]);

  if (!post) return null;

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setSubmittingComment(true);
    setError(null);
    try {
      const added = await api.addComment(post.id, newComment);
      setComments([...comments, added]);
      setNewComment('');
      onCommentAdded();
    } catch (err: any) {
      setError(err.message || 'Failed to submit comment.');
    } finally {
      setSubmittingComment(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 relative max-h-[90vh] flex flex-col">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-start space-x-4 pr-8">
          <button
            onClick={() => onVote(post.id)}
            className={`shrink-0 flex flex-col items-center justify-center w-12 h-14 rounded-lg border transition ${
              post.has_voted
                ? 'bg-indigo-600 border-indigo-600 text-white'
                : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-indigo-400'
            }`}
          >
            <ChevronUp className="w-5 h-5" />
            <span className="text-xs font-bold leading-none mt-1">{post.vote_count}</span>
          </button>

          <div>
            <div className="flex items-center space-x-2 mb-1">
              <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-semibold border border-indigo-200">
                {post.category}
              </span>
              <span className="text-xs text-slate-400 font-mono">#{post.id}</span>
            </div>
            <h2 className="text-lg font-bold text-slate-900">{post.title}</h2>
          </div>
        </div>

        {/* Description Body */}
        <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-100 text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
          {post.description}
        </div>

        {/* Meta Line */}
        <div className="flex items-center space-x-4 text-xs text-slate-400 mt-2 px-1">
          <span>Submitted by {post.author_id}</span>
          <span>•</span>
          <span>{new Date(post.created_at).toLocaleString()}</span>
        </div>

        {/* Comments Section */}
        <div className="flex-1 overflow-y-auto mt-6 border-t border-slate-100 pt-4 space-y-4">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-1">
            <MessageSquare className="w-3.5 h-3.5 text-slate-500" />
            <span>Discussion ({comments.length})</span>
          </h3>

          {loadingComments ? (
            <p className="text-xs text-slate-400">Loading comments...</p>
          ) : comments.length === 0 ? (
            <p className="text-xs text-slate-400 italic">No comments yet. Start the conversation!</p>
          ) : (
            <div className="space-y-2.5">
              {comments.map((c) => (
                <div key={c.id} className="bg-white p-3 rounded-xl border border-slate-200 text-xs shadow-2xs">
                  <div className="flex items-center justify-between text-slate-400 mb-1">
                    <span className="font-semibold text-slate-700 flex items-center">
                      <User className="w-3 h-3 mr-1 text-slate-400" />
                      {c.author_id}
                    </span>
                    <span>{new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <p className="text-slate-800 leading-normal">{c.content}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add Comment Input */}
        <form onSubmit={handleAddComment} className="mt-4 pt-3 border-t border-slate-100">
          {error && <p className="text-xs text-red-600 mb-2">{error}</p>}
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Leave feedback or reply (PII automatically scrubbed)..."
              className="flex-1 px-3.5 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              type="submit"
              disabled={submittingComment || !newComment.trim()}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded-lg text-xs font-semibold flex items-center space-x-1 transition disabled:opacity-40"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
