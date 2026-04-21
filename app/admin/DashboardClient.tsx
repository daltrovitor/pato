"use client";

import { useState, useEffect, useCallback, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { KeyRound, Plus, Clock, CheckCircle2, XCircle, Copy, Loader2, LogOut, Edit2, Check, X, Save } from "lucide-react";
import { createPassword, getPasswords, updatePasswordName } from "@/app/actions/password";
import { logout } from "@/app/actions/auth";

interface PasswordRecord {
  id: string;
  codigo: string;
  nome: string | null;
  foi_ativada: boolean;
  criado_em: Date;
  data_expiracao: Date | null;
}

export default function DashboardClient({ userEmail }: { userEmail: string }) {
  const [passwords, setPasswords] = useState<PasswordRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState("");

  const fetchPasswords = useCallback(async () => {
    try {
      const data = await getPasswords();
      setPasswords(data);
    } catch (error) {
      console.error("Failed to fetch passwords:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPasswords();
  }, [fetchPasswords]);

  const handleGenerate = () => {
    startTransition(async () => {
      try {
        await createPassword();
        await fetchPasswords();
      } catch (error) {
        console.error("Failed to generate password:", error);
      }
    });
  };

  const handleUpdateName = async (id: string, name: string) => {
    try {
      await updatePasswordName(id, name);
      await fetchPasswords();
    } catch (error) {
      console.error("Failed to update name:", error);
    }
    setEditingId(null);
  };

  const copyToClipboard = async (code: string) => {
    await navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const getStatus = (p: PasswordRecord) => {
    if (!p.foi_ativada) return "pending";
    if (p.data_expiracao && new Date(p.data_expiracao) < new Date())
      return "expired";
    return "active";
  };

  const formatDate = (date: Date | null) => {
    if (!date) return "—";
    return new Date(date).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-surface/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-xl font-extrabold tracking-tight text-foreground uppercase">
                Painel do Lafa
              </h1>
              <p className="text-[10px] text-muted font-bold uppercase tracking-widest mt-1">
                Controle das senhas do pato
              </p>
              <p className="text-[9px] text-muted/50 font-bold uppercase pt-1 mt-1 border-t border-border/50">
                {userEmail}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => logout()}
              className="p-2.5 text-muted hover:text-danger bg-surface hover:bg-danger/10 border border-border transition-colors rounded-none"
              title="Sair do sistema"
            >
              <LogOut className="w-4 h-4" />
            </button>
            <motion.button
              id="generate-password-btn"
              onClick={handleGenerate}
              disabled={isPending}
              className="flex items-center gap-2 px-5 py-2.5 bg-accent text-black font-bold rounded-none
                hover:bg-accent-hover transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed
                text-sm shadow-[4px_4px_0_rgba(251,191,36,0.3)] hover:translate-x-[4px] hover:translate-y-[4px] hover:shadow-none"
            >
              {isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              GERAR SENHA
            </motion.button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-surface border border-border rounded-none p-6 shadow-none hover:border-border/80 transition-colors"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] uppercase tracking-widest text-muted font-bold">
                Total Geradas
              </span>
              <div className="w-8 h-8 rounded-none bg-background flex items-center justify-center border border-border">
                <KeyRound className="w-4 h-4 text-muted" />
              </div>
            </div>
            <p className="text-4xl font-extrabold text-foreground font-mono">{passwords.length}</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-surface border border-border rounded-none p-6 shadow-none hover:border-accent/30 transition-colors"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] uppercase tracking-widest text-muted font-bold">
                Aguardando
              </span>
              <div className="w-8 h-8 rounded-none bg-accent/10 flex items-center justify-center border border-accent/20">
                <Clock className="w-4 h-4 text-accent" />
              </div>
            </div>
            <p className="text-4xl font-extrabold text-accent flex items-baseline gap-2 font-mono">
              {passwords.filter((p) => !p.foi_ativada).length}
            </p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-surface border border-border rounded-none p-6 shadow-none hover:border-success/30 transition-colors"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] uppercase tracking-widest text-muted font-bold">
                Ativadas
              </span>
              <div className="w-8 h-8 rounded-none bg-success/10 flex items-center justify-center border border-success/20">
                <CheckCircle2 className="w-4 h-4 text-success" />
              </div>
            </div>
            <p className="text-4xl font-extrabold text-success flex items-baseline gap-2 font-mono">
              {passwords.filter((p) => p.foi_ativada).length}
            </p>
          </motion.div>
        </div>

        {/* Password List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-surface border border-border rounded-none overflow-hidden shadow-none"
        >
          <div className="px-6 py-5 border-b border-border bg-surface-hover/30 flex justify-between items-center">
            <h2 className="text-[10px] font-bold tracking-widest uppercase text-muted">
              Últimas Senhas
            </h2>
          </div>

          {loading ? (
            <div className="p-16 text-center text-muted flex flex-col items-center">
              <Loader2 className="w-8 h-8 animate-spin mb-4 text-accent" />
              <p className="text-xs uppercase tracking-widest font-bold">Sincronizando...</p>
            </div>
          ) : passwords.length === 0 ? (
            <div className="p-16 text-center text-muted">
              <div className="w-16 h-16 rounded-none bg-background flex items-center justify-center mx-auto mb-4 border border-border">
                <KeyRound className="w-8 h-8 opacity-40" />
              </div>
              <p className="text-xs uppercase tracking-widest font-bold text-foreground mb-1">Base vazia</p>
              <p className="text-xs text-muted font-mono">
                Crie a primeira senha para começar.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              <AnimatePresence>
                {passwords.map((p, i) => {
                  const status = getStatus(p);
                  return (
                    <motion.div
                      key={p.id}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-0 justify-between px-6 py-5 hover:bg-surface-hover/50 transition-colors group"
                    >
                      <div className="flex items-center gap-5">
                        <div className="flex flex-col">
                          {editingId === p.id ? (
                            <div className="flex items-center gap-2 mb-1">
                              <input
                                autoFocus
                                type="text"
                                value={editingValue}
                                onChange={(e) => setEditingValue(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") handleUpdateName(p.id, editingValue);
                                  if (e.key === "Escape") setEditingId(null);
                                }}
                                className="text-[11px] text-white bg-background border border-accent/50 px-3 py-2 uppercase font-bold tracking-widest w-48 focus:outline-none"
                              />
                              <button 
                                onClick={() => handleUpdateName(p.id, editingValue)}
                                className="p-2 bg-success text-black hover:bg-success/80 transition-colors"
                                title="Salvar nome"
                              >
                                <Save className="w-3.5 h-3.5" />
                              </button>
                              <button 
                                onClick={() => setEditingId(null)}
                                className="p-2 bg-surface border border-border text-muted hover:text-white transition-colors"
                                title="Cancelar"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 group/name">
                              <span 
                                onClick={() => {
                                  setEditingId(p.id);
                                  setEditingValue(p.nome || "");
                                }}
                                className="text-[10px] text-muted font-bold uppercase tracking-widest mb-1 cursor-pointer hover:text-accent transition-colors"
                                title="Clique para dar um nome"
                              >
                                {p.nome ? `Pato: ${p.nome}` : "Acesso Anônimo (Clique para nomear)"}
                              </span>
                              <Edit2 
                                className="w-3 h-3 text-muted/30 opacity-0 group-hover/name:opacity-100 cursor-pointer mb-1" 
                                onClick={() => {
                                  setEditingId(p.id);
                                  setEditingValue(p.nome || "");
                                }}
                              />
                            </div>
                          )}
                          <div className="flex items-center gap-3">
                            <code className="text-2xl font-mono font-black tracking-[0.4em] text-white bg-background px-3 py-1 border border-border">
                              {p.codigo}
                            </code>
                            <button
                              onClick={() => copyToClipboard(p.codigo)}
                              className="p-2 rounded-none bg-background hover:bg-border/50 transition-all text-muted hover:text-white border border-border
                                opacity-0 group-hover:opacity-100 focus:opacity-100"
                              title="Copiar senha"
                            >
                              <Copy className="w-4 h-4" />
                            </button>
                            {copiedCode === p.codigo && (
                              <motion.span
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                className="text-[10px] font-bold uppercase tracking-widest text-background bg-success px-2 py-1 rounded-none border border-success"
                              >
                                Copiado
                              </motion.span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col sm:items-end gap-2 text-sm">
                        <div className="flex items-center gap-2">
                          {status === "pending" && (
                            <span className="flex items-center gap-1.5 text-accent bg-background border border-accent/50 px-3 py-1.5 rounded-none text-[9px] font-black uppercase tracking-widest">
                              <Clock className="w-3 h-3" />
                              Aguardando
                            </span>
                          )}
                          {status === "active" && (
                            <span className="flex items-center gap-1.5 text-success bg-background border border-success/50 px-3 py-1.5 rounded-none text-[9px] font-black uppercase tracking-widest">
                              <CheckCircle2 className="w-3 h-3" />
                              Ativa
                            </span>
                          )}
                          {status === "expired" && (
                            <span className="flex items-center gap-1.5 text-danger bg-background border border-danger/50 px-3 py-1.5 rounded-none text-[9px] font-black uppercase tracking-widest">
                              <XCircle className="w-3 h-3" />
                              Expirada
                            </span>
                          )}
                        </div>

                        {status === "active" && (
                          <p className="text-[10px] text-muted mt-1 uppercase font-bold tracking-wider">
                            Válida até:{" "}
                            <span className="font-mono text-gray-300">
                              {formatDate(p.data_expiracao)}
                            </span>
                          </p>
                        )}
                        {status === "expired" && (
                          <p className="text-[10px] text-muted mt-1 uppercase font-bold tracking-wider">
                            Venceu em:{" "}
                            <span className="font-mono text-gray-300">
                              {formatDate(p.data_expiracao)}
                            </span>
                          </p>
                        )}
                        {status === "pending" && (
                          <p className="text-[10px] text-muted mt-1 uppercase font-bold tracking-wider">
                            Criada em:{" "}
                            <span className="font-mono text-gray-300">
                              {formatDate(p.criado_em)}
                            </span>
                          </p>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
}
