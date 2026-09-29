"use client";

import { useAuth } from "@/lib/auth/AuthProvider";
import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";

interface RoleGuardProps {
  allowedRoles: string[];
  children: ReactNode;
}

/**
 * Layout-level role guard component.
 * Redirects unauthorized users to login or their correct role home.
 *
 * NOTE: This is for UX only — real access control is enforced by FastAPI.
 */
export function RoleGuard({ allowedRoles, children }: RoleGuardProps) {
  const { state, role } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (state === "loading") return;

    if (state === "signedOut") {
      router.replace("/login");
      return;
    }

    if (!allowedRoles.includes(role)) {
      // Redirect to the user's correct home
      const roleHomeMap: Record<string, string> = {
        examiner: "/examiner",
        controller: "/controller/dashboard",
        admin: "/admin/users",
      };
      const home = roleHomeMap[role] || "/login";
      router.replace(home);
    }
  }, [state, role, allowedRoles, router]);

  // Show nothing while loading or redirecting
  if (state === "loading") {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (state === "signedOut" || !allowedRoles.includes(role)) {
    return null;
  }

  return <>{children}</>;
}
