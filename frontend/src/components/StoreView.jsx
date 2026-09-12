import React, { useState } from "react";
import { ShoppingBag, Coins, Sparkles, Package, Check } from "lucide-react";
import confetti from "canvas-confetti";
import { soundService } from "../services/soundService";

export default function StoreView({ user, storeItems, onBuyItem, onUseItem }) {
  const [activeSubTab, setActiveSubTab] = useState("catalog");
  const userGold = user.character?.gold || 0;
  const userGems = user.character?.gems || 0;
  const inventory = user.inventory || [];

  const handleBuy = (item) => {
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

    soundService.playCoin();

    try {
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.6 },
      });
    } catch (e) {}

    onBuyItem(item);
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

  return (
    <div className="space-y-6 transition-colors duration-200">
      {/* Store Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-amber-100 via-yellow-50 to-amber-100 dark:from-amber-950/40 dark:via-rpg-card dark:to-yellow-950/30 border border-amber-200 dark:border-amber-500/30 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-500/30">
              The Grand Armory
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Virtual Perks, Buffs & Badges
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-heading font-extrabold text-slate-900 dark:text-white">
            Store & Rewards
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
            Exchange your hard-earned gold for real game boosts, cosmetics, and
            streak insurance.
          </p>
        </div>
        <div className="flex flex-col sm:items-end gap-3">
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-amber-50 dark:bg-amber-500/10 border border-amber-300 dark:border-amber-500/40 shadow-sm dark:shadow-glow-gold">
            <Coins className="w-5 h-5 text-amber-500 dark:text-amber-400 fill-amber-500 dark:fill-amber-400 animate-pulse" />
            <span className="text-xl font-heading font-extrabold text-amber-800 dark:text-amber-300">
              {userGold}
            </span>
            <span className="text-xs font-semibold text-amber-700 dark:text-amber-400/80 uppercase">
              Gold Available
            </span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-purple-50 dark:bg-purple-500/10 border border-purple-300 dark:border-purple-500/40">
            <Sparkles className="w-5 h-5 text-purple-500 dark:text-purple-400" />

            <span className="text-xl font-heading font-extrabold text-purple-700 dark:text-purple-300">
              {userGems}
            </span>

            <span className="text-xs font-semibold text-purple-600 dark:text-purple-400 uppercase">
              Gems Available
            </span>
          </div>

          <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-rpg-border">
            <button
              onClick={() => setActiveSubTab("catalog")}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                activeSubTab === "catalog"
                  ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              Shop Catalog
            </button>
            <button
              onClick={() => setActiveSubTab("inventory")}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 ${
                activeSubTab === "inventory"
                  ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <Package className="w-3 h-3" />
              <span>Inventory ({inventory.length})</span>
            </button>
          </div>
        </div>
      </div>
      {activeSubTab === "catalog" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {storeItems.map((item) => {
            const canAfford =
              userGold >= (item.costGold || 0) &&
              userGems >= (item.costGems || 0);
            const alreadyOwned = inventory.some(
              (inv) => inv.itemId === item.id && item.type !== "potion",
            );

            return (
              <div
                key={item.id}
                className="p-5 rounded-2xl bg-white dark:bg-rpg-card border border-slate-200 dark:border-rpg-border hover:border-amber-400 transition-all flex flex-col justify-between shadow-sm dark:shadow-none"
              >
                <div>
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

                  <div className="p-2 rounded-lg bg-cyan-50/50 dark:bg-slate-900/80 border border-cyan-100 dark:border-slate-800 text-xs font-medium text-cyan-800 dark:text-cyan-300 flex items-center gap-1.5 mb-4">
                    <Sparkles className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                    <span>{item.effectText}</span>
                  </div>
                </div>

                <button
                  onClick={() => handleBuy(item)}
                  disabled={!canAfford || alreadyOwned}
                  className={`btn-tactile w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                    alreadyOwned
                      ? "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed border border-slate-200 dark:border-slate-700"
                      : canAfford
                        ? "bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 shadow-sm dark:shadow-glow-gold"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed border border-slate-200 dark:border-slate-700"
                  }`}
                >
                  {alreadyOwned ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Already Acquired</span>
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
            );
          })}
        </div>
      )}
      {activeSubTab === "inventory" && (
        <div className="space-y-4">
          {inventory.length === 0 ? (
            <div className="p-10 rounded-2xl bg-white dark:bg-rpg-card border border-slate-200 dark:border-rpg-border text-center text-slate-500 dark:text-slate-400 shadow-sm">
              <Package className="w-10 h-10 mx-auto text-slate-400 dark:text-slate-600 mb-2" />
              <p className="text-sm font-semibold text-slate-900 dark:text-white">
                Your inventory is currently empty
              </p>
              <p className="text-xs mt-1">
                Conquer quests to earn gold and purchase items from the shop!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {inventory.map((inv, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-2xl bg-white dark:bg-rpg-card border border-slate-200 dark:border-rpg-border flex items-center justify-between shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400">
                      <Sparkles className="w-5 h-5" />
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
                      className="px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition"
                    >
                      Use
                    </button>
                  ) : (
                    <span className="text-xs px-2.5 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/30 font-semibold">
                      Acquired
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
