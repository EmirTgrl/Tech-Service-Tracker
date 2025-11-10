"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { CustomerSummary, PaginatedCustomersResponse } from "@/lib/types";
import { useAuth } from "@/contexts/AuthContext";
import Swal from "sweetalert2";
import Link from "next/link";

const PaginationButtons = ({
  currentPage,
  totalPages,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) => {
  const pageNumbers = [];
  for (let i = 1; i <= totalPages; i++) pageNumbers.push(i);

  return (
    <nav className="mt-6 flex items-center justify-center space-x-1">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="rounded-md border bg-white px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Prev
      </button>
      {pageNumbers.map((number) => (
        <button
          key={number}
          onClick={() => onPageChange(number)}
          className={`rounded-md border px-4 py-2 text-sm font-medium ${
            currentPage === number
              ? "border-indigo-600 bg-indigo-600 text-white"
              : "bg-white text-gray-700 hover:bg-gray-50"
          }`}
        >
          {number}
        </button>
      ))}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="rounded-md border bg-white px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Next
      </button>
    </nav>
  );
};

export default function CustomersPage() {
  const [customers, setCustomers] = useState<CustomerSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user: currentUser } = useAuth();

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [paginationData, setPaginationData] = useState({ totalPages: 1 });
  const [includeInactive, setIncludeInactive] = useState(false);

  useEffect(() => {
    const timerId = setTimeout(() => setDebouncedQuery(searchQuery), 500);
    return () => clearTimeout(timerId);
  }, [searchQuery]);

  useEffect(() => {
    const fetchCustomers = async () => {
      setIsLoading(true);
      setError(null);

      const params = new URLSearchParams();
      params.append("page", currentPage.toString());
      params.append("limit", "10");
      if (debouncedQuery) params.append("search", debouncedQuery);
      if (includeInactive) params.append("includeInactive", "true");

      try {
        const response = await api.get<PaginatedCustomersResponse>(
          "/customers",
          { params }
        );
        setCustomers(response.data.data);
        setPaginationData({ totalPages: response.data.pagination.totalPages });
      } catch (err: unknown) {
        console.error("Error fetching customers:", err);
        setError("An error occurred while loading the customer list.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchCustomers();
  }, [debouncedQuery, currentPage, includeInactive]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo(0, 0);
  };

  const handleCreateCustomer = () => {
    Swal.fire({
      title: "Add New Customer",
      html: `
        <input type="text" id="swal-name" class="swal2-input" placeholder="Name Customer *">
        <input type="tel" id="swal-phone" class="swal2-input" placeholder="Phone * (ex: 5xxxxxxxxx)">
        <input type="email" id="swal-email" class="swal2-input" placeholder="Email (Optional)">
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: "Add",
      cancelButtonText: "Cancel",
      preConfirm: () => {
        const name = (document.getElementById("swal-name") as HTMLInputElement)
          .value;
        const phone = (
          document.getElementById("swal-phone") as HTMLInputElement
        ).value;
        const email = (
          document.getElementById("swal-email") as HTMLInputElement
        ).value;
        if (!name || !phone) {
          Swal.showValidationMessage("Name and phone are required.");
          return false;
        }
        return { name, phone, email: email || null };
      },
    }).then(async (result) => {
      if (result.isConfirmed && result.value) {
        try {
          await api.post("/customers", result.value);
          setCurrentPage(1);
          setDebouncedQuery("");
          window.location.reload();

          Swal.fire(
            "Added!",
            "The customer has been successfully added.",
            "success"
          );
        } catch (err: unknown) {
          console.error("Customer creation error:", err);
          let errorMessage = "Failed to add customer.";

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
          }

          Swal.fire("Error!", errorMessage, "error");
        }
      }
    });
  };

  const handleEditCustomer = (customer: CustomerSummary) => {
    Swal.fire({
      title: "Edit Customer Information",
      html: `
        <input type="text" id="swal-name" class="swal2-input" value="${
          customer.name
        }">
        <input type="tel" id="swal-phone" class="swal2-input" value="${
          customer.phone
        }">
        <input type="email" id="swal-email" class="swal2-input" value="${
          customer.email || ""
        }">
      `,
      preConfirm: () => {
        const name = (document.getElementById("swal-name") as HTMLInputElement)
          .value;
        const phone = (
          document.getElementById("swal-phone") as HTMLInputElement
        ).value;
        const email = (
          document.getElementById("swal-email") as HTMLInputElement
        ).value;
        if (!name || !phone) {
        }
        return { name, phone, email: email || null };
      },
    }).then(async (result) => {
      if (result.isConfirmed && result.value) {
        try {
          const response = await api.put(
            `/customers/${customer.id}`,
            result.value
          );
          setCustomers((prev) =>
            prev.map((c) => (c.id === customer.id ? response.data : c))
          );
          Swal.fire(
            "Updated!",
            "Customer information has been updated.",
            "success"
          );
        } catch (err: unknown) {
          console.error("Customer update error:", err);
          let errorMessage = "Failed to update customer.";

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
          }

          Swal.fire("Error!", errorMessage, "error");
        }
      }
    });
  };

  const handleDeactivateCustomer = (customer: CustomerSummary) => {
    Swal.fire({
      title: "Are you sure?",
      text: `You will deactivate the customer named "${customer.name}".`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      confirmButtonText: "Yes, deactivate!",
      cancelButtonText: "Cancel",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await api.delete(`/customers/${customer.id}`);
          setCustomers((prev) =>
            prev.map((c) =>
              c.id === customer.id ? { ...c, isActive: false } : c
            )
          );
          Swal.fire(
            "Deactivated!",
            "The customer has been deactivated.",
            "success"
          );
        } catch (err: unknown) {
          console.error("Customer deactivation error:", err);
          let errorMessage = "Failed to deactivate customer.";

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
          }

          Swal.fire("Error!", errorMessage, "error");
        }
      }
    });
  };

  return (
    <div className="rounded-lg bg-white p-6 shadow-md">
      <div className="mb-4 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <h1 className="text-2xl font-bold text-gray-900">
          Customer Management (CRM)
        </h1>
        <button
          onClick={handleCreateCustomer}
          className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 cursor-pointer"
        >
          + Add New Customer
        </button>
      </div>

      <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <input
          type="text"
          placeholder="Search by name, phone number or email address."
          className="w-full rounded-md border border-gray-300 p-2 text-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:col-span-2"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <div className="flex items-center">
          <input
            type="checkbox"
            id="includeInactive"
            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            checked={includeInactive}
            onChange={(e) => setIncludeInactive(e.target.checked)}
          />
          <label
            htmlFor="includeInactive"
            className="ml-2 block text-sm text-gray-900"
          >
            Show inactive customers
          </label>
        </div>
      </div>

      {isLoading && (
        <div className="py-4 text-center text-gray-700">
          Customers Loading...
        </div>
      )}
      {error && (
        <div className="py-4 rounded-md bg-red-100 p-4 text-center text-red-700">
          {error}
        </div>
      )}

      {!isLoading && !error && (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Contact
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">
                  Device Count
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {customers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-4 text-center text-gray-500">
                    Customer not found.
                  </td>
                </tr>
              ) : (
                customers.map((customer) => (
                  <tr
                    key={customer.id}
                    className={`${
                      !customer.isActive
                        ? "bg-gray-100 opacity-60"
                        : "hover:bg-gray-50"
                    }`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <Link
                        href={`/customers/${customer.id}`}
                        className="text-indigo-600 hover:text-indigo-900 hover:underline"
                      >
                        {customer.name}
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      <div>{customer.phone}</div>
                      <div className="text-xs text-gray-500">
                        {customer.email || ""}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                      {customer._count.devices}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-semibold ${
                          customer.isActive
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {customer.isActive ? "Active" : "Passive"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                      <button
                        onClick={() => handleEditCustomer(customer)}
                        className="text-indigo-600 hover:text-indigo-900 cursor-pointer"
                      >
                        Edit
                      </button>
                      {currentUser?.role === "ADMIN" && customer.isActive && (
                        <button
                          onClick={() => handleDeactivateCustomer(customer)}
                          className="text-red-600 hover:text-red-900 cursor-pointer"
                        >
                          Deactivate
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {!isLoading && customers.length > 0 && paginationData.totalPages > 1 && (
        <PaginationButtons
          currentPage={currentPage}
          totalPages={paginationData.totalPages}
          onPageChange={handlePageChange}
        />
      )}
    </div>
  );
}
