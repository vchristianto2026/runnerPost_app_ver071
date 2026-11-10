/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { User, Message, LogEntry, AdminStats } from './types';
import { Header } from './components/Header';
import { ComposeDispatch } from './components/ComposeDispatch';
import { ActiveCouriers } from './components/ActiveCouriers';
import { MailVault } from './components/MailVault';
import { ActivityLogPanel } from './components/ActivityLogPanel';
import { AdminDashboard } from './components/AdminDashboard';
import { BirdApiExplorer } from './components/BirdApiExplorer';
import { Loader2 } from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [activeTab, setActiveTab] = useState<'compose' | 'couriers' | 'vault' | 'logs' | 'admin' | 'bird'>('couriers');
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [loading, setLoading] = useState(true);
  const [simulationMultiplier, setSimulationMultiplier] = useState(60);

  // Fetch initial auth session
  const fetchAuth = useCallback(async (userId?: string) => {
    try {
      const headers: Record<string, string> = {};
      if (userId) headers['x-user-id'] = userId;
      const res = await fetch('/api/auth/me', { headers });
      const data = await res.json();
      if (data.success) {
        setCurrentUser(data.user);
        setAllUsers(data.allUsers);
      }
    } catch (err) {
      console.error('Failed to load user auth session:', err);
    }
  }, []);

  // Fetch messages
  const fetchMessages = useCallback(async () => {
    try {
      const res = await fetch('/api/messages');
      const data = await res.json();
      if (data.success) {
        setMessages(data.messages);
      }
    } catch (err) {
      console.error('Failed to load messages:', err);
    }
  }, []);

  // Fetch logs
  const fetchLogs = useCallback(async () => {
    try {
      const res = await fetch('/api/logs');
      const data = await res.json();
      if (data.success) {
        setLogs(data.logs);
      }
    } catch (err) {
      console.error('Failed to load logs:', err);
    }
  }, []);

  // Fetch admin stats
  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/stats');
      const data = await res.json();
      if (data.success) {
        setStats(data.stats);
        if (data.stats.config?.simulationMultiplier) {
          setSimulationMultiplier(data.stats.config.simulationMultiplier);
        }
      }
    } catch (err) {
      console.error('Failed to load admin stats:', err);
    }
  }, []);

  // Initial load
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await fetchAuth();
      await Promise.all([fetchMessages(), fetchLogs(), fetchStats()]);
      setLoading(false);
    };
    init();
  }, [fetchAuth, fetchMessages, fetchLogs, fetchStats]);

  // Periodic polling for real-time telemetry (every 2.5 seconds)
  useEffect(() => {
    const ticker = setInterval(() => {
      fetchMessages();
      fetchLogs();
      fetchStats();
    }, 2500);
    return () => clearInterval(ticker);
  }, [fetchMessages, fetchLogs, fetchStats]);

  // Switch persona handler
  const handleSwitchUser = async (userId: string) => {
    try {
      const res = await fetch('/api/auth/switch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      const data = await res.json();
      if (data.success) {
        setCurrentUser(data.user);
        await Promise.all([fetchMessages(), fetchLogs(), fetchStats()]);
      }
    } catch (err) {
      console.error('Failed to switch user:', err);
    }
  };

  // Update simulation pace multiplier
  const handleUpdateMultiplier = async (multiplier: number) => {
    setSimulationMultiplier(multiplier);
    try {
      await fetch('/api/admin/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ simulationMultiplier: multiplier }),
      });
      fetchStats();
    } catch (err) {
      console.error('Failed to update multiplier:', err);
    }
  };

  // Burn message handler
  const handleBurnMessage = async (msg: Message) => {
    try {
      const res = await fetch(`/api/messages/${msg.id}/burn`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reason: `Manual Ephemeral Shredding executed by ${currentUser?.name || 'User'} (${msg.pageFormat} Format)`,
        }),
      });
      const data = await res.json();
      if (data.success) {
        fetchMessages();
        fetchLogs();
        fetchStats();
      }
    } catch (err) {
      console.error('Burn failed:', err);
    }
  };

  if (loading || !currentUser) {
    return (
      <div className="min-h-screen bg-[#F6F5F0] flex flex-col items-center justify-center space-y-3 text-[#5A5245]">
        <Loader2 className="w-8 h-8 animate-spin text-amber-800" />
        <div className="font-serif-royal text-lg font-semibold text-[#1C1F26]">
          runnerPost Human Latency Network
        </div>
        <p className="text-xs text-[#7A7163] font-mono-code">
          Mounting flat text database &amp; cryptographic shredder...
        </p>
      </div>
    );
  }

  const inTransitCount = messages.filter((m) => m.status === 'IN_TRANSIT').length;
  const burnedCount = messages.filter((m) => m.status.startsWith('BURNED')).length;

  return (
    <div className="min-h-screen bg-[#F6F5F0] text-[#1E232A] flex flex-col">
      {/* Top Navigation & Masthead */}
      <Header
        currentUser={currentUser}
        allUsers={allUsers}
        onSwitchUser={handleSwitchUser}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        inTransitCount={inTransitCount}
        burnedCount={burnedCount}
      />

      {/* Main View Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">
        {activeTab === 'compose' && (
          <ComposeDispatch
            currentUser={currentUser}
            allUsers={allUsers}
            onDispatchSuccess={() => {
              setActiveTab('couriers');
              fetchMessages();
              fetchLogs();
              fetchStats();
            }}
          />
        )}

        {activeTab === 'couriers' && (
          <ActiveCouriers
            messages={messages}
            currentUser={currentUser}
            onRefresh={() => {
              fetchMessages();
              fetchLogs();
              fetchStats();
            }}
            onViewMessage={(msg) => setSelectedMessage(msg)}
            simulationMultiplier={simulationMultiplier}
            onUpdateMultiplier={handleUpdateMultiplier}
          />
        )}

        {activeTab === 'vault' && (
          <MailVault
            messages={messages}
            currentUser={currentUser}
            selectedMessage={selectedMessage}
            onSelectMessage={setSelectedMessage}
            onBurnMessage={handleBurnMessage}
          />
        )}

        {activeTab === 'logs' && (
          <ActivityLogPanel
            logs={logs}
            onRefresh={() => {
              fetchLogs();
            }}
          />
        )}

        {activeTab === 'admin' && (
          <AdminDashboard
            stats={stats}
            messages={messages}
            users={allUsers}
            onRefresh={() => {
              fetchStats();
              fetchMessages();
              fetchLogs();
            }}
          />
        )}

        {activeTab === 'bird' && <BirdApiExplorer />}
      </main>

      {/* Footer info bar */}
      <footer className="border-t border-[#E6E1D6] bg-[#FAF8F3] py-4 text-xs text-[#7A7163]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-serif-royal font-semibold text-[#383228]">runnerPost</span>
            <span>•</span>
            <span>Zero-Knowledge 256-Bit Cryptography</span>
            <span>•</span>
            <span>Deliberate Human Latency (8–12 km/h)</span>
          </div>
          <div className="flex items-center gap-4 text-[11px] font-mono-code">
            <span>Storage: Flat Text Database</span>
            <span>API: RFC 1149 / Bird Standard</span>
            <span>© 2026</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
