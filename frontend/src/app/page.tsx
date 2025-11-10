"use client";

import Link from "next/link";
import { LuSearch } from "react-icons/lu";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-100 p-8">
      <div className="mb-12 text-center">
        <h1 className="text-5xl font-bold text-gray-800">
          Technical Service Tracking
        </h1>
        <p className="mt-4 text-xl text-gray-600">
          Keep track of your devices status at all times.
        </p>
      </div>

      <div className="grid w-full max-w-4xl grid-cols-1 gap-8 md:grid-cols-2">
        <Link
          href="/track"
          className="group block rounded-lg bg-white p-8 shadow-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
        >
          <div className="flex items-center space-x-4">
            <div className="rounded-full bg-indigo-100 p-4 text-indigo-600 transition-colors group-hover:bg-indigo-600 group-hover:text-white">
              <LuSearch size={32} />
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-gray-900">
                Track My Device
              </h2>
              <p className="mt-1 text-gray-600">
                Check the current status of your device using your service code.
              </p>
            </div>
          </div>
        </Link>
      </div>
    </main>
  );
}
