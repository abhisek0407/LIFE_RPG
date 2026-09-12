import React, { useState, useEffect } from 'react';
import { 
  X, 
  Sparkles, 
  Brain, 
  HeartPulse, 
  Plus, 
  Trash2, 
  ArrowRight, 
  CheckCircle2, 
  Layers,
  Cpu,
  Target,
  Lightbulb
} from 'lucide-react';
import { DOMAINS, DIFFICULTY_PRESETS, MOTIVATION_PRESETS } from '../services/rpgEngine';
import { apiService } from '../services/apiService';
import { soundService } from '../services/soundService';

export default function QuestDecompositionModal({
  isOpen,
  onClose,
  initialTask,
  onSaveQuest
}) {
  const [taskName, setTaskName] = useState('');
  const [domain, setDomain] = useState('mental');
  const [difficulty, setDifficulty] = useState('medium');
  const [motivationLevel, setMotivationLevel] = useState('medium');

  const [isGenerated, setIsGenerated] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [analysisPhase, setAnalysisPhase] = useState('');
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [microtasks, setMicrotasks] = useState([]);
  const [newCustomTaskText, setNewCustomTaskText] = useState('');

  useEffect(() => {
    if (isOpen) {
      setTaskName(initialTask || '');
      setIsGenerated(false);
      setIsGenerating(false);
      setAnalysisPhase('');
      setAiAnalysis(null);
      setMicrotasks([]);
      setNewCustomTaskText('');
      
      const lower = (initialTask || '').toLowerCase();
      if (lower.includes('water') || lower.includes('sleep') || lower.includes('cook') || lower.includes('clean') || lower.includes('room') || lower.includes('workout') || lower.includes('gym') || lower.includes('run') || lower.includes('walk')) {
        setDomain('health');
      } else if (lower.includes('code') || lower.includes('build') || lower.includes('design') || lower.includes('art') || lower.includes('resume') || lower.includes('job') || lower.includes('write')) {
        setDomain('skill');
      } else {
        setDomain('mental');
      }
    }
  }, [isOpen, initialTask]);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    if (!taskName.trim()) return;

    soundService.playClick();
    setIsGenerating(true);
    setIsGenerated(false);
    setAnalysisPhase('1/3: Parsing semantic syntax & task scope...');
    await new Promise((r) => setTimeout(r, 450));

    setAnalysisPhase('2/3: Evaluating cognitive friction & user motivation level...');
    await new Promise((r) => setTimeout(r, 550));

    setAnalysisPhase('3/3: Synthesizing bite-sized dopamine milestones...');
    await new Promise((r) => setTimeout(r, 400));

    try {
      const result = await apiService.decomposeTask({
        task: taskName,
        domain,
        difficulty,
        motivationLevel
      });

      if (result?.domain && result.domain !== domain) {
        setDomain(result.domain);
      }

      setAiAnalysis(result.analysis || null);
      setMicrotasks(result.microtasks || []);
      setIsGenerated(true);
      soundService.playQuestComplete();
    } catch (e) {
      console.error(e);
    } finally {
      setIsGenerating(false);
      setAnalysisPhase('');
    }
  };

  const handleAddCustomTask = (e) => {
    e?.preventDefault();
    if (!newCustomTaskText.trim()) return;

    soundService.playClick();
    const newTask = {
      id: `mt_custom_${Date.now()}`,
      title: newCustomTaskText.trim(),
      order: microtasks.length + 1,
      xpReward: 25,
      goldReward: 8,
      isCompleted: false,
      completedAt: null
    };

    setMicrotasks([...microtasks, newTask]);
    setNewCustomTaskText('');
  };

  const handleRemoveMicrotask = (id) => {
    soundService.playClick();
    setMicrotasks(microtasks.filter((m) => m.id !== id));
  };

  const handleAcceptQuest = () => {
    if (microtasks.length === 0) return;

    soundService.playQuestComplete();
    const totalXp = microtasks.reduce((sum, m) => sum + (m.xpReward || 0), 0);
    const totalGold = microtasks.reduce((sum, m) => sum + (m.goldReward || 0), 0);

    const questData = {
      id: `q_${Date.now()}`,
      title: taskName.trim(),
      domain,
      difficulty,
      motivationLevel,
      status: 'active',
      totalXp,
      totalGold,
      earnedXp: 0,
      earnedGold: 0,
      createdAt: new Date().toISOString(),
      microtasks
    };

    onSaveQuest(questData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-white dark:bg-rpg-dark border border-slate-200 dark:border-rpg-border rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden max-h-[92vh] flex flex-col transition-colors duration-200">
        <div className="flex items-start justify-between pb-4 border-b border-slate-200 dark:border-rpg-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-glow-mental">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-xl text-slate-900 dark:text-white">
                Quest Decomposition Forge
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Cognitive parsing transforms your mountain into effortless micro-victories
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
        <div className="overflow-y-auto py-5 space-y-5 pr-1 flex-1">
          
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
              Task Name (Parsed by AI)
            </label>
            <input
              type="text"
              value={taskName}
              onChange={(e) => setTaskName(e.target.value)}
              placeholder="e.g. Drink 3 liters of water, Clean garage, Study 3 chapters of biology..."
              className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900/90 border border-slate-300 dark:border-rpg-border text-slate-900 dark:text-white text-sm font-medium focus:border-cyan-500 dark:focus:border-cyan-400 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
              Domain (Select Attribute to Level Up)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {Object.entries(DOMAINS).map(([key, item]) => {
                const isSelected = domain === key;
                const Icon = key === 'mental' ? Brain : key === 'health' ? HeartPulse : Sparkles;

                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => {
                      soundService.playClick();
                      setDomain(key);
                    }}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'border-cyan-500 dark:border-cyan-400 bg-cyan-50 dark:bg-cyan-500/15 shadow-sm dark:shadow-glow-mental'
                        : 'border-slate-200 dark:border-rpg-border bg-slate-50 dark:bg-rpg-card hover:bg-slate-100 dark:hover:bg-rpg-cardHover'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Icon className="w-4 h-4" style={{ color: item.color }} />
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        {key === 'skill' ? 'Skill / Personality' : item.name}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-tight">
                      {item.subtitle}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
           
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                Difficulty
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {Object.entries(DIFFICULTY_PRESETS).map(([key, diff]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => {
                      soundService.playClick();
                      setDifficulty(key);
                    }}
                    className={`py-2 px-2 rounded-lg text-xs font-semibold border text-center transition-all ${
                      difficulty === key
                        ? 'bg-cyan-500/15 dark:bg-slate-800 text-cyan-700 dark:text-cyan-300 border-cyan-500 dark:border-cyan-400'
                        : 'bg-slate-50 dark:bg-rpg-card text-slate-600 dark:text-slate-400 border-slate-200 dark:border-rpg-border hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    <div>{diff.label}</div>
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">+{diff.xp}XP</div>
                  </button>
                ))}
              </div>
            </div>

        
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                Motivation Level
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {Object.entries(MOTIVATION_PRESETS).map(([key, motiv]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => {
                      soundService.playClick();
                      setMotivationLevel(key);
                    }}
                    className={`py-2 px-2 rounded-lg text-xs font-semibold border text-center transition-all ${
                      motivationLevel === key
                        ? 'bg-amber-500/15 dark:bg-slate-800 text-amber-700 dark:text-amber-300 border-amber-500 dark:border-amber-400'
                        : 'bg-slate-50 dark:bg-rpg-card text-slate-600 dark:text-slate-400 border-slate-200 dark:border-rpg-border hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    <div>{motiv.emoji} {motiv.label.split('/')[0]}</div>
                  </button>
                ))}
              </div>
            </div>

          </div>

          {/* Action: Generate Microtasks Button */}
          <div>
            <button
              type="button"
              onClick={handleGenerate}
              disabled={isGenerating || !taskName.trim()}
              className="btn-tactile w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-cyan-500 via-teal-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-glow-mental disabled:opacity-50"
            >
              <Sparkles className={`w-4 h-4 ${isGenerating ? 'animate-spin' : 'animate-pulse'}`} />
              <span>{isGenerating ? 'Analyzing Task Semantics...' : isGenerated ? 'Regenerate Microtasks' : 'Generate Micro-Tasks'}</span>
            </button>
          </div>

          {isGenerating && (
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/90 border border-cyan-400/40 text-xs text-slate-700 dark:text-slate-300 space-y-2 animate-pulse">
              <div className="flex items-center gap-2 font-bold text-cyan-600 dark:text-cyan-400">
                <Cpu className="w-4 h-4 animate-spin" />
                <span>AI Cognitive Task Analyzer</span>
              </div>
              <p className="font-mono text-[11px] text-slate-600 dark:text-slate-400">
                {analysisPhase || 'Scanning task semantics...'}
              </p>
              <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div className="h-full bg-cyan-500 animate-pulse w-3/4 rounded-full" />
              </div>
            </div>
          )}
          {isGenerated && aiAnalysis && (
            <div className="p-3.5 rounded-2xl bg-cyan-50 dark:bg-cyan-950/20 border border-cyan-300 dark:border-cyan-500/30 text-xs text-slate-800 dark:text-slate-200 space-y-1.5">
              <div className="flex items-center justify-between font-bold text-cyan-700 dark:text-cyan-300">
                <span className="flex items-center gap-1.5">
                  <Target className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                  <span>Category: {aiAnalysis.categoryName}</span>
                </span>
                <span className="text-[10px] font-mono uppercase bg-cyan-200/50 dark:bg-cyan-500/20 px-2 py-0.5 rounded text-cyan-800 dark:text-cyan-300">
                  {aiAnalysis.detectedTarget}
                </span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 flex items-start gap-1">
                <Lightbulb className="w-3 h-3 text-amber-500 shrink-0 mt-0.5" />
                <span><strong>Strategy:</strong> {aiAnalysis.strategy}</span>
              </p>
            </div>
          )}
          {isGenerated && (
            <div className="space-y-3 pt-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" /> Decomposed Microtasks ({microtasks.length} steps)
                </span>
                <span className="text-xs text-amber-600 dark:text-amber-400 font-mono font-bold">
                  Total: +{microtasks.reduce((acc, m) => acc + (m.xpReward || 0), 0)} XP
                </span>
              </div>

              <div className="space-y-2">
                {microtasks.map((step, idx) => (
                  <div
                    key={step.id || idx}
                    className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-700/60 flex items-center justify-between gap-3 text-xs sm:text-sm"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 font-mono text-[11px] flex items-center justify-center font-bold shrink-0">
                        {idx + 1}
                      </span>
                      <span className="text-slate-800 dark:text-slate-200 font-medium leading-relaxed">{step.title}</span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border border-cyan-500/20">
                        +{step.xpReward} XP
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveMicrotask(step.id)}
                        className="text-slate-400 hover:text-red-500 p-1 rounded transition-colors"
                        title="Delete this step"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <form onSubmit={handleAddCustomTask} className="flex gap-2 pt-1">
                <input
                  type="text"
                  value={newCustomTaskText}
                  onChange={(e) => setNewCustomTaskText(e.target.value)}
                  placeholder="+ Add custom microtask to this quest..."
                  className="flex-1 px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
                <button
                  type="submit"
                  disabled={!newCustomTaskText.trim()}
                  className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1 border border-slate-300 dark:border-slate-700 disabled:opacity-40"
                >
                  <Plus className="w-3.5 h-3.5" /> Add
                </button>
              </form>
            </div>
          )}

        </div>
        <div className="pt-4 border-t border-slate-200 dark:border-rpg-border flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => {
              soundService.playClick();
              onClose();
            }}
            className="px-4 py-2.5 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white text-sm font-medium transition-colors"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleAcceptQuest}
            disabled={!isGenerated || microtasks.length === 0}
            className="btn-tactile px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-sm flex items-center gap-2 shadow-glow-health disabled:opacity-40 disabled:pointer-events-none"
          >
            <span>Accept Quest into Log</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
}
