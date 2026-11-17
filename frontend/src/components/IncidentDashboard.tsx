import React, { useState, useEffect } from 'react';
import { ShieldAlert, AlertTriangle, CheckCircle2, Bot, Play, FileText, ChevronDown, ChevronUp } from 'lucide-react';
import { api } from '../api';
import { Incident } from '../types';

export const IncidentDashboard: React.FC = () => {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [simulating, setSimulating] = useState(false);
  const [activeIncidentId, setActiveIncidentId] = useState<number | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  const loadIncidents = async () => {
    try {
      const data = await api.getIncidents();
      setIncidents(data);
      if (data.length > 0 && activeIncidentId === null) {
        setActiveIncidentId(data[0].id);
      }
    } catch (err) {
      console.error('Failed to load incidents:', err);
    }
  };

  useEffect(() => {
    loadIncidents();
  }, []);

  const handleSimulate = async (alertType: 'high_error_rate' | 'voting_flood') => {
    setSimulating(true);
    setFeedbackMsg(null);
    try {
      const incident = await api.simulateAlert(alertType);
      await loadIncidents();
      setActiveIncidentId(incident.id);
      setFeedbackMsg(`🚨 Alert triggered! Autonomous On-Call Agent woke up, applied remediation, and resolved Incident #${incident.id}.`);
    } catch (err: any) {
      setFeedbackMsg(`Simulation error: ${err.message}`);
    } finally {
      setSimulating(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="bg-white p-5 rounded-xl border border-slate-200">
        <div className="flex items-center space-x-2">
          <ShieldAlert className="w-5 h-5 text-indigo-600" />
          <h2 className="text-lg font-bold text-slate-900">Incident Alerting & Autonomous On-Call Agent</h2>
        </div>
        <p className="text-xs text-slate-500 mt-1">
          Demonstrates production alert triggers tied to real user impact and automated self-healing by our SRE Responder Agent.
        </p>
      </div>

      {/* Simulator Action Panel */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white shadow-lg border border-slate-800">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <Bot className="w-5 h-5 text-indigo-400" />
              <h3 className="text-base font-bold">On-Call Responder Agent Simulator</h3>
            </div>
            <p className="text-xs text-slate-300 mt-1 max-w-xl">
              Trigger a simulated user-impact alert. Watch the autonomous agent wake up via webhook, correlate traces, execute targeted remediation (rate-limiting or connection flush), and generate a postmortem report.
            </p>
          </div>

          {/* Trigger Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => handleSimulate('high_error_rate')}
              disabled={simulating}
              className="flex items-center space-x-2 bg-rose-600 hover:bg-rose-700 text-white px-3.5 py-2 rounded-xl text-xs font-semibold shadow-md transition disabled:opacity-50"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Simulate High 5xx Error Rate</span>
            </button>

            <button
              onClick={() => handleSimulate('voting_flood')}
              disabled={simulating}
              className="flex items-center space-x-2 bg-amber-600 hover:bg-amber-700 text-white px-3.5 py-2 rounded-xl text-xs font-semibold shadow-md transition disabled:opacity-50"
            >
              <Play className="w-3.5 h-3.5" />
              <span>Simulate Vote Spambot Flood</span>
            </button>
          </div>
        </div>

        {feedbackMsg && (
          <div className="mt-4 p-3 bg-indigo-900/60 border border-indigo-500/40 rounded-xl text-xs text-indigo-100 flex items-center space-x-2 animate-in fade-in duration-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{feedbackMsg}</span>
          </div>
        )}
      </div>

      {/* Incidents Table & Postmortem Viewer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Left: Incident List */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Incident History</h3>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 font-semibold text-slate-600">
              {incidents.length}
            </span>
          </div>

          <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
            {incidents.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">
                No incidents recorded. Trigger an alert above to test the on-call agent.
              </div>
            ) : (
              incidents.map((inc) => (
                <div
                  key={inc.id}
                  onClick={() => setActiveIncidentId(inc.id)}
                  className={`p-4 cursor-pointer transition ${
                    activeIncidentId === inc.id ? 'bg-indigo-50/80 border-l-4 border-indigo-600' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">Incident #{inc.id}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-800">
                      RESOLVED
                    </span>
                  </div>

                  <p className="text-xs font-semibold text-indigo-600 mt-1 truncate">{inc.alert_name}</p>
                  <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5">{inc.symptoms}</p>
                  <p className="text-[10px] text-slate-400 mt-2">{new Date(inc.created_at).toLocaleString()}</p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right: Detailed Postmortem Display */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-6 shadow-2xs min-h-[400px]">
          {activeIncidentId === null || !incidents.find((i) => i.id === activeIncidentId) ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-400">
              <FileText className="w-10 h-10 text-slate-300 mb-2" />
              <p className="text-sm font-medium">Select an incident to read the Agent Postmortem report.</p>
            </div>
          ) : (
            (() => {
              const active = incidents.find((i) => i.id === activeIncidentId)!;
              return (
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                    <div>
                      <h3 className="text-base font-bold text-slate-900">{active.alert_name}</h3>
                      <p className="text-xs text-slate-500 font-mono mt-0.5">Correlated Trace ID: {active.trace_id}</p>
                    </div>
                    <span className="text-xs bg-indigo-100 text-indigo-800 font-semibold px-2.5 py-1 rounded-lg">
                      Severity: {active.severity.toUpperCase()}
                    </span>
                  </div>

                  {/* Summary Callouts */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs">
                      <p className="font-semibold text-slate-700">Root Cause Identified:</p>
                      <p className="text-slate-600 mt-1">{active.root_cause}</p>
                    </div>

                    <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-200 text-xs">
                      <p className="font-semibold text-emerald-800">Remediation Executed by Agent:</p>
                      <p className="text-emerald-700 mt-1 whitespace-pre-line">{active.remediation_action}</p>
                    </div>
                  </div>

                  {/* Markdown Postmortem Render */}
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center">
                      <FileText className="w-3.5 h-3.5 mr-1 text-slate-500" />
                      Automated Markdown Incident Postmortem
                    </h4>
                    <pre className="bg-slate-900 text-slate-100 p-4 rounded-xl text-xs font-mono overflow-x-auto whitespace-pre-wrap leading-relaxed">
                      {active.postmortem_md}
                    </pre>
                  </div>
                </div>
              );
            })()
          )}
        </div>

      </div>

    </div>
  );
};
