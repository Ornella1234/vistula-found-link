// little search helper for the lost & found board
// takes whatever the student typed + the current posts and asks the model
// to pick the ones that look like a match
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function reply(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}

type Post = {
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
    const body = await req.json() as { query?: string; items?: Post[] };
    const question = (body.query ?? "").trim();
    const posts = body.items ?? [];

    if (!question) return reply({ error: "Type something to search for." }, 400);
    if (posts.length === 0) {
      return reply({ matches: [], summary: "Nothing has been posted yet." });
    }

    const key = Deno.env.get("LOVABLE_API_KEY");
    if (!key) throw new Error("LOVABLE_API_KEY is missing");

    // trim the payload so we don't send a wall of text to the model
    const shortlist = posts.slice(0, 200).map((p) => ({
      id: p.id,
      type: p.type,
      title: p.title,
      description: p.description.slice(0, 280),
      category: p.category,
      location: p.location,
      date: p.event_date,
    }));

    const instructions =
      "You're the search box on our university lost & found board. " +
      "A student types what they're looking for and you pick the posts that probably match. " +
      "Be flexible with words (phone/mobile/iPhone, bag/backpack, etc.). " +
      "Give back up to 6 results, best one first, and skip anything off-topic. " +
      "Also write one short friendly sentence summing up what you found.";

    const userMsg = `Search: ${question}\n\nPosts:\n${JSON.stringify(shortlist)}`;

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: instructions },
          { role: "user", content: userMsg },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "return_matches",
              description: "Return the posts that match.",
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
                        reason: { type: "string", description: "Why this one matches, one sentence." },
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
      if (res.status === 429) return reply({ error: "Slow down a bit and try again." }, 429);
      if (res.status === 402) return reply({ error: "Out of AI credits." }, 402);
      console.error("ai gateway said:", res.status, await res.text());
      return reply({ error: "Search didn't work, sorry." }, 500);
    }

    const data = await res.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) return reply({ error: "Got a weird response from the AI." }, 500);

    const result = JSON.parse(toolCall.function.arguments) as {
      summary: string;
      matches: { id: string; reason: string }[];
    };
    return reply(result);
  } catch (e) {
    console.error("ai-search blew up:", e);
    return reply({ error: e instanceof Error ? e.message : "Something went wrong" }, 500);
  }
});
