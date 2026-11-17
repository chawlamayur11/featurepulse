import React, { useState, useEffect } from 'react';
import { Activity, Clock, ShieldCheck, Terminal, Filter, RefreshCw, ExternalLink } from 'lucide-react';
import { api } from '../api';
import { TraceSpan, LogEntry } from '../types';

export const TelemetryDashboard: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [traces, setTraces] = useState<TraceSpan[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [selectedTraceId, setSelectedTraceId] = useState<string | null>(null);
  const [logFilter, setLogFilter] = useState<'all' | 'INFO' | 'WARNING' | 'ERROR'>('all');
  const [loading, setLoading] = useState(false);

  const loadTelemetry = async (traceId?: string) => {
    setLoading(true);
    try {
      const [statsData, tracesData, logsData] = await Promise.all([
        api.getTelemetryStats(),
        api.getTraces(traceId),
        api.getLogs(traceId),
      ]);
      setStats(statsData);
      setTraces(tracesData);
      setLogs(logsData);
    } catch (err) {
      console.error('Failed to load telemetry data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTelemetry(selectedTraceId || undefined);
    const interval = setInterval(() => {
      loadTelemetry(selectedTraceId || undefined);
    }, 5000);
    return () => clearInterval(interval);
  }, [selectedTraceId]);

  const filteredLogs = logs.filter((l) => {
    if (logFilter !== 'all' && l.level !== logFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-lg font-bold text-slate-900">Observability & Distributed Tracing</h2>
            <span className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full font-medium flex items-center">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-1.5 animate-pulse"></span>
              Live Telemetry
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time OpenTelemetry trace spans, Prometheus metrics counters, and PII-sanitized structured logs.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <a
            href="http://localhost:8000/metrics"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-1.5 text-xs text-slate-700 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg border border-slate-200 transition font-medium"
          >
            <span>Prometheus /metrics</span>
            <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
          </a>
          <button
            onClick={() => loadTelemetry(selectedTraceId || undefined)}
            className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-slate-100 rounded-lg border border-slate-200 transition"
            title="Refresh signals"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <p className="text-xs text-slate-500 font-medium">Total Traces Captured</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{stats?.total_requests_recorded ?? 0}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">W3C Traceparent Header</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <p className="text-xs text-slate-500 font-medium">Error Rate</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{stats?.error_rate_pct ?? 0}%</p>
          <p className="text-[11px] text-emerald-600 mt-0.5">SLA Threshold: &lt; 5.0%</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <p className="text-xs text-slate-500 font-medium">Avg Request Latency</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{stats?.avg_duration_ms ?? 0} ms</p>
          <p className="text-[11px] text-indigo-600 mt-0.5">P95: &lt; 50ms</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <p className="text-xs text-slate-500 font-medium">PII Redaction Engine</p>
          <div className="flex items-center space-x-1 text-emerald-600 font-bold text-lg mt-1">
            <ShieldCheck className="w-5 h-5" />
            <span>Enforced</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">Zero customer secrets logged</p>
        </div>
      </div>

      {/* Trace Explorer Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Activity className="w-4 h-4 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-900">Recent Distributed Spans</h3>
          </div>
          {selectedTraceId && (
            <button
              onClick={() => setSelectedTraceId(null)}
              className="text-xs text-indigo-600 hover:underline font-medium"
            >
              Clear Trace Filter ({selectedTraceId.substring(0, 8)}...)
            </button>
          )}
        </div>

        <div className="overflow-x-auto max-h-72 overflow-y-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 sticky top-0">
              <tr>
                <th className="px-4 py-2.5">Time</th>
                <th className="px-4 py-2.5">Span Name</th>
                <th className="px-4 py-2.5">Trace ID</th>
                <th className="px-4 py-2.5">Duration</th>
                <th className="px-4 py-2.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {traces.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-slate-400 font-sans">
                    No traces recorded yet. Submit feedback or vote to generate spans.
                  </td>
                </tr>
              ) : (
                traces.map((span, idx) => (
                  <tr
                    key={idx}
                    onClick={() => setSelectedTraceId(span.trace_id)}
                    className={`hover:bg-indigo-50/50 cursor-pointer transition ${
                      selectedTraceId === span.trace_id ? 'bg-indigo-50 font-bold' : ''
                    }`}
                  >
                    <td className="px-4 py-2 text-slate-500 whitespace-nowrap">{span.timestamp}</td>
                    <td className="px-4 py-2 text-slate-800 font-sans font-medium">{span.name}</td>
                    <td className="px-4 py-2 text-indigo-600 hover:underline">{span.trace_id.substring(0, 16)}...</td>
                    <td className="px-4 py-2 text-slate-600">{span.duration_ms}ms</td>
                    <td className="px-4 py-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                        span.status === 'OK' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {span.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Correlated Structured JSON Logs Viewer */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden text-slate-100 shadow-md">
        <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <Terminal className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-white">Correlated Structured JSON Logs</h3>
            {selectedTraceId && (
              <span className="text-[11px] px-2 py-0.5 bg-indigo-900/80 text-indigo-200 border border-indigo-700 rounded font-mono">
                Filtering by trace_id: {selectedTraceId.substring(0, 10)}...
              </span>
            )}
          </div>

          <div className="flex items-center space-x-1.5 text-xs">
            <span className="text-slate-400 text-[11px]">Level:</span>
            {(['all', 'INFO', 'WARNING', 'ERROR'] as const).map((lvl) => (
              <button
                key={lvl}
                onClick={() => setLogFilter(lvl)}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition ${
                  logFilter === lvl
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>
        </div>

        <div className="p-4 font-mono text-xs max-h-80 overflow-y-auto space-y-2">
          {filteredLogs.length === 0 ? (
            <p className="text-slate-500 font-sans">No matching logs in buffer.</p>
          ) : (
            filteredLogs.map((entry, idx) => (
              <div
                key={idx}
                className="bg-slate-950/80 p-2.5 rounded-lg border border-slate-800 hover:border-slate-700 transition"
              >
                <div className="flex items-center space-x-2 text-[11px]">
                  <span className="text-slate-500">{entry.timestamp}</span>
                  <span
                    className={`font-bold px-1.5 py-0.2 rounded text-[10px] ${
                      entry.level === 'ERROR' || entry.level === 'CRITICAL'
                        ? 'bg-red-950 text-red-400 border border-red-800'
                        : entry.level === 'WARNING'
                        ? 'bg-amber-950 text-amber-400 border border-amber-800'
                        : 'bg-slate-800 text-emerald-400'
                    }`}
                  >
                    {entry.level}
                  </span>
                  <span className="text-indigo-400">trace_id: {entry.trace_id?.substring(0, 12)}...</span>
                </div>
                <p className="text-slate-200 font-sans mt-1 text-xs">{entry.message}</p>
              </div>
            ))
          )}
        </div>
      </div>

    </div>
  );
};
