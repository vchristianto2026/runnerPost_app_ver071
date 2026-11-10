import React, { useState } from 'react';
import { AdminStats, Message, User } from '../types';
import {
  Shield,
  ShieldAlert,
  UserCheck,
  UserX,
  Gauge,
  Flame,
  FileText,
  Sliders,
  CheckCircle2,
  Lock,
  Compass,
} from 'lucide-react';

interface AdminDashboardProps {
  stats: AdminStats | null;
  messages: Message[];
  users: User[];
  onRefresh: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  stats,
  messages,
  users,
  onRefresh,
}) => {
  const [minSpeed, setMinSpeed] = useState<number>(stats?.config.runnerMinSpeed || 8.0);
  const [maxSpeed, setMaxSpeed] = useState<number>(stats?.config.runnerMaxSpeed || 12.0);
  const [simulationMultiplier, setSimulationMultiplier] = useState<number>(
    stats?.config.simulationMultiplier || 60
  );
  const [strictA4, setStrictA4] = useState<boolean>(stats?.config.strictA4CapEnforced ?? true);
  const [autoBurn, setAutoBurn] = useState<boolean>(stats?.config.autoBurnOnDelivery ?? true);
  const [savingConfig, setSavingConfig] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  // In-flight messages for administrative intercept
  const inFlightMessages = messages.filter((m) => m.status === 'IN_TRANSIT');

  // Toggle user suspension
  const handleToggleUser = async (userId: string) => {
    try {
      const res = await fetch('/api/admin/toggle-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      const data = await res.json();
      if (data.success) {
        setStatusMsg(`Updated status for ${data.user.name}: ${data.user.status.toUpperCase()}`);
        onRefresh();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Intercept & Purge in-flight message
  const handleInterceptMessage = async (msgId: string) => {
    if (!window.confirm(`Issue administrative intercept warrant for courier packet ${msgId}? This will halt the courier and purge plaintext.`)) {
      return;
    }
    try {
      const res = await fetch(`/api/messages/${msgId}/intercept`, {
        method: 'POST',
      });
      const data = await res.json();
      if (data.success) {
        setStatusMsg(`Administrative intercept executed on ${msgId}.`);
        onRefresh();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Save system configuration
  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingConfig(true);
    setStatusMsg(null);
    try {
      const res = await fetch('/api/admin/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          runnerMinSpeed: minSpeed,
          runnerMaxSpeed: maxSpeed,
          simulationMultiplier,
          strictA4CapEnforced: strictA4,
          autoBurnOnDelivery: autoBurn,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setStatusMsg('Security parameters and speed envelopes committed to database.');
        onRefresh();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSavingConfig(false);
    }
  };

  if (!stats) {
    return <div className="text-center p-12 text-[#6F675A]">Loading Admin Security Dashboard...</div>;
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Banner */}
      <div className="bg-[#FAF8F3] border border-[#E4DEC9] rounded-xl p-5 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-serif-royal font-semibold text-[#1C1F26] flex items-center gap-2">
              <Shield className="w-5 h-5 text-red-800" />
              <span>Grand Provost Security &amp; Sender Accountability Console</span>
            </h2>
            <p className="text-xs text-[#6F675A] mt-1">
              Surveillance of foot-courier activity, 1-A4 &amp; 2-A4 manuscript compliance, speed envelope enforcement, and emergency packet interception.
            </p>
          </div>
          <span className="text-xs font-mono-code px-3 py-1 rounded-lg bg-[#EFE9DD] text-[#4F4739] border border-[#DCD5C4] self-start sm:self-auto">
            ADMIN LEVEL: FULL ACCREDITATION
          </span>
        </div>
      </div>

      {statusMsg && (
        <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-amber-700 shrink-0" />
          <span>{statusMsg}</span>
        </div>
      )}

      {/* Overview Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-[#DDD6C8] shadow-2xs">
          <span className="text-[10px] font-mono-code uppercase text-[#7A7163] block">Total Dispatches</span>
          <span className="text-xl font-bold font-mono-code text-[#1C1F26]">{stats.totalMessages}</span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-[#DDD6C8] shadow-2xs">
          <span className="text-[10px] font-mono-code uppercase text-[#7A7163] block">Active Runners</span>
          <span className="text-xl font-bold font-mono-code text-emerald-800">{stats.inTransit}</span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-[#DDD6C8] shadow-2xs">
          <span className="text-[10px] font-mono-code uppercase text-[#7A7163] block">Burned / Shredded</span>
          <span className="text-xl font-bold font-mono-code text-red-700">{stats.burned}</span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-[#DDD6C8] shadow-2xs">
          <span className="text-[10px] font-mono-code uppercase text-[#7A7163] block">Total Distance Run</span>
          <span className="text-xl font-bold font-mono-code text-[#1C1F26]">{stats.totalDistanceRunKm} km</span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-[#DDD6C8] shadow-2xs col-span-2 sm:col-span-1">
          <span className="text-[10px] font-mono-code uppercase text-[#7A7163] block">Registered Nodes</span>
          <span className="text-xl font-bold font-mono-code text-indigo-900">{stats.totalUsers}</span>
        </div>
      </div>

      {/* SENDER ACTIVITY TRACKING TABLE */}
      <div className="bg-white rounded-xl border border-[#DDD6C8] overflow-hidden shadow-xs space-y-3">
        <div className="bg-[#FAF8F3] px-4 py-3 border-b border-[#E8E2D5] flex items-center justify-between">
          <div>
            <h3 className="font-serif-royal font-semibold text-base text-[#1C1F26] flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-emerald-800" />
              <span>Sender Activity Tracking &amp; Security Auditing</span>
            </h3>
            <p className="text-xs text-[#6F675A]">
              Accountability telemetry per sender identity, measuring manuscript length ratios, volume, and ephemeral destruction frequency.
            </p>
          </div>
          <span className="text-xs font-mono-code text-[#7A7163]">
            {stats.sendersActivity.length} Monitored Senders
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF9F5] text-[#7A7163] font-mono-code text-[11px] border-b border-[#EAE4D8]">
              <tr>
                <th className="py-2.5 px-4">Sender Identity</th>
                <th className="py-2.5 px-3">Dispatches</th>
                <th className="py-2.5 px-3">1-A4 vs 2-A4</th>
                <th className="py-2.5 px-3">In-Flight</th>
                <th className="py-2.5 px-3">Auto-Burned</th>
                <th className="py-2.5 px-3">Total Chars</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-4 text-right">Security Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0ECE2] font-mono-code">
              {stats.sendersActivity.map((s) => {
                const userObj = users.find((u) => u.id === s.senderId);
                const isSuspended = userObj?.status === 'suspended';

                return (
                  <tr key={s.senderId} className="hover:bg-[#FAF9F5] transition">
                    <td className="py-3 px-4">
                      <div className="font-sans font-medium text-[#1C1F26] text-xs">
                        {s.senderName}
                      </div>
                      <div className="text-[10px] text-[#8C8375] font-mono-code">{s.senderId}</div>
                    </td>
                    <td className="py-3 px-3 font-bold text-[#1C1F26]">{s.totalDispatches}</td>
                    <td className="py-3 px-3">
                      <span className="text-amber-900">{s.a4OneCount}</span> /{' '}
                      <span className="text-indigo-900">{s.a4TwoCount}</span>
                    </td>
                    <td className="py-3 px-3">
                      {s.inFlightCount > 0 ? (
                        <span className="text-emerald-700 font-bold">{s.inFlightCount}</span>
                      ) : (
                        <span className="text-[#A89F90]">0</span>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      <span className="text-red-700">{s.burnedCount}</span>
                    </td>
                    <td className="py-3 px-3 text-[#5F574A]">
                      {s.totalChars.toLocaleString()}
                    </td>
                    <td className="py-3 px-3">
                      {isSuspended ? (
                        <span className="px-2 py-0.5 rounded bg-red-100 text-red-800 text-[10px] font-bold border border-red-300">
                          SUSPENDED
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-semibold border border-emerald-300">
                          ACTIVE
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleToggleUser(s.senderId)}
                        className={`text-[11px] px-2.5 py-1 rounded-lg border font-medium transition ${
                          isSuspended
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                            : 'bg-red-50 text-red-800 border-red-300 hover:bg-red-100'
                        }`}
                      >
                        {isSuspended ? 'Reinstate' : 'Suspend'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ACTIVE IN-TRANSIT INTERCEPT CONSOLE */}
      <div className="bg-white rounded-xl border border-[#DDD6C8] p-4 shadow-xs space-y-3">
        <div className="flex items-center justify-between border-b border-[#EAE4D8] pb-2">
          <h3 className="font-serif-royal font-semibold text-base text-[#1C1F26] flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-red-700" />
            <span>Active In-Flight Courier Intercept Console</span>
          </h3>
          <span className="text-xs font-mono-code text-[#7A7163]">
            {inFlightMessages.length} Interceptable Packets
          </span>
        </div>

        {inFlightMessages.length === 0 ? (
          <p className="text-xs text-[#7A7163] italic py-2">
            No runners currently traversing corridors. All previous dispatches have completed or been shredded.
          </p>
        ) : (
          <div className="divide-y divide-[#F2ECE1]">
            {inFlightMessages.map((m) => (
              <div key={m.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div>
                  <div className="flex items-center gap-2 font-mono-code">
                    <span className="font-bold text-[#1C1F26]">{m.id}</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#EDE8DE] text-[#4F473A]">
                      {m.pageFormat.replace('_', '-')}
                    </span>
                    <span className="text-emerald-700">{m.progressPercent}% along route</span>
                  </div>
                  <div className="font-serif-royal text-sm text-[#1C1F26] mt-0.5">{m.title}</div>
                  <div className="text-[11px] text-[#7A7163]">
                    {m.senderName} ➔ {m.recipientName} ({m.distanceKm} km @ {m.effectiveSpeedKmH} km/h)
                  </div>
                </div>

                <button
                  onClick={() => handleInterceptMessage(m.id)}
                  className="px-3 py-1.5 rounded-lg bg-red-700 hover:bg-red-800 text-white text-xs font-medium flex items-center gap-1.5 transition shadow-2xs self-start sm:self-auto shrink-0"
                >
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>Administrative Intercept &amp; Purge</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SYSTEM CONFIGURATION & SPEED ENVELOPE */}
      <form onSubmit={handleSaveConfig} className="bg-white rounded-xl border border-[#DDD6C8] p-5 shadow-xs space-y-4">
        <div className="border-b border-[#EAE4D8] pb-2 flex items-center justify-between">
          <h3 className="font-serif-royal font-semibold text-base text-[#1C1F26] flex items-center gap-2">
            <Sliders className="w-4 h-4 text-amber-800" />
            <span>Human Latency Operational Parameters &amp; Boundaries</span>
          </h3>
          <span className="text-xs font-mono-code text-[#7A7163]">data/db.json config</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block text-[#4E473B] font-medium mb-1">
              Minimum Runner Pace (km/h)
            </label>
            <input
              type="number"
              step="0.1"
              min="5"
              max="10"
              value={minSpeed}
              onChange={(e) => setMinSpeed(parseFloat(e.target.value))}
              className="w-full p-2 rounded-lg border border-[#DDD6C8] bg-[#FAF8F3] font-mono-code"
            />
            <span className="text-[10px] text-[#8C8375] mt-0.5 block">Standard lower boundary: 8.0 km/h</span>
          </div>

          <div>
            <label className="block text-[#4E473B] font-medium mb-1">
              Maximum Runner Pace (km/h)
            </label>
            <input
              type="number"
              step="0.1"
              min="10"
              max="16"
              value={maxSpeed}
              onChange={(e) => setMaxSpeed(parseFloat(e.target.value))}
              className="w-full p-2 rounded-lg border border-[#DDD6C8] bg-[#FAF8F3] font-mono-code"
            />
            <span className="text-[10px] text-[#8C8375] mt-0.5 block">Standard upper boundary: 12.0 km/h</span>
          </div>

          <div>
            <label className="block text-[#4E473B] font-medium mb-1">
              Simulation Pace Multiplier
            </label>
            <select
              value={simulationMultiplier}
              onChange={(e) => setSimulationMultiplier(parseInt(e.target.value))}
              className="w-full p-2 rounded-lg border border-[#DDD6C8] bg-[#FAF8F3] font-mono-code"
            >
              <option value="1">1x (True Human Real-Time Hours)</option>
              <option value="30">30x (Accelerated Demonstration)</option>
              <option value="60">60x (1 Minute per Second)</option>
              <option value="180">180x (Rapid Transit Verification)</option>
              <option value="300">300x (Ultra-Fast Automated Testing)</option>
            </select>
          </div>

          <div className="space-y-2 pt-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={strictA4}
                onChange={(e) => setStrictA4(e.target.checked)}
                className="accent-amber-800"
              />
              <span className="font-medium text-[#1C1F26]">
                Enforce Strict 1-A4 &amp; 2-A4 Character Caps (3,000 &amp; 6,000 Chars)
              </span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={autoBurn}
                onChange={(e) => setAutoBurn(e.target.checked)}
                className="accent-red-700"
              />
              <span className="font-medium text-[#1C1F26]">
                Enforce Auto-Burn on Arrival across All Dispatches
              </span>
            </label>
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            disabled={savingConfig}
            className="px-4 py-2 bg-[#1C1F26] hover:bg-[#323742] text-white rounded-xl text-xs font-medium transition shadow-xs"
          >
            {savingConfig ? 'Saving Configuration...' : 'Commit Operational Rules'}
          </button>
        </div>
      </form>
    </div>
  );
};
