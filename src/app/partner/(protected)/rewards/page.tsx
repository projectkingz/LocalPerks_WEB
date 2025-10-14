"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from 'next-auth/react';
import { Rows3, LayoutGrid } from 'lucide-react';
import { formatDate } from '@/lib/utils/date';
import ScrollControls from '@/components/ScrollControls';

interface Reward {
  id: string;
  name: string;
  description: string;
  points: number;
  createdAt: string;
}

const fetchAllRewards = async (): Promise<Reward[]> => {
  try {
    console.log('Fetching rewards...');
    const res = await fetch('/api/rewards');
    console.log('Response status:', res.status);
    console.log('Response headers:', res.headers);
    
    if (!res.ok) {
      const errorText = await res.text();
      console.error('API Error:', errorText);
      throw new Error(`Failed to fetch rewards: ${res.status} ${errorText}`);
    }
    
    const data = await res.json();
    console.log('Rewards data:', data);
    return data;
  } catch (error) {
    console.error('Fetch error:', error);
    throw error;
  }
};

export default function RewardsPage() {
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<'list' | 'gallery'>('list');
  const router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    console.log('Session status:', status);
    console.log('Session data:', session);
    
    if (status === 'authenticated' && session) {
      fetchAllRewards()
        .then((data) => {
          setRewards(data);
          setLoading(false);
          setError(null);
        })
        .catch((err) => {
          console.error('Error fetching rewards:', err);
          setError(err.message);
          setLoading(false);
        });
    } else if (status === 'unauthenticated') {
      setError('Not authenticated');
      setLoading(false);
    }
  }, [status, session]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          <span className="ml-2">Loading rewards...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto py-8">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <h3 className="text-red-800 font-medium">Error loading rewards</h3>
          <p className="text-red-600 mt-1">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-2 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <ScrollControls />
      <div className="max-w-4xl mx-auto py-8">
        <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Rewards</h1>
        <div className="flex gap-2 items-center">
          <button
            className={`p-2 rounded-full border transition-colors duration-200 shadow-sm flex items-center justify-center text-lg ${view === 'list' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-blue-600 border-blue-200 hover:bg-blue-50'}`}
            onClick={() => setView('list')}
            aria-label="List View"
          >
            <Rows3 size={22} />
          </button>
          <button
            className={`p-2 rounded-full border transition-colors duration-200 shadow-sm flex items-center justify-center text-lg ${view === 'gallery' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-blue-600 border-blue-200 hover:bg-blue-50'}`}
            onClick={() => setView('gallery')}
            aria-label="Gallery View"
          >
            <LayoutGrid size={22} />
          </button>
          <Link
            href="/partner/rewards/edit/new"
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 ml-4 shadow"
          >
            Add Reward
          </Link>
        </div>
      </div>
      {rewards.length === 0 ? (
        <div className="text-gray-500">No rewards found.</div>
      ) : view === 'list' ? (
        <div className="bg-white rounded shadow overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr>
                <th className="px-4 py-2"></th>
                <th className="px-4 py-2 text-left">Name</th>
                <th className="px-4 py-2 text-left">Description</th>
                <th className="px-4 py-2 text-left">Points</th>
                <th className="px-4 py-2 text-left">Created At</th>
                <th className="px-4 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rewards.map((reward) => (
                <tr key={reward.id} className="border-t">
                  <td className="px-4 py-2">
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-pink-100 text-pink-600 text-xl shadow-sm">
                      🎁
                    </span>
                  </td>
                  <td className="px-4 py-2">{reward.name}</td>
                  <td className="px-4 py-2">{reward.description}</td>
                  <td className="px-4 py-2">{reward.points}</td>
                  <td className="px-4 py-2">{formatDate(reward.createdAt)}</td>
                  <td className="px-4 py-2 text-center">
                    <Link
                      href={`/partner/rewards/edit/${reward.id}`}
                      className="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600"
                    >
                      Edit
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {rewards.map((reward) => (
            <div key={reward.id} className="bg-white rounded shadow p-4 flex flex-col justify-between">
              <div className="flex items-center mb-2">
                <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-pink-100 text-pink-600 text-2xl shadow-sm mr-2">
                  🎁
                </span>
                <h2 className="text-xl font-semibold">{reward.name}</h2>
              </div>
              <p className="text-gray-600 mb-2">{reward.description}</p>
              <div className="text-blue-700 font-bold mb-2">{reward.points} points</div>
              <div className="text-xs text-gray-400 mb-2">Created: {formatDate(reward.createdAt)}</div>
              <Link
                href={`/partner/rewards/edit/${reward.id}`}
                className="mt-2 bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600 text-center"
              >
                Edit
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
    </>
  );
} 