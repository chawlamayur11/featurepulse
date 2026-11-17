import React from 'react';
import { ChevronUp, MessageSquare, Clock, Tag } from 'lucide-react';
import { Post } from '../types';

interface FeedbackCardProps {
  post: Post;
  onVote: (postId: number) => void;
  onClick: (post: Post) => void;
  voting?: boolean;
}

const statusColors: Record<string, { bg: string; text: string; label: string }> = {
  open: { bg: 'bg-slate-100', text: 'text-slate-700', label: 'Open' },
  under_review: { bg: 'bg-amber-100', text: 'text-amber-800', label: 'Under Review' },
  planned: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Planned' },
  in_progress: { bg: 'bg-purple-100', text: 'text-purple-800', label: 'In Progress' },
  completed: { bg: 'bg-emerald-100', text: 'text-emerald-800', label: 'Completed' },
};

const categoryColors: Record<string, string> = {
  'UI/UX': 'bg-pink-50 text-pink-700 border-pink-200',
  'Integrations': 'bg-cyan-50 text-cyan-700 border-cyan-200',
  'Core Feature': 'bg-indigo-50 text-indigo-700 border-indigo-200',
  'Security': 'bg-rose-50 text-rose-700 border-rose-200',
  'Performance': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'Bug': 'bg-red-50 text-red-700 border-red-200',
};

export const FeedbackCard: React.FC<FeedbackCardProps> = ({ post, onVote, onClick, voting = false }) => {
  const statusInfo = statusColors[post.status] || statusColors.open;
  const categoryClass = categoryColors[post.category] || 'bg-slate-50 text-slate-700 border-slate-200';

  const handleVoteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onVote(post.id);
  };

  return (
    <div
      onClick={() => onClick(post)}
      className="bg-white rounded-xl border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all p-5 flex items-start space-x-4 cursor-pointer group"
    >
      {/* Upvote Button with W3C Trace Emission */}
      <button
        onClick={handleVoteClick}
        disabled={voting}
        title={post.has_voted ? 'Remove your vote' : 'Upvote this request'}
        className={`shrink-0 flex flex-col items-center justify-center w-12 h-14 rounded-lg border transition-all ${
          post.has_voted
            ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm'
            : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-indigo-400 hover:bg-indigo-50/50'
        }`}
      >
        <ChevronUp className={`w-5 h-5 transition-transform group-hover:-translate-y-0.5 ${post.has_voted ? 'text-white' : 'text-slate-500'}`} />
        <span className="text-xs font-bold leading-none mt-1">{post.vote_count}</span>
      </button>

      {/* Main Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center space-x-2 flex-wrap gap-y-1 mb-1.5">
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusInfo.bg} ${statusInfo.text}`}>
            {statusInfo.label}
          </span>
          <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${categoryClass}`}>
            <Tag className="w-3 h-3 inline mr-1" />
            {post.category}
          </span>
        </div>

        <h3 className="text-base font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
          {post.title}
        </h3>

        <p className="text-sm text-slate-600 line-clamp-2 mt-1">
          {post.description}
        </p>

        {/* Footer Meta */}
        <div className="flex items-center space-x-4 mt-3 text-xs text-slate-500">
          <div className="flex items-center space-x-1">
            <MessageSquare className="w-3.5 h-3.5" />
            <span>{post.comments_count} {post.comments_count === 1 ? 'comment' : 'comments'}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Clock className="w-3.5 h-3.5" />
            <span>{new Date(post.created_at).toLocaleDateString()}</span>
          </div>
          <span className="text-slate-400">by {post.author_id}</span>
        </div>
      </div>
    </div>
  );
};
