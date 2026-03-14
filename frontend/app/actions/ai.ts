"use server";

import { createClient } from "@/lib/supabase-server";

// 1. Fetch Subjects and Units with Semester details
export async function getAiContexts() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  try {
    const { data, error } = await supabase
      .from("subjects")
      .select(`
        id, course_code, course_title, semester_id,
        semesters (semester_number),
        units (id, unit_number, unit_title)
      `)
      .order("course_code", { ascending: true });

    if (error) throw error;
    return { channels: data };
  } catch (err: any) {
    return { error: err.message };
  }
}

// 2. Load User Chat Sessions (History)
export async function getUserSessions() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  try {
    const { data, error } = await supabase
      .from("ai_chat_sessions")
      .select(`
        id, session_name, created_at, unit_id,
        units (unit_number, unit_title, subjects (course_code, course_title))
      `)
      .eq("user_id", user.id)
      .order("last_active", { ascending: false });

    if (error) throw error;
    return { sessions: data };
  } catch (err: any) {
    return { error: err.message };
  }
}

// 3. Load Chat History for a Specific Session
export async function getSessionHistory(sessionId: number) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  try {
    const { data, error } = await supabase
      .from("ai_chat_messages")
      .select("*")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: true });

    if (error) throw error;
    return { messages: data };
  } catch (err: any) {
    return { error: err.message };
  }
}

// 4. Update Session Name
export async function updateSessionName(sessionId: number, newName: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("ai_chat_sessions").update({ session_name: newName }).eq("id", sessionId);
  if (error) return { error: error.message };
  return { success: true };
}

// 5. Delete Session (Manual cascade)
export async function deleteSession(sessionId: number) {
  const supabase = await createClient();
  await supabase.from("ai_chat_messages").delete().eq("session_id", sessionId);
  const { error } = await supabase.from("ai_chat_sessions").delete().eq("id", sessionId);
  if (error) return { error: error.message };
  return { success: true };
}

// 6. Process the AI Query with Groq and Memory
export async function processAiQuery(unitId: number, message: string, existingSessionId?: number | null) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  try {
    let sessionId = existingSessionId;
    let previousMessages: { role: string; content: string }[] = [];

    // A. Fetch Unit Content for Context
    const { data: unitData, error: unitError } = await supabase
      .from("units")
      .select("unit_title, unit_content, subjects(course_title)")
      .eq("id", unitId)
      .single();
    
    if (unitError) throw unitError;

    // B. Create/Update Session
    if (!sessionId) {
      const { data: sessionData, error: sessionError } = await supabase
        .from("ai_chat_sessions")
        .insert({
          user_id: user.id,
          unit_id: unitId,
          session_name: message.length > 25 ? `${message.substring(0, 25)}...` : message,
        })
        .select().single();
      
      if (sessionError) throw sessionError;
      sessionId = sessionData.id;
    } else {
      await supabase.from("ai_chat_sessions").update({ last_active: new Date().toISOString() }).eq("id", sessionId);
      
      const { data: hist } = await supabase
        .from("ai_chat_messages")
        .select("role, message")
        .eq("session_id", sessionId)
        .order("created_at", { ascending: true });
        
      if (hist) {
        previousMessages = hist.map((m: any) => ({
          role: m.role === "assistant" ? "assistant" : "user",
          content: m.message
        })).slice(-8); // Keep only last 8 messages to prevent token limits
      }
    }

    // C. Save the NEW User Message
    await supabase.from("ai_chat_messages").insert({ session_id: sessionId, role: "user", message: message });

    // D. Call Groq LLM
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) throw new Error("GROQ_API_KEY is not set.");

    // ULTIMATE PROMPT: Forces math rendering and bullet points.
    // In your processAiQuery function, update the systemPrompt:

const systemPrompt = `You are PeerGraph AI, an elite academic assistant.
    
CRITICAL FORMATTING RULES - OBEY OR FAIL:
1. MATH: Use double dollar signs ($$) for block math and matrices. Use single dollar signs ($) for inline math.
2. MATRICES: ALWAYS use proper LaTeX matrix environments. For matrices, use:
   - For square brackets: \\begin{bmatrix} ... \\end{bmatrix}
   - For parentheses: \\begin{pmatrix} ... \\end{pmatrix}
   - For vertical bars: \\begin{vmatrix} ... \\end{vmatrix}
   - Make sure each matrix is on its own line with $$ before and after.
3. LISTS: You MUST use Markdown bullet points (-) for properties, features, steps, and lists.
4. BOLDING: ALWAYS bold the key term at the start of a bullet point. Example: "- **Uniqueness:** The LU decomposition..."
5. NO WALLS OF TEXT: Break your response into extremely readable, well-spaced paragraphs.
6. EXAMPLE FORMAT: For a 2x2 matrix, use:
   $$
   \\begin{bmatrix}
   a & b \\\\
   c & d
   \\end{bmatrix}
   $$

Current Course: ${unitData.subjects?.course_title} | Current Unit: ${unitData.unit_title}
Syllabus Content Context:
${unitData.unit_content}`;

    const groqPayload = {
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: systemPrompt },
        ...previousMessages,
        { role: "user", content: message }
      ],
      temperature: 0.3,
      max_tokens: 1024
    };

    const llmResponse = await fetch(`https://api.groq.com/openai/v1/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
      body: JSON.stringify(groqPayload)
    });

    if (!llmResponse.ok) {
        const errData = await llmResponse.json();
        throw new Error(`Groq API Error: ${errData.error?.message || llmResponse.statusText}`);
    }

    const llmData = await llmResponse.json();
    const aiText = llmData.choices?.[0]?.message?.content || "Transmission failed to parse.";

    // E. Save AI Response
    const { data: aiMessageRecord, error: aiMsgError } = await supabase
      .from("ai_chat_messages")
      .insert({ session_id: sessionId, role: "assistant", message: aiText, context_used: "Unit Content Included" })
      .select().single();

    if (aiMsgError) throw aiMsgError;

    return { success: true, sessionId, message: aiMessageRecord };
  } catch (err: any) {
    console.error("AI Error:", err);
    return { error: err.message };
  }
}