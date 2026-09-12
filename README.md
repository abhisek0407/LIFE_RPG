# Life RPG // Turn Tasks into Quests

> **Bridge the Delayed Gratification Gap.** Transform mundane, overwhelming real-world responsibilities into rewarding RPG quests with tactile dopamine micro-interactions, AI-driven microtask decomposition, physiological grounding unblockers, and a non-linear character progression engine.

---

## 🌟 The Philosophy & Design Direction

Traditional productivity apps feel like chores because the real-world rewards of going to the gym, studying operating systems, or cleaning an apartment take weeks or months to materialize.

**Life RPG** bridges this gap by giving immediate feedback:
- **Immediate Dopamine**: Checking off even the smallest 2-minute starter step triggers visual confetti, procedural 8-bit sound chimes, floating XP numbers, and in-game gold.
- **Micro-Steps Beat Paralysis**: Instead of staring at an overwhelming monster task, the **AI Quest Engine** automatically breaks down the goal based on your **Motivation Level** (Low, Medium, High). Low motivation triggers ultra-gentle microsteps to bypass executive dysfunction.
- **Emergency "Feel Stuck" Chamber**: When cognitive overload or anxiety sets in, the Feel Stuck button provides somatic box-breathing (4-4-4-4) and 3 instant grounding actions to unfreeze your focus.
- **Three Core Pillars of Progression**:
  - 🧠 **Mental XP**: Focus, study blocks, intellect, and problem-solving.
  - 💪 **Health XP**: Physical constitution, gym workouts, nutrition, and hydration.
  - ✨ **Skill / Personality XP**: Coding mastery, creative craft, reading, and social charisma.

---

## 📐 Architecture & Layout (Wireframe Alignment)

The frontend interface strictly mirrors the hand-drawn layout specification:
1. **Sidebar Navigation**:
   - `Home`: Main quest dashboard & AI task decomposition
   - `Streak Calendar`: Consistency multiplier matrix & daily check-in
   - `Daily Quests`: Recurring daily rituals & habit streaks
   - `Store & Armory`: Virtual items, XP potions, streak freezes, and cosmetic titles
2. **Top Stats Bar**:
   - 3 Domain XP Gauges (**Mental XP**, **Health XP**, **Skill XP**) with level badges and live progress bars.
   - Gold Balance & Streak Multiplier (+5% bonus per streak day, up to 1.50x).
   - Audio synthesizer toggle (Procedural Web Audio API sound effects).
3. **Hero Interface**:
   - Dynamic greeting: `Hi, [Username]`
   - Core prompt: `What's overwhelming you today?`
   - Tactile search / input bar with quick suggested starters.
   - `Feel Stuck` prominent unblocker button directly below the search bar.
4. **Quest Decomposition Forge (Modal)**:
   - Autofilled Task Name
   - Domain Selector (Health, Mental, Skill/Personality)
   - Difficulty Selector (Easy, Medium, Hard)
   - Motivation Level (Low, Medium, High)
   - "Generate Micro-Tasks" button
   - Interactive checklist with XP and Gold rewards per step
   - `+ Add Custom Microtask` field to seamlessly add personal steps to the AI-generated list
   - "Accept Quest" to transfer into your Active Quest Log.

---

## 📊 Complete API Contracts & Database Schemas

To ensure 100% consistency between this React frontend and the Node.js + Express + MongoDB backend, see:
[`api_contracts_and_schema.json`](./api_contracts_and_schema.json)

### Key Database Models (Mongoose / MongoDB)
- `User`: Account, credentials hash, character title, level, gold, streak, and domain stats (`mental`, `health`, `skill`).
- `Quest`: User ID, title, domain, difficulty, motivation level, status (`active`, `completed`), total XP, total Gold, and `microtasks` sub-documents.
- `DailyQuest`: Recurring daily habits, streak days, last completed date, XP/gold rewards.
- `StoreItem` & `Inventory`: Consumables, streak freezes, cosmetic badges, titles, and themes.
- `ActivityLog`: Comprehensive audit trail of all task completions, XP gains, and purchases for anti-cheat verification.

### Non-Linear Leveling Formula
$$\text{XP Required for Level } L = \lfloor 100 \times L^{1.5} \rfloor$$

---

## 🚀 Getting Started

### Prerequisites
- Node.js v18+ (tested on Node v24)
- npm v9+

### Installation

1. **Clone the repository**:
   ```bash
   git clone <REPO_URL>
   cd LRPG
   ```

2. **Run Frontend**:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
   The application will be running at `http://localhost:3000`.

3. **Build for Production**:
   ```bash
   npm run build
   ```

---

## ⚙️ Environment Variables Template (`.env.example`)

Create a `.env` file in `frontend/` (and later `backend/`):

```env
# Frontend Environment
VITE_API_BASE_URL=http://localhost:5000/api
VITE_ENABLE_SOUND=true

# Backend Environment (for Node.js + Express)
PORT=5000
MONGODB_URI=mongodb://localhost:27017/liferpg
JWT_SECRET=super_secret_jwt_key_rpg_2026
CORS_ORIGIN=http://localhost:3000
```

---

## 🏆 Core Gamification Rules

| Difficulty | Base XP | Base Gold | Multiplier Scaling |
| :--- | :---: | :---: | :--- |
| **Easy** | 50 XP | 15 Gold | Distributed among 3–4 micro-steps |
| **Medium** | 120 XP | 35 Gold | Distributed among 4–5 micro-steps |
| **Hard** | 300 XP | 80 Gold | Distributed among 5–6 micro-steps |

- **Streak Bonus**: Adds $+5\%$ bonus XP per consecutive active day up to $+50\%$ ($1.50\times$) at 10 days.
- **Phoenix Feather**: Protects your streak fire if an unforeseen event forces you to miss a day.
