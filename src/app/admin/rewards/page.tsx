'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import { calculatePointsForDiscount } from '@/lib/pointsCalculation';
import { defaultPointsConfig } from '@/lib/pointsConfig';
import { 
  Gift, 
  Award, 
  Search,
  RefreshCw,
  Plus,
  Edit,
  X,
  Save,
  Trash2,
  Filter,
  CheckCircle,
  Clock,
  XCircle,
  Ban,
  TrendingUp,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface Reward {
  id: string;
  name: string;
  description: string;
  discountPercentage: number;
  validFrom?: string | null;
  validTo?: string | null;
  createdAt: string;
  approvalStatus: string;
  approvedAt?: string;
  approvedBy?: string;
  rejectionReason?: string;
  maxRedemptionsPerCustomer?: number | null;
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
  voucher?: { id: string; status: string } | null;
}

interface Customer {
  id: string;
  name: string;
  email: string;
}

export default function AdminRewardsDashboard() {
  const { data: session } = useSession();
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<'rewards' | 'redemptions'>('rewards');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  
  // Edit form state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingReward, setEditingReward] = useState<Partial<Reward> | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('fixed');
  const [pointsConfig, setPointsConfig] = useState<any>(null);
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedReward, setSelectedReward] = useState<Reward | null>(null);
  const [showRewardDetailsModal, setShowRewardDetailsModal] = useState(false);

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
    // Use default points config for calculating points equivalent
    setPointsConfig(defaultPointsConfig);
  }, []);

  // Reset to page 1 when filters or rows per page change
  useEffect(() => {
    setPage(1);
  }, [view, searchTerm, filterStatus, rowsPerPage]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [rewardsRes, redemptionsRes] = await Promise.all([
        fetch('/api/admin/rewards'),
        fetch('/api/admin/redemptions')
      ]);

      if (rewardsRes.ok) setRewards(await rewardsRes.json());
      if (redemptionsRes.ok) setRedemptions(await redemptionsRes.json());
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
      discountPercentage: 0,
      createdAt: new Date().toISOString().split('T')[0]
    });
    setDiscountType('fixed'); // Percentage discount deactivated for now (points deduction not yet implemented)
    setShowEditModal(true);
    setEditError(null);
  };

  const handleEditReward = (reward: Reward) => {
    // Format dates for input fields (YYYY-MM-DD)
    const formatDateForInput = (dateString: string | null | undefined) => {
      if (!dateString) return '';
      const date = new Date(dateString);
      return date.toISOString().split('T')[0];
    };

    // Determine discount type based on reward name (if it contains £) or discountPercentage
    const isFixedAmount = reward.name.includes('£') && reward.discountPercentage === 0;
    setDiscountType(isFixedAmount ? 'fixed' : 'percentage');

    setEditingReward({
      ...reward,
      createdAt: new Date(reward.createdAt).toISOString().split('T')[0],
      validFrom: formatDateForInput(reward.validFrom),
      validTo: formatDateForInput(reward.validTo),
    });
    setShowEditModal(true);
    setEditError(null);
  };

  const handleSaveReward = async () => {
    if (!editingReward?.name || !editingReward?.description) {
      setEditError('Please fill in all required fields');
      return;
    }

    // Validate based on discount type
    if (discountType === 'percentage') {
      if (editingReward.discountPercentage === undefined || editingReward.discountPercentage < 0 || editingReward.discountPercentage > 100) {
        setEditError('Please enter a valid discount percentage between 0 and 100');
        return;
      }
    } else {
      // For fixed amount, discountPercentage should be 0 (we'll extract amount from name)
      if (!editingReward.name.match(/£\d+/)) {
        setEditError('Fixed amount rewards must include £ amount in the name (e.g., "£35 Discount Voucher")');
        return;
      }
    }

    try {
      setEditLoading(true);
      setEditError(null);

      const url = editingReward.id 
        ? `/api/admin/rewards/${editingReward.id}`
        : '/api/admin/rewards';
      
      const method = editingReward.id ? 'PUT' : 'POST';

      // For fixed amount discounts, set discountPercentage to 0
      const discountPercentage = discountType === 'fixed' ? 0 : parseFloat(editingReward.discountPercentage?.toString() || '0');

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editingReward.name,
          description: editingReward.description,
          discountPercentage: discountPercentage,
          discountType: discountType, // Send discount type to API
          createdAt: editingReward.createdAt,
          validFrom: editingReward.validFrom || null,
          validTo: editingReward.validTo || null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to save reward' }));
        throw new Error(errorData.error || 'Failed to save reward');
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
    setDiscountType('fixed');
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

  const handleApproveReward = async (rewardId: string): Promise<Partial<Reward> | null> => {
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
      const updated: Partial<Reward> = {
        approvalStatus: 'APPROVED',
        approvedAt: result.reward?.approvedAt ?? new Date().toISOString(),
        approvedBy: result.reward?.approvedBy
      };

      setRewards(rewards.map(r =>
        r.id === rewardId ? { ...r, ...updated } : r
      ));
      return updated;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      return null;
    }
  };

  const handleRejectReward = async (rewardId: string): Promise<Partial<Reward> | null> => {
    const rejectionReason = prompt('Please provide a reason for rejecting this reward:');
    if (!rejectionReason) {
      return null;
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
      const updated: Partial<Reward> = {
        approvalStatus: 'REJECTED',
        rejectionReason: result.reward?.rejectionReason ?? rejectionReason,
        approvedAt: result.reward?.approvedAt ?? new Date().toISOString(),
        approvedBy: result.reward?.approvedBy
      };

      setRewards(rewards.map(r =>
        r.id === rewardId ? { ...r, ...updated } : r
      ));
      return updated;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      return null;
    }
  };

  const handleSuspendVoucher = async (voucherId: string) => {
    if (!confirm('Suspend this voucher? It cannot be used at partners until unsuspended.')) return;
    try {
      const response = await fetch(`/api/admin/vouchers/${voucherId}/suspend`, { method: 'PATCH' });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to suspend voucher');
      }
      const [rewardsRes, redemptionsRes] = await Promise.all([
        fetch('/api/admin/rewards'),
        fetch('/api/admin/redemptions')
      ]);
      if (rewardsRes.ok) setRewards(await rewardsRes.json());
      if (redemptionsRes.ok) setRedemptions(await redemptionsRes.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to suspend voucher');
    }
  };

  const getFilteredData = () => {
    let data: any[] = [];
    
    switch (view) {
      case 'rewards':
        data = rewards;
        break;
      case 'redemptions':
        data = redemptions;
        break;
    }

    // Apply status filter (rewards only)
    if (view === 'rewards' && filterStatus !== 'all') {
      data = data.filter((item: Reward) => item.approvalStatus === filterStatus);
    }

    // Apply search filter
    if (searchTerm) {
      data = data.filter((item: any) => {
        if (view === 'rewards') {
          return item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                 item.description?.toLowerCase().includes(searchTerm.toLowerCase());
        } else if (view === 'redemptions') {
          return item.customer?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                 item.customer?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                 item.reward?.name?.toLowerCase().includes(searchTerm.toLowerCase());
        }
        return true;
      });
    }

    return data;
  };

  const formatDiscount = (reward: Reward): string => {
    const poundMatch = reward.name.match(/£(\d+(?:\.\d+)?)/);
    if (poundMatch) return `£${poundMatch[1]}`;
    if (reward.discountPercentage > 0) return `${reward.discountPercentage}%`;
    return 'N/A';
  };

  const handleRewardClick = (reward: Reward) => {
    setSelectedReward(reward);
    setShowRewardDetailsModal(true);
  };

  const formatPoints = (n: number) => {
    if (n >= 1_000_000) {
      const v = n / 1_000_000;
      return v % 1 === 0 ? `${v}M` : `${v.toFixed(1)}M`;
    }
    if (n >= 1_000) {
      const v = n / 1_000;
      return v % 1 === 0 ? `${v}K` : `${v.toFixed(1)}K`;
    }
    return n.toLocaleString();
  };

  const getStats = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString().split('T')[0];

    const totalRewards = rewards.length;
    // Active: approved and within validity (no validTo or validTo >= today)
    const activeRewards = rewards.filter(r => {
      if (r.approvalStatus !== 'APPROVED') return false;
      if (!r.validTo) return true;
      const validToDate = new Date(r.validTo).toISOString().split('T')[0];
      return validToDate >= today;
    }).length;
    // Used: rewards that have been redeemed by customers (at least one redemption)
    const usedRewards = rewards.filter(r => (r.redemptions?.length || 0) > 0).length;
    // Expired: rewards with validTo in the past
    const expiredRewards = rewards.filter(r => {
      if (!r.validTo) return false;
      const validToDate = new Date(r.validTo).toISOString().split('T')[0];
      return validToDate < today;
    }).length;
    // Points Redeemed: sum of points from all redemptions (customer usage)
    const pointsRedeemed = redemptions.reduce((sum, r) => sum + r.points, 0);

    return {
      totalRewards,
      activeRewards,
      usedRewards,
      expiredRewards,
      pointsRedeemed
    };
  };

  const stats = getStats();
  const filteredData = getFilteredData();

  // Pagination
  const totalRows = filteredData.length;
  const totalPages = Math.max(1, Math.ceil(totalRows / rowsPerPage));
  const paginatedData = filteredData.slice((page - 1) * rowsPerPage, page * rowsPerPage);
  const startRow = totalRows === 0 ? 0 : (page - 1) * rowsPerPage + 1;
  const endRow = Math.min(page * rowsPerPage, totalRows);

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
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Rewards Management</h1>
          <p className="mt-1 text-sm text-slate-600">
            View and manage all rewards across the platform
          </p>
        </div>
        <div className="flex gap-3">
          {view === 'rewards' && (
            <button
              onClick={handleAddReward}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition-all hover:bg-blue-700 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <Plus className="h-4 w-4" />
              Add Reward
            </button>
          )}
          <button
            onClick={fetchData}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white shadow-lg ring-1 ring-slate-700/50 transition-all hover:bg-slate-800 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats Cards - consistent with vouchers: Total, Active, Used, Expired, Points Redeemed */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-5">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="group relative overflow-hidden rounded-xl bg-slate-900 p-6 shadow-xl ring-1 ring-slate-700/50 transition-all duration-300 hover:ring-blue-500/50 hover:shadow-2xl"
        >
          <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-blue-500/10 blur-2xl transition-all group-hover:bg-blue-500/20" />
          <div className="absolute left-0 top-0 flex h-full w-14 flex-col items-center justify-center border-r border-slate-700/50 bg-slate-800/30">
            <Gift className="h-6 w-6 text-blue-400" />
          </div>
          <div className="flex min-h-[80px] flex-col items-center justify-center pl-16 text-center">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Rewards</p>
            <p className="mt-1 text-3xl font-bold tracking-tight text-white">{stats.totalRewards}</p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="group relative overflow-hidden rounded-xl bg-slate-900 p-6 shadow-xl ring-1 ring-slate-700/50 transition-all duration-300 hover:ring-emerald-500/50 hover:shadow-2xl"
        >
          <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-emerald-500/10 blur-2xl transition-all group-hover:bg-emerald-500/20" />
          <div className="absolute left-0 top-0 flex h-full w-14 flex-col items-center justify-center border-r border-slate-700/50 bg-slate-800/30">
            <Clock className="h-6 w-6 text-emerald-400" />
          </div>
          <div className="flex min-h-[80px] flex-col items-center justify-center pl-16 text-center">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Active</p>
            <p className="mt-1 text-3xl font-bold tracking-tight text-white">{stats.activeRewards}</p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="group relative overflow-hidden rounded-xl bg-slate-900 p-6 shadow-xl ring-1 ring-slate-700/50 transition-all duration-300 hover:ring-cyan-500/50 hover:shadow-2xl"
        >
          <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-cyan-500/10 blur-2xl transition-all group-hover:bg-cyan-500/20" />
          <div className="absolute left-0 top-0 flex h-full w-14 flex-col items-center justify-center border-r border-slate-700/50 bg-slate-800/30">
            <CheckCircle className="h-6 w-6 text-cyan-400" />
          </div>
          <div className="flex min-h-[80px] flex-col items-center justify-center pl-16 text-center">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Used</p>
            <p className="mt-1 text-3xl font-bold tracking-tight text-white">{stats.usedRewards}</p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="group relative overflow-hidden rounded-xl bg-slate-900 p-6 shadow-xl ring-1 ring-slate-700/50 transition-all duration-300 hover:ring-rose-500/50 hover:shadow-2xl"
        >
          <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-rose-500/10 blur-2xl transition-all group-hover:bg-rose-500/20" />
          <div className="absolute left-0 top-0 flex h-full w-14 flex-col items-center justify-center border-r border-slate-700/50 bg-slate-800/30">
            <XCircle className="h-6 w-6 text-rose-400" />
          </div>
          <div className="flex min-h-[80px] flex-col items-center justify-center pl-16 text-center">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Expired</p>
            <p className="mt-1 text-3xl font-bold tracking-tight text-white">{stats.expiredRewards}</p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="group relative overflow-hidden rounded-xl bg-slate-900 p-6 shadow-xl ring-1 ring-slate-700/50 transition-all duration-300 hover:ring-violet-500/50 hover:shadow-2xl"
        >
          <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-violet-500/10 blur-2xl transition-all group-hover:bg-violet-500/20" />
          <div className="absolute left-0 top-0 flex h-full w-14 flex-col items-center justify-center border-r border-slate-700/50 bg-slate-800/30">
            <TrendingUp className="h-6 w-6 text-violet-400" />
          </div>
          <div className="flex min-h-[80px] flex-col items-center justify-center pl-16 text-center">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Points Redeemed</p>
            <p className="mt-1 text-3xl font-bold tracking-tight text-white">{formatPoints(stats.pointsRedeemed)}</p>
          </div>
        </motion.div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Filters - mirror vouchers layout */}
      <div className="rounded-xl bg-slate-900 p-6 shadow-xl ring-1 ring-slate-700/50">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-4">
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-400">
              View
            </label>
            <div className="relative">
              <select
                value={view}
                onChange={(e) => {
                  setView(e.target.value as 'rewards' | 'redemptions');
                  setFilterStatus('all');
                }}
                className="w-full appearance-none rounded-lg border-0 bg-slate-800 px-4 py-2.5 pr-10 text-sm font-medium text-white ring-1 ring-slate-600 focus:ring-2 focus:ring-blue-500"
              >
                <option value="rewards">Rewards</option>
                <option value="redemptions">Redemptions</option>
              </select>
              <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
                <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-400">
              Search
            </label>
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder={view === 'rewards' 
                  ? "Search rewards, descriptions..."
                  : "Search redemptions, customers, rewards..."}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-lg border-0 bg-slate-800 py-2.5 pl-10 pr-4 text-sm font-medium text-white ring-1 ring-slate-600 placeholder:text-slate-500 focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          
          {view === 'rewards' && (
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-400">
                Status
              </label>
              <div className="relative">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full appearance-none rounded-lg border-0 bg-slate-800 px-4 py-2.5 pr-10 text-sm font-medium text-white ring-1 ring-slate-600 focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="APPROVED">Approved</option>
                  <option value="PENDING">Pending</option>
                  <option value="REJECTED">Rejected</option>
                </select>
                <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
                  <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Rewards Table */}
      {view === 'rewards' && (
        <div className="overflow-hidden rounded-xl bg-slate-900 shadow-xl ring-1 ring-slate-700/50">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-700/50">
              <thead>
                <tr className="bg-slate-800/80">
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-400">
                    Reward
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-400">
                    Redemptions
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-400">
                    Created
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-400">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-400">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50 bg-slate-900/50">
                {paginatedData.map((reward) => (
                  <tr
                    key={reward.id}
                    onClick={() => handleRewardClick(reward)}
                    className="cursor-pointer transition-colors hover:bg-slate-800/60"
                  >
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-semibold text-white">{reward.name}</div>
                        <div className="text-sm text-slate-400">{reward.description}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-white">
                      {reward.redemptions?.length || 0}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-400">
                      {new Date(reward.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold uppercase tracking-wide ${
                        reward.approvalStatus === 'APPROVED' 
                          ? 'bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-400/30' 
                          : reward.approvalStatus === 'REJECTED'
                          ? 'bg-rose-500/20 text-rose-400 ring-1 ring-rose-400/30'
                          : 'bg-amber-500/20 text-amber-400 ring-1 ring-amber-400/30'
                      }`}>
                        {reward.approvalStatus === 'APPROVED' && <CheckCircle className="h-4 w-4" />}
                        {reward.approvalStatus === 'PENDING' && <Clock className="h-4 w-4" />}
                        {reward.approvalStatus === 'REJECTED' && <XCircle className="h-4 w-4" />}
                        {reward.approvalStatus}
                      </span>
                      {reward.rejectionReason && (
                        <div className="mt-1 text-xs text-rose-400">
                          {reward.rejectionReason}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                      <div className="flex gap-2">
                        {reward.approvalStatus === 'PENDING' && (
                          <>
                            <button
                              onClick={() => handleApproveReward(reward.id)}
                              className="rounded-lg p-2 text-emerald-400 transition-colors hover:bg-emerald-500/20 hover:text-emerald-300"
                              title="Approve reward"
                            >
                              <Award className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => handleRejectReward(reward.id)}
                              className="rounded-lg p-2 text-rose-400 transition-colors hover:bg-rose-500/20 hover:text-rose-300"
                              title="Reject reward"
                            >
                              <X className="h-5 w-5" />
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => handleEditReward(reward)}
                          className="rounded-lg p-2 text-blue-400 transition-colors hover:bg-blue-500/20 hover:text-blue-300"
                        >
                          <Edit className="h-5 w-5" />
                        </button>
                        {canDeleteReward(reward) ? (
                          <button
                            onClick={() => handleDeleteReward(reward.id)}
                            className="rounded-lg p-2 text-rose-400 transition-colors hover:bg-rose-500/20 hover:text-rose-300"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        ) : (
                          <button
                            disabled
                            className="cursor-not-allowed rounded-lg p-2 text-slate-600"
                            title="Only Super Admins can delete rewards"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredData.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-slate-500">No rewards found</p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-between gap-4 border-t border-slate-700/50 bg-slate-800/30 px-4 py-3 sm:flex-row">
              <div className="flex items-center gap-4">
                <span className="text-sm text-slate-400">
                  Rows per page
                </span>
                <div className="relative">
                  <select
                    value={rowsPerPage}
                    onChange={(e) => setRowsPerPage(Number(e.target.value))}
                    className="appearance-none rounded-lg border-0 bg-slate-800 px-4 py-2.5 pr-10 text-sm font-medium text-white ring-1 ring-slate-600 focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                  <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
                    <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
                <span className="text-sm text-slate-400">
                  {startRow}-{endRow} of {totalRows}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-700/50 hover:text-white disabled:opacity-40 disabled:hover:bg-transparent"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <span className="text-sm font-medium text-slate-300">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-700/50 hover:text-white disabled:opacity-40 disabled:hover:bg-transparent"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Redemptions Table */}
      {view === 'redemptions' && (
        <div className="overflow-hidden rounded-xl bg-slate-900 shadow-xl ring-1 ring-slate-700/50">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-700/50">
              <thead>
                <tr className="bg-slate-800/80">
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-400">
                    Customer
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-400">
                    Reward
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-400">
                    Points
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-400">
                    Redeemed
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-400">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50 bg-slate-900/50">
                {paginatedData.map((redemption) => {
                  const voucher = redemption.voucher;
                  const canSuspend = voucher && voucher.status === 'active';
                  const isSuspended = voucher && voucher.status === 'suspended';
                  return (
                  <tr key={redemption.id} className="transition-colors hover:bg-slate-800/60">
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-semibold text-white">{redemption.customer.name}</div>
                        <div className="text-sm text-slate-400">{redemption.customer.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-white">{redemption.reward.name}</div>
                    </td>
                    <td className="px-6 py-4 font-semibold text-violet-400">
                      {redemption.points.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-400">
                      {new Date(redemption.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      {canSuspend ? (
                        <button
                          type="button"
                          onClick={() => handleSuspendVoucher(voucher!.id)}
                          className="rounded-lg p-2 text-amber-400 transition-colors hover:bg-amber-500/20 hover:text-amber-300"
                          title="Suspend voucher (fraud/misuse)"
                        >
                          <Ban className="h-5 w-5" />
                        </button>
                      ) : isSuspended ? (
                        <span className="inline-flex items-center gap-1 text-amber-400 text-xs font-medium">
                          <Ban className="h-4 w-4" /> Suspended
                        </span>
                      ) : (
                        <span className="text-slate-500 text-xs">—</span>
                      )}
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {filteredData.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-slate-500">No redemptions found</p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-between gap-4 border-t border-slate-700/50 bg-slate-800/30 px-4 py-3 sm:flex-row">
              <div className="flex items-center gap-4">
                <span className="text-sm text-slate-400">
                  Rows per page
                </span>
                <div className="relative">
                  <select
                    value={rowsPerPage}
                    onChange={(e) => setRowsPerPage(Number(e.target.value))}
                    className="appearance-none rounded-lg border-0 bg-slate-800 px-4 py-2.5 pr-10 text-sm font-medium text-white ring-1 ring-slate-600 focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                  <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
                    <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
                <span className="text-sm text-slate-400">
                  {startRow}-{endRow} of {totalRows}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-700/50 hover:text-white disabled:opacity-40 disabled:hover:bg-transparent"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <span className="text-sm font-medium text-slate-300">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-700/50 hover:text-white disabled:opacity-40 disabled:hover:bg-transparent"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Reward Details Modal */}
      {showRewardDetailsModal && selectedReward && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-start justify-center pt-8 pb-8 px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="relative max-w-4xl w-full space-y-6 bg-white rounded-3xl shadow-2xl p-8 md:p-10 border-2 border-gray-100/50 backdrop-blur-sm my-8"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight">
                Reward Details
              </h3>
              <button
                onClick={() => {
                  setShowRewardDetailsModal(false);
                  setSelectedReward(null);
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-50 rounded-2xl p-6 border-2 border-gray-200">
                <h4 className="text-lg font-bold text-gray-900 mb-4">Reward Information</h4>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-semibold text-gray-700">Name: </span>
                    <span className="text-gray-900 font-bold">{selectedReward.name}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-700">Description: </span>
                    <span className="text-gray-900">{selectedReward.description}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-700">Discount: </span>
                    <span className="text-gray-900 font-bold">{formatDiscount(selectedReward)}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-700">Valid From: </span>
                    <span className="text-gray-900">
                      {selectedReward.validFrom
                        ? new Date(selectedReward.validFrom).toLocaleDateString()
                        : 'Not set'}
                    </span>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-700">Valid To: </span>
                    <span className="text-gray-900">
                      {selectedReward.validTo
                        ? new Date(selectedReward.validTo).toLocaleDateString()
                        : 'Not set'}
                    </span>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-700">Max Redemptions Per Customer: </span>
                    <span className="text-gray-900">
                      {selectedReward.maxRedemptionsPerCustomer != null
                        ? String(selectedReward.maxRedemptionsPerCustomer)
                        : 'Unlimited'}
                    </span>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-700">Created: </span>
                    <span className="text-gray-900">
                      {new Date(selectedReward.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-700">Redemptions: </span>
                    <span className="text-gray-900">
                      {selectedReward.redemptions?.length || 0}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="bg-gray-50 rounded-2xl p-6 border-2 border-gray-200">
                  <h4 className="text-lg font-bold text-gray-900 mb-4">Status</h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-semibold text-gray-700">Approval Status: </span>
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          selectedReward.approvalStatus === 'APPROVED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : selectedReward.approvalStatus === 'REJECTED'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {selectedReward.approvalStatus}
                      </span>
                    </div>
                    {selectedReward.rejectionReason && (
                      <div>
                        <span className="font-semibold text-gray-700">Rejection Reason: </span>
                        <span className="text-rose-600">{selectedReward.rejectionReason}</span>
                      </div>
                    )}
                  </div>
                </div>

                {selectedReward.tenant && (
                  <div className="bg-gray-50 rounded-2xl p-6 border-2 border-gray-200">
                    <h4 className="text-lg font-bold text-gray-900 mb-4">Partner/Business Information</h4>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="font-semibold text-gray-700">Business: </span>
                        <span className="text-gray-900 font-bold">{selectedReward.tenant.name}</span>
                      </div>
                      {selectedReward.tenant.partnerUser ? (
                        <>
                          <div>
                            <span className="font-semibold text-gray-700">Partner Name: </span>
                            <span className="text-gray-900">{selectedReward.tenant.partnerUser.name}</span>
                          </div>
                          <div>
                            <span className="font-semibold text-gray-700">Partner Email: </span>
                            <span className="text-gray-900">{selectedReward.tenant.partnerUser.email}</span>
                          </div>
                        </>
                      ) : null}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end flex-wrap gap-3 mt-6 pt-6 border-t border-gray-200">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setShowRewardDetailsModal(false);
                  setSelectedReward(null);
                }}
                className="px-6 py-3 border-2 border-gray-300 text-lg font-bold rounded-2xl text-gray-700 bg-white hover:bg-gray-50 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                Close
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  handleEditReward(selectedReward);
                  setShowRewardDetailsModal(false);
                }}
                className="px-6 py-3 border-2 border-blue-600 text-lg font-bold rounded-2xl text-white bg-blue-600 hover:bg-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <Edit className="h-5 w-5 inline mr-2" />
                Edit
              </motion.button>
              {selectedReward.approvalStatus === 'PENDING' && (
                <>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={async () => {
                      const updated = await handleApproveReward(selectedReward.id);
                      if (updated) setSelectedReward(prev => prev ? { ...prev, ...updated } : null);
                    }}
                    className="px-6 py-3 border-2 border-emerald-600 text-lg font-bold rounded-2xl text-white bg-emerald-600 hover:bg-emerald-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    <Award className="h-5 w-5 inline mr-2" />
                    Approve
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={async () => {
                      const updated = await handleRejectReward(selectedReward.id);
                      if (updated) setSelectedReward(prev => prev ? { ...prev, ...updated } : null);
                    }}
                    className="px-6 py-3 border-2 border-rose-600 text-lg font-bold rounded-2xl text-white bg-rose-600 hover:bg-rose-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    <X className="h-5 w-5 inline mr-2" />
                    Reject
                  </motion.button>
                </>
              )}
              {canDeleteReward(selectedReward) && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    if (confirm('Delete this reward?')) {
                      handleDeleteReward(selectedReward.id);
                      setShowRewardDetailsModal(false);
                      setSelectedReward(null);
                    }
                  }}
                  className="px-6 py-3 border-2 border-rose-600 text-lg font-bold rounded-2xl text-white bg-rose-600 hover:bg-rose-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  <Trash2 className="h-5 w-5 inline mr-2" />
                  Delete
                </motion.button>
              )}
            </div>
          </motion.div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-start justify-center pt-8 pb-8 px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="relative max-w-2xl w-full space-y-10 bg-white rounded-3xl shadow-2xl p-10 md:p-12 border-2 border-gray-100/50 backdrop-blur-sm my-8"
          >
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-5xl md:text-6xl font-extrabold text-gray-900 tracking-tight">
                {editingReward?.id ? 'Edit Reward' : 'Add New Reward'}
              </h3>
              <button
                onClick={() => setShowEditModal(false)}
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
                  value={editingReward?.name || ''}
                  onChange={(e) => setEditingReward({ ...editingReward, name: e.target.value })}
                  required
                  className="block w-full px-8 py-8 text-2xl text-gray-900 bg-gray-50 border-2 border-gray-200 rounded-3xl appearance-none transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-blue-500/30 focus:border-blue-500 focus:bg-white peer group-hover:border-gray-300 shadow-lg hover:shadow-xl min-h-[80px]"
                  placeholder=" "
                />
                <label className="absolute text-xl font-medium text-gray-600 duration-200 transform -translate-y-4 scale-75 top-4 z-10 origin-[0] bg-white px-3 peer-focus:px-3 peer-focus:text-blue-600 peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 peer-focus:top-4 peer-focus:scale-75 peer-focus:-translate-y-4 left-3 peer-focus:bg-white group-hover:bg-white">
                  Name *
                </label>
              </div>

              <div className="relative group">
                <textarea
                  value={editingReward?.description || ''}
                  onChange={(e) => setEditingReward({ ...editingReward, description: e.target.value })}
                  rows={4}
                  required
                  className="block w-full px-8 py-8 text-2xl text-gray-900 bg-gray-50 border-2 border-gray-200 rounded-3xl appearance-none transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-blue-500/30 focus:border-blue-500 focus:bg-white peer group-hover:border-gray-300 shadow-lg hover:shadow-xl resize-none"
                  placeholder=" "
                />
                <label className="absolute text-xl font-medium text-gray-600 duration-200 transform -translate-y-4 scale-75 top-4 z-10 origin-[0] bg-white px-3 peer-focus:px-3 peer-focus:text-blue-600 peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-8 peer-focus:top-4 peer-focus:scale-75 peer-focus:-translate-y-4 left-3 peer-focus:bg-white group-hover:bg-white">
                  Description *
                </label>
              </div>

              {/* Discount Type Selector - Only for Admin/SuperAdmin */}
              <div className="relative group">
                <label className="block text-xl font-medium text-gray-700 mb-4">Discount Type *</label>
                <div className="flex gap-4">
                  <button
                    type="button"
                    disabled
                    title="Temporarily unavailable – points deduction not yet implemented"
                    onClick={() => {
                      setDiscountType('percentage');
                      setEditingReward({ ...editingReward, discountPercentage: editingReward?.discountPercentage || 0 });
                    }}
                    className={`flex-1 px-6 py-4 rounded-2xl border-2 text-xl font-semibold transition-all opacity-60 cursor-not-allowed ${
                      discountType === 'percentage'
                        ? 'bg-blue-400 text-white border-blue-400 shadow-lg'
                        : 'bg-gray-100 text-gray-400 border-gray-200'
                    }`}
                  >
                    Percentage Discount
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDiscountType('fixed');
                      setEditingReward({ ...editingReward, discountPercentage: 0 });
                    }}
                    className={`flex-1 px-6 py-4 rounded-2xl border-2 text-xl font-semibold transition-all ${
                      discountType === 'fixed'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-lg'
                        : 'bg-gray-50 text-gray-700 border-gray-300 hover:bg-gray-100'
                    }`}
                  >
                    Fixed Amount (£)
                  </button>
                </div>
                <p className="mt-2 text-base text-gray-500 font-medium">
                  {discountType === 'percentage' 
                    ? 'Partners can only create percentage discounts. Fixed amounts are for admin use only.'
                    : 'Fixed amount discounts are converted to points based on point face value.'}
                </p>
              </div>

              {/* Percentage Discount Input - deactivated for now (points deduction not yet implemented) */}
              {discountType === 'percentage' && (
                <div className="relative group">
                  <input
                    type="number"
                    disabled
                    value={editingReward?.discountPercentage || 0}
                    onChange={(e) => setEditingReward({ ...editingReward, discountPercentage: parseFloat(e.target.value) || 0 })}
                    min="0"
                    max="100"
                    step="0.1"
                    required={false}
                    className="block w-full px-8 py-8 text-2xl text-gray-500 bg-gray-100 border-2 border-gray-200 rounded-3xl appearance-none transition-all duration-200 cursor-not-allowed opacity-75"
                    placeholder=" "
                  />
                  <label className="absolute text-xl font-medium text-gray-600 duration-200 transform -translate-y-4 scale-75 top-4 z-10 origin-[0] bg-white px-3 peer-focus:px-3 peer-focus:text-blue-600 peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 peer-focus:top-4 peer-focus:scale-75 peer-focus:-translate-y-4 left-3 peer-focus:bg-white group-hover:bg-white">
                    Discount Percentage % *
                  </label>
                  <p className="mt-2 text-base text-gray-500 font-medium">Enter a number between 0 and 100 (e.g., 10 for 10% discount)</p>
                  <p className="mt-2 text-sm text-amber-600 font-medium">Temporarily unavailable – points deduction not yet implemented. Use Fixed Amount (£) for now.</p>
                </div>
              )}

              {/* Fixed Amount Discount Input */}
              {discountType === 'fixed' && (
                <div className="space-y-4">
                  <div className="relative group">
                    <input
                      type="text"
                      value={editingReward?.name || ''}
                      onChange={(e) => setEditingReward({ ...editingReward, name: e.target.value })}
                      required
                      className="block w-full px-8 py-8 text-2xl text-gray-900 bg-gray-50 border-2 border-gray-200 rounded-3xl appearance-none transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-blue-500/30 focus:border-blue-500 focus:bg-white peer group-hover:border-gray-300 shadow-lg hover:shadow-xl min-h-[80px]"
                      placeholder=" "
                    />
                    <label className="absolute text-xl font-medium text-gray-600 duration-200 transform -translate-y-4 scale-75 top-4 z-10 origin-[0] bg-white px-3 peer-focus:px-3 peer-focus:text-blue-600 peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 peer-focus:top-4 peer-focus:scale-75 peer-focus:-translate-y-4 left-3 peer-focus:bg-white group-hover:bg-white">
                      Discount Amount £ *
                    </label>
                    <p className="mt-2 text-base text-gray-500 font-medium">Example: "£35 Discount Voucher" or "£50 Off Your Purchase"</p>
                  </div>
                  
                  {/* Points Equivalent Display */}
                  {pointsConfig && editingReward?.name && (() => {
                    const match = editingReward.name.match(/£(\d+)/);
                    if (match) {
                      const amount = parseFloat(match[1]);
                      const pointsRequired = calculatePointsForDiscount(amount, pointsConfig);
                      return (
                        <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-6">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-lg font-semibold text-blue-900">Points Equivalent</p>
                              <p className="text-sm text-blue-700 mt-1">Based on point face value: £{pointsConfig.pointFaceValue} per point</p>
                            </div>
                            <div className="text-right">
                              <p className="text-3xl font-bold text-blue-600">{pointsRequired.toLocaleString()}</p>
                              <p className="text-sm text-blue-600">points</p>
                            </div>
                          </div>
                          <p className="text-xs text-blue-600 mt-3">
                            Customers will need {pointsRequired.toLocaleString()} points to redeem this £{amount} voucher
                          </p>
                        </div>
                      );
                    }
                    return null;
                  })()}
                </div>
              )}

              <div className="relative group">
                <input
                  type="date"
                  value={editingReward?.validFrom || ''}
                  onChange={(e) => setEditingReward({ ...editingReward, validFrom: e.target.value })}
                  className="block w-full px-8 py-8 text-2xl text-gray-900 bg-gray-50 border-2 border-gray-200 rounded-3xl appearance-none transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-blue-500/30 focus:border-blue-500 focus:bg-white peer group-hover:border-gray-300 shadow-lg hover:shadow-xl min-h-[80px]"
                />
                <label className="absolute text-xl font-medium text-gray-600 duration-200 transform -translate-y-4 scale-75 top-4 z-10 origin-[0] bg-white px-3 peer-focus:px-3 peer-focus:text-blue-600 peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 peer-focus:top-4 peer-focus:scale-75 peer-focus:-translate-y-4 left-3 peer-focus:bg-white group-hover:bg-white">
                  Valid From
                </label>
              </div>

              <div className="relative group">
                <input
                  type="date"
                  value={editingReward?.validTo || ''}
                  onChange={(e) => setEditingReward({ ...editingReward, validTo: e.target.value })}
                  min={editingReward?.validFrom || undefined}
                  className="block w-full px-8 py-8 text-2xl text-gray-900 bg-gray-50 border-2 border-gray-200 rounded-3xl appearance-none transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-blue-500/30 focus:border-blue-500 focus:bg-white peer group-hover:border-gray-300 shadow-lg hover:shadow-xl min-h-[80px]"
                />
                <label className="absolute text-xl font-medium text-gray-600 duration-200 transform -translate-y-4 scale-75 top-4 z-10 origin-[0] bg-white px-3 peer-focus:px-3 peer-focus:text-blue-600 peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 peer-focus:top-4 peer-focus:scale-75 peer-focus:-translate-y-4 left-3 peer-focus:bg-white group-hover:bg-white">
                  Valid To
                </label>
              </div>

              <div className="relative group">
                <input
                  type="date"
                  value={editingReward?.createdAt || ''}
                  onChange={(e) => setEditingReward({ ...editingReward, createdAt: e.target.value })}
                  className="block w-full px-8 py-8 text-2xl text-gray-900 bg-gray-50 border-2 border-gray-200 rounded-3xl appearance-none transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-blue-500/30 focus:border-blue-500 focus:bg-white peer group-hover:border-gray-300 shadow-lg hover:shadow-xl min-h-[80px]"
                />
                <label className="absolute text-xl font-medium text-gray-600 duration-200 transform -translate-y-4 scale-75 top-4 z-10 origin-[0] bg-white px-3 peer-focus:px-3 peer-focus:text-blue-600 peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 peer-focus:top-4 peer-focus:scale-75 peer-focus:-translate-y-4 left-3 peer-focus:bg-white group-hover:bg-white">
                  Created Date
                </label>
              </div>

              {/* Partner Information Section - Read Only */}
              {editingReward?.tenant && (
                <div className="bg-gray-50 rounded-3xl p-6 border-2 border-gray-200">
                  <h4 className="text-xl font-bold text-gray-900 mb-4">Partner Information</h4>
                  <div className="space-y-3 text-lg">
                    <div>
                      <span className="font-semibold text-gray-700">Business Name: </span>
                      <span className="text-gray-900 font-bold">{editingReward.tenant.name}</span>
                    </div>
                    {editingReward.tenant.partnerUser ? (
                      <>
                        <div>
                          <span className="font-semibold text-gray-700">Partner Name: </span>
                          <span className="text-gray-900 font-bold">{editingReward.tenant.partnerUser.name}</span>
                        </div>
                        <div>
                          <span className="font-semibold text-gray-700">Partner Email: </span>
                          <span className="text-gray-900">{editingReward.tenant.partnerUser.email}</span>
                        </div>
                      </>
                    ) : editingReward.tenant.partnerUserId ? (
                      <div>
                        <span className="font-semibold text-gray-700">Partner: </span>
                        <span className="text-gray-500 italic">Partner information not available</span>
                      </div>
                    ) : null}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-4 mt-10">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowEditModal(false)}
                className="px-8 py-8 border-2 border-gray-300 text-2xl font-bold rounded-3xl text-gray-700 bg-white hover:bg-gray-50 transition-all duration-200 shadow-lg hover:shadow-xl min-h-[80px]"
              >
                Cancel
              </motion.button>
              <motion.button
                whileHover={{ scale: editLoading ? 1 : 1.02 }}
                whileTap={{ scale: editLoading ? 1 : 0.98 }}
                onClick={handleSaveReward}
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
                    <span className="text-2xl">{editingReward?.id ? 'Update' : 'Create'}</span>
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