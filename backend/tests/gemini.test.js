import "dotenv/config";
import { test } from "node:test";
import assert from "node:assert/strict";


const GEMINI_API_BASE =
    "https://generativelanguage.googleapis.com/v1beta/models";

test("Gemini API — direct connection test", async () => {
    console.log("\n========================================");
    console.log("🤖 GEMINI DIRECT API TEST");
    console.log("========================================");

    const apiKey = process.env.GEMINI_API_KEY;

    // 1. Check API key
    if (!apiKey) {
        console.error("❌ GEMINI_API_KEY is NOT configured");
        console.error("Make sure your .env contains:");
        console.error("GEMINI_API_KEY=your_key_here");

        assert.fail("GEMINI_API_KEY is missing");
    }

    console.log("✅ GEMINI_API_KEY is configured");
    console.log(`🔑 Key length: ${apiKey.length}`);

    // 2. Select model
    const model = process.env.GEMINI_MODEL || "gemini-2.0-flash";

    console.log(`🤖 Model: ${model}`);

    // 3. Simple prompt
    const prompt = `
Return ONLY valid JSON.

Create exactly 3 short microtasks for this task:
"Clean and organize my desk"

Return exactly this format:
{
  "microtasks": [
    {
      "title": "string"
    }
  ]
}
`;

    console.log("\n📤 Sending request to Gemini...");

    try {
        const response = await fetch(
            `${GEMINI_API_BASE}/${model}:generateContent?key=${apiKey}`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    contents: [
                        {
                            role: "user",
                            parts: [
                                {
                                    text: prompt,
                                },
                            ],
                        },
                    ],
                    generationConfig: {
                        temperature: 0.7,
                        responseMimeType: "application/json",
                    },
                }),
            }
        );

        console.log(`📥 HTTP Status: ${response.status}`);

        const responseText = await response.text();

        // 4. Show raw response if Gemini returns an error
        if (!response.ok) {
            console.error("\n❌ GEMINI API ERROR");
            console.error("========================================");
            console.error(responseText);
            console.error("========================================");

            assert.fail(
                `Gemini API returned HTTP ${response.status}`
            );
        }

        console.log("✅ Gemini API request succeeded");

        // 5. Parse Gemini response
        let data;

        try {
            data = JSON.parse(responseText);
        } catch (error) {
            console.error("❌ Gemini returned invalid JSON response");
            console.error(responseText);
            assert.fail("Could not parse Gemini HTTP response");
        }

        // 6. Extract generated text
        const generatedText =
            data?.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!generatedText) {
            console.error("\n❌ Gemini response contains no generated text");
            console.dir(data, { depth: null });

            assert.fail("Gemini returned no generated text");
        }

        console.log("\n========================================");
        console.log("🤖 GEMINI RAW GENERATED TEXT");
        console.log("========================================");
        console.log(generatedText);
        console.log("========================================");

        // 7. Parse Gemini's generated JSON
        let result;

        try {
            result = JSON.parse(generatedText);
        } catch (error) {
            console.error("\n❌ Gemini generated text is NOT valid JSON");
            console.error(generatedText);

            assert.fail(
                "Gemini generated invalid JSON"
            );
        }

        console.log("\n========================================");
        console.log("🤖 GEMINI PARSED RESPONSE");
        console.log("========================================");
        console.dir(result, { depth: null });
        console.log("========================================");

        // 8. Validate response
        assert.ok(
            Array.isArray(result.microtasks),
            "Gemini response should contain microtasks array"
        );

        assert.equal(
            result.microtasks.length,
            3,
            "Gemini should return exactly 3 microtasks"
        );

        for (const task of result.microtasks) {
            assert.equal(typeof task.title, "string");
            assert.ok(task.title.trim().length > 0);
        }

        console.log("\n✅ GEMINI TEST PASSED");
    } catch (error) {
        console.error("\n========================================");
        console.error("💥 GEMINI TEST FAILED");
        console.error("========================================");
        console.error(error.message);
        console.error("========================================");

        throw error;
    }
});