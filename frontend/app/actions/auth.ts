"use server";

import { apiClient } from "@/lib/api-client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";

export async function login(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const response = await apiClient.post("/auth/login", { email, password });

  if (response.error || (response.detail && typeof response.detail === "string")) {
    return { error: response.error || response.detail };
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function signup(formData: FormData) {
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const response = await apiClient.post("/auth/signup", { name, email, password });

  if (response.error || response.detail) {
    return { error: response.error || response.detail };
  }

  return { success: response.message || "Initialization Sequence Started." };
}

export async function verifyEmailOTP(email: string, token: string) {
  const response = await apiClient.post("/auth/verify-otp", { email, token });

  if (response.error || response.detail) {
    return { error: response.error || response.detail };
  }

  redirect("/login?message=Identity verified. You may now resume session.");
}

export async function sendPasswordResetOTP(email: string) {
  const response = await apiClient.post(`/auth/send-reset-otp?email=${encodeURIComponent(email)}`, {});

  if (response.error || response.detail) {
    return { error: response.error || response.detail };
  }

  return { success: response.message || "Recovery sequence initiated." };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}