"use client";

import { useState, useEffect, FormEvent } from "react";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/api";
import Swal from "sweetalert2";
import { getErrorMessage } from "@/lib/getErrorMessage";
import { LuEye, LuEyeOff } from "react-icons/lu";

export default function ProfilePage() {
  const { user, login } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [isProfileLoading, setIsProfileLoading] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [isPasswordLoading, setIsPasswordLoading] = useState(false);

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
    }
  }, [user]);

  const handleProfileUpdate = async (e: FormEvent) => {
    e.preventDefault();
    setIsProfileLoading(true);

    try {
      const response = await api.put("/auth/profile", { name, email });

      const updatedUser = response.data.user;

      const currentToken = localStorage.getItem("token");
      if (currentToken) {
        login(updatedUser, currentToken);
      }

      Swal.fire(
        "Successfull!",
        "Your profile information has been updated.",
        "success"
      );
    } catch (err: unknown) {
      Swal.fire("Error!", getErrorMessage(err), "error");
    } finally {
      setIsProfileLoading(false);
    }
  };

  const handlePasswordUpdate = async (e: FormEvent) => {
    e.preventDefault();
    setIsPasswordLoading(true);

    try {
      const response = await api.put("/auth/password", {
        currentPassword,
        newPassword,
      });

      const newToken = response.data.token;

      if (user && newToken) {
        login(user, newToken);
      }

      Swal.fire("Successfull!", "Your password has been updated.", "success");
      setCurrentPassword("");
      setNewPassword("");
    } catch (err: unknown) {
      Swal.fire("Error!", getErrorMessage(err), "error");
    } finally {
      setIsPasswordLoading(false);
    }
  };

  if (!user) {
    return <div className="text-center text-gray-700">Profile loading...</div>;
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>

      <div className="rounded-lg bg-white p-6 shadow-md">
        <h2 className="mb-6 text-xl font-bold text-gray-900">
          User Information
        </h2>
        <form onSubmit={handleProfileUpdate} className="space-y-4">
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700"
            >
              Name Surname
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 input-field"
              required
            />
          </div>
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700"
            >
              Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 input-field"
              required
            />
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isProfileLoading}
              className="rounded-md bg-indigo-600 px-6 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:bg-gray-400 cursor-pointer"
            >
              {isProfileLoading ? "Saving..." : "Update Information"}
            </button>
          </div>
        </form>
      </div>

      <div className="rounded-lg bg-white p-6 shadow-md">
        <h2 className="mb-6 text-xl font-bold text-gray-900">
          Change Password
        </h2>
        <form onSubmit={handlePasswordUpdate} className="space-y-4">
          <div>
            <label
              htmlFor="currentPassword"
              className="block text-sm font-medium text-gray-700"
            >
              Current Password
            </label>
            <div className="relative mt-1">
              <input
                type={showCurrentPassword ? "text" : "password"}
                id="currentPassword"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="input-field pr-10"
                required
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 cursor-pointer"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
              >
                {showCurrentPassword ? (
                  <LuEyeOff size={20} />
                ) : (
                  <LuEye size={20} />
                )}
              </button>
            </div>
          </div>
          <div>
            <label
              htmlFor="newPassword"
              className="block text-sm font-medium text-gray-700"
            >
              New Password
            </label>
            <div className="relative mt-1">
              <input
                type={showNewPassword ? "text" : "password"}
                id="newPassword"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="input-field pr-10"
                placeholder="At least 6 characters"
                required
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 cursor-pointer"
                onClick={() => setShowNewPassword(!showNewPassword)}
              >
                {showNewPassword ? <LuEyeOff size={20} /> : <LuEye size={20} />}
              </button>
            </div>
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isPasswordLoading}
              className="rounded-md bg-red-600 px-6 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:bg-gray-400 cursor-pointer"
            >
              {isPasswordLoading ? "Saving..." : "Update Password"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
