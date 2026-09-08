import apiClient from "./client";

export interface Post {
  id: string;
  user_id: string;
  title: string;
  slug: string;
  content_md: string;
  status: "draft" | "published";
  created_at: string;
  updated_at: string;
  published_at: string | null;
}

export async function listPosts(): Promise<Post[]> {
  const res = await apiClient.get("/posts");
  return res.data.posts;
}

export async function getPost(id: string): Promise<Post> {
  const res = await apiClient.get(`/posts/${id}`);
  return res.data.post;
}

export async function createPost(
  title: string,
  content: string,
  status: "draft" | "published" = "draft"
): Promise<Post> {
  const res = await apiClient.post("/posts", { title, content, status });
  return res.data.post;
}

export async function updatePost(
  id: string,
  data: { title?: string; content?: string; status?: "draft" | "published" }
): Promise<Post> {
  const res = await apiClient.put(`/posts/${id}`, data);
  return res.data.post;
}

export async function deletePost(id: string): Promise<void> {
  await apiClient.delete(`/posts/${id}`);
}

export async function publishPost(id: string): Promise<Post> {
  const res = await apiClient.post(`/posts/${id}/publish`);
  return res.data.post;
}

export interface Analytics {
  total_posts: number;
  draft_posts: number;
  published_posts: number;
}

export async function getAnalytics(): Promise<Analytics> {
  const res = await apiClient.get("/posts/analytics/summary");
  return res.data.analytics;
}