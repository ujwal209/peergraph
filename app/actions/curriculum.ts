"use server";

import { createClient } from "@/lib/supabase-server";

export async function getCurriculumData() {
  const supabase = await createClient();
  
  // Verify auth
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { error: "Unauthorized access" };
  }

  try {
    // Fetch semesters and subjects in parallel
    const [semestersResponse, subjectsResponse] = await Promise.all([
      supabase
        .from("semesters")
        .select("*")
        .order("semester_number", { ascending: true }),
      supabase
        .from("subjects")
        .select(`
          id,
          semester_id,
          course_type,
          course_code,
          course_title,
          credits,
          l_t_p,
          total_lecture_hours,
          course_outcomes (id, co_number, co_description),
          textbooks (id, book_title, authors, edition, publisher, is_primary),
          units (id, unit_number, unit_title, unit_content, hours)
        `)
        .order("course_code", { ascending: true })
    ]);

    return {
      semesters: semestersResponse.data || [],
      subjects: subjectsResponse.data || [],
    };
  } catch (error) {
    console.error("Failed to fetch curriculum:", error);
    return { error: "Failed to load curriculum data." };
  }
}