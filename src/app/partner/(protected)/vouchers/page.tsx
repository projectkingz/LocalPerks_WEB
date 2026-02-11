"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from 'next-auth/react';
import { Rows3, LayoutGrid, TrendingUp, Users, CheckCircle2, Sparkles } from 'lucide-react';
import { formatDate } from '@/lib/utils/date';
import ScrollControls from '@/components/ScrollControls';

interface RewardWithStats {
  rewardId: string;
  rewardName: string;
  rewardDescription: string;
  discountPercentage: number;
  approvalStatus: string;
  validFrom: string | null;
  validTo: string | null;
  createdAt: string;
  stats: {
    claimed: number;
    redeemed: number;
    active: number;
    expired: number;
  };
}

interface VoucherStatsResponse {
  rewards: RewardWithStats[];
  summary: {
    totalRewards: number;
    totalClaimed: number;
    totalRedeemed: number;
    totalActive: number;
    totalExpired: number;
  };
}

const fetchVoucherStats = async (): Promise<VoucherStatsResponse> => {
  try {
    console.log('Fetching voucher stats...');
    const res = await fetch('/api/partner/vouchers/stats');
    
    if (!res.ok) {
      const errorText = await res.text();
      console.error('API Error:', errorText);
      throw new Error(`Failed to fetch voucher stats: ${res.status} ${errorText}`);
    }
    
    const data = await res.json();
    console.log('Voucher stats data:', data);
    return data;
  } catch (error) {
    console.error('Fetch error:', error);
    throw error;
  }
};

// Helper function to check if voucher is expired
const isVoucherExpired = (validTo: string | null): boolean => {
  if (!validTo) return false;
  const expiryDate = new Date(validTo);
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Reset time to start of day for comparison
  expiryDate.setHours(0, 0, 0, 0);
  return expiryDate < today;
};

// Helper function to get voucher status
const getVoucherStatus = (reward: RewardWithStats): string => {
  if (isVoucherExpired(reward.validTo)) {
    return 'EXPIRED';
  }
  return reward.approvalStatus;
};

export default function VouchersPage() {
  const [rewards, setRewards] = useState<RewardWithStats[]>([]);
  const [summary, setSummary] = useState<VoucherStatsResponse['summary'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<'list' | 'gallery'>('list');
  const router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    console.log('Session status:', status);
    console.log('Session data:', session);
    
    if (status === 'authenticated' && session) {
      fetchVoucherStats()
        .then((data) => {
          setRewards(data.rewards);
          setSummary(data.summary);
          setLoading(false);
          setError(null);
        })
        .catch((err) => {
          console.error('Error fetching voucher stats:', err);
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
          <span className="ml-2">Loading vouchers...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto py-8">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <h3 className="text-red-800 font-medium">Error loading vouchers</h3>
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
      <div className="max-w-6xl mx-auto py-8">
        <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Vouchers</h1>
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
            href="/partner/vouchers/edit/new"
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 ml-4 shadow"
          >
            Create Voucher
          </Link>
        </div>
      </div>
      
      {/* Summary Statistics */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-8">
          <div className="group relative bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border border-blue-200/50 hover:scale-105">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 bg-blue-500 rounded-xl shadow-md group-hover:scale-110 transition-transform duration-300">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="text-sm font-medium text-blue-700/80 mb-1">Total Rewards</div>
            <div className="text-4xl font-extrabold text-blue-600 tracking-tight">{summary.totalRewards}</div>
          </div>
          
          <div className="group relative bg-gradient-to-br from-green-50 to-emerald-100 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border border-green-200/50 hover:scale-105">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 bg-green-500 rounded-xl shadow-md group-hover:scale-110 transition-transform duration-300">
                <Users className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="text-sm font-medium text-green-700/80 mb-1">Vouchers Claimed</div>
            <div className="text-4xl font-extrabold text-green-600 tracking-tight">{summary.totalClaimed}</div>
          </div>
          
          <div className="group relative bg-gradient-to-br from-purple-50 to-violet-100 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border border-purple-200/50 hover:scale-105">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 bg-purple-500 rounded-xl shadow-md group-hover:scale-110 transition-transform duration-300">
                <CheckCircle2 className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="text-sm font-medium text-purple-700/80 mb-1">Vouchers Redeemed</div>
            <div className="text-4xl font-extrabold text-purple-600 tracking-tight">{summary.totalRedeemed}</div>
          </div>
          
          <div className="group relative bg-gradient-to-br from-amber-50 to-yellow-100 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border border-yellow-200/50 hover:scale-105">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 bg-amber-500 rounded-xl shadow-md group-hover:scale-110 transition-transform duration-300">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="text-sm font-medium text-amber-700/80 mb-1">Active Vouchers</div>
            <div className="text-4xl font-extrabold text-amber-600 tracking-tight">{summary.totalActive}</div>
          </div>
        </div>
      )}

      {rewards.length === 0 ? (
        <div className="text-gray-500">No vouchers found.</div>
      ) : view === 'list' ? (
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
              <tr>
                <th className="px-6 py-4"></th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Name</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Description</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Discount %</th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">Claimed</th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">Redeemed</th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">Active</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Status</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Created At</th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {rewards.map((reward) => (
                <tr key={reward.rewardId} className="hover:bg-gray-50/50 transition-colors duration-150">
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-pink-100 to-purple-100 text-xl shadow-md border border-pink-200/50">
                      🎫
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-semibold text-gray-900">{reward.rewardName}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-600 max-w-xs truncate">{reward.rewardDescription}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-3 py-1 rounded-lg bg-blue-100 text-blue-700 font-bold text-sm">
                      {reward.discountPercentage}%
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="inline-flex items-center justify-center min-w-[3rem] px-3 py-1.5 rounded-lg bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200/50">
                      <span className="text-lg font-bold text-green-700">{reward.stats.claimed}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="inline-flex items-center justify-center min-w-[3rem] px-3 py-1.5 rounded-lg bg-gradient-to-br from-purple-50 to-violet-50 border border-purple-200/50">
                      <span className="text-lg font-bold text-purple-700">{reward.stats.redeemed}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="inline-flex items-center justify-center min-w-[3rem] px-3 py-1.5 rounded-lg bg-gradient-to-br from-amber-50 to-yellow-50 border border-amber-200/50">
                      <span className="text-lg font-bold text-amber-700">{reward.stats.active}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold ${
                      getVoucherStatus(reward) === 'APPROVED' ? 'bg-green-100 text-green-700 border border-green-200' :
                      getVoucherStatus(reward) === 'PENDING' ? 'bg-yellow-100 text-yellow-700 border border-yellow-200' :
                      getVoucherStatus(reward) === 'EXPIRED' ? 'bg-gray-100 text-gray-700 border border-gray-200' :
                      'bg-red-100 text-red-700 border border-red-200'
                    }`}>
                      {getVoucherStatus(reward)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-600">{formatDate(reward.createdAt)}</div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    {getVoucherStatus(reward) === 'APPROVED' ? (
                      <span className="text-gray-400 text-xs font-medium">Locked</span>
                    ) : (
                      <Link
                        href={`/partner/vouchers/edit/${reward.rewardId}`}
                        className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold text-sm hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-md hover:shadow-lg"
                      >
                        Edit
                      </Link>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {rewards.map((reward, index) => (
            <div 
              key={reward.rewardId} 
              className="group relative bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-100 hover:border-blue-200 hover:-translate-y-1"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              {/* Gradient Header */}
              <div className="relative bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 p-6 pb-8">
                <div className="absolute inset-0 bg-black/5"></div>
                <div className="relative flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg">
                      <span className="text-2xl">🎫</span>
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-white drop-shadow-sm">{reward.rewardName}</h2>
                      <div className="text-white/90 text-sm font-medium">{reward.discountPercentage}% OFF</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6">
                <p className="text-gray-600 mb-4 text-sm leading-relaxed line-clamp-2">{reward.rewardDescription}</p>
                
                {/* Statistics - Modern Cards */}
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="group/stat relative bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-3 border border-green-200/50 hover:border-green-300 transition-all duration-200 hover:shadow-md">
                    <div className="text-[10px] font-semibold text-green-700/70 uppercase tracking-wider mb-1">Claimed</div>
                    <div className="text-2xl font-extrabold text-green-600 leading-none">{reward.stats.claimed}</div>
                    <div className="absolute top-1 right-1 w-2 h-2 bg-green-400 rounded-full opacity-60 group-hover/stat:opacity-100 transition-opacity"></div>
                  </div>
                  
                  <div className="group/stat relative bg-gradient-to-br from-purple-50 to-violet-50 rounded-xl p-3 border border-purple-200/50 hover:border-purple-300 transition-all duration-200 hover:shadow-md">
                    <div className="text-[10px] font-semibold text-purple-700/70 uppercase tracking-wider mb-1">Redeemed</div>
                    <div className="text-2xl font-extrabold text-purple-600 leading-none">{reward.stats.redeemed}</div>
                    <div className="absolute top-1 right-1 w-2 h-2 bg-purple-400 rounded-full opacity-60 group-hover/stat:opacity-100 transition-opacity"></div>
                  </div>
                  
                  <div className="group/stat relative bg-gradient-to-br from-amber-50 to-yellow-50 rounded-xl p-3 border border-amber-200/50 hover:border-amber-300 transition-all duration-200 hover:shadow-md">
                    <div className="text-[10px] font-semibold text-amber-700/70 uppercase tracking-wider mb-1">Active</div>
                    <div className="text-2xl font-extrabold text-amber-600 leading-none">{reward.stats.active}</div>
                    <div className="absolute top-1 right-1 w-2 h-2 bg-amber-400 rounded-full opacity-60 group-hover/stat:opacity-100 transition-opacity"></div>
                  </div>
                </div>

                {/* Status Badge */}
                <div className="mb-4">
                  <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold ${
                    getVoucherStatus(reward) === 'APPROVED' ? 'bg-green-100 text-green-700 border border-green-200' :
                    getVoucherStatus(reward) === 'PENDING' ? 'bg-yellow-100 text-yellow-700 border border-yellow-200' :
                    getVoucherStatus(reward) === 'EXPIRED' ? 'bg-gray-100 text-gray-700 border border-gray-200' :
                    'bg-red-100 text-red-700 border border-red-200'
                  }`}>
                    {getVoucherStatus(reward)}
                  </span>
                </div>

                {/* Footer Info */}
                <div className="space-y-2 mb-4 text-xs text-gray-500">
                  {reward.validTo && (
                    <div className="flex items-center gap-2">
                      <span>📅</span>
                      <span>Valid until: {formatDate(reward.validTo)}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <span>🕒</span>
                    <span>Created: {formatDate(reward.createdAt)}</span>
                  </div>
                </div>

                {/* Action Button */}
                {getVoucherStatus(reward) === 'APPROVED' ? (
                  <div className="mt-4 text-center py-2 px-4 bg-gray-50 rounded-lg border border-gray-200">
                    <span className="text-gray-500 text-sm font-medium">Approved - Cannot edit</span>
                  </div>
                ) : (
                  <Link
                    href={`/partner/vouchers/edit/${reward.rewardId}`}
                    className="block mt-4 w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-3 rounded-xl font-semibold text-center hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-[1.02]"
                  >
                    Edit Voucher
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
    </>
  );
} 