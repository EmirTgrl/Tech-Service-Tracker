"use client";

import { ReactNode, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

export default function AdminGuard({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && user?.role !== "ADMIN") {
      router.replace("/dashboard");
    }
  }, [user, isLoading, router]);

  if (isLoading || user?.role === "ADMIN") {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-[calc(100vh-theme(space.16))] items-center justify-center">
      <p className="text-lg font-semibold text-red-600">
        You do not have permission to access this page.
      </p>
    </div>
  );
}
