"use client";

import { Bell, Search } from "lucide-react";

export default function Topbar() {
  return (
    <header className="flex h-20 items-center justify-between border-b border-gray-200 bg-white px-5 sm:px-8">
      <div className="relative hidden w-full max-w-md sm:block">
        <Search
          size={17}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
        />
        <input
          type="text"
          placeholder="Search HR365..."
          className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-blue-300 focus:bg-white"
        />
      </div>

      <div className="ml-auto flex items-center gap-4">
        <button className="relative rounded-xl p-2.5 text-gray-500 hover:bg-gray-100">
          <Bell size={19} strokeWidth={1.8} />
          <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-blue-500" />
        </button>

        <div className="flex items-center gap-3 border-l border-gray-200 pl-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-900 text-sm font-medium text-white">
            A
          </div>

          <div className="hidden sm:block">
            <p className="text-sm font-medium text-gray-900">
              Arsh Raza Zaidi
            </p>
            <p className="text-xs text-gray-500">
              Software Engineer
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}