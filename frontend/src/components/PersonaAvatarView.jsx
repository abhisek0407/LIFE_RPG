import React, { useState } from 'react';
import { 
  Sparkles, 
  Crown, 
  Brain, 
  HeartPulse, 
  Flame, 
  Shield, 
  User, 
  Check, 
  Palette, 
  Quote, 
  Zap, 
  Award,
  ChevronRight,
  RefreshCw,
  Sliders
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { soundService } from '../services/soundService';
import { apiService } from '../services/apiService';
import { calculatePersona, AVATAR_PRESETS, FRAME_PRESETS } from '../services/personaEngine';
import { DOMAINS } from '../services/rpgEngine';

export default function PersonaAvatarView({ user, onUpdateUser, onShowFeedback }) {
  const { domains, character, streak, username } = user;

  const mentalLevel = domains?.mental?.level || 1;
  const healthLevel = domains?.health?.level || 1;
  const skillLevel = domains?.skill?.level || 1;
  const overallLevel = character?.overallLevel || 1;

  // Calculate dynamic persona based on current levels passed
  const persona = calculatePersona({
    mentalLevel,
    healthLevel,
    skillLevel,
    overallLevel
  });

  // Avatar customizer state
  const [selectedAvatarId, setSelectedAvatarId] = useState(
    character?.avatar || 'cyber_paladin'
  );
  const [selectedFrameId, setSelectedFrameId] = useState(
    character?.avatarFrame || 'neon_cyan'
  );
  const [customTitle, setCustomTitle] = useState(
    character?.title || persona.title
  );
  const [customAvatarUrl, setCustomAvatarUrl] = useState(
    character?.avatarUrl || ''
  );
  const [isSaving, setIsSaving] = useState(false);

  // Active selected presets
  const activeAvatarPreset =
    AVATAR_PRESETS.find((p) => p.id === selectedAvatarId) || AVATAR_PRESETS[0];
  const activeFramePreset =
    FRAME_PRESETS.find((f) => f.id === selectedFrameId) || FRAME_PRESETS[0];

  // Save customization via API Service (PATCH /api/users/profile)
  const handleSaveCustomization = async () => {
    setIsSaving(true);
    soundService.playQuestComplete();

    try {
      confetti({
        particleCount: 65,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch (e) {}

    const updatedCharacter = {
      ...character,
      avatar: selectedAvatarId,
      avatarFrame: selectedFrameId,
      avatarUrl: customAvatarUrl || activeAvatarPreset.avatarUrl,
      title: customTitle.trim() || persona.name
    };

    // Call official API endpoint as specified in api_contracts_and_schema.json
    const updatedUser = await apiService.updateUserProfile({
      character: updatedCharacter
    });

    if (onUpdateUser && updatedUser) {
      onUpdateUser(updatedUser);
    }

    if (onShowFeedback) {
      onShowFeedback({
        xp: 0,
        domainName: 'Persona Sync',
        bonusXp: 0,
        gold: 0
      });
    }

    setIsSaving(false);
  };

  // Quick equip Persona name as Title
  const handleAdoptPersonaTitle = () => {
    setCustomTitle(`${persona.name} (${persona.badge})`);
    soundService.playClick();
  };

  return (
    <div className="space-y-8 transition-colors duration-200">
      
      {/* ── 1. Top Identity Announcement Header ── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 via-blue-950 to-slate-900 border-2 border-cyan-500/40 p-6 sm:p-10 text-white shadow-2xl dark:shadow-glow-mental">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-purple-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div className="space-y-3 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-mono font-black uppercase tracking-widest px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 flex items-center gap-1.5">
                <Crown className="w-3.5 h-3.5 text-amber-400" />
                <span>Level-Derived Hero Identity</span>
              </span>
              <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-purple-500/25 text-purple-300 border border-purple-400/40">
                {persona.category}
              </span>
              <span className="text-xs font-mono px-2 py-0.5 rounded text-slate-400">
                Tier {persona.effectiveLevel >= 8 ? 'IV (God)' : persona.effectiveLevel >= 5 ? 'III (Apex)' : persona.effectiveLevel >= 3 ? 'II (Adept)' : 'I (Novice)'}
              </span>
            </div>

            {/* Persona Big Announcement */}
            <div>
              <p className="text-xs uppercase font-mono text-cyan-400 tracking-wider">
                Current Level Designation
              </p>
              <h2 className="text-3xl sm:text-5xl font-heading font-black tracking-tight text-white mt-1 bg-gradient-to-r from-white via-cyan-100 to-amber-200 bg-clip-text text-transparent">
                {persona.name}
              </h2>
              <p className="text-sm sm:text-base font-semibold text-cyan-200 mt-1">
                {persona.title}
              </p>
            </div>

            {/* Persona Iconic Quote */}
            <div className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-white/5 border border-white/10 text-slate-300 text-xs sm:text-sm italic">
              <Quote className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <span>"{persona.quote}"</span>
            </div>

            {/* Persona Traits */}
            <div className="flex flex-wrap gap-2 pt-1">
              {persona.traits.map((trait, idx) => (
                <span
                  key={idx}
                  className="text-xs font-mono font-semibold px-2.5 py-1 rounded-lg bg-slate-800/80 text-slate-200 border border-slate-700 flex items-center gap-1.5"
                >
                  <Zap className="w-3 h-3 text-amber-400" />
                  <span>{trait}</span>
                </span>
              ))}
            </div>
          </div>

          {/* Quick Persona Card preview */}
          <div className="shrink-0 p-5 rounded-3xl bg-white/10 backdrop-blur-md border border-white/20 text-center flex flex-col items-center justify-center min-w-[240px] space-y-3">
            <div className={`relative w-24 h-24 rounded-3xl overflow-hidden p-1 ${activeFramePreset.borderClass}`}>
              <img
                src={customAvatarUrl || activeAvatarPreset.avatarUrl}
                alt={persona.name}
                className="w-full h-full object-cover rounded-2xl"
              />
              <div className="absolute top-1 right-1 px-1.5 py-0.5 rounded bg-amber-500 text-slate-950 font-black text-[10px]">
                Lv.{overallLevel}
              </div>
            </div>

            <div>
              <p className="font-heading font-extrabold text-base text-white">{username || 'Hero'}</p>
              <p className="text-xs text-cyan-300 font-mono font-medium truncate max-w-[200px]">
                {customTitle || persona.name}
              </p>
            </div>

            <button
              onClick={handleAdoptPersonaTitle}
              className="btn-tactile w-full py-2 px-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm"
            >
              <Award className="w-3.5 h-3.5" />
              <span>Equip as Active Title</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── 2. Domain Level Analytics Matrix ── */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-rpg-card border border-slate-200 dark:border-rpg-border shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="font-heading font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
              <Sliders className="w-5 h-5 text-cyan-500" />
              <span>Attributes Shaping Your Persona</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              The AI evaluates your Mental, Health, and Skill progress bars to determine your personality archetype.
            </p>
          </div>

          <span className="text-xs font-mono font-bold px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 self-start sm:self-auto">
            Dominant Build: <strong className="text-cyan-600 dark:text-cyan-400 capitalize">{persona.dominantDomain}</strong>
          </span>
        </div>

        {/* 3 Domain Gauges Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Mental */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-cyan-300 dark:border-cyan-500/30 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-cyan-700 dark:text-cyan-400">
              <span className="flex items-center gap-1.5">
                <Brain className="w-4 h-4" /> Mental Focus
              </span>
              <span className="font-mono">Lv.{mentalLevel} ({persona.mentalPct}%)</span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
              <div className="h-full bg-cyan-500 rounded-full" style={{ width: `${Math.min(100, mentalLevel * 15)}%` }} />
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Powers strategic foresight, pattern deduction, and problem-solving.
            </p>
          </div>

          {/* Health */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-emerald-300 dark:border-emerald-500/30 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-emerald-700 dark:text-emerald-400">
              <span className="flex items-center gap-1.5">
                <HeartPulse className="w-4 h-4" /> Health & Vitality
              </span>
              <span className="font-mono">Lv.{healthLevel} ({persona.healthPct}%)</span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${Math.min(100, healthLevel * 15)}%` }} />
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Fuel for physical grit, cellular resilience, and unbreakable stamina.
            </p>
          </div>

          {/* Skill / Personality */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-purple-300 dark:border-purple-500/30 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-purple-700 dark:text-purple-400">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-4 h-4" /> Skill & Personality
              </span>
              <span className="font-mono">Lv.{skillLevel} ({persona.skillPct}%)</span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
              <div className="h-full bg-purple-500 rounded-full" style={{ width: `${Math.min(100, skillLevel * 15)}%` }} />
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Craft mastery, creative execution, and high-status presence.
            </p>
          </div>
        </div>

        {/* Next Evolution Milestone */}
        {persona.nextPersona && (
          <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border border-amber-300 dark:border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400">
                <Crown className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300">
                  Next Evolution Unlock: {persona.nextPersona.name} ({persona.nextPersona.category})
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Reach Level {persona.nextPersona.minLevel} ({persona.levelsRemainingForNext} more level{persona.levelsRemainingForNext > 1 ? 's' : ''} to unlock "{persona.nextPersona.title}").
                </p>
              </div>
            </div>
            <span className="text-xs font-mono font-bold px-3 py-1 rounded bg-amber-500 text-slate-950 self-start sm:self-auto">
              Unlock at Lv.{persona.nextPersona.minLevel}
            </span>
          </div>
        )}
      </div>

      {/* ── 3. Avatar Customization Studio ── */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-rpg-card border border-slate-200 dark:border-rpg-border shadow-sm space-y-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-500/30">
              Customization Studio
            </span>
            {/* <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">Syncs with /api/users/profile</span> */}
          </div>
          <h3 className="font-heading font-bold text-xl text-slate-900 dark:text-white">
            Customize Your Hero Avatar & Aura
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Select an avatar archetype, configure your luminescent aura frame, and lock in your active character title.
          </p>
        </div>

        {/* Avatar Preset Grid */}
        <div className="space-y-3">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
            <Palette className="w-3.5 h-3.5" /> Select Avatar Preset
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {AVATAR_PRESETS.map((preset) => {
              const isSelected = selectedAvatarId === preset.id;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => {
                    soundService.playClick();
                    setSelectedAvatarId(preset.id);
                    setCustomAvatarUrl(preset.avatarUrl);
                  }}
                  className={`p-3 rounded-2xl border text-left transition-all relative flex flex-col items-center text-center group ${
                    isSelected
                      ? 'border-cyan-500 bg-cyan-50/50 dark:bg-cyan-950/30 shadow-md ring-2 ring-cyan-400/40'
                      : 'border-slate-200 dark:border-rpg-border bg-slate-50 dark:bg-slate-900/50 hover:border-slate-300'
                  }`}
                >
                  <div className="w-14 h-14 rounded-2xl overflow-hidden mb-2 border border-slate-300 dark:border-slate-700">
                    <img src={preset.avatarUrl} alt={preset.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  </div>
                  <span className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                    {preset.name}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono mt-0.5">
                    {preset.category}
                  </span>
                  {isSelected && (
                    <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-cyan-500 text-slate-950 flex items-center justify-center">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Aura / Frame Presets */}
        <div className="space-y-3">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" /> Select Aura Frame Border
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {FRAME_PRESETS.map((frame) => {
              const isSelected = selectedFrameId === frame.id;
              return (
                <button
                  key={frame.id}
                  type="button"
                  onClick={() => {
                    soundService.playClick();
                    setSelectedFrameId(frame.id);
                  }}
                  className={`p-3 rounded-xl border text-left transition-all flex items-center gap-2.5 ${
                    isSelected
                      ? 'border-cyan-500 bg-cyan-50/40 dark:bg-cyan-950/30 font-bold'
                      : 'border-slate-200 dark:border-rpg-border bg-slate-50 dark:bg-slate-900/40 hover:border-slate-300'
                  }`}
                >
                  <span
                    className="w-3.5 h-3.5 rounded-full shrink-0 shadow-sm"
                    style={{ backgroundColor: frame.glowColor }}
                  />
                  <span className="text-xs text-slate-800 dark:text-slate-200 truncate">
                    {frame.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Title & Custom URL Input */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Active Character Title
            </label>
            <input
              type="text"
              value={customTitle}
              onChange={(e) => setCustomTitle(e.target.value)}
              placeholder="e.g. Thomas Shelby (Apex Sigma)"
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-cyan-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Custom Avatar Image URL (Optional)
            </label>
            <input
              type="url"
              value={customAvatarUrl}
              onChange={(e) => setCustomAvatarUrl(e.target.value)}
              placeholder="https://..."
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-cyan-500 font-mono"
            />
          </div>
        </div>

        {/* Save Button */}
        <div className="pt-2 flex justify-end">
          <button
            onClick={handleSaveCustomization}
            disabled={isSaving}
            className="btn-tactile px-6 py-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-glow-mental"
          >
            {isSaving ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Check className="w-4 h-4" />
            )}
            <span>Save Character & Avatar Changes</span>
          </button>
        </div>
      </div>

    </div>
  );
}
