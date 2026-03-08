"use server";

import { createClient } from "@/lib/supabase-server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { sendOTPEmail } from "@/lib/mailer";
import crypto from "crypto";

function generateOTP() {
  return crypto.randomInt(100000, 999999).toString();
}

export async function login(formData: FormData) {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function signup(formData: FormData) {
  // SAFETY CHECK: Ensure keys exist before hitting the API
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return { error: "Server Configuration Error: Missing SUPABASE_SERVICE_ROLE_KEY" };
  }

  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  // 1. Create user in Supabase Auth via Admin Client
  const { data: userData, error: userError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: false,
    user_metadata: { full_name: name }
  });

  if (userError) {
    // If user already exists but unconfirmed, we fall through to generate a new OTP
    if (userError.message.includes("already registered")) {
      console.log("User already exists, falling through to send new OTP");
    } else {
      console.error("Supabase Admin Error:", userError);
      return { error: userError.message }; // This is where "Invalid API key" was triggering
    }
  }

  // 2. Generate and store OTP
  const otpCode = generateOTP();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  const { error: otpError } = await supabaseAdmin
    .from("otps")
    .insert({
      email,
      code: otpCode,
      type: "signup",
      expires_at: expiresAt.toISOString()
    });

  if (otpError) {
    console.error("OTP Insert Error:", otpError);
    return { error: "Failed to generate security sequence in database" };
  }

  // 3. Send via Mailer
  try {
    await sendOTPEmail(email, otpCode, "signup");
  } catch (error: any) {
    console.error("Mail Error:", error);
    // If the mailer throws an Invalid API key error, we catch it here
    if (error?.message?.toLowerCase().includes("api key")) {
      return { error: "Mailer Error: Invalid or missing Email Provider API Key" };
    }
    return { error: "Failed to dispatch verification email" };
  }

  return { success: "Initialization Sequence Started. Check your institutional node." };
}

export async function verifyEmailOTP(email: string, token: string) {
  // 1. Verify OTP in our table
  const { data: otpData, error: otpError } = await supabaseAdmin
    .from("otps")
    .select("*")
    .eq("email", email)
    .eq("code", token)
    .eq("type", "signup")
    .eq("used", false)
    .gt("expires_at", new Date().toISOString())
    .single();

  if (otpError || !otpData) {
    return { error: "Invalid or expired verification sequence" };
  }

  // 2. Mark OTP as used
  await supabaseAdmin.from("otps").update({ used: true }).eq("id", otpData.id);

  // 3. Confirm user via Admin tool
  const { data: userList } = await supabaseAdmin.auth.admin.listUsers();
  const user = userList.users.find(u => u.email === email);
  
  if (user) {
    await supabaseAdmin.auth.admin.updateUserById(user.id, {
        email_confirm: true
    });
  }

  redirect("/login?message=Identity verified. You may now resume session.");
}

export async function sendPasswordResetOTP(email: string) {
  const { data: userList } = await supabaseAdmin.auth.admin.listUsers();
  const user = userList.users.find(u => u.email === email);
  
  if (!user) {
    return { error: "Identity not found in network registry" };
  }

  const otpCode = generateOTP();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  const { error: otpError } = await supabaseAdmin
    .from("otps")
    .insert({
      email,
      code: otpCode,
      type: "recovery",
      expires_at: expiresAt.toISOString()
    });

  if (otpError) return { error: "Failed to generate recovery sequence" };

  try {
    await sendOTPEmail(email, otpCode, "recovery");
  } catch (error) {
    return { error: "Failed to dispatch recovery sequence" };
  }

  return { success: "Recovery sequence initiated. Check your node." };
}

export async function verifyResetOTP(email: string, token: string) {
  const { data: otpData, error: otpError } = await supabaseAdmin
    .from("otps")
    .select("*")
    .eq("email", email)
    .eq("code", token)
    .eq("type", "recovery")
    .eq("used", false)
    .gt("expires_at", new Date().toISOString())
    .single();

  if (otpError || !otpData) {
    return { error: "Invalid or expired recovery sequence" };
  }

  await supabaseAdmin.from("otps").update({ used: true }).eq("id", otpData.id);

  redirect(`/reset-password?email=${encodeURIComponent(email)}`);
}

export async function updatePassword(password: string, email?: string) {
  if (!email) return { error: "Identity verification required" };

  const { data: userList } = await supabaseAdmin.auth.admin.listUsers();
  const user = userList.users.find(u => u.email === email);

  if (!user) return { error: "Identity not found" };

  const { error } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
    password: password
  });

  if (error) return { error: error.message };
  redirect("/login?message=Sequence key updated successfully");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}