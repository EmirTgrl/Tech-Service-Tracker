"use client";

import { useState, useEffect, FormEvent, ChangeEvent } from "react";
import { useParams } from "next/navigation";
import api from "@/lib/api";
import { DeviceDetail, StatusLog, Repair, DeviceImage } from "@/lib/types";
import Image from "next/image";

const allStatuses: StatusLog["newStatus"][] = [
  "PENDING",
  "IN_REPAIR",
  "COMPLETED",
  "DELIVERED",
];

export default function DeviceDetailPage() {
  const [device, setDevice] = useState<DeviceDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [newStatus, setNewStatus] = useState<StatusLog["newStatus"]>("PENDING");
  const [notes, setNotes] = useState("");
  const [isStatusLoading, setIsStatusLoading] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [statusSuccess, setStatusSuccess] = useState<string | null>(null);

  const [repairDesc, setRepairDesc] = useState("");
  const [repairCost, setRepairCost] = useState<string | number>("");
  const [isRepairLoading, setIsRepairLoading] = useState(false);
  const [repairError, setRepairError] = useState<string | null>(null);
  const [repairSuccess, setRepairSuccess] = useState<string | null>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imageDesc, setImageDesc] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);

  const params = useParams();
  const id = params.id as string;

  useEffect(() => {
    if (id) {
      const fetchDevice = async () => {
        setIsLoading(true);
        setError(null);
        try {
          const response = await api.get(`/devices/${id}`);
          setDevice(response.data);
          setNewStatus(response.data.currentStatus);
        } catch (err: unknown) {
          console.error("Error fetching device details:", err);
          if (
            err &&
            typeof err === "object" &&
            "response" in err &&
            err.response &&
            typeof err.response === "object" &&
            "status" in err.response
          ) {
            if (err.response.status === 404) {
              setError("No device record with this ID could be found.");
            } else {
              setError("An error occurred while loading device details.");
            }
          } else {
            setError("An unexpected error occurred.");
          }
        } finally {
          setIsLoading(false);
        }
      };
      fetchDevice();
    }
  }, [id]);

  const handleStatusUpdate = async (e: FormEvent) => {
    e.preventDefault();
    setIsStatusLoading(true);
    setStatusError(null);
    setStatusSuccess(null);

    try {
      const response = await api.put(`/devices/${id}/status`, {
        newStatus,
        notes,
      });
      if (!response.data || !response.data.log || !response.data.device) {
        throw new Error(
          "An invalid or incomplete response was received from the server."
        );
      }
      setStatusSuccess("Status updated successfully!");
      setNotes("");

      const newLogEntry: StatusLog = response.data.log;
      const updatedDeviceStatus = response.data.device.currentStatus;

      setDevice((prevDevice) => {
        if (!prevDevice) return null;

        const updatedHistory = [newLogEntry, ...prevDevice.statusHistory];

        return {
          ...prevDevice,
          currentStatus: updatedDeviceStatus,
          statusHistory: updatedHistory,
        };
      });
    } catch (err: unknown) {
      console.error("Status update error:", err);

      if (
        err instanceof Error &&
        err.message ===
          "An invalid or incomplete response was received from the server."
      ) {
        setStatusError(err.message);
      } else if (
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
        setStatusError(err.response.data.error as string);
      } else {
        setStatusError("An error occurred while updating the status.");
      }
    } finally {
      setIsStatusLoading(false);
    }
  };

  const handleRepairSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsRepairLoading(true);
    setRepairError(null);
    setRepairSuccess(null);

    const cost = parseFloat(repairCost as string);

    if (!repairDesc || isNaN(cost) || cost <= 0) {
      setRepairError(
        "Please enter a valid description and a cost greater than zero."
      );
      setIsRepairLoading(false);
      return;
    }

    try {
      const response = await api.post(`/devices/${id}/repair`, {
        description: repairDesc,
        cost: cost,
      });

      if (
        !response.data ||
        !response.data.repair ||
        response.data.newFinalCost === undefined
      ) {
        throw new Error(
          "An invalid or incomplete response was received from the server."
        );
      }

      setRepairSuccess("Repair record has been succesfully added.");
      setRepairDesc("");
      setRepairCost("");

      const newRepairEntry: Repair = response.data.repair;
      const newFinalCost: number = response.data.newFinalCost;

      setDevice((prevDevice) => {
        if (!prevDevice) return null;

        const updatedRepairs = [newRepairEntry, ...prevDevice.repairs];

        return {
          ...prevDevice,
          finalCost: newFinalCost,
          repairs: updatedRepairs,
        };
      });
    } catch (err: unknown) {
      console.error("Repair record error:", err);
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
        setRepairError(err.response.data.error as string);
      } else if (err instanceof Error) {
        setRepairError(err.message);
      } else {
        setRepairError("An error occurred while adding the repair record.");
      }
    } finally {
      setIsRepairLoading(false);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleImageUpload = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setUploadError("Please select a image file");
      return;
    }

    setIsUploading(true);
    setUploadError(null);
    setUploadSuccess(null);

    const formData = new FormData();
    formData.append("deviceImage", selectedFile);
    formData.append("description", imageDesc);

    try {
      const response = await api.post(`/devices/${id}/upload`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.status === 201) {
        setUploadSuccess("Image uploaded successfully");
        setSelectedFile(null);
        setImageDesc("");

        const newImage: DeviceImage = response.data.image;

        setDevice((prevDevice) => {
          if (!prevDevice) return null;
          const updatedImages = [newImage, ...prevDevice.images];
          return {
            ...prevDevice,
            images: updatedImages,
          };
        });
      }
    } catch (err: unknown) {
      console.error("Resim yükleme hatası:", err);
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
        setUploadError(err.response.data.error as string);
      } else if (err instanceof Error) {
        setUploadError(err.message);
      } else {
        setUploadError("An error occurred while loading the image.");
      }
    } finally {
      setIsUploading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="text-center text-gray-700">Loading device details...</div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md bg-red-100 p-4 text-center text-red-700">
        {error}
      </div>
    );
  }

  if (!device) {
    return <div className="text-center text-gray-500">Device not found.</div>;
  }

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
      <div className="lg:col-span-1">
        <div className="rounded-lg bg-white p-6 shadow-md">
          <h2 className="mb-4 text-xl font-bold text-gray-900">
            Update Status
          </h2>
          {statusSuccess && (
            <div className="mb-4 rounded bg-green-100 p-3 text-sm text-green-700">
              {statusSuccess}
            </div>
          )}
          {statusError && (
            <div className="mb-4 rounded bg-red-100 p-3 text-sm text-red-700">
              {statusError}
            </div>
          )}
          <div className="mb-4">
            <span className="text-sm font-medium text-gray-600">
              Current Status:
            </span>
            <span className="ml-2 rounded-full bg-blue-100 px-3 py-1 text-sm font-semibold text-blue-800">
              {device.currentStatus}
            </span>
          </div>
          <form onSubmit={handleStatusUpdate}>
            <label
              htmlFor="newStatus"
              className="block text-sm font-medium text-gray-700"
            >
              New Status
            </label>
            <select
              id="newStatus"
              className="mt-1 input-field"
              value={newStatus}
              onChange={(e) =>
                setNewStatus(e.target.value as StatusLog["newStatus"])
              }
            >
              {allStatuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
            <label
              htmlFor="notes"
              className="mt-4 block text-sm font-medium text-gray-700"
            >
              Transaction Note
            </label>
            <textarea
              id="notes"
              rows={3}
              className="mt-1 input-field"
              placeholder="Enter the transaction or note..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            ></textarea>
            <button
              type="submit"
              disabled={isStatusLoading}
              className="mt-4 w-full rounded-md bg-indigo-600 py-2 px-4 text-white hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed cursor-pointer"
            >
              {isStatusLoading ? "Updating..." : "Update Status"}
            </button>
          </form>
        </div>

        <div className="mt-6 rounded-lg bg-white p-6 shadow-md">
          <h2 className="mb-4 text-xl font-bold text-gray-900">
            Add Repair/Cost
          </h2>

          {repairSuccess && (
            <div className="mb-4 rounded bg-green-100 p-3 text-sm text-green-700">
              {repairSuccess}
            </div>
          )}
          {repairError && (
            <div className="mb-4 rounded bg-red-100 p-3 text-sm text-red-700">
              {repairError}
            </div>
          )}

          <form onSubmit={handleRepairSubmit}>
            <label
              htmlFor="repairDesc"
              className="block text-sm font-medium text-gray-700"
            >
              Process/Part Performed
            </label>
            <input
              type="text"
              id="repairDesc"
              className="mt-1 input-field"
              placeholder="Ex: Screen replacement"
              value={repairDesc}
              onChange={(e) => setRepairDesc(e.target.value)}
            />
            <label
              htmlFor="repairCost"
              className="mt-4 block text-sm font-medium text-gray-700"
            >
              Cost (₺)
            </label>
            <input
              type="number"
              step="1"
              id="repairCost"
              className="mt-1 input-field"
              placeholder="0.00"
              value={repairCost}
              onChange={(e) => setRepairCost(e.target.value)}
            />
            <button
              type="submit"
              disabled={isRepairLoading}
              className="mt-4 w-full rounded-md bg-green-600 py-2 px-4 text-white hover:bg-green-700 disabled:bg-gray-400 cursor-pointer"
            >
              {isRepairLoading ? "Saving..." : "Add Cost"}
            </button>
          </form>
        </div>
      </div>

      <div className="lg:col-span-2">
        <div className="rounded-lg bg-white p-6 shadow-md">
          <h2 className="mb-4 text-xl font-bold text-gray-900">
            Service Record Details
          </h2>

          <div className="grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2">
            <InfoItem label="Tracking Code" value={device.trackingCode} />
            <InfoItem label="Current Status" value={device.currentStatus} />

            <h3 className="col-span-full mt-4 border-b pb-1 text-lg font-medium text-gray-800">
              Device Infos
            </h3>
            <InfoItem label="Device Type" value={device.deviceType} />
            <InfoItem
              label="Brand / Model"
              value={`${device.brand} ${device.model}`}
            />
            <InfoItem label="Serial Number" value={device.serialNo} />
            <InfoItem
              label="Estimated Cost"
              value={
                device.estimatedCost
                  ? `${device.estimatedCost} ₺`
                  : "Unspecified"
              }
            />
            <InfoItem
              label="Total Cost"
              value={
                device.finalCost ? `${device.finalCost} ₺` : "Not calculated"
              }
            />

            <h3 className="col-span-full mt-4 border-b pb-1 text-lg font-medium text-gray-800">
              Customer Infos
            </h3>
            <InfoItem label="Customer" value={device.customer.name} />
            <InfoItem label="Phone Number" value={device.customer.phone} />
            <InfoItem label="Email" value={device.customer.email || "-"} />

            <h3 className="col-span-full mt-4 border-b pb-1 text-lg font-medium text-gray-800">
              Fault Description
            </h3>
            <p className="col-span-full rounded-md border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700">
              {device.issueDesc}
            </p>
          </div>
        </div>

        <div className="mt-6 rounded-lg bg-white p-6 shadow-md">
          <h2 className="mb-4 text-xl font-bold text-gray-900">
            Repair History and Costs
          </h2>
          <ul className="divide-y divide-gray-200">
            {device.repairs.length === 0 ? (
              <li className="py-3 text-gray-500">
                No repair record has been added yet.
              </li>
            ) : (
              device.repairs.map((repair: Repair) => (
                <li
                  key={repair.id}
                  className="flex items-center justify-between py-3"
                >
                  <div>
                    <p className="font-medium text-gray-800">
                      {repair.description}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(repair.createdAt).toLocaleDateString("tr-TR")}
                    </p>
                  </div>
                  <span className="text-lg font-bold text-green-700">
                    {repair.cost.toFixed(2)} ₺
                  </span>
                </li>
              ))
            )}
            <li className="flex items-center justify-between py-3 border-t-2 border-gray-300">
              <p className="text-lg font-bold text-gray-900">TOTAL</p>
              <span className="text-2xl font-bold text-green-800">
                {device.finalCost
                  ? `${device.finalCost.toFixed(2)} ₺`
                  : "0.00 ₺"}
              </span>
            </li>
          </ul>
        </div>

        <div className="mt-6 rounded-lg bg-white p-6 shadow-md">
          <h2 className="mb-4 text-xl font-bold text-gray-900">
            Transaction History
          </h2>
          <ul className="space-y-4">
            {device.statusHistory.length === 0 ? (
              <li className="text-gray-500">
                There is no transaction history yet..
              </li>
            ) : (
              device.statusHistory.map((log: StatusLog) => (
                <li
                  key={log.id}
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
                  <p className="text-xs font-medium text-gray-500">
                    Transaction Processor: {log.user.name}
                  </p>
                </li>
              ))
            )}
          </ul>
        </div>

        <div className="mt-6 rounded-lg bg-white p-6 shadow-md">
          <h2 className="mb-4 text-xl font-bold text-gray-900">
            Device Images
          </h2>
          <form
            onSubmit={handleImageUpload}
            className="mb-6 rounded border border-gray-200 p-4"
          >
            {uploadSuccess && (
              <div className="mb-4 rounded bg-green-100 p-3 text-sm text-green-700">
                {uploadSuccess}
              </div>
            )}
            {uploadError && (
              <div className="mb-4 rounded bg-red-100 p-3 text-sm text-red-700">
                {uploadError}
              </div>
            )}
            <div>
              <label
                htmlFor="imageFile"
                className="block text-sm font-medium text-gray-700"
              >
                Select a Image (JPG/PNG)
              </label>
              <input
                type="file"
                id="imageFile"
                accept="image/jpeg, image/png"
                onChange={handleFileChange}
                className="mt-1 block w-full text-sm text-gray-900 file:mr-4 file:rounded-full file:border-0 file:bg-indigo-50 file:py-2 file:px-4 file:text-sm file:font-semibold file:text-indigo-700 hover:file:bg-indigo-100"
              />
            </div>
            <div className="mt-4">
              <label
                htmlFor="imageDesc"
                className="block text-sm font-medium text-gray-700"
              >
                Image Description (Optional)
              </label>
              <input
                type="text"
                id="imageDesc"
                value={imageDesc}
                onChange={(e) => setImageDesc(e.target.value)}
                className="mt-1 input-field"
                placeholder="Ex: Scratch on the top left of the laptop screen"
              />
            </div>
            <button
              type="submit"
              disabled={isUploading || !selectedFile}
              className="mt-4 w-full rounded-md bg-blue-600 py-2 px-4 text-white hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed cursor-pointer"
            >
              {isUploading ? "Uploading..." : "Upload Image"}
            </button>
          </form>
          <h3 className="mb-4 text-lg font-semibold text-gray-800">
            Uploaded Images
          </h3>
          {device.images.length === 0 ? (
            <p className="text-gray-500">
              No image has been uploaded for this device yet.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
              {device.images.map((image: DeviceImage) => (
                <div
                  key={image.id}
                  className="overflow-hidden rounded-lg border border-gray-200"
                >
                  <Image
                    src={`${process.env.NEXT_PUBLIC_API_BASE_URL?.replace(
                      "/api",
                      ""
                    )}${image.imageUrl}`}
                    alt={image.description || "Device Image"}
                    width={300}
                    height={200}
                    className="h-48 w-full object-cover"
                  />
                  <div className="p-3">
                    <p className="truncate text-sm text-gray-700">
                      {image.description || "No Description"}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(image.uploadedAt).toLocaleDateString("tr-TR")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const InfoItem = ({
  label,
  value,
}: {
  label: string;
  value: string | null;
}) => (
  <div className="text-sm">
    <span className="font-medium text-gray-500">{label}: </span>
    <span className="font-semibold text-gray-800">{value || "-"}</span>
  </div>
);
