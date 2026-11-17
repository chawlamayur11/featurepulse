import React, { useState } from 'react';
import { Search, Filter, ArrowUpDown } from 'lucide-react';
import { Post, PostStatus } from '../types';
import { FeedbackCard } from './FeedbackCard';

interface FeedbackListProps {
  posts: Post[];
  loading: boolean;
  onVote: (postId: number) => void;
  onSelectPost: (post: Post) => void;
  statusFilter: string;
  onStatusChange: (status: string) => void;
  categoryFilter: string;
  onCategoryChange: (category: string) => void;
  sortBy: string;
  onSortChange: (sort: string) => void;
  searchQuery: string;
  onSearchChange: (search: string) => void;
}

const categories = ['all', 'UI/UX', 'Integrations', 'Core Feature', 'Security', 'Performance', 'Bug'];
const statuses = [
  { id: 'all', label: 'All Requests' },
  { id: 'open', label: 'Open' },
  { id: 'under_review', label: 'Under Review' },
  { id: 'planned', label: 'Planned' },
  { id: 'in_progress', label: 'In Progress' },
  { id: 'completed', label: 'Completed' },
];

export const FeedbackList: React.FC<FeedbackListProps> = ({
  posts,
  loading,
  onVote,
  onSelectPost,
  statusFilter,
  onStatusChange,
  categoryFilter,
  onCategoryChange,
  sortBy,
  onSortChange,
  searchQuery,
  onSearchChange,
}) => {
  return (
    <div className="space-y-6">
      {/* Search & Filter Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-4">
        
        {/* Top Row: Search & Sorters */}
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search feedback ideas..."
              className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
            />
          </div>

          <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
            <span className="text-xs text-slate-500 flex items-center">
              <ArrowUpDown className="w-3.5 h-3.5 mr-1" />
              Sort by:
            </span>
            <select
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="top">🔥 Top Voted</option>
              <option value="trending">⚡ Trending</option>
              <option value="newest">✨ Newest</option>
            </select>
          </div>
        </div>

        {/* Second Row: Status Filter Tabs */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 scrollbar-none border-t border-slate-100 pt-3">
          {statuses.map((st) => (
            <button
              key={st.id}
              onClick={() => onStatusChange(st.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium shrink-0 transition-colors ${
                statusFilter === st.id
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80'
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>

        {/* Third Row: Category Filters */}
        <div className="flex items-center space-x-2 overflow-x-auto text-xs text-slate-500 pt-1">
          <Filter className="w-3.5 h-3.5 shrink-0 text-slate-400" />
          <span className="shrink-0 font-medium text-slate-700">Category:</span>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => onCategoryChange(cat)}
              className={`px-2.5 py-1 rounded-md shrink-0 transition-colors ${
                categoryFilter === cat
                  ? 'bg-slate-800 text-white font-medium'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {cat === 'all' ? 'All' : cat}
            </button>
          ))}
        </div>

      </div>

      {/* Posts List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((n) => (
            <div key={n} className="bg-white rounded-xl border border-slate-200 p-5 h-28 animate-pulse flex space-x-4">
              <div className="w-12 h-14 bg-slate-200 rounded-lg shrink-0"></div>
              <div className="flex-1 space-y-2">
                <div className="w-1/3 h-4 bg-slate-200 rounded"></div>
                <div className="w-3/4 h-3 bg-slate-100 rounded"></div>
                <div className="w-1/2 h-3 bg-slate-100 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center">
          <p className="text-slate-600 font-medium">No feedback items match your filters.</p>
          <p className="text-xs text-slate-400 mt-1">Try clearing your search query or submit the first request!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map((post) => (
            <FeedbackCard
              key={post.id}
              post={post}
              onVote={onVote}
              onClick={onSelectPost}
            />
          ))}
        </div>
      )}
    </div>
  );
};
