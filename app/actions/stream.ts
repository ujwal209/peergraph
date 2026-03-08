"use server";

import { StreamClient } from '@stream-io/node-sdk';
import { createClient } from "@/lib/supabase-server";

const apiKey = process.env.NEXT_PUBLIC_STREAM_API_KEY!;
const apiSecret = process.env.STREAM_SECRET_KEY!;

export async function generateStreamToken(roomId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) throw new Error("Unauthorized");

  const streamClient = new StreamClient(apiKey, apiSecret);
  
  const exp = Math.round(new Date().getTime() / 1000) + 60 * 60;
  const issued = Math.floor(Date.now() / 1000) - 60;

  const token = streamClient.createToken(user.id, exp, issued);

  // Check if the user is the host of this session
  const meetingLink = `/dashboard/sessions/room/${roomId}`;
  const { data: session } = await supabase
    .from("peer_sessions")
    .select("host_id")
    .eq("meeting_link", meetingLink)
    .single();

  const isHost = session?.host_id === user.id;

  return { 
    token, 
    user: { id: user.id, name: user.user_metadata?.full_name || 'Anonymous Peer', image: user.user_metadata?.avatar_url },
    isHost
  };
}


export async function endPeerSession(roomId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return { error: "Unauthorized" };

  // Update the session to 'ended' ONLY if the requester is the host
  const { error } = await supabase
    .from("peer_sessions")
    .update({ status: 'ended' })
    .ilike("meeting_link", `%${roomId}%`)
    .eq("host_id", user.id);

  if (error) {
    console.error("Failed to end session in DB:", error);
    return { error: error.message };
  }

  return { success: true };
}