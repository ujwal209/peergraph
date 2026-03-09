"use server";

import { createClient } from "@/lib/supabase-server";

// Fetch the dynamic dropdown data for the UI
export async function getTaxonomy() {
  const supabase = await createClient();

  const [branchesRes, semestersRes, subjectsRes] = await Promise.all([
    supabase.from('branches').select('*').order('id'),
    supabase.from('semesters').select('*').order('semester_number'),
    supabase.from('subjects').select('id, course_title, course_code, branch_id, semester_id').order('course_title')
  ]);

  return {
    branches: branchesRes.data || [],
    semesters: semestersRes.data || [],
    subjects: subjectsRes.data || []
  };
}

// Just save the Cloudinary URL and metadata to the database. No vectors.
export async function saveMaterialRecord(data: {
  fileName: string;
  cloudinaryUrl: string;
  branchId: number;
  semesterId: number;
  subjectId: number;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: "Unauthorized. Please log in." };

  try {
    // 1. Fetch the branch, semester, and subject names for your legacy columns
    const [branchRes, semesterRes, subjectRes] = await Promise.all([
      supabase.from('branches').select('name').eq('id', data.branchId).single(),
      supabase.from('semesters').select('semester_number').eq('id', data.semesterId).single(),
      supabase.from('subjects').select('course_title').eq('id', data.subjectId).single()
    ]);

    const branchName = branchRes.data?.name || `Branch ${data.branchId}`;
    const semesterNumber = semesterRes.data?.semester_number || data.semesterId;
    const subjectName = subjectRes.data?.course_title || `Subject ${data.subjectId}`;

    // 2. Insert material metadata directly into your database
    const { data: material, error } = await supabase
      .from('study_materials')
      .insert({
        file_name: data.fileName,
        cloudinary_url: data.cloudinaryUrl,
        branch_id: data.branchId,
        semester_id: data.semesterId,
        subject_id: data.subjectId,
        uploaded_by: user.id,
        branch: branchName,
        semester: semesterNumber.toString(),
        subject: subjectName
      })
      .select()
      .single();

    if (error) throw error;

    console.log(`[Upload Pipeline] Successfully logged ${data.fileName} in database.`);

    // 3. Return success instantly
    return { success: true, materialId: material.id };
    
  } catch (error: any) {
    console.error("Action Failed:", error);
    return { error: error.message || "Database insertion failed." };
  }
}