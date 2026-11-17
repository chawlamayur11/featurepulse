import React, { useState, useEffect, useRef } from 'react';
import { X, Sparkles, Send, ShieldCheck } from 'lucide-react';
import { api } from '../api';
import { DuplicateMatch } from '../types';
import { AIDuplicateDetector } from './AIDuplicateDetector';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
}

const defaultCategories = ['UI/UX', 'Integrations', 'Core Feature', 'Security', 'Performance', 'Bug'];

export const FeedbackModal: React.FC<FeedbackModalProps> = ({ isOpen, onClose, onCreated }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Core Feature');
  const [suggestedTags, setSuggestedTags] = useState<string[]>([]);
  const [aiMatches, setAiMatches] = useState<DuplicateMatch[]>([]);
  const [hasWarning, setHasWarning] = useState(false);
  const [checkingAi, setCheckingAi] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const debounceTimer = useRef<number | null>(null);

  // Real-time AI Duplicate Detection & Tag Suggestions
  useEffect(() => {
    if (debounceTimer.current) {
      window.clearTimeout(debounceTimer.current);
    }

    if (title.trim().length >= 4) {
      setCheckingAi(true);
      debounceTimer.current = window.setTimeout(async () => {
        try {
          const res = await api.checkDuplicates(title);
          setAiMatches(res.matches);
          setHasWarning(res.has_duplicate_warning);

          if (description.trim().length >= 5) {
            const tagRes = await api.suggestTags(title, description);
            setSuggestedTags(tagRes.suggested_categories);
          }
        } catch (err) {
          console.error('AI check failed:', err);
        } finally {
          setCheckingAi(false);
        }
      }, 350);
    } else {
      setAiMatches([]);
      setHasWarning(false);
      setCheckingAi(false);
    }

    return () => {
      if (debounceTimer.current) window.clearTimeout(debounceTimer.current);
    };
  }, [title, description]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      setError('Title and description are required.');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await api.createPost(title, description, category);
      setTitle('');
      setDescription('');
      onCreated();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to submit feedback.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpvoteExisting = async (id: number) => {
    try {
      await api.toggleVote(id);
      onCreated();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to upvote item.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 relative animate-in fade-in zoom-in-95 duration-150">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-2.5 mb-4">
          <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600">
            <Sparkles className="w-4 h-4" />
          </div>
          <h2 className="text-lg font-bold text-slate-900">Submit Feature Request</h2>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 text-xs rounded-lg border border-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Title / Short Summary *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Add Slack notifications for high priority alerts"
              className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>

          {/* AI Duplicate Detection Live Widget */}
          <AIDuplicateDetector
            loading={checkingAi}
            matches={aiMatches}
            hasWarning={hasWarning}
            onUpvoteExisting={handleUpvoteExisting}
          />

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Details & Context *
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              placeholder="Describe the problem, use-case, or proposed solution..."
              className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>

          {/* Category Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Category
            </label>
            <div className="flex flex-wrap gap-1.5">
              {defaultCategories.map((cat) => (
                <button
                  type="button"
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`px-3 py-1 text-xs rounded-lg font-medium border transition ${
                    category === cat
                      ? 'bg-indigo-600 border-indigo-600 text-white'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* AI Suggested Categories if detected */}
            {suggestedTags.length > 0 && (
              <div className="flex items-center space-x-1.5 mt-2 text-[11px] text-indigo-600">
                <Sparkles className="w-3 h-3" />
                <span>AI suggested:</span>
                {suggestedTags.map((tag) => (
                  <button
                    type="button"
                    key={tag}
                    onClick={() => setCategory(tag)}
                    className="underline hover:text-indigo-800"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* PII Redaction Guarantee Note */}
          <div className="flex items-center space-x-1.5 text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Telemetry boundary active: emails and tokens are automatically scrubbed.</span>
          </div>

          {/* Submit Actions */}
          <div className="flex justify-end space-x-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 text-xs font-semibold rounded-lg shadow-xs transition disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{submitting ? 'Submitting...' : 'Post Request'}</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
