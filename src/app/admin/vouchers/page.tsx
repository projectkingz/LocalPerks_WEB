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
  Ban,
  Edit,
  Save,
  X,
  Trash2,
  ChevronLeft,
  ChevronRight
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

interface Reward {
  id: string;
  name: string;
  description: string;
  discountPercentage: number;
  validFrom?: string | null;
  validTo?: string | null;
  createdAt: string;
  approvalStatus: string;
  approvedAt?: string | null;
  approvedBy?: string | null;
  rejectionReason?: string | null;
  tenantId: string;
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
  redemptions: any[];
}

export default function AdminVouchersPage() {
  const { data: session } = useSession();
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCustomer, setFilterCustomer] = useState('');
  const [voucherView, setVoucherView] = useState<'customer' | 'partner'>('customer');
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingVoucher, setEditingVoucher] = useState<Voucher | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [selectedVoucher, setSelectedVoucher] = useState<Voucher | null>(null);
  const [showVoucherDetailsModal, setShowVoucherDetailsModal] = useState(false);
  const [selectedPartnerReward, setSelectedPartnerReward] = useState<Reward | null>(null);
  const [showPartnerRewardDetailsModal, setShowPartnerRewardDetailsModal] = useState(false);
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    fetchAllData();
  }, []);

  // Reset to page 1 when filters or rows per page change
  useEffect(() => {
    setPage(1);
  }, [voucherView, searchTerm, filterStatus, filterCustomer, rowsPerPage]);

  const fetchVouchers = async () => {
    try {
      const response = await fetch('/api/admin/vouchers');
      
      if (!response.ok) {
        throw new Error('Failed to fetch vouchers');
      }
      
      const data = await response.json();
      setVouchers(data);
    } catch (err) {
      console.error('Error fetching vouchers:', err);
      throw err; // Re-throw to be caught by fetchAllData
    }
  };

  const fetchRewards = async () => {
    try {
      const response = await fetch('/api/admin/rewards');
      
      if (!response.ok) {
        throw new Error('Failed to fetch rewards');
      }
      
      const data = await response.json();
      setRewards(data);
    } catch (err) {
      console.error('Error fetching rewards:', err);
      throw err; // Re-throw to be caught by fetchAllData
    }
  };

  const fetchAllData = async () => {
    try {
      setLoading(true);
      setError(null);
      await Promise.all([fetchVouchers(), fetchRewards()]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleSuspendVoucher = async (e: React.MouseEvent, voucherId: string) => {
    e.stopPropagation();
    if (!confirm('Suspend this voucher? It cannot be used at partners until unsuspended.')) return;
    try {
      const response = await fetch(`/api/admin/vouchers/${voucherId}/suspend`, { method: 'PATCH' });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to suspend voucher');
      }
      await fetchVouchers();
      if (selectedVoucher?.id === voucherId) {
        setSelectedVoucher((prev) => prev ? { ...prev, status: 'suspended' } : null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to suspend voucher');
    }
  };

  const handleUnsuspendVoucher = async (e: React.MouseEvent, voucherId: string) => {
    e.stopPropagation();
    if (!confirm('Reactivate this voucher? It will be active and usable at partners again.')) return;
    try {
      const response = await fetch(`/api/admin/vouchers/${voucherId}/unsuspend`, { method: 'PATCH' });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to reactivate voucher');
      }
      await fetchVouchers();
      if (selectedVoucher?.id === voucherId) {
        setSelectedVoucher((prev) => prev ? { ...prev, status: 'active' } : null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reactivate voucher');
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

  const getFilteredRewards = () => {
    // Partner-submitted rewards: rewards that belong to a tenant with a partner user
    // Exclude system rewards
    const partnerRewards = rewards.filter((reward) => {
      const hasPartner = reward.tenant?.partnerUserId;
      const isSystemTenant = reward.tenant?.name === 'LocalPerks System' || 
                             reward.tenant?.name === 'System Default Tenant';
      return hasPartner && !isSystemTenant;
    });

    return partnerRewards.filter(reward => {
      const matchesSearch = 
        reward.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reward.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reward.tenant?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reward.tenant?.partnerUser?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reward.tenant?.partnerUser?.email?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = filterStatus === 'all' || 
        reward.approvalStatus?.toLowerCase() === filterStatus.toLowerCase();
      
      return matchesSearch && matchesStatus;
    });
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
        return <Clock className="h-4 w-4 text-emerald-400" />;
      case 'used':
        return <CheckCircle className="h-4 w-4 text-cyan-400" />;
      case 'expired':
        return <XCircle className="h-4 w-4 text-rose-400" />;
      case 'suspended':
        return <Ban className="h-4 w-4 text-amber-400" />;
      default:
        return <Clock className="h-4 w-4 text-slate-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-400/30';
      case 'used':
        return 'bg-cyan-500/20 text-cyan-400 ring-1 ring-cyan-400/30';
      case 'expired':
        return 'bg-rose-500/20 text-rose-400 ring-1 ring-rose-400/30';
      case 'suspended':
        return 'bg-amber-500/20 text-amber-400 ring-1 ring-amber-400/30';
      default:
        return 'bg-slate-500/20 text-slate-400 ring-1 ring-slate-500/30';
    }
  };

  const handleVoucherClick = (voucher: Voucher) => {
    setSelectedVoucher(voucher);
    setShowVoucherDetailsModal(true);
  };

  const handlePartnerRewardClick = (reward: Reward) => {
    setSelectedPartnerReward(reward);
    setShowPartnerRewardDetailsModal(true);
  };

  // Helper function to format discount display
  const formatDiscount = (reward: { name: string; discountPercentage?: number | null }): string => {
    // Priority 1: Check if reward name contains £XX pattern (fixed amount discount)
    const poundAmountMatch = reward.name.match(/£(\d+(?:\.\d+)?)/);
    if (poundAmountMatch) {
      return `£${poundAmountMatch[1]}`;
    }
    
    // Priority 2: Check if reward name contains %XX pattern (percentage discount from name)
    const percentMatch = reward.name.match(/(\d+(?:\.\d+)?)\s*%/);
    if (percentMatch) {
      return `%${percentMatch[1]}`;
    }
    
    // Priority 3: Use discountPercentage from database (for percentage discounts)
    if (reward.discountPercentage && reward.discountPercentage > 0) {
      return `%${reward.discountPercentage.toFixed(1)}`;
    }
    
    // Fallback
    return 'N/A';
  };

  const handleEditVoucher = (voucher: Voucher, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation(); // Prevent row click when clicking edit button
    }
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
      await fetchRewards();
      return result.reward ? {
        approvalStatus: 'APPROVED',
        approvedAt: result.reward.approvedAt,
        approvedBy: result.reward.approvedBy,
        rejectionReason: null
      } : null;
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
      await fetchRewards();
      return result.reward ? {
        approvalStatus: 'REJECTED',
        rejectionReason: result.reward.rejectionReason,
        approvedAt: result.reward.approvedAt,
        approvedBy: result.reward.approvedBy
      } : null;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      return null;
    }
  };

  const canDeleteReward = (reward: Reward) => {
    // Only can delete if no redemptions
    const redemptionCount = Array.isArray(reward.redemptions) ? reward.redemptions.length : 0;
    return redemptionCount === 0;
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

      await fetchRewards(); // Refresh rewards
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const stats = getStats();
  const filteredVouchers = getFilteredVouchers();
  const filteredRewards = getFilteredRewards();

  // Pagination - reset page when filters or rowsPerPage change
  const totalVouchers = filteredVouchers.length;
  const totalPagesVouchers = Math.max(1, Math.ceil(totalVouchers / rowsPerPage));
  const paginatedVouchers = filteredVouchers.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  const totalPartnerRewards = filteredRewards.length;
  const totalPagesPartner = Math.max(1, Math.ceil(totalPartnerRewards / rowsPerPage));
  const paginatedRewards = filteredRewards.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  // Use current table's data for page bounds
  const currentTotal = voucherView === 'customer' ? totalVouchers : totalPartnerRewards;
  const totalPages = voucherView === 'customer' ? totalPagesVouchers : totalPagesPartner;
  const startRow = (page - 1) * rowsPerPage + 1;
  const endRow = Math.min(page * rowsPerPage, currentTotal);

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
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Vouchers Management</h1>
          <p className="mt-1 text-sm text-slate-600">
            View and manage all vouchers across the platform
          </p>
        </div>
        <button
          onClick={fetchAllData}
          className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white shadow-lg ring-1 ring-slate-700/50 transition-all hover:bg-slate-800 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
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
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Vouchers</p>
            <p className="mt-1 text-3xl font-bold tracking-tight text-white">{stats.totalVouchers}</p>
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
            <p className="mt-1 text-3xl font-bold tracking-tight text-white">{stats.activeVouchers}</p>
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
            <p className="mt-1 text-3xl font-bold tracking-tight text-white">{stats.usedVouchers}</p>
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
            <p className="mt-1 text-3xl font-bold tracking-tight text-white">{stats.expiredVouchers}</p>
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
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Points Issued</p>
            <p className="mt-1 text-3xl font-bold tracking-tight text-white">{formatPoints(stats.totalPointsIssued)}</p>
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
      <div className="rounded-xl bg-slate-900 p-6 shadow-xl ring-1 ring-slate-700/50">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-4">
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-400">
              View
            </label>
            <div className="relative">
              <select
                value={voucherView}
                onChange={(e) => {
                  const newView = e.target.value as 'customer' | 'partner';
                  setVoucherView(newView);
                  setFilterStatus('all');
                  setFilterCustomer('');
                }}
                className="w-full appearance-none rounded-lg border-0 bg-slate-800 px-4 py-2.5 pr-10 text-sm font-medium text-white ring-1 ring-slate-600 placeholder:text-slate-500 focus:ring-2 focus:ring-blue-500"
              >
                <option value="customer">Customer vouchers</option>
                <option value="partner">Partner submissions</option>
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
                placeholder={voucherView === 'customer' 
                  ? "Search vouchers, customers, rewards..."
                  : "Search rewards, businesses, partners..."}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-lg border-0 bg-slate-800 py-2.5 pl-10 pr-4 text-sm font-medium text-white ring-1 ring-slate-600 placeholder:text-slate-500 focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          
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
                {voucherView === 'customer' ? (
                  <>
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="used">Used</option>
                    <option value="expired">Expired</option>
                  </>
                ) : (
                  <>
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </>
                )}
              </select>
              <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
                <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>
          
          {voucherView === 'customer' && (
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-400">
                Filter by Customer
              </label>
              <input
                type="text"
                placeholder="Customer name or email"
                value={filterCustomer}
                onChange={(e) => setFilterCustomer(e.target.value)}
                className="w-full rounded-lg border-0 bg-slate-800 px-4 py-2.5 text-sm font-medium text-white ring-1 ring-slate-600 placeholder:text-slate-500 focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}
        </div>
      </div>

      {/* Customer Vouchers Table */}
      {voucherView === 'customer' && (
        <div className="overflow-hidden rounded-xl bg-slate-900 shadow-xl ring-1 ring-slate-700/50">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-700/50">
              <thead>
                <tr className="bg-slate-800/80">
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-400">
                    Customer
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-400">
                    Voucher Code
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
                {paginatedVouchers.map((voucher) => (
                  <tr 
                    key={voucher.id} 
                    onClick={() => handleVoucherClick(voucher)}
                    className="group cursor-pointer transition-colors hover:bg-slate-800/60"
                  >
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-semibold text-white">{voucher.customer.name}</div>
                        <div className="text-sm text-slate-400">{voucher.customer.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <code className="rounded-lg bg-slate-800 px-3 py-1.5 font-mono text-sm font-medium text-cyan-400 ring-1 ring-slate-600">
                        {voucher.code}
                      </code>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold uppercase tracking-wide ${getStatusColor(voucher.status)}`}>
                        {getStatusIcon(voucher.status)}
                        {voucher.status}
                      </span>
                    </td>
                    <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                      {voucher.status === 'active' ? (
                        <button
                          type="button"
                          onClick={(e) => handleSuspendVoucher(e, voucher.id)}
                          className="rounded-lg p-2 text-amber-400 transition-colors hover:bg-amber-500/20 hover:text-amber-300"
                          title="Suspend voucher (fraud/misuse)"
                        >
                          <Ban className="h-5 w-5" />
                        </button>
                      ) : voucher.status === 'suspended' ? (
                        <button
                          type="button"
                          onClick={(e) => handleUnsuspendVoucher(e, voucher.id)}
                          className="rounded-lg p-2 text-emerald-400 transition-colors hover:bg-emerald-500/20 hover:text-emerald-300"
                          title="Reactivate voucher"
                        >
                          <CheckCircle className="h-5 w-5" />
                        </button>
                      ) : (
                        <span className="text-slate-500 text-xs">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredVouchers.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-slate-500">No vouchers found</p>
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
                  {startRow}-{endRow} of {currentTotal}
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

      {/* Partner Submissions Table */}
      {voucherView === 'partner' && (
        <div className="overflow-hidden rounded-xl bg-slate-900 shadow-xl ring-1 ring-slate-700/50">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-700/50">
              <thead>
                <tr className="bg-slate-800/80">
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-400">
                    Reward
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-400">
                    Business
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
                {paginatedRewards.map((reward: Reward) => (
                  <tr
                    key={reward.id}
                    onClick={() => handlePartnerRewardClick(reward)}
                    className="group cursor-pointer transition-colors hover:bg-slate-800/60"
                  >
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-semibold text-white">{reward.name}</div>
                        <div className="text-sm text-slate-400">{reward.description}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-medium text-white">
                          {reward.tenant?.name || 'Unknown business'}
                        </span>
                        {reward.tenant?.partnerUser && (
                          <span className="text-xs text-slate-400">
                            {reward.tenant.partnerUser.name} ({reward.tenant.partnerUser.email})
                          </span>
                        )}
                      </div>
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
                        {canDeleteReward(reward) && (
                          <button
                            onClick={() => handleDeleteReward(reward.id)}
                            className="rounded-lg p-2 text-rose-400 transition-colors hover:bg-rose-500/20 hover:text-rose-300"
                            title="Delete reward"
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
          {filteredRewards.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-slate-500">No partner submissions found</p>
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
                  {startRow}-{endRow} of {currentTotal}
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

      {/* Voucher Details Modal */}
      {showVoucherDetailsModal && selectedVoucher && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-start justify-center pt-8 pb-8 px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="relative max-w-4xl w-full space-y-6 bg-white rounded-3xl shadow-2xl p-8 md:p-10 border-2 border-gray-100/50 backdrop-blur-sm my-8"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight">
                Voucher Details
              </h3>
              <button
                onClick={() => {
                  setShowVoucherDetailsModal(false);
                  setSelectedVoucher(null);
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Customer Information */}
              <div className="bg-gray-50 rounded-2xl p-6 border-2 border-gray-200">
                <h4 className="text-lg font-bold text-gray-900 mb-4">Customer Information</h4>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-semibold text-gray-700">Name: </span>
                    <span className="text-gray-900">{selectedVoucher.customer.name}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-700">Email: </span>
                    <span className="text-gray-900">{selectedVoucher.customer.email}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-700">Points: </span>
                    <span className="text-gray-900">{selectedVoucher.customer.points.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Voucher Information */}
              <div className="bg-gray-50 rounded-2xl p-6 border-2 border-gray-200">
                <h4 className="text-lg font-bold text-gray-900 mb-4">Voucher Information</h4>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-semibold text-gray-700">Code: </span>
                    <code className="text-sm bg-white px-2 py-1 rounded font-mono border border-gray-300">
                      {selectedVoucher.code}
                    </code>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-700">Status: </span>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedVoucher.status)}`}>
                      {getStatusIcon(selectedVoucher.status)}
                      <span className="ml-1">{selectedVoucher.status}</span>
                    </span>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-700">Created: </span>
                    <span className="text-gray-900">{new Date(selectedVoucher.createdAt).toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-700">Expires: </span>
                    <span className="text-gray-900">
                      {selectedVoucher.expiresAt ? new Date(selectedVoucher.expiresAt).toLocaleDateString() : 'No expiry'}
                    </span>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-700">Used: </span>
                    <span className="text-gray-900">
                      {selectedVoucher.usedAt ? new Date(selectedVoucher.usedAt).toLocaleString() : 'Not used'}
                    </span>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-700">Points Redeemed: </span>
                    <span className="text-gray-900">{selectedVoucher.redemption.points.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Reward Information */}
              <div className="bg-gray-50 rounded-2xl p-6 border-2 border-gray-200">
                <h4 className="text-lg font-bold text-gray-900 mb-4">Reward Information</h4>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-semibold text-gray-700">Name: </span>
                    <span className="text-gray-900">{selectedVoucher.reward.name}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-700">Description: </span>
                    <span className="text-gray-900">{selectedVoucher.reward.description}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-700">Discount: </span>
                    <span className="text-gray-900 font-bold">{formatDiscount(selectedVoucher.reward)}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-700">Valid From: </span>
                    <span className="text-gray-900">
                      {selectedVoucher.reward.validFrom ? new Date(selectedVoucher.reward.validFrom).toLocaleDateString() : 'Not set'}
                    </span>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-700">Valid To: </span>
                    <span className="text-gray-900">
                      {selectedVoucher.reward.validTo ? new Date(selectedVoucher.reward.validTo).toLocaleDateString() : 'Not set'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Partner/Business Information */}
              <div className="bg-gray-50 rounded-2xl p-6 border-2 border-gray-200">
                <h4 className="text-lg font-bold text-gray-900 mb-4">Partner/Business Information</h4>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-semibold text-gray-700">Business: </span>
                    <span className="text-gray-900 font-bold">
                      {selectedVoucher.reward?.tenant?.name || 'System Default'}
                    </span>
                  </div>
                  {selectedVoucher.reward?.tenant?.partnerUser ? (
                    <>
                      <div>
                        <span className="font-semibold text-gray-700">Partner Name: </span>
                        <span className="text-gray-900">{selectedVoucher.reward.tenant.partnerUser.name}</span>
                      </div>
                      <div>
                        <span className="font-semibold text-gray-700">Partner Email: </span>
                        <span className="text-gray-900">{selectedVoucher.reward.tenant.partnerUser.email}</span>
                      </div>
                    </>
                  ) : selectedVoucher.reward?.tenant?.partnerUserId ? (
                    <div>
                      <span className="font-semibold text-gray-700">Partner: </span>
                      <span className="text-gray-500 italic">Partner information not available</span>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="flex justify-end flex-wrap gap-3 mt-6 pt-6 border-t border-gray-200">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setShowVoucherDetailsModal(false);
                  setSelectedVoucher(null);
                }}
                className="px-6 py-3 border-2 border-gray-300 text-lg font-bold rounded-2xl text-gray-700 bg-white hover:bg-gray-50 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                Close
              </motion.button>
              {selectedVoucher.status === 'suspended' && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={(e) => {
                    handleUnsuspendVoucher(e, selectedVoucher.id);
                  }}
                  className="px-6 py-3 border-2 border-emerald-600 text-lg font-bold rounded-2xl text-white bg-emerald-600 hover:bg-emerald-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  <CheckCircle className="h-5 w-5 inline mr-2" />
                  Reactivate Voucher
                </motion.button>
              )}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={(e) => {
                  handleEditVoucher(selectedVoucher, e);
                  setShowVoucherDetailsModal(false);
                }}
                className="px-6 py-3 border-2 border-blue-600 text-lg font-bold rounded-2xl text-white bg-blue-600 hover:bg-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <Edit className="h-5 w-5 inline mr-2" />
                Edit Voucher
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Partner Reward Details Modal */}
      {showPartnerRewardDetailsModal && selectedPartnerReward && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-start justify-center pt-8 pb-8 px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="relative max-w-4xl w-full space-y-6 bg-white rounded-3xl shadow-2xl p-8 md:p-10 border-2 border-gray-100/50 backdrop-blur-sm my-8"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight">
                Partner Reward Details
              </h3>
              <button
                onClick={() => {
                  setShowPartnerRewardDetailsModal(false);
                  setSelectedPartnerReward(null);
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Reward Information */}
              <div className="bg-gray-50 rounded-2xl p-6 border-2 border-gray-200">
                <h4 className="text-lg font-bold text-gray-900 mb-4">Reward Information</h4>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-semibold text-gray-700">Name: </span>
                    <span className="text-gray-900 font-bold">{selectedPartnerReward.name}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-700">Description: </span>
                    <span className="text-gray-900">{selectedPartnerReward.description}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-700">Discount: </span>
                    <span className="text-gray-900 font-bold">
                      {selectedPartnerReward.discountPercentage > 0
                        ? `${selectedPartnerReward.discountPercentage}%`
                        : formatDiscount(selectedPartnerReward)}
                    </span>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-700">Valid From: </span>
                    <span className="text-gray-900">
                      {selectedPartnerReward.validFrom
                        ? new Date(selectedPartnerReward.validFrom).toLocaleDateString()
                        : 'Not set'}
                    </span>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-700">Valid To: </span>
                    <span className="text-gray-900">
                      {selectedPartnerReward.validTo
                        ? new Date(selectedPartnerReward.validTo).toLocaleDateString()
                        : 'Not set'}
                    </span>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-700">Max Redemptions Per Customer: </span>
                    <span className="text-gray-900">
                      {selectedPartnerReward.maxRedemptionsPerCustomer != null
                        ? selectedPartnerReward.maxRedemptionsPerCustomer
                        : 'Unlimited'}
                    </span>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-700">Created: </span>
                    <span className="text-gray-900">
                      {new Date(selectedPartnerReward.createdAt).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Status & Partner Information */}
              <div className="space-y-6">
                <div className="bg-gray-50 rounded-2xl p-6 border-2 border-gray-200">
                  <h4 className="text-lg font-bold text-gray-900 mb-4">Status</h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-semibold text-gray-700">Approval Status: </span>
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          selectedPartnerReward.approvalStatus === 'APPROVED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : selectedPartnerReward.approvalStatus === 'REJECTED'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {selectedPartnerReward.approvalStatus}
                      </span>
                    </div>
                    {selectedPartnerReward.rejectionReason && (
                      <div>
                        <span className="font-semibold text-gray-700">Rejection Reason: </span>
                        <span className="text-rose-600">{selectedPartnerReward.rejectionReason}</span>
                      </div>
                    )}
                    <div>
                      <span className="font-semibold text-gray-700">Redemptions: </span>
                      <span className="text-gray-900">
                        {selectedPartnerReward.redemptions?.length || 0}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-2xl p-6 border-2 border-gray-200">
                  <h4 className="text-lg font-bold text-gray-900 mb-4">Partner/Business Information</h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-semibold text-gray-700">Business: </span>
                      <span className="text-gray-900 font-bold">
                        {selectedPartnerReward.tenant?.name || 'Unknown'}
                      </span>
                    </div>
                    {selectedPartnerReward.tenant?.partnerUser ? (
                      <>
                        <div>
                          <span className="font-semibold text-gray-700">Partner Name: </span>
                          <span className="text-gray-900">
                            {selectedPartnerReward.tenant.partnerUser.name}
                          </span>
                        </div>
                        <div>
                          <span className="font-semibold text-gray-700">Partner Email: </span>
                          <span className="text-gray-900">
                            {selectedPartnerReward.tenant.partnerUser.email}
                          </span>
                        </div>
                      </>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end flex-wrap gap-3 mt-6 pt-6 border-t border-gray-200">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setShowPartnerRewardDetailsModal(false);
                  setSelectedPartnerReward(null);
                }}
                className="px-6 py-3 border-2 border-gray-300 text-lg font-bold rounded-2xl text-gray-700 bg-white hover:bg-gray-50 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                Close
              </motion.button>
              {selectedPartnerReward.approvalStatus === 'PENDING' && (
                <>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={async () => {
                      const updated = await handleApproveReward(selectedPartnerReward.id);
                      if (updated) setSelectedPartnerReward(prev => prev ? { ...prev, ...updated } : null);
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
                      const updated = await handleRejectReward(selectedPartnerReward.id);
                      if (updated) setSelectedPartnerReward(prev => prev ? { ...prev, ...updated } : null);
                    }}
                    className="px-6 py-3 border-2 border-rose-600 text-lg font-bold rounded-2xl text-white bg-rose-600 hover:bg-rose-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    <X className="h-5 w-5 inline mr-2" />
                    Reject
                  </motion.button>
                </>
              )}
            </div>
          </motion.div>
        </div>
      )}

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
                    expiresAt: e.target.value ? new Date(e.target.value).toISOString() : undefined 
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
                    usedAt: e.target.value ? new Date(e.target.value).toISOString() : undefined 
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
                    <span className="font-semibold text-gray-700">Discount: </span>
                    <span className="text-gray-900 font-bold">{formatDiscount(editingVoucher.reward)}</span>
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