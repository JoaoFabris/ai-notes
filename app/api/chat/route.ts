import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase";

const MODEL = "llama-3.3-70b-versatile";

const tools = [
  {
    type: "function",
    function: {
      name: "create_note",
      description: "Cria uma nova nota para o usuário",
      parameters: {
        type: "object",
        properties: {
          content: {
            type: "string",
            description: "O conteúdo da nota a ser criada",
          },
        },
        required: ["content"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_notes",
      description: "Lista todas as notas do usuário",
      parameters: {
        type: "object",
        properties: {},
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "delete_note",
      description: "Deleta uma nota pelo ID",
      parameters: {
        type: "object",
        properties: {
          id: {
            type: "string",
            description: "O ID da nota a ser deletada",
          },
        },
        required: ["id"],
      },
    },
  },
];

export async function POST(req: NextRequest) {
  const { message, accessToken } = await req.json();

  if (!accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createClient();

  // 1. Primeira chamada — modelo decide qual função chamar
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        {
          role: "system",
          content: "Você é um assistente de notas. Responda de forma curta e direta confirmando o que foi feito. Não invente informações que não foram fornecidas." 
        },
        { role: "user", content: message },
      ],
      tools,
      tool_choice: "auto",
    }),
  });

  const data = await res.json();
  console.log("groq response:", JSON.stringify(data, null, 2));

  if (data.error) {
    console.error("Groq error (1st call):", data.error.message);
    return NextResponse.json(
      { reply: `Erro ao contatar o modelo: ${data.error.message}` },
      { status: 200 }
    );
  }

  const choice = data.choices[0];

  // 2. Modelo não chamou função — resposta direta
  if (choice.finish_reason !== "tool_calls") {
    return NextResponse.json({ reply: choice.message.content });
  }

  // 3. Modelo quer chamar uma função — executa no seu código
  const toolCall = choice.message.tool_calls[0];
  const fnName = toolCall.function.name;
  const args = JSON.parse(toolCall.function.arguments);

  let toolResult = "";

  if (fnName === "create_note") {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const { error } = await supabase
      .from("notes")
      .insert({ content: args.content, user_id: user?.id });
    toolResult = error ? `Erro: ${error.message}` : "Nota criada com sucesso!";
  }

  if (fnName === "list_notes") {
    const { data: notes } = await supabase
      .from("notes")
      .select("id, content");
    toolResult = JSON.stringify(notes);
  }

  if (fnName === "delete_note") {
    const { error } = await supabase
      .from("notes")
      .delete()
      .eq("id", args.id);
    toolResult = error ? `Erro: ${error.message}` : "Nota deletada!";
  }

  // 4. Segunda chamada — modelo formula resposta final com o resultado
  const finalRes = await fetch(
    "https://api.groq.com/openai/v1/chat/completions",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: "system", content: "Você é um assistente de notas." },
          { role: "user", content: message },
          choice.message,
          {
            role: "tool",
            tool_call_id: toolCall.id,
            content: toolResult,
          },
        ],
      }),
    }
  );

  const finalData = await finalRes.json();
  console.log("groq final:", JSON.stringify(finalData, null, 2));

  if (finalData.error) {
    console.error("Groq error (2nd call):", finalData.error.message);
    return NextResponse.json(
      { reply: `Erro na resposta final: ${finalData.error.message}` },
      { status: 200 }
    );
  }

  return NextResponse.json({
    reply: finalData.choices[0].message.content,
  });
}