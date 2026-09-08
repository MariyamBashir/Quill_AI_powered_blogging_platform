import apiClient from "./client";

export interface ApiKeyRecord {
  id: string;
  created_at: string;
  revoked_at: string | null;
}

export async function listApiKeys(): Promise<ApiKeyRecord[]> {
  const res = await apiClient.get("/auth/api-keys");
  return res.data.api_keys;
}

export async function createApiKey(): Promise<string> {
  const res = await apiClient.post("/auth/api-keys");
  return res.data.api_key;
}

export async function revokeApiKey(id: string): Promise<void> {
  await apiClient.delete(`/auth/api-keys/${id}`);
}