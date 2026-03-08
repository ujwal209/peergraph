"use server";

import { createClient } from "@/lib/supabase-server";

export async function getLandingUser() {
  try {
    const supabase = await createClient();
    
    // Securely get the user from server-side cookies
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return null;

    // Fetch their latest profile data from the database
    const { data: profile } = await supabase
      .from('users')
      .select('avatar_url, full_name')
      .eq('id', user.id)
      .single();

    return {
      id: user.id,
      email: user.email,
      // Prefer the DB avatar, fallback to the auth metadata avatar
      avatar_url: profile?.avatar_url || user.user_metadata?.avatar_url || null,
      // Get the first letter of their name or email for the fallback UI
      initial: (profile?.full_name || user.email || "P")[0].toUpperCase()
    };
  } catch (error) {
    console.error("Error fetching landing user:", error);
    return null;
  }
}