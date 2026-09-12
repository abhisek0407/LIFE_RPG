import React, { useState, useEffect } from 'react';
import { 
  X, 
  Wind, 
  CheckCircle2, 
  Circle, 
  Sparkles, 
  Heart, 
  Play, 
  Pause 
} from 'lucide-react';
import { soundService } from '../services/soundService';
import { apiService } from '../services/apiService';

export default function FeelStuckModal({ isOpen, onClose, onCompleteGroundingTask }) {
  const [data, setData] = useState(null);
  const [completedMap, setCompletedMap] = useState({});
  const [isBreathingActive, setIsBreathingActive] = useState(true);
  const [breathPhase, setBreathPhase] = useState('Inhale');
  const [phaseSeconds, setPhaseSeconds] = useState(4);

  useEffect(() => {
    if (isOpen) {
      const loadRescue = async () => {
        const rescue = await apiService.feelStuckRescue();
        setData(rescue);
      };
      loadRescue();
      setCompletedMap({});
      setIsBreathingActive(true);
      setBreathPhase('Inhale');
      setPhaseSeconds(4);
    }
  }, [isOpen]);
  useEffect(() => {
    if (!isOpen || !isBreathingActive) return;

    const interval = setInterval(() => {
      setPhaseSeconds((prevSec) => {
        if (prevSec > 1) {
          return prevSec - 1;
        } else {
          setBreathPhase((currentPhase) => {
            if (currentPhase === 'Inhale') return 'Hold (Full)';
            if (currentPhase === 'Hold (Full)') return 'Exhale';
            if (currentPhase === 'Exhale') return 'Hold (Empty)';
            return 'Inhale';
          });
          return 4;
        }
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, isBreathingActive, breathPhase]);

  if (!isOpen || !data) return null;

  const handleCheckTask = (task) => {
    if (completedMap[task.id]) return;

    soundService.playMicrotaskComplete();
    setCompletedMap((prev) => ({ ...prev, [task.id]: true }));
    onCompleteGroundingTask({
      taskTitle: task.title,
      domain: task.domain,
      xp: task.xpReward,
      gold: task.goldReward
    });
  };

  const getBreathCircleScale = () => {
    if (breathPhase === 'Inhale') return 'scale-125 border-cyan-500 bg-cyan-500/20 shadow-glow-mental';
    if (breathPhase === 'Hold (Full)') return 'scale-125 border-purple-500 bg-purple-500/20 shadow-glow-skill';
    if (breathPhase === 'Exhale') return 'scale-90 border-emerald-500 bg-emerald-500/20 shadow-glow-health';
    return 'scale-90 border-slate-400 dark:border-slate-600 bg-slate-200/50 dark:bg-slate-800/40';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-xl bg-white dark:bg-rpg-dark border border-amber-400/60 dark:border-amber-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col transition-colors duration-200">
        
        {/* Glow ambient header */}
        <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-64 h-32 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-start justify-between mb-4 relative">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-slate-950 font-bold shadow-glow-gold">
              <Heart className="w-5 h-5 fill-slate-950" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-xl text-slate-900 dark:text-white flex items-center gap-2">
                Grounding Chamber <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-400/40">De-Stress Protocol</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Overwhelm is physiological. Let’s unfreeze your mind.
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              soundService.playClick();
              onClose();
            }}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-rpg-card hover:bg-slate-200 dark:hover:bg-rpg-cardHover border border-slate-200 dark:border-rpg-border transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-500/10 border border-amber-300 dark:border-amber-500/25 text-amber-900 dark:text-amber-200 text-xs sm:text-sm mb-6 leading-relaxed flex items-start gap-2.5">
          <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <p>{data.encouragement}</p>
        </div>
        <div className="overflow-y-auto pr-1 space-y-6 flex-1">
          <div className="p-5 rounded-2xl bg-slate-100 dark:bg-slate-900/90 border border-slate-200 dark:border-rpg-border flex flex-col items-center justify-center relative overflow-hidden">
            <div className="flex items-center justify-between w-full mb-3 text-xs text-slate-600 dark:text-slate-400">
              <span className="font-semibold text-cyan-600 dark:text-cyan-400 flex items-center gap-1.5">
                <Wind className="w-4 h-4" /> 4-4-4-4 Box Breathing
              </span>
              <button
                onClick={() => setIsBreathingActive(!isBreathingActive)}
                className="text-[11px] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center gap-1 px-2 py-1 rounded bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700"
              >
                {isBreathingActive ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                <span>{isBreathingActive ? 'Pause' : 'Resume'}</span>
              </button>
            </div>
            <div className="my-4 relative flex items-center justify-center">
              <div 
                className={`w-32 h-32 rounded-full border-4 flex flex-col items-center justify-center transition-all duration-1000 ease-in-out ${getBreathCircleScale()}`}
              >
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  {breathPhase}
                </span>
                <span className="text-3xl font-heading font-extrabold text-slate-900 dark:text-white mt-0.5">
                  {phaseSeconds}s
                </span>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 dark:text-slate-400 text-center">
              Breathe with the sphere. 2 cycles resets heart rate variability.
            </p>
          </div>
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3 flex items-center justify-between">
              <span>Instant Unblocker Actions</span>
              <span className="text-amber-600 dark:text-amber-400 font-mono text-[11px]">Instant XP & Gold</span>
            </h4>

            <div className="space-y-2.5">
              {data.groundingMicrotasks.map((task) => {
                const isDone = completedMap[task.id];
                return (
                  <div
                    key={task.id}
                    onClick={() => handleCheckTask(task)}
                    className={`p-3.5 rounded-2xl border transition-all duration-200 cursor-pointer flex items-center justify-between gap-3 ${
                      isDone
                        ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-300 dark:border-emerald-500/40 text-slate-400 line-through'
                        : 'bg-slate-50 dark:bg-rpg-card hover:bg-slate-100 dark:hover:bg-rpg-cardHover border-slate-200 dark:border-rpg-border hover:border-amber-400 text-slate-800 dark:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-cyan-500 dark:text-cyan-400">
                        {isDone ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />
                        ) : (
                          <Circle className="w-5 h-5 text-slate-400 dark:text-slate-500 hover:text-amber-500" />
                        )}
                      </div>
                      <p className="text-xs sm:text-sm font-medium leading-snug">
                        {task.title}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border border-cyan-500/30">
                        +{task.xpReward} XP
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
        <div className="mt-6 pt-4 border-t border-slate-200 dark:border-rpg-border flex justify-end">
          <button
            onClick={() => {
              soundService.playClick();
              onClose();
            }}
            className="btn-tactile px-6 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-sm font-semibold transition-all border border-slate-200 dark:border-slate-700"
          >
            Feeling Better • Close
          </button>
        </div>

      </div>
    </div>
  );
}
