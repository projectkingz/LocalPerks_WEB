'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import { 
  Award, 
  Users, 
  Gift,
  Calendar,
  Filter,
  Search,
  RefreshCw,
  TrendingUp
} from 'lucide-react';

interface Redemption {
  id: string;
  rewardId: string;
  customerId: string;
  points: number;
  createdAt: string;
  customer: {
    id: string;
    name: string;
    email: string;
    points: number;
    tenantId: string;
  };
  reward: {
    id: string;
    name: string;
    description: string;
    points: number;
  };
}

export default function AdminRedemptionsPage() {
  const { data: session } = useSession();
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCustomer, setFilterCustomer] = useState('');
  const [filterReward, setFilterReward] = useState('');

  useEffect(() => {
    fetchRedemptions();
  }, []);

  const fetchRedemptions = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/admin/redemptions');
      
      if (!response.ok) {
        throw new Error('Failed to fetch redemptions');
      }
      
      const data = await response.json();
      setRedemptions(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const getFilteredRedemptions = () => {
    return redemptions.filter(redemption => {
      const matchesSearch = 
        redemption.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        redemption.customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        redemption.reward.name.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCustomer = !filterCustomer || 
        redemption.customer.name.toLowerCase().includes(filterCustomer.toLowerCase()) ||
        redemption.customer.email.toLowerCase().includes(filterCustomer.toLowerCase());
      
      const matchesReward = !filterReward || 
        redemption.reward.name.toLowerCase().includes(filterReward.toLowerCase());
      
      return matchesSearch && matchesCustomer && matchesReward;
    });
  };

  const getStats = () => {
    const totalRedemptions = redemptions.length;
    const totalPointsRedeemed = redemptions.reduce((sum, r) => sum + r.points, 0);
    const uniqueCustomers = new Set(redemptions.map(r => r.customer.id)).size;
    const uniqueRewards = new Set(redemptions.map(r => r.reward.id)).size;

    return {
      totalRedemptions,
      totalPointsRedeemed,
      uniqueCustomers,
      uniqueRewards
    };
  };

  const stats = getStats();
  const filteredRedemptions = getFilteredRedemptions();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Redemptions Management</h1>
          <p className="mt-1 text-sm text-gray-500">
            View and manage all reward redemptions across the platform
          </p>
        </div>
        <button
          onClick={fetchRedemptions}
          className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Redemptions</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.totalRedemptions}</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-xl">
              <Award className="h-6 w-6 text-blue-600" />
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
              <p className="text-sm font-medium text-gray-600">Points Redeemed</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.totalPointsRedeemed.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-green-50 rounded-xl">
              <TrendingUp className="h-6 w-6 text-green-600" />
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
              <p className="text-sm font-medium text-gray-600">Unique Customers</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.uniqueCustomers}</p>
            </div>
            <div className="p-3 bg-purple-50 rounded-xl">
              <Users className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Unique Rewards</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.uniqueRewards}</p>
            </div>
            <div className="p-3 bg-orange-50 rounded-xl">
              <Gift className="h-6 w-6 text-orange-600" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search customers, rewards..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filter by Customer
            </label>
            <input
              type="text"
              placeholder="Customer name or email"
              value={filterCustomer}
              onChange={(e) => setFilterCustomer(e.target.value)}
              className="px-4 py-2 w-full border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filter by Reward
            </label>
            <input
              type="text"
              placeholder="Reward name"
              value={filterReward}
              onChange={(e) => setFilterReward(e.target.value)}
              className="px-4 py-2 w-full border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Redemptions Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Reward
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Points
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Redeemed Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer Points
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredRedemptions.map((redemption) => (
                <tr key={redemption.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{redemption.customer.name}</div>
                      <div className="text-sm text-gray-500">{redemption.customer.email}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{redemption.reward.name}</div>
                      <div className="text-sm text-gray-500">{redemption.reward.description}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {redemption.points.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(redemption.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {redemption.customer.points.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredRedemptions.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500">No redemptions found</p>
          </div>
        )}
      </div>
    </div>
  );
} 