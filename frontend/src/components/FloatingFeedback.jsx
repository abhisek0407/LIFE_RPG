import React from 'react';
import { Sparkles, Coins, Flame } from 'lucide-react';

export default function FloatingFeedback({ feedback }) {
  if (!feedback) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-bounce pointer-events-none">
      <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-slate-900/95 border-2 border-cyan-400 shadow-glow-mental text-white">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center text-white">
          <Sparkles className="w-4 h-4" />
        </div>
        <div>
          <div className="text-xs font-bold text-cyan-300">
            +{feedback.xp} {feedback.domainName}
            {feedback.bonusXp > 0 && (
              <span className="text-[10px] text-amber-400 ml-1 font-mono">
                (+{feedback.bonusXp} streak buff!)
              </span>
            )}
          </div>
          <div className="text-[11px] text-amber-300 flex items-center gap-1 font-mono">
            <Coins className="w-3 h-3 fill-amber-400" />
            <span>+{feedback.gold} Gold Earned</span>
          </div>
        </div>
      </div>
    </div>
  );
}
