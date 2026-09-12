const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta/models";

// `parts` lets callers pass extra content blocks (e.g. an inline image) alongside
// the text prompt. Nothing here writes anything to disk — it's all in-memory,
// request-scoped, and thrown away once this function returns.
async function callGeminiJSON(prompt, extraParts = []) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        throw new Error("GEMINI_API_KEY is not configured");
    }
    const model = process.env.GEMINI_MODEL || "gemini-2.0-flash";

    const response = await fetch(`${GEMINI_API_BASE}/${model}:generateContent?key=${apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            contents: [{ role: "user", parts: [{ text: prompt }, ...extraParts] }],
            generationConfig: {
                temperature: 0.7,
                responseMimeType: "application/json",
            },
        }),
    });

    if (!response.ok) {
        const errBody = await response.text().catch(() => "");
        throw new Error(`Gemini API responded ${response.status}: ${errBody.slice(0, 300)}`);
    }

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
        throw new Error("Gemini response contained no text content");
    }

    // Defensive: strip markdown fences in case the model adds them anyway.
    const cleaned = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "");
    return JSON.parse(cleaned);
}

// ── Prompts ────────────────────────────────────────────────────

function buildDecomposePrompt(description, domain, motivation) {
    return `You are the task-decomposition engine for a gamified productivity app called Life RPG.
Break the following real-life task into 4 to 6 concrete, actionable microtasks.

Task: "${description}"
Domain: ${domain}
Motivation level: ${motivation}

Guidelines:
- Each microtask must be a single, concrete, completable action — not vague.
- If motivation is "low", make each microtask smaller and easier, with a slightly higher per-step xpReward (20-35) to build momentum.
- If motivation is "medium", use moderate step sizes with xpReward around 15-30 per step.
- If motivation is "high", fewer/larger steps are fine, with xpReward around 10-25 per step.
- goldReward should generally be 20-40% of xpReward, and can be 0.

Respond with ONLY valid JSON, no markdown fences, no commentary, in exactly this shape:
{"microtasks": [{"title": "string", "xpReward": number, "goldReward": number}]}`;
}

function buildVoiceDecomposePrompt(transcript, motivation) {
    return `You are the task-decomposition engine for a gamified productivity app called Life RPG.
A user just SPOKE the following task out loud (it may be in any language, including Hindi, Odia, or any other Indian or global language, and may contain speech-to-text noise):

Transcript: "${transcript}"

Motivation level: ${motivation}

Do THREE things:
1. Write a short, clean, human-readable task title in the SAME language style the user would expect to read (did not translate to natural English if the transcript is in another language), suitable for a "Task Name" field.
2. Classify which single domain this task belongs to: "health" (vitality, physical workout, nutrition, hydration, sleep), "mental" (focus, studying, problem solving, mindfulness, emotional clarity), or "skill" (creative craft, coding, professional mastery, social confidence, reading).
3. Break the task into 4 to 6 concrete, actionable microtasks, same rules as normal decomposition:
   - Each microtask must be a single, concrete, completable action — not vague.
   - If motivation is "low", make each microtask smaller and easier, with a slightly higher per-step xpReward (20-35) to build momentum.
   - If motivation is "medium", use moderate step sizes with xpReward around 15-30 per step.
   - If motivation is "high", fewer/larger steps are fine, with xpReward around 10-25 per step.
   - goldReward should generally be 20-40% of xpReward, and can be 0.

Respond with ONLY valid JSON, no markdown fences, no commentary, in exactly this shape:
{"title": "string", "domain": "health|mental|skill", "microtasks": [{"title": "string", "xpReward": number, "goldReward": number}]}`;
}

function buildFeelStuckPrompt(domain) {
    return `You are the "I feel stuck" support feature for a gamified productivity app called Life RPG.
A user has indicated they feel stuck or unmotivated${domain ? ` while working on something in the "${domain}" domain` : ""}.

Respond with ONLY valid JSON, no markdown fences, no commentary, in exactly this shape:
{
  "breathingExercise": {"name": "string", "steps": ["string", "string", "string", "string"]},
  "groundingMicrotasks": [{"title": "string", "xpReward": number, "goldReward": number}],
  "encouragement": "string"
}
Provide exactly 3 groundingMicrotasks, each a tiny action completable in under two minutes.
xpReward should be small (5-15), goldReward 0-5. encouragement should be one short, warm sentence.`;
}

// ── Validate + normalize Gemini's output (throws to trigger fallback) ──

function normalizeDecomposition(parsed) {
    const microtasks = Array.isArray(parsed?.microtasks) ? parsed.microtasks : null;
    if (!microtasks || microtasks.length < 4 || microtasks.length > 6) {
        throw new Error("Gemini response did not contain 4-6 microtasks");
    }

    const cleaned = microtasks.map((mt, i) => {
        const title = typeof mt.title === "string" && mt.title.trim() ? mt.title.trim() : `Step ${i + 1}`;
        const xpReward = Number.isFinite(mt.xpReward) && mt.xpReward > 0 ? Math.round(mt.xpReward) : 20;
        const goldReward =
            Number.isFinite(mt.goldReward) && mt.goldReward >= 0 ? Math.round(mt.goldReward) : Math.round(xpReward * 0.3);
        return { title, xpReward, goldReward };
    });

    return {
        microtasks: cleaned,
        totalXp: cleaned.reduce((sum, mt) => sum + mt.xpReward, 0),
        totalGold: cleaned.reduce((sum, mt) => sum + mt.goldReward, 0),
    };
}

function normalizeVoiceDecomposition(parsed, fallbackTranscript) {
    const { microtasks, totalXp, totalGold } = normalizeDecomposition(parsed);

    const domain = ["health", "mental", "skill"].includes(parsed?.domain) ? parsed.domain : "mental";
    const title =
        typeof parsed?.title === "string" && parsed.title.trim() ? parsed.title.trim() : fallbackTranscript;

    return { title, domain, microtasks, totalXp, totalGold };
}

function normalizeFeelStuck(parsed) {
    const steps = Array.isArray(parsed?.breathingExercise?.steps)
        ? parsed.breathingExercise.steps.filter((s) => typeof s === "string" && s.trim())
        : null;
    if (!steps || steps.length === 0) {
        throw new Error("Gemini response missing breathing exercise steps");
    }

    const groundingRaw = Array.isArray(parsed?.groundingMicrotasks) ? parsed.groundingMicrotasks : null;
    if (!groundingRaw || groundingRaw.length === 0) {
        throw new Error("Gemini response missing grounding microtasks");
    }

    const groundingMicrotasks = groundingRaw.slice(0, 4).map((mt, i) => ({
        title: typeof mt.title === "string" && mt.title.trim() ? mt.title.trim() : `Grounding step ${i + 1}`,
        xpReward: Number.isFinite(mt.xpReward) && mt.xpReward > 0 ? Math.round(mt.xpReward) : 10,
        goldReward: Number.isFinite(mt.goldReward) && mt.goldReward >= 0 ? Math.round(mt.goldReward) : 0,
    }));

    return {
        breathingExercise: {
            name:
                typeof parsed.breathingExercise.name === "string" && parsed.breathingExercise.name.trim()
                    ? parsed.breathingExercise.name.trim()
                    : "Box Breathing",
            steps,
        },
        groundingMicrotasks,
        encouragement:
            typeof parsed.encouragement === "string" && parsed.encouragement.trim()
                ? parsed.encouragement.trim()
                : "One small step is still a step. You've got this.",
    };
}

// ── Deterministic fallbacks (used when Gemini is unavailable) ──────

function decomposeWithRules(description, domain, motivation) {
    const templates = {
        low: [
            { suffix: "Write down the very first tiny step for", xpReward: 30 },
            { suffix: "Spend just 5 minutes getting started on", xpReward: 30 },
            { suffix: "Do one small piece of", xpReward: 25 },
            { suffix: "Take a short break, then do one more piece of", xpReward: 25 },
            { suffix: "Review what's done and note what's left for", xpReward: 20 },
        ],
        medium: [
            { suffix: "Plan out the steps for", xpReward: 20 },
            { suffix: "Get started on the first part of", xpReward: 25 },
            { suffix: "Push through the middle stretch of", xpReward: 25 },
            { suffix: "Finish the remaining work on", xpReward: 25 },
            { suffix: "Review and wrap up", xpReward: 15 },
        ],
        high: [
            { suffix: "Plan and start immediately on", xpReward: 20 },
            { suffix: "Complete the bulk of the work on", xpReward: 25 },
            { suffix: "Finish it off and review", xpReward: 20 },
            { suffix: "Do a final quality pass on", xpReward: 15 },
        ],
    };

    const steps = templates[motivation] || templates.medium;
    const microtasks = steps.map((step) => ({
        title: `${step.suffix} ${description}`,
        xpReward: step.xpReward,
        goldReward: Math.round(step.xpReward * 0.3),
    }));

    return {
        microtasks,
        totalXp: microtasks.reduce((sum, mt) => sum + mt.xpReward, 0),
        totalGold: microtasks.reduce((sum, mt) => sum + mt.goldReward, 0),
    };
}

// Best-effort, English-keyword-only domain guess for the rare case Gemini is
// down when a voice quest comes in. Non-English transcripts will just fall
// back to "mental" — acceptable since this only fires when the AI path fails.
function guessDomainFromText(text) {
    const lower = (text || "").toLowerCase();
    const healthKeywords = ["water", "sleep", "cook", "meal", "clean", "room", "workout", "gym", "run", "walk", "exercise", "yoga", "stretch"];
    const skillKeywords = ["code", "coding", "build", "design", "art", "resume", "job", "write", "draw", "paint", "guitar", "portfolio"];
    if (healthKeywords.some((kw) => lower.includes(kw))) return "health";
    if (skillKeywords.some((kw) => lower.includes(kw))) return "skill";
    return "mental";
}

function feelStuckFallback(domain) {
    return {
        breathingExercise: {
            name: "Box Breathing",
            steps: [
                "Breathe in slowly through your nose for 4 counts",
                "Hold your breath for 4 counts",
                "Breathe out slowly through your mouth for 4 counts",
                "Hold again for 4 counts, then repeat 4 times",
            ],
        },
        groundingMicrotasks: [
            { title: "Name 3 things you can see around you", xpReward: 10, goldReward: 0 },
            { title: "Stand up and stretch for 30 seconds", xpReward: 10, goldReward: 0 },
            { title: "Drink a glass of water", xpReward: 10, goldReward: 0 },
        ],
        encouragement: domain
            ? `Feeling stuck on something in your ${domain} domain is normal — a tiny reset can help.`
            : "Feeling stuck is normal — a tiny reset can help you get moving again.",
    };
}

// ── POST /api/ai/decompose ──────────────────────────────────────
// body: { description, domain, motivationLevel? }
export async function decomposeTask(req, res) {
    try {
        const { description, domain, motivationLevel } = req.body;

        if (!description?.trim()) {
            return res.status(400).json({ error: "description is required" });
        }
        if (!["health", "mental", "skill"].includes(domain)) {
            return res.status(400).json({ error: "domain must be health, mental, or skill" });
        }
        const motivation = ["low", "medium", "high"].includes(motivationLevel) ? motivationLevel : "medium";
        const trimmedDescription = description.trim();

        let result;
        let source;
        try {
            const raw = await callGeminiJSON(buildDecomposePrompt(trimmedDescription, domain, motivation));
            result = normalizeDecomposition(raw);
            source = "gemini";
        } catch (err) {
            console.warn("Gemini decompose unavailable, using rule-based fallback:", err.message);
            result = decomposeWithRules(trimmedDescription, domain, motivation);
            source = "rule-based";
        }

        return res.status(200).json({
            domain,
            motivationLevel: motivation,
            source,
            ...result,
        });
    } catch (err) {
        console.error("decomposeTask error:", err);
        return res.status(500).json({ error: "Failed to decompose task" });
    }
}

// ── POST /api/ai/voice-decompose ────────────────────────────────
// body: { transcript, motivationLevel? }
// Used by the voice (Sarvam STT) flow: the user never picked a domain, so
// this endpoint asks Gemini to classify the domain AND decompose in one call.
export async function voiceDecomposeTask(req, res) {
    try {
        const { transcript, motivationLevel } = req.body;

        if (!transcript?.trim()) {
            return res.status(400).json({ error: "transcript is required" });
        }
        const motivation = ["low", "medium", "high"].includes(motivationLevel) ? motivationLevel : "medium";
        const trimmedTranscript = transcript.trim();

        let result;
        let source;
        try {
            const raw = await callGeminiJSON(buildVoiceDecomposePrompt(trimmedTranscript, motivation));
            result = normalizeVoiceDecomposition(raw, trimmedTranscript);
            source = "gemini";
        } catch (err) {
            console.warn("Gemini voice-decompose unavailable, using rule-based fallback:", err.message);
            const domain = guessDomainFromText(trimmedTranscript);
            const decomposed = decomposeWithRules(trimmedTranscript, domain, motivation);
            result = { title: trimmedTranscript, domain, ...decomposed };
            source = "rule-based";
        }

        return res.status(200).json({
            motivationLevel: motivation,
            source,
            ...result,
        });
    } catch (err) {
        console.error("voiceDecomposeTask error:", err);
        return res.status(500).json({ error: "Failed to decompose voice quest" });
    }
}

// ── Proof-of-completion image analysis (used by daily quests) ───────
// Takes a base64 data URL (e.g. "data:image/png;base64,AAAA...") and asks
// Gemini for a one-line description of what it shows. The image bytes are
// only ever held in memory for the duration of this call — this function
// never writes them to disk or to the database, and returns nothing but
// the short text description for the caller to log.
export async function analyzeProofImage(base64DataUrl, questTitle) {
    const match = /^data:(image\/[a-zA-Z+]+);base64,(.+)$/.exec(base64DataUrl || "");
    if (!match) {
        throw new Error("proofImage must be a base64 image data URL");
    }
    const [, mimeType, base64Data] = match;

    const prompt = `You are a proof-of-completion checker for a gamified habit app. A user is trying to complete this daily habit:
"${questTitle}"
They submitted the attached photo/screenshot as evidence.

Do the following:
1. Decide if the image is genuinely plausible evidence for THIS habit (matches = true) or is clearly unrelated / doesn't show anything relevant (matches = false). Be reasonably lenient — a relevant photo doesn't need to be perfect proof, just plausibly related.
2. In one short sentence (max 15 words), describe what the image shows.
3. Rate the quality/convincingness of this proof on a scale of 1 to 10, where 1 = barely plausible or very weak evidence, 5 = an ordinary, adequate photo that reasonably supports the habit, and 10 = exceptionally clear, specific, unmistakable proof of real completion. If matches is false, score should be 1-3.
4. If the habit title implies a measurable numeric target (e.g. "Run 200m", "Drink 2L water", "8000 steps", "Read 20 pages", "Meditate 10 minutes") AND the image shows a specific achieved number for that same metric, extract both numbers. Otherwise leave them null.
5. If both numbers are present and the achieved value exceeds the target, compute how many percent over target it is. Otherwise 0.

Respond with ONLY valid JSON, no markdown fences, in exactly this shape:
{
  "matches": true or false,
  "description": "string",
  "score": number (1-10),
  "targetValue": number or null,
  "achievedValue": number or null,
  "unit": "string or null",
  "overPerformancePercent": number
}`;

    const parsed = await callGeminiJSON(prompt, [
        { inlineData: { mimeType, data: base64Data } },
    ]);

    const description =
        typeof parsed?.description === "string" && parsed.description.trim()
            ? parsed.description.trim().slice(0, 200)
            : null;
    if (!description) {
        throw new Error("Gemini response missing a usable description");
    }

    const matches = parsed?.matches !== false; // default to lenient (true) unless explicitly false
    const overPerformancePercent =
        Number.isFinite(parsed?.overPerformancePercent) && parsed.overPerformancePercent > 0
            ? Math.min(100, Math.round(parsed.overPerformancePercent)) // capped at +100% bonus
            : 0;

    // Score is Gemini's 1-10 read on how convincing the proof is. Default to
    // a neutral 5 (or a low 2 for a non-match) if it forgets to include one.
    const rawScore = Number.isFinite(parsed?.score) ? Math.round(parsed.score) : matches ? 5 : 2;
    const score = Math.min(10, Math.max(1, rawScore));

    return {
        matches,
        description,
        score,
        targetValue: Number.isFinite(parsed?.targetValue) ? parsed.targetValue : null,
        achievedValue: Number.isFinite(parsed?.achievedValue) ? parsed.achievedValue : null,
        unit: typeof parsed?.unit === "string" ? parsed.unit : null,
        overPerformancePercent,
    };
}

// ── POST /api/ai/feel-stuck ──────────────────────────────────────
// body: { domain? }
export async function feelStuck(req, res) {
    try {
        const domain = ["health", "mental", "skill"].includes(req.body?.domain) ? req.body.domain : null;

        let result;
        let source;
        try {
            const raw = await callGeminiJSON(buildFeelStuckPrompt(domain));
            result = normalizeFeelStuck(raw);
            source = "gemini";
        } catch (err) {
            console.warn("Gemini feel-stuck unavailable, using static fallback:", err.message);
            result = feelStuckFallback(domain);
            source = "rule-based";
        }

        return res.status(200).json({ source, ...result });
    } catch (err) {
        console.error("feelStuck error:", err);
        return res.status(500).json({ error: "Failed to fetch grounding guide" });
    }
}