"use server";

import { createClient } from "@/lib/supabase-server";
import { revalidatePath } from "next/cache";

export async function registerPeerSession(subject: string, hourlyRate: number, about: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unidentified Node" };
  }

  const { error } = await supabase
    .from("peer_registrations")
    .insert({
      user_id: user.id,
      subject,
      hourly_rate: hourlyRate,
      about,
    });

  if (error) {
    return { error: "Registry failure: " + error.message };
  }

  revalidatePath("/dashboard");
  return { success: true };
}
