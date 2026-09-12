import React, { useState, useRef } from 'react';
import {
  CheckCircle2,
  Circle,
  Plus,
  Flame,
  Brain,
  HeartPulse,
  Sparkles,
  Camera,
  Loader2,
  Bot,
  Star,
  AlertTriangle,
  X
} from 'lucide-react';
import { DOMAINS } from '../services/rpgEngine';
import { soundService } from '../services/soundService';

// Reads a File into a base64 data URL (e.g. "data:image/png;base64,...").
// This never touches the filesystem — it's held in memory just long enough
// to be sent to the server for one-time analysis.
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function DailyQuestsView({ dailies, onToggleDaily, onAddDaily }) {
  const [newTitle, setNewTitle] = useState('');
  const [newDomain, setNewDomain] = useState('health');
  const [showAddForm, setShowAddForm] = useState(false);
  const [uploadingId, setUploadingId] = useState(null);
  // Per-quest rejection banners: { [dailyId]: { message } }. Shown at the
  // bottom of that quest's own card (not a corner toast), so the "why" is
  // right next to the photo that got rejected.
  const [rejections, setRejections] = useState({});
  const fileInputRefs = useRef({});

  const dismissRejection = (dailyId) => {
    setRejections((prev) => {
      const next = { ...prev };
      delete next[dailyId];
      return next;
    });
  };

  const handleToggle = (daily) => {
    if (daily.isCompletedToday) return;
    soundService.playMicrotaskComplete();
    onToggleDaily(daily);
  };

  const handleAttachProofClick = (e, dailyId) => {
    e.stopPropagation(); // don't also trigger the row's plain toggle
    e.preventDefault();
    fileInputRefs.current[dailyId]?.click();
  };

  const handleProofFileChange = async (e, daily) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-selecting the same file later
    if (!file || daily.isCompletedToday) return;

    setUploadingId(daily.id);
    dismissRejection(daily.id); // clear any stale banner from a prior attempt
    try {
      const base64Image = await fileToBase64(file);
      soundService.playMicrotaskComplete();
      const result = await onToggleDaily(daily, base64Image);
      if (result?.rejected) {
        setRejections((prev) => ({ ...prev, [daily.id]: { message: result.error } }));
      }
    } finally {
      setUploadingId(null);
    }
  };

  const handleAddSubmit = (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const today = new Date();
    const createdDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    soundService.playQuestComplete();
    onAddDaily({
      id: `d_custom_${Date.now()}`,
      title: newTitle.trim(),
      domain: newDomain,
      xpReward: 25,
      goldReward: 10,
      isCompletedToday: false,
      streakDays: 0,
      createdDate
    });

    setNewTitle('');
    setShowAddForm(false);
  };

  return (
    <div className="space-y-6 transition-colors duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-cyan-50 via-slate-50 to-indigo-50 dark:from-cyan-950/40 dark:via-rpg-card dark:to-indigo-950/40 border border-cyan-200 dark:border-cyan-500/30 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-cyan-500/15 text-cyan-800 dark:text-cyan-300 border border-cyan-300 dark:border-cyan-500/30">
              Daily Protocols
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">Resets automatically every midnight</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-heading font-extrabold text-slate-900 dark:text-white">
            Daily Ritual Quests
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
            Consistent micro-habits compound into god-tier real world attributes.
          </p>
        </div>

        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="btn-tactile px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-white dark:text-slate-950 font-bold text-xs flex items-center gap-2 self-start sm:self-center"
        >
          <Plus className="w-4 h-4" />
          <span>{showAddForm ? 'Close Form' : 'Add Daily Habit'}</span>
        </button>
      </div>
      {showAddForm && (
        <form onSubmit={handleAddSubmit} className="p-5 rounded-2xl bg-white dark:bg-rpg-card border border-cyan-400 dark:border-cyan-500/40 space-y-4 shadow-sm">
          <h4 className="text-sm font-bold text-slate-900 dark:text-white">Add New Recurring Daily Habit</h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="e.g. 15-minute meditation before sleep"
              className="sm:col-span-2 px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-cyan-500"
            />
            <select
              value={newDomain}
              onChange={(e) => setNewDomain(e.target.value)}
              className="px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs focus:outline-none focus:border-cyan-500"
            >
              <option value="health">Health (Vitality & Body)</option>
              <option value="mental">Mental (Intellect & Focus)</option>
              <option value="skill">Skill / Personality (Craft & Mind)</option>
            </select>
          </div>
          <button
            type="submit"
            className="btn-tactile px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white dark:text-slate-950 font-bold text-xs"
          >
            Save Recurring Daily
          </button>
        </form>
      )}
      <div className="space-y-3">
        {dailies.map((daily) => {
          const domainConfig = DOMAINS[daily.domain] || DOMAINS.health;
          const Icon = daily.domain === 'mental' ? Brain : daily.domain === 'health' ? HeartPulse : Sparkles;
          const rejection = rejections[daily.id];

          return (
            <div
              key={daily.id}
              className={`rounded-2xl border transition-all duration-200 shadow-sm dark:shadow-none overflow-hidden ${daily.isCompletedToday
                ? 'bg-slate-100 dark:bg-slate-900/40 border-emerald-300 dark:border-emerald-500/30 text-slate-400'
                : 'bg-white dark:bg-rpg-card border-slate-200 dark:border-rpg-border text-slate-800 dark:text-slate-200'
                }`}
            >
              <div
                onClick={() => handleToggle(daily)}
                className={`p-4 cursor-pointer flex items-center justify-between gap-4 ${daily.isCompletedToday ? '' : 'hover:bg-slate-50 dark:hover:bg-rpg-cardHover'
                  }`}
              >
                <div className="flex items-center gap-3.5">
                  <button type="button" className="focus:outline-none">
                    {daily.isCompletedToday ? (
                      <CheckCircle2 className="w-6 h-6 text-emerald-500 dark:text-emerald-400 shrink-0" />
                    ) : (
                      <Circle className="w-6 h-6 text-slate-400 dark:text-slate-500 hover:text-cyan-500 shrink-0" />
                    )}
                  </button>

                  <div
                    className="p-2 rounded-xl shrink-0"
                    style={{ backgroundColor: `${domainConfig.color}15`, color: domainConfig.color }}
                  >
                    <Icon className="w-4 h-4" />
                  </div>

                  <div>
                    <h4 className={`text-sm sm:text-base font-semibold ${daily.isCompletedToday ? 'line-through text-slate-400 dark:text-slate-500' : 'text-slate-900 dark:text-white'}`}>
                      {daily.title}
                    </h4>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span
                        className="text-[10px] font-bold uppercase tracking-wider"
                        style={{ color: domainConfig.color }}
                      >
                        {domainConfig.name.split(' ')[0]}
                      </span>
                      <span className="text-slate-300 dark:text-slate-600">•</span>
                      <span className="text-[11px] text-amber-600 dark:text-amber-400 flex items-center gap-0.5">
                        <Flame className="w-3 h-3 fill-amber-500 dark:fill-amber-400" />
                        {daily.streakDays || 0}d habit streak
                      </span>
                    </div>

                    {/* Persisted Gemini verdict on the last uploaded proof photo.
                      Lives on the quest itself (daily.lastProof), so it stays
                      visible under the card until the day resets — not just
                      a one-time toast. */}
                    {daily.lastProof?.description && (
                      <div className="flex items-start gap-1.5 mt-1.5 max-w-md">
                        <Bot className="w-3.5 h-3.5 text-violet-500 dark:text-violet-400 shrink-0 mt-0.5" />
                        <p className="text-[11px] leading-snug text-slate-500 dark:text-slate-400">
                          <span className="font-semibold text-violet-600 dark:text-violet-300">
                            AI verdict:
                          </span>{' '}
                          {daily.lastProof.description}
                          {Number.isFinite(daily.lastProof.score) && (
                            <span className="inline-flex items-center gap-0.5 ml-1.5 px-1.5 py-0.5 rounded bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300 font-bold">
                              <Star className="w-2.5 h-2.5 fill-current" />
                              {daily.lastProof.score}/10
                            </span>
                          )}
                          {daily.lastProof.bonusXp > 0 && (
                            <span className="ml-1.5 text-emerald-600 dark:text-emerald-400 font-bold">
                              +{daily.lastProof.bonusXp} bonus XP
                            </span>
                          )}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div
                  className="flex items-center gap-2 shrink-0"
                  // Belt-and-suspenders: stop ANY click inside this action
                  // cluster (including the input's own programmatic click,
                  // see below) from bubbling up to the row's toggle handler.
                  onClick={(e) => e.stopPropagation()}
                >
                  {!daily.isCompletedToday && (
                    <>
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        className="hidden"
                        ref={(el) => (fileInputRefs.current[daily.id] = el)}
                        // Calling .click() on this input imperatively (below)
                        // dispatches a real click event that BUBBLES UP through
                        // the row div just like a normal click would — that
                        // stray bubble was the "over-click" bug marking the
                        // quest complete without proof. Stop it right here.
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => handleProofFileChange(e, daily)}
                      />
                      <button
                        type="button"
                        title="Upload a proof photo — still awards XP + Gold, and keeps your streak"
                        onClick={(e) => handleAttachProofClick(e, daily.id)}
                        disabled={uploadingId === daily.id}
                        className="btn-tactile flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-cyan-300 dark:border-cyan-500/40 bg-cyan-50 dark:bg-cyan-900/30 hover:bg-cyan-100 dark:hover:bg-cyan-900/50 text-cyan-700 dark:text-cyan-300 text-[11px] font-bold transition-colors disabled:opacity-60"
                      >
                        {uploadingId === daily.id ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Verifying…</span>
                          </>
                        ) : (
                          <>
                            <Camera className="w-3.5 h-3.5" />
                            <span>Proof</span>
                          </>
                        )}
                      </button>
                    </>
                  )}
                  <span
                    className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg"
                    style={{ backgroundColor: `${domainConfig.color}20`, color: domainConfig.color }}
                  >
                    +{daily.xpReward} XP
                  </span>
                  <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300">
                    +{daily.goldReward}g
                  </span>
                </div>
              </div>

              {rejection && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-start gap-2 px-4 py-2.5 border-t border-rose-200 dark:border-rose-500/30 bg-rose-50 dark:bg-rose-950/40"
                >
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-500 dark:text-rose-400 shrink-0 mt-0.5" />
                  <p className="text-[11px] leading-snug text-rose-600 dark:text-rose-300 flex-1">
                    <span className="font-semibold">Not accepted:</span> {rejection.message}
                  </p>
                  <button
                    type="button"
                    onClick={() => dismissRejection(daily.id)}
                    className="text-rose-400 hover:text-rose-600 dark:hover:text-rose-200 shrink-0"
                    title="Dismiss"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}