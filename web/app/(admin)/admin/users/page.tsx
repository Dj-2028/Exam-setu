"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api/client";
import { EmptyState } from "@/components/shared/EmptyState";
import { TableSkeleton } from "@/components/shared/Skeleton";
import { UserPlus, UserCheck, UserX, X, RefreshCw, AlertCircle } from "lucide-react";

interface UserItem {
  id: string;
  email: string;
  name: string;
  role: "examiner" | "controller" | "admin";
  is_active: boolean;
  created_at: string;
}

interface UserListResponse {
  items: UserItem[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [roleFilter, setRoleFilter] = useState<string>("all");

  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formRole, setFormRole] = useState<"examiner" | "controller" | "admin">("examiner");
  const [formPassword, setFormPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const url = roleFilter && roleFilter !== "all" 
        ? `/users?role=${roleFilter}` 
        : "/users";
      const res = await api.get<UserListResponse>(url);
      setUsers(res.items || []);
    } catch (err: any) {
      const msg = err?.error?.message || err?.message || "Failed to load users";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [roleFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formEmail.trim()) {
      setModalError("Email is required.");
      return;
    }
    setSubmitting(true);
    setModalError(null);
    try {
      await api.post<UserItem>("/users", {
        email: formEmail.trim(),
        name: formName.trim() || formEmail.split("@")[0],
        role: formRole,
        password: formPassword || "ExamSetu@2026!",
      });
      setShowInviteModal(false);
      setFormName("");
      setFormEmail("");
      setFormRole("examiner");
      setFormPassword("");
      await fetchUsers();
    } catch (err: any) {
      const msg = err?.error?.message || err?.message || "Failed to create user";
      setModalError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeactivate = async (userId: string) => {
    try {
      await api.post(`/users/${userId}/deactivate`);
      await fetchUsers();
    } catch (err: any) {
      alert(err?.error?.message || err?.message || "Action failed");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">User Management</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage platform examiners, controllers, and administrators
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchUsers()}
            className="rounded-lg border border-border bg-card p-2 text-muted-foreground hover:text-foreground transition-colors"
            title="Refresh"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
          <button
            onClick={() => setShowInviteModal(true)}
            className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm hover:opacity-90 transition-opacity"
          >
            <UserPlus className="h-4 w-4" />
            Invite User
          </button>
        </div>
      </div>

      {/* Role Filters */}
      <div className="flex gap-1 rounded-lg bg-muted p-1 w-fit text-xs font-medium">
        {["all", "examiner", "controller", "admin"].map((r) => (
          <button
            key={r}
            onClick={() => setRoleFilter(r)}
            className={`rounded-md px-3 py-1.5 capitalize transition-colors ${
              roleFilter === r
                ? "bg-card text-foreground shadow-sm font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {r}
          </button>
        ))}
      </div>

      {/* Error Alert */}
      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-destructive/20 bg-destructive/10 p-4 text-xs text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <TableSkeleton rows={5} />
      ) : users.length === 0 ? (
        <EmptyState
          icon="👥"
          title="No users found"
          description={
            roleFilter !== "all"
              ? `No users registered with role '${roleFilter}'.`
              : "Invite examiners and controllers to get started."
          }
          action={
            <button
              onClick={() => setShowInviteModal(true)}
              className="rounded-lg bg-primary px-4 py-2 text-xs font-medium text-primary-foreground shadow-sm"
            >
              + Invite First User
            </button>
          }
        />
      ) : (
        <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/50 border-b border-border text-muted-foreground font-semibold">
                <tr>
                  <th className="px-4 py-3">User</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Created</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-medium text-foreground">{u.name || u.email.split("@")[0]}</div>
                      <div className="text-[11px] text-muted-foreground font-mono">{u.email}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize ${
                          u.role === "admin"
                            ? "bg-purple-500/10 text-purple-600 dark:text-purple-400"
                            : u.role === "controller"
                            ? "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                            : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1 text-[11px] font-medium ${
                          u.is_active ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"
                        }`}
                      >
                        {u.is_active ? (
                          <>
                            <UserCheck className="h-3 w-3" /> Active
                          </>
                        ) : (
                          <>
                            <UserX className="h-3 w-3" /> Inactive
                          </>
                        )}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {new Date(u.created_at).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {u.is_active ? (
                        <button
                          onClick={() => handleDeactivate(u.id)}
                          className="text-xs text-destructive hover:underline font-medium"
                        >
                          Deactivate
                        </button>
                      ) : (
                        <span className="text-[11px] text-muted-foreground">Disabled</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-foreground">Invite New User</h2>
              <button
                onClick={() => setShowInviteModal(false)}
                className="rounded-lg p-1 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {modalError && (
              <div className="mb-4 rounded-lg bg-destructive/10 p-3 text-xs text-destructive">
                {modalError}
              </div>
            )}

            <form onSubmit={handleInviteSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">Full Name</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Dr. Rajesh Sharma"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-foreground mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  placeholder="user@university.edu.in"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-foreground mb-1">Role *</label>
                <select
                  value={formRole}
                  onChange={(e) => setFormRole(e.target.value as any)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  <option value="examiner">Examiner (Evaluates Answer Sheets)</option>
                  <option value="controller">Controller (Monitors & Reconciles)</option>
                  <option value="admin">Administrator (Full System Control)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-foreground mb-1">Initial Password</label>
                <input
                  type="password"
                  value={formPassword}
                  onChange={(e) => setFormPassword(e.target.value)}
                  placeholder="Default: ExamSetu@2026!"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="rounded-lg border border-border px-4 py-2 text-xs font-medium text-muted-foreground hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-lg bg-primary px-4 py-2 text-xs font-medium text-primary-foreground shadow-sm hover:opacity-90 disabled:opacity-50"
                >
                  {submitting ? "Inviting..." : "Send Invitation"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
