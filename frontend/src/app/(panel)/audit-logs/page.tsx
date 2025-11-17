"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { AuditLogEntry, PaginatedAuditLogsResponse } from "@/lib/types";
import AdminGuard from "@/components/AdminGuard";
import PaginationButtons from "@/components/PaginationButtons";

export default function AuditLogPage() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [paginationData, setPaginationData] = useState({ totalPages: 1 });

  useEffect(() => {
    const fetchLogs = async () => {
      setIsLoading(true);
      setError(null);

      const params = new URLSearchParams();
      params.append("page", currentPage.toString());
      params.append("limit", "20");

      try {
        const response = await api.get<PaginatedAuditLogsResponse>(
          "/audit-logs",
          { params }
        );
        setLogs(response.data.data);
        setPaginationData({ totalPages: response.data.pagination.totalPages });
      } catch (err: unknown) {
        setError("An error occurred while loading the audit logs.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchLogs();
  }, [currentPage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo(0, 0);
  };

  const formatDetails = (details: unknown) => {
    if (!details) return "None";
    try {
      return JSON.stringify(details, null, 2);
    } catch {
      return "Could not be formatted";
    }
  };

  return (
    <AdminGuard>
      <div className="rounded-lg bg-white p-6 shadow-md">
        <h1 className="mb-4 text-2xl font-bold text-gray-900">Audit Logs</h1>
        <p className="mb-4 text-sm text-gray-600">
          A record of all critical changes made in the system (User, Stock,
          Customer, Device).
        </p>

        {isLoading && (
          <div className="py-4 text-center text-gray-700">
            Records are loading...
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
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    User (Actor)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Action
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Affected Record
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Details (JSON)
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-4 text-center text-gray-500">
                      No audit record to display.
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {new Date(log.createdAt).toLocaleString("tr-TR")}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {log.actor.name}
                        <div className="text-xs text-gray-500">
                          {log.actor.email}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-800">
                          {log.action}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {log.entityType} (ID: {log.entityId})
                      </td>
                      <td className="px-6 py-4 whitespace-pre-wrap text-xs text-gray-600">
                        <pre className="overflow-x-auto rounded-md bg-gray-50 p-2">
                          <code>{formatDetails(log.details)}</code>
                        </pre>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {!isLoading && logs.length > 0 && paginationData.totalPages > 1 && (
          <PaginationButtons
            currentPage={currentPage}
            totalPages={paginationData.totalPages}
            onPageChange={handlePageChange}
          />
        )}
      </div>
    </AdminGuard>
  );
}
