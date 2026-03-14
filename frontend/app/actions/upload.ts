"use server";

import { apiClient } from "@/lib/api-client";
import { createClient } from "@/lib/supabase-server";

export async function getTaxonomy() {
    return apiClient.get("/curriculum/taxonomy");
}

export async function uploadPDF(formData: FormData) {
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
  
  // We need to pass the auth token manually here because it's a multipart request
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session?.access_token) {
    return { error: "Unauthorized" };
  }

  const response = await fetch(`${apiBaseUrl}/upload/pdf`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${session.access_token}`,
    },
    body: formData,
  });

  const data = await response.json();
  if (data.error || data.detail) {
    return { error: data.error || data.detail };
  }
  return data;
}

export async function getMyMaterials(semesterId?: number, subjectId?: number, unitId?: number) {
  let endpoint = "/upload/list";
  const params = new URLSearchParams();
  if (semesterId) params.append("semester_id", semesterId.toString());
  if (subjectId) params.append("subject_id", subjectId.toString());
  if (unitId) params.append("unit_id", unitId.toString());
  
  const queryString = params.toString();
  if (queryString) endpoint += `?${queryString}`;
  
  return apiClient.get(endpoint);
}

export async function saveMaterialRecord(data: {
  fileName: string;
  cloudinaryUrl: string;
  branchId: number;
  semesterId: number;
  subjectId: number;
}) {
  const response = await apiClient.post("/upload/record", data);
  if (response.error || response.detail) return { error: response.error || response.detail };
  return { success: true, materialId: response.materialId };
}