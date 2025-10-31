"use client";

import { useState, FormEvent } from "react";
import api from "@/lib/api";
import { CustomerTrackInfo } from "@/lib/types";

export default function TrackDevicePage() {
  const [trackingCode, setTrackingCode] = useState("");
  const [deviceInfo, setDeviceInfo] = useState<CustomerTrackInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setDeviceInfo(null);

    if (!trackingCode) {
      setError("Please enter a tracking code.");
      setIsLoading(false);
      return;
    }

    try {
      const response = await api.get("/devices/track", {
        params: {
          code: trackingCode,
        },
      });

      setDeviceInfo(response.data);
    } catch (err: unknown) {
      console.error("Device query error:", err);
      if (
        err &&
        typeof err === "object" &&
        "response" in err &&
        err.response &&
        typeof err.response === "object" &&
        "status" in err.response
      ) {
        if (err.response.status === 404) {
          setError(
            "Invalid tracking code. Please check the code on your receipt."
          );
        } else {
          setError("An error occurred during the query. Please try again.");
        }
      } else {
        setError("An unexpected error occurred. Please try again later.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center bg-gray-100 p-4 pt-10">
      <div className="w-full max-w-2xl">
        <div className="mb-6 rounded-lg bg-white p-8 shadow-md">
          <h1 className="mb-4 text-center text-3xl font-bold text-gray-900">
            Device Status Inquiry
          </h1>
          <p className="mb-6 text-center text-gray-600">
            You can view the current status of your device by entering the
            tracking code written on your service receipt.
          </p>

          <form
            onSubmit={handleSubmit}
            className="flex flex-col sm:flex-row sm:space-x-2"
          >
            <input
              type="text"
              value={trackingCode}
              onChange={(e) => setTrackingCode(e.target.value.toUpperCase())}
              placeholder="SRV-XXXXX-XXXXX"
              className="input-field flex-grow px-4 py-2"
            />
            <button
              type="submit"
              disabled={isLoading}
              className="mt-2 rounded-md bg-indigo-600 px-6 py-2 font-medium text-white shadow-sm hover:bg-indigo-700 disabled:bg-gray-400 sm:mt-0"
            >
              {isLoading ? "Under query..." : "Query"}
            </button>
          </form>

          {error && (
            <div className="mt-4 rounded-md bg-red-100 p-3 text-center text-red-700">
              {error}
            </div>
          )}
        </div>

        {deviceInfo && (
          <div className="rounded-lg bg-white p-8 shadow-md">
            <h2 className="mb-4 text-2xl font-semibold text-gray-800">
              Query Result:{" "}
              <span className="text-indigo-600">{deviceInfo.trackingCode}</span>
            </h2>

            <div className="mb-6 rounded-md border border-blue-200 bg-blue-50 p-4 text-center">
              <p className="text-sm font-medium text-blue-700">
                CURRENT SITUATION
              </p>
              <p className="text-3xl font-bold text-blue-900">
                {deviceInfo.currentStatus}
              </p>
            </div>

            <div className="space-y-2 text-sm">
              <p>
                <span className="font-medium text-gray-600">Customer:</span>{" "}
                {deviceInfo.customer.name}
              </p>
              <p>
                <span className="font-medium text-gray-600">
                  Fault Description:
                </span>{" "}
                {deviceInfo.issueDesc}
              </p>
              <p>
                <span className="font-medium text-gray-600">
                  Date of Entry:
                </span>{" "}
                {new Date(deviceInfo.createdAt).toLocaleDateString("tr-TR")}
              </p>
            </div>

            <h3 className="mt-6 mb-4 text-xl font-semibold text-gray-800">
              Transaction History
            </h3>
            <ul className="space-y-4">
              {deviceInfo.statusHistory.map((log) => (
                <li
                  key={log.createdAt}
                  className="relative border-l-2 border-gray-300 pl-6 pb-4"
                >
                  <span className="absolute -left-[11px] top-1 h-5 w-5 rounded-full bg-indigo-600 ring-4 ring-white"></span>
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-gray-800">
                      {log.newStatus}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(log.createdAt).toLocaleString("tr-TR")}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">
                    {log.notes || "System registration."}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
