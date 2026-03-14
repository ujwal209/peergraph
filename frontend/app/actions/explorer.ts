"use server";

import { apiClient } from "@/lib/api-client";

export async function getDirectoryContents(subjectId: number, folderId: string | null = null) {
  const endpoint = `/explorer/directory?subjectId=${subjectId}${folderId ? `&folderId=${folderId}` : ""}`;
  const response = await apiClient.get(endpoint);
  if (response.error || response.detail) return { folders: [], files: [] };
  return { folders: response.folders, files: response.files };
}

export async function createFolder(data: { name: string; branchId: number; semesterId: number; subjectId: number; parentId: string | null }) {
  const response = await apiClient.post("/explorer/folders", data);
  if (response.error || response.detail) return { error: response.error || response.detail };
  return { success: true };
}

export async function moveFiles(fileIds: string[], newSubjectId: number, newFolderId: string | null) {
  const response = await apiClient.post("/explorer/files/move", {
    fileIds,
    newSubjectId,
    newFolderId,
  });
  if (response.error || response.detail) return { error: response.error || response.detail };
  return { success: true };
}

export async function deleteFiles(fileIds: string[]) {
  const response = await apiClient.delete("/explorer/files", fileIds);
  if (response.error || response.detail) return { error: response.error || response.detail };
  return { success: true };
}

export async function renameFile(fileId: string, newName: string) {
  const response = await apiClient.patch("/explorer/files/rename", {
    fileId,
    newName,
  });
  if (response.error || response.detail) return { error: response.error || response.detail };
  return { success: true };
}