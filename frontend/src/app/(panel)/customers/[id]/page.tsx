"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/api";
import { CustomerDetail } from "@/lib/types";
import Link from "next/link";

type DeviceStatus = "PENDING" | "IN_REPAIR" | "COMPLETED" | "DELIVERED";
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

export default function CustomerDetailPage() {
  const [customer, setCustomer] = useState<CustomerDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  useEffect(() => {
    if (id) {
      const fetchCustomer = async () => {
        setIsLoading(true);
        setError(null);
        try {
          const response = await api.get(`/customers/${id}`);
          setCustomer(response.data);
        } catch (err: unknown) {
          console.error("Customer fetch error:", err);
          let errorMessage =
            "An error occurred while loading customer details.";

          if (
            err &&
            typeof err === "object" &&
            "response" in err &&
            err.response &&
            typeof err.response === "object" &&
            "status" in err.response
          ) {
            if (err.response.status === 404) {
              errorMessage = "No customer found with this ID.";
            }
          }

          setError(errorMessage);
        } finally {
          setIsLoading(false);
        }
      };
      fetchCustomer();
    }
  }, [id]);

  if (isLoading) {
    return (
      <div className="text-center text-gray-700">
        Customer details are loading...
      </div>
    );
  }
  if (error) {
    return (
      <div className="rounded-md bg-red-100 p-4 text-center text-red-700">
        {error}
      </div>
    );
  }
  if (!customer) {
    return <div className="text-center text-gray-500">Customer not found.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg bg-white p-6 shadow-md">
        <div className="mb-4 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {customer.name}
            </h1>
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                customer.isActive
                  ? "bg-green-100 text-green-800"
                  : "bg-red-100 text-red-800"
              }`}
            >
              {customer.isActive ? "Active Customer" : "Passive Customer"}
            </span>
          </div>
          <div className="flex space-x-2">
            {/* <button className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 cursor-pointer">
              Edit Information
            </button> */}
            <button
              onClick={() => router.push("/devices/new")}
              className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 cursor-pointer"
            >
              + New Registration for This Customer
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <p className="text-sm">
            <span className="font-medium text-gray-500">Phone: </span>
            <span className="font-semibold text-gray-800">
              {customer.phone}
            </span>
          </p>
          <p className="text-sm">
            <span className="font-medium text-gray-500">Email: </span>
            <span className="font-semibold text-gray-800">
              {customer.email || "-"}
            </span>
          </p>
          <p className="text-sm">
            <span className="font-medium text-gray-500">
              Total Registration:{" "}
            </span>
            <span className="font-semibold text-gray-800">
              {customer._count?.devices} Device
            </span>
          </p>
          <p className="text-sm">
            <span className="font-medium text-gray-500">
              Date of Registration:{" "}
            </span>
            <span className="font-semibold text-gray-800">
              {new Date(customer.createdAt).toLocaleDateString("tr-TR")}
            </span>
          </p>
        </div>
      </div>

      <div className="rounded-lg bg-white p-6 shadow-md">
        <h2 className="mb-4 text-xl font-bold text-gray-900">
          Customer Device History
        </h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Device
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Tracking Code
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Service Date
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {customer.devices.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-4 text-center text-gray-500">
                    No service record was found for this customer.
                  </td>
                </tr>
              ) : (
                customer.devices.map((device) => (
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {device.brand} {device.model}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {device.trackingCode}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {new Date(device.createdAt).toLocaleDateString("tr-TR")}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link
                        href={`/devices/${device.id}`}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        Go to Device Details
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
