import React, { useState, useEffect } from "react";
import Sidebar from "./components/Sidebar";
import TopNavBar from "./components/TopNavBar";
import OverwhelmedHero from "./components/OverwhelmedHero";
import ActiveQuestsList from "./components/ActiveQuestsList";
import StreakCalendarView from "./components/StreakCalendarView";
import DailyQuestsView from "./components/DailyQuestsView";
import StoreView from "./components/StoreView";
import ActiveQuestsView from "./components/ActiveQuestsView";
import PersonaAvatarView from "./components/PersonaAvatarView";
import QuestDecompositionModal from "./components/QuestDecompositionModal";
import FeelStuckModal from "./components/FeelStuckModal";
import LevelUpModal from "./components/LevelUpModal";
import FloatingFeedback from "./components/FloatingFeedback";
import StreakLoginModal from "./components/StreakLoginModal";
import LoginPage from "./components/LoginPage";
import RegisterPage from "./components/RegisterPage";
import { apiService } from "./services/apiService";
import { storageService } from "./services/storageService";
import { DOMAINS } from "./services/rpgEngine";
import ForgotPasswordPage from "./components/ForgotPasswordPage";
import ResetPasswordPage from "./components/ResetPasswordPage";
export default function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authPage, setAuthPage] = useState("login");
  const [resetToken, setResetToken] = useState("");
  const [quests, setQuests] = useState(() => storageService.getQuests());
  const [dailies, setDailies] = useState(() => storageService.getDailies());
  const [storeItems, setStoreItems] = useState(() =>
    storageService.getStoreItems(),
  );

  const [activeTab, setActiveTab] = useState("home"); // 'home' | 'streak' | 'dailies' | 'store'
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem("lrpg_theme") || "dark";
    } catch {
      return "dark";
    }
  });
  useEffect(() => {
    async function restoreSession() {
      try {
        const token = apiService.getToken();

        if (!token) {
          setAuthLoading(false);
          return;
        }

        const currentUser = await apiService.getCurrentUser();

        if (currentUser) {
          setUser(currentUser);
        } else {
          apiService.setToken(null);
        }
      } catch (err) {
        console.error("Session restore failed:", err);
        apiService.setToken(null);
      } finally {
        setAuthLoading(false);
      }
    }

    restoreSession();
  }, []);
  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    try {
      localStorage.setItem("lrpg_theme", theme);
    } catch (e) {}
  }, [theme]);
  const handleLogout = async () => {
    try {
      await apiService.logout();
    } catch (err) {
      console.error("Logout error:", err);
    }

    setUser(null);
    setAuthPage("login");
    setResetToken("");
  };
  const [isDecomposeOpen, setIsDecomposeOpen] = useState(false);
  const [decomposeInitialTask, setDecomposeInitialTask] = useState("");
  const [isFeelStuckOpen, setIsFeelStuckOpen] = useState(false);
  const [levelUpData, setLevelUpData] = useState(null);
  const [floatingFeedback, setFloatingFeedback] = useState(null);

  // Automatic dopamine streak popup on login / session visit
  const [isStreakModalOpen, setIsStreakModalOpen] = useState(() => {
    try {
      const today = new Date().toISOString().split("T")[0];
      const lastShown = sessionStorage.getItem("lrpg_streak_popup_shown");
      if (lastShown === today) return false;
      sessionStorage.setItem("lrpg_streak_popup_shown", today);
      return true;
    } catch {
      return true;
    }
  });

  useEffect(() => {
    if (!user) return;

    async function loadData() {
      try {
        const [questsData, dailiesData, storeData] = await Promise.all([
          apiService.getQuests(),
          apiService.getDailies(),
          apiService.getStoreItems(),
        ]);

        if (questsData) setQuests(questsData);
        if (dailiesData) setDailies(dailiesData);
        if (storeData) setStoreItems(storeData);
      } catch (err) {
        console.warn(
          "Backend unavailable, running on local persistent state",
          err,
        );
      }
    }

    loadData();
  }, [user]);
  useEffect(() => {
    const scheduleMidnightReset = () => {
      const now = new Date();
      const midnight = new Date(now);
      midnight.setHours(24, 0, 0, 0); // next midnight in local time
      const msUntilMidnight = midnight.getTime() - now.getTime();

      const timer = setTimeout(async () => {
        const freshDailies = await apiService.getDailies();
        if (freshDailies) setDailies(freshDailies);
        scheduleMidnightReset();
      }, msUntilMidnight);

      return timer;
    };

    const timer = scheduleMidnightReset();
    return () => clearTimeout(timer);
  }, []);

  const showFeedback = ({ xp, domainName, bonusXp = 0, gold }) => {
    setFloatingFeedback({ xp, domainName, bonusXp, gold });
    setTimeout(() => {
      setFloatingFeedback(null);
    }, 3200);
  };

  const handleTriggerDecompose = (taskQuery = "") => {
    setDecomposeInitialTask(taskQuery);
    setIsDecomposeOpen(true);
  };

  const handleTriggerFeelStuck = () => {
    setIsFeelStuckOpen(true);
  };

  const handleSaveQuest = async (newQuest) => {
    const saved = await apiService.createQuest(newQuest);
    setQuests((prev) => [saved, ...prev.filter((q) => q.id !== saved.id)]);
  };

  const handleDeleteQuest = async (questId) => {
    await apiService.deleteQuest(questId);
    setQuests((prev) => prev.filter((q) => q.id !== questId));
  };

  const handleCompleteMicrotask = async ({
    questId,
    microtaskId,
    domain,
    xp,
    gold,
    isQuestFinished,
  }) => {
    // Optimistic UI update
    setQuests((prevQuests) =>
      prevQuests.map((quest) => {
        if (quest.id !== questId) return quest;
        const updatedTasks = quest.microtasks.map((m) =>
          m.id === microtaskId
            ? { ...m, isCompleted: true, completedAt: new Date().toISOString() }
            : m,
        );
        return {
          ...quest,
          microtasks: updatedTasks,
          earnedXp: (quest.earnedXp || 0) + xp,
          earnedGold: (quest.earnedGold || 0) + gold,
          status: isQuestFinished ? "completed" : "active",
        };
      }),
    );

    const result = await apiService.completeMicrotask({
      questId,
      microtaskId,
      domain,
      xp,
      gold,
      user,
      isQuestFinished,
    });

    if (result?.updatedUser) {
      setUser(result.updatedUser);
    }

    const domainName = DOMAINS[domain]?.name || "XP";
    showFeedback({
      xp: result.xpAwarded || xp,
      domainName,
      bonusXp: result.bonusXp || 0,
      gold: result.goldAwarded || gold,
    });
    if (result.overallLeveledUp) {
      setLevelUpData({
        domainName: null,
        newLevel: result.newOverallLevel,
        newTitle: result.updatedUser?.character?.title || "Master Ascendant",
        bonusGold: 50,
      });
    } else if (result.domainLeveledUp) {
      setLevelUpData({
        domainName,
        newLevel: result.newDomainLevel,
        newTitle: null,
        bonusGold: 20,
      });
    }
  };

  const handleCompleteGroundingTask = async ({
    taskTitle,
    domain,
    xp,
    gold,
  }) => {
    const result = await apiService.completeMicrotask({
      questId: "grounding_session",
      microtaskId: `grounding_${Date.now()}`,
      domain,
      xp,
      gold,
      user,
      isQuestFinished: false,
    });

    if (result?.updatedUser) {
      setUser(result.updatedUser);
    }

    const domainName = DOMAINS[domain]?.name || "XP";
    showFeedback({
      xp: result.xpAwarded || xp,
      domainName,
      bonusXp: result.bonusXp || 0,
      gold: result.goldAwarded || gold,
    });

    if (result.overallLeveledUp || result.domainLeveledUp) {
      setLevelUpData({
        domainName: result.domainLeveledUp ? domainName : null,
        newLevel: result.domainLeveledUp
          ? result.newDomainLevel
          : result.newOverallLevel,
        newTitle: result.updatedUser?.character?.title,
      });
    }
  };

  const handleToggleDaily = async (daily) => {
    if (daily.isCompletedToday) return;

    setDailies((prev) =>
      prev.map((d) =>
        d.id === daily.id
          ? {
              ...d,
              isCompletedToday: true,
              streakDays: (d.streakDays || 0) + 1,
            }
          : d,
      ),
    );

    const result = await apiService.completeDaily(daily.id, user);
    if (result?.updatedUser) {
      setUser(result.updatedUser);
    }

    const domainName = DOMAINS[daily.domain]?.name || "XP";
    showFeedback({
      xp: result.xpAwarded || daily.xpReward,
      domainName,
      bonusXp: result.bonusXp || 0,
      gold: result.goldAwarded || daily.goldReward,
    });
  };
  const handleAddDaily = async (newDaily) => {
    const created = await apiService.createDaily(newDaily);
    setDailies((prev) => [...prev, created]);
  };

  const handleBuyItem = async (item) => {
    const result = await apiService.buyStoreItem(item, user);
    if (result?.updatedUser) {
      setUser(result.updatedUser);
    }
  };

  const handleClaimDailyCheckIn = async () => {
    const result = await apiService.claimStreakCheckin(user);
    if (result?.updatedUser) {
      setUser(result.updatedUser);
    }

    showFeedback({
      xp: result.xpAwarded || 20,
      domainName: "Streak Bonus",
      bonusXp: result.bonusXp || 5,
      gold: result.goldAwarded || 10,
    });
  };

  const activeQuestsCount = quests.filter((q) => q.status === "active").length;
  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Loading LifeRPG...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    if (authPage === "login") {
      return (
        <LoginPage
          onLogin={(loggedInUser) => {
            setUser(loggedInUser);
          }}
          onSwitchToRegister={() => {
            setAuthPage("register");
          }}
          onForgotPassword={() => {
            setAuthPage("forgot-password");
          }}
        />
      );
    }

    if (authPage === "register") {
      return (
        <RegisterPage
          onRegister={(registeredUser) => {
            setUser(registeredUser);
          }}
          onSwitchToLogin={() => {
            setAuthPage("login");
          }}
        />
      );
    }

    if (authPage === "forgot-password") {
      return (
        <ForgotPasswordPage
          onBackToLogin={() => {
            setAuthPage("login");
          }}
          onResetPassword={(token) => {
            setResetToken(token);
            setAuthPage("reset-password");
          }}
        />
      );
    }
         
    if (authPage === "reset-password") {
      return (
        <ResetPasswordPage
          token={resetToken}
          onBackToLogin={() => {
            setResetToken("");
            setAuthPage("login");
          }}
          onPasswordReset={(resetUser) => {
            setUser(resetUser);
          }}
        />
      );
    }
  }
  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-slate-50 dark:bg-rpg-darkest text-slate-900 dark:text-slate-100 font-sans transition-colors duration-200">
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        user={user}
        soundEnabled={soundEnabled}
        setSoundEnabled={setSoundEnabled}
        activeQuestsCount={activeQuestsCount}
        theme={theme}
        setTheme={setTheme}
      />
      <div className="flex-1 flex flex-col min-w-0">
        <TopNavBar
          user={user}
          onDomainClick={(domain) => {
            if (activeTab !== "home") setActiveTab("home");
          }}
          theme={theme}
          onLogout={handleLogout}
          setTheme={setTheme}
          soundEnabled={soundEnabled}
          setSoundEnabled={setSoundEnabled}
          onOpenStreakModal={() => setIsStreakModalOpen(true)}
          onOpenPersonaTab={() => setActiveTab("persona")}
        />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-6xl w-full mx-auto space-y-8">
          {activeTab === "home" && (
            <>
              <OverwhelmedHero
                username={user.username}
                onTriggerDecompose={handleTriggerDecompose}
                onTriggerFeelStuck={handleTriggerFeelStuck}
              />

              <ActiveQuestsList
                quests={quests}
                onCompleteMicrotask={handleCompleteMicrotask}
                onDeleteQuest={handleDeleteQuest}
                onOpenDecomposeModal={() => handleTriggerDecompose()}
              />
            </>
          )}

          {activeTab === "quests" && (
            <ActiveQuestsView
              quests={quests}
              onCompleteMicrotask={handleCompleteMicrotask}
              onDeleteQuest={handleDeleteQuest}
              onOpenDecomposeModal={() => handleTriggerDecompose()}
            />
          )}

          {activeTab === "persona" && (
            <PersonaAvatarView
              user={user}
              onUpdateUser={(updated) => setUser(updated)}
              onShowFeedback={showFeedback}
            />
          )}

          {activeTab === "streak" && (
            <StreakCalendarView
              user={user}
              onClaimDailyCheckIn={handleClaimDailyCheckIn}
            />
          )}

          {activeTab === "dailies" && (
            <DailyQuestsView
              dailies={dailies}
              onToggleDaily={handleToggleDaily}
              onAddDaily={handleAddDaily}
            />
          )}

          {activeTab === "store" && (
            <StoreView
              user={user}
              storeItems={storeItems}
              onBuyItem={handleBuyItem}
            />
          )}
        </main>
      </div>

      <QuestDecompositionModal
        isOpen={isDecomposeOpen}
        onClose={() => setIsDecomposeOpen(false)}
        initialTask={decomposeInitialTask}
        onSaveQuest={handleSaveQuest}
      />

      <FeelStuckModal
        isOpen={isFeelStuckOpen}
        onClose={() => setIsFeelStuckOpen(false)}
        onCompleteGroundingTask={handleCompleteGroundingTask}
      />

      <StreakLoginModal
        isOpen={isStreakModalOpen}
        onClose={() => setIsStreakModalOpen(false)}
        user={user}
        onClaimDailyCheckIn={handleClaimDailyCheckIn}
      />

      <LevelUpModal data={levelUpData} onClose={() => setLevelUpData(null)} />

      <FloatingFeedback feedback={floatingFeedback} />
    </div>
  );
}
