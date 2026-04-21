"use client";

import { useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, ArrowRight, ShieldAlert } from "lucide-react";
import { validatePassword } from "@/app/actions/password";
import ShowExperience from "@/components/ShowExperience";

export default function HomePage() {
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [showData, setShowData] = useState<{ active: boolean; expiresAt?: string }>({
    active: false,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length !== 4) {
      setError("A senha deve conter exatamente 4 dígitos.");
      return;
    }

    startTransition(async () => {
      setError(null);
      try {
        const result = await validatePassword(code);
        if (result.valid && result.expiresAt) {
          setShowData({ active: true, expiresAt: result.expiresAt });
        } else {
          setError(result.message);
        }
      } catch (err) {
        setError("Erro ao se conectar com o servidor.");
      }
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, "").slice(0, 4);
    setCode(val);
    if (error) setError(null);
  };

  if (showData.active && showData.expiresAt) {
    return <ShowExperience expiresAt={showData.expiresAt} />;
  }

  return (
    <main className="min-h-screen bg-background flex flex-col items-center justify-center relative overflow-hidden px-4">
      {/* Dynamic Background */}
      <div className="absolute inset-0 top-0 left-0 right-0 bottom-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-accent/5 rounded-none blur-[100px] mix-blend-screen" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-amber-600/5 rounded-none blur-[80px] mix-blend-screen" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="w-full max-w-md relative z-10"
      >
        <div className="backdrop-blur-xl bg-surface/40 border border-border/50 rounded-none p-8 shadow-2xl">
          <div className="text-center mb-10">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="w-16 h-16 mx-auto bg-accent/10 rounded-none flex items-center justify-center mb-6 shadow-[0_0_20px_rgba(251,191,36,0.15)]"
            >
              <span className="text-3xl filter drop-shadow-lg">🦆</span>
            </motion.div>
            <h1 className="text-3xl font-black tracking-tight text-white mb-2">
              Pato do Lafa
            </h1>
            <p className="text-sm text-muted font-medium">
              Insira seu código de 4 dígitos para acessar a experiência.
            </p>
              <p className="text-sm text-muted font-medium">
            E se vc tá aqui parabéns.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <div className="relative">
                <input
                  type="text"
                  inputMode="numeric"
                  value={code}
                  onChange={handleInputChange}
                  className="w-full bg-background/50 border-2 border-border/50 rounded-none px-6 py-5
                    text-4xl text-center font-mono font-black tracking-[0.5em] text-white
                    focus:outline-none focus:border-accent/50 focus:ring-4 focus:ring-accent/10 transition-all
                    placeholder:text-muted/30"
                  placeholder="0000"
                  autoComplete="off"
                />
              </div>
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0, y: -10 }}
                    animate={{ opacity: 1, height: "auto", y: 0 }}
                    exit={{ opacity: 0, height: 0, y: -10 }}
                    className="flex items-center gap-2 text-danger text-sm font-medium mt-3 justify-center"
                  >
                    <ShieldAlert className="w-4 h-4" />
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <motion.button
              type="submit"
              disabled={code.length !== 4 || isPending}
              className="w-full py-4 bg-accent text-black font-extrabold text-lg rounded-none flex items-center justify-center gap-2
                hover:bg-accent-hover transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed
                shadow-[0_0_30px_rgba(251,191,36,0.2)] hover:shadow-[0_0_40px_rgba(251,191,36,0.4)]"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {isPending ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <>
                  Entrar
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </motion.button>
          </form>

          <div className="mt-8 pt-6 border-t border-border/50 text-center">
             <p className="text-xs text-muted/60 font-medium">
               A senha expira em 1 hora após a ativação original.
             </p>
          </div>
        </div>
      </motion.div>
    </main>
  );
}
