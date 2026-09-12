import React, { useState } from "react";
import {
  ShoppingBag,
  Coins,
  Sparkles,
  Package,
  Check,
  Loader2,
  FlaskConical,
  Gem,
} from "lucide-react";
import confetti from "canvas-confetti";
import { soundService } from "../services/soundService";

export default function StoreView({ user, storeItems, onBuyItem, onUseItem }) {
  const [activeSubTab, setActiveSubTab] = useState("catalog");
  const [purchasingId, setPurchasingId] = useState(null);
  const userGold = user.character?.gold || 0;
  const userGems = user.character?.gems || 0;
  const inventory = user.inventory || [];

  const handleBuy = async (item) => {
    const costGold = item.costGold || 0;
    const costGems = item.costGems || 0;

    if (userGold < costGold || userGems < costGems) {
      const missing = [];

      if (userGold < costGold) {
        missing.push(`${costGold} Gold (you have ${userGold})`);
      }

      if (userGems < costGems) {
        missing.push(`${costGems} Gems (you have ${userGems})`);
      }

      alert(`Not enough currency! You need ${missing.join(" and ")}.`);
      return;
    }

    try {
      setPurchasingId(item.id);
      await onBuyItem(item);
      soundService?.play?.("purchase");
      confetti({
        particleCount: 70,
        spread: 60,
        startVelocity: 32,
        origin: { y: 0.7 },
        colors: ["#f59e0b", "#fbbf24", "#a855f7", "#22d3ee"],
      });
    } finally {
      setPurchasingId(null);
    }
  };

  const getRarityBadge = (rarity) => {
    switch (rarity) {
      case "legendary":
        return "bg-amber-500/20 text-amber-800 dark:text-amber-300 border-amber-400 dark:border-amber-500/40";
      case "epic":
        return "bg-purple-500/20 text-purple-800 dark:text-purple-300 border-purple-400 dark:border-purple-500/40";
      case "rare":
        return "bg-cyan-500/20 text-cyan-800 dark:text-cyan-300 border-cyan-400 dark:border-cyan-500/40";
      default:
        return "bg-slate-200 dark:bg-slate-700/40 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600";
    }
  };

  const getRarityAccent = (rarity) => {
    switch (rarity) {
      case "legendary":
        return "from-amber-400 via-yellow-300 to-amber-400";
      case "epic":
        return "from-purple-400 via-fuchsia-300 to-purple-400";
      case "rare":
        return "from-cyan-400 via-sky-300 to-cyan-400";
      default:
        return "from-slate-300 via-slate-200 to-slate-300 dark:from-slate-600 dark:via-slate-500 dark:to-slate-600";
    }
  };

  const getRarityGlow = (rarity) => {
    switch (rarity) {
      case "legendary":
        return "hover:shadow-[0_0_24px_-6px_rgba(245,158,11,0.55)] hover:border-amber-400";
      case "epic":
        return "hover:shadow-[0_0_24px_-6px_rgba(168,85,247,0.5)] hover:border-purple-400";
      case "rare":
        return "hover:shadow-[0_0_24px_-6px_rgba(34,211,238,0.5)] hover:border-cyan-400";
      default:
        return "hover:shadow-lg hover:border-slate-400 dark:hover:border-slate-500";
    }
  };

  const getInventoryIcon = (type) => {
    switch (type) {
      case "potion":
        return FlaskConical;
      case "relic":
        return Gem;
      default:
        return Package;
    }
  };

  return (
    <div className="space-y-6 transition-colors duration-200">
      <style>{`
        @keyframes storeItemIn {
          from { opacity: 0; transform: translateY(10px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .store-item-in {
          animation: storeItemIn 0.35s cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        @keyframes gentleFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
        .store-float {
          animation: gentleFloat 3s ease-in-out infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .store-item-in { animation: none; }
          .store-float { animation: none; }
        }
      `}</style>

      {/* Store Header Banner */}
      <div className="relative overflow-hidden flex flex-col lg:flex-row lg:items-center justify-between gap-5 p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-amber-100 via-yellow-50 to-amber-100 dark:from-amber-950/40 dark:via-rpg-card dark:to-yellow-950/30 border border-amber-200 dark:border-amber-500/30 shadow-sm">
        <div className="pointer-events-none absolute -top-12 -right-12 w-48 h-48 rounded-full bg-amber-300/25 dark:bg-amber-500/10 blur-3xl" />

        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-500/30">
              The Grand Armory
            </span>
            <span className="hidden sm:inline text-xs text-slate-500 dark:text-slate-400">
              Virtual Perks, Buffs & Badges
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-heading font-extrabold text-slate-900 dark:text-white">
            Store & Rewards
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-md">
            Exchange your hard-earned gold for real game boosts, cosmetics,
            and streak insurance.
          </p>
        </div>

        <div className="relative z-10 flex flex-col items-stretch sm:items-end gap-3">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-300 dark:border-amber-500/40 shadow-sm">
              <Coins className="w-4 h-4 text-amber-500 dark:text-amber-400 fill-amber-500 dark:fill-amber-400" />
              <span className="text-base font-heading font-extrabold text-amber-800 dark:text-amber-300 tabular-nums">
                {userGold}
              </span>
              <span className="text-[10px] font-semibold uppercase text-amber-700/70 dark:text-amber-400/60">
                Gold
              </span>
            </div>
            <div className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-50 dark:bg-purple-500/10 border border-purple-300 dark:border-purple-500/40 shadow-sm">
              <Sparkles className="w-4 h-4 text-purple-500 dark:text-purple-400" />
              <span className="text-base font-heading font-extrabold text-purple-700 dark:text-purple-300 tabular-nums">
                {userGems}
              </span>
              <span className="text-[10px] font-semibold uppercase text-purple-600/70 dark:text-purple-400/60">
                Gems
              </span>
            </div>
          </div>

          <div className="flex items-stretch gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-rpg-border w-full sm:w-auto">
            <button
              onClick={() => setActiveSubTab("catalog")}
              className={`flex-1 sm:flex-none whitespace-nowrap px-4 py-2 rounded-lg text-xs font-bold transition-all duration-200 flex items-center justify-center gap-1.5 ${activeSubTab === "catalog"
                  ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
            >
              <ShoppingBag
                className={`w-3.5 h-3.5 shrink-0 transition-colors duration-200 ${activeSubTab === "catalog"
                    ? "text-amber-500 dark:text-amber-400"
                    : "text-slate-400 dark:text-slate-500"
                  }`}
              />
              <span>Shop Catalog</span>
            </button>
            <button
              onClick={() => setActiveSubTab("inventory")}
              className={`flex-1 sm:flex-none whitespace-nowrap px-4 py-2 rounded-lg text-xs font-bold transition-all duration-200 flex items-center justify-center gap-1.5 ${activeSubTab === "inventory"
                  ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
            >
              <Package
                className={`w-3.5 h-3.5 shrink-0 transition-colors duration-200 ${activeSubTab === "inventory"
                    ? "text-amber-500 dark:text-amber-400"
                    : "text-slate-400 dark:text-slate-500"
                  }`}
              />
              <span>Inventory ({inventory.length})</span>
            </button>
          </div>
        </div>
      </div>

      {activeSubTab === "catalog" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {storeItems.map((item, idx) => {
            const canAfford =
              userGold >= (item.costGold || 0) &&
              userGems >= (item.costGems || 0);
            const alreadyOwned = inventory.some(
              (inv) => inv.itemId === item.id && item.type !== "potion",
            );
            const isPurchasing = purchasingId === item.id;

            return (
              <div
                key={item.id}
                style={{ animationDelay: `${Math.min(idx, 8) * 45}ms` }}
                className={`store-item-in group overflow-hidden rounded-2xl bg-white dark:bg-rpg-card border border-slate-200 dark:border-rpg-border transition-all duration-300 ease-out hover:-translate-y-1 flex flex-col justify-between shadow-sm dark:shadow-none ${getRarityGlow(item.rarity)}`}
              >
                <div
                  className={`h-1 w-full bg-gradient-to-r ${getRarityAccent(item.rarity)}`}
                />

                <div className="p-5 flex-1">
                  <div className="flex items-center justify-between mb-3">
                    <span
                      className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${getRarityBadge(item.rarity)}`}
                    >
                      {item.rarity}
                    </span>
                    <div className="flex flex-col items-end gap-1 text-xs font-mono font-bold">
                      {item.costGold > 0 && (
                        <div className="flex items-center gap-1 text-amber-700 dark:text-amber-300">
                          <Coins className="w-4 h-4 text-amber-500 dark:text-amber-400 fill-amber-500 dark:fill-amber-400" />
                          <span>{item.costGold}g</span>
                        </div>
                      )}

                      {item.costGems > 0 && (
                        <div className="flex items-center gap-1 text-purple-700 dark:text-purple-300">
                          <Sparkles className="w-4 h-4 text-purple-500 dark:text-purple-400" />
                          <span>{item.costGems} gems</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <h4 className="font-heading font-bold text-base text-slate-900 dark:text-white mb-1">
                    {item.name}
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-3">
                    {item.description}
                  </p>

                  <div className="p-2 rounded-lg bg-cyan-50/50 dark:bg-slate-900/80 border border-cyan-100 dark:border-slate-800 text-xs font-medium text-cyan-800 dark:text-cyan-300 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                    <span>{item.effectText}</span>
                  </div>
                </div>

                <div className="p-5 pt-0 flex items-center gap-3">
                  <div
                    className={`shrink-0 w-11 h-11 rounded-xl bg-gradient-to-br ${getRarityAccent(item.rarity)} flex items-center justify-center shadow-sm ring-1 ring-black/5`}
                  >
                    <ShoppingBag className="w-5 h-5 text-white drop-shadow-sm" />
                  </div>
                  <button
                    onClick={() => handleBuy(item)}
                    disabled={!canAfford || alreadyOwned || isPurchasing}
                    className={`btn-tactile flex-1 min-w-0 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all duration-200 ${alreadyOwned
                        ? "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed border border-slate-200 dark:border-slate-700"
                        : canAfford
                          ? "bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 shadow-sm dark:shadow-glow-gold hover:scale-[1.02] active:scale-95"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed border border-slate-200 dark:border-slate-700"
                      }`}
                  >
                    {alreadyOwned ? (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Already Acquired</span>
                      </>
                    ) : isPurchasing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Acquiring...</span>
                      </>
                    ) : (
                      <>
                        <ShoppingBag className="w-4 h-4" />
                        <span>
                          {canAfford ? (
                            <>
                              Acquire for{" "}
                              {item.costGold > 0 && `${item.costGold}g`}
                              {item.costGold > 0 && item.costGems > 0 && " + "}
                              {item.costGems > 0 && `${item.costGems} gems`}
                            </>
                          ) : (
                            "Need More Currency"
                          )}
                        </span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {activeSubTab === "inventory" && (
        <div className="space-y-4">
          {inventory.length === 0 ? (
            <div className="p-10 rounded-2xl bg-white dark:bg-rpg-card border border-slate-200 dark:border-rpg-border text-center text-slate-500 dark:text-slate-400 shadow-sm store-item-in">
              <Package className="store-float w-10 h-10 mx-auto text-slate-400 dark:text-slate-600 mb-2" />
              <p className="text-sm font-semibold text-slate-900 dark:text-white">
                Your inventory is currently empty
              </p>
              <p className="text-xs mt-1">
                Conquer quests to earn gold and purchase items from the shop!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {inventory.map((inv, idx) => {
                const InvIcon = getInventoryIcon(inv.type);
                return (
                  <div
                    key={idx}
                    style={{ animationDelay: `${Math.min(idx, 8) * 45}ms` }}
                    className="store-item-in p-4 rounded-2xl bg-white dark:bg-rpg-card border border-slate-200 dark:border-rpg-border flex items-center justify-between shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400">
                        <InvIcon className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                          {inv.name}
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Quantity: {inv.quantity || 1}
                        </p>
                      </div>
                    </div>
                    {["potion", "relic"].includes(inv.type) ? (
                      <button
                        onClick={() => onUseItem(inv)}
                        className="px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition-all duration-200 hover:scale-105 active:scale-95"
                      >
                        Use
                      </button>
                    ) : (
                      <span className="text-xs px-2.5 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/30 font-semibold">
                        Acquired
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}