'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import { 
  Gift, 
  Award, 
  Users, 
  TrendingUp, 
  Calendar,
  Filter,
  Search,
  Eye,
  Download,
  RefreshCw,
  Plus,
  Edit,
  X,
  Save,
  Trash2
} from 'lucide-react';

interface Reward {
  id: string;
  name: string;
  description: string;
  points: number;
  createdAt: string;
  approvalStatus: string;
  approvedAt?: string;
  approvedBy?: string;
  rejectionReason?: string;
  tenant?: {
    id: string;
    name: string;
  };
  redemptions: Redemption[];
}

interface Redemption {
  id: string;
  rewardId: string;
  customerId: string;
  points: number;
  createdAt: string;
  customer: Customer;
  reward: Reward;
}

interface Customer {
  id: string;
  name: string;
  email: string;
  points: number;
  tenantId: string;
  createdAt: string;
  transactions: Transaction[];
}

interface Transaction {
  id: string;
  amount: number;
  points: number;
  type: string;
  status: string;
  createdAt: string;
  tenantId: string;
}

interface Voucher {
  id: string;
  code: string;
  customerId: string;
  rewardId: string;
  status: string;
  usedAt?: string;
  expiresAt?: string;
  createdAt: string;
  customer: Customer;
  reward: Reward;
  redemption: {
    id: string;
    points: number;
    createdAt: string;
  };
}

export default function AdminRewardsDashboard() {
  const { data: session } = useSession();
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'rewards' | 'redemptions' | 'vouchers' | 'customers'>('rewards');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  
  // Edit form state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingReward, setEditingReward] = useState<Partial<Reward> | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const isSuperAdmin = session?.user?.role === 'SUPER_ADMIN';

  const canDeleteReward = (reward: Reward) => {
    // Only SUPER_ADMIN can delete rewards
    if (!isSuperAdmin) return false;
    // Cannot delete rewards with existing redemptions (check if redemptions array exists and has length > 0)
    const redemptionCount = Array.isArray(reward.redemptions) ? reward.redemptions.length : 0;
    if (redemptionCount > 0) return false;
    return true;
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [rewardsRes, redemptionsRes, vouchersRes, customersRes] = await Promise.all([
        fetch('/api/admin/rewards'),
        fetch('/api/admin/redemptions'),
        fetch('/api/admin/vouchers'),
        fetch('/api/admin/customers')
      ]);

      if (rewardsRes.ok) setRewards(await rewardsRes.json());
      if (redemptionsRes.ok) setRedemptions(await redemptionsRes.json());
      if (vouchersRes.ok) setVouchers(await vouchersRes.json());
      if (customersRes.ok) setCustomers(await customersRes.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleAddReward = () => {
    setEditingReward({
      name: '',
      description: '',
      points: 0,
      createdAt: new Date().toISOString().split('T')[0]
    });
    setShowEditModal(true);
    setEditError(null);
  };

  const handleEditReward = (reward: Reward) => {
    setEditingReward({
      ...reward,
      createdAt: new Date(reward.createdAt).toISOString().split('T')[0]
    });
    setShowEditModal(true);
    setEditError(null);
  };

  const handleSaveReward = async () => {
    if (!editingReward?.name || !editingReward?.description || editingReward?.points === undefined) {
      setEditError('Please fill in all required fields');
      return;
    }

    try {
      setEditLoading(true);
      setEditError(null);

      const url = editingReward.id 
        ? `/api/admin/rewards/${editingReward.id}`
        : '/api/admin/rewards';
      
      const method = editingReward.id ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editingReward.name,
          description: editingReward.description,
          points: parseInt(editingReward.points.toString()),
          createdAt: editingReward.createdAt
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save reward');
      }

      const savedReward = await response.json();

      // Update local state
      if (editingReward.id) {
        setRewards(rewards.map(r => r.id === editingReward.id ? savedReward : r));
      } else {
        setRewards([...rewards, savedReward]);
      }

      setShowEditModal(false);
      setEditingReward(null);
    } catch (err) {
      setEditError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setEditLoading(false);
    }
  };

  const handleDeleteReward = async (rewardId: string) => {
    if (!confirm('Are you sure you want to delete this reward? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/rewards/${rewardId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete reward');
      }

      setRewards(rewards.filter(r => r.id !== rewardId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const handleApproveReward = async (rewardId: string) => {
    try {
      const response = await fetch('/api/admin/rewards', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rewardId,
          action: 'approve'
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to approve reward');
      }

      const result = await response.json();
      
      // Update the reward in the local state
      setRewards(rewards.map(r => 
        r.id === rewardId 
          ? { ...r, approvalStatus: 'APPROVED', approvedAt: new Date().toISOString(), approvedBy: result.approvedBy }
          : r
      ));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const handleRejectReward = async (rewardId: string) => {
    const rejectionReason = prompt('Please provide a reason for rejecting this reward:');
    if (!rejectionReason) {
      return;
    }

    try {
      const response = await fetch('/api/admin/rewards', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rewardId,
          action: 'reject',
          rejectionReason
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to reject reward');
      }

      const result = await response.json();
      
      // Update the reward in the local state
      setRewards(rewards.map(r => 
        r.id === rewardId 
          ? { ...r, approvalStatus: 'REJECTED', rejectionReason, approvedAt: new Date().toISOString(), approvedBy: result.approvedBy }
          : r
      ));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const getFilteredData = () => {
    let data: any[] = [];
    
    switch (activeTab) {
      case 'rewards':
        data = rewards;
        break;
      case 'redemptions':
        data = redemptions;
        break;
      case 'vouchers':
        data = vouchers;
        break;
      case 'customers':
        data = customers;
        break;
    }

    // Apply search filter
    if (searchTerm) {
      data = data.filter(item => {
        if (activeTab === 'rewards') {
          return item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                 item.description?.toLowerCase().includes(searchTerm.toLowerCase());
        } else if (activeTab === 'redemptions' || activeTab === 'vouchers') {
          return item.customer?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                 item.customer?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                 item.reward?.name?.toLowerCase().includes(searchTerm.toLowerCase());
        } else if (activeTab === 'customers') {
          return item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                 item.email?.toLowerCase().includes(searchTerm.toLowerCase());
        }
        return true;
      });
    }

    // Apply status filter
    if (filterStatus !== 'all') {
      data = data.filter(item => {
        if (activeTab === 'vouchers') {
          return item.status === filterStatus;
        }
        return true;
      });
    }

    return data;
  };

  const getStats = () => {
    const totalRewards = rewards.length;
    const totalRedemptions = redemptions.length;
    const totalVouchers = vouchers.length;
    const totalCustomers = customers.length;
    const activeVouchers = vouchers.filter(v => v.status === 'active').length;
    const totalPointsIssued = redemptions.reduce((sum, r) => sum + r.points, 0);

    return {
      totalRewards,
      totalRedemptions,
      totalVouchers,
      totalCustomers,
      activeVouchers,
      totalPointsIssued
    };
  };

  const stats = getStats();
  const filteredData = getFilteredData();

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
          <h1 className="text-2xl font-bold text-gray-900">Rewards Management</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage rewards, redemptions, vouchers, and customer data
          </p>
        </div>
        <div className="flex gap-2">
          {activeTab === 'rewards' && (
            <button
              onClick={handleAddReward}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Reward
            </button>
          )}
          <button
            onClick={fetchData}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </button>
        </div>
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
              <p className="text-sm font-medium text-gray-600">Total Rewards</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.totalRewards}</p>
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
              <p className="text-sm font-medium text-gray-600">Total Redemptions</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.totalRedemptions}</p>
            </div>
            <div className="p-3 bg-green-50 rounded-xl">
              <Award className="h-6 w-6 text-green-600" />
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
              <p className="text-sm font-medium text-gray-600">Active Vouchers</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.activeVouchers}</p>
            </div>
            <div className="p-3 bg-purple-50 rounded-xl">
              <TrendingUp className="h-6 w-6 text-purple-600" />
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
              <p className="text-sm font-medium text-gray-600">Total Customers</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.totalCustomers}</p>
            </div>
            <div className="p-3 bg-orange-50 rounded-xl">
              <Users className="h-6 w-6 text-orange-600" />
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
            <div className="p-3 bg-yellow-50 rounded-xl">
              <TrendingUp className="h-6 w-6 text-yellow-600" />
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

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            {[
              { id: 'rewards', label: 'Rewards', count: stats.totalRewards },
              { id: 'redemptions', label: 'Redemptions', count: stats.totalRedemptions },
              { id: 'vouchers', label: 'Vouchers', count: stats.totalVouchers },
              { id: 'customers', label: 'Customers', count: stats.totalCustomers }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
                <span className="ml-2 bg-gray-100 text-gray-900 py-0.5 px-2.5 rounded-full text-xs">
                  {tab.count}
                </span>
              </button>
            ))}
          </nav>
        </div>

        {/* Filters */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder={`Search ${activeTab}...`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            {activeTab === 'vouchers' && (
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-gray-400" />
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="used">Used</option>
                  <option value="expired">Expired</option>
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="overflow-x-auto">
          {activeTab === 'rewards' && (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reward
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Points
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Redemptions
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredData.map((reward) => (
                  <tr key={reward.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{reward.name}</div>
                        <div className="text-sm text-gray-500">{reward.description}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {reward.points.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {reward.redemptions?.length || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(reward.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        reward.approvalStatus === 'APPROVED' 
                          ? 'bg-green-100 text-green-800' 
                          : reward.approvalStatus === 'REJECTED'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {reward.approvalStatus}
                      </span>
                      {reward.rejectionReason && (
                        <div className="text-xs text-red-600 mt-1">
                          {reward.rejectionReason}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        {reward.approvalStatus === 'PENDING' && (
                          <>
                            <button
                              onClick={() => handleApproveReward(reward.id)}
                              className="text-green-600 hover:text-green-900"
                              title="Approve reward"
                            >
                              <Award className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleRejectReward(reward.id)}
                              className="text-red-600 hover:text-red-900"
                              title="Reject reward"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => handleEditReward(reward)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        {canDeleteReward(reward) ? (
                          <button
                            onClick={() => handleDeleteReward(reward.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        ) : (
                          <button
                            disabled
                            className="text-gray-400 cursor-not-allowed"
                            title="Only Super Admins can delete rewards"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {activeTab === 'redemptions' && (
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
                    Redeemed
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredData.map((redemption) => (
                  <tr key={redemption.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{redemption.customer.name}</div>
                        <div className="text-sm text-gray-500">{redemption.customer.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{redemption.reward.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {redemption.points.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(redemption.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {activeTab === 'vouchers' && (
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
                    Code
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Points
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Expires
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Used
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredData.map((voucher) => (
                  <tr key={voucher.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{voucher.customer.name}</div>
                        <div className="text-sm text-gray-500">{voucher.customer.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{voucher.reward.name}</div>
                      <div className="text-sm text-gray-500">{voucher.reward.description}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <code className="text-sm bg-gray-100 px-2 py-1 rounded font-mono">{voucher.code}</code>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {voucher.redemption.points.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        voucher.status === 'active' ? 'bg-green-100 text-green-800' :
                        voucher.status === 'used' ? 'bg-blue-100 text-blue-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {voucher.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {voucher.expiresAt ? new Date(voucher.expiresAt).toLocaleDateString() : 'No expiry'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {voucher.usedAt ? new Date(voucher.usedAt).toLocaleDateString() : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {activeTab === 'customers' && (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Current Points
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Transactions
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Member Since
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredData.map((customer) => (
                  <tr key={customer.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{customer.name}</div>
                        <div className="text-sm text-gray-500">{customer.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {customer.points.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {customer.transactions?.length || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(customer.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {filteredData.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500">No {activeTab} found</p>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  {editingReward?.id ? 'Edit Reward' : 'Add New Reward'}
                </h3>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {editError && (
                <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-3">
                  <p className="text-red-800 text-sm">{editError}</p>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name *
                  </label>
                  <input
                    type="text"
                    value={editingReward?.name || ''}
                    onChange={(e) => setEditingReward({ ...editingReward, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Reward name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description *
                  </label>
                  <textarea
                    value={editingReward?.description || ''}
                    onChange={(e) => setEditingReward({ ...editingReward, description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Reward description"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Points Required *
                  </label>
                  <input
                    type="number"
                    value={editingReward?.points || 0}
                    onChange={(e) => setEditingReward({ ...editingReward, points: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0"
                    min="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Created Date
                  </label>
                  <input
                    type="date"
                    value={editingReward?.createdAt || ''}
                    onChange={(e) => setEditingReward({ ...editingReward, createdAt: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveReward}
                  disabled={editLoading}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                >
                  {editLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      {editingReward?.id ? 'Update' : 'Create'}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 