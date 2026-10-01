/**
 * API client with auth interceptor.
 *
 * Attaches the Clerk session token as Bearer, handles 401 (redirect to login),
 * 403 (not authorized), and 5xx (generic error).
 */

const rawBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const API_BASE = rawBase.endsWith("/api/v1") ? rawBase : `${rawBase.replace(/\/+$/, "")}/api/v1`;

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
    if (typeof window === "undefined") return null;

    try {
      const clerk = (
        window as unknown as {
          Clerk?: { session?: { getToken: () => Promise<string | null> } };
        }
      ).Clerk;

      if (clerk?.session) {
        return await clerk.session.getToken();
      }
    } catch {
      return null;
    }
    return null;
  }

  async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const token = await this.getToken();

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    if (typeof window !== "undefined") {
      const devRole = localStorage.getItem("dev_role_override");
      if (devRole) {
        headers["X-Dev-Role"] = devRole;
      }
    }

    const response = await fetch(`${this.baseUrl}${path}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      if (response.status === 401) {
        if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
          window.location.href = "/login";
        }
        throw new Error("Session expired or unauthorized");
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

export const api = new ApiClient(API_BASE);
