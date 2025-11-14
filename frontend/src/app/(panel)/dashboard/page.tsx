"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import api from "@/lib/api";
import { FullDashboardData, ReportDataItem } from "@/lib/types";
import Link from "next/link";
import { LuPlus, LuUserPlus, LuArchive } from "react-icons/lu";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";

const StatCard = ({
  title,
  value,
  colorClass,
}: {
  title: string;
  value: number | string;
  colorClass: string;
}) => (
  <div className="rounded-lg bg-white p-6 shadow-md transition-shadow hover:shadow-lg">
    <h3 className="text-lg font-medium text-gray-900">{title}</h3>
    <p className={`mt-2 text-3xl font-bold ${colorClass}`}>{value}</p>
  </div>
);

const QuickAction = ({
  href,
  label,
  icon: Icon,
}: {
  href: string;
  label: string;
  icon: React.ElementType;
}) => (
  <Link
    href={href}
    className="flex flex-col items-center justify-center rounded-lg bg-white p-6 shadow-md transition-all hover:shadow-lg hover:bg-gray-50"
  >
    <Icon className="mb-2 h-8 w-8 text-indigo-600" />
    <span className="text-sm font-medium text-gray-900">{label}</span>
  </Link>
);

const QuickList = ({
  title,
  items,
}: {
  title: string;
  items: FullDashboardData["lists"]["unassignedDevices"];
}) => (
  <div className="rounded-lg bg-white p-6 shadow-md">
    <h2 className="mb-4 text-xl font-bold text-gray-900">{title}</h2>
    <ul className="divide-y divide-gray-200">
      {items.length === 0 ? (
        <li className="py-3 text-gray-500">No records to display.</li>
      ) : (
        items.map((device) => (
          <li
            key={device.id}
            className="flex items-center justify-between py-3"
          >
            <div>
              <Link
                href={`/devices/${device.id}`}
                className="font-medium text-indigo-600 hover:underline"
              >
                {device.brand} {device.model || ""}
              </Link>
              <p className="text-sm text-gray-600">
                Customer: {device.customer.name}
              </p>
            </div>
            <span className="text-xs text-gray-500">
              {new Date(device.createdAt).toLocaleDateString("tr-TR")}
            </span>
          </li>
        ))
      )}
    </ul>
  </div>
);

export default function DashboardPage() {
  const { user } = useAuth();

  const [data, setData] = useState<FullDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await api.get<FullDashboardData>(
          "/stats/dashboard/full"
        );
        setData(response.data);
      } catch (err) {
        console.error("Dashboard data retrieval error:", err);
        setError("Dashboard data could not be loaded.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  const pieChartData: ReportDataItem[] = data
    ? [
        {
          name: "Pending",
          count: data.stats.deviceStats.PENDING,
          fill: "#F59E0B",
        },
        {
          name: "In Repair",
          count: data.stats.deviceStats.IN_REPAIR,
          fill: "#3B82F6",
        },
        {
          name: "Completed",
          count: data.stats.deviceStats.COMPLETED,
          fill: "#10B981",
        },
      ]
    : [];

  if (isLoading) {
    return (
      <div className="text-center text-gray-700">Dashboard loading...</div>
    );
  }
  if (error) {
    return (
      <div className="rounded-md bg-red-100 p-4 text-center text-red-700">
        {error}
      </div>
    );
  }
  if (!data) {
    return <div className="text-center text-gray-500">No data found.</div>;
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-2 text-lg text-gray-600">
            Welcome, {user?.name}! Here is the current status of the service.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-4">
          <QuickAction
            href="/devices/new"
            label="New Registration"
            icon={LuPlus}
          />
          <QuickAction href="/customers" label="Customers" icon={LuUserPlus} />
          {user?.role === "ADMIN" && (
            <QuickAction href="/inventory" label="Stock" icon={LuArchive} />
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Pending Devices"
          value={data.stats.deviceStats.PENDING}
          colorClass="text-yellow-600"
        />
        <StatCard
          title="Items In Repair"
          value={data.stats.deviceStats.IN_REPAIR}
          colorClass="text-blue-600"
        />
        <StatCard
          title="Completed Items"
          value={data.stats.deviceStats.COMPLETED}
          colorClass="text-green-600"
        />
        <StatCard
          title="Total Customers"
          value={data.stats.totalCustomers}
          colorClass="text-indigo-600"
        />
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-5">
        <div className="lg:col-span-2">
          {user?.role === "ADMIN" && (
            <QuickList
              title="Unassigned Devices (Urgent)"
              items={data.lists.unassignedDevices}
            />
          )}
          {user?.role === "TECHNICIAN" && (
            <QuickList
              title="My Most Recent Assignments"
              items={data.lists.recentActivity}
            />
          )}
        </div>

        <div className="rounded-lg bg-white p-6 shadow-md lg:col-span-3">
          <h2 className="mb-6 text-xl font-bold text-gray-900">
            Active Device Status Distribution
          </h2>
          {pieChartData.reduce((sum, item) => sum + item.count, 0) === 0 ? (
            <p className="flex h-[300px] items-center justify-center text-gray-500">
              There is no active device data to display.
            </p>
          ) : (
            <div style={{ width: "100%", height: 300 }}>
              <ResponsiveContainer>
                <PieChart
                  margin={{
                    top: 20,
                    right: 30,
                    bottom: 20,
                    left: 30,
                  }}
                >
                  <Pie
                    data={pieChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={100}
                    dataKey="count"
                    nameKey="name"
                  >
                    {pieChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill as string} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
