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
import {
  DOMAINS,
  applyProgression,
  getEffectiveOverallLevel,
  getPlayerTitle,
} from "./services/rpgEngine";
import ForgotPasswordPage from "./components/ForgotPasswordPage";
import ResetPasswordPage from "./components/ResetPasswordPage";
import ProfileSettings from "./components/ProfileSettings";

const normalizeQuestForUi = (quest = {}) => ({
  ...quest,
  id: quest.id ?? quest._id,
  _id: quest._id ?? quest.id,
  microtasks: Array.isArray(quest.microtasks)
    ? quest.microtasks.map((microtask = {}) => ({
        ...microtask,
        id: microtask.id ?? microtask._id,
        _id: microtask._id ?? microtask.id,
        isCompleted: Boolean(microtask.isCompleted),
      }))
    : [],
});
class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error, errorInfo) {
    console.error("LifeRPG UI crashed:", error);
    console.error("Component stack:", errorInfo?.componentStack);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleLogout = () => {
    try {
      localStorage.removeItem("lrpg_jwt_token");
    } catch (error) {
      console.error("Could not clear token:", error);
    }

    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6">
          <div className="w-full max-w-md text-center">
            <div className="text-6xl mb-6">⚔️</div>

            <h1 className="text-2xl font-bold mb-3">
              LifeRPG encountered an error
            </h1>

            <p className="text-slate-400 mb-6">
              Something went wrong while loading your RPG dashboard.
              Your account data is still safe on the server.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                type="button"
                onClick={this.handleReload}
                className="px-5 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold"
              >
                Reload
              </button>

              <button
                type="button"
                onClick={this.handleLogout}
                className="px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold"
              >
                Sign out
              </button>
            </div>

            {import.meta.env.DEV && this.state.error && (
              <pre className="mt-6 p-4 text-left text-xs text-red-300 bg-slate-900 rounded-xl overflow-auto">
                {this.state.error.stack || String(this.state.error)}
              </pre>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
function normalizeUserForUi(userData) {
  if (!userData) return null;

  try {
    const overallLevel = getEffectiveOverallLevel(userData);

    return {
      ...userData,
      character: {
        ...(userData.character || {}),
        overallLevel,
        title: getPlayerTitle(overallLevel),
      },
    };
  } catch (error) {
    console.error("User normalization failed:", error);

    // Keep the app usable even if an older/incomplete user document
    // is returned from the backend.
    return {
      ...userData,
      character: {
        ...(userData.character || {}),
        overallLevel:
          userData.character?.overallLevel || userData.character?.level || 1,
        title: userData.character?.title || "Novice Adventurer",
      },
    };
  }
}
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
          setUser(normalizeUserForUi(currentUser));
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
  const [voiceQuestResult, setVoiceQuestResult] = useState(null);
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

  const showFeedback = ({ xp, domainName, bonusXp = 0, gold, note = null }) => {
    setFloatingFeedback({ xp, domainName, bonusXp, gold, note });
    setTimeout(() => {
      setFloatingFeedback(null);
    }, 3200);
  };

  const handleTriggerDecompose = (taskQuery = "") => {
    setVoiceQuestResult(null);
    setDecomposeInitialTask(taskQuery);
    setIsDecomposeOpen(true);
  };

  // Called by OverwhelmedHero once Sarvam STT returns a final transcript.
  // The transcript (any language) goes straight to Gemini, which returns
  // title + domain + microtasks in one shot — the modal then opens already
  // on the "decomposed" screen, ready for the user to hit Accept Quest.
  const handleVoiceQuest = async (transcript) => {
    const result = await apiService.voiceDecomposeTask({ transcript });
    setDecomposeInitialTask("");
    setVoiceQuestResult(result);
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
    const normalizedQuestId = questId;
    const normalizedMicrotaskId = microtaskId;

    if (user) {
      const optimisticProgression = applyProgression({
        userData: user,
        domainKey: domain,
        xpAmount: xp,
        goldAmount: gold,
      });
      setUser(normalizeUserForUi(optimisticProgression.updatedUser));
    }

    setQuests((prevQuests) =>
      prevQuests.map((quest) => {
        const questKey = quest.id ?? quest._id;
        if (questKey !== normalizedQuestId) return quest;

        const updatedTasks = (quest.microtasks || []).map((m) => {
          const taskKey = m.id ?? m._id;
          return taskKey === normalizedMicrotaskId
            ? {
                ...m,
                id: taskKey,
                _id: m._id ?? taskKey,
                isCompleted: true,
                completedAt: new Date().toISOString(),
              }
            : m;
        });

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

    const serverUser = result?.updatedUser || result?.user;
    if (serverUser) {
      setUser(normalizeUserForUi(serverUser));
    }

    if (result?.quest) {
      const normalizedServerQuest = normalizeQuestForUi(result.quest);
      setQuests((prevQuests) =>
        prevQuests.map((quest) => {
          const currentQuestId = quest.id ?? quest._id;
          const incomingQuestId =
            normalizedServerQuest.id ?? normalizedServerQuest._id;
          return currentQuestId === incomingQuestId
            ? {
                ...quest,
                ...normalizedServerQuest,
                id: incomingQuestId,
                _id: normalizedServerQuest._id ?? incomingQuestId,
                microtasks: normalizedServerQuest.microtasks,
              }
            : quest;
        }),
      );
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
  setUser(normalizeUserForUi(result.updatedUser));
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

  // proofImage (optional): base64 data URL from an attached photo. When one is
  // passed, we wait for the server to actually verify it before marking the
  // quest complete — a mismatched photo is rejected with nothing changed.
  // Without a photo, the tick is instant (nothing to verify, safe to fall
  // back locally if the server's unreachable).
  const handleToggleDaily = async (daily, proofImage = null) => {
    if (daily.isCompletedToday) return null;

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

    const result = await apiService.completeDaily(daily.id, user, proofImage);

    if (result?.rejected) {
      // Nothing changed server-side — DailyQuestsView shows the reason as a
      // banner right under the quest card (not a corner toast, so it doesn't
      // get missed / doesn't need to compete with the XP toast timing).
      return result;
    }

    if (proofImage) {
      // Only mark complete now that the server has actually confirmed it.
      // Merge in the persisted server quest (includes lastProof: Gemini's
      // description + 1-10 score) so it keeps showing under the card, not
      // just in the one-time toast below.
      setDailies((prev) =>
        prev.map((d) =>
          d.id === daily.id
            ? {
              ...d,
              ...(result?.updatedDaily || {}),
              isCompletedToday: true,
              streakDays: result?.updatedDaily?.streakDays ?? (d.streakDays || 0) + 1,
            }
            : d,
        ),
      );
    }

    if (result?.updatedUser) {
      setUser(normalizeUserForUi(result.updatedUser));
    }

    const domainName = DOMAINS[daily.domain]?.name || "XP";
    const overPerf = result?.proofOverPerformancePercent || 0;
    const score = result?.proofScore;
    showFeedback({
      xp: result.xpAwarded || daily.xpReward,
      domainName,
      bonusXp: result.bonusXp || 0,
      gold: result.goldAwarded || daily.goldReward,
      note: [
        result.proofDescription,
        Number.isFinite(score) ? `AI score: ${score}/10` : null,
        overPerf > 0 ? `+${overPerf}% over target!` : null,
      ]
        .filter(Boolean)
        .join(" — ") || null,
    });
  };
  const handleAddDaily = async (newDaily) => {
    const created = await apiService.createDaily(newDaily);
    setDailies((prev) => [...prev, created]);
  };

  const handleDeleteDaily = async (daily) => {
    const dailyId = daily?.id ?? daily?._id;
    if (!dailyId) return;

    await apiService.deleteDaily(dailyId);
    setDailies((prev) =>
      prev.filter((item) => (item.id ?? item._id) !== dailyId),
    );
  };

  const handleBuyItem = async (item) => {
    try {
      const result = await apiService.buyStoreItem(item, user);

      if (result?.success && result?.updatedUser) {
        setUser(normalizeUserForUi(result.updatedUser));
        return true;
      }

      console.error("Store purchase failed:", result);

      alert(
        result?.error || "Purchase failed. Please check the backend server.",
      );

      return false;
    } catch (error) {
      console.error("Store purchase error:", error);
      alert("Unable to complete purchase.");
      return false;
    }
  };
  const handleUseItem = async (item) => {
    const itemId = item.itemId || item._id;

    const result = await apiService.useStoreItem(itemId);

    if (result?.updatedUser) {
      setUser(normalizeUserForUi(result.updatedUser));
    }

    if (result?.success) {
      alert(result.message);
    } else {
      alert(result?.error || "Unable to use item");
    }
  };

  const handleClaimDailyCheckIn = async () => {
    const result = await apiService.claimStreakCheckin(user);
    if (result?.updatedUser) {
      setUser(normalizeUserForUi(result.updatedUser));
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
            setUser(normalizeUserForUi(loggedInUser));
            setAuthPage("login");
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
            const normalizedUser = normalizeUserForUi(registeredUser);

            setUser(normalizedUser);
            setAuthPage("login");
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
            setUser(normalizeUserForUi(resetUser));
            setResetToken("");
            setAuthPage("login");
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
          onOpenProfile={() => setActiveTab("profile")}
        />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-6xl w-full mx-auto space-y-8">
          {activeTab === "home" && (
            <>
              <OverwhelmedHero
                username={user.username}
                onTriggerDecompose={handleTriggerDecompose}
                onTriggerFeelStuck={handleTriggerFeelStuck}
                onVoiceQuest={handleVoiceQuest}
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
          {activeTab === "profile" && (
            <ProfileSettings
              user={user}
              onUpdateUser={(updatedUser) => setUser(normalizeUserForUi(updatedUser))}
              onBack={() => setActiveTab("home")}
            />
          )}
        </main>
      </div>

      <QuestDecompositionModal
        isOpen={isDecomposeOpen}
        onClose={() => {
          setIsDecomposeOpen(false);
          setVoiceQuestResult(null);
        }}
        initialTask={decomposeInitialTask}
        voiceResult={voiceQuestResult}
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