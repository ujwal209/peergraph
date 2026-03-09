"use server";

import { createClient } from "@/lib/supabase-server";

export async function getDirectoryContents(subjectId: number, folderId: string | null = null) {
  const supabase = await createClient();

  let folderQuery = supabase.from('folders').select('*').eq('subject_id', subjectId);
  if (folderId) folderQuery = folderQuery.eq('parent_id', folderId);
  else folderQuery = folderQuery.is('parent_id', null);

  let fileQuery = supabase.from('study_materials').select('*').eq('subject_id', subjectId);
  if (folderId) fileQuery = fileQuery.eq('folder_id', folderId);
  else fileQuery = fileQuery.is('folder_id', null);

  const [folders, files] = await Promise.all([folderQuery, fileQuery]);

  return { folders: folders.data || [], files: files.data || [] };
}

export async function getAllSubjectFolders(subjectId: number) {
  const supabase = await createClient();
  const { data, error } = await supabase.from('folders').select('id, name, parent_id').eq('subject_id', subjectId);
  if (error) return [];
  return data;
}

export async function createFolder(data: { name: string; branchId: number; semesterId: number; subjectId: number; parentId: string | null }) {
  const supabase = await createClient();
  const { error } = await supabase.from('folders').insert({
    name: data.name,
    branch_id: data.branchId,
    semester_id: data.semesterId,
    subject_id: data.subjectId,
    parent_id: data.parentId
  });
  if (error) return { error: error.message };
  return { success: true };
}

// BULK MOVE
export async function moveFiles(fileIds: string[], newSubjectId: number, newFolderId: string | null) {
  const supabase = await createClient();
  const { data: subjectInfo } = await supabase.from('subjects').select('branch_id, semester_id').eq('id', newSubjectId).single();
  if (!subjectInfo) return { error: "Subject not found." };

  const { error } = await supabase.from('study_materials').update({
    subject_id: newSubjectId,
    branch_id: subjectInfo.branch_id,
    semester_id: subjectInfo.semester_id,
    folder_id: newFolderId
  }).in('id', fileIds);

  if (error) return { error: error.message };
  return { success: true };
}

// BULK DELETE
export async function deleteFiles(fileIds: string[]) {
  const supabase = await createClient();
  const { error } = await supabase.from('study_materials').delete().in('id', fileIds);
  if (error) return { error: error.message };
  return { success: true };
}

// RENAME
export async function renameFile(fileId: string, newName: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('study_materials').update({ file_name: newName }).eq('id', fileId);
  if (error) return { error: error.message };
  return { success: true };
}