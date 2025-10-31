"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import api from "@/lib/api";
import { DashboardStats } from "@/lib/types";

const StatCard = ({
  title,
  value,
  colorClass,
}: {
  title: string;
  value: number | string;
  colorClass: string;
}) => (
  <div className="rounded-lg bg-white p-6 shadow-md">
    <h3 className="text-lg font-medium text-gray-900">{title}</h3>
    <p className={`mt-2 text-3xl font-bold ${colorClass}`}>{value}</p>
  </div>
);

export default function DashboardPage() {
  const { user } = useAuth();

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await api.get("/stats/dashboard");
        setStats(response.data);
      } catch (err) {
        console.error("Dashboard statistics error:", err);
        setError("Statistics could not be loaded.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchStats();
  }, []);

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
      <p className="mt-4 text-lg text-gray-700">
        Welcome, {user?.name}! Here is the current status of the service.
      </p>

      {isLoading && (
        <div className="mt-8 text-center text-gray-600">
          Statistics Loading...
        </div>
      )}

      {error && (
        <div className="mt-8 rounded-md bg-red-100 p-4 text-center text-red-700">
          {error}
        </div>
      )}

      {stats && (
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Pending Devices"
            value={stats.deviceStats.PENDING}
            colorClass="text-indigo-600"
          />
          <StatCard
            title="Items Under Repair"
            value={stats.deviceStats.IN_REPAIR}
            colorClass="text-yellow-600"
          />
          <StatCard
            title="Completed"
            value={stats.deviceStats.COMPLETED}
            colorClass="text-green-600"
          />
          <StatCard
            title="Total Customer"
            value={stats.totalCustomers}
            colorClass="text-blue-600"
          />
        </div>
      )}
    </div>
  );
}
