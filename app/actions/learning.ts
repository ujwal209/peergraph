"use server";

import Groq from "groq-sdk";

export async function generateUnitStudyGuide(courseTitle: string, unitTitle: string, unitContent: string) {
  if (!process.env.GROQ_API_KEY) {
    return { error: "GROQ_API_KEY is missing from the environment." };
  }

  const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
  });

  try {
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are an elite academic AI tutor. Your task is to break down the given syllabus unit into a structured, easy-to-understand study guide. Provide key topics, brief explanations, and suggested reading strategies. Use Markdown format. Keep it concise, engaging, and focused on learning outcomes.",
        },
        {
          role: "user",
          content: `Course: ${courseTitle}\nUnit: ${unitTitle}\nSyllabus Content: ${unitContent}\n\nPlease generate a learning breakdown for this unit.`,
        },
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.5,
      max_tokens: 1500,
    });

    return { data: completion.choices[0]?.message?.content || "No content generated." };
  } catch (error: any) {
    console.error("Groq API Error:", error);
    return { error: "Failed to communicate with AI model. Please try again." };
  }
}

export async function addUnitComment(unitId: number, content: string) {
  const { createClient } = await import("@/lib/supabase-server");
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: "Unauthenticated" };

  const { error, data } = await supabase
    .from("unit_comments")
    .insert({
      unit_id: unitId,
      user_id: user.id,
      content,
      author_name: user.user_metadata?.full_name || "Anonymous Scholar",
      author_avatar: user.user_metadata?.avatar_url || null,
    })
    .select()
    .single();

  if (error) return { error: error.message };
  return { data };
}

export async function getUnitComments(unitId: number) {
  const { createClient } = await import("@/lib/supabase-server");
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // We bring likes along, counting them, and seeing if current user liked
  const { data, error } = await supabase
    .from("unit_comments")
    .select(`
      *,
      unit_comment_likes ( user_id )
    `)
    .eq("unit_id", unitId)
    .order("created_at", { ascending: true });

  if (error) return { error: error.message };

  const comments = data.map((c: any) => ({
    ...c,
    likesCount: c.unit_comment_likes.length,
    hasLiked: user ? c.unit_comment_likes.some((l: any) => l.user_id === user.id) : false,
    unit_comment_likes: undefined // remove raw array from payload
  }));

  return { data: comments, currentUserId: user?.id };
}

export async function toggleCommentLike(commentId: string, currentlyLiked: boolean) {
  const { createClient } = await import("@/lib/supabase-server");
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: "Unauthenticated" };

  if (currentlyLiked) {
    const { error } = await supabase
      .from("unit_comment_likes")
      .delete()
      .match({ comment_id: commentId, user_id: user.id });
    if (error) return { error: error.message };
  } else {
    const { error } = await supabase
      .from("unit_comment_likes")
      .insert({ comment_id: commentId, user_id: user.id });
    if (error) return { error: error.message };
  }

  return { success: true };
}

export async function getAIChatSession(unitId: number) {
  const { createClient } = await import("@/lib/supabase-server");
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: "Unauthenticated" };

  const { data: userData } = await supabase.from('users').select('id').eq('email', user.email).single();
  if (!userData) return { error: "Profile not found" };

  // FIX: Order by created_at descending and limit to 1 so we get the newest session
  // if the user has clicked "New Session" previously.
  let { data: sessions, error } = await supabase
    .from("ai_chat_sessions")
    .select("*")
    .eq("unit_id", unitId)
    .eq("user_id", userData.id)
    .order("created_at", { ascending: false })
    .limit(1);

  if (error) return { error: error.message };

  // If no session exists, create the first one
  if (!sessions || sessions.length === 0) {
    const { data: newSession, error: createError } = await supabase
      .from("ai_chat_sessions")
      .insert({
        unit_id: unitId,
        user_id: userData.id,
        session_name: `Learning Path: Unit ${unitId}`
      })
      .select()
      .single();
    
    if (createError) return { error: createError.message };
    return { data: newSession };
  }

  return { data: sessions[0] };
}

// NEW FUNCTION: Forces the creation of a brand new session for the current unit
export async function createNewAIChatSession(unitId: number) {
  const { createClient } = await import("@/lib/supabase-server");
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: "Unauthenticated" };

  const { data: userData } = await supabase.from('users').select('id').eq('email', user.email).single();
  if (!userData) return { error: "Profile not found" };

  const { data: newSession, error: createError } = await supabase
    .from("ai_chat_sessions")
    .insert({
      unit_id: unitId,
      user_id: userData.id,
      session_name: `Learning Path: Unit ${unitId} (New)`
    })
    .select()
    .single();
  
  if (createError) return { error: createError.message };
  return { data: newSession };
}

export async function getAIChatMessages(sessionId: number) {
  const { createClient } = await import("@/lib/supabase-server");
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from("ai_chat_messages")
    .select("*")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: true });

  if (error) return { error: error.message };
  return { data };
}

export async function sendAIUnitMessage(
  sessionId: number, 
  unitId: number, 
  message: string, 
  unitTitle: string, 
  unitContent: string,
  history: any[] = []
) {
  const { createClient } = await import("@/lib/supabase-server");
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: "Unauthenticated" };

  // 1. Store user message in DB
  const { error: storeError } = await supabase
    .from("ai_chat_messages")
    .insert({
      session_id: sessionId,
      role: 'user',
      message: message
    });
  if (storeError) return { error: "Failed to log transmission." };

  // 2. Prepare AI context
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  
  // Format history for Groq
  const contextHistory = history.slice(-5).map(m => ({
    role: m.role,
    content: m.message
  }));

  try {
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `You are an elite academic AI tutor with access to the following unit syllabus. 
Unit Title: ${unitTitle}
Unit Content: ${unitContent}

Your task: Provide accurate explanations and answers based strictly on this unit context. 
Be concise, technical when needed, and always academic. Explain mathematical concepts iteratively and logically.

CRITICAL FORMATTING RULES - YOU MUST OBEY THESE:
1. You MUST use Markdown for all structural formatting (headings, lists, bolding).
2. For ANY math, equations, vectors, or matrices, you MUST use strict LaTeX.
3. Use a single $ for inline math (e.g., $x = 2$).
4. Use double $$ for block math and equations (e.g., $$y = mx + c$$).
5. NEVER use ASCII art for matrices (e.g., | 1 2 |). You MUST use LaTeX bmatrix environments. 
   Example of required matrix format:
   $$A = \\begin{bmatrix} 1 & 2 \\\\ 3 & 4 \\end{bmatrix}$$
6. Break down complex mathematical proofs or algorithmic intuition step-by-step.`
        },
        ...contextHistory,
        { role: "user", content: message },
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.6,
    });

    const aiResponse = completion.choices[0]?.message?.content || "No matrix data returned.";

    // 3. Store AI message in DB
    const { data: savedAiMsg, error: aiStoreError } = await supabase
      .from("ai_chat_messages")
      .insert({
        session_id: sessionId,
        role: 'assistant',
        message: aiResponse
      })
      .select()
      .single();

    if (aiStoreError) return { error: "Transmission successful but failed to log response." };

    return { data: savedAiMsg };
  } catch (error: any) {
    console.error("AI Error:", error);
    return { error: "Neural link timeout. Please try again." };
  }
}