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
  XCircle,
  Edit,
  Save,
  X
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
    discountPercentage: number;
    validFrom?: string | null;
    validTo?: string | null;
    createdAt: string;
    tenantId: string | null;
    tenant?: {
      id: string;
      name: string;
      partnerUserId: string | null;
      partnerUser?: {
        id: string;
        name: string;
        email: string;
      } | null;
    } | null;
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
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingVoucher, setEditingVoucher] = useState<Voucher | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

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
      const partnerBusinessName = voucher.reward?.tenant?.name || '';
      const matchesSearch = 
        voucher.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        voucher.customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        voucher.reward.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        voucher.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        partnerBusinessName.toLowerCase().includes(searchTerm.toLowerCase());
      
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

  const handleEditVoucher = (voucher: Voucher) => {
    setEditingVoucher(voucher);
    setShowEditModal(true);
    setEditError(null);
  };

  const handleSaveVoucher = async () => {
    if (!editingVoucher) return;

    if (!editingVoucher.code || !editingVoucher.status) {
      setEditError('Code and status are required');
      return;
    }

    try {
      setEditLoading(true);
      setEditError(null);

      const response = await fetch(`/api/admin/vouchers/${editingVoucher.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: editingVoucher.code,
          status: editingVoucher.status,
          expiresAt: editingVoucher.expiresAt || null,
          usedAt: editingVoucher.usedAt || null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update voucher');
      }

      const updatedVoucher = await response.json();

      // Update local state
      setVouchers(vouchers.map(v => v.id === updatedVoucher.id ? updatedVoucher : v));

      setShowEditModal(false);
      setEditingVoucher(null);
    } catch (err) {
      setEditError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setEditLoading(false);
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
                placeholder="Search vouchers, customers, rewards, partners..."
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
                    Partner/Business
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-48">
                    Reward
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-28">
                    Reward Valid From
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-28">
                    Reward Valid To
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                    Actions
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
                        <div className="text-sm font-medium text-gray-900 break-words">
                          {voucher.reward?.tenant?.name || 'System Default'}
                        </div>
                        {voucher.reward?.tenant?.partnerUser ? (
                          <>
                            <div className="text-sm text-gray-500 break-words font-semibold">
                              Partner: {voucher.reward.tenant.partnerUser.name}
                            </div>
                            {voucher.reward.tenant.partnerUser.email && (
                              <div className="text-xs text-gray-400 break-words">
                                {voucher.reward.tenant.partnerUser.email}
                              </div>
                            )}
                          </>
                        ) : voucher.reward?.tenant?.partnerUserId ? (
                          <div className="text-xs text-gray-400 break-words italic">
                            Partner info not available
                          </div>
                        ) : null}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900 break-words">{voucher.reward.name}</div>
                        <div className="text-sm text-gray-500 break-words line-clamp-2">{voucher.reward.description}</div>
                        <div className="text-xs text-gray-400 mt-1">
                          Discount: {voucher.reward.discountPercentage?.toFixed(1) || 0}%
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {voucher.reward.validFrom ? new Date(voucher.reward.validFrom).toLocaleDateString() : 'Not set'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {voucher.reward.validTo ? new Date(voucher.reward.validTo).toLocaleDateString() : 'Not set'}
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleEditVoucher(voucher)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Edit voucher"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
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

      {/* Edit Modal */}
      {showEditModal && editingVoucher && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-start justify-center pt-8 pb-8 px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="relative max-w-2xl w-full space-y-10 bg-white rounded-3xl shadow-2xl p-10 md:p-12 border-2 border-gray-100/50 backdrop-blur-sm my-8"
          >
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-5xl md:text-6xl font-extrabold text-gray-900 tracking-tight">
                Edit Voucher
              </h3>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingVoucher(null);
                  setEditError(null);
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-8 w-8" />
              </button>
            </div>

            {editError && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="rounded-2xl bg-red-50 p-5 border-2 border-red-200 shadow-md"
              >
                <p className="text-base font-semibold text-red-800">{editError}</p>
              </motion.div>
            )}

            <div className="space-y-8">
              <div className="relative group">
                <input
                  type="text"
                  value={editingVoucher.code || ''}
                  onChange={(e) => setEditingVoucher({ ...editingVoucher, code: e.target.value })}
                  required
                  className="block w-full px-8 py-8 text-2xl text-gray-900 bg-gray-50 border-2 border-gray-200 rounded-3xl appearance-none transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-blue-500/30 focus:border-blue-500 focus:bg-white peer group-hover:border-gray-300 shadow-lg hover:shadow-xl min-h-[80px]"
                  placeholder=" "
                />
                <label className="absolute text-xl font-medium text-gray-600 duration-200 transform -translate-y-4 scale-75 top-4 z-10 origin-[0] bg-white px-3 peer-focus:px-3 peer-focus:text-blue-600 peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 peer-focus:top-4 peer-focus:scale-75 peer-focus:-translate-y-4 left-3 peer-focus:bg-white group-hover:bg-white">
                  Voucher Code *
                </label>
              </div>

              <div className="relative group">
                <select
                  value={editingVoucher.status || 'active'}
                  onChange={(e) => setEditingVoucher({ ...editingVoucher, status: e.target.value })}
                  required
                  className="block w-full px-8 py-8 text-2xl text-gray-900 bg-gray-50 border-2 border-gray-200 rounded-3xl appearance-none transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-blue-500/30 focus:border-blue-500 focus:bg-white peer group-hover:border-gray-300 shadow-lg hover:shadow-xl min-h-[80px]"
                >
                  <option value="active">Active</option>
                  <option value="used">Used</option>
                  <option value="expired">Expired</option>
                </select>
                <label className="absolute text-xl font-medium text-gray-600 duration-200 transform -translate-y-4 scale-75 top-4 z-10 origin-[0] bg-white px-3 peer-focus:px-3 peer-focus:text-blue-600 left-3 peer-focus:bg-white group-hover:bg-white pointer-events-none">
                  Status *
                </label>
              </div>

              <div className="relative group">
                <input
                  type="datetime-local"
                  value={editingVoucher.expiresAt ? new Date(editingVoucher.expiresAt).toISOString().slice(0, 16) : ''}
                  onChange={(e) => setEditingVoucher({ 
                    ...editingVoucher, 
                    expiresAt: e.target.value ? new Date(e.target.value).toISOString() : null 
                  })}
                  className="block w-full px-8 py-8 text-2xl text-gray-900 bg-gray-50 border-2 border-gray-200 rounded-3xl appearance-none transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-blue-500/30 focus:border-blue-500 focus:bg-white peer group-hover:border-gray-300 shadow-lg hover:shadow-xl min-h-[80px]"
                />
                <label className="absolute text-xl font-medium text-gray-600 duration-200 transform -translate-y-4 scale-75 top-4 z-10 origin-[0] bg-white px-3 peer-focus:px-3 peer-focus:text-blue-600 peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 peer-focus:top-4 peer-focus:scale-75 peer-focus:-translate-y-4 left-3 peer-focus:bg-white group-hover:bg-white">
                  Expires At (optional)
                </label>
              </div>

              <div className="relative group">
                <input
                  type="datetime-local"
                  value={editingVoucher.usedAt ? new Date(editingVoucher.usedAt).toISOString().slice(0, 16) : ''}
                  onChange={(e) => setEditingVoucher({ 
                    ...editingVoucher, 
                    usedAt: e.target.value ? new Date(e.target.value).toISOString() : null 
                  })}
                  className="block w-full px-8 py-8 text-2xl text-gray-900 bg-gray-50 border-2 border-gray-200 rounded-3xl appearance-none transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-blue-500/30 focus:border-blue-500 focus:bg-white peer group-hover:border-gray-300 shadow-lg hover:shadow-xl min-h-[80px]"
                />
                <label className="absolute text-xl font-medium text-gray-600 duration-200 transform -translate-y-4 scale-75 top-4 z-10 origin-[0] bg-white px-3 peer-focus:px-3 peer-focus:text-blue-600 peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 peer-focus:top-4 peer-focus:scale-75 peer-focus:-translate-y-4 left-3 peer-focus:bg-white group-hover:bg-white">
                  Used At (optional)
                </label>
              </div>

              <div className="bg-gray-50 rounded-3xl p-6 border-2 border-gray-200">
                <h4 className="text-xl font-bold text-gray-900 mb-4">Voucher Information</h4>
                <div className="space-y-3 text-lg">
                  <div>
                    <span className="font-semibold text-gray-700">Customer: </span>
                    <span className="text-gray-900">{editingVoucher.customer.name} ({editingVoucher.customer.email})</span>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-700">Partner/Business Name: </span>
                    <span className="text-gray-900 font-bold">{editingVoucher.reward?.tenant?.name || 'System Default'}</span>
                  </div>
                  {editingVoucher.reward?.tenant?.partnerUser ? (
                    <div>
                      <span className="font-semibold text-gray-700">Partner Name: </span>
                      <span className="text-gray-900 font-bold">
                        {editingVoucher.reward.tenant.partnerUser.name}
                      </span>
                    </div>
                  ) : editingVoucher.reward?.tenant?.partnerUserId ? (
                    <div>
                      <span className="font-semibold text-gray-700">Partner Name: </span>
                      <span className="text-gray-500 italic">Partner information not available</span>
                    </div>
                  ) : null}
                  {editingVoucher.reward?.tenant?.partnerUser?.email && (
                    <div>
                      <span className="font-semibold text-gray-700">Partner Email: </span>
                      <span className="text-gray-900">{editingVoucher.reward.tenant.partnerUser.email}</span>
                    </div>
                  )}
                  <div>
                    <span className="font-semibold text-gray-700">Reward Name: </span>
                    <span className="text-gray-900">{editingVoucher.reward.name}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-700">Reward Description: </span>
                    <span className="text-gray-900">{editingVoucher.reward.description}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-700">Discount Percentage: </span>
                    <span className="text-gray-900">{editingVoucher.reward.discountPercentage?.toFixed(1) || 0}%</span>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-700">Reward Valid From (Partner Set): </span>
                    <span className="text-gray-900 font-bold">
                      {editingVoucher.reward.validFrom 
                        ? new Date(editingVoucher.reward.validFrom).toLocaleDateString() 
                        : 'Not set'}
                    </span>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-700">Reward Valid To (Partner Set): </span>
                    <span className="text-gray-900 font-bold">
                      {editingVoucher.reward.validTo 
                        ? new Date(editingVoucher.reward.validTo).toLocaleDateString() 
                        : 'Not set'}
                    </span>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-700">Reward Created: </span>
                    <span className="text-gray-900">{new Date(editingVoucher.reward.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-700">Points Redeemed: </span>
                    <span className="text-gray-900">{editingVoucher.redemption.points.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-700">Redemption Date: </span>
                    <span className="text-gray-900">{new Date(editingVoucher.redemption.createdAt).toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-700">Voucher Created: </span>
                    <span className="text-gray-900">{new Date(editingVoucher.createdAt).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-4 mt-10">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setShowEditModal(false);
                  setEditingVoucher(null);
                  setEditError(null);
                }}
                className="px-8 py-8 border-2 border-gray-300 text-2xl font-bold rounded-3xl text-gray-700 bg-white hover:bg-gray-50 transition-all duration-200 shadow-lg hover:shadow-xl min-h-[80px]"
              >
                Cancel
              </motion.button>
              <motion.button
                whileHover={{ scale: editLoading ? 1 : 1.02 }}
                whileTap={{ scale: editLoading ? 1 : 0.98 }}
                onClick={handleSaveVoucher}
                disabled={editLoading}
                className={`group relative w-full flex justify-center items-center py-8 px-8 border border-transparent text-2xl font-bold rounded-3xl text-white shadow-xl transition-all duration-200 min-h-[80px] ${
                  editLoading
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-offset-2 focus:ring-blue-500 hover:shadow-2xl transform hover:scale-[1.02]'
                }`}
              >
                {editLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span className="text-2xl">Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="h-6 w-6 mr-3" />
                    <span className="text-2xl">Save Changes</span>
                  </>
                )}
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
} 