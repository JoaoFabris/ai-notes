"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase";

export default function ChatPage() {
    const [message, setMessage] = useState("");
    const [history, setHistory] = useState<{ role: string; text: string }[]>([]);
    const [loading, setLoading] = useState(false);
    const supabase = createClient();

    async function sendMessage() {
        if (!message.trim()) return;

        const userMessage = message;
        setMessage("");
        setHistory((prev) => [...prev, { role: "user", text: userMessage }]);
        setLoading(true);

        const { data: { session } } = await supabase.auth.getSession();

        const res = await fetch("/api/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                message: userMessage,
                accessToken: session?.access_token,
            }),
        });

        const data = await res.json();
        setHistory((prev) => [...prev, { role: "assistant", text: data.reply }]);
        setLoading(false);
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-xl mx-auto px-4 py-10">

                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-lg font-medium text-gray-900">Chat com IA</h1>
                    <a href="/notes" className="text-sm text-gray-500 hover:text-gray-700">
                        Ver notas
                    </a>
                </div>

                {/* Histórico */}
                <div className="flex flex-col gap-3 mb-6 min-h-64">
                    {history.length === 0 && (
                        <p className="text-sm text-gray-400 text-center py-8">
                            Tente: "cria uma nota sobre comprar leite" ou "lista minhas notas"
                        </p>
                    )}
                    {history.map((msg, i) => (
                        <div
                            key={i}
                            className={`px-4 py-3 rounded-lg text-sm max-w-sm ${msg.role === "user"
                                    ? "bg-black text-white self-end ml-auto"
                                    : "bg-white border border-gray-200 text-gray-700"
                                }`}
                        >
                            {msg.text}
                        </div>
                    ))}
                    {loading && (
                        <div className="bg-white border border-gray-200 rounded-lg px-4 py-3 text-sm text-gray-400 max-w-sm">
                            Pensando...
                        </div>
                    )}
                </div>

                {/* Input */}
                <div className="flex gap-2">
                    <input
                        type="text"
                        placeholder="Digite uma instrução..."
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                        className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 outline-none focus:border-gray-400 placeholder:text-gray-400"
                    />
                    <button
                        onClick={sendMessage}
                        disabled={loading}
                        className="bg-black text-white rounded-lg px-4 py-2 text-sm hover:bg-gray-800 disabled:opacity-50"
                    >
                        Enviar
                    </button>
                </div>

            </div>
        </div>
    );
}