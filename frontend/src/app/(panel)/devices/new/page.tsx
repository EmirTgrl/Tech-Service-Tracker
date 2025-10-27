"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";

export default function NewDevicePage() {
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [deviceType, setDeviceType] = useState("");
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [serialNo, setSerialNo] = useState("");
  const [issueDesc, setIssueDesc] = useState("");
  const [estimatedCost, setEstimatedCost] = useState<number | string>("");

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const router = useRouter();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    if (
      !customerName ||
      !customerPhone ||
      !deviceType ||
      !brand ||
      !serialNo ||
      !issueDesc
    ) {
      setError(
        "Customer name, phone number and basic device information are required."
      );
      setIsLoading(false);
      return;
    }

    const deviceData = {
      customerName,
      customerPhone,
      customerEmail: customerEmail || null,
      deviceType,
      brand,
      model,
      serialNo,
      issueDesc,
      estimatedCost: estimatedCost ? parseFloat(estimatedCost as string) : null,
    };

    try {
      const response = await api.post("/devices", deviceData);

      if (response.status === 201) {
        setSuccess(
          `Service registration successfully created! Tracking Code: ${response.data.trackingCode}`
        );
        setCustomerName("");
        setCustomerPhone("");
        setCustomerEmail("");
        setDeviceType("");
        setBrand("");
        setModel("");
        setSerialNo("");
        setIssueDesc("");
        setEstimatedCost("");
      } else {
        setError("An unexpected server response was received.");
      }
    } catch (err: unknown) {
      console.error("New registration error:", err);
      if (
        err &&
        typeof err === "object" &&
        "response" in err &&
        err.response &&
        typeof err.response === "object" &&
        "data" in err.response &&
        err.response.data &&
        typeof err.response.data === "object" &&
        "error" in err.response.data
      ) {
        setError(err.response.data.error as string);
      } else {
        setError("An error occurred while creating the registration.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="rounded-lg bg-white p-6 shadow-md">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">
        Create New Service Registration
      </h1>

      {success && (
        <div className="mb-4 rounded-md bg-green-50 p-4 text-sm font-medium text-green-700">
          {success}
        </div>
      )}
      {error && (
        <div className="mb-4 rounded-md bg-red-50 p-4 text-sm font-medium text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <fieldset className="rounded border border-gray-300 p-4">
          <legend className="px-2 text-lg font-medium text-gray-700">
            Customer Details
          </legend>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="customerName"
                className="block text-sm font-medium text-gray-700"
              >
                Name Surname *
              </label>
              <input
                type="text"
                id="customerName"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                required
                className="mt-1 input-field"
              />
            </div>
            <div>
              <label
                htmlFor="customerPhone"
                className="block text-sm font-medium text-gray-700"
              >
                Phone *
              </label>
              <input
                type="tel"
                id="customerPhone"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                required
                className="mt-1 input-field"
              />
            </div>
            <div className="sm:col-span-2">
              <label
                htmlFor="customerEmail"
                className="block text-sm font-medium text-gray-700"
              >
                Email (Optional)
              </label>
              <input
                type="email"
                id="customerEmail"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                className="mt-1 input-field"
              />
            </div>
          </div>
        </fieldset>

        <fieldset className="rounded border border-gray-300 p-4">
          <legend className="px-2 text-lg font-medium text-gray-700">
            Device Details
          </legend>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="deviceType"
                className="block text-sm font-medium text-gray-700"
              >
                Device Type *
              </label>
              <input
                type="text"
                id="deviceType"
                value={deviceType}
                onChange={(e) => setDeviceType(e.target.value)}
                required
                className="mt-1 input-field"
                placeholder="Ex: Laptop, Phone, Tablet..."
              />
            </div>
            <div>
              <label
                htmlFor="brand"
                className="block text-sm font-medium text-gray-700"
              >
                Brand *
              </label>
              <input
                type="text"
                id="brand"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                required
                className="mt-1 input-field"
              />
            </div>
            <div>
              <label
                htmlFor="model"
                className="block text-sm font-medium text-gray-700"
              >
                Model
              </label>
              <input
                type="text"
                id="model"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="mt-1 input-field"
              />
            </div>
            <div>
              <label
                htmlFor="serialNo"
                className="block text-sm font-medium text-gray-700"
              >
                Serial Number *
              </label>
              <input
                type="text"
                id="serialNo"
                value={serialNo}
                onChange={(e) => setSerialNo(e.target.value)}
                required
                className="mt-1 input-field"
              />
            </div>
            <div className="sm:col-span-2">
              <label
                htmlFor="issueDesc"
                className="block text-sm font-medium text-gray-700"
              >
                Fault Description *
              </label>
              <textarea
                id="issueDesc"
                value={issueDesc}
                onChange={(e) => setIssueDesc(e.target.value)}
                required
                rows={3}
                className="mt-1 input-field"
              />
            </div>
            <div>
              <label
                htmlFor="estimatedCost"
                className="block text-sm font-medium text-gray-700"
              >
                Estimated Cost (₺)
              </label>
              <input
                type="number"
                step="0.01"
                id="estimatedCost"
                value={estimatedCost}
                onChange={(e) => setEstimatedCost(e.target.value)}
                className="mt-1 input-field"
              />
            </div>
          </div>
        </fieldset>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isLoading}
            className="rounded-md border border-transparent bg-green-600 py-2 px-6 text-sm font-medium text-white shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isLoading ? "Saving..." : "Create Service Registration"}
          </button>
        </div>
      </form>
    </div>
  );
}
