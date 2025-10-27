"use client";

import React, { ReactNode } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";
import { useRouter } from "next/navigation";

const Header = () => {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.replace("/login");
  };

  return (
    <header className="flex h-16 items-center justify-between border-b bg-white px-6 shadow-sm">
      <div className="text-lg font-semibold text-gray-800">
        Technical Service Panel
      </div>
      <div className="flex items-center space-x-4">
        {user ? (
          <>
            <span className="text-sm text-gray-600">
              Welcome, <span className="font-medium">{user.name}</span> (
              {user.role})
            </span>
            <button
              onClick={handleLogout}
              className="rounded-md bg-red-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-600 cursor-pointer"
            >
              Log Out
            </button>
          </>
        ) : (
          <div className="h-6 w-48 animate-pulse rounded bg-gray-200"></div>
        )}
      </div>
    </header>
  );
};

const Sidebar = () => {
  const { user } = useAuth();

  return (
    <nav className="flex w-64 flex-col bg-gray-800 p-4 text-gray-100">
      <div className="mb-8 text-center text-xl font-bold">Main Menu</div>
      <ul className="space-y-2">
        <li>
          <Link
            href="/dashboard"
            className="block rounded-md px-3 py-2 hover:bg-gray-700"
          >
            Dashboard
          </Link>
        </li>
        <li>
          <Link
            href="/devices"
            className="block rounded-md px-3 py-2 hover:bg-gray-700"
          >
            Device List
          </Link>
        </li>
        <li>
          <Link
            href="/devices/new"
            className="block rounded-md px-3 py-2 hover:bg-gray-700"
          >
            New Service Registration
          </Link>
        </li>
        {user?.role === "ADMIN" && (
          <li>
            <Link
              href="/users"
              className="block rounded-md px-3 py-2 hover:bg-gray-700"
            >
              User Management
            </Link>
          </li>
        )}
      </ul>
    </nav>
  );
};

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute>
      <div className="flex h-screen w-full bg-gray-100">
        <Sidebar />

        <div className="flex flex-1 flex-col">
          <Header />

          <main className="flex-1 overflow-y-auto p-8">{children}</main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
