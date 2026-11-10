import React, { useState } from 'react';
import { User } from '../types';
import {
  Shield,
  Feather,
  Compass,
  Scroll,
  Activity,
  Sliders,
  UserCheck,
  ChevronDown,
  Lock,
  Flame,
  Radio,
} from 'lucide-react';

interface HeaderProps {
  currentUser: User;
  allUsers: User[];
  onSwitchUser: (userId: string) => void;
  activeTab: 'compose' | 'couriers' | 'vault' | 'logs' | 'admin' | 'bird';
  setActiveTab: (tab: 'compose' | 'couriers' | 'vault' | 'logs' | 'admin' | 'bird') => void;
  inTransitCount: number;
  burnedCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  allUsers,
  onSwitchUser,
  activeTab,
  setActiveTab,
  inTransitCount,
  burnedCount,
}) => {
  const [showPersonaMenu, setShowPersonaMenu] = useState(false);

  const getRoleBadge = (role: User['role']) => {
    switch (role) {
      case 'admin':
        return { label: 'Grand Provost / Admin', color: 'text-amber-800 bg-amber-100/70 border-amber-300' };
      case 'courier_sender':
        return { label: 'Courier Sender', color: 'text-emerald-800 bg-emerald-100/70 border-emerald-300' };
      case 'citizen_recipient':
        return { label: 'Recipient Citizen', color: 'text-sky-800 bg-sky-100/70 border-sky-300' };
    }
  };

  const roleInfo = getRoleBadge(currentUser.role);

  return (
    <header className="border-b border-[#E6E1D6] bg-[#FCFBF7] sticky top-0 z-40 shadow-xs">
      {/* Top Banner Notice */}
      <div className="bg-[#1C1F26] text-[#E5E0D5] px-4 py-1.5 text-xs flex items-center justify-between font-mono-code">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-[#E0B253]">
            <Lock className="w-3.5 h-3.5" />
            AES-256 ZERO-KNOWLEDGE
          </span>
          <span className="hidden sm:inline text-neutral-500">|</span>
          <span className="hidden sm:inline text-neutral-300">
            Human Latency Network (8.0–12.0 km/h)
          </span>
        </div>
        <div className="flex items-center gap-4 text-[11px]">
          <span className="flex items-center gap-1 text-emerald-400">
            <Radio className="w-3 h-3 animate-pulse" />
            {inTransitCount} In Flight
          </span>
          <span className="flex items-center gap-1 text-red-400">
            <Flame className="w-3 h-3" />
            {burnedCount} Ephemeral Purges
          </span>
        </div>
      </div>

      {/* Main Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Brand identity */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg wax-seal flex items-center justify-center text-amber-200 shadow-sm shrink-0">
            <Feather className="w-5 h-5 text-amber-100" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-display font-bold text-2xl tracking-wider text-[#1C1F26]">
                runnerPost
              </span>
              <span className="text-[11px] font-mono-code uppercase px-2 py-0.5 rounded bg-[#EDE8DE] text-[#554E44] border border-[#DDD6C8]">
                v2.6 Operational
              </span>
            </div>
            <p className="text-xs text-[#6F675A] font-serif-royal italic">
              Slow tech royal foot-messenger protocol &amp; auto-ephemeral manuscript delivery
            </p>
          </div>
        </div>

        {/* Identity & User Switcher */}
        <div className="relative">
          <button
            onClick={() => setShowPersonaMenu(!showPersonaMenu)}
            className="flex items-center gap-3 px-3 py-1.5 rounded-lg border border-[#DDD6C8] bg-white hover:bg-[#FAF9F5] transition text-left shadow-2xs"
          >
            <div className="w-8 h-8 rounded-full bg-[#EAE5DA] text-[#443E35] flex items-center justify-center font-bold text-xs uppercase border border-[#D5CFC2]">
              {currentUser.name.charAt(0)}
            </div>
            <div className="text-xs">
              <div className="flex items-center gap-1.5 font-medium text-[#1C1F26]">
                <span>{currentUser.name}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded border ${roleInfo.color}`}>
                  {currentUser.role === 'admin' ? 'ADMIN' : currentUser.role === 'courier_sender' ? 'SENDER' : 'RECIPIENT'}
                </span>
              </div>
              <p className="text-[11px] text-[#7A7264] truncate max-w-[190px]">
                {currentUser.stationName}
              </p>
            </div>
            <ChevronDown className="w-4 h-4 text-[#7A7264]" />
          </button>

          {/* Persona Menu Dropdown */}
          {showPersonaMenu && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-[#DDD6C8] p-3 z-50 animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#EAE5DA]">
                <span className="text-xs font-semibold text-[#554E44] uppercase tracking-wide">
                  Switch Active Persona
                </span>
                <span className="text-[10px] text-[#8C8375] font-mono-code">Text-DB Auth</span>
              </div>
              <div className="space-y-1 max-h-64 overflow-y-auto">
                {allUsers.map((u) => {
                  const isCurrent = u.id === currentUser.id;
                  const isSuspended = u.status === 'suspended';
                  return (
                    <button
                      key={u.id}
                      onClick={() => {
                        onSwitchUser(u.id);
                        setShowPersonaMenu(false);
                      }}
                      className={`w-full text-left p-2 rounded-lg text-xs flex items-center justify-between transition ${
                        isCurrent
                          ? 'bg-[#F2ECE1] text-[#1C1F26] font-semibold'
                          : 'hover:bg-[#FAF8F3] text-[#4F483D]'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span>{u.name}</span>
                          {isSuspended && (
                            <span className="text-[9px] bg-red-100 text-red-700 px-1 rounded">
                              SUSPENDED
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-[#7E7567] block truncate max-w-[210px]">
                          {u.stationName}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono-code uppercase text-[#8C8375]">
                        {u.role.replace('citizen_', '').replace('courier_', '')}
                      </span>
                    </button>
                  );
                })}
              </div>
              <div className="mt-2 pt-2 border-t border-[#EAE5DA] text-[11px] text-[#7A7264] flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Seamless switching for simulation testing</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Navigation tabs */}
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center gap-1 overflow-x-auto no-scrollbar border-t border-[#EFECE4] py-1 text-xs">
        <button
          onClick={() => setActiveTab('compose')}
          className={`flex items-center gap-2 px-3.5 py-2 font-medium transition rounded-md ${
            activeTab === 'compose'
              ? 'bg-[#EAE4D8] text-[#1C1F26] shadow-2xs'
              : 'text-[#6F675A] hover:text-[#1C1F26] hover:bg-[#F3EFE7]'
          }`}
        >
          <Scroll className="w-4 h-4 text-amber-800" />
          <span>Dispatch Manuscript</span>
        </button>

        <button
          onClick={() => setActiveTab('couriers')}
          className={`flex items-center gap-2 px-3.5 py-2 font-medium transition rounded-md ${
            activeTab === 'couriers'
              ? 'bg-[#EAE4D8] text-[#1C1F26] shadow-2xs'
              : 'text-[#6F675A] hover:text-[#1C1F26] hover:bg-[#F3EFE7]'
          }`}
        >
          <Compass className="w-4 h-4 text-emerald-800" />
          <span>Runner Radar &amp; Telemetry</span>
          {inTransitCount > 0 && (
            <span className="text-[10px] bg-emerald-700 text-white rounded-full px-1.5 py-0.2">
              {inTransitCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('vault')}
          className={`flex items-center gap-2 px-3.5 py-2 font-medium transition rounded-md ${
            activeTab === 'vault'
              ? 'bg-[#EAE4D8] text-[#1C1F26] shadow-2xs'
              : 'text-[#6F675A] hover:text-[#1C1F26] hover:bg-[#F3EFE7]'
          }`}
        >
          <Feather className="w-4 h-4 text-indigo-800" />
          <span>Royal Vault / Letters</span>
        </button>

        <button
          onClick={() => setActiveTab('logs')}
          className={`flex items-center gap-2 px-3.5 py-2 font-medium transition rounded-md ${
            activeTab === 'logs'
              ? 'bg-[#EAE4D8] text-[#1C1F26] shadow-2xs'
              : 'text-[#6F675A] hover:text-[#1C1F26] hover:bg-[#F3EFE7]'
          }`}
        >
          <Activity className="w-4 h-4 text-blue-800" />
          <span>Activity Log (.txt)</span>
        </button>

        <button
          onClick={() => setActiveTab('admin')}
          className={`flex items-center gap-2 px-3.5 py-2 font-medium transition rounded-md ${
            activeTab === 'admin'
              ? 'bg-[#EAE4D8] text-[#1C1F26] shadow-2xs'
              : 'text-[#6F675A] hover:text-[#1C1F26] hover:bg-[#F3EFE7]'
          }`}
        >
          <Shield className="w-4 h-4 text-red-800" />
          <span>Admin Security Control</span>
        </button>

        <button
          onClick={() => setActiveTab('bird')}
          className={`flex items-center gap-2 px-3.5 py-2 font-medium transition rounded-md ${
            activeTab === 'bird'
              ? 'bg-[#EAE4D8] text-[#1C1F26] shadow-2xs'
              : 'text-[#6F675A] hover:text-[#1C1F26] hover:bg-[#F3EFE7]'
          }`}
        >
          <Sliders className="w-4 h-4 text-purple-800" />
          <span>Bird API Gateway</span>
        </button>
      </nav>
    </header>
  );
};
