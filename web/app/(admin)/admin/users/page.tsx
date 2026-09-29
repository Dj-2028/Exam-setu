"use client";

import { EmptyState } from "@/components/shared/EmptyState";

export default function AdminUsersPage() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-foreground">Users</h1>
        <button className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm hover:opacity-90 transition-opacity">
          + Invite User
        </button>
      </div>

      <EmptyState
        icon="👥"
        title="No users yet"
        description="Invite examiners and controllers to get started."
      />
    </div>
  );
}
