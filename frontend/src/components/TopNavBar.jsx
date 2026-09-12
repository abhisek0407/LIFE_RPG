import React, { useState, useRef, useEffect } from "react";
import {
  Brain,
  HeartPulse,
  Sparkles,
  Coins,
  Flame,
  UserCircle2,
  Volume2,
  VolumeX,
  Sun,
  Moon,
  LogOut,
  User,
  Settings,
  ChevronDown,
  Shield,
} from "lucide-react";
import { DOMAINS, getStreakMultiplier } from "../services/rpgEngine";

export default function TopNavBar({
  user,
  onDomainClick,
  onLogout,
  theme,
  setTheme,
  soundEnabled,
  setSoundEnabled,
  onOpenStreakModal,
  onOpenPersonaTab,
}) {
  const { domains, character, streak, email, username } = user;
  const streakMultiplier = getStreakMultiplier(streak?.currentStreak || 1);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const domainList = [
    {
      key: "mental",
      config: DOMAINS.mental,
      data: domains?.mental || { level: 1, currentXp: 0, xpToNextLevel: 100 },
    },
    {
      key: "health",
      config: DOMAINS.health,
      data: domains?.health || { level: 1, currentXp: 0, xpToNextLevel: 100 },
    },
    {
      key: "skill",
      config: DOMAINS.skill,
      data: domains?.skill || { level: 1, currentXp: 0, xpToNextLevel: 100 },
    },
  ];

  const avatarUrl = character?.avatarUrl || null;
  const displayEmail = email || user?.email || "adventurer@lrpg.app";
  const displayName = username || character?.name || "Adventurer";
  const overallLevel = character?.overallLevel || character?.level || 1;

  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    if (dropdownOpen) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [dropdownOpen]);

  return (
    <header className="sticky top-0 z-30 w-full bg-white/95 dark:bg-rpg-dark/95 backdrop-blur-md border-b border-slate-200 dark:border-rpg-border px-3 sm:px-4 lg:px-6 py-2 sm:py-2.5 shadow-sm dark:shadow-md transition-colors duration-200">
      <div className="flex items-center gap-2 sm:gap-4">
        {/* ── LEFT: Gold + Streak ── */}

        {/* Mobile: horizontal compact pills */}
        <div className="flex sm:hidden items-center gap-1.5 shrink-0">
          <div className="flex items-center gap-1 px-2 py-1.5 rounded-xl bg-slate-100 dark:bg-rpg-card/80 border border-slate-200 dark:border-rpg-border">
            <Coins className="w-3 h-3 text-amber-500 fill-amber-500 shrink-0" />
            <span className="font-mono font-bold text-[11px] text-amber-700 dark:text-amber-300">
              {character?.gold ?? 0}
            </span>
          </div>
          <button
            type="button"
            onClick={() => onOpenStreakModal && onOpenStreakModal()}
            className="flex items-center gap-1 px-2 py-1.5 rounded-xl bg-slate-100 dark:bg-rpg-card/80 border border-slate-200 dark:border-rpg-border"
          >
            <Flame className="w-3 h-3 text-orange-500 fill-orange-500 shrink-0 animate-pulse" />
            <span className="font-mono font-bold text-[11px] text-orange-700 dark:text-orange-300">
              {streak?.currentStreak ?? 1}
            </span>
            <span className="text-[9px] font-mono font-bold px-1 py-0.5 rounded bg-orange-200 dark:bg-orange-500/20 text-orange-800 dark:text-orange-200">
              {streakMultiplier}x
            </span>
          </button>
        </div>

        {/* Desktop: stacked card */}
        <div className="hidden sm:flex flex-col shrink-0 min-w-[96px] bg-slate-100 dark:bg-rpg-card/80 border border-slate-200 dark:border-rpg-border rounded-2xl px-3.5 py-2.5 gap-2.5">
          <div className="flex items-center gap-2">
            <Coins className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400 fill-amber-500 dark:fill-amber-400 shrink-0" />
            <span className="font-mono font-bold text-xs text-amber-700 dark:text-amber-300 leading-none">
              {character?.gold ?? 0}
            </span>
            <span className="text-[10px] uppercase text-amber-600/80 dark:text-amber-400/70 font-semibold leading-none tracking-wide">
              Gold
            </span>
          </div>
          <div className="w-full h-px bg-slate-200 dark:bg-rpg-border" />
          <button
            type="button"
            onClick={() => onOpenStreakModal && onOpenStreakModal()}
            className="flex items-center gap-2 text-left hover:opacity-85 transition-opacity"
            title="View Daily Streak Status"
          >
            <Flame className="w-3.5 h-3.5 text-orange-500 dark:text-orange-400 fill-orange-500 dark:fill-orange-400 shrink-0 animate-pulse" />
            <span className="font-mono font-bold text-xs text-orange-700 dark:text-orange-300 leading-none">
              {streak?.currentStreak ?? 1}
            </span>
            <span className="text-[10px] text-orange-600/80 dark:text-orange-400/70 font-semibold leading-none">
              Streak
            </span>
            <span className="text-[9px] font-mono font-bold px-1 py-0.5 rounded bg-orange-200 dark:bg-orange-500/20 text-orange-800 dark:text-orange-200 leading-none ml-auto">
              {streakMultiplier}x
            </span>
          </button>
        </div>

        {/* ── MIDDLE: Domain bars — hidden on mobile ── */}
        <div className="hidden sm:grid grid-cols-3 gap-2.5 sm:gap-3 flex-1 max-w-xl mx-auto">
          {domainList.map(({ key, config, data }) => {
            const pct = Math.min(
              100,
              Math.round(
                (data.currentXp / Math.max(1, data.xpToNextLevel)) * 100,
              ),
            );
            const Icon =
              key === "mental"
                ? Brain
                : key === "health"
                  ? HeartPulse
                  : Sparkles;
            return (
              <div
                key={key}
                onClick={() => onDomainClick && onDomainClick(key)}
                className={`relative group cursor-pointer p-2.5 rounded-xl border transition-all duration-200 bg-slate-50 dark:bg-rpg-card/90 shadow-sm hover:shadow-md ${
                  key === "mental"
                    ? "border-cyan-300 dark:border-cyan-500/30 hover:border-cyan-400 dark:hover:border-cyan-400/60"
                    : key === "health"
                      ? "border-emerald-300 dark:border-emerald-500/30 hover:border-emerald-400 dark:hover:border-emerald-400/60"
                      : "border-purple-300 dark:border-purple-500/30 hover:border-purple-400 dark:hover:border-purple-400/60"
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <div
                      className="p-1 rounded shrink-0"
                      style={{ color: config.color }}
                    >
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-[11px] sm:text-xs font-semibold text-slate-700 dark:text-slate-200 truncate">
                      {key === "skill" ? "Skill XP" : config.name}
                    </span>
                  </div>
                  <span
                    className="text-[10px] font-bold px-1.5 py-0.5 rounded font-mono shrink-0 ml-1"
                    style={{
                      backgroundColor: `${config.color}22`,
                      color: config.color,
                    }}
                  >
                    Lv.{data.level}
                  </span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-800/80 rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500 ease-out"
                    style={{
                      width: `${pct}%`,
                      backgroundColor: config.color,
                      boxShadow: `0 0 6px ${config.color}70`,
                    }}
                  />
                </div>
                <div className="flex justify-between mt-1 text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                  <span>{data.currentXp} XP</span>
                  <span>{data.xpToNextLevel} XP</span>
                </div>
                <div className="hidden group-hover:block absolute top-full left-0 mt-2 z-40 w-52 p-2.5 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-300 text-xs rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 pointer-events-none">
                  <p className="font-semibold text-slate-900 dark:text-white mb-0.5">
                    {config.subtitle}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {config.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Mobile: centred app title */}
        <div className="flex sm:hidden flex-1 justify-center pointer-events-none">
          <span className="font-heading font-bold text-base text-slate-900 dark:text-white tracking-wide">
            Life<span className="text-cyan-500 dark:text-cyan-400">RPG</span>
          </span>
        </div>

        {/* ── RIGHT: Avatar + Dropdown ── */}
        <div className="relative shrink-0" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen((v) => !v)}
            className="flex items-center gap-2 sm:gap-2.5 pl-1.5 sm:pl-2.5 pr-1.5 sm:pr-2 py-1 sm:py-1.5 rounded-2xl bg-slate-100 dark:bg-rpg-card/80 border border-slate-200 dark:border-rpg-border hover:border-cyan-400 dark:hover:border-cyan-500/60 transition-all"
          >
            {/* Avatar */}
            <div className="relative">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={displayName}
                  className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover border-2 border-cyan-400/60 dark:border-cyan-500/50"
                />
              ) : (
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-cyan-400 to-indigo-500 flex items-center justify-center border-2 border-cyan-400/50 dark:border-cyan-500/40">
                  <UserCircle2 className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
              )}
              <span className="absolute bottom-0 right-0 w-2 h-2 sm:w-2.5 sm:h-2.5 bg-emerald-400 rounded-full border-2 border-white dark:border-rpg-dark" />
            </div>

            {/* Name — hidden on mobile */}
            <div className="hidden sm:flex flex-col items-start leading-tight">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate max-w-[100px]">
                {displayName}
              </span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono truncate max-w-[120px]">
                {displayEmail}
              </span>
            </div>

            <ChevronDown
              className={`w-3.5 h-3.5 text-slate-400 dark:text-slate-500 transition-transform duration-200 ${dropdownOpen ? "rotate-180" : ""}`}
            />
          </button>

          {/* Dropdown — full-width on mobile, fixed-width on desktop */}
          {dropdownOpen && (
            <div className="absolute right-0 top-full mt-2 w-[calc(100vw-24px)] max-w-xs sm:w-64 bg-white dark:bg-rpg-dark rounded-2xl border border-slate-200 dark:border-rpg-border shadow-2xl dark:shadow-black/50 overflow-hidden z-50">
              {/* Profile header */}
              <div className="px-4 py-3.5 bg-gradient-to-r from-cyan-50 to-indigo-50 dark:from-cyan-950/40 dark:to-indigo-950/40 border-b border-slate-200 dark:border-rpg-border">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    {avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt={displayName}
                        className="w-10 h-10 rounded-full object-cover border-2 border-cyan-400/60"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400 to-indigo-500 flex items-center justify-center border-2 border-cyan-400/50">
                        <UserCircle2 className="w-6 h-6 text-white" />
                      </div>
                    )}
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-white dark:border-rpg-dark" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-sm text-slate-900 dark:text-white truncate">
                      {displayName}
                    </p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono truncate">
                      {displayEmail}
                    </p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border border-cyan-300 dark:border-cyan-500/30 font-mono">
                        Lv.{overallLevel}
                      </span>
                      <span className="text-[10px] font-mono text-amber-600 dark:text-amber-400 flex items-center gap-0.5">
                        <Coins className="w-3 h-3 fill-amber-500 dark:fill-amber-400 text-amber-500" />
                        {character?.gold ?? 0} Gold
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Profile section */}
              <div className="px-2 py-2 border-b border-slate-100 dark:border-rpg-border">
                <p className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                  <User className="w-3 h-3" /> Profile
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setDropdownOpen(false);
                    if (onOpenPersonaTab) onOpenPersonaTab();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left hover:bg-slate-100 dark:hover:bg-rpg-card transition-colors"
                >
                  <Shield className="w-4 h-4 text-cyan-500 dark:text-cyan-400 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                      Character & Persona
                    </p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono truncate">
                      {character?.title || "Novice Adventurer"}
                    </p>
                  </div>
                </button>
              </div>

              {/* Settings section */}
              <div className="px-2 py-2 border-b border-slate-100 dark:border-rpg-border">
                <p className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                  <Settings className="w-3 h-3" /> Settings
                </p>
                {/* Sound */}
                <div className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-rpg-card transition-colors">
                  <div className="flex items-center gap-2.5">
                    {soundEnabled ? (
                      <Volume2 className="w-4 h-4 text-slate-500 dark:text-slate-400 shrink-0" />
                    ) : (
                      <VolumeX className="w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0" />
                    )}
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Sound FX
                    </span>
                  </div>
                  <button
                    onClick={() => setSoundEnabled((v) => !v)}
                    className={`relative w-10 h-5 rounded-full transition-colors duration-200 ${soundEnabled ? "bg-cyan-500" : "bg-slate-300 dark:bg-slate-700"}`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${soundEnabled ? "translate-x-5" : "translate-x-0"}`}
                    />
                  </button>
                </div>
                {/* Theme */}
                <div className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-rpg-card transition-colors">
                  <div className="flex items-center gap-2.5">
                    {theme === "dark" ? (
                      <Moon className="w-4 h-4 text-indigo-400 shrink-0" />
                    ) : (
                      <Sun className="w-4 h-4 text-amber-500 shrink-0" />
                    )}
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      {theme === "dark" ? "Dark Mode" : "Light Mode"}
                    </span>
                  </div>
                  <button
                    onClick={() =>
                      setTheme((t) => (t === "dark" ? "light" : "dark"))
                    }
                    className={`relative w-10 h-5 rounded-full transition-colors duration-200 ${theme === "dark" ? "bg-indigo-500" : "bg-slate-300"}`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${theme === "dark" ? "translate-x-5" : "translate-x-0"}`}
                    />
                  </button>
                </div>
              </div>

              {/* Logout */}
              <div className="px-2 py-2">
                <button
                  type="button"
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                  onClick={async () => {
                    setDropdownOpen(false);

                    if (onLogout) {
                      await onLogout();
                    }
                  }}
                >
                  <LogOut className="w-4 h-4 text-red-400 shrink-0" />
                  <span className="text-xs font-semibold text-red-600 dark:text-red-400">
                    Log Out
                  </span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
