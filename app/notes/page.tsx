"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";

type Note = {
    id: string;
    content: string;
    created_at: string;
};

export default function NotesPage() {
    const [notes, setNotes] = useState<Note[]>([]);
    const [content, setContent] = useState("");
    const [summary, setSummary] = useState("");
    const [loadingSummary, setLoadingSummary] = useState(false);
    const router = useRouter();
    const supabase = createClient();

    useEffect(() => {
        checkUserAndFetchNotes();
    }, []);

    async function checkUserAndFetchNotes() {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return router.push("/login");
        fetchNotes();
    }

    async function fetchNotes() {
        const { data } = await supabase
            .from("notes")
            .select("*")
            .order("created_at", { ascending: false });
        if (data) setNotes(data);
    }

    async function addNote() {
        if (!content.trim()) return;
        const { data: { user } } = await supabase.auth.getUser();
        await supabase.from("notes").insert({ content, user_id: user?.id });
        setContent("");
        fetchNotes();
    }

    async function deleteNote(id: string) {
        await supabase.from("notes").delete().eq("id", id);
        fetchNotes();
    }

    async function summarizeNotes() {
        setLoadingSummary(true);
        setSummary("");
        const { data: { session } } = await supabase.auth.getSession();

        const res = await fetch(
            `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/summarize`,
            {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${session?.access_token}`,
                    "Content-Type": "application/json",
                },
            }
        );

        const { summary } = await res.json();
        setSummary(summary);
        setLoadingSummary(false);
    }

    async function signOut() {
        await supabase.auth.signOut();
        router.push("/login");
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-xl mx-auto px-4 py-10">

                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-lg font-medium text-gray-900">Minhas notas</h1>
                    <button
                        onClick={signOut}
                        className="text-sm text-gray-500 hover:text-gray-700"
                    >
                        Sair
                    </button>
                </div>

                {/* Adicionar nota */}
                <div className="flex gap-2 mb-6">
                    <input
                        type="text"
                        placeholder="Nova nota..."
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && addNote()}
                        className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 outline-none focus:border-gray-400 placeholder:text-gray-400"
                    />
                    <button
                        onClick={addNote}
                        className="bg-black text-white rounded-lg px-4 py-2 text-sm hover:bg-gray-800"
                    >
                        Adicionar
                    </button>
                </div>

                {/* Lista de notas */}
                <div className="flex flex-col gap-2 mb-6">
                    {notes.length === 0 && (
                        <p className="text-sm text-gray-400 text-center py-8">
                            Nenhuma nota ainda.
                        </p>
                    )}
                    {notes.map((note) => (
                        <div
                            key={note.id}
                            className="bg-white border border-gray-200 rounded-lg px-4 py-3 flex justify-between items-start"
                        >
                            <p className="text-sm text-gray-700">{note.content}</p>
                            <button
                                onClick={() => deleteNote(note.id)}
                                className="text-gray-300 hover:text-red-400 text-xs ml-4 flex-shrink-0"
                            >
                                deletar
                            </button>
                        </div>
                    ))}
                </div>

                {/* Resumo com IA */}
                {notes.length > 0 && (
                    <div className="border border-gray-200 rounded-xl p-4 bg-white">
                        <button
                            onClick={summarizeNotes}
                            disabled={loadingSummary}
                            className="w-full text-sm bg-black text-white rounded-lg px-3 py-2 hover:bg-gray-800 disabled:opacity-50"
                        >
                            {loadingSummary ? "Gerando resumo..." : "Resumir notas com IA"}
                        </button>
                        {summary && (
                            <p className="mt-4 text-sm text-gray-700 whitespace-pre-wrap">
                                {summary}
                            </p>
                        )}
                    </div>
                )}

            </div>
        </div>
    );
}