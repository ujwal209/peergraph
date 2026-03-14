"use server";

import { createClient } from "@/lib/supabase-server";

export async function getDashboardData() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return {
      user: null,
      stats: { karma: 0, sessionsTaken: 0, completion: 0 },
      activeSessions: []
    };
  }

  // 1. Fetch User Stats (Karma, Sessions Taken, etc.) from public.users
  const { data: userData } = await supabase
    .from('users')
    .select('karma_points, peer_sessions_taken, full_name')
    .eq('id', user.id)
    .single();

  // 2. Fetch REAL live peer sessions
  const { data: activeSessions } = await supabase
    .from('peer_sessions')
    .select(`
      id,
      title,
      status,
      tags,
      max_participants,
      meeting_link,
      host:users!host_id (
        full_name,
        avatar_url
      )
    `)
    .eq('status', 'live')
    .order('created_at', { ascending: false })
    .limit(6);

  // Return aggregated data payload
  return {
    user: {
      id: user.id,
      firstName: userData?.full_name?.split(' ')[0] || 'Peer',
    },
    stats: {
      karma: userData?.karma_points || 0,
      sessionsTaken: userData?.peer_sessions_taken || 0,
      // Defaulting to 0 until you link a specific curriculum progress table
      completion: 0 
    },
    activeSessions: activeSessions || []
  };
}