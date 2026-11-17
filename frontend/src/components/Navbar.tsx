import React, { useState } from 'react';
import { Layers, Kanban, Activity, ShieldAlert, Plus, User, RefreshCw } from 'lucide-react';
import { getOrCreateUserId, resetUserId } from '../api';

interface NavbarProps {
  currentTab: 'board' | 'roadmap' | 'telemetry' | 'incidents';
  onSelectTab: (tab: 'board' | 'roadmap' | 'telemetry' | 'incidents') => void;
  onOpenNewFeedback: () => void;
  onUserChanged: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  onOpenNewFeedback,
  onUserChanged,
}) => {
  const [userId, setUserId] = useState(getOrCreateUserId());

  const handleSwitchUser = () => {
    const newId = resetUserId();
    setUserId(newId);
    onUserChanged();
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Brand Logo & Title */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => onSelectTab('board')}>
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-100">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xl font-bold tracking-tight text-slate-900">FeaturePulse</span>
                <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-indigo-50 text-indigo-700 border border-indigo-200">
                  OpenTelemetry Ready
                </span>
              </div>
              <p className="text-xs text-slate-500">Customer Feedback & SRE Self-Healing Roadmap</p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden md:flex items-center space-x-1">
            <button
              onClick={() => onSelectTab('board')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                currentTab === 'board'
                  ? 'bg-indigo-50 text-indigo-700 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Feedback Board</span>
            </button>

            <button
              onClick={() => onSelectTab('roadmap')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                currentTab === 'roadmap'
                  ? 'bg-indigo-50 text-indigo-700 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Kanban className="w-4 h-4" />
              <span>Roadmap (Kanban)</span>
            </button>

            <button
              onClick={() => onSelectTab('telemetry')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                currentTab === 'telemetry'
                  ? 'bg-indigo-50 text-indigo-700 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Activity className="w-4 h-4" />
              <span>Telemetry & Traces</span>
            </button>

            <button
              onClick={() => onSelectTab('incidents')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                currentTab === 'incidents'
                  ? 'bg-indigo-50 text-indigo-700 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <ShieldAlert className="w-4 h-4" />
              <span>Incidents & On-Call</span>
            </button>
          </nav>

          {/* Action Buttons & Session Info */}
          <div className="flex items-center space-x-3">
            {/* User Session Switcher */}
            <div className="hidden lg:flex items-center bg-slate-100 hover:bg-slate-200/80 rounded-lg px-2.5 py-1 text-xs text-slate-700 border border-slate-200 transition-colors">
              <User className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
              <span className="font-mono mr-2">{userId}</span>
              <button
                onClick={handleSwitchUser}
                title="Switch client session identifier to test multi-user voting"
                className="text-slate-500 hover:text-indigo-600 ml-1 p-0.5 rounded transition"
              >
                <RefreshCw className="w-3 h-3" />
              </button>
            </div>

            {/* New Feedback Button */}
            <button
              onClick={onOpenNewFeedback}
              className="flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-xs transition"
            >
              <Plus className="w-4 h-4" />
              <span>Give Feedback</span>
            </button>
          </div>

        </div>
      </div>
    </header>
  );
};
