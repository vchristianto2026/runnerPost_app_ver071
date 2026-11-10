import React, { useState, useEffect } from 'react';
import { LogEntry } from '../types';
import {
  Activity,
  Download,
  RotateCcw,
  Search,
  Flame,
  Shield,
  Compass,
  Radio,
  FileCode,
} from 'lucide-react';

interface ActivityLogPanelProps {
  logs: LogEntry[];
  onRefresh: () => void;
}

export const ActivityLogPanel: React.FC<ActivityLogPanelProps> = ({ logs, onRefresh }) => {
  const [filterLevel, setFilterLevel] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Periodic polling
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      onRefresh();
    }, 2500);
    return () => clearInterval(interval);
  }, [autoRefresh, onRefresh]);

  const filteredLogs = logs.filter((log) => {
    if (filterLevel !== 'ALL' && log.level !== filterLevel) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        log.text.toLowerCase().includes(q) ||
        log.actor.toLowerCase().includes(q) ||
        log.level.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const getLevelBadge = (level: string) => {
    switch (level) {
      case 'RUNNER':
        return { color: 'bg-emerald-100 text-emerald-800 border-emerald-300', icon: Compass };
      case 'PURGE':
        return { color: 'bg-red-100 text-red-800 border-red-300', icon: Flame };
      case 'SECURITY':
        return { color: 'bg-amber-100 text-amber-800 border-amber-300', icon: Shield };
      case 'BIRD_API':
        return { color: 'bg-purple-100 text-purple-800 border-purple-300', icon: Radio };
      default:
        return { color: 'bg-[#EDE8DE] text-[#4F473A] border-[#DDD6C4]', icon: Activity };
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Banner */}
      <div className="bg-[#FAF8F3] border border-[#E4DEC9] rounded-xl p-4 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-serif-royal font-semibold text-[#1C1F26] flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-800" />
            <span>Flat Text-Database Activity Stream</span>
            <span className="text-xs font-mono-code px-2 py-0.5 rounded bg-[#EDE8DE] text-[#4F473A] border border-[#DDD6C4]">
              data/activity_log.txt
            </span>
          </h2>
          <p className="text-xs text-[#6F675A] mt-0.5">
            Append-only chronological audit log tracking runner footfalls, encryption verifications, and ephemeral deletions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Download raw log */}
          <a
            href="/api/logs/raw"
            download="activity_log.txt"
            target="_blank"
            rel="noreferrer"
            className="text-xs px-3 py-1.5 rounded-lg border border-[#D5CFC2] bg-white hover:bg-[#F3EFE6] text-[#4E473B] transition flex items-center gap-1.5 shadow-2xs font-medium"
          >
            <Download className="w-3.5 h-3.5 text-amber-800" />
            Download .txt File
          </a>

          {/* Refresh & Auto-toggle */}
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`text-xs px-2.5 py-1.5 rounded-lg border font-mono-code transition ${
              autoRefresh
                ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                : 'bg-white border-[#DDD6C8] text-[#7A7163]'
            }`}
          >
            {autoRefresh ? '● Auto (2.5s)' : '○ Paused'}
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Level Filters */}
        <div className="flex items-center gap-1 bg-[#FAF8F3] p-1 rounded-lg border border-[#E0DACD] overflow-x-auto">
          {['ALL', 'RUNNER', 'PURGE', 'SECURITY', 'BIRD_API', 'INFO'].map((lvl) => (
            <button
              key={lvl}
              onClick={() => setFilterLevel(lvl)}
              className={`text-xs px-2.5 py-1 rounded-md font-mono-code transition ${
                filterLevel === lvl
                  ? 'bg-white text-[#1C1F26] font-bold shadow-2xs'
                  : 'text-[#6F675A] hover:text-[#1C1F26]'
              }`}
            >
              {lvl}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-[#A89F90] absolute left-2.5 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search telemetry & logs..."
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-[#DDD6C8] bg-white focus:outline-hidden focus:border-amber-700 text-[#1C1F26]"
          />
        </div>
      </div>

      {/* Log Feed */}
      <div className="bg-white rounded-xl border border-[#DDD6C8] overflow-hidden shadow-xs">
        <div className="bg-[#FAF8F3] px-4 py-2 border-b border-[#E8E2D5] flex items-center justify-between text-xs text-[#5D5547] font-mono-code">
          <span>{filteredLogs.length} Events Recorded</span>
          <span className="text-[11px] text-[#8C8375]">ISO-8601 UTC Time</span>
        </div>

        <div className="divide-y divide-[#F2ECE1] max-h-[600px] overflow-y-auto font-mono-code text-xs">
          {filteredLogs.length === 0 ? (
            <div className="p-8 text-center text-[#8C8375]">No matching events found in log file.</div>
          ) : (
            filteredLogs.map((log) => {
              const badge = getLevelBadge(log.level);
              const Icon = badge.icon;
              return (
                <div key={log.id} className="p-3 hover:bg-[#FAF9F5] transition flex items-start gap-3">
                  <div className="shrink-0 mt-0.5">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded border font-semibold flex items-center gap-1 ${badge.color}`}>
                      <Icon className="w-2.5 h-2.5" />
                      {log.level}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 text-[11px] text-[#7E7567] mb-0.5">
                      <span className="font-semibold text-[#3C362C]">{log.actor}</span>
                      <span>•</span>
                      <span>{new Date(log.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                      <span className="text-[#A89F90] hidden sm:inline">{log.timestamp}</span>
                    </div>
                    <p className="text-[#1C1F26] break-words text-xs leading-relaxed">
                      {log.text}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
