export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders(),
      });
    }

    if (request.method !== "POST") {
      return json({ error: "Method not allowed" }, 405);
    }

    let payload;
    try {
      payload = await request.json();
    } catch {
      return json({ error: "Invalid JSON body" }, 400);
    }

    const overview = payload?.overview || {};
    const records = Array.isArray(payload?.records) ? payload.records : [];

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
      `https://api.cloudflare.com/client/v4/accounts/${env.CLOUDFLARE_ACCOUNT_ID}/ai/run/@cf/meta/llama-3.1-8b-instruct`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.CLOUDFLARE_API_TOKEN}`,
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
      const errText = await cfResponse.text();
      return json({ error: "Cloudflare AI request failed", detail: errText }, 502);
    }

    const cfData = await cfResponse.json();
    const insight =
      cfData?.result?.response ||
      cfData?.result?.output_text ||
      cfData?.result?.text ||
      "No insight generated.";

    return json({ insight }, 200);
  },
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders(),
    },
  });
}

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}
