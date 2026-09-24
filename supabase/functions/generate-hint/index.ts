import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY");

serve(async (req: Request) => {
  // Opcje (CORS) preflight request
    if (req.method === "OPTIONS") {
      return new Response("ok", { headers: corsHeaders });
    }

    try {
      const body = await req.json();
      
      if (body.list_models) {
        const res = await fetch("https://api.groq.com/openai/v1/models", {
          headers: { "Authorization": `Bearer ${GROQ_API_KEY}` }
        });
        const data = await res.json();
        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { question, options, language = 'pl' } = body;

      if (!question) {
        return new Response(JSON.stringify({ error: "Missing question" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (!GROQ_API_KEY) {
        return new Response(JSON.stringify({ error: "API Key not configured" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const systemPrompt = `Jesteś przyjaznym tutorem pomagającym w nauce. Uczeń próbuje rozwiązać poniższe pytanie testowe.
Podaj krótki fakt teoretyczny potrzebny do rozwiązania problemu, a następnie zadaj naprowadzające pytanie (tzw. metoda sokratyczna).
Bądź zwięzły (Maksymalnie 2-3 krótkie zdania), przyjacielski i pod żadnym pozorem nie podawaj poprawnej odpowiedzi bezpośrednio. Nie powielaj opcji odpowiedzi, jedynie naprowadź ucznia na właściwy trop.
WAŻNE: Odpowiedz w języku (kod języka): ${language}`;

      const userPrompt = `Pytanie: ${question}\nMożliwe odpowiedzi: ${options.join(" | ")}`;

      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "openai/gpt-oss-20b",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
          ],
          temperature: 0.6,
          max_tokens: 500,
        }),
      });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Groq API error:", errText);
      return new Response(JSON.stringify({ error: `Groq API Error: ${errText}` }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const hint = data.choices?.[0]?.message?.content?.trim() || "Nie potrafię teraz wygenerować podpowiedzi. Spróbuj pomyśleć nieszablonowo!";

    return new Response(JSON.stringify({ hint }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error in generate-hint function:", error);
    return new Response(JSON.stringify({ error: `Function Error: ${error.message}` }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
