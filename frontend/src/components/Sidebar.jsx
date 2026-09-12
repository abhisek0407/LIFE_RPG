import React from 'react';
import {
  Home,
  Scroll,
  CalendarDays,
  Swords,
  ShoppingBag,
  Volume2,
  VolumeX,
  Sparkles,
  Shield,
  Flame,
  Sun,
  Moon
} from 'lucide-react';
import { soundService } from '../services/soundService';

export default function Sidebar({
  activeTab,
  setActiveTab,
  user,
  soundEnabled,
  setSoundEnabled,
  activeQuestsCount,
  theme,
  setTheme
}) {
  const navItems = [
    { id: 'home',    label: 'Home',     mobileLabel: 'Home',    icon: Home },
    { id: 'quests',  label: 'Active Quests', mobileLabel: 'Quests', icon: Scroll, badge: activeQuestsCount },
    { id: 'streak',  label: 'Streak Calendar', mobileLabel: 'Streak', icon: CalendarDays, extra: `${user.streak?.currentStreak || 1}d` },
    { id: 'dailies', label: 'Daily Quests', mobileLabel: 'Dailies', icon: Swords, extra: '24h' },
    { id: 'store',   label: 'Store & Armory', mobileLabel: 'Store', icon: ShoppingBag, extra: `${user.character?.gold || 0}g` },
  ];

  const handleSoundToggle = () => {
    const newState = soundService.toggle();
    setSoundEnabled(newState);
    if (newState) soundService.playCoin();
  };

  const handleThemeToggle = () => {
    soundService.playClick();
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const handleNav = (id) => {
    soundService.playClick();
    setActiveTab(id);
  };

  return (
    <>
      {/* ─── DESKTOP LEFT SIDEBAR (hidden on mobile) ─── */}
      <aside className="hidden md:flex w-64 bg-white dark:bg-rpg-panel border-r border-slate-200 dark:border-rpg-border flex-col justify-between shrink-0 h-screen sticky top-0 transition-colors duration-200">
        {/* Brand Header */}
        <div>
          <div className="p-5 border-b border-slate-200 dark:border-rpg-border flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 via-indigo-500 to-purple-600 flex items-center justify-center shadow-glow-mental">
                <Sparkles className="w-5 h-5 text-white animate-pulse" />
              </div>
              <div>
                <h1 className="font-heading font-bold text-lg tracking-wide text-slate-900 dark:text-white flex items-center gap-1.5">
                  Life<span className="text-cyan-500 dark:text-cyan-400">RPG</span>
                </h1>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium uppercase tracking-widest">
                  Ascend // Daily
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={handleThemeToggle}
                title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                className="p-2 rounded-lg bg-slate-100 dark:bg-rpg-card hover:bg-slate-200 dark:hover:bg-rpg-cardHover text-slate-600 dark:text-slate-300 hover:text-amber-500 dark:hover:text-amber-400 transition-colors border border-slate-200 dark:border-rpg-border/60"
              >
                {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-600" />}
              </button>
              <button
                onClick={handleSoundToggle}
                title={soundEnabled ? 'Mute Sound' : 'Enable Sound'}
                className="p-2 rounded-lg bg-slate-100 dark:bg-rpg-card hover:bg-slate-200 dark:hover:bg-rpg-cardHover text-slate-600 dark:text-slate-300 hover:text-cyan-500 dark:hover:text-cyan-400 transition-colors border border-slate-200 dark:border-rpg-border/60"
              >
                {soundEnabled ? <Volume2 className="w-4 h-4 text-cyan-500 dark:text-cyan-400" /> : <VolumeX className="w-4 h-4 text-slate-400 dark:text-slate-500" />}
              </button>
            </div>
          </div>

          <nav className="p-3 space-y-1.5">
            <p className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 dark:text-slate-400 uppercase tracking-wider">
              Navigation
            </p>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNav(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-medium transition-all duration-150 ${
                    isActive
                      ? 'bg-cyan-500/10 dark:bg-gradient-to-r dark:from-cyan-500/20 dark:via-cyan-500/10 dark:to-transparent text-cyan-600 dark:text-cyan-300 border-l-4 border-cyan-500 dark:border-cyan-400 font-semibold shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-rpg-card'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-5 h-5 ${isActive ? 'text-cyan-500 dark:text-cyan-400' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge > 0 && (
                    <span className="px-2 py-0.5 text-xs rounded-full bg-cyan-500/15 text-cyan-600 dark:text-cyan-300 font-semibold border border-cyan-500/30">
                      {item.badge}
                    </span>
                  )}
                  {item.extra && !item.badge && (
                    <span className="text-xs text-slate-400 font-mono">{item.extra}</span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* User mini-card */}
        <div className="p-4 border-t border-slate-200 dark:border-rpg-border bg-slate-50/50 dark:bg-rpg-darkest/40">
          <button
            type="button"
            onClick={() => handleNav('profile')}
            className="w-full text-left p-3 rounded-xl bg-slate-100 dark:bg-rpg-card border border-slate-200 dark:border-rpg-border flex items-center gap-3 hover:border-cyan-400 dark:hover:border-cyan-500/60 transition-colors"
            title="Edit Profile"
          >
            <div className="relative">
              <div className="w-11 h-11 rounded-lg bg-gradient-to-tr from-purple-700 to-cyan-500 flex items-center justify-center font-heading font-bold text-white shadow-md border border-cyan-400/40">
                {user?.username ? user.username.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="absolute -bottom-1 -right-1 px-1.5 bg-amber-500 text-slate-950 font-bold text-[10px] rounded-full border border-slate-900">
                L{user?.character?.overallLevel || 1}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{user?.username || 'Hero'}</p>
                <div className="flex items-center text-amber-500 dark:text-amber-400 text-xs font-bold gap-0.5">
                  <Flame className="w-3.5 h-3.5 fill-amber-500 dark:fill-amber-400" />
                  <span>{user?.streak?.currentStreak || 1}d</span>
                </div>
              </div>
              <p className="text-xs text-cyan-600 dark:text-cyan-400/90 truncate flex items-center gap-1">
                <Shield className="w-3 h-3 shrink-0" />
                <span>{user?.character?.title || 'Novice'}</span>
              </p>
            </div>
          </button>
        </div>
      </aside>

      {/* ─── MOBILE BOTTOM TAB BAR (visible only on mobile) ─── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-rpg-panel/98 backdrop-blur-md border-t border-slate-200 dark:border-rpg-border pb-safe shadow-xl dark:shadow-black/50">
        <div className="flex items-stretch overflow-x-auto no-scrollbar">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNav(item.id)}
                className={`relative flex-1 min-w-[60px] flex flex-col items-center justify-center gap-0.5 py-2.5 px-1 transition-all duration-150 ${
                  isActive
                    ? 'text-cyan-600 dark:text-cyan-400'
                    : 'text-slate-400 dark:text-slate-500'
                }`}
              >
                {/* Active indicator bar */}
                {isActive && (
                  <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-cyan-500" />
                )}

                {/* Icon with badge */}
                <div className="relative">
                  <Icon className={`w-5 h-5 transition-transform duration-150 ${isActive ? 'scale-110' : ''}`} />
                  {item.badge > 0 && (
                    <span className="absolute -top-1.5 -right-2 min-w-[14px] h-3.5 px-0.5 text-[9px] font-black rounded-full bg-cyan-500 text-slate-950 flex items-center justify-center leading-none">
                      {item.badge}
                    </span>
                  )}
                </div>

                {/* Label */}
                <span className={`text-[10px] font-semibold leading-none ${isActive ? 'font-bold' : ''}`}>
                  {item.mobileLabel}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}
