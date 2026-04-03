const path = require("path");
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8787;

app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.use(express.static(__dirname));

app.post("/api/ai-insight", async (req, res) => {
  try {
    const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
    const apiToken = process.env.CLOUDFLARE_API_TOKEN;

    if (!accountId || !apiToken) {
      return res.status(500).json({
        error: "Missing Cloudflare configuration. Set CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN in .env",
      });
    }

    const payload = req.body || {};
    const overview = payload.overview || {};
    const records = Array.isArray(payload.records) ? payload.records : [];

    const recordsPreview = records
      .slice(0, 10)
      .map((item, index) => {
        return `${index + 1}. ${item.date} | ${item.location} | ${item.fuelType} | ${item.litre}L | ${item.price}`;
      })
      .join("\n");

    const systemPrompt =
      "You are an assistant that analyzes refueling records. Give practical, short suggestions. Keep response under 120 words.";

    const userPrompt = [
      "Overview:",
      JSON.stringify(overview),
      "",
      "Records:",
      recordsPreview || "No records provided.",
      "",
      "Provide:",
      "1) One spending insight",
      "2) One fuel-efficiency or refill timing suggestion",
      "3) One cost-saving action",
    ].join("\n");

    const cfResponse = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/@cf/meta/llama-3.1-8b-instruct`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
        }),
      }
    );

    if (!cfResponse.ok) {
      const detail = await cfResponse.text();
      return res.status(502).json({
        error: "Cloudflare AI request failed",
        detail,
      });
    }

    const cfData = await cfResponse.json();
    const insight =
      cfData?.result?.response ||
      cfData?.result?.output_text ||
      cfData?.result?.text ||
      "No insight generated.";

    return res.json({ insight });
  } catch (error) {
    return res.status(500).json({
      error: "Unexpected server error",
      detail: error instanceof Error ? error.message : String(error),
    });
  }
});

app.listen(PORT, () => {
  console.log(`Fuel Verify running at http://localhost:${PORT}`);
});
