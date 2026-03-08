"use server";

import { createClient } from "@/lib/supabase-server";
import { revalidatePath } from "next/cache";

export async function saveOnboardingData(college: string, branch: string, avatarUrl: string | null) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthenticated request" };
  }

  // 1. Update the actual public.users database table
  const { error: dbError } = await supabase
    .from("users")
    .update({
      college: college,
      branch: branch,
      avatar_url: avatarUrl,
      first_login: false, // Mark onboarding as complete in DB
    })
    .eq("id", user.id);

  if (dbError) {
    console.error("DB Update Error:", dbError);
    return { error: "Failed to update user profile in database." };
  }

  // 2. Update auth metadata so layout.tsx can do a lightning-fast check
  const { error: authError } = await supabase.auth.updateUser({
    data: {
      onboarded: true,
      avatar_url: avatarUrl,
    }
  });

  if (authError) {
    return { error: authError.message };
  }

  // Clear cache so the layout sees the new metadata
  revalidatePath("/", "layout");
  return { success: true };
}