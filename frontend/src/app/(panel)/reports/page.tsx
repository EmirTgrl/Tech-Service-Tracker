"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { ReportDataItem } from "@/lib/types";
import AdminGuard from "@/components/AdminGuard";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#8884D8",
  "#DAA520",
];

export default function ReportsPage() {
  const [techData, setTechData] = useState<ReportDataItem[]>([]);
  const [brandData, setBrandData] = useState<ReportDataItem[]>([]);
  const [incomeData, setIncomeData] = useState<ReportDataItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReports = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const techPromise = api.get("/reports/technician-performance");
        const brandPromise = api.get("/reports/most-repaired-brands");
        const incomePromise = api.get("/reports/monthly-income");

        const [techResponse, brandResponse, incomeResponse] = await Promise.all(
          [techPromise, brandPromise, incomePromise]
        );

        setTechData(techResponse.data);
        setBrandData(brandResponse.data);
        setIncomeData(incomeResponse.data);
      } catch (err: unknown) {
        console.error("Report data fetch error:", err);
        let errorMessage = "An error occurred while loading report data.";

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

        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };
    fetchReports();
  }, []);

  if (isLoading) {
    return (
      <AdminGuard>
        <div className="text-center text-gray-700">
          Reports are being generated...
        </div>
      </AdminGuard>
    );
  }
  if (error) {
    return (
      <AdminGuard>
        <div className="rounded-md bg-red-100 p-4 text-center text-red-700">
          {error}
        </div>
      </AdminGuard>
    );
  }

  return (
    <AdminGuard>
      <div className="space-y-8">
        <h1 className="text-3xl font-bold text-gray-900">Advanced Reports</h1>

        <div className="rounded-lg bg-white p-6 shadow-md">
          <h2 className="mb-6 text-xl font-bold text-gray-900">
            Monthly Income Chart (Devices with Payments Received)
          </h2>
          {incomeData.length > 0 ? (
            <div style={{ width: "100%", height: 300 }}>
              <ResponsiveContainer>
                <LineChart
                  data={incomeData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip
                    formatter={(value: number) => [
                      `${value.toFixed(2)} TL`,
                      "Income",
                    ]}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="#10B981"
                    strokeWidth={2}
                    name="Monthly Income (TL)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-gray-500">No financial data found to display.</p>
          )}
        </div>

        <div className="rounded-lg bg-white p-6 shadow-md">
          <h2 className="mb-6 text-xl font-bold text-gray-900">
            Technician Performance (Number of Devices Completed)
          </h2>
          {techData.length > 0 ? (
            <div style={{ width: "100%", height: 300 }}>
              <ResponsiveContainer>
                <BarChart
                  data={techData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="count" fill="#8884d8" name="Completed Device" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-gray-500">
              No technician performance data found to display.
            </p>
          )}
        </div>

        <div className="rounded-lg bg-white p-6 shadow-md">
          <h2 className="mb-6 text-xl font-bold text-gray-900">
            Most Frequently Serviced Brands (Top 10)
          </h2>
          {brandData.length > 0 ? (
            <div style={{ width: "100%", height: 300 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={brandData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="count"
                    nameKey="name"
                    label={(entry) => `${entry.name} (${entry.value})`}
                  >
                    {brandData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-gray-500">No brand data found to display.</p>
          )}
        </div>
      </div>
    </AdminGuard>
  );
}
