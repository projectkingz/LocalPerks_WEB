"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";

// Fetch reward from real API
const fetchReward = async (id: string) => {
  const res = await fetch(`/api/rewards/${id}`);
  if (!res.ok) throw new Error('Failed to fetch reward');
  return res.json();
};

// Update reward via real API
const updateReward = async (id: string, data: any) => {
  const res = await fetch(`/api/rewards/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update reward');
  return res.json();
};

export default function EditRewardPage() {
  const router = useRouter();
  const params = useParams();
  const { id } = params;
  const [reward, setReward] = useState<any>(null);
  const [form, setForm] = useState({ name: "", description: "", points: 0 });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (id) {
      fetchReward(id as string)
        .then((data) => {
          setReward(data);
          setForm({
            name: data.name,
            description: data.description,
            points: data.points,
          });
          setLoading(false);
        })
        .catch((err) => {
          setError("Reward not found or could not be loaded.");
          setLoading(false);
        });
    }
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await updateReward(id as string, form);
    setSaving(false);
    router.push("/partner/rewards");
  };

  if (loading) return <div>Loading...</div>;
  if (error) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-pink-50">
      <div className="max-w-xl mx-auto p-4 bg-white rounded shadow text-center">
        <div className="text-3xl mb-2">❌</div>
        <div className="text-lg font-semibold text-red-600 mb-2">{error}</div>
        <button
          onClick={() => router.push("/partner/rewards")}
          className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Back to Rewards
        </button>
      </div>
    </div>
  );

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
            <h1 className="text-3xl font-bold text-gray-800">Edit Reward</h1>
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
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-600 to-pink-500 text-white text-lg font-semibold px-6 py-3 rounded-lg shadow hover:from-blue-700 hover:to-pink-600 transition disabled:opacity-60"
              disabled={saving}
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
} 