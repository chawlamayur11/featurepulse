import React from 'react';
import { ChevronUp, MessageSquare, Clock, ArrowRight } from 'lucide-react';
import { Post } from '../types';

interface RoadmapBoardProps {
  posts: Post[];
  onVote: (postId: number) => void;
  onSelectPost: (post: Post) => void;
  onStatusChange: (postId: number, newStatus: string) => void;
}

const lanes = [
  { id: 'planned', title: 'Planned', description: 'Committed features scheduled for development', color: 'border-blue-500', bg: 'bg-blue-50/50' },
  { id: 'in_progress', title: 'In Progress', description: 'Actively being developed right now', color: 'border-purple-500', bg: 'bg-purple-50/50' },
  { id: 'completed', title: 'Completed', description: 'Shipped and live in production', color: 'border-emerald-500', bg: 'bg-emerald-50/50' },
];

export const RoadmapBoard: React.FC<RoadmapBoardProps> = ({
  posts,
  onVote,
  onSelectPost,
  onStatusChange,
}) => {
  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-xl border border-slate-200">
        <h2 className="text-lg font-bold text-slate-900">Public Product Roadmap</h2>
        <p className="text-xs text-slate-500 mt-1">
          Track our upcoming releases, active work, and recently shipped capabilities.
        </p>
      </div>

      {/* 3-Column Kanban Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        {lanes.map((lane) => {
          const lanePosts = posts.filter((p) => p.status === lane.id);
          return (
            <div
              key={lane.id}
              className="bg-slate-100/70 rounded-2xl p-4 border border-slate-200 flex flex-col space-y-3"
            >
              {/* Lane Header */}
              <div className={`border-l-4 ${lane.color} pl-3 py-1`}>
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900">{lane.title}</h3>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-white text-slate-600 border border-slate-200">
                    {lanePosts.length}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">{lane.description}</p>
              </div>

              {/* Lane Cards */}
              <div className="space-y-3 min-h-[300px]">
                {lanePosts.length === 0 ? (
                  <div className="h-32 border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center text-xs text-slate-400">
                    No items in this stage
                  </div>
                ) : (
                  lanePosts.map((post) => (
                    <div
                      key={post.id}
                      onClick={() => onSelectPost(post)}
                      className="bg-white rounded-xl p-4 border border-slate-200 hover:border-slate-300 shadow-2xs hover:shadow-xs transition cursor-pointer group"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                          {post.category}
                        </span>

                        {/* Status Mover Dropdown */}
                        <select
                          value={post.status}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => onStatusChange(post.id, e.target.value)}
                          className="text-[10px] bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5 text-slate-600 focus:outline-none"
                        >
                          <option value="open">Open</option>
                          <option value="under_review">Under Review</option>
                          <option value="planned">Planned</option>
                          <option value="in_progress">In Progress</option>
                          <option value="completed">Completed</option>
                        </select>
                      </div>

                      <h4 className="text-sm font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors mt-2 line-clamp-2">
                        {post.title}
                      </h4>

                      <p className="text-xs text-slate-500 line-clamp-2 mt-1">
                        {post.description}
                      </p>

                      <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-slate-100 text-xs text-slate-500">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onVote(post.id);
                          }}
                          className={`flex items-center space-x-1 px-2 py-1 rounded-md border text-xs font-semibold transition ${
                            post.has_voted
                              ? 'bg-indigo-600 text-white border-indigo-600'
                              : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-indigo-50 hover:border-indigo-300'
                          }`}
                        >
                          <ChevronUp className="w-3.5 h-3.5" />
                          <span>{post.vote_count}</span>
                        </button>

                        <div className="flex items-center space-x-1 text-slate-400">
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>{post.comments_count}</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
