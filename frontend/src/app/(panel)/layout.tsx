"use client";

import React, { ReactNode } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  LuLayoutDashboard,
  LuHardDrive,
  LuSquare,
  LuUsers,
  LuArchive,
} from "react-icons/lu";

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
  const pathname = usePathname();

  const menuItems = [
    {
      href: "/dashboard",
      label: "Dashboard",
      icon: LuLayoutDashboard,
      role: ["ADMIN", "TECHNICIAN"],
    },
    {
      href: "/devices",
      label: "Device List",
      icon: LuHardDrive,
      role: ["ADMIN", "TECHNICIAN"],
    },
    {
      href: "/devices/new",
      label: "New Service Registration",
      icon: LuSquare,
      role: ["ADMIN", "TECHNICIAN"],
    },
    {
      href: "/inventory",
      label: "Stock Management",
      icon: LuArchive,
      role: ["ADMIN"],
    },
    {
      href: "/users",
      label: "User Management",
      icon: LuUsers,
      role: ["ADMIN"],
    },
  ];

  const isActive = (href: string) => {
    if (pathname === href) {
      return true;
    }

    if (
      href === "/devices" &&
      pathname.startsWith("/devices") &&
      pathname !== "/devices/new"
    ) {
      return true;
    }

    return false;
  };

  return (
    <nav className="flex w-64 flex-col bg-gray-800 p-4 text-gray-100">
      <div className="mb-8 text-center text-xl font-bold">Main Menu</div>
      <ul className="flex-1 space-y-2 p-4">
        {menuItems.map((item) => {
          if (!user || !item.role.includes(user.role)) {
            return null;
          }

          const active = isActive(item.href);

          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`
                  flex items-center space-x-3 rounded-md px-3 py-2 text-sm font-medium
                  transition-colors duration-150
                  ${
                    active
                      ? "bg-indigo-600 text-white shadow-inner"
                      : "text-gray-300 hover:bg-gray-700 hover:text-white"
                  }
                `}
              >
                <item.icon size={20} />
                <span>{item.label}</span>
              </Link>
            </li>
          );
        })}
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
