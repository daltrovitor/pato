"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Loader2, LogIn, Mail, Lock } from "lucide-react";
import { login } from "@/app/actions/auth";

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  const handleSubmit = async (formData: FormData) => {
    setIsPending(true);
    const res = await login(formData);
    if (res?.error) {
      setError(res.error);
    }
    setIsPending(false);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-sm bg-surface border border-border p-8 shadow-none rounded-none"
      >
        <div className="flex flex-col items-center mb-8">
          <h1 className="text-xl font-black text-foreground uppercase tracking-widest text-center mt-2">
            Painel do Lafa
          </h1>
          <p className="text-[10px] text-muted font-bold mt-1 uppercase tracking-widest text-center">
            Controle das senhas do pato
          </p>
        </div>

        <form action={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] uppercase font-bold text-muted tracking-widest mb-1.5">
              E-mail de acesso
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
              <input
                type="email"
                name="email"
                className="w-full bg-background border border-border pl-10 pr-4 py-3 text-sm text-foreground focus:outline-none focus:border-accent transition-colors rounded-none placeholder:text-muted/50"
                placeholder="admin@exemplo.com"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] uppercase font-bold text-muted tracking-widest mb-1.5">
              Senha
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
              <input
                type="password"
                name="password"
                className="w-full bg-background border border-border pl-10 pr-4 py-3 text-sm text-foreground focus:outline-none focus:border-accent transition-colors rounded-none placeholder:text-muted/50"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          {error && (
            <div className="text-[10px] uppercase tracking-widest font-bold text-danger bg-danger/10 border border-danger/20 p-3 rounded-none text-center">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="w-full bg-accent hover:bg-accent-hover text-black font-bold uppercase tracking-widest py-3 text-[10px] flex items-center justify-center gap-2 transition-colors disabled:opacity-50 mt-6 rounded-none shadow-[4px_4px_0_rgba(251,191,36,0.3)] hover:shadow-none hover:translate-x-[4px] hover:translate-y-[4px]"
          >
            {isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                Entrar no sistema
              </>
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
