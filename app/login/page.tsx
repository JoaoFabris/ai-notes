"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isSignUp, setIsSignUp] = useState(false);
    const [error, setError] = useState("");
    const router = useRouter();
    const supabase = createClient();

    async function handleSubmit() {
        setError("");

        if (isSignUp) {
            const { error } = await supabase.auth.signUp({ email, password });
            if (error) return setError(error.message);
            router.push("/notes");
        } else {
            const { error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) return setError(error.message);
            router.push("/notes");
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="bg-white p-8 rounded-xl border border-gray-200 w-full max-w-sm">
                <h1 className="text-lg font-medium mb-6 text-gray-900">
                    {isSignUp ? "Criar conta" : "Entrar"}
                </h1>

                <div className="flex flex-col gap-3">
                    <input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 outline-none focus:border-gray-400 placeholder:text-gray-400"
                    />
                    <input
                        type="password"
                        placeholder="Senha"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 outline-none focus:border-gray-400 placeholder:text-gray-400"
                    />

                    {error && (
                        <p className="text-red-500 text-sm">{error}</p>
                    )}

                    <button
                        onClick={handleSubmit}
                        className="bg-black text-white rounded-lg px-3 py-2 text-sm hover:bg-gray-800"
                    >
                        {isSignUp ? "Criar conta" : "Entrar"}
                    </button>

                    <button
                        onClick={() => setIsSignUp(!isSignUp)}
                        className="text-gray-500 text-sm hover:text-gray-700"
                    >
                        {isSignUp ? "Já tenho conta" : "Criar conta"}
                    </button>
                </div>
            </div>
        </div>
    );
}