"use client";

import { useState, useEffect, FormEvent, ChangeEvent } from "react";
import { useParams } from "next/navigation";
import api from "@/lib/api";
import {
  DeviceDetail,
  StatusLog,
  Repair,
  DeviceImage,
  InventoryItem,
  PartUsage,
} from "@/lib/types";
import { generateServiceReport } from "@/lib/pdfGenerator";
import Image from "next/image";
import Swal from "sweetalert2";
import {
  LuLoaderCircle,
  LuClock,
  LuCheck,
  LuTruck,
  LuWrench,
  LuSearch,
  LuPlus,
  LuDownload,
} from "react-icons/lu";

type DeviceStatus = DeviceDetail["currentStatus"];

const getStatusStyle = (status: DeviceStatus) => {
  switch (status) {
    case "PENDING":
      return {
        className: "bg-yellow-100 text-yellow-800",
        icon: LuClock,
        label: "Waiting",
      };
    case "IN_REPAIR":
      return {
        className: "bg-blue-100 text-blue-800",
        icon: LuWrench,
        label: "Under Repair",
      };
    case "COMPLETED":
      return {
        className: "bg-green-100 text-green-800",
        icon: LuCheck,
        label: "Completed",
      };
    case "DELIVERED":
      return {
        className: "bg-gray-100 text-gray-800",
        icon: LuTruck,
        label: "Delievered",
      };
    default:
      return {
        className: "bg-gray-100 text-gray-800",
        icon: LuLoaderCircle,
        label: "Unknown",
      };
  }
};

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

  const [isEditing, setIsEditing] = useState(false);
  const [isEditLoading, setIsEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const [editFormData, setEditFormData] = useState({
    deviceType: "",
    brand: "",
    model: "",
    serialNo: "",
    issueDesc: "",
    estimatedCost: "" as number | string,
  });

  const [partSearch, setPartSearch] = useState("");
  const [partSearchResults, setPartSearchResults] = useState<InventoryItem[]>(
    []
  );
  const [isPartSearching, setIsPartSearching] = useState(false);
  const [selectedPart, setSelectedPart] = useState<InventoryItem | null>(null);
  const [partQuantity, setPartQuantity] = useState<number>(1);
  const [isPartLoading, setIsPartLoading] = useState(false);
  const [partError, setPartError] = useState<string | null>(null);

  const params = useParams();
  const id = params.id as string;

  useEffect(() => {
    if (id) {
      const fetchDevice = async () => {
        setIsLoading(true);
        setError(null);
        try {
          const response = await api.get(`/devices/${id}`);
          const deviceData: DeviceDetail = response.data;
          setDevice(deviceData);

          setEditFormData({
            deviceType: deviceData.deviceType,
            brand: deviceData.brand,
            model: deviceData.model,
            serialNo: deviceData.serialNo,
            issueDesc: deviceData.issueDesc,
            estimatedCost: deviceData.estimatedCost || "",
          });

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

  const handleEditToggle = () => {
    if (!isEditing) {
      if (device) {
        setEditFormData({
          deviceType: device.deviceType,
          brand: device.brand,
          model: device.model,
          serialNo: device.serialNo,
          issueDesc: device.issueDesc,
          estimatedCost: device.estimatedCost || "",
        });
      }
    }
    setIsEditing(!isEditing);
    setEditError(null);
  };

  const handleFormChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setEditFormData({
      ...editFormData,
      [e.target.name]: e.target.value,
    });
  };

  const handleDetailsUpdate = async (e: FormEvent) => {
    e.preventDefault();
    setIsEditLoading(true);
    setEditError(null);

    const dataToUpdate = {
      ...editFormData,
      estimatedCost: parseFloat(editFormData.estimatedCost as string) || null,
    };

    try {
      const response = await api.put(`/devices/${id}`, dataToUpdate);
      const updatedDevice: DeviceDetail = response.data.device;
      setDevice(updatedDevice);

      setEditFormData({
        deviceType: updatedDevice.deviceType,
        brand: updatedDevice.brand,
        model: updatedDevice.model,
        serialNo: updatedDevice.serialNo,
        issueDesc: updatedDevice.issueDesc,
        estimatedCost: updatedDevice.estimatedCost || "",
      });

      setIsEditing(false);

      Swal.fire("Updated!", "Device infos updated successfully.", "success");
    } catch (err: unknown) {
      console.error("Update error:", err);
      let errorMessage = "An error occurred while updating the device.";

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
        errorMessage = err.response.data.error as string;
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }

      setEditError(errorMessage);
      Swal.fire("Error!", errorMessage, "error");
    } finally {
      setIsEditLoading(false);
    }
  };

  useEffect(() => {
    if (partSearch.length < 2 || selectedPart) {
      setPartSearchResults([]);
      setIsPartSearching(false);
      return;
    }

    setIsPartSearching(true);
    const timerId = setTimeout(() => {
      api
        .get("/inventory", { params: { search: partSearch } })
        .then((response) => {
          setPartSearchResults(response.data);
        })
        .catch(() => {
          setPartError("An error occurred while searching for parts.");
        })
        .finally(() => {
          setIsPartSearching(false);
        });
    }, 500);

    return () => clearTimeout(timerId);
  }, [partSearch, selectedPart]);

  const handleUsePart = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedPart || partQuantity <= 0) {
      setPartError("Please select a part and enter a valid quantity.");
      return;
    }

    setIsPartLoading(true);
    setPartError(null);

    try {
      const response = await api.post(`/devices/${id}/use-part`, {
        inventoryItemId: selectedPart.id,
        quantityUsed: partQuantity,
      });

      const newPartUsage: PartUsage = response.data.partUsage;
      const newFinalCost: number = response.data.newFinalCost;

      setDevice((prevDevice) => {
        if (!prevDevice) return null;
        return {
          ...prevDevice,
          finalCost: newFinalCost,
          partsUsed: [newPartUsage, ...prevDevice.partsUsed],
        };
      });

      setSelectedPart(null);
      setPartSearch("");
      setPartQuantity(1);
      setPartSearchResults([]);

      Swal.fire(
        "Success!",
        "The part was successfully used and the stock was updated.",
        "success"
      );
    } catch (err: unknown) {
      console.error("Part usage error:", err);
      let errorMsg = "An error occurred while using the part.";

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
        errorMsg = err.response.data.error as string;
      }

      setPartError(errorMsg);
      Swal.fire("Error!", errorMsg, "error");
    } finally {
      setIsPartLoading(false);
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

  const currentStatusStyle = getStatusStyle(device.currentStatus);

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
            <span
              className={`ml-2 inline-flex items-center space-x-1 rounded-full px-3 py-1 text-sm font-semibold ${currentStatusStyle.className}`}
            >
              <currentStatusStyle.icon size={16} />
              <span>{currentStatusStyle.label}</span>
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

        <div className="rounded-lg bg-white p-6 shadow-md">
          <h2 className="mb-4 text-xl font-bold text-gray-900">
            Use Parts from Stock
          </h2>
          {partError && (
            <div className="mb-4 rounded bg-red-100 p-3 text-sm text-red-700">
              {partError}
            </div>
          )}

          <form onSubmit={handleUsePart}>
            <label
              htmlFor="partSearch"
              className="block text-sm font-medium text-gray-700"
            >
              Search Part (Name or SKU)
            </label>
            {!selectedPart ? (
              <div className="relative">
                <input
                  type="text"
                  id="partSearch"
                  className="mt-1 input-field pr-10"
                  placeholder="iPhone 14 Screen..."
                  value={partSearch}
                  onChange={(e) => setPartSearch(e.target.value)}
                />
                <LuSearch className="absolute right-3 top-3.5 text-gray-400" />
                {partSearchResults.length > 0 && (
                  <ul className="absolute z-10 mt-1 max-h-48 w-full overflow-y-auto rounded-md border border-gray-300 bg-white shadow-lg">
                    {partSearchResults.map((item) => (
                      <li
                        key={item.id}
                        onClick={() => {
                          setSelectedPart(item);
                          setPartSearch(item.name);
                          setPartSearchResults([]);
                        }}
                        className="cursor-pointer p-3 hover:bg-gray-100"
                      >
                        <p className="font-medium text-gray-900">{item.name}</p>
                        <p className="text-sm text-gray-600">
                          SKU: {item.sku} | Stock: {item.quantity} | Cost:{" "}
                          {item.sellPrice.toFixed(2)} ₺
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ) : (
              <div className="mt-1 flex items-center justify-between rounded-md border border-green-500 bg-green-50 p-3">
                <div>
                  <p className="font-semibold text-green-800">
                    {selectedPart.name}
                  </p>
                  <p className="text-sm text-green-700">
                    Stock: {selectedPart.quantity} | Cost:{" "}
                    {selectedPart.sellPrice.toFixed(2)} ₺
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedPart(null);
                    setPartSearch("");
                  }}
                  className="text-sm font-medium text-red-600 hover:text-red-800"
                >
                  X
                </button>
              </div>
            )}

            <label
              htmlFor="partQuantity"
              className="mt-4 block text-sm font-medium text-gray-700"
            >
              Number to be used
            </label>
            <input
              type="number"
              id="partQuantity"
              min="1"
              value={partQuantity}
              onChange={(e) => setPartQuantity(parseInt(e.target.value))}
              className="mt-1 input-field"
              disabled={!selectedPart}
            />

            <button
              type="submit"
              disabled={isPartLoading || !selectedPart}
              className="mt-4 w-full rounded-md bg-blue-600 py-2 px-4 text-white hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed cursor-pointer"
            >
              {isPartLoading ? "Being Added..." : "Add Part"}
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
              Description
            </label>
            <input
              type="text"
              id="repairDesc"
              className="mt-1 input-field"
              placeholder="Örn: Soldering workmanship, Software installation"
              value={repairDesc}
              onChange={(e) => setRepairDesc(e.target.value)}
            />
            <label
              htmlFor="repairCost"
              className="mt-4 block text-sm font-medium text-gray-700"
            >
              Labour Cost (₺)
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
              className="mt-4 w-full rounded-md bg-green-600 py-2 px-4 text-white hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isRepairLoading ? "Recording in progress..." : "Add Labour Cost"}
            </button>
          </form>
        </div>
      </div>

      <div className="lg:col-span-2">
        <div className="rounded-lg bg-white p-6 shadow-md">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">
              Service Registration Details
            </h2>
            <div className="flex space-x-2">
              <button
                onClick={handleEditToggle}
                className={`rounded-md px-4 py-2 text-sm font-medium cursor-pointer ${
                  isEditing
                    ? "bg-gray-200 text-gray-800 hover:bg-gray-300"
                    : "bg-indigo-600 text-white hover:bg-indigo-700"
                }`}
              >
                {isEditing ? "Cancel" : "Edit Device Information"}
              </button>

              <button
                onClick={() => generateServiceReport(device)}
                className="flex items-center space-x-2 rounded-md bg-gray-600 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 cursor-pointer"
              >
                <LuDownload size={16} />
                <span>Download PDF Report</span>
              </button>
            </div>
          </div>

          {isEditing && editError && (
            <div className="mb-4 rounded bg-red-100 p-3 text-sm text-red-700">
              {editError}
            </div>
          )}

          {!isEditing && (
            <div className="grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2">
              <InfoItem label="Tracking Code" value={device.trackingCode} />
              <div>
                <span className="text-sm font-medium text-gray-500">
                  Current Status:{" "}
                </span>
                <span
                  className={`ml-1 inline-flex items-center space-x-1 rounded-full px-3 py-1 text-xs font-semibold ${currentStatusStyle.className}`}
                >
                  <currentStatusStyle.icon size={14} />
                  <span>{currentStatusStyle.label}</span>
                </span>
              </div>
              <InfoItem label="Current Status" value={device.currentStatus} />

              <h3 className="col-span-full mt-4 border-b pb-1 text-lg font-medium text-gray-800">
                Device Information
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
                Customer Information
              </h3>
              <InfoItem label="Customer" value={device.customer.name} />
              <InfoItem label="Phone" value={device.customer.phone} />
              <InfoItem label="Email" value={device.customer.email || "-"} />

              <h3 className="col-span-full mt-4 border-b pb-1 text-lg font-medium text-gray-800">
                Fault Description
              </h3>
              <p className="col-span-full rounded-md border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700">
                {device.issueDesc}
              </p>
            </div>
          )}

          {isEditing && (
            <form onSubmit={handleDetailsUpdate} className="space-y-4">
              <h3 className="col-span-full border-b pb-1 text-lg font-medium text-gray-800">
                Device Information
              </h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="deviceType"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Device Information
                  </label>
                  <input
                    type="text"
                    name="deviceType"
                    id="deviceType"
                    value={editFormData.deviceType}
                    onChange={handleFormChange}
                    className="mt-1 input-field"
                  />
                </div>
                <div>
                  <label
                    htmlFor="brand"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Brand
                  </label>
                  <input
                    type="text"
                    name="brand"
                    id="brand"
                    value={editFormData.brand}
                    onChange={handleFormChange}
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
                    name="model"
                    id="model"
                    value={editFormData.model}
                    onChange={handleFormChange}
                    className="mt-1 input-field"
                  />
                </div>
                <div>
                  <label
                    htmlFor="serialNo"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Serial Number
                  </label>
                  <input
                    type="text"
                    name="serialNo"
                    id="serialNo"
                    value={editFormData.serialNo}
                    onChange={handleFormChange}
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
                    step="1"
                    name="estimatedCost"
                    id="estimatedCost"
                    value={editFormData.estimatedCost}
                    onChange={handleFormChange}
                    className="mt-1 input-field"
                  />
                </div>
              </div>

              <h3 className="col-span-full mt-4 border-b pb-1 text-lg font-medium text-gray-800">
                Fault Description
              </h3>
              <div>
                <label htmlFor="issueDesc" className="sr-only">
                  Fault Description
                </label>
                <textarea
                  name="issueDesc"
                  id="issueDesc"
                  value={editFormData.issueDesc}
                  onChange={handleFormChange}
                  rows={4}
                  className="mt-1 input-field"
                />
              </div>

              <h3 className="col-span-full mt-4 border-b pb-1 text-lg font-medium text-gray-800">
                Customer Information
              </h3>
              <InfoItem label="Customer" value={device.customer.name} />
              <InfoItem label="Phone" value={device.customer.phone} />

              <div className="flex justify-end pt-4">
                <button
                  type="submit"
                  disabled={isEditLoading}
                  className="rounded-md border border-transparent bg-green-600 py-2 px-6 text-sm font-medium text-white shadow-sm hover:bg-green-700 disabled:bg-gray-400 cursor-pointer"
                >
                  {isEditLoading ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          )}
        </div>

        <div className="mt-6 rounded-lg bg-white p-6 shadow-md">
          <h2 className="mb-4 text-xl font-bold text-gray-900">
            Repair History and Costs
          </h2>
          <h3 className="text-lg font-semibold text-gray-800">Parts Used</h3>
          <ul className="mb-4 divide-y divide-gray-200">
            {!device.partsUsed || device.partsUsed.length === 0 ? (
              <li className="py-3 text-gray-500">
                The part has not yet been used.
              </li>
            ) : (
              device.partsUsed.map((part: PartUsage) => (
                <li
                  key={`part-${part.id}`}
                  className="flex items-center justify-between py-3"
                >
                  <div>
                    <p className="font-medium text-gray-800">
                      {part.inventoryItem.name} (x{part.quantityUsed})
                    </p>
                    <p className="text-xs text-gray-500">
                      SKU: {part.inventoryItem.sku}
                    </p>
                  </div>
                  <span className="text-lg font-bold text-blue-700">
                    {part.sellPriceAtTimeOfUse.toFixed(2)} ₺
                  </span>
                </li>
              ))
            )}
          </ul>
          <h3 className="text-lg font-semibold text-gray-800">
            Added Labour/Service
          </h3>
          <ul className="mb-4 divide-y divide-gray-200">
            {!device.repairs || device.repairs.length === 0 ? (
              <li className="py-3 text-gray-500">
                Labour costs have not yet been added..
              </li>
            ) : (
              device.repairs.map((repair: Repair) => (
                <li
                  key={`repair-${repair.id}`}
                  className="flex items-center justify-between py-3"
                >
                  <p className="font-medium text-gray-800">
                    {repair.description}
                  </p>
                  <span className="text-lg font-bold text-green-700">
                    {repair.cost.toFixed(2)} ₺
                  </span>
                </li>
              ))
            )}
          </ul>
        </div>

        <div className="mt-6 rounded-lg bg-white p-6 shadow-md">
          <h2 className="mb-4 text-xl font-bold text-gray-900">
            Transaction History
          </h2>
          <ul className="space-y-4">
            {device.statusHistory.length === 0 ? (
              <li className="text-gray-500">
                There is no transaction history yet.
              </li>
            ) : (
              device.statusHistory.map((log: StatusLog) => {
                const logStyle = getStatusStyle(log.newStatus);

                return (
                  <li
                    key={log.id}
                    className="relative border-l-2 border-gray-300 pl-8 pb-4"
                  >
                    <span
                      className={`absolute -left-[15px] top-0 flex h-7 w-7 items-center justify-center rounded-full ring-4 ring-white ${logStyle.className}`}
                    >
                      <logStyle.icon size={16} />
                    </span>
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-gray-800">
                        {logStyle.label}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(log.createdAt).toLocaleString("tr-TR")}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">
                      {log.notes || "Sistem kaydı."}
                    </p>
                    <p className="text-xs font-medium text-gray-500">
                      Transaction Processor: {log.user.name}
                    </p>
                  </li>
                );
              })
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
