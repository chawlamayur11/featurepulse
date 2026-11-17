import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { FeedbackList } from './components/FeedbackList';
import { RoadmapBoard } from './components/RoadmapBoard';
import { TelemetryDashboard } from './components/TelemetryDashboard';
import { IncidentDashboard } from './components/IncidentDashboard';
import { FeedbackModal } from './components/FeedbackModal';
import { FeedbackDetailModal } from './components/FeedbackDetailModal';
import { api } from './api';
import { Post } from './types';

export const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<'board' | 'roadmap' | 'telemetry' | 'incidents'>('board');
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortBy, setSortBy] = useState('top');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [isNewFeedbackOpen, setIsNewFeedbackOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);

  const loadPosts = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getPosts({
        status: statusFilter,
        category: categoryFilter,
        sort_by: sortBy,
        search: searchQuery,
      });
      setPosts(data);
    } catch (err) {
      console.error('Failed to load posts:', err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, categoryFilter, sortBy, searchQuery]);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  // Atomic Upvote handler with trace correlation
  const handleVote = async (postId: number) => {
    // Optimistic UI update
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id === postId) {
          const newHasVoted = !p.has_voted;
          return {
            ...p,
            has_voted: newHasVoted,
            vote_count: newHasVoted ? p.vote_count + 1 : Math.max(0, p.vote_count - 1),
          };
        }
        return p;
      })
    );

    try {
      const res = await api.toggleVote(postId);
      // Re-sync with exact server counter
      setPosts((prev) =>
        prev.map((p) => (p.id === postId ? { ...p, vote_count: res.vote_count, has_voted: res.has_voted } : p))
      );
      if (selectedPost && selectedPost.id === postId) {
        setSelectedPost((prev) => prev ? { ...prev, vote_count: res.vote_count, has_voted: res.has_voted } : null);
      }
    } catch (err: any) {
      console.error('Vote failed:', err);
      // Revert on failure
      loadPosts();
    }
  };

  const handleStatusChange = async (postId: number, newStatus: string) => {
    try {
      await api.updatePostStatus(postId, newStatus);
      loadPosts();
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* Top Navigation */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        onOpenNewFeedback={() => setIsNewFeedbackOpen(true)}
        onUserChanged={loadPosts}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentTab === 'board' && (
          <FeedbackList
            posts={posts}
            loading={loading}
            onVote={handleVote}
            onSelectPost={(post) => setSelectedPost(post)}
            statusFilter={statusFilter}
            onStatusChange={setStatusFilter}
            categoryFilter={categoryFilter}
            onCategoryChange={setCategoryFilter}
            sortBy={sortBy}
            onSortChange={setSortBy}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />
        )}

        {currentTab === 'roadmap' && (
          <RoadmapBoard
            posts={posts}
            onVote={handleVote}
            onSelectPost={(post) => setSelectedPost(post)}
            onStatusChange={handleStatusChange}
          />
        )}

        {currentTab === 'telemetry' && <TelemetryDashboard />}

        {currentTab === 'incidents' && <IncidentDashboard />}
      </main>

      {/* Modals */}
      <FeedbackModal
        isOpen={isNewFeedbackOpen}
        onClose={() => setIsNewFeedbackOpen(false)}
        onCreated={loadPosts}
      />

      <FeedbackDetailModal
        post={selectedPost}
        onClose={() => setSelectedPost(null)}
        onVote={handleVote}
        onCommentAdded={loadPosts}
      />

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 mt-12 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>
            <span className="font-semibold text-slate-700">FeaturePulse</span> — AI Dev Tools Zoomcamp 2026 Project
          </p>
          <div className="flex items-center space-x-4">
            <span className="hover:text-indigo-600 transition">FastAPI</span>
            <span>•</span>
            <span className="hover:text-indigo-600 transition">React 18</span>
            <span>•</span>
            <span className="hover:text-indigo-600 transition">OpenTelemetry</span>
            <span>•</span>
            <span className="hover:text-indigo-600 transition">Docker Compose</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
