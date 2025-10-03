'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import { 
  Gift, 
  Users, 
  Award,
  Calendar,
  Filter,
  Search,
  RefreshCw,
  TrendingUp,
  CheckCircle,
  Clock,
  XCircle
} from 'lucide-react';

interface Voucher {
  id: string;
  code: string;
  customerId: string;
  rewardId: string;
  status: string;
  usedAt?: string;
  expiresAt?: string;
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
  redemption: {
    id: string;
    points: number;
    createdAt: string;
  };
}

export default function AdminVouchersPage() {
  const { data: session } = useSession();
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCustomer, setFilterCustomer] = useState('');

  useEffect(() => {
    fetchVouchers();
  }, []);

  const fetchVouchers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/admin/vouchers');
      
      if (!response.ok) {
        throw new Error('Failed to fetch vouchers');
      }
      
      const data = await response.json();
      setVouchers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const getFilteredVouchers = () => {
    return vouchers.filter(voucher => {
      const matchesSearch = 
        voucher.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        voucher.customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        voucher.reward.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        voucher.code.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = filterStatus === 'all' || voucher.status === filterStatus;
      
      const matchesCustomer = !filterCustomer || 
        voucher.customer.name.toLowerCase().includes(filterCustomer.toLowerCase()) ||
        voucher.customer.email.toLowerCase().includes(filterCustomer.toLowerCase());
      
      return matchesSearch && matchesStatus && matchesCustomer;
    });
  };

  const getStats = () => {
    const totalVouchers = vouchers.length;
    const activeVouchers = vouchers.filter(v => v.status === 'active').length;
    const usedVouchers = vouchers.filter(v => v.status === 'used').length;
    const expiredVouchers = vouchers.filter(v => v.status === 'expired').length;
    const totalPointsIssued = vouchers.reduce((sum, v) => sum + v.redemption.points, 0);

    return {
      totalVouchers,
      activeVouchers,
      usedVouchers,
      expiredVouchers,
      totalPointsIssued
    };
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <Clock className="h-4 w-4 text-green-600" />;
      case 'used':
        return <CheckCircle className="h-4 w-4 text-blue-600" />;
      case 'expired':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'used':
        return 'bg-blue-100 text-blue-800';
      case 'expired':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const stats = getStats();
  const filteredVouchers = getFilteredVouchers();

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
          <h1 className="text-2xl font-bold text-gray-900">Vouchers Management</h1>
          <p className="mt-1 text-sm text-gray-500">
            View and manage all vouchers across the platform
          </p>
        </div>
        <button
          onClick={fetchVouchers}
          className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Vouchers</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.totalVouchers}</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-xl">
              <Gift className="h-6 w-6 text-blue-600" />
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
              <p className="text-sm font-medium text-gray-600">Active</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.activeVouchers}</p>
            </div>
            <div className="p-3 bg-green-50 rounded-xl">
              <Clock className="h-6 w-6 text-green-600" />
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
              <p className="text-sm font-medium text-gray-600">Used</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.usedVouchers}</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-xl">
              <CheckCircle className="h-6 w-6 text-blue-600" />
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
              <p className="text-sm font-medium text-gray-600">Expired</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.expiredVouchers}</p>
            </div>
            <div className="p-3 bg-red-50 rounded-xl">
              <XCircle className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Points Issued</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.totalPointsIssued.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-purple-50 rounded-xl">
              <TrendingUp className="h-6 w-6 text-purple-600" />
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
                placeholder="Search vouchers, customers, rewards..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 w-full border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="used">Used</option>
              <option value="expired">Expired</option>
            </select>
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
        </div>
      </div>

      {/* Vouchers Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto max-w-full">
          <div className="inline-block min-w-full align-middle">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-48">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-48">
                    Reward
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                    Voucher Code
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                    Points
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-28">
                    Expires
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                    Used
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredVouchers.map((voucher) => (
                  <tr key={voucher.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900 break-words">{voucher.customer.name}</div>
                        <div className="text-sm text-gray-500 break-words">{voucher.customer.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900 break-words">{voucher.reward.name}</div>
                        <div className="text-sm text-gray-500 break-words line-clamp-2">{voucher.reward.description}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <code className="text-sm bg-gray-100 px-2 py-1 rounded font-mono break-all">
                        {voucher.code}
                      </code>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {voucher.redemption.points.toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(voucher.status)}`}>
                        {getStatusIcon(voucher.status)}
                        <span className="ml-1">{voucher.status}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(voucher.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {voucher.expiresAt ? new Date(voucher.expiresAt).toLocaleDateString() : 'No expiry'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {voucher.usedAt ? new Date(voucher.usedAt).toLocaleDateString() : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {filteredVouchers.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500">No vouchers found</p>
          </div>
        )}
      </div>
    </div>
  );
} 