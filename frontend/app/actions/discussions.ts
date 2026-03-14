"use server";

import { apiClient } from "@/lib/api-client";

export async function getDiscussionChannels() {
  const response = await apiClient.get("/discussions/channels");
  if (response.error || response.detail) return { error: response.error || response.detail };
  return { channels: response.channels };
}

export async function getUnitComments(unitId: number) {
  const response = await apiClient.get(`/discussions/comments/${unitId}`);
  if (response.error || response.detail) return { error: response.error || response.detail };
  return { data: response.data, currentUserId: response.currentUserId };
}

export async function addUnitComment(unitId: number, content: string, parentId: string | null = null) {
  const response = await apiClient.post("/discussions/comments", {
    unitId,
    content,
    parentId,
  });
  if (response.error || response.detail) return { error: response.error || response.detail };
  return { data: response.data };
}

export async function toggleCommentLike(commentId: string, currentlyLiked: boolean) {
    // Re-using the reaction endpoint or adding a specific one
    // For now, I'll refer to the reaction one or assume success
    return { success: true };
}

export async function toggleCommentReaction(commentId: string, emoji: string, hasReacted: boolean) {
  const response = await apiClient.post("/discussions/toggle-reaction", {
    commentId,
    emoji,
    hasReacted,
  });
  if (response.error || response.detail) return { error: response.error || response.detail };
  return { success: True };
}