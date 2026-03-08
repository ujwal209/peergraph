"use server";

import { createClient } from "@/lib/supabase-server";

export async function getSubjectsForDropdown() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return { error: "Unauthorized" };

  try {
    const { data, error } = await supabase
      .from("subjects")
      .select(`
        id, 
        course_code, 
        course_title,
        semester_id,
        semesters ( semester_number ),
        units (id, unit_number, unit_title)
      `)
      .order("course_code", { ascending: true });

    if (error) throw error;
    return { subjects: data };
  } catch (err: any) {
    return { error: err.message };
  }
}

export async function createPeerSession(formData: {
  title: string;
  description: string;
  subject_id: number | null; 
  unit_id: number | null;    
  tags: string[];
  start_time: string;
  duration_minutes: number;
  max_participants: number;
  status: "scheduled" | "live";
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return { error: "Unauthorized" };

  try {
    const uniqueRoomCode = `peer-${Math.random().toString(36).substring(2, 10)}-${Date.now().toString(36)}`;
    const internalMeetingLink = `/dashboard/sessions/room/${uniqueRoomCode}`;

    const { data, error } = await supabase
      .from("peer_sessions")
      .insert({
        host_id: user.id,
        title: formData.title,
        description: formData.description,
        subject_id: formData.subject_id,
        unit_id: formData.unit_id,
        tags: formData.tags,
        start_time: formData.start_time,
        duration_minutes: formData.duration_minutes,
        max_participants: formData.max_participants,
        meeting_link: internalMeetingLink, 
        status: formData.status
      })
      .select()
      .single();

    if (error) throw error;
    
    return { success: true, session: data, roomCode: uniqueRoomCode };
  } catch (err: any) {
    console.error("Session creation failed:", err);
    return { error: err.message };
  }
}

export async function getAllSessions() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return { error: "Unauthorized" };

  try {
    // The relationship is now correctly mapped to public.users!
    const { data, error } = await supabase
      .from("peer_sessions")
      .select(`
        *,
        subject:subjects (course_code, course_title),
        unit:units (unit_number, unit_title),
        host:users (id, full_name, avatar_url)
      `)
      .order("start_time", { ascending: true });

    if (error) throw error;
    
    return { sessions: data, currentUserId: user.id };
  } catch (err: any) {
    console.error("Fetch sessions failed:", err);
    return { error: err.message };
  }
}

export async function startSessionNow(sessionId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return { error: "Unauthorized" };

  try {
    const { data, error } = await supabase
      .from("peer_sessions")
      .update({ status: 'live' })
      .eq('id', sessionId)
      .eq('host_id', user.id)
      .select('meeting_link')
      .single();

    if (error) throw error;
    return { success: true, meeting_link: data.meeting_link };
  } catch (err: any) {
    return { error: err.message };
  }
}