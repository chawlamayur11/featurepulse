import React from 'react';
import { Sparkles, AlertTriangle, ThumbsUp } from 'lucide-react';
import { DuplicateMatch } from '../types';

interface AIDuplicateDetectorProps {
  loading: boolean;
  matches: DuplicateMatch[];
  hasWarning: boolean;
  onUpvoteExisting: (id: number) => void;
}

export const AIDuplicateDetector: React.FC<AIDuplicateDetectorProps> = ({
  loading,
  matches,
  hasWarning,
  onUpvoteExisting,
}) => {
  if (loading) {
    return (
      <div className="flex items-center space-x-2 text-xs text-indigo-600 bg-indigo-50/70 p-2.5 rounded-lg border border-indigo-100 animate-pulse">
        <Sparkles className="w-3.5 h-3.5 animate-spin" />
        <span>AI checking for similar existing feature requests...</span>
      </div>
    );
  }

  if (matches.length === 0) {
    return null;
  }

  return (
    <div className={`p-3.5 rounded-xl border transition-all ${
      hasWarning 
        ? 'bg-amber-50/80 border-amber-200 text-amber-900' 
        : 'bg-indigo-50/60 border-indigo-200 text-indigo-900'
    }`}>
      <div className="flex items-center space-x-2 mb-2">
        {hasWarning ? (
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
        ) : (
          <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />
        )}
        <span className="text-xs font-semibold">
          {hasWarning
            ? 'Possible Duplicate Found! Existing requests match your title:'
            : 'Related existing requests:'}
        </span>
      </div>

      <div className="space-y-2 mt-2">
        {matches.map((match) => (
          <div
            key={match.id}
            className="flex items-center justify-between bg-white/90 p-2.5 rounded-lg border border-slate-200/80 text-xs shadow-2xs"
          >
            <div className="min-w-0 flex-1 pr-3">
              <p className="font-semibold text-slate-800 truncate">{match.title}</p>
              <div className="flex items-center space-x-2 text-[10px] text-slate-500 mt-0.5">
                <span className="bg-slate-100 px-1.5 py-0.5 rounded font-medium text-slate-700">
                  {match.category}
                </span>
                <span className="font-mono text-indigo-600 font-bold">
                  {Math.round(match.similarity * 100)}% match
                </span>
                <span>• {match.vote_count} votes</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onUpvoteExisting(match.id)}
              className="flex items-center space-x-1 bg-indigo-600 hover:bg-indigo-700 text-white px-2.5 py-1 rounded text-[11px] font-medium shrink-0 transition"
            >
              <ThumbsUp className="w-3 h-3" />
              <span>Upvote It</span>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
