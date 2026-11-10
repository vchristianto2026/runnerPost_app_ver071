import React, { useState } from 'react';
import { Message, User } from '../types';
import {
  Flame,
  Gauge,
  MapPin,
  CheckCircle2,
  Clock,
  Compass,
  Lock,
  ArrowRight,
  ShieldAlert,
  FastForward,
  Play,
  RotateCcw,
} from 'lucide-react';

interface ActiveCouriersProps {
  messages: Message[];
  currentUser: User;
  onRefresh: () => void;
  onViewMessage: (msg: Message) => void;
  simulationMultiplier: number;
  onUpdateMultiplier: (multiplier: number) => void;
}

export const ActiveCouriers: React.FC<ActiveCouriersProps> = ({
  messages,
  currentUser,
  onRefresh,
  onViewMessage,
  simulationMultiplier,
  onUpdateMultiplier,
}) => {
  const [filter, setFilter] = useState<'all' | 'in_transit' | 'burned' | 'delivered'>('all');
  const [burningId, setBurningId] = useState<string | null>(null);

  // Filter messages
  const filteredMessages = messages.filter((m) => {
    if (filter === 'in_transit') return m.status === 'IN_TRANSIT';
    if (filter === 'burned') return m.status === 'BURNED_DELIVERED' || m.status === 'BURNED_IN_FLIGHT';
    if (filter === 'delivered') return m.status === 'DELIVERED';
    return true;
  });

  const inTransitCount = messages.filter((m) => m.status === 'IN_TRANSIT').length;

  // Handle mid-transit burn ("even if the message has not completely carried to the recipient")
  const handleBurnMessage = async (msg: Message) => {
    const confirmText =
      msg.status === 'IN_TRANSIT'
        ? `Execute immediate mid-transit destruction of message ${msg.id}? The runner will be halted and message text zeroed out permanently from the text database.`
        : `Confirm ephemeral shredding of message ${msg.id}?`;

    if (!window.confirm(confirmText)) return;

    setBurningId(msg.id);
    try {
      const res = await fetch(`/api/messages/${msg.id}/burn`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reason:
            msg.status === 'IN_TRANSIT'
              ? `Sender In-Flight Abort & Ephemeral Shredding (${msg.pageFormat} Format)`
              : `Post-Delivery Ephemeral Destruction (${msg.pageFormat} Format)`,
        }),
      });
      const data = await res.json();
      if (data.success) {
        onRefresh();
      }
    } catch (err) {
      console.error('Burn failed:', err);
    } finally {
      setBurningId(null);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Control Banner & Simulation Multiplier */}
      <div className="bg-[#FAF8F3] border border-[#E4DEC9] rounded-xl p-4 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-serif-royal font-semibold text-[#1C1F26] flex items-center gap-2">
            <Compass className="w-5 h-5 text-emerald-800" />
            <span>Human Latency Courier Telemetry Radar</span>
            <span className="text-xs font-mono-code px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
              {inTransitCount} Active Runners
            </span>
          </h2>
          <p className="text-xs text-[#6F675A] mt-0.5">
            Physical foot couriers traversing real-world distance at 8.0–12.0 km/h with waypoint tracking and instant in-flight shredding.
          </p>
        </div>

        {/* Speed multiplier selector */}
        <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-[#DDD6C8] shadow-2xs self-start md:self-auto">
          <FastForward className="w-4 h-4 text-amber-700" />
          <span className="text-xs font-medium text-[#4B4436]">Simulation Pace:</span>
          <div className="flex items-center gap-1">
            {[1, 60, 180, 300].map((mult) => (
              <button
                key={mult}
                onClick={() => onUpdateMultiplier(mult)}
                className={`text-xs px-2 py-1 rounded font-mono-code transition ${
                  simulationMultiplier === mult
                    ? 'bg-[#1C1F26] text-[#FAF8F3] font-bold'
                    : 'text-[#6F675A] hover:bg-[#F2ECE1]'
                }`}
                title={mult === 1 ? '1x True Time (Hours)' : `${mult}x Accelerated Demo`}
              >
                {mult === 1 ? '1x Real' : `${mult}x`}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-1.5 bg-[#FAF8F3] p-1 rounded-lg border border-[#E0DACD]">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition ${
              filter === 'all'
                ? 'bg-white text-[#1C1F26] shadow-2xs'
                : 'text-[#6F675A] hover:text-[#1C1F26]'
            }`}
          >
            All Messages ({messages.length})
          </button>
          <button
            onClick={() => setFilter('in_transit')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition ${
              filter === 'in_transit'
                ? 'bg-white text-[#1C1F26] shadow-2xs'
                : 'text-[#6F675A] hover:text-[#1C1F26]'
            }`}
          >
            In Flight ({inTransitCount})
          </button>
          <button
            onClick={() => setFilter('burned')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition ${
              filter === 'burned'
                ? 'bg-white text-[#1C1F26] shadow-2xs'
                : 'text-[#6F675A] hover:text-[#1C1F26]'
            }`}
          >
            Burned / Shredded ({messages.filter((m) => m.status.startsWith('BURNED')).length})
          </button>
          <button
            onClick={() => setFilter('delivered')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition ${
              filter === 'delivered'
                ? 'bg-white text-[#1C1F26] shadow-2xs'
                : 'text-[#6F675A] hover:text-[#1C1F26]'
            }`}
          >
            Delivered ({messages.filter((m) => m.status === 'DELIVERED').length})
          </button>
        </div>

        <button
          onClick={onRefresh}
          className="text-xs px-2.5 py-1.5 rounded-lg border border-[#D5CFC2] bg-white hover:bg-[#F3EFE6] text-[#4E473B] transition flex items-center gap-1.5 shadow-2xs"
        >
          <RotateCcw className="w-3.5 h-3.5 text-[#6F675A]" />
          Refresh Radar
        </button>
      </div>

      {/* Messages List */}
      {filteredMessages.length === 0 ? (
        <div className="bg-white rounded-xl border border-[#DDD6C8] p-12 text-center text-[#7E7567] space-y-2">
          <Compass className="w-10 h-10 mx-auto text-[#C7BFA8]" />
          <h3 className="font-serif-royal text-base text-[#3E382E]">No Messages In This Corridor</h3>
          <p className="text-xs">Dispatch a new 1-A4 or 2-A4 manuscript to mobilize a royal courier.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredMessages.map((msg) => {
            const isBurned = msg.status === 'BURNED_DELIVERED' || msg.status === 'BURNED_IN_FLIGHT';
            const isInTransit = msg.status === 'IN_TRANSIT';
            const isDelivered = msg.status === 'DELIVERED';
            const kmTraversed = Math.round(((msg.progressPercent / 100) * msg.distanceKm) * 10) / 10;
            const kmRemaining = Math.max(0, Math.round((msg.distanceKm - kmTraversed) * 10) / 10);

            return (
              <div
                key={msg.id}
                className="bg-white rounded-xl border border-[#DDD6C8] overflow-hidden shadow-xs hover:border-[#C4BAA3] transition"
              >
                {/* Header row */}
                <div className="bg-[#FAF8F3] px-4 py-2.5 border-b border-[#E8E2D5] flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono-code font-bold text-xs text-[#1C1F26]">
                      {msg.id}
                    </span>
                    <span className="text-[10px] font-mono-code px-2 py-0.5 rounded bg-[#EDE8DE] text-[#4F473A] border border-[#DDD6C4]">
                      {msg.pageFormat.replace('_', '-')} ({msg.originalWordCount} words)
                    </span>
                    {isInTransit && (
                      <span className="text-[10px] font-mono-code px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                        IN TRANSIT ({msg.progressPercent}%)
                      </span>
                    )}
                    {isBurned && (
                      <span className="text-[10px] font-mono-code px-2 py-0.5 rounded bg-red-100 text-red-800 border border-red-300 flex items-center gap-1">
                        <Flame className="w-3 h-3 text-red-600" />
                        {msg.status === 'BURNED_IN_FLIGHT' ? 'BURNED IN-FLIGHT' : 'BURNED ON ARRIVAL'}
                      </span>
                    )}
                    {isDelivered && (
                      <span className="text-[10px] font-mono-code px-2 py-0.5 rounded bg-blue-100 text-blue-800 border border-blue-300 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-blue-600" />
                        DELIVERED
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 text-xs text-[#6F675A]">
                    <span className="flex items-center gap-1">
                      <Lock className="w-3 h-3 text-amber-700" />
                      AES-256
                    </span>
                    <span>•</span>
                    <span className="font-mono-code">{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>

                {/* Content body */}
                <div className="p-4 space-y-4">
                  {/* Title & Route */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h3 className="font-serif-royal font-semibold text-base text-[#1C1F26]">
                        {msg.title}
                      </h3>
                      <div className="flex items-center gap-2 text-xs text-[#6F675A] mt-0.5">
                        <span className="font-medium text-[#383329]">{msg.senderName}</span>
                        <ArrowRight className="w-3 h-3 text-[#A89F90]" />
                        <span className="font-medium text-[#383329]">{msg.recipientName}</span>
                        <span className="text-[#A89F90]">({msg.recipientStation})</span>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                      <button
                        onClick={() => onViewMessage(msg)}
                        className="text-xs px-3 py-1.5 rounded-lg border border-[#D5CFC2] bg-[#FAF8F3] hover:bg-[#F0ECE2] text-[#3D372D] transition shadow-2xs font-medium"
                      >
                        Inspect Manuscript
                      </button>

                      {/* Explicit Mid-Transit / In-Flight Burn Button */}
                      {(isInTransit || isDelivered) && !isBurned && (
                        <button
                          onClick={() => handleBurnMessage(msg)}
                          disabled={burningId === msg.id}
                          className="text-xs px-3 py-1.5 rounded-lg border border-red-300 bg-red-50 hover:bg-red-100 text-red-800 transition shadow-2xs font-medium flex items-center gap-1.5"
                          title="Auto-delete message even before runner completes delivery"
                        >
                          <Flame className="w-3.5 h-3.5 text-red-600" />
                          <span>{isInTransit ? 'Burn In-Flight' : 'Burn Now'}</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Route & Progress visualization */}
                  <div className="bg-[#FAF8F3] p-3.5 rounded-xl border border-[#E8E2D5] space-y-3 radar-grid">
                    {/* Progress Bar with Runner Icon */}
                    <div className="relative pt-4 pb-2">
                      <div className="w-full h-2 bg-[#E2DBD0] rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-500 ${
                            isBurned
                              ? 'bg-red-700'
                              : isDelivered
                              ? 'bg-blue-600'
                              : 'bg-[#2A6352]'
                          }`}
                          style={{ width: `${msg.progressPercent}%` }}
                        />
                      </div>

                      {/* Runner Marker */}
                      {isInTransit && (
                        <div
                          className="absolute -top-1 transform -translate-x-1/2 flex flex-col items-center pointer-events-none transition-all duration-500"
                          style={{ left: `${Math.max(4, Math.min(96, msg.progressPercent))}%` }}
                        >
                          <div className="px-1.5 py-0.5 bg-[#1C1F26] text-amber-200 text-[9px] font-mono-code rounded shadow-sm whitespace-nowrap">
                            🏃 {msg.effectiveSpeedKmH} km/h
                          </div>
                          <div className="w-2 h-2 bg-[#1C1F26] rotate-45 -mt-1" />
                        </div>
                      )}
                    </div>

                    {/* Telemetry numbers */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs pt-1">
                      <div className="bg-white/80 p-2 rounded-lg border border-[#E4DEC9]">
                        <span className="text-[10px] text-[#7A7163] block">Runner Speed</span>
                        <span className="font-mono-code font-bold text-[#1C1F26]">
                          {msg.effectiveSpeedKmH} km/h{' '}
                          <span className="text-[10px] text-[#8C8375] font-normal">
                            (Base: {msg.runnerSpeedKmH})
                          </span>
                        </span>
                      </div>

                      <div className="bg-white/80 p-2 rounded-lg border border-[#E4DEC9]">
                        <span className="text-[10px] text-[#7A7163] block">Distance Traversed</span>
                        <span className="font-mono-code font-bold text-[#1C1F26]">
                          {kmTraversed} / {msg.distanceKm} km
                        </span>
                      </div>

                      <div className="bg-white/80 p-2 rounded-lg border border-[#E4DEC9]">
                        <span className="text-[10px] text-[#7A7163] block">Remaining Distance</span>
                        <span className="font-mono-code font-bold text-amber-900">
                          {kmRemaining} km
                        </span>
                      </div>

                      <div className="bg-white/80 p-2 rounded-lg border border-[#E4DEC9]">
                        <span className="text-[10px] text-[#7A7163] block">Terrain &amp; Weather</span>
                        <span className="text-[#3E382E] capitalize font-medium">
                          {msg.terrain.replace('_', ' ')} • {msg.weather.replace('_', ' ')}
                        </span>
                      </div>
                    </div>

                    {/* Waypoints passed */}
                    {msg.waypoints && msg.waypoints.length > 0 && (
                      <div className="pt-2 border-t border-[#EAE4D8]">
                        <span className="text-[10px] font-mono-code uppercase text-[#7A7163] block mb-1.5">
                          Corridor Waypoint Outposts:
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {msg.waypoints.map((wp, idx) => (
                            <span
                              key={idx}
                              className={`text-[11px] px-2 py-0.5 rounded flex items-center gap-1 border ${
                                wp.passed
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300 font-medium'
                                  : 'bg-white text-[#7A7163] border-[#DDD6C8]'
                              }`}
                            >
                              <CheckCircle2 className={`w-3 h-3 ${wp.passed ? 'text-emerald-600' : 'text-[#C5BEAF]'}`} />
                              {wp.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Burn confirmation note if burned */}
                    {isBurned && (
                      <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-900 flex items-start gap-2">
                        <Flame className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold block">Cryptographic Ephemeral Destruction Executed</span>
                          <span className="text-[11px]">{msg.burnReason}</span>
                          <span className="block text-[10px] font-mono-code text-red-700 mt-0.5">
                            Burned At: {new Date(msg.burnedAt || '').toLocaleString()}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
