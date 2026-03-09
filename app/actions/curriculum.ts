"use server";

import { createClient } from "@/lib/supabase-server";

// 1. Fetch Taxonomy
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

// 2. Fetch Curriculum Data with Extracted Topics & User Progress
export async function getCurriculumData() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: "Unauthorized" };

  // Fetch subjects and their units
  const { data: subjects, error } = await supabase
    .from('subjects')
    .select(`
      id, course_code, course_title, branch_id, semester_id,
      units ( id, unit_number, unit_title, unit_content )
    `)
    .order('course_title');

  if (error) return { error: error.message };

  // Fetch the completed topics for the current user
  const { data: progress } = await supabase
    .from('user_topic_progress')
    .select('unit_id, topic_index')
    .eq('user_id', user.id)
    .eq('is_completed', true);

  // Create a fast lookup set: "unitId-topicIndex"
  const completedSet = new Set(progress?.map(p => `${p.unit_id}-${p.topic_index}`) || []);

  const formattedData = subjects.map((sub: any) => {
    let totalSubjectTopics = 0;
    let completedSubjectTopics = 0;

    const formattedUnits = (sub.units || [])
      .sort((a: any, b: any) => a.unit_number - b.unit_number)
      .map((u: any) => {
        
        // DYNAMIC TOPIC EXTRACTION:
        // Split by newlines or commas, trim whitespace, and remove bullet points (-, *, 1.)
        const rawTopics = u.unit_content 
          ? u.unit_content.split(/\r?\n|,/)
              .map((t: string) => t.trim().replace(/^[-*•\d.]+\s*/, '')) 
              .filter(Boolean)
          : [];

        const topics = rawTopics.map((title: string, index: number) => {
          const isCompleted = completedSet.has(`${u.id}-${index}`);
          totalSubjectTopics++;
          if (isCompleted) completedSubjectTopics++;
          
          return { id: index, title, completed: isCompleted };
        });

        return {
          id: u.id,
          title: u.unit_title,
          number: u.unit_number,
          topics,
          totalTopics: topics.length,
          completedTopics: topics.filter((t: any) => t.completed).length
        };
      });
      
    const progressPercent = totalSubjectTopics === 0 ? 0 : Math.round((completedSubjectTopics / totalSubjectTopics) * 100);

    return {
      id: sub.id.toString(),
      rawId: sub.id,
      title: sub.course_title,
      code: sub.course_code,
      branch_id: sub.branch_id,
      semester_id: sub.semester_id,
      progress: progressPercent,
      totalSubjectTopics,
      completedSubjectTopics,
      units: formattedUnits
    };
  });

  return { data: formattedData };
}

// 3. Toggle Topic Completion
export async function toggleTopicCompletion(unitId: number, topicIndex: number, isCompleted: boolean) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: "Unauthorized" };

  const { error } = await supabase
    .from('user_topic_progress')
    .upsert({
      user_id: user.id,
      unit_id: unitId,
      topic_index: topicIndex,
      is_completed: isCompleted,
      completed_at: new Date().toISOString()
    }, { onConflict: 'user_id, unit_id, topic_index' });

  if (error) return { error: error.message };
  return { success: true };
}

// 4. Fetch Files & Folders
export async function getSubjectResources(subjectId: number, folderId: string | null = null) {
  const supabase = await createClient();

  let folderQuery = supabase.from('folders').select('*').eq('subject_id', subjectId).order('name');
  if (folderId) folderQuery = folderQuery.eq('parent_id', folderId);
  else folderQuery = folderQuery.is('parent_id', null);

  let fileQuery = supabase.from('study_materials').select('*').eq('subject_id', subjectId).order('file_name');
  if (folderId) fileQuery = fileQuery.eq('folder_id', folderId);
  else fileQuery = fileQuery.is('folder_id', null);

  const [foldersRes, filesRes] = await Promise.all([folderQuery, fileQuery]);

  return { folders: foldersRes.data || [], files: filesRes.data || [] };
}


// 5. Fetch Full Institutional Syllabus Matrix (For the Deep-Dive Explorer Page)
export async function getInstitutionalSyllabus() {
  const supabase = await createClient();

  const [branchesRes, semestersRes, subjectsRes] = await Promise.all([
    supabase.from('branches').select('*').order('id'),
    supabase.from('semesters').select('*').order('semester_number'),
    supabase.from('subjects').select(`
      *,
      units (*),
      course_outcomes (*),
      textbooks (*)
    `).order('course_title')
  ]);

  if (branchesRes.error) return { error: branchesRes.error.message };
  if (semestersRes.error) return { error: semestersRes.error.message };
  if (subjectsRes.error) return { error: subjectsRes.error.message };

  return {
    branches: branchesRes.data || [],
    semesters: semestersRes.data || [],
    subjects: subjectsRes.data || []
  };
}