import React, { useState } from 'react';
import { Search, Sparkles, AlertCircle, Zap, ArrowRight } from 'lucide-react';
import { soundService } from '../services/soundService';

export default function OverwhelmedHero({ 
  username, 
  onTriggerDecompose, 
  onTriggerFeelStuck 
}) {
  const [taskInput, setTaskInput] = useState('');

  const suggestedTasks = [
    { text: 'Study 3 chapters of Distributed Systems', domain: 'mental' },
    { text: 'Full 30-min leg workout and mobility', domain: 'health' },
    { text: 'Build production REST API with Node & Mongo', domain: 'skill' },
    { text: 'Deep clean bedroom and declutter desk', domain: 'health' }
  ];

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (!taskInput.trim()) return;
    soundService.playClick();
    onTriggerDecompose(taskInput.trim());
    setTaskInput(''); // clear search bar after submitting
  };

  const handleSuggestionClick = (text) => {
    soundService.playClick();
    onTriggerDecompose(text);
   
  };

  return (
    <section className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-slate-50 via-white to-slate-100 dark:from-rpg-card/90 dark:via-rpg-panel dark:to-rpg-darkest border border-slate-200 dark:border-rpg-border p-6 sm:p-10 text-center shadow-md dark:shadow-xl transition-colors duration-200">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-0 right-1/4 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-600 dark:text-cyan-300 text-xs sm:text-sm font-medium mb-4">
        <Sparkles className="w-4 h-4 text-cyan-500 dark:text-cyan-400" />
        <span>Hi, <strong className="text-slate-900 dark:text-white font-semibold">{username || 'Adventurer'}</strong></span>
        <span className="text-cyan-500">•</span>
        <span className="text-slate-500 dark:text-slate-400">Ready to level up your reality?</span>
      </div>

      <h2 className="text-2xl sm:text-4xl md:text-5xl font-heading font-extrabold tracking-tight text-slate-900 dark:text-white mb-3 max-w-2xl mx-auto">
        What's overwhelming you <span className="bg-gradient-to-r from-cyan-500 via-teal-400 to-indigo-500 bg-clip-text text-transparent">today?</span>
      </h2>
      <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base max-w-xl mx-auto mb-8 font-light">
        Drop your mountain here. The AI Quest Engine will break it down into bite-sized dopamine victories with XP and Gold rewards.
      </p>

      <form onSubmit={handleSubmit} className="max-w-2xl mx-auto mb-5 relative">
        <div className="relative flex items-center shadow-lg dark:shadow-2xl rounded-2xl overflow-hidden border-2 border-slate-300 dark:border-rpg-border focus-within:border-cyan-500 dark:focus-within:border-cyan-400/80 transition-all duration-200 bg-white dark:bg-slate-900/90">
          <div className="pl-4 sm:pl-5 text-cyan-500 dark:text-cyan-400 pointer-events-none">
            <Search className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <input
            type="text"
            value={taskInput}
            onChange={(e) => setTaskInput(e.target.value)}
            placeholder="e.g. Study 3 chapters for my exam, or Clean the whole house..."
            className="w-full py-4 px-3.5 sm:px-4 bg-transparent text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-sm sm:text-base focus:outline-none"
          />
          <div className="pr-2 sm:pr-3">
            <button
              type="submit"
              disabled={!taskInput.trim()}
              className="btn-tactile px-4 sm:px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold text-xs sm:text-sm flex items-center gap-1.5 disabled:opacity-40 disabled:pointer-events-none shadow-glow-mental hover:from-cyan-400 hover:to-blue-500 transition-all"
            >
              <span>Decompose</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </form>
      <div className="flex items-center justify-center gap-3 mb-6">
        <button
          type="button"
          onClick={() => {
            soundService.playStuckChime();
            onTriggerFeelStuck();
          }}
          className="btn-tactile group px-5 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-red-500/10 dark:from-amber-500/20 dark:via-orange-500/20 dark:to-red-500/20 border-2 border-amber-400 dark:border-amber-500/40 hover:border-amber-500 text-amber-700 dark:text-amber-300 hover:text-amber-800 dark:hover:text-amber-200 text-sm font-semibold flex items-center gap-2.5 shadow-sm dark:shadow-glow-gold transition-all"
        >
          <div className="w-2.5 h-2.5 rounded-full bg-amber-500 dark:bg-amber-400 animate-ping" />
          <AlertCircle className="w-4 h-4 text-amber-500 dark:text-amber-400 group-hover:rotate-12 transition-transform" />
          <span>Feel Stuck?</span>
          <span className="text-xs text-amber-600 dark:text-amber-400/70 font-normal hidden sm:inline">
            (Instant Mind Reboot & Micro-steps)
          </span>
        </button>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2 max-w-2xl mx-auto">
        <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mr-1">
          <Zap className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" /> Or try:
        </span>
        {suggestedTasks.map((t, idx) => (
          <button
            key={idx}
            onClick={() => handleSuggestionClick(t.text)}
            className="text-xs px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-rpg-card hover:bg-slate-200 dark:hover:bg-rpg-cardHover text-slate-700 dark:text-slate-300 hover:text-cyan-600 dark:hover:text-cyan-300 border border-slate-200 dark:border-rpg-border hover:border-cyan-400 transition-colors truncate max-w-[240px]"
          >
            {t.text}
          </button>
        ))}
      </div>
    </section>
  );
}
