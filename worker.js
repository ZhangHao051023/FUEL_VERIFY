export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    if (request.method === "GET") {
      return new Response(
        JSON.stringify({
          ok: true,
          message: "Fuel Verify AI Worker is running. Send POST with { records: [...] } to / or /insights.",
          path: url.pathname,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    if (request.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    if (url.pathname !== "/" && url.pathname !== "/insights") {
      return new Response(JSON.stringify({ error: "Route not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    try {
      const body = await request.json();
      const records = Array.isArray(body.records) ? body.records.slice(0, 50) : [];

      if (records.length === 0) {
        return new Response(JSON.stringify({ error: "No records provided" }), {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }

      const prompt = [
        "You are a fuel spending assistant.",
        "Analyze the records and return a concise report in plain text.",
        "Include:",
        "1) Spending pattern",
        "2) Most expensive entries",
        "3) Actionable savings tips",
        "Keep it under 150 words.",
        "Records JSON:",
        JSON.stringify(records),
      ].join("\n");

      const aiResponse = await env.AI.run("@cf/meta/llama-3.1-8b-instruct", {
        prompt,
        max_tokens: 350,
      });

      const insights =
        (aiResponse && (aiResponse.response || aiResponse.result || aiResponse.output_text)) ||
        "No AI response text returned.";

      return new Response(JSON.stringify({ insights }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    } catch (error) {
      return new Response(
        JSON.stringify({
          error: "Failed to process AI request",
          details: error instanceof Error ? error.message : "Unknown error",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }
  },
};
