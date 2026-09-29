/**
 * API client with auth interceptor.
 *
 * Attaches the Firebase ID token as Bearer, handles 401 (refresh + retry),
 * 403 (not authorized), and 5xx (generic error).
 */

import { auth } from "@/lib/auth/firebase";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface ApiError {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
    request_id?: string;
  };
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async getToken(): Promise<string | null> {
    if (!auth) return null;
    const user = auth.currentUser;
    if (!user) return null;
    try {
      return await user.getIdToken();
    } catch {
      return null;
    }
  }

  async request<T>(
    path: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = await this.getToken();

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(`${this.baseUrl}${path}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      if (response.status === 401) {
        // Try to refresh the token once
        const user = auth?.currentUser;
        if (user) {
          try {
            const newToken = await user.getIdToken(true);
            headers["Authorization"] = `Bearer ${newToken}`;
            const retryResponse = await fetch(`${this.baseUrl}${path}`, {
              ...options,
              headers,
            });
            if (retryResponse.ok) {
              return retryResponse.json() as Promise<T>;
            }
          } catch {
            // Fall through to sign out
          }
        }
        // Token refresh failed — sign out
        window.location.href = "/login";
        throw new Error("Session expired");
      }

      const errorBody: ApiError = await response.json().catch(() => ({
        error: { code: "unknown", message: "An unexpected error occurred" },
      }));

      throw errorBody;
    }

    // Handle 204 No Content
    if (response.status === 204) {
      return undefined as unknown as T;
    }

    return response.json() as Promise<T>;
  }

  async get<T>(path: string): Promise<T> {
    return this.request<T>(path, { method: "GET" });
  }

  async post<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>(path, {
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async put<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>(path, {
      method: "PUT",
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async patch<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>(path, {
      method: "PATCH",
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async delete<T>(path: string): Promise<T> {
    return this.request<T>(path, { method: "DELETE" });
  }
}

export const api = new ApiClient(`${API_BASE}/api/v1`);
