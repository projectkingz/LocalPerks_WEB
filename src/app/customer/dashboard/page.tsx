'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { formatDate } from '@/lib/utils/date';
import SuspendedUserWrapper from '@/components/SuspendedUserWrapper';
import {
  Award,
  TrendingUp,
  Calendar,
  PoundSterling,
  Users,
  Star,
  ArrowRight,
  QrCode,
  History,
  Gift,
  Ticket
} from 'lucide-react';

interface PointsData {
  points: number;
  tier: string;
}

interface RecentTransaction {
  id: string;
  date: string;
  points: number;
  description: string;
  type: 'EARNED' | 'SPENT';
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'VOUCHER CANCELLED' | 'VOID';
  amount?: number;
}

interface PendingTransaction {
  id: string;
  date: string;
  points: number;
  description: string;
  amount: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'VOUCHER CANCELLED' | 'VOID';
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const [pointsData, setPointsData] = useState<PointsData>({ points: 0, tier: 'Standard' });
  const [recentTransactions, setRecentTransactions] = useState<RecentTransaction[]>([]);
  const [pendingTransactions, setPendingTransactions] = useState<PendingTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mobile, setMobile] = useState<string | null>(null);
  const [availableDiscount, setAvailableDiscount] = useState<number>(0);
  const [pointFaceValue, setPointFaceValue] = useState<number>(0.01);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log('Fetching dashboard data for user:', session?.user?.email);
        
        // Fetch points data
        const pointsResponse = await fetch('/api/points');
        if (!pointsResponse.ok) {
          console.error('Points API error:', pointsResponse.status, pointsResponse.statusText);
          throw new Error('Failed to fetch points data');
        }
        const pointsData = await pointsResponse.json();
        console.log('Points data received:', pointsData);
        setPointsData(pointsData);

        // Fetch points configuration to get face value
        const configResponse = await fetch('/api/points/config');
        if (configResponse.ok) {
          const configData = await configResponse.json();
          if (configData.success && configData.config) {
            setPointFaceValue(configData.config.pointFaceValue || 0.01);
            setAvailableDiscount(pointsData.points * (configData.config.pointFaceValue || 0.01));
          }
        }

        // Always fetch mobile number from profile
        let mobileNumber = null;
        if (session?.user?.email) {
          const profileRes = await fetch('/api/customer/profile');
          if (profileRes.ok) {
            const profileData = await profileRes.json();
            mobileNumber = profileData.mobile;
          }
        }
        setMobile(mobileNumber || null);

        // Fetch recent transactions
        const transactionsResponse = await fetch('/api/points/history');
        if (!transactionsResponse.ok) {
          console.error('Transactions API error:', transactionsResponse.status, transactionsResponse.statusText);
          throw new Error('Failed to fetch transaction history');
        }
        const transactionsData = await transactionsResponse.json();
        console.log('Transactions data received:', transactionsData);
        
        // Combine regular and pending transactions, sort by date
        const allTransactions = [
          ...transactionsData.transactions,
          ...(transactionsData.pendingTransactions || [])
        ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        
        setRecentTransactions(allTransactions.slice(0, 5)); // Get only the 5 most recent
        setPendingTransactions(transactionsData.pendingTransactions || []);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    if (session?.user?.email) {
      fetchData();
    }
  }, [session?.user?.email]);

  const getProgressToNextTier = () => {
    const pointsNeeded = {
      Standard: 100,
      Silver: 500,
      Gold: 1000,
      Platinum: Infinity
    };

    if (pointsData.tier === 'Platinum') {
      return { current: pointsData.points, target: pointsData.points, percentage: 100 };
    }

    const currentTierPoints = pointsData.points;
    const nextTierPoints = pointsNeeded[pointsData.tier as keyof typeof pointsNeeded];
    const percentage = Math.min(Math.round((currentTierPoints / nextTierPoints) * 100), 100);

    return {
      current: currentTierPoints,
      target: nextTierPoints,
      percentage
    };
  };

  const progress = getProgressToNextTier();

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'Platinum': return 'bg-gradient-to-r from-purple-500 to-pink-500';
      case 'Gold': return 'bg-gradient-to-r from-yellow-400 to-orange-500';
      case 'Silver': return 'bg-gradient-to-r from-gray-400 to-gray-600';
      default: return 'bg-gradient-to-r from-blue-500 to-blue-600';
    }
  };

  return (
    <SuspendedUserWrapper>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customer Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">Welcome back, {session?.user?.name}!</p>
          {mobile && (
            <p className="mt-1 text-sm text-gray-500">Mobile: {mobile}</p>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Points</p>
                <p className="text-2xl font-semibold text-gray-900">{pointsData.points.toLocaleString()}</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-xl">
                <Award className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <div className="mt-4">
              <div className="flex items-center">
                <Calendar className="h-4 w-4 text-gray-500 mr-1" />
                <span className="text-sm text-gray-500">Current balance</span>
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
                <p className="text-sm font-medium text-gray-600">Current Tier</p>
                <p className="text-2xl font-semibold text-gray-900">{pointsData.tier}</p>
              </div>
              <div className="p-3 bg-purple-50 rounded-xl">
                <Star className="h-6 w-6 text-purple-600" />
              </div>
            </div>
            <div className="mt-4">
              <div className="flex items-center">
                <TrendingUp className="h-4 w-4 text-gray-500 mr-1" />
                <span className="text-sm text-gray-500">Membership level</span>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Progress to Next</p>
                <p className="text-2xl font-semibold text-gray-900">{progress.percentage}%</p>
              </div>
              <div className="p-3 bg-green-50 rounded-xl">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <div className="mt-4">
              <div className="flex items-center">
                <span className="text-sm text-gray-500">{progress.current}/{progress.target} points</span>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl shadow-lg p-6 text-white"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-100">Available Discounts</p>
                <p className="text-3xl font-bold text-white">£{availableDiscount.toFixed(2)}</p>
              </div>
              <div className="p-3 bg-white bg-opacity-20 rounded-xl">
                <Ticket className="h-6 w-6 text-white" />
              </div>
            </div>
            <div className="mt-4">
              <div className="flex items-center">
                <PoundSterling className="h-4 w-4 text-green-100 mr-1" />
                <span className="text-sm text-green-100">
                  Redeemable discount value
                </span>
              </div>
            </div>
            <Link
              href="/customer/rewards"
              className="mt-4 inline-flex items-center text-sm font-medium text-white hover:text-green-100 transition-colors"
            >
              Redeem Discounts
              <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </motion.div>
        </div>

        {/* Progress Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100"
        >
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Progress to Next Tier</h2>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="font-medium">{pointsData.tier}</span>
              <span className="text-gray-500">Next Tier</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all duration-500 ${getTierColor(pointsData.tier)}`}
                style={{ width: `${progress.percentage}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-sm text-gray-600">
              <span>{progress.current} points earned</span>
              <span>{progress.target} points needed</span>
            </div>
          </div>
        </motion.div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100"
          >
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="space-y-3">
              <Link
                href="/customer/scan"
                className="flex items-center justify-between p-4 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors duration-200 group"
              >
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg mr-3">
                    <QrCode className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Scan Receipt</p>
                    <p className="text-sm text-gray-500">Earn points from purchases</p>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-blue-600 transition-colors duration-200" />
              </Link>
              
              <Link
                href="/customer/transactions"
                className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors duration-200 group"
              >
                <div className="flex items-center">
                  <div className="p-2 bg-gray-100 rounded-lg mr-3">
                    <History className="h-5 w-5 text-gray-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">View Points History</p>
                    <p className="text-sm text-gray-500">See all your transactions</p>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-gray-600 transition-colors duration-200" />
              </Link>

              <Link
                href="/customer/rewards"
                className="flex items-center justify-between p-4 bg-green-50 rounded-xl hover:bg-green-100 transition-colors duration-200 group"
              >
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg mr-3">
                    <Award className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Browse Rewards</p>
                    <p className="text-sm text-gray-500">Redeem your points</p>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-green-600 transition-colors duration-200" />
              </Link>

              <Link
                href="/customer/voucher"
                className="flex items-center justify-between p-4 bg-purple-50 rounded-xl hover:bg-purple-100 transition-colors duration-200 group"
              >
                <div className="flex items-center">
                  <div className="p-2 bg-purple-100 rounded-lg mr-3">
                    <Gift className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">My Vouchers</p>
                    <p className="text-sm text-gray-500">View your redeemed rewards</p>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-purple-600 transition-colors duration-200" />
              </Link>
            </div>
          </motion.div>

          {/* Recent Activity */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100"
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
              <Link
                href="/customer/transactions"
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                View All
              </Link>
            </div>
            
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
                <span className="ml-2 text-gray-500">Loading activity...</span>
              </div>
            ) : error ? (
              <div className="text-center py-8">
                <p className="text-red-500">{error}</p>
              </div>
            ) : recentTransactions.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <History className="h-8 w-8 text-gray-400" />
                </div>
                <p className="text-gray-500">No recent activity</p>
                <p className="text-sm text-gray-400 mt-1">Start earning points by scanning receipts!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentTransactions.map((transaction, index) => (
                  <motion.div
                    key={transaction.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 * index }}
                    className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0"
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-2 h-2 rounded-full ${
                        transaction.type === 'EARNED' ? 'bg-green-500' : 'bg-red-500'
                      }`}></div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{transaction.description}</p>
                        <div className="flex items-center space-x-2">
                          <p className="text-xs text-gray-500">{formatDate(transaction.date)}</p>
                          {transaction.status && (
                            <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${
                              transaction.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                              transaction.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                              transaction.status === 'VOUCHER CANCELLED' ? 'bg-orange-100 text-orange-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {transaction.status}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-medium ${
                        transaction.type === 'EARNED' || transaction.status === 'VOID'
                          ? 'text-green-600'
                          : transaction.type === 'SPENT'
                          ? 'text-red-600'
                          : ''
                      }`}>
                        {transaction.points} points
                      </p>
                      {transaction.status === 'PENDING' && (
                        <p className="text-xs text-yellow-600">Awaiting approval</p>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </SuspendedUserWrapper>
  );
} 