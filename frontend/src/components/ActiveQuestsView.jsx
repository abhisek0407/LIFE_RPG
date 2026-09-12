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
  Plus, 
  Calendar, 
  Clock, 
  Hourglass, 
  CheckCheck, 
  Layers 
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { DOMAINS } from '../services/rpgEngine';
import { soundService } from '../services/soundService';

export default function ActiveQuestsView({ 
  quests, 
  onCompleteMicrotask, 
  onDeleteQuest, 
  onOpenDecomposeModal 
}) {
  const [activeStatusTab, setActiveStatusTab] = useState('all'); 
  const [selectedDomainFilter, setSelectedDomainFilter] = useState('all');
  const [collapsedMap, setCollapsedMap] = useState({});


  const isQuestCollapsed = (questId) => {
    return collapsedMap[questId] !== false; 
  };

  const toggleCollapse = (questId) => {
    soundService.playClick();
    setCollapsedMap((prev) => ({ ...prev, [questId]: prev[questId] === false ? true : false }));
  };

  const getQuestStatus = (quest) => {
    // If DB marks it completed, it's always conquered
    if (quest.status === 'completed') return 'conquered';
    const total = quest.microtasks?.length || 0;
    const completed = quest.microtasks?.filter((m) => m.isCompleted).length || 0;

    if (total === 0 || completed === 0) return 'not_started';
    if (completed === total) return 'conquered';
    return 'in_progress';
  };
  const formatCreatedDate = (dateString) => {
    if (!dateString) return 'Recently';
    try {
      const d = new Date(dateString);
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
      });
    } catch {
      return 'Recently';
    }
  };

  const notStartedQuests = quests.filter((q) => getQuestStatus(q) === 'not_started');
  const inProgressQuests = quests.filter((q) => getQuestStatus(q) === 'in_progress');
  const conqueredQuests = quests.filter((q) => getQuestStatus(q) === 'conquered');

  const filterQuestsList = (list) => {
    return list.filter((q) => {
      if (selectedDomainFilter === 'all') return true;
      return q.domain === selectedDomainFilter;
    });
  };

  const handleCheckMicrotask = (quest, microtask) => {
    if (microtask.isCompleted) return;

    soundService.playMicrotaskComplete();

    const microtaskKey = microtask.id ?? microtask._id;
    const remainingIncomplete = (quest.microtasks || []).filter((m) => {
      const taskKey = m.id ?? m._id;
      return !m.isCompleted && taskKey !== microtaskKey;
    }).length;

    if (remainingIncomplete === 0) {
      soundService.playQuestComplete();
      try {
        confetti({
          particleCount: 75,
          spread: 70,
          origin: { y: 0.55 }
        });
      } catch (e) {}
    }

    onCompleteMicrotask({
      questId: quest.id ?? quest._id,
      microtaskId: microtaskKey,
      domain: quest.domain,
      xp: microtask.xpReward || 25,
      gold: microtask.goldReward || 8,
      isQuestFinished: remainingIncomplete === 0,
    });
  };
  const renderQuestCard = (quest) => {
    const questKey = quest.id ?? quest._id;
    const domainConfig = DOMAINS[quest.domain] || DOMAINS.mental;
    const completedCount = quest.microtasks.filter((m) => m.isCompleted).length;
    const totalCount = quest.microtasks.length;
    const pct = Math.round((completedCount / Math.max(1, totalCount)) * 100);
    const status = getQuestStatus(quest);
    const isCollapsed = isQuestCollapsed(questKey);
    const createdDateFormatted = formatCreatedDate(quest.createdAt);

    const Icon = quest.domain === 'mental' ? Brain : quest.domain === 'health' ? HeartPulse : Sparkles;

    return (
      <div
        key={questKey}
        className={`rounded-2xl border transition-all duration-200 bg-white dark:bg-rpg-card/90 overflow-hidden shadow-sm dark:shadow-none ${
          status === 'conquered'
            ? 'border-emerald-300 dark:border-emerald-500/30 bg-emerald-50/40 dark:bg-emerald-950/10'
            : status === 'in_progress'
            ? 'border-amber-300/80 dark:border-amber-500/30'
            : 'border-slate-200 dark:border-rpg-border hover:border-slate-300 dark:hover:border-slate-600'
        }`}
      >
        {/* Card Header Bar */}
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
                {status === 'conquered' && (
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/30 flex items-center gap-1">
                    <CheckCheck className="w-3 h-3" /> Conquered
                  </span>
                )}
                {status === 'in_progress' && (
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-500/30 flex items-center gap-1">
                    <Hourglass className="w-3 h-3" /> Partially Conquered
                  </span>
                )}
                {status === 'not_started' && (
                  <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Not Started
                  </span>
                )}

                {/* Created Date */}
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-slate-400" />
                  <span>Created: {createdDateFormatted}</span>
                </span>
              </div>

              <h4 className="font-heading font-bold text-base sm:text-lg text-slate-900 dark:text-white leading-snug">
                {quest.title}
              </h4>
            </div>
          </div>

          {/* Progress & Controls */}
          <div className="flex items-center gap-3 self-end sm:self-center">
            <div className="text-right">
              <div className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
                {completedCount} / {totalCount} Steps ({pct}%)
              </div>
              <div className="w-24 bg-slate-200 dark:bg-slate-800 rounded-full h-1.5 mt-1 overflow-hidden">
                <div 
                  className="h-full rounded-full transition-all duration-500"
                  style={{ 
                    width: `${pct}%`, 
                    backgroundColor: status === 'conquered' ? '#10B981' : domainConfig.color 
                  }}
                />
              </div>
            </div>

            <button
              onClick={() => toggleCollapse(questKey)}
              className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              title="Expand / Collapse microtasks"
            >
              {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </button>

            <button
              onClick={() => {
                soundService.playClick();
                onDeleteQuest(questKey);
              }}
              className="p-1.5 rounded-lg text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 bg-slate-100 dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
              title="Abandon Quest"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
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
                  <button type="button" className="focus:outline-none">
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
  };

  return (
    <div className="space-y-6 transition-colors duration-200">
     
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-cyan-50 via-slate-50 to-indigo-50 dark:from-cyan-950/40 dark:via-rpg-card dark:to-indigo-950/40 border border-cyan-200 dark:border-cyan-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-cyan-500/15 text-cyan-800 dark:text-cyan-300 border border-cyan-300 dark:border-cyan-500/30">
              Quest Operations
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">Status-Segregated Log</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-heading font-extrabold text-slate-900 dark:text-white">
            Active Quest Log
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
            Review your missions classified by completion state, creation date, and domain attributes.
          </p>
        </div>

        <button
          onClick={() => onOpenDecomposeModal()}
          className="btn-tactile px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-white dark:text-slate-950 font-bold text-xs flex items-center gap-2 self-start sm:self-center"
        >
          <Plus className="w-4 h-4" />
          <span>New Decomposed Quest</span>
        </button>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
       
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-rpg-card border border-slate-200 dark:border-rpg-border overflow-x-auto">
          {[
            { id: 'all', label: `All Quests (${quests.length})` },
            { id: 'not_started', label: `Not Started (${notStartedQuests.length})` },
            { id: 'in_progress', label: `Partially Conquered (${inProgressQuests.length})` },
            { id: 'conquered', label: `Conquered (${conqueredQuests.length})` }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                soundService.playClick();
                setActiveStatusTab(tab.id);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                activeStatusTab === tab.id
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-rpg-card border border-slate-200 dark:border-rpg-border self-start sm:self-center">
          {[
            { id: 'all', label: 'All Domains' },
            { id: 'mental', label: 'Mental', color: '#06B6D4' },
            { id: 'health', label: 'Health', color: '#10B981' },
            { id: 'skill', label: 'Skill', color: '#8B5CF6' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                soundService.playClick();
                setSelectedDomainFilter(tab.id);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                selectedDomainFilter === tab.id
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
              style={{
                color: selectedDomainFilter === tab.id && tab.color ? tab.color : undefined
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {quests.length === 0 ? (
        <div className="p-12 rounded-3xl bg-white/80 dark:bg-rpg-card/60 border border-dashed border-slate-200 dark:border-rpg-border text-center space-y-4 shadow-sm">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-600 dark:text-cyan-400">
            <Trophy className="w-7 h-7" />
          </div>
          <div>
            <h4 className="font-heading font-bold text-lg text-slate-900 dark:text-white">Your quest log is empty</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1">
              Decompose an overwhelming goal from the Home screen or create your first quest now!
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
        <div className="space-y-8">
          {(activeStatusTab === 'all' || activeStatusTab === 'in_progress') && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 flex items-center gap-2">
                  <Hourglass className="w-4 h-4" />
                  <span>Partially Conquered</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 font-mono">
                    {filterQuestsList(inProgressQuests).length}
                  </span>
                </h3>
              </div>

              {filterQuestsList(inProgressQuests).length === 0 ? (
                <p className="text-xs text-slate-400 italic px-2">No partially conquered quests currently matching filter.</p>
              ) : (
                <div className="space-y-3">
                  {filterQuestsList(inProgressQuests).map(renderQuestCard)}
                </div>
              )}
            </div>
          )}

          {(activeStatusTab === 'all' || activeStatusTab === 'not_started') && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-slate-400" />
                  <span>Not Started</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono">
                    {filterQuestsList(notStartedQuests).length}
                  </span>
                </h3>
              </div>

              {filterQuestsList(notStartedQuests).length === 0 ? (
                <p className="text-xs text-slate-400 italic px-2">No unstarted quests currently matching filter.</p>
              ) : (
                <div className="space-y-3">
                  {filterQuestsList(notStartedQuests).map(renderQuestCard)}
                </div>
              )}
            </div>
          )}
          {(activeStatusTab === 'all' || activeStatusTab === 'conquered') && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
                  <CheckCheck className="w-4 h-4" />
                  <span>Conquered Quests</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 font-mono">
                    {filterQuestsList(conqueredQuests).length}
                  </span>
                </h3>
              </div>

              {filterQuestsList(conqueredQuests).length === 0 ? (
                <p className="text-xs text-slate-400 italic px-2">No conquered quests currently matching filter.</p>
              ) : (
                <div className="space-y-3">
                  {filterQuestsList(conqueredQuests).map(renderQuestCard)}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
