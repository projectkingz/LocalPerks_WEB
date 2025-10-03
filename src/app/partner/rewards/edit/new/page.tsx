"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

export default function AddRewardPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", description: "", points: 0 });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/rewards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Failed to add reward");
      router.push("/partner/rewards");
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-pink-50">
      {/* Navigation Bar */}
      <nav className="w-full flex items-center justify-between px-6 py-4 bg-white/80 shadow-sm border-b border-blue-100 fixed top-0 left-0 z-10 backdrop-blur">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-pink-100 text-pink-600 text-2xl shadow">🎁</span>
          <span className="ml-2 text-xl font-bold text-blue-700 tracking-tight">MyRewards</span>
        </div>
        <a
          href="/partner/rewards"
          className="text-blue-600 hover:text-pink-500 font-semibold px-4 py-2 rounded transition"
        >
          ← Back to Rewards
        </a>
      </nav>
      {/* Spacer for navbar */}
      <div className="h-20" />
      <div className="flex items-center justify-center py-8 px-2">
        <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl p-8 border border-blue-100">
          <div className="flex items-center mb-6">
            <span className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-pink-100 text-pink-600 text-3xl shadow mr-3">🎁</span>
            <h1 className="text-3xl font-bold text-gray-800">Add Reward</h1>
          </div>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block font-semibold text-gray-700 mb-1">Name</label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                className="w-full border border-blue-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 px-4 py-3 rounded-lg text-lg transition"
                placeholder="Reward name"
                required
              />
            </div>
            <div>
              <label className="block font-semibold text-gray-700 mb-1">Description</label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                className="w-full border border-blue-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 px-4 py-3 rounded-lg text-lg transition"
                placeholder="Describe the reward..."
                rows={3}
                required
              />
            </div>
            <div>
              <label className="block font-semibold text-gray-700 mb-1">Points</label>
              <input
                type="number"
                name="points"
                value={form.points}
                onChange={handleChange}
                className="w-full border border-blue-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 px-4 py-3 rounded-lg text-lg transition"
                placeholder="e.g. 100"
                min={0}
                required
              />
            </div>
            {error && <div className="text-red-600 font-medium text-center">{error}</div>}
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-600 to-pink-500 text-white text-lg font-semibold px-6 py-3 rounded-lg shadow hover:from-blue-700 hover:to-pink-600 transition disabled:opacity-60"
              disabled={saving}
            >
              {saving ? "Saving..." : "Add Reward"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
} 