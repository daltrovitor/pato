"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function createPassword(nome?: string) {
  const supabase = await createClient();

  // Protect the action
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  // Generate a random 4 digit code
  const code = Math.floor(1000 + Math.random() * 9000).toString();

  const { data: newPassword, error } = await supabase
    .from("passwords")
    .insert([{ codigo: code, nome: nome || null }])
    .select()
    .single();

  if (error) {
    console.error("Supabase insert error:", error);
    throw new Error(error.message || "Failed to create password");
  }

  revalidatePath("/admin");
  return newPassword;
}

export async function getPasswords() {
  const supabase = await createClient();

  // Protect the action
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: passwords, error } = await supabase
    .from("passwords")
    .select("*")
    .order("criado_em", { ascending: false });

  if (error) {
    console.error("Supabase select error:", error);
    return [];
  }

  return passwords.map((p) => ({
    ...p,
    criado_em: new Date(p.criado_em),
    data_expiracao: p.data_expiracao ? new Date(p.data_expiracao) : null,
  }));
}

export async function updatePasswordName(id: string, nome: string) {
  const supabase = await createClient();

  // Protect the action
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { error } = await supabase
    .from("passwords")
    .update({ nome })
    .eq("id", id);

  if (error) {
    console.error("Supabase update error:", error);
    throw new Error(error.message || "Failed to update password name");
  }

  revalidatePath("/admin");
}

export async function validatePassword(code: string) {
  // Public action for the show experience, doesn't need to be protected by auth
  const supabase = await createClient();

  if (!code || code.length !== 4) {
    return { valid: false, message: "Insira uma senha de 4 dígitos." };
  }

  const { data: password, error } = await supabase
    .from("passwords")
    .select("*")
    .eq("codigo", code)
    .single();

  if (error || !password) {
    return { valid: false, message: "Senha inválida." };
  }

  if (!password.foi_ativada) {
    const { error: updateError } = await supabase
      .from("passwords")
      .update({ foi_ativada: true })
      .eq("id", password.id);

    if (updateError) {
      return { valid: false, message: "Erro ao ativar a senha no banco de dados." };
    }
  }

  return { valid: true, message: "Senha válida!" };
}
