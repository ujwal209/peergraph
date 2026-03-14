"use server";

import { apiClient } from "@/lib/api-client";

export async function chatWithPDF(materialId: string, message: string, history: any[] = []) {
  const response = await apiClient.post("/ai/pdf-chat", {
    material_id: materialId,
    message: message,
    history: history
  });

  if (response.error || response.detail) {
    return { error: response.error || response.detail };
  }
  return { response: response.response };
}
