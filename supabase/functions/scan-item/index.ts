// scan-item: takes a photo and asks the model to fill in title/description/category
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const categories = [
  "Electronics",
  "Documents & IDs",
  "Keys",
  "Bags & Backpacks",
  "Clothing",
  "Books & Notes",
  "Jewelry & Watches",
  "Wallets & Cards",
  "Water Bottles",
  "Other",
];

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });

  try {
    const { imageDataUrl, type } = await req.json();

    if (!imageDataUrl || typeof imageDataUrl !== "string") {
      return jsonResponse({ error: "imageDataUrl is required" }, 400);
    }

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) throw new Error("LOVABLE_API_KEY is not configured");

    const kind = type === "found" ? "found" : "lost";
    const prompt = [
      `Help fill in a lost & found post for Vistula University.`,
      `Someone ${kind} this item on campus — look at the photo and suggest:`,
      `- a short title (max 80 chars)`,
      `- 2-3 sentences describing what you can actually see (colour, brand, material, marks)`,
      `- the best category from: ${categories.join(", ")}`,
      `Stick to what's visible. Don't guess serial numbers or owner names.`,
    ].join("\n");

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: prompt },
          {
            role: "user",
            content: [
              { type: "text", text: "Here's the photo — please pull out the details." },
              { type: "image_url", image_url: { url: imageDataUrl } },
            ],
          },
        ],
        // forcing a tool call so we always get clean JSON back
        tools: [
          {
            type: "function",
            function: {
              name: "extract_item_details",
              description: "Pulls title/description/category out of the photo.",
              parameters: {
                type: "object",
                properties: {
                  title: { type: "string", description: "Short title, up to 80 chars." },
                  description: { type: "string", description: "2-3 sentences about what's visible." },
                  category: { type: "string", enum: categories },
                },
                required: ["title", "description", "category"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "extract_item_details" } },
      }),
    });

    if (!res.ok) {
      if (res.status === 429) {
        return jsonResponse({ error: "Too many requests. Please try again in a moment." }, 429);
      }
      if (res.status === 402) {
        return jsonResponse({ error: "AI credits exhausted. Please add credits to continue." }, 402);
      }
      console.error("gateway error:", res.status, await res.text());
      return jsonResponse({ error: "AI scanner failed" }, 500);
    }

    const payload = await res.json();
    const call = payload.choices?.[0]?.message?.tool_calls?.[0];
    if (!call) {
      return jsonResponse({ error: "No structured result from AI" }, 500);
    }

    return jsonResponse(JSON.parse(call.function.arguments));
  } catch (err) {
    console.error("scan-item error:", err);
    return jsonResponse(
      { error: err instanceof Error ? err.message : "Unknown error" },
      500,
    );
  }
});
