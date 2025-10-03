"use client";

import { signIn } from "next-auth/react";

export default function TestAuth() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8">
        <h1 className="text-2xl font-bold text-center">Auth Test Page</h1>
        <button
          onClick={() => signIn("google")}
          className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
        >
          Test Google Sign In
        </button>
      </div>
    </div>
  );
}