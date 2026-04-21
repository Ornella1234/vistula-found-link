// ai-search: takes a natural language query + the catalogue and asks the model
// to pick the best matching items (like a smart search)
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}

type Item = {
  id: string;
  type: "lost" | "found";
  title: string;
  description: string;
  category: string;
  location: string;
  event_date: string;
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });

  try {
    const { query, items } = await req.json() as { query?: string; items?: Item[] };

    if (!query || typeof query !== "string" || !query.trim()) {
      return jsonResponse({ error: "query is required" }, 400);
    }
    if (!Array.isArray(items) || items.length === 0) {
      return jsonResponse({ matches: [], summary: "No items in the catalogue yet." });
    }

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) throw new Error("LOVABLE_API_KEY is not configured");

    // keep the prompt small — only send the fields we need
    const slim = items.slice(0, 200).map((i) => ({
      id: i.id,
      type: i.type,
      title: i.title,
      description: i.description.slice(0, 280),
      category: i.category,
      location: i.location,
      date: i.event_date,
    }));

    const system = [
      `You are the search engine for a university lost & found.`,
      `Given a student's question and a list of posted items, pick the items that most likely match.`,
      `Be lenient with synonyms (phone = mobile = iPhone, bag = backpack, etc.).`,
      `Return up to 6 results, ordered best first. Skip anything irrelevant.`,
      `Also write a short, friendly 1-sentence summary of what you found.`,
    ].join(" ");

    const user = `Question: ${query.trim()}\n\nItems:\n${JSON.stringify(slim)}`;

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "return_matches",
              description: "Return the best matching items.",
              parameters: {
                type: "object",
                properties: {
                  summary: { type: "string", description: "One short sentence about the results." },
                  matches: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        id: { type: "string" },
                        reason: { type: "string", description: "Why this item matches, max 1 sentence." },
                      },
                      required: ["id", "reason"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["summary", "matches"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "return_matches" } },
      }),
    });

    if (!res.ok) {
      if (res.status === 429) return jsonResponse({ error: "Too many requests, try again in a moment." }, 429);
      if (res.status === 402) return jsonResponse({ error: "AI credits exhausted." }, 402);
      console.error("gateway error:", res.status, await res.text());
      return jsonResponse({ error: "AI search failed" }, 500);
    }

    const payload = await res.json();
    const call = payload.choices?.[0]?.message?.tool_calls?.[0];
    if (!call) return jsonResponse({ error: "No structured result from AI" }, 500);

    const parsed = JSON.parse(call.function.arguments) as {
      summary: string;
      matches: { id: string; reason: string }[];
    };
    return jsonResponse(parsed);
  } catch (err) {
    console.error("ai-search error:", err);
    return jsonResponse(
      { error: err instanceof Error ? err.message : "Unknown error" },
      500,
    );
  }
});
