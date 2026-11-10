import React, { useState } from 'react';
import { User } from '../types';
import {
  Send,
  Lock,
  Flame,
  Gauge,
  MapPin,
  Mountain,
  CloudSun,
  ShieldAlert,
  FileText,
  Sparkles,
  Info,
} from 'lucide-react';

interface ComposeDispatchProps {
  currentUser: User;
  allUsers: User[];
  onDispatchSuccess: () => void;
}

export const ComposeDispatch: React.FC<ComposeDispatchProps> = ({
  currentUser,
  allUsers,
  onDispatchSuccess,
}) => {
  const [recipientId, setRecipientId] = useState<string>(
    allUsers.find((u) => u.id !== currentUser.id && u.role === 'citizen_recipient')?.id ||
      allUsers.find((u) => u.id !== currentUser.id)?.id ||
      ''
  );
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [pageFormat, setPageFormat] = useState<'1_A4' | '2_A4'>('1_A4');
  const [runnerSpeed, setRunnerSpeed] = useState<number>(10.2);
  const [terrain, setTerrain] = useState<'plains' | 'mountain_pass' | 'river_valley' | 'coastal_ridge'>('plains');
  const [weather, setWeather] = useState<'fair' | 'light_rain' | 'headwind' | 'night_fog'>('fair');
  const [autoDeletePolicy, setAutoDeletePolicy] = useState<'BURN_ON_DELIVERY' | 'MID_TRANSIT_TRIGGER'>('BURN_ON_DELIVERY');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Available recipients (exclude current user)
  const recipientCandidates = allUsers.filter((u) => u.id !== currentUser.id);
  const selectedRecipient = allUsers.find((u) => u.id === recipientId);

  // Calculate distance
  const calculateDistance = () => {
    if (!selectedRecipient) return 50;
    const R = 6371;
    const dLat = ((selectedRecipient.lat - currentUser.lat) * Math.PI) / 180;
    const dLon = ((selectedRecipient.lng - currentUser.lng) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((currentUser.lat * Math.PI) / 180) *
        Math.cos((selectedRecipient.lat * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c * 10) / 10;
  };

  const distanceKm = calculateDistance();

  // Terrain & Weather modifiers
  let speedModifier = 1.0;
  if (terrain === 'mountain_pass') speedModifier *= 0.82;
  if (terrain === 'river_valley') speedModifier *= 0.88;
  if (terrain === 'coastal_ridge') speedModifier *= 1.04;
  if (weather === 'light_rain') speedModifier *= 0.92;
  if (weather === 'headwind') speedModifier *= 0.88;
  if (weather === 'night_fog') speedModifier *= 0.85;

  const effectiveSpeedKmH = Math.round(runnerSpeed * speedModifier * 10) / 10;
  const transitMinutes = Math.round((distanceKm / effectiveSpeedKmH) * 60);
  const transitHours = Math.floor(transitMinutes / 60);
  const transitRemMinutes = transitMinutes % 60;

  // Limits
  const maxChars = pageFormat === '2_A4' ? 6000 : 3000;
  const charCount = body.length;
  const wordCount = body.trim().split(/\s+/).filter(Boolean).length;
  const isOverLimit = charCount > maxChars;

  // Preset templates
  const applyTemplate = (type: 'philosophical' | 'diplomatic') => {
    if (type === 'philosophical') {
      setTitle('The Solitude of the Marathon Herald & The Return to Deliberate Thought');
      setPageFormat('1_A4');
      setBody(
        `To my esteemed counterpart,\n\nI write this dispatch across the breadth of our territory, entrusting each sentence to the steady gait of our royal foot courier. In an age intoxicated by the illusion of instantaneous transmission, runnerPost reminds us of what was lost: the dignity of anticipation.\n\nWhen a courier departs carrying this single A4 parchment, sealed with military-grade 256-bit encryption, every paragraph must justify the sweat of the runner. We do not write ephemeral trivia; we compose thoughts meant to endure the long miles between stations.\n\nAnd when the messenger arrives at your gates, the ephemeral protocol will execute. The paper will be consigned to the flame, leaving only the comprehension in your mind and an immutable cryptographic entry in the realm's log.\n\nLet the silence between our letters be as eloquent as the words themselves.\n\nWith utmost regard,\n${currentUser.name}`
      );
    } else {
      setTitle('Royal Proclamation on Strategic Grain Reserves & Defensive Relays (Folio 2-A4)');
      setPageFormat('2_A4');
      setBody(
        `CONFIDENTIAL DISPATCH — FOLIO 2-A4 ROYAL COURIER TRANSMISSION\n\nSECTION I: THE SOUTHERN CORRIDOR DEFENSE LOGISTICS\nBy royal decree of the Council, courier relays between our border outposts and the central granary have been re-anchored to the Human Latency Network. Modern automated surveillance cannot intercept a runner traversing forgotten mountain ridgelines at an unhurried 10.5 km/h.\n\nSECTION II: DISPATCH INVENTORY & SECURE EPHEMERAL COMMENCEMENT\n1. Five thousand bushels of winter rye have been cached along the river valley waypoints.\n2. All cryptographic one-time pads have been synchronized per the theorems of Avian Carrier RFC 1149.\n3. Recipient is instructed to inspect the digital wax seal upon courier arrival.\n\nSECTION III: THE BURNING MANDATE\nPer the strict security protocols of runnerPost, this two-page folio will be automatically purged from the text database upon delivery confirmation. Even should this courier be halted or should the sender issue an emergency mid-transit shred order, zero recoverable plaintext shall remain in the system.\n\nAffirmed under the Grand Provost seal,\n${currentUser.name}`
      );
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (currentUser.status === 'suspended') {
      setErrorMessage('Your sender account has been suspended by the Admin Security Controller.');
      return;
    }
    if (!recipientId) {
      setErrorMessage('Please select a valid recipient station.');
      return;
    }
    if (!title.trim() || !body.trim()) {
      setErrorMessage('Please provide both a manuscript title and body text.');
      return;
    }
    if (isOverLimit) {
      setErrorMessage(`Manuscript exceeds ${pageFormat} boundary (${charCount}/${maxChars} characters). Please edit down.`);
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderId: currentUser.id,
          recipientId,
          title,
          body,
          pageFormat,
          runnerSpeedKmH: runnerSpeed,
          terrain,
          weather,
          autoDeletePolicy,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to dispatch message');
      }

      // Reset form
      setTitle('');
      setBody('');
      onDispatchSuccess();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Introduction Card */}
      <div className="bg-[#FAF8F3] border border-[#E4DEC9] rounded-xl p-5 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-serif-royal font-semibold text-[#1C1F26] flex items-center gap-2">
              <span>Compose Royal Manuscript Dispatch</span>
              <span className="text-xs font-mono-code px-2 py-0.5 rounded bg-[#E8E2D2] text-[#4F4739] border border-[#DDD6C4]">
                1-A4 &amp; 2-A4 Formats
              </span>
            </h2>
            <p className="text-xs text-[#6F675A] mt-1">
              Transmitted across physical topography at human-runner speed (8.0–12.0 km/h) under 256-bit AES Zero-Knowledge encryption.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => applyTemplate('philosophical')}
              className="text-xs px-2.5 py-1.5 rounded-lg border border-[#D5CFC0] bg-white hover:bg-[#F3EFE6] text-[#4E473B] transition flex items-center gap-1.5 shadow-2xs"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-700" />
              1-A4 Template
            </button>
            <button
              type="button"
              onClick={() => applyTemplate('diplomatic')}
              className="text-xs px-2.5 py-1.5 rounded-lg border border-[#D5CFC0] bg-white hover:bg-[#F3EFE6] text-[#4E473B] transition flex items-center gap-1.5 shadow-2xs"
            >
              <FileText className="w-3.5 h-3.5 text-amber-800" />
              2-A4 Folio Template
            </button>
          </div>
        </div>
      </div>

      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2.5">
          <ShieldAlert className="w-4 h-4 text-red-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left Column: Manuscript Drafting Canvas */}
          <div className="md:col-span-2 space-y-4">
            {/* Format Selector: 1-A4 vs 2-A4 */}
            <div className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-[#DDD6C8] shadow-2xs">
              <span className="text-xs font-semibold text-[#484236] uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-amber-800" />
                Manuscript Capacity Boundary:
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPageFormat('1_A4')}
                  className={`px-3 py-1 text-xs font-medium rounded-lg transition ${
                    pageFormat === '1_A4'
                      ? 'bg-[#1C1F26] text-[#FAF8F3] shadow-xs'
                      : 'bg-[#F2ECE1] text-[#554E44] hover:bg-[#EAE4D8]'
                  }`}
                >
                  1-A4 Sheet (3,000 Chars)
                </button>
                <button
                  type="button"
                  onClick={() => setPageFormat('2_A4')}
                  className={`px-3 py-1 text-xs font-medium rounded-lg transition ${
                    pageFormat === '2_A4'
                      ? 'bg-[#1C1F26] text-[#FAF8F3] shadow-xs'
                      : 'bg-[#F2ECE1] text-[#554E44] hover:bg-[#EAE4D8]'
                  }`}
                >
                  2-A4 Folio (6,000 Chars)
                </button>
              </div>
            </div>

            {/* Manuscript Editor Paper Simulation */}
            <div className="parchment-sheet rounded-xl overflow-hidden shadow-md">
              {/* Manuscript Header Bar */}
              <div className="bg-[#F0EBE0] px-4 py-2 border-b border-[#E2DBD0] flex items-center justify-between text-xs text-[#5D5547]">
                <div className="flex items-center gap-2 font-serif-royal italic font-medium">
                  <span>Royal Courier Epistle</span>
                  <span>•</span>
                  <span>Station: {currentUser.stationName}</span>
                </div>
                <div className="flex items-center gap-3 font-mono-code text-[11px]">
                  <span>{wordCount} Words</span>
                  <span>|</span>
                  <span className={isOverLimit ? 'text-red-600 font-bold' : 'text-[#3E382E]'}>
                    {charCount} / {maxChars} Chars
                  </span>
                </div>
              </div>

              {/* Title input */}
              <div className="p-4 border-b border-[#E8E2D5] bg-white">
                <label className="block text-[11px] font-mono-code uppercase text-[#7A7163] mb-1">
                  Proclamation Title / Subject Line
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Philosophical Reflections on Intentional Friction..."
                  className="w-full text-base font-serif-royal font-semibold text-[#1C1F26] placeholder-[#A69E90] border-none focus:outline-hidden focus:ring-0 p-0"
                />
              </div>

              {/* Body Textarea with ruled page feeling */}
              <div className="p-4 bg-white relative">
                <textarea
                  rows={pageFormat === '2_A4' ? 14 : 10}
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Inscribe your manuscript here. When this messenger departs, no instant alert will disturb the recipient until the runner crosses the terrain at 8-12 km/h..."
                  className="w-full resize-y text-sm font-serif-royal leading-relaxed text-[#1C1F26] placeholder-[#A8A092] border-none focus:outline-hidden focus:ring-0 p-0 bg-transparent manuscript-lines"
                />

                {/* Live A4 Budget Bar */}
                <div className="mt-4 pt-3 border-t border-[#EFEBE2] flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-[11px] text-[#7A7163]">
                    <span>Page Fill Budget ({pageFormat.replace('_', '-')})</span>
                    <span>{Math.round((charCount / maxChars) * 100)}% Used</span>
                  </div>
                  <div className="w-full h-1.5 bg-[#EAE5DA] rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        isOverLimit
                          ? 'bg-red-600'
                          : charCount / maxChars > 0.8
                          ? 'bg-amber-600'
                          : 'bg-[#2A6352]'
                      }`}
                      style={{ width: `${Math.min(100, (charCount / maxChars) * 100)}%` }}
                    />
                  </div>
                  {pageFormat === '2_A4' && (
                    <div className="flex justify-between text-[10px] text-[#8C8375] font-mono-code">
                      <span>Page 1 (0–3,000 chars)</span>
                      <span>Page 2 (3,001–6,000 chars)</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Cryptographic wax footer */}
              <div className="bg-[#FAF8F3] px-4 py-3 border-t border-[#E8E2D5] flex items-center justify-between text-xs text-[#5D5547]">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full wax-seal flex items-center justify-center text-[10px] text-amber-100 font-bold">
                    RP
                  </div>
                  <span className="text-[11px] font-mono-code text-[#484236]">
                    AES-256 ZERO-KNOWLEDGE DIGEST ARMED
                  </span>
                </div>
                <span className="text-[10px] font-serif-royal italic text-[#7E7567]">
                  Shred-on-arrival protocol guaranteed
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: Runner Velocity, Route, & Ephemeral Settings */}
          <div className="space-y-4">
            {/* Recipient Station Selection */}
            <div className="bg-white rounded-xl border border-[#DDD6C8] p-4 shadow-2xs space-y-3">
              <label className="text-xs font-semibold text-[#484236] uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-red-700" />
                Target Recipient &amp; Station
              </label>

              <select
                value={recipientId}
                onChange={(e) => setRecipientId(e.target.value)}
                className="w-full text-xs p-2 rounded-lg border border-[#D5CFC2] bg-[#FAF8F3] text-[#1C1F26] focus:outline-hidden focus:border-amber-700"
              >
                {recipientCandidates.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} — {r.stationName}
                  </option>
                ))}
              </select>

              {selectedRecipient && (
                <div className="p-2.5 rounded-lg bg-[#F5F2EA] border border-[#E2DBD0] text-xs text-[#554E41] space-y-1">
                  <div className="flex justify-between">
                    <span className="text-[11px] text-[#7A7163]">Haversine Distance:</span>
                    <span className="font-mono-code font-bold text-[#1C1F26]">{distanceKm} km</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[11px] text-[#7A7163]">Origin:</span>
                    <span className="truncate max-w-[150px]">{currentUser.stationName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[11px] text-[#7A7163]">Destination:</span>
                    <span className="truncate max-w-[150px]">{selectedRecipient.stationName}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Human Runner Velocity Slider (8.0 to 12.0 km/h) */}
            <div className="bg-white rounded-xl border border-[#DDD6C8] p-4 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-[#484236] uppercase tracking-wider flex items-center gap-1.5">
                  <Gauge className="w-3.5 h-3.5 text-emerald-700" />
                  Runner Pace (8.0–12.0 km/h)
                </label>
                <span className="font-mono-code text-xs font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                  {runnerSpeed.toFixed(1)} km/h
                </span>
              </div>

              <input
                type="range"
                min="8.0"
                max="12.0"
                step="0.1"
                value={runnerSpeed}
                onChange={(e) => setRunnerSpeed(parseFloat(e.target.value))}
                className="w-full accent-[#2A6352] cursor-pointer"
              />

              <div className="grid grid-cols-3 gap-1.5 pt-1">
                <button
                  type="button"
                  onClick={() => setRunnerSpeed(8.5)}
                  className={`text-[10px] py-1 px-1 rounded border transition ${
                    runnerSpeed === 8.5
                      ? 'bg-[#EAE4D8] border-[#3E382E] text-[#1C1F26] font-semibold'
                      : 'border-[#DDD6C8] text-[#6F675A] hover:bg-[#F6F4EE]'
                  }`}
                >
                  Jogging (8.5)
                </button>
                <button
                  type="button"
                  onClick={() => setRunnerSpeed(10.2)}
                  className={`text-[10px] py-1 px-1 rounded border transition ${
                    runnerSpeed === 10.2
                      ? 'bg-[#EAE4D8] border-[#3E382E] text-[#1C1F26] font-semibold'
                      : 'border-[#DDD6C8] text-[#6F675A] hover:bg-[#F6F4EE]'
                  }`}
                >
                  Standard (10.2)
                </button>
                <button
                  type="button"
                  onClick={() => setRunnerSpeed(11.8)}
                  className={`text-[10px] py-1 px-1 rounded border transition ${
                    runnerSpeed === 11.8
                      ? 'bg-[#EAE4D8] border-[#3E382E] text-[#1C1F26] font-semibold'
                      : 'border-[#DDD6C8] text-[#6F675A] hover:bg-[#F6F4EE]'
                  }`}
                >
                  Herald (11.8)
                </button>
              </div>

              {/* Terrain & Weather */}
              <div className="pt-2 border-t border-[#EFECE4] space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1 text-[#6F675A]">
                    <Mountain className="w-3.5 h-3.5 text-[#5F574A]" />
                    Terrain:
                  </span>
                  <select
                    value={terrain}
                    onChange={(e) => setTerrain(e.target.value as any)}
                    className="text-xs p-1 rounded border border-[#D5CFC2] bg-[#FAF8F3] text-[#1C1F26]"
                  >
                    <option value="plains">Plains (1.0x)</option>
                    <option value="mountain_pass">Mountain Pass (0.82x)</option>
                    <option value="river_valley">River Valley (0.88x)</option>
                    <option value="coastal_ridge">Coastal Ridge (1.04x)</option>
                  </select>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1 text-[#6F675A]">
                    <CloudSun className="w-3.5 h-3.5 text-[#5F574A]" />
                    Weather:
                  </span>
                  <select
                    value={weather}
                    onChange={(e) => setWeather(e.target.value as any)}
                    className="text-xs p-1 rounded border border-[#D5CFC2] bg-[#FAF8F3] text-[#1C1F26]"
                  >
                    <option value="fair">Fair Weather</option>
                    <option value="light_rain">Light Rain (-8%)</option>
                    <option value="headwind">Strong Headwind (-12%)</option>
                    <option value="night_fog">Night Fog (-15%)</option>
                  </select>
                </div>
              </div>

              {/* Transit calculation summary */}
              <div className="p-2.5 rounded-lg bg-[#FAF8F3] border border-[#E0DACD] text-xs space-y-1">
                <div className="flex justify-between text-[#5F574A]">
                  <span>Effective Speed:</span>
                  <span className="font-mono-code font-semibold text-[#1C1F26]">
                    {effectiveSpeedKmH} km/h
                  </span>
                </div>
                <div className="flex justify-between text-[#5F574A]">
                  <span>Calculated Latency:</span>
                  <span className="font-mono-code font-bold text-amber-900">
                    {transitHours > 0 ? `${transitHours}h ` : ''}
                    {transitRemMinutes}m
                  </span>
                </div>
              </div>
            </div>

            {/* Ephemeral Automatic Deletion Policy */}
            <div className="bg-white rounded-xl border border-[#DDD6C8] p-4 shadow-2xs space-y-3">
              <label className="text-xs font-semibold text-[#484236] uppercase tracking-wider flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-red-600" />
                Automatic Deletion Policy
              </label>

              <div className="space-y-2 text-xs">
                <label className="flex items-start gap-2 p-2 rounded-lg border border-[#E6E0D5] bg-[#FAF8F3] cursor-pointer hover:bg-[#F3EFE6]">
                  <input
                    type="radio"
                    name="autoDelete"
                    checked={autoDeletePolicy === 'BURN_ON_DELIVERY'}
                    onChange={() => setAutoDeletePolicy('BURN_ON_DELIVERY')}
                    className="mt-0.5 accent-red-700"
                  />
                  <div>
                    <span className="font-medium text-[#1C1F26] block">Burn On Delivery Arrival</span>
                    <span className="text-[11px] text-[#6F675A] block">
                      Message content is instantly shredded upon courier arrival at the recipient station.
                    </span>
                  </div>
                </label>

                <label className="flex items-start gap-2 p-2 rounded-lg border border-[#E6E0D5] bg-[#FAF8F3] cursor-pointer hover:bg-[#F3EFE6]">
                  <input
                    type="radio"
                    name="autoDelete"
                    checked={autoDeletePolicy === 'MID_TRANSIT_TRIGGER'}
                    onChange={() => setAutoDeletePolicy('MID_TRANSIT_TRIGGER')}
                    className="mt-0.5 accent-red-700"
                  />
                  <div>
                    <span className="font-medium text-[#1C1F26] block">
                      Sender In-Flight Burn Allowed
                    </span>
                    <span className="text-[11px] text-[#6F675A] block">
                      Sender can trigger instant deletion even if runner hasn&apos;t completed delivery.
                    </span>
                  </div>
                </label>
              </div>

              <div className="p-2 rounded bg-amber-50/70 border border-amber-200/80 text-[11px] text-amber-900 flex items-start gap-1.5">
                <Info className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5" />
                <span>
                  All dispatches are recorded with cryptographic proof in the flat-file database log for audit trail.
                </span>
              </div>
            </div>

            {/* Release Dispatch Button */}
            <button
              type="submit"
              disabled={isSubmitting || isOverLimit || !recipientId}
              className={`w-full py-3 px-4 rounded-xl font-medium text-xs flex items-center justify-center gap-2 transition shadow-md ${
                isSubmitting || isOverLimit || !recipientId
                  ? 'bg-neutral-300 text-neutral-500 cursor-not-allowed'
                  : 'bg-[#1C1F26] hover:bg-[#2F343E] text-[#FAF8F3]'
              }`}
            >
              <Send className="w-4 h-4 text-amber-300" />
              <span>
                {isSubmitting
                  ? 'Sealing & Releasing Runner...'
                  : `Release Courier (${pageFormat.replace('_', '-')})`}
              </span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
