import React, { useEffect } from 'react';
import { Trophy, Sparkles, Award, ArrowUp, Star } from 'lucide-react';
import confetti from 'canvas-confetti';
import { soundService } from '../services/soundService';

export default function LevelUpModal({ data, onClose }) {
  useEffect(() => {
    if (data) {
      soundService.playLevelUp();
      try {
        confetti({
          particleCount: 120,
          spread: 90,
          origin: { y: 0.4 }
        });
      } catch (e) {}
    }
  }, [data]);

  if (!data) return null;

  const { domainName, newLevel, newTitle, bonusGold } = data;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-lg animate-fadeIn">
      <div className="relative w-full max-w-md bg-gradient-to-b from-rpg-card via-rpg-dark to-rpg-darkest border-2 border-amber-400 rounded-3xl p-6 sm:p-8 text-center shadow-glow-gold overflow-hidden">
        
       
        <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-64 h-32 bg-amber-400/30 rounded-full blur-3xl pointer-events-none" />

        <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-tr from-amber-500 via-yellow-400 to-amber-600 flex items-center justify-center text-slate-950 shadow-2xl mb-4 border-2 border-amber-200 animate-bounce">
          <Trophy className="w-10 h-10 fill-slate-950" />
        </div>

        <span className="text-xs uppercase font-mono font-bold tracking-widest text-amber-400 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/30">
          Ascendance Recognized
        </span>

        <h3 className="text-2xl sm:text-3xl font-heading font-extrabold text-white mt-3 mb-1">
          LEVEL UP!
        </h3>
        <p className="text-sm font-semibold text-cyan-400">
          {domainName ? `${domainName} Advanced` : 'Overall Character Reached New Heights'}
        </p>
        <div className="my-6 p-4 rounded-2xl bg-slate-900/90 border border-slate-700/80 flex items-center justify-center gap-4">
          <div className="text-right">
            <span className="text-xs text-slate-400 block font-mono">Previous</span>
            <span className="text-xl font-heading font-bold text-slate-400">Lv.{newLevel - 1}</span>
          </div>

          <div className="p-2 rounded-full bg-amber-500/20 text-amber-400">
            <ArrowUp className="w-6 h-6" />
          </div>

          <div className="text-left">
            <span className="text-xs text-amber-400 block font-mono">Ascended</span>
            <span className="text-3xl font-heading font-extrabold text-amber-300">Lv.{newLevel}</span>
          </div>
        </div>
        {newTitle && (
          <div className="mb-6 p-3 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-semibold flex items-center justify-center gap-2">
            <Award className="w-4 h-4 text-purple-400" />
            <span>Title Granted: <strong>{newTitle}</strong></span>
          </div>
        )}

        <button
          onClick={() => {
            soundService.playClick();
            onClose();
          }}
          className="btn-tactile w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950 font-bold text-sm shadow-glow-gold"
        >
          Claim Ascendance & Continue
        </button>
      </div>
    </div>
  );
}
