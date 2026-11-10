import React, { useState } from 'react';
import { Message, User } from '../types';
import {
  Feather,
  Flame,
  Lock,
  Calendar,
  User as UserIcon,
  ShieldCheck,
  FileText,
  Printer,
  X,
  ExternalLink,
} from 'lucide-react';

interface MailVaultProps {
  messages: Message[];
  currentUser: User;
  selectedMessage: Message | null;
  onSelectMessage: (msg: Message | null) => void;
  onBurnMessage: (msg: Message) => void;
}

export const MailVault: React.FC<MailVaultProps> = ({
  messages,
  currentUser,
  selectedMessage,
  onSelectMessage,
  onBurnMessage,
}) => {
  const [tab, setTab] = useState<'all' | 'received' | 'sent'>('all');

  const filtered = messages.filter((m) => {
    if (tab === 'received') return m.recipientId === currentUser.id;
    if (tab === 'sent') return m.senderId === currentUser.id;
    return true;
  });

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header banner */}
      <div className="bg-[#FAF8F3] border border-[#E4DEC9] rounded-xl p-4 shadow-2xs flex items-center justify-between">
        <div>
          <h2 className="text-lg font-serif-royal font-semibold text-[#1C1F26] flex items-center gap-2">
            <Feather className="w-5 h-5 text-indigo-900" />
            <span>Royal Manuscript Vault &amp; Ephemeral Archive</span>
          </h2>
          <p className="text-xs text-[#6F675A] mt-0.5">
            Inspected letters, delivery certificates, and zero-knowledge destruction logs.
          </p>
        </div>

        <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-[#DDD6C8]">
          <button
            onClick={() => setTab('all')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition ${
              tab === 'all'
                ? 'bg-[#1C1F26] text-[#FAF8F3]'
                : 'text-[#6F675A] hover:text-[#1C1F26]'
            }`}
          >
            All Archive
          </button>
          <button
            onClick={() => setTab('received')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition ${
              tab === 'received'
                ? 'bg-[#1C1F26] text-[#FAF8F3]'
                : 'text-[#6F675A] hover:text-[#1C1F26]'
            }`}
          >
            Received for {currentUser.name}
          </button>
          <button
            onClick={() => setTab('sent')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition ${
              tab === 'sent'
                ? 'bg-[#1C1F26] text-[#FAF8F3]'
                : 'text-[#6F675A] hover:text-[#1C1F26]'
            }`}
          >
            Sent by {currentUser.name}
          </button>
        </div>
      </div>

      {/* Grid of Vault Documents */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((msg) => {
          const isBurned = msg.status.startsWith('BURNED');
          const isDelivered = msg.status === 'DELIVERED';
          const isInTransit = msg.status === 'IN_TRANSIT';

          return (
            <div
              key={msg.id}
              onClick={() => onSelectMessage(msg)}
              className="bg-white border border-[#DDD6C8] hover:border-[#BFAF95] rounded-xl p-4 shadow-2xs cursor-pointer transition flex flex-col justify-between space-y-3"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono-code font-bold text-[#1C1F26]">{msg.id}</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-mono-code px-2 py-0.5 rounded bg-[#EDE8DE] text-[#4F473A]">
                      {msg.pageFormat.replace('_', '-')}
                    </span>
                    {isBurned ? (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-red-50 text-red-700 border border-red-200 flex items-center gap-1">
                        <Flame className="w-3 h-3 text-red-600" />
                        SHREDDED
                      </span>
                    ) : isDelivered ? (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                        DELIVERED
                      </span>
                    ) : (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                        IN FLIGHT ({msg.progressPercent}%)
                      </span>
                    )}
                  </div>
                </div>

                <h3 className="font-serif-royal font-semibold text-base text-[#1C1F26] line-clamp-1">
                  {msg.title}
                </h3>

                <p className="text-xs text-[#6F675A] line-clamp-2 italic font-serif-royal">
                  {isBurned
                    ? '[Plaintext destroyed by ephemeral auto-deletion protocol]'
                    : msg.body}
                </p>
              </div>

              <div className="pt-2 border-t border-[#F0ECE2] flex items-center justify-between text-[11px] text-[#7A7163]">
                <div className="flex items-center gap-1.5 truncate max-w-[200px]">
                  <span>From: {msg.senderName}</span>
                </div>
                <div className="flex items-center gap-1 font-mono-code">
                  <Calendar className="w-3 h-3 text-[#A89F90]" />
                  <span>{new Date(msg.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Manuscript Modal / Document Viewer */}
      {selectedMessage && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-[#FAF8F3] border border-[#DDD6C8] rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-in fade-in zoom-in-95">
            {/* Modal Header */}
            <div className="sticky top-0 bg-[#F0EBE0] px-5 py-3 border-b border-[#E0DACD] flex items-center justify-between z-10">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full wax-seal flex items-center justify-center text-[10px] text-amber-100 font-bold">
                  RP
                </div>
                <span className="font-mono-code font-bold text-xs text-[#1C1F26]">
                  {selectedMessage.id} • {selectedMessage.pageFormat.replace('_', '-')} Manuscript
                </span>
              </div>
              <button
                onClick={() => onSelectMessage(null)}
                className="p-1.5 rounded-lg hover:bg-[#E2DBD0] text-[#6F675A] transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Document Body */}
            <div className="p-6 space-y-6">
              {/* Ephemeral Shred Notice if burned */}
              {selectedMessage.status.startsWith('BURNED') ? (
                <div className="bg-red-50 border-2 border-red-200 rounded-xl p-5 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto shadow-xs">
                    <Flame className="w-6 h-6" />
                  </div>
                  <h3 className="font-serif-royal font-bold text-lg text-red-900">
                    Certificate of Ephemeral Destruction
                  </h3>
                  <p className="text-xs text-red-800 max-w-md mx-auto leading-relaxed">
                    Per the <strong>runnerPost Human Latency Network</strong> security policy, all plaintext for this {selectedMessage.pageFormat.replace('_', '-')} dispatch has been automatically purged and zeroized from the flat text database.
                  </p>
                  <div className="bg-white/80 p-3 rounded-lg border border-red-200 text-left text-xs font-mono-code text-red-950 space-y-1">
                    <div>Status: {selectedMessage.status}</div>
                    <div>Reason: {selectedMessage.burnReason}</div>
                    <div>Burn Timestamp: {selectedMessage.burnedAt}</div>
                    <div>Crypto Digest: {selectedMessage.digitalSignature}</div>
                    <div>Algorithm: {selectedMessage.encryptionStandard}</div>
                  </div>
                </div>
              ) : (
                /* Intact Manuscript View (1-A4 or 2-A4) */
                <div className="parchment-sheet rounded-xl p-8 border border-[#E4DEC9] shadow-inner space-y-6">
                  {/* Epistle Title */}
                  <div className="text-center pb-4 border-b border-[#EAE4D5] space-y-2">
                    <span className="text-[10px] font-mono-code uppercase tracking-widest text-[#7A7163]">
                      Official Royal Foot-Courier Dispatch
                    </span>
                    <h2 className="text-2xl font-serif-royal font-bold text-[#1C1F26]">
                      {selectedMessage.title}
                    </h2>
                    <div className="text-xs text-[#6F675A] font-serif-royal italic">
                      Dispatched from {selectedMessage.originLocation.name} to {selectedMessage.targetLocation.name}
                    </div>
                  </div>

                  {/* Body text with manuscript lines */}
                  <div className="font-serif-royal text-sm text-[#1C1F26] leading-loose whitespace-pre-line manuscript-lines">
                    {selectedMessage.body}
                  </div>

                  {/* Page indicator & Wax Seal */}
                  <div className="pt-6 border-t border-[#EAE4D5] flex items-center justify-between text-xs text-[#6F675A]">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full wax-seal flex items-center justify-center text-xs text-amber-100 font-bold shadow-md">
                        256
                      </div>
                      <div>
                        <span className="block font-medium text-[#1C1F26]">Signed: {selectedMessage.senderName}</span>
                        <span className="text-[10px] font-mono-code text-[#7A7163]">{selectedMessage.digitalSignature}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-mono-code text-[11px] block">
                        Format: {selectedMessage.pageFormat.replace('_', '-')}
                      </span>
                      <span className="text-[10px] text-[#7A7163]">
                        {selectedMessage.originalWordCount} Words • {selectedMessage.originalCharCount} Chars
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-2">
                <span className="text-xs text-[#7A7163] flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-amber-700" />
                  Verified Zero-Knowledge Transmission
                </span>

                {!selectedMessage.status.startsWith('BURNED') && (
                  <button
                    onClick={() => {
                      onBurnMessage(selectedMessage);
                      onSelectMessage(null);
                    }}
                    className="text-xs px-3.5 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-800 border border-red-300 font-medium flex items-center gap-1.5 transition shadow-2xs"
                  >
                    <Flame className="w-4 h-4 text-red-600" />
                    <span>Execute Ephemeral Shredding Now</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
