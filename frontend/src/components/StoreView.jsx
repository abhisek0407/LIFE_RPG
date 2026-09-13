import React, { useMemo, useState } from "react";
import {
  ShoppingBag,
  Coins,
  Sparkles,
  Package,
  Check,
  Loader2,
  FlaskConical,
  Gem,
  Trophy,
  Shirt,
  Wand2,
  Search,
  X,
  Flame,
  Droplet,
  Mountain,
  Wind,
  Moon,
  Sun,
  Leaf,
  Brain,
  Hourglass,
  ArrowUpDown,
} from "lucide-react";
import confetti from "canvas-confetti";
import { soundService } from "../services/soundService";

// Types/schools that can be purchased and held in multiples rather than a
// single one-time acquisition (e.g. potions get used up, so you can own several).
// Magic powers ("power") are one-time unlocks, so they're deliberately excluded.
const STACKABLE_TYPES = ["potion", "boost", "consumable"];

// Every item is grouped/filtered by "category" — its school for magic
// powers, or its type for older item kinds (potion/relic/etc). This is the
// single lookup both the catalog and inventory use for label + icon.
const CATEGORY_META = {
  // magic power schools
  fire: { label: "Fire", Icon: Flame },
  water: { label: "Water", Icon: Droplet },
  earth: { label: "Earth", Icon: Mountain },
  air: { label: "Air", Icon: Wind },
  arcane: { label: "Arcane", Icon: Sparkles },
  shadow: { label: "Shadow", Icon: Moon },
  holy: { label: "Holy", Icon: Sun },
  nature: { label: "Nature", Icon: Leaf },
  mind: { label: "Mind", Icon: Brain },
  time: { label: "Time", Icon: Hourglass },
  // legacy item types
  potion: { label: "Potions", Icon: FlaskConical },
  relic: { label: "Relics", Icon: Gem },
  cosmetic: { label: "Cosmetics", Icon: Shirt },
  badge: { label: "Badges", Icon: Trophy },
  boost: { label: "Boosts", Icon: Wand2 },
};
const DEFAULT_CATEGORY = { label: "Other", Icon: Package };

function getItemIdentity(item) {
  if (!item) return null;
  return item.id ?? item._id ?? item.itemId ?? item.name ?? null;
}

// The key used for filtering/grouping — school takes priority (magic
// powers), falling back to type for older item shapes.
function categoryKey(item) {
  return item.school || item.type || "other";
}

function getCategoryMeta(key) {
  return CATEGORY_META[key] || DEFAULT_CATEGORY;
}

const RARITY_ORDER = { legendary: 0, epic: 1, rare: 2, common: 3 };
const RARITY_TABS = ["all", "legendary", "epic", "rare", "common"];

function getRarityBadge(rarity) {
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
}

function getRarityAccent(rarity) {
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
}

function getRarityGlow(rarity) {
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
}

// Item "art" tile — a real image if the item data provides one
// (item.imageUrl), otherwise a themed medallion: the item's emoji set on a
// rarity-colored glow with a soft ring, so every power reads as a distinct
// little icon rather than a generic placeholder box.
function ItemArt({ item, size = "lg" }) {
  const key = categoryKey(item);
  const { Icon } = getCategoryMeta(key);
  const dims = size === "lg" ? "h-28" : "h-16 w-16 rounded-xl shrink-0";
  const medallionSize = size === "lg" ? "w-16 h-16" : "w-11 h-11";
  const emojiSize = size === "lg" ? "text-3xl" : "text-xl";
  const iconSize = size === "lg" ? "w-8 h-8" : "w-5 h-5";

  if (item.imageUrl) {
    return (
      <div className={`relative ${dims} w-full overflow-hidden ${size === "sm" ? "rounded-xl" : ""}`}>
        <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
      </div>
    );
  }

  return (
    <div
      className={`relative ${dims} w-full flex items-center justify-center bg-gradient-to-br ${getRarityAccent(item.rarity)} overflow-hidden ${size === "sm" ? "rounded-xl" : ""}`}
    >
      <div className="absolute inset-0 opacity-25 bg-[radial-gradient(circle_at_30%_20%,white,transparent_60%)]" />
      <div
        className={`relative ${medallionSize} rounded-full bg-white/15 backdrop-blur-[1px] ring-1 ring-white/40 flex items-center justify-center shadow-inner`}
      >
        {item.icon ? (
          <span className={`${emojiSize} drop-shadow-sm`}>{item.icon}</span>
        ) : (
          <Icon className={`${iconSize} text-white drop-shadow-md`} strokeWidth={1.75} />
        )}
      </div>
    </div>
  );
}

function FilterChips({ options, active, onChange }) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1 -mx-1 px-1">
      {options.map((opt) => {
        const isActive = active === opt.key;
        const Icon = opt.Icon;
        return (
          <button
            key={opt.key}
            onClick={() => onChange(opt.key)}
            className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-all duration-200 ${
              isActive
                ? "bg-amber-500 border-amber-500 text-slate-950 shadow-sm"
                : "bg-white dark:bg-slate-900 border-slate-200 dark:border-rpg-border text-slate-600 dark:text-slate-400 hover:border-amber-300 dark:hover:border-amber-500/50"
            }`}
          >
            {Icon && <Icon className="w-3.5 h-3.5" />}
            <span>{opt.label}</span>
            {typeof opt.count === "number" && (
              <span className={isActive ? "text-slate-900/60" : "text-slate-400 dark:text-slate-600"}>
                {opt.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export default function StoreView({ user, storeItems, onBuyItem, onUseItem }) {
  const [activeSubTab, setActiveSubTab] = useState("catalog");
  const [purchasingId, setPurchasingId] = useState(null);
  const [catalogCategory, setCatalogCategory] = useState("all");
  const [catalogRarity, setCatalogRarity] = useState("all");
  const [catalogSearch, setCatalogSearch] = useState("");
  const [catalogSort, setCatalogSort] = useState("rarity");
  const [inventoryCategory, setInventoryCategory] = useState("all");

  const userGold = user.character?.gold || 0;
  const userGems = user.character?.gems || 0;
  const inventory = user.inventory || [];

  // --- Inventory grouping fix -------------------------------------------------
  // If the backend appends a separate inventory row per purchase (rather than
  // incrementing a shared quantity), the list would show a duplicate row per
  // buy — or in some data shapes, only the most recent row at all. Grouping
  // by item identity here guarantees the UI always reflects the true total,
  // regardless of how purchases are stored upstream.
  const groupedInventory = useMemo(() => {
    const map = new Map();
    inventory.forEach((inv) => {
      const key = getItemIdentity(inv);
      if (!key) return;
      if (map.has(key)) {
        const existing = map.get(key);
        existing.quantity = (existing.quantity || 1) + (inv.quantity || 1);
      } else {
        map.set(key, { ...inv, quantity: inv.quantity || 1, itemId: getItemIdentity(inv) });
      }
    });
    return Array.from(map.values());
  }, [inventory]);

  const totalItemCount = groupedInventory.reduce((sum, inv) => sum + (inv.quantity || 1), 0);
  const ownedIds = useMemo(
    () => new Set(inventory.map((inv) => getItemIdentity(inv)).filter(Boolean)),
    [inventory],
  );

  const catalogCategories = useMemo(() => {
    const counts = new Map();
    storeItems.forEach((item) => {
      const key = categoryKey(item);
      counts.set(key, (counts.get(key) || 0) + 1);
    });
    const cats = Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([key, count]) => ({ key, label: getCategoryMeta(key).label, Icon: getCategoryMeta(key).Icon, count }));
    return [{ key: "all", label: "All", Icon: ShoppingBag, count: storeItems.length }, ...cats];
  }, [storeItems]);

  const rarityOptions = useMemo(() => {
    return RARITY_TABS.map((r) => ({
      key: r,
      label: r === "all" ? "All Rarities" : r[0].toUpperCase() + r.slice(1),
      count: r === "all" ? storeItems.length : storeItems.filter((i) => i.rarity === r).length,
    }));
  }, [storeItems]);

  const inventoryCategories = useMemo(() => {
    const counts = new Map();
    groupedInventory.forEach((inv) => {
      const key = categoryKey(inv);
      counts.set(key, (counts.get(key) || 0) + 1);
    });
    const cats = Array.from(counts.entries()).map(([key, count]) => ({
      key,
      label: getCategoryMeta(key).label,
      Icon: getCategoryMeta(key).Icon,
      count,
    }));
    return [{ key: "all", label: "All", Icon: Package, count: groupedInventory.length }, ...cats];
  }, [groupedInventory]);

  const filteredStoreItems = useMemo(() => {
    const query = catalogSearch.trim().toLowerCase();
    let items = storeItems.filter((item) => {
      const matchesCategory = catalogCategory === "all" || categoryKey(item) === catalogCategory;
      const matchesRarity = catalogRarity === "all" || item.rarity === catalogRarity;
      const matchesQuery =
        !query ||
        item.name?.toLowerCase().includes(query) ||
        item.description?.toLowerCase().includes(query);
      return matchesCategory && matchesRarity && matchesQuery;
    });

    items = [...items].sort((a, b) => {
      if (catalogSort === "priceLow") return (a.costGold || 0) - (b.costGold || 0);
      if (catalogSort === "priceHigh") return (b.costGold || 0) - (a.costGold || 0);
      if (catalogSort === "name") return (a.name || "").localeCompare(b.name || "");
      // default: rarity (legendary first), then cheapest first within a tier
      const rarityDiff = (RARITY_ORDER[a.rarity] ?? 9) - (RARITY_ORDER[b.rarity] ?? 9);
      return rarityDiff !== 0 ? rarityDiff : (a.costGold || 0) - (b.costGold || 0);
    });

    return items;
  }, [storeItems, catalogCategory, catalogRarity, catalogSearch, catalogSort]);

  const filteredInventory = useMemo(() => {
    return groupedInventory.filter(
      (inv) => inventoryCategory === "all" || categoryKey(inv) === inventoryCategory,
    );
  }, [groupedInventory, inventoryCategory]);

  const handleBuy = async (item) => {
    const costGold = item.costGold || 0;
    const costGems = item.costGems || 0;

    if (userGold < costGold || userGems < costGems) {
      const missing = [];
      if (userGold < costGold) missing.push(`${costGold} Gold (you have ${userGold})`);
      if (userGems < costGems) missing.push(`${costGems} Gems (you have ${userGems})`);
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
              {storeItems.length} Magic Powers to Master
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-heading font-extrabold text-slate-900 dark:text-white">
            Store & Rewards
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-md">
            Exchange your hard-earned gold for magic powers, boosts, and
            cosmetics. Every power you unlock stays with you for good.
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
              className={`flex-1 sm:flex-none whitespace-nowrap px-4 py-2 rounded-lg text-xs font-bold transition-all duration-200 flex items-center justify-center gap-1.5 ${
                activeSubTab === "catalog"
                  ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <ShoppingBag
                className={`w-3.5 h-3.5 shrink-0 transition-colors duration-200 ${
                  activeSubTab === "catalog" ? "text-amber-500 dark:text-amber-400" : "text-slate-400 dark:text-slate-500"
                }`}
              />
              <span>Shop Catalog</span>
            </button>
            <button
              onClick={() => setActiveSubTab("inventory")}
              className={`flex-1 sm:flex-none whitespace-nowrap px-4 py-2 rounded-lg text-xs font-bold transition-all duration-200 flex items-center justify-center gap-1.5 ${
                activeSubTab === "inventory"
                  ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <Package
                className={`w-3.5 h-3.5 shrink-0 transition-colors duration-200 ${
                  activeSubTab === "inventory" ? "text-amber-500 dark:text-amber-400" : "text-slate-400 dark:text-slate-500"
                }`}
              />
              <span>Inventory ({totalItemCount})</span>
            </button>
          </div>
        </div>
      </div>

      {activeSubTab === "catalog" && (
        <div className="space-y-3">
          {/* School filter */}
          <FilterChips options={catalogCategories} active={catalogCategory} onChange={setCatalogCategory} />

          {/* Rarity + search + sort */}
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
            <FilterChips options={rarityOptions} active={catalogRarity} onChange={setCatalogRarity} />

            <div className="flex gap-2 shrink-0">
              <div className="relative sm:w-56">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  value={catalogSearch}
                  onChange={(e) => setCatalogSearch(e.target.value)}
                  placeholder="Search powers..."
                  className="w-full pl-8 pr-8 py-2 rounded-xl text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-rpg-border text-slate-700 dark:text-slate-300 placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-400/50"
                />
                {catalogSearch && (
                  <button
                    onClick={() => setCatalogSearch("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="relative">
                <ArrowUpDown className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                <select
                  value={catalogSort}
                  onChange={(e) => setCatalogSort(e.target.value)}
                  className="appearance-none pl-7 pr-3 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-rpg-border text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-400/50"
                >
                  <option value="rarity">Rarity</option>
                  <option value="priceLow">Price: Low to High</option>
                  <option value="priceHigh">Price: High to Low</option>
                  <option value="name">Name (A-Z)</option>
                </select>
              </div>
            </div>
          </div>

          {filteredStoreItems.length === 0 ? (
            <div className="p-10 rounded-2xl bg-white dark:bg-rpg-card border border-slate-200 dark:border-rpg-border text-center text-slate-500 dark:text-slate-400 shadow-sm">
              <ShoppingBag className="w-10 h-10 mx-auto text-slate-400 dark:text-slate-600 mb-2" />
              <p className="text-sm font-semibold text-slate-900 dark:text-white">No powers match your search</p>
              <p className="text-xs mt-1">Try a different school, rarity, or search term.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredStoreItems.map((item, idx) => {
                const itemKey = getItemIdentity(item);
                const canAfford = userGold >= (item.costGold || 0) && userGems >= (item.costGems || 0);
                const alreadyOwned = !STACKABLE_TYPES.includes(item.type) && !!itemKey && ownedIds.has(itemKey);
                const isPurchasing = purchasingId === itemKey;

                return (
                  <div
                    key={itemKey ?? `${item.name}-${idx}`}
                    style={{ animationDelay: `${Math.min(idx, 8) * 45}ms` }}
                    className={`store-item-in group overflow-hidden rounded-2xl bg-white dark:bg-rpg-card border border-slate-200 dark:border-rpg-border transition-all duration-300 ease-out hover:-translate-y-1 flex flex-col justify-between shadow-sm dark:shadow-none ${getRarityGlow(item.rarity)}`}
                  >
                    <div className="relative">
                      <ItemArt item={item} size="lg" />
                      <span
                        className={`absolute top-2 left-2 text-[10px] uppercase font-bold px-2 py-0.5 rounded border backdrop-blur-sm ${getRarityBadge(item.rarity)}`}
                      >
                        {item.rarity}
                      </span>
                      <div className="absolute top-2 right-2 flex flex-col items-end gap-1 text-[11px] font-mono font-bold">
                        {item.costGold > 0 && (
                          <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-black/50 text-amber-300 backdrop-blur-sm">
                            <Coins className="w-3 h-3 fill-amber-400 text-amber-400" />
                            <span>{item.costGold}g</span>
                          </div>
                        )}
                        {item.costGems > 0 && (
                          <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-black/50 text-purple-300 backdrop-blur-sm">
                            <Sparkles className="w-3 h-3" />
                            <span>{item.costGems}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="p-5 flex-1">
                      <div className="flex items-center gap-1.5 mb-1.5">
                        {React.createElement(getCategoryMeta(categoryKey(item)).Icon, {
                          className: "w-3 h-3 text-slate-400 dark:text-slate-500",
                        })}
                        <span className="text-[10px] uppercase font-bold tracking-wide text-slate-400 dark:text-slate-500">
                          {getCategoryMeta(categoryKey(item)).label}
                        </span>
                      </div>
                      <h4 className="font-heading font-bold text-base text-slate-900 dark:text-white mb-1">
                        {item.name}
                      </h4>
                      <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-3">
                        {item.description}
                      </p>

                      <div className="p-2 rounded-lg bg-cyan-50/50 dark:bg-slate-900/80 border border-cyan-100 dark:border-slate-800 text-xs font-medium text-cyan-800 dark:text-cyan-300 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400 shrink-0" />
                        <span>{item.effectText}</span>
                      </div>
                    </div>

                    <div className="p-5 pt-0">
                      <button
                        onClick={() => handleBuy(item)}
                        disabled={!canAfford || alreadyOwned || isPurchasing}
                        className={`btn-tactile w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all duration-200 ${
                          alreadyOwned
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
                                  Acquire for {item.costGold > 0 && `${item.costGold}g`}
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
        </div>
      )}

      {activeSubTab === "inventory" && (
        <div className="space-y-4">
          {groupedInventory.length > 0 && (
            <FilterChips options={inventoryCategories} active={inventoryCategory} onChange={setInventoryCategory} />
          )}

          {groupedInventory.length === 0 ? (
            <div className="p-10 rounded-2xl bg-white dark:bg-rpg-card border border-slate-200 dark:border-rpg-border text-center text-slate-500 dark:text-slate-400 shadow-sm store-item-in">
              <Package className="store-float w-10 h-10 mx-auto text-slate-400 dark:text-slate-600 mb-2" />
              <p className="text-sm font-semibold text-slate-900 dark:text-white">
                Your Grimoire is empty
              </p>
              <p className="text-xs mt-1">
                Conquer quests to earn gold, then unlock your first power from the catalog.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filteredInventory.map((inv, idx) => {
                const canUse = STACKABLE_TYPES.includes(inv.type);
                return (
                  <div
                    key={inv.itemId || inv.id || inv.name || idx}
                    style={{ animationDelay: `${Math.min(idx, 8) * 45}ms` }}
                    className="store-item-in relative p-4 rounded-2xl bg-white dark:bg-rpg-card border border-slate-200 dark:border-rpg-border flex items-center gap-4 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <div className="relative shrink-0">
                      <ItemArt item={inv} size="sm" />
                      {inv.quantity > 1 && (
                        <span className="absolute -top-1.5 -right-1.5 min-w-[1.25rem] h-5 px-1 rounded-full bg-amber-500 text-slate-950 text-[10px] font-extrabold flex items-center justify-center shadow-sm ring-2 ring-white dark:ring-rpg-card">
                          x{inv.quantity}
                        </span>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">{inv.name}</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {getCategoryMeta(categoryKey(inv)).label}
                        {inv.rarity ? ` · ${inv.rarity[0].toUpperCase()}${inv.rarity.slice(1)}` : ""} · Qty{" "}
                        {inv.quantity || 1}
                      </p>
                    </div>

                    {canUse ? (
                      <button
                        onClick={() => onUseItem?.(inv)}
                        className="shrink-0 px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition-all duration-200 hover:scale-105 active:scale-95"
                      >
                        Use
                      </button>
                    ) : (
                      <span className="shrink-0 text-xs px-2.5 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/30 font-semibold">
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