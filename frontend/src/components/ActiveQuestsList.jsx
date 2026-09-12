import React, { useState } from 'react';
import { 
  CheckCircle2, 
  Circle, 
  Trash2, 
  Brain, 
  HeartPulse, 
  Sparkles, 
  ChevronDown, 
  ChevronUp, 
  Trophy, 
  Plus
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { DOMAINS } from '../services/rpgEngine';
import { soundService } from '../services/soundService';

export default function ActiveQuestsList({ 
  quests, 
  onCompleteMicrotask, 
  onDeleteQuest, 
  onOpenDecomposeModal 
}) {
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [collapsedMap, setCollapsedMap] = useState({});

  const toggleCollapse = (questId) => {
    soundService.playClick();
    setCollapsedMap((prev) => ({ ...prev, [questId]: !prev[questId] }));
  };

  const filteredQuests = quests.filter((q) => {
    if (selectedFilter === 'all') return true;
    return q.domain === selectedFilter;
  });

  const handleCheckMicrotask = (quest, microtask) => {
    if (microtask.isCompleted) return;

    soundService.playMicrotaskComplete();

    const remainingIncomplete = quest.microtasks.filter(
      (m) => !m.isCompleted && m.id !== microtask.id
    ).length;

    if (remainingIncomplete === 0) {
      soundService.playQuestComplete();
      try {
        confetti({
          particleCount: 60,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch (e) {}
    }

    onCompleteMicrotask({
      questId: quest.id,
      microtaskId: microtask.id,
      domain: quest.domain,
      xp: microtask.xpReward || 25,
      gold: microtask.goldReward || 8,
      isQuestFinished: remainingIncomplete === 0
    });
  };

  return (
    <div className="space-y-6 transition-colors duration-200">
      {/* Header & Filter Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-xl font-heading font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span>Active Quest Log</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-mono">
              {filteredQuests.length}
            </span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Conquer microtasks step-by-step to power up your attributes
          </p>
        </div>
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-rpg-card border border-slate-200 dark:border-rpg-border self-start sm:self-center">
          {[
            { id: 'all', label: 'All' },
            { id: 'mental', label: 'Mental', color: '#06B6D4' },
            { id: 'health', label: 'Health', color: '#10B981' },
            { id: 'skill', label: 'Skill', color: '#8B5CF6' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                soundService.playClick();
                setSelectedFilter(tab.id);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                selectedFilter === tab.id
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
              style={{
                color: selectedFilter === tab.id && tab.color ? tab.color : undefined
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {filteredQuests.length === 0 ? (
        <div className="p-12 rounded-3xl bg-white/80 dark:bg-rpg-card/60 border border-dashed border-slate-200 dark:border-rpg-border text-center space-y-4 shadow-sm">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-600 dark:text-cyan-400">
            <Trophy className="w-7 h-7" />
          </div>
          <div>
            <h4 className="font-heading font-bold text-lg text-slate-900 dark:text-white">No active quests in this domain</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1">
              Type what's overwhelming you in the search bar above or create a new custom decomposed quest.
            </p>
          </div>
          <button
            onClick={() => onOpenDecomposeModal()}
            className="btn-tactile inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-white dark:text-slate-950 font-bold text-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Quest</span>
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredQuests.map((quest) => {
            const domainConfig = DOMAINS[quest.domain] || DOMAINS.mental;
            const completedCount = quest.microtasks.filter((m) => m.isCompleted).length;
            const totalCount = quest.microtasks.length;
            const pct = Math.round((completedCount / Math.max(1, totalCount)) * 100);
            const isFinished = completedCount === totalCount && totalCount > 0;
            const isCollapsed = collapsedMap[quest.id];

            const Icon = quest.domain === 'mental' ? Brain : quest.domain === 'health' ? HeartPulse : Sparkles;

            return (
              <div
                key={quest.id}
                className={`rounded-2xl border transition-all duration-200 bg-white dark:bg-rpg-card/90 overflow-hidden shadow-sm dark:shadow-none ${
                  isFinished 
                    ? 'border-emerald-300 dark:border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-950/10' 
                    : 'border-slate-200 dark:border-rpg-border hover:border-slate-300 dark:hover:border-slate-600'
                }`}
              >
            
                <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1">
                    <div 
                      className="p-2.5 rounded-xl shrink-0 mt-0.5"
                      style={{ backgroundColor: `${domainConfig.color}20`, color: domainConfig.color }}
                    >
                      <Icon className="w-5 h-5" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span 
                          className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md"
                          style={{ backgroundColor: `${domainConfig.color}25`, color: domainConfig.color }}
                        >
                          {quest.domain === 'skill' ? 'Skill' : domainConfig.name.split(' ')[0]}
                        </span>

                        <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                          {quest.difficulty || 'Medium'}
                        </span>

                        {isFinished && (
                          <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/30">
                            ✨ Conquered
                          </span>
                        )}
                      </div>

                      <h4 className="font-heading font-bold text-base sm:text-lg text-slate-900 dark:text-white leading-snug">
                        {quest.title}
                      </h4>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-center">
                    <div className="text-right">
                      <div className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
                        {completedCount} / {totalCount} Steps
                      </div>
                      <div className="w-24 bg-slate-200 dark:bg-slate-800 rounded-full h-1.5 mt-1 overflow-hidden">
                        <div 
                          className="h-full rounded-full transition-all duration-500"
                          style={{ 
                            width: `${pct}%`, 
                            backgroundColor: isFinished ? '#10B981' : domainConfig.color 
                          }}
                        />
                      </div>
                    </div>

                    <button
                      onClick={() => toggleCollapse(quest.id)}
                      className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                      title="Expand / Collapse microtasks"
                    >
                      {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                    </button>

                    <button
                      onClick={() => {
                        soundService.playClick();
                        onDeleteQuest(quest.id);
                      }}
                      className="p-1.5 rounded-lg text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 bg-slate-100 dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                      title="Abandon Quest"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Microtasks Checklist (Collapsible) */}
                {!isCollapsed && (
                  <div className="px-4 sm:px-5 pb-4 pt-1 border-t border-slate-200 dark:border-rpg-border/60 space-y-2 bg-slate-50/50 dark:bg-slate-950/30">
                    {quest.microtasks.map((microtask, idx) => (
                      <div
                        key={microtask.id || idx}
                        onClick={() => handleCheckMicrotask(quest, microtask)}
                        className={`p-3 rounded-xl border transition-all duration-150 cursor-pointer flex items-center justify-between gap-3 ${
                          microtask.isCompleted
                            ? 'bg-slate-100 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500 line-through'
                            : 'bg-white dark:bg-rpg-panel border-slate-200 dark:border-rpg-border hover:border-cyan-400 hover:bg-cyan-50/20 dark:hover:bg-rpg-cardHover text-slate-800 dark:text-slate-200 shadow-sm dark:shadow-none'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <button 
                            type="button" 
                            className="focus:outline-none"
                          >
                            {microtask.isCompleted ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
                            ) : (
                              <Circle className="w-4 h-4 text-slate-400 dark:text-slate-500 hover:text-cyan-500 dark:hover:text-cyan-400" />
                            )}
                          </button>
                          <span className="text-xs sm:text-sm font-medium">
                            {microtask.title}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span 
                            className="text-[11px] font-mono font-bold px-2 py-0.5 rounded"
                            style={{ 
                              backgroundColor: `${domainConfig.color}20`, 
                              color: domainConfig.color 
                            }}
                          >
                            +{microtask.xpReward} XP
                          </span>
                          <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300">
                            +{microtask.goldReward}g
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
