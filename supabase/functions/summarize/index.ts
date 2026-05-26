import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  // Responde ao preflight do browser
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return new Response("Unauthorized", { status: 401 });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } }
  );

  const { data: notes, error } = await supabase
    .from("notes")
    .select("content")
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) return new Response(error.message, { status: 500, headers: corsHeaders });
  if (!notes?.length) {
    return new Response(
      JSON.stringify({ summary: "Nenhuma nota para resumir." }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const notesText = notes.map((n) => n.content).join("\n---\n");

  const aiRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${Deno.env.get("GROQ_API_KEY")}`,
    },
    body: JSON.stringify({
      model: "llama-3.1-8b-instant",
      messages: [
        {
          role: "system",
          content: "Você resume anotações em bullet points concisos em português.",
        },
        {
          role: "user",
          content: `Resuma estas notas:\n\n${notesText}`,
        },
      ],
    }),
  });

  const aiData = await aiRes.json();
  const summary = aiData.choices[0].message.content;

  return new Response(JSON.stringify({ summary }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});// deploy Tue May 26 11:41:48 -03 2026
