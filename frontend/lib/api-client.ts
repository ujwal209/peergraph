import { createBrowserClient } from "@supabase/ssr";

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

// Create a client-safe Supabase instance using browser cookies
function getSupabaseBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

async function getAuthHeaders(isFormData = false) {
  const supabase = getSupabaseBrowserClient();
  const { data: { session } } = await supabase.auth.getSession();
  
  const headers: Record<string, string> = {};
  
  // If it's FormData, DO NOT set Content-Type. The browser must set it to add the boundary string.
  if (!isFormData) {
    headers["Content-Type"] = "application/json";
  }

  if (session?.access_token) {
    headers["Authorization"] = `Bearer ${session.access_token}`;
  }

  return headers;
}

export const apiClient = {
  async get(endpoint: string) {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: "GET",
      headers,
    });
    return response.json();
  },

  async post(endpoint: string, body: any) {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });
    return response.json();
  },

  // NEW METHOD: Specifically built to handle multipart/form-data safely
  async upload(endpoint: string, formData: FormData) {
    const headers = await getAuthHeaders(true); // true = skip Content-Type header
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: "POST",
      headers,
      body: formData,
    });
    return response.json();
  },

  async patch(endpoint: string, body: any) {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify(body),
    });
    return response.json();
  },

  async delete(endpoint: string, body?: any) {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: "DELETE",
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
    return response.json();
  },
};