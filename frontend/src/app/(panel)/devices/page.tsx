"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { DeviceSummary } from "@/lib/types";
import Link from "next/link";

type DeviceStatus = DeviceSummary["currentStatus"];

const getStatusColor = (status: DeviceStatus) => {
  switch (status) {
    case "PENDING":
      return "bg-yellow-100 text-yellow-800";
    case "IN_REPAIR":
      return "bg-blue-100 text-blue-800";
    case "COMPLETED":
      return "bg-green-100 text-green-800";
    case "DELIVERED":
      return "bg-gray-100 text-gray-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

const allStatuses: DeviceStatus[] = [
  "PENDING",
  "IN_REPAIR",
  "COMPLETED",
  "DELIVERED",
];

export default function DevicesPage() {
  const [devices, setDevices] = useState<DeviceSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  const [statusFilter, setStatusFilter] = useState<DeviceStatus | "">("");

  useEffect(() => {
    const timerId = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 500);

    return () => {
      clearTimeout(timerId);
    };
  }, [searchQuery]);

  useEffect(() => {
    const fetchDevices = async () => {
      setIsLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (debouncedQuery) {
        params.append("search", debouncedQuery);
      }
      if (statusFilter) {
        params.append("status", statusFilter);
      }

      try {
        const response = await api.get("/devices", {
          params: params,
        });
        setDevices(response.data);
      } catch (err: unknown) {
        console.error("Error fetching devices:", err);
        setError(
          "An error occurred while loading the devices. " +
            (err instanceof Error ? err.message : "Unknown error")
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchDevices();
  }, [debouncedQuery, statusFilter]);

  if (isLoading) {
    return <div className="text-center text-gray-700">Devices Loading...</div>;
  }

  if (error) {
    return (
      <div className="rounded-md bg-red-100 p-4 text-center text-red-700">
        {error}
      </div>
    );
  }

  return (
    <div className="rounded-lg bg-white p-6 shadow-md">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">
          Service Registration List
        </h1>
        <Link
          href="/devices/new"
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          + Add New Registration
        </Link>
      </div>

      <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <input
          type="text"
          placeholder="Search by customer name, serial number or tracking code..."
          className="w-full rounded-md border border-gray-300 p-2 text-black shadow-sm"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as DeviceStatus | "")}
          className="w-full rounded-md border border-gray-300 p-2 text-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
        >
          <option value="">All Statuses</option>
          {allStatuses.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Customer
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Device
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Arrival Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Serial No / Tracking Code
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {devices.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                  {debouncedQuery || statusFilter
                    ? `No records matching the search criteria were found.`
                    : "No device found in the system."}
                </td>
              </tr>
            ) : (
              devices.map((device) => (
                <tr key={device.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-semibold capitalize ${getStatusColor(
                        device.currentStatus
                      )}`}
                    >
                      {device.currentStatus.replace("_", " ").toLowerCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {device.customer.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {device.brand} {device.model}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {new Date(device.createdAt).toLocaleDateString("tr-TR")}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-600">
                    {device.serialNo} / {device.trackingCode}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Link
                      href={`/devices/${device.id}`}
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      Detail
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
