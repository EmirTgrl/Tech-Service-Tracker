"use client";

import { useAuth } from "@/contexts/AuthContext";

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
      <p className="mt-4 text-lg text-gray-700">
        Welcome, {user?.name}! This is your dashboard.
      </p>

      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg bg-white p-6 shadow-md">
          <h3 className="text-lg font-medium text-gray-900">Waiting Devices</h3>
          <p className="mt-2 text-3xl font-bold text-indigo-600">0</p>
        </div>
        <div className="rounded-lg bg-white p-6 shadow-md">
          <h3 className="text-lg font-medium text-gray-900">Under Repair</h3>
          <p className="mt-2 text-3xl font-bold text-yellow-600">0</p>
        </div>
        <div className="rounded-lg bg-white p-6 shadow-md">
          <h3 className="text-lg font-medium text-gray-900">Completed</h3>
          <p className="mt-2 text-3xl font-bold text-green-600">0</p>
        </div>
        <div className="rounded-lg bg-white p-6 shadow-md">
          <h3 className="text-lg font-medium text-gray-900">Total Customer</h3>
          <p className="mt-2 text-3xl font-bold text-blue-600">0</p>
        </div>
      </div>
    </div>
  );
}
