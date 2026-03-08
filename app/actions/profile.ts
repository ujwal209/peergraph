"use server";

import { createClient } from "@/lib/supabase-server";

export async function getUserProfile() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: "Unauthorized" };
  }

  try {
    const { data: dbUser, error: dbError } = await supabase
      .from("users")
      .select("*")
      .eq("email", user.email)
      .single();

    if (dbError && dbError.code !== 'PGRST116') throw dbError; 

    return { authUser: user, dbUser: dbUser || {} };
  } catch (error: any) {
    return { error: error.message || "Failed to fetch profile" };
  }
}

export async function updateUserProfile(formData: {
  full_name: string;
  semester: number;
  college: string;
  branch: string;
  avatar_url: string;
}) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) return { error: "Unauthorized access" };

  try {
    const { error: dbError } = await supabase
      .from("users")
      .update({
        full_name: formData.full_name,
        semester: formData.semester,
        college: formData.college,
        branch: formData.branch,
        avatar_url: formData.avatar_url,
      })
      .eq("email", user.email);

    if (dbError) throw dbError;

    await supabase.auth.updateUser({
      data: {
        full_name: formData.full_name,
        avatar_url: formData.avatar_url,
      }
    });

    return { success: true };
  } catch (error: any) {
    console.error("Profile update failed:", error);
    return { error: error.message || "Failed to update profile" };
  }
}