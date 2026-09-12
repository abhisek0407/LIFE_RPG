import React, { useEffect } from 'react';
import { 
  Flame, 
  Sparkles, 
  Coins, 
  CheckCircle2, 
  ArrowRight, 
  X,
  Zap,
  TrendingUp,
  ShieldCheck
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { soundService } from '../services/soundService';
import { getStreakMultiplier } from '../services/rpgEngine';

export default function StreakLoginModal({ 
  isOpen, 
  onClose, 
  user, 
  onClaimDailyCheckIn,
  hasClaimedToday = false
}) {
  if (!isOpen) return null;

  const currentStreak = user?.streak?.currentStreak || 1;
  const longestStreak = user?.streak?.longestStreak || 1;
  const multiplier = getStreakMultiplier(currentStreak);
  const bonusPct = Math.round((multiplier - 1) * 100);

  // Trigger celebratory confetti burst on modal open
  useEffect(() => {
    if (isOpen) {
      soundService.playStreakMilestone();
      try {
        confetti({
          particleCount: 80,
          spread: 75,
          origin: { y: 0.6 },
          colors: ['#f59e0b', '#ef4444', '#06b6d4', '#8b5cf6']
        });
      } catch (e) {}
    }
  }, [isOpen]);

  const handleClaimAndClose = () => {
    soundService.playQuestComplete();
    if (!hasClaimedToday && onClaimDailyCheckIn) {
      onClaimDailyCheckIn();
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white dark:bg-rpg-panel border-2 border-orange-400/80 dark:border-orange-500/50 rounded-3xl p-6 sm:p-8 text-center shadow-2xl dark:shadow-glow-gold overflow-hidden">
        
        {/* Ambient Glows */}
        <div className="absolute -top-12 -left-12 w-48 h-48 bg-orange-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white bg-slate-100 dark:bg-slate-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Big Blazing Fire Badge */}
        <div className="relative mx-auto w-24 h-24 mb-4 flex items-center justify-center">
          {/* Animated glow aura rings */}
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-tr from-amber-500 via-orange-500 to-red-600 animate-pulse blur-md opacity-80" />
          <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-tr from-amber-500 via-orange-500 to-red-500 flex items-center justify-center shadow-lg border-2 border-amber-300">
            <Flame className="w-12 h-12 text-slate-950 fill-slate-950 animate-bounce" />
          </div>
          <div className="absolute -bottom-2 px-2.5 py-0.5 rounded-full bg-slate-900 text-amber-400 font-mono font-black text-xs border border-amber-400/50 shadow-md">
            {currentStreak} DAYS
          </div>
        </div>

        {/* Dopamine Header */}
        <div className="space-y-1.5 mb-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/15 border border-orange-500/30 text-orange-700 dark:text-orange-300 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Daily Streak Surge Activated</span>
          </div>
          <h3 className="font-heading font-extrabold text-2xl sm:text-3xl text-slate-900 dark:text-white">
            {currentStreak} Day Flame Burning!
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-xs mx-auto">
            You showed up today. While the average person procrastinates, your momentum is compounding.
          </p>
        </div>

        {/* Multiplier & Rewards Card */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-rpg-card/90 border border-slate-200 dark:border-rpg-border space-y-3 mb-6">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-amber-500" /> Current Multiplier:
            </span>
            <span className="font-mono font-extrabold text-amber-600 dark:text-amber-300 text-sm">
              {multiplier}x XP (+{bonusPct}%)
            </span>
          </div>

          <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-700"
              style={{ width: `${Math.min(100, (currentStreak / 10) * 100)}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-mono">
            <span>Day {currentStreak}</span>
            <span>Max Cap: 10d (1.5x)</span>
          </div>

          <div className="pt-2 border-t border-slate-200 dark:border-rpg-border flex items-center justify-around text-xs">
            <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-bold">
              <Coins className="w-4 h-4 fill-amber-500 text-amber-500" />
              <span>+10g Daily Bonus</span>
            </div>
            <span className="text-slate-300 dark:text-slate-700">|</span>
            <div className="flex items-center gap-1.5 text-cyan-600 dark:text-cyan-400 font-bold">
              <Zap className="w-4 h-4 fill-cyan-500 text-cyan-500" />
              <span>+20 XP Claim</span>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={handleClaimAndClose}
          className="btn-tactile w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-heading font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-glow-gold"
        >
          <span>Ignite Today & Claim Bonus</span>
          <ArrowRight className="w-4 h-4" />
        </button>

        <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-3 font-mono">
          Longest Streak Record: {longestStreak} Days
        </p>
      </div>
    </div>
  );
}
