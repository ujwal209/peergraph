"use server";

import { apiClient } from "@/lib/api-client";

export async function getTaxonomy() {
    return apiClient.get("/curriculum/taxonomy");
}

export async function getInstitutionalSyllabus() {
    return apiClient.get("/curriculum/taxonomy");
}

export async function getSubjectResources(subjectId: number, folderId: string | null = null) {
  let endpoint = `/explorer/directory?subjectId=${subjectId}`;
  if (folderId) endpoint += `&folderId=${folderId}`;
  return apiClient.get(endpoint);
}

export async function getCurriculumData() {
  const response = await apiClient.get("/curriculum/data");
  
  if (response.error || response.detail) {
    return { error: response.error || response.detail };
  }
  return { data: response.data };
}

export async function toggleTopicCompletion(unitId: number, topicIndex: number, isCompleted: boolean) {
  const response = await apiClient.post("/curriculum/toggle-topic", {
    unitId,
    topicIndex,
    isCompleted,
  });

  if (response.error || response.detail) {
    return { error: response.error || response.detail };
  }
  return { success: true };
}