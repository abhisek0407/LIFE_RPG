import React, { useState, useEffect } from 'react';
import {
  Flame,
  Calendar as CalendarIcon,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  Award,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { getStreakMultiplier } from '../services/rpgEngine';
import { soundService } from '../services/soundService';
import { apiService } from '../services/apiService';

const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December'
];
const DAY_LABELS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
const toDateKey = (d) =>
  `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;

export default function StreakCalendarView({ user, onClaimDailyCheckIn }) {
  const { streak } = user;
  const [streakData, setStreakData] = useState(null);

  useEffect(() => {
    let active = true;

    const loadStreakData = async () => {
      try {
        const data = await apiService.getStreakData();
        if (active) setStreakData(data);
      } catch (err) {
        console.warn('Failed to load streak data', err);
      }
    };

    loadStreakData();
    return () => {
      active = false;
    };
  }, [user?._id]);

  const currentStreak = streakData?.currentStreak ?? streak?.currentStreak ?? 1;
  const longestStreak = streakData?.longestStreak ?? streak?.longestStreak ?? 1;
  const multiplier = streakData?.multiplier ?? getStreakMultiplier(currentStreak);
  const streakDays = streakData?.recentDays || streakData?.heatmap || [];
  const activeKeys = new Set(
    streakDays
      .filter((entry) => {
        const count = Number(entry.tasksCompleted ?? entry.count ?? 0);
        return count > 0;
      })
      .map((entry) => entry.date || entry.day)
  );

  const [hasCheckedInToday, setHasCheckedInToday] = useState(false);
  const realToday = new Date();
  useEffect(() => {
    setHasCheckedInToday(activeKeys.has(toDateKey(realToday)));
  }, [activeKeys, realToday]);
  const todayKey  = toDateKey(realToday);

  // Calendar view state – start at current month
  const [viewYear,  setViewYear]  = useState(realToday.getFullYear());
  const [viewMonth, setViewMonth] = useState(realToday.getMonth()); 

  // Live clock for "real-time" feel
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(t);
  }, []);
  const goToPrevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };
  const goToNextMonth = () => {
    // Don't allow going beyond current month
    if (viewYear === realToday.getFullYear() && viewMonth === realToday.getMonth()) return;
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  const isCurrentMonth =
    viewYear === realToday.getFullYear() && viewMonth === realToday.getMonth();

  // Build calendar grid for viewYear/viewMonth
  // First day of month → figure out what weekday (Mon=0 ... Sun=6)
  const firstDay = new Date(viewYear, viewMonth, 1);
  // getDay() returns 0=Sun…6=Sat; convert to Mon-based 0-6
  const startOffset = (firstDay.getDay() + 6) % 7;
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  // Fill leading empties + real days
  const cells = [
    ...Array(startOffset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => {
      const date    = new Date(viewYear, viewMonth, i + 1);
      const key     = toDateKey(date);
      const isToday = key === todayKey;
      const isActive = activeKeys.has(key);
      const isFuture = date > realToday;
      return { day: i + 1, key, isToday, isActive, isFuture };
    })
  ];

  // Pad end so grid rows are complete
  while (cells.length % 7 !== 0) cells.push(null);

  const handleCheckIn = () => {
    if (hasCheckedInToday) return;
    soundService.playQuestComplete();
    try { confetti({ particleCount: 50, spread: 60, origin: { y: 0.5 } }); } catch(e) {}
    setHasCheckedInToday(true);
    onClaimDailyCheckIn();
  };

  return (
    <div className="space-y-6 transition-colors duration-200">

      {/* ── Calendar Operations Header (Streak flame banner removed as requested) ── */}
      {/* <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 sm:p-7 rounded-3xl bg-gradient-to-r from-slate-100 via-white to-slate-100 dark:from-rpg-card dark:via-rpg-panel dark:to-rpg-darkest border border-slate-200 dark:border-rpg-border shadow-sm"> */}
        {/* <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-cyan-500/15 text-cyan-800 dark:text-cyan-300 border border-cyan-300 dark:border-cyan-500/30">
              Consistency Matrix
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
              Active Multiplier: <strong className="text-amber-600 dark:text-amber-400">{multiplier}x XP</strong>
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-heading font-extrabold text-slate-900 dark:text-white">
            Streak Activity & Calendar
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
            Track daily discipline across past and present months. Every check-in shields your habit fire.
          </p>
        </div> */}

        {/* Daily Check-In Action Button */}
        {/* <div className="shrink-0">
          <button
            onClick={handleCheckIn}
            disabled={hasCheckedInToday}
            className={`btn-tactile px-5 py-3 rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm ${
              hasCheckedInToday
                ? 'bg-emerald-100 dark:bg-emerald-500/20 border border-emerald-300 dark:border-emerald-500/40 text-emerald-800 dark:text-emerald-300 cursor-default'
                : 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 shadow-glow-gold'
            }`}
          >
            {hasCheckedInToday ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Today Checked-In!</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 fill-slate-950" />
                <span>Claim Daily Check-In (+10g & XP)</span>
              </>
            )}
          </button>
        </div> */}
      {/* </div> */}

      {/* ── Stats Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-rpg-card border border-slate-200 dark:border-rpg-border flex items-center gap-3 shadow-sm">
          <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <Flame className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-500 dark:text-slate-400">Current Streak</div>
            <div className="text-lg font-heading font-bold text-slate-900 dark:text-white">{currentStreak} Days</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-rpg-card border border-slate-200 dark:border-rpg-border flex items-center gap-3 shadow-sm">
          <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-500 dark:text-slate-400">Longest Streak</div>
            <div className="text-lg font-heading font-bold text-slate-900 dark:text-white">{longestStreak} Days</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-rpg-card border border-slate-200 dark:border-rpg-border flex items-center gap-3 shadow-sm">
          <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-500 dark:text-slate-400">Streak Shields (Freezes)</div>
            <div className="text-lg font-heading font-bold text-slate-900 dark:text-white">
              {streak?.streakFreezesAvailable || 1} Active
            </div>
          </div>
        </div>
      </div>

      {/* ── Real Calendar with Month Navigation ── */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-rpg-card border border-slate-200 dark:border-rpg-border shadow-sm">

        {/* Calendar Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
            <h3 className="font-heading font-bold text-base text-slate-900 dark:text-white">
              Streak Activity Calendar
            </h3>
          </div>

          {/* Month Navigator */}
          <div className="flex items-center gap-2">
            <button
              onClick={goToPrevMonth}
              className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
              title="Previous month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="min-w-[140px] text-center">
              <span className="text-sm font-bold text-slate-800 dark:text-slate-200 font-mono">
                {MONTH_NAMES[viewMonth]} {viewYear}
              </span>
              {isCurrentMonth && (
                <span className="block text-[10px] text-cyan-600 dark:text-cyan-400 font-semibold mt-0.5">
                  {now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
                </span>
              )}
            </div>

            <button
              onClick={goToNextMonth}
              disabled={isCurrentMonth}
              className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              title="Next month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Day-of-week header */}
        <div className="grid grid-cols-7 gap-1.5 sm:gap-2 mb-2">
          {DAY_LABELS.map((d) => (
            <div key={d} className="text-center text-[10px] sm:text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider py-1">
              {d}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
          {cells.map((cell, idx) => {
            if (!cell) {
              // Empty padding cell
              return <div key={`empty-${idx}`} className="h-12 sm:h-14 rounded-xl" />;
            }

            return (
              <div
                key={cell.key}
                title={cell.isActive ? `${cell.key} — streak day 🔥` : cell.key}
                className={`h-12 sm:h-14 rounded-xl p-1.5 sm:p-2 border flex flex-col justify-between transition-all ${
                  cell.isToday
                    ? 'border-amber-400 bg-amber-50 dark:bg-amber-500/20 shadow-sm dark:shadow-glow-gold'
                    : cell.isActive
                    ? 'border-emerald-300 dark:border-emerald-500/40 bg-emerald-50 dark:bg-emerald-500/10'
                    : cell.isFuture
                    ? 'border-slate-100 dark:border-slate-800/50 bg-slate-50/50 dark:bg-slate-900/20 opacity-40'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50'
                }`}
              >
                <div className="flex items-start justify-between">
                  <span className={`text-[10px] sm:text-xs font-mono font-bold leading-none ${
                    cell.isToday
                      ? 'text-amber-700 dark:text-amber-300 font-extrabold'
                      : cell.isActive
                      ? 'text-emerald-800 dark:text-emerald-200'
                      : 'text-slate-400 dark:text-slate-500'
                  }`}>
                    {cell.day}
                  </span>
                  {cell.isActive && (
                    <Flame className="w-4 h-4 sm:w-5 sm:h-5 text-orange-500 dark:text-orange-400 fill-orange-500 dark:fill-orange-400 drop-shadow-sm animate-pulse" />
                  )}
                </div>

                {cell.isToday && (
                  <div className="text-[9px] font-bold text-amber-700 dark:text-amber-300 leading-none">TODAY</div>
                )}
                {cell.isActive && !cell.isToday && (
                  <div className="text-[9px] font-semibold text-emerald-700 dark:text-emerald-400 leading-none">STREAK</div>
                )}
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 mt-4 pt-4 border-t border-slate-100 dark:border-rpg-border">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
            <div className="w-3 h-3 rounded-sm bg-amber-200 dark:bg-amber-500/30 border border-amber-400" />
            <span>Today</span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
            <div className="w-3 h-3 rounded-sm bg-emerald-100 dark:bg-emerald-500/20 border border-emerald-300" />
            <span>Streak day</span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
            <div className="w-3 h-3 rounded-sm bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700" />
            <span>No activity</span>
          </div>
        </div>
      </div>
    </div>
  );
}
