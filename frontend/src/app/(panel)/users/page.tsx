"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { UserSummary } from "@/lib/types";
import AdminGuard from "@/components/AdminGuard";
import Swal from "sweetalert2";

export default function UsersPage() {
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await api.get("/users");
        setUsers(response.data);
      } catch (err: unknown) {
        console.error("Error fetching users:", err);
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
        } else if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("An error occurred while loading the user list.");
        }
      } finally {
        setIsLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const handleDeactivate = async (userId: number, userName: string) => {
    Swal.fire({
      title: "Are you sure?",
      text: `You are about to deactivate the user named ‘${userName}’. The user will no longer be able to log in!`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, deactivate!",
      cancelButtonText: "Cancel",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await api.delete(`/users/${userId}`);

          setUsers((prevUsers) =>
            prevUsers.map((user) =>
              user.id === userId ? { ...user, isActive: false } : user
            )
          );

          Swal.fire(
            "Deactivated!",
            `The account of the user named ‘${userName}’ has been successfully deactivated.`,
            "success"
          );
        } catch (err: unknown) {
          console.error("User deactivation error:", err);
          let errorMessage = "Failed to deactivate user.";

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

          Swal.fire("Error!", errorMessage, "error");
        }
      }
    });
  };

  if (isLoading) {
    return <div className="text-center text-gray-700">Users Loading...</div>;
  }

  if (error) {
    return (
      <div className="rounded-md bg-red-100 p-4 text-center text-red-700">
        {error}
      </div>
    );
  }

  return (
    <AdminGuard>
      <div className="rounded-lg bg-white p-6 shadow-md">
        <h1 className="mb-4 text-2xl font-bold text-gray-900">
          User Management
        </h1>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Name Surname
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Role
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
              {users.map((user) => (
                <tr
                  key={user.id}
                  className={`${
                    !user.isActive
                      ? "bg-gray-100 opacity-60"
                      : "hover:bg-gray-50"
                  }`}
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {user.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {user.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {user.role}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-semibold ${
                        user.isActive
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {user.isActive ? "Active" : "Passive"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                    <button className="text-indigo-600 hover:text-indigo-900 cursor-pointer">
                      Edit
                    </button>
                    {user.isActive && (
                      <button
                        onClick={() => handleDeactivate(user.id, user.name)}
                        className="text-red-600 hover:text-red-900 cursor-pointer"
                      >
                        Deactivate
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminGuard>
  );
}
