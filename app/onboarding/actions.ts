"use server";

import { createClient } from "@/lib/supabase-server";
import { revalidatePath } from "next/cache";

export async function saveOnboardingData(college: string, branch: string, avatarUrl: string | null) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthenticated request" };
  }

  // Update auth metadata so layout.tsx can do a lightning-fast check
  // Storing college and branch here as well since DB update is removed
  const { error: authError } = await supabase.auth.updateUser({
    data: {
      college: college,
      branch: branch,
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