'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useSession } from 'next-auth/react';
import {
  BarChart3,
  Users,
  Award,
  TrendingUp,
  Calendar,
  PoundSterling,
  CreditCard,
  Activity
} from 'lucide-react';
import { formatDate } from '@/lib/utils/date';
import ScrollControls from '@/components/ScrollControls';

type RecentActivity = {
  id: string;
  description: string | null;
  points: number;
  createdAt: string;
  user?: { name?: string | null; email?: string | null };
};

type PopularReward = {
  reward: {
    id: string;
    name: string;
    description: string;
    points: number;
    createdAt: string;
  } | null;
  pointsIssued: number;
  numberRedeemed: number;
};

export default function PartnerDashboard() {
  const { data: session } = useSession();
  const [dateRange, setDateRange] = useState('week');
  const [popularPeriod, setPopularPeriod] = useState('month');
  const [mobile, setMobile] = useState<string | null>(null);

  // Fetch stats from API
  const [stats, setStats] = useState({
    totalTransactions: 0,
    pointsIssued: 0,
    averageTransaction: 0,
    pointsIssueCharge: 0,
  });
  const [recentPointsIssued, setRecentPointsIssued] = useState<RecentActivity[]>([]);
  const [recentPointsRedeemed, setRecentPointsRedeemed] = useState<RecentActivity[]>([]);
  const [popularRewards, setPopularRewards] = useState<PopularReward[]>([]);
  const [popularLoading, setPopularLoading] = useState(false);
  const [popularError, setPopularError] = useState<string | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState<string | null>(null);

  useEffect(() => {
    setStatsLoading(true);
    setStatsError(null);
    
    // Convert dateRange to days
    const periodMap: Record<string, number> = {
      week: 7,
      month: 30,
      quarter: 90,
      halfyear: 180,
      year: 365,
    };
    const periodDays = periodMap[dateRange] || 7;
    
    fetch(`/api/partner/stats?period=${periodDays}`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch partner stats');
        return res.json();
      })
      .then(data => {
        setStats({
          totalTransactions: data.totalTransactions || 0,
          pointsIssued: data.pointsIssued || 0,
          averageTransaction: data.averageTransaction || 0,
          pointsIssueCharge: data.pointsIssueCharge || 0,
        });
        setStatsLoading(false);
      })
      .catch((err) => {
        setStatsError(err.message || 'Error loading partner stats');
        setStatsLoading(false);
      });
    
    // Also fetch recent activity
    fetch('/api/dashboard-stats')
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data) {
          setRecentPointsIssued(data.recentPointsIssued || []);
          setRecentPointsRedeemed(data.recentPointsRedeemed || []);
        }
      })
      .catch((err) => {
        console.error('Error loading activity:', err);
      });
  }, [dateRange]);

  useEffect(() => {
    setPopularLoading(true);
    setPopularError(null);
    fetch(`/api/dashboard-stats?period=${popularPeriod}`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch popular rewards');
        return res.json();
      })
      .then(data => {
        setPopularRewards(data.popularRewards || []);
        setPopularLoading(false);
      })
      .catch((err) => {
        setPopularError(err.message || 'Error loading popular rewards');
        setPopularLoading(false);
      });
  }, [popularPeriod]);

  useEffect(() => {
    // Always fetch mobile number from profile
    let ignore = false;
    async function fetchMobile() {
      let mobileNumber = null;
      if (session?.user?.email) {
        const profileRes = await fetch('/api/partner/profile');
        if (profileRes.ok) {
          const profileData = await profileRes.json();
          mobileNumber = profileData.mobile;
        }
      }
      if (!ignore) setMobile(mobileNumber || null);
    }
    fetchMobile();
    return () => { ignore = true; };
  }, [session?.user?.email]);

  return (
    <>
      <ScrollControls />
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Partner Dashboard</h1>
          {mobile && (
            <p className="text-sm text-gray-500">Mobile: {mobile}</p>
          )}
          <div className="flex gap-2">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="rounded-lg border-gray-300 text-gray-700 text-sm focus:ring-blue-500 focus:border-blue-500 px-4 py-2"
            >
              <option value="week">Last 7 days</option>
              <option value="month">Last 30 days</option>
              <option value="quarter">Last 3 months</option>
              <option value="halfyear">Last 6 months</option>
              <option value="year">Last 12 months</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {statsLoading ? (
            <>
              {[1, 2, 3, 4].map((i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100"
                >
                  <div className="animate-pulse">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                        <div className="h-8 bg-gray-200 rounded w-16"></div>
                      </div>
                      <div className="p-3 bg-gray-200 rounded-xl w-12 h-12"></div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </>
          ) : statsError ? (
            <div className="col-span-full text-center py-8">
              <p className="text-red-500">{statsError}</p>
            </div>
          ) : (
            <>
              {/* Total Transactions */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Transactions</p>
                    <p className="text-2xl font-semibold text-gray-900">{stats.totalTransactions}</p>
                  </div>
                  <div className="p-3 bg-blue-50 rounded-xl">
                    <Activity className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Points Issued</p>
                    <p className="text-2xl font-semibold text-gray-900">{(stats?.pointsIssued || 0).toLocaleString()}</p>
                  </div>
                  <div className="p-3 bg-purple-50 rounded-xl">
                    <Award className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
                <div className="mt-4">
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 text-gray-500 mr-1" />
                    <span className="text-sm text-gray-500">Last updated today</span>
                  </div>
                </div>
              </motion.div>

              {/* Average Transaction */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Average Transaction</p>
                    <p className="text-2xl font-semibold text-gray-900">£{stats.averageTransaction.toFixed(2)}</p>
                  </div>
                  <div className="p-3 bg-green-50 rounded-xl">
                    <PoundSterling className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </motion.div>

              {/* Points Issue Charge */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Points Issue Charge</p>
                    <p className="text-2xl font-semibold text-gray-900">£{stats.pointsIssueCharge.toFixed(2)}</p>
                  </div>
                  <div className="p-3 bg-orange-50 rounded-xl">
                    <CreditCard className="h-6 w-6 text-orange-600" />
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </div>

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100"
          >
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
            <div className="space-y-4">
              {recentPointsIssued.length === 0 && recentPointsRedeemed.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>No recent activity</p>
                </div>
              ) : (
                <>
                  {recentPointsIssued.map((item) => (
                    <div key={item.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">Points Issued</p>
                          <p className="text-sm text-gray-500">
                            {item.description || (item.user?.name || item.user?.email || 'Unknown user')}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-green-600">+{item.points.toLocaleString()} points</p>
                        <p className="text-xs text-gray-500">
                          {formatDate(item.createdAt)}
                        </p>
                      </div>
                    </div>
                  ))}
                  {recentPointsRedeemed.map((item) => (
                    <div key={item.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">Reward Redeemed</p>
                          <p className="text-sm text-gray-500">
                            {item.description || (item.user?.name || item.user?.email || 'Unknown user')}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-red-600">-{item.points.toLocaleString()} points</p>
                        <p className="text-xs text-gray-500">
                          {formatDate(item.createdAt)}
                        </p>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100"
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Popular Rewards</h2>
              <select
                value={popularPeriod}
                onChange={e => setPopularPeriod(e.target.value)}
                className="rounded-lg border-gray-300 text-gray-700 text-sm focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="quarter">This Quarter</option>
                <option value="halfyear">This Half Year</option>
                <option value="year">This Year</option>
              </select>
            </div>
            <div className="space-y-4">
              {popularLoading && (
                <div className="flex items-center justify-center py-8"><span className="animate-spin mr-2">🔄</span>Loading popular rewards...</div>
              )}
              {popularError && (
                <div className="text-red-500 text-sm">{popularError}</div>
              )}
              {!popularLoading && !popularError && popularRewards.length === 0 && (
                <div className="text-gray-500 text-sm">No data for this period.</div>
              )}
              {!popularLoading && !popularError && popularRewards.map((item) => (
                <div key={item.reward?.id || Math.random()} className="flex items-center justify-between py-2 border-b border-gray-100">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{item.reward?.name || 'Unknown Reward'}</p>
                    <p className="text-sm text-gray-500">{item.reward?.points} points</p>
                    {item.reward?.description && <p className="text-xs text-gray-400">{item.reward.description}</p>}
                    {item.reward?.createdAt && <p className="text-xs text-gray-400">Created: {formatDate(item.reward.createdAt)}</p>}
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-green-600">{item.numberRedeemed} redeemed</p>
                    <p className="text-sm text-gray-500">{item.pointsIssued} points issued</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
    </>
  );
} 