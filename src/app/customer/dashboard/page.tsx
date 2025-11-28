'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDate } from '@/lib/utils/date';
import SuspendedUserWrapper from '@/components/SuspendedUserWrapper';
import ScrollControls from '@/components/ScrollControls';
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
import { QRCodeSVG } from 'qrcode.react';

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
  const [qrCode, setQrCode] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [showCardModal, setShowCardModal] = useState(false);
  const router = useRouter();

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

        // Fetch QR code and customer ID
        try {
          const qrResponse = await fetch('/api/customer/qr');
          if (qrResponse.ok) {
            const qrData = await qrResponse.json();
            setQrCode(qrData.qrCode || '');
            setCustomerId(qrData.customerId || '');
          }
        } catch (error) {
          console.error('Error fetching QR code:', error);
        }

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

  const getAllTiersInfo = () => {
    const tiers = [
      { name: 'Standard', points: 0, color: 'from-blue-500 to-blue-600' },
      { name: 'Silver', points: 100, color: 'from-gray-400 to-gray-600' },
      { name: 'Gold', points: 500, color: 'from-yellow-400 to-orange-500' },
      { name: 'Platinum', points: 1000, color: 'from-purple-500 to-pink-500' }
    ];
    
    const maxPoints = 1000; // Use 1000 as max for visualization since Platinum is unlimited
    const currentPoints = pointsData.points;
    const overallProgress = Math.min((currentPoints / maxPoints) * 100, 100);
    
    return { tiers, maxPoints, currentPoints, overallProgress };
  };

  const tierInfo = getAllTiersInfo();

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
      <ScrollControls />
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

        </div>

        {/* Digital Card and Available Discounts Side by Side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Digital Card - Bank Card Style */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex flex-col"
          >
            <h2 className="text-heading font-semibold text-gray-900 mb-4">Your Digital Card</h2>
            {loading ? (
              <div className="animate-pulse">
                <div className="aspect-[85.6/53.98] w-full bg-gray-200 rounded-2xl"></div>
              </div>
            ) : (
              <div 
                onClick={() => setShowCardModal(true)}
                className="relative w-full bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 rounded-2xl shadow-2xl overflow-hidden cursor-pointer hover:scale-105 transition-transform duration-200"
                style={{ minHeight: '500px' }}
              >
                {/* Decorative elements */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-10 rounded-full -mr-32 -mt-32"></div>
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-white opacity-10 rounded-full -ml-24 -mb-24"></div>
                
                {/* Card Content */}
                <div className="relative h-full p-6 flex flex-col justify-between">
                  {/* Top Section */}
                  <div className="flex flex-wrap items-start justify-between gap-3 mb-2">
                    <div className="min-w-0">
                      <h3 className="text-[18px] font-medium text-white mb-1" style={{ fontFamily: 'var(--font-roboto)' }}>LocalPerks</h3>
                      <p className="text-blue-200 text-[18px] font-medium" style={{ fontFamily: 'var(--font-roboto)' }}>Loyalty Card</p>
                    </div>
                    {/* Chip */}
                    <div className="w-10 h-8 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-md shadow-lg flex-shrink-0"></div>
                  </div>
                  
                  {/* Middle Section - QR Code */}
                  <div className="flex justify-center my-2 flex-shrink-0">
                    <div className="bg-white rounded-xl p-4 shadow-xl w-[232px] h-[232px] flex items-center justify-center">
                      <QRCodeSVG 
                        value={qrCode || `rewards-${session?.user?.email || 'guest'}-app`} 
                        size={200} 
                        level="H"
                        className="rounded-lg"
                      />
                    </div>
                  </div>
                  
                  {/* Bottom Section */}
                  <div className="space-y-2 mt-2">
                    {/* Customer Name - Aligned */}
                    <div className="min-h-[28px] flex items-center">
                      <p className="text-white text-[18px] font-medium tracking-wider" style={{ fontFamily: 'var(--font-roboto)' }}>
                        {session?.user?.name || 'Member'}
                      </p>
                    </div>
                    
                    {/* Customer ID - Aligned */}
                    <div className="min-h-[28px] flex items-center">
                      {customerId ? (
                        <div className="flex items-center space-x-2">
                          <p className="text-blue-200 text-[18px] font-medium uppercase" style={{ fontFamily: 'var(--font-roboto)' }}>ID:</p>
                          <p className="text-white text-[18px] font-medium break-all uppercase" style={{ fontFamily: 'var(--font-roboto)' }}>{customerId}</p>
                        </div>
                      ) : (
                        <div className="h-[28px]"></div>
                      )}
                    </div>
                    
                    {/* Points and Tier - Aligned */}
                    <div className="flex flex-wrap items-start justify-between gap-4 pt-2 border-t border-blue-500 border-opacity-30 min-h-[60px]">
                      <div className="min-w-[140px]">
                        <p className="text-blue-200 text-[18px] tracking-wide font-medium" style={{ fontFamily: 'var(--font-roboto)' }}>Points</p>
                        <p className="text-white text-[18px] font-medium" style={{ fontFamily: 'var(--font-roboto)' }}>{pointsData.points.toLocaleString()}</p>
                      </div>
                      <div className="text-right min-w-[140px]">
                        <p className="text-blue-200 text-[18px] tracking-wide font-medium" style={{ fontFamily: 'var(--font-roboto)' }}>Tier</p>
                        <p className="text-white text-[18px] font-medium" style={{ fontFamily: 'var(--font-roboto)' }}>{pointsData.tier}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </motion.div>

          {/* Available Discounts Card - Bank Card Style */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
            className="flex flex-col"
          >
            <h2 className="text-heading font-semibold text-gray-900 mb-4">Available Discounts</h2>
            <div className="relative w-full bg-gradient-to-br from-green-500 via-emerald-600 to-teal-700 rounded-2xl shadow-2xl overflow-hidden" style={{ minHeight: '500px' }}>
              {/* Decorative elements */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-10 rounded-full -mr-32 -mt-32"></div>
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-white opacity-10 rounded-full -ml-24 -mb-24"></div>
              
              {/* Card Content */}
              <div className="relative h-full p-6 flex flex-col justify-between" style={{ minHeight: '500px' }}>
                {/* Top Section */}
                <div className="flex flex-wrap items-start justify-between gap-3 mb-2">
                  <div className="min-w-0">
                    <h3 className="text-[18px] font-medium text-white mb-1" style={{ fontFamily: 'var(--font-roboto)' }}>LocalPerks</h3>
                    <p className="text-green-100 text-[18px] font-medium" style={{ fontFamily: 'var(--font-roboto)' }}>Discount Card</p>
                  </div>
                  {/* Chip */}
                  <div className="w-10 h-8 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-md shadow-lg flex-shrink-0"></div>
                </div>
                
                {/* Middle Section - Discount Amount */}
                <div className="flex flex-col items-center justify-center my-2 flex-shrink-0">
                  <div className="bg-white bg-opacity-20 rounded-xl p-4 shadow-xl w-[232px] h-[232px] flex flex-col items-center justify-center backdrop-blur-sm">
                    <p className="text-green-100 text-[18px] tracking-widest mb-3 font-medium" style={{ fontFamily: 'var(--font-roboto)' }}>Available</p>
                    <p className="text-white text-[18px] font-medium tracking-tight" style={{ fontFamily: 'var(--font-roboto)' }}>£{Math.floor(availableDiscount)}</p>
                    <p className="text-green-100 text-[18px] mt-3 font-medium" style={{ fontFamily: 'var(--font-roboto)' }}>Redeemable Value</p>
                  </div>
                </div>
                
                {/* Bottom Section */}
                <div className="space-y-2 mt-2">
                  {/* Cardholder Name - Aligned */}
                  <div className="min-h-[28px] flex items-center">
                    <p className="text-white text-[18px] font-medium tracking-wider" style={{ fontFamily: 'var(--font-roboto)' }}>
                      {session?.user?.name || 'Member'}
                    </p>
                  </div>
                  
                  {/* Spacer to match Customer ID row on left card */}
                  <div className="min-h-[28px] flex items-center">
                    <div className="h-[28px]"></div>
                  </div>
                  
                  {/* Discount Value - Aligned */}
                  <div className="flex items-center justify-between pt-2 border-t border-green-400 border-opacity-30 min-h-[60px]">
                    <div className="text-right w-full">
                      <p className="text-green-100 text-[18px] tracking-wide font-medium" style={{ fontFamily: 'var(--font-roboto)' }}>Value</p>
                      <p className="text-white text-[18px] font-medium" style={{ fontFamily: 'var(--font-roboto)' }}>£{Math.floor(availableDiscount)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Digital Card Modal */}
        <AnimatePresence>
          {showCardModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setShowCardModal(false);
                router.push('/customer/dashboard');
              }}
              className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4 overflow-y-auto"
            >
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="relative w-full max-w-xl my-8"
              >
                {/* Enlarged Digital Card */}
                <div className="relative w-full bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 rounded-3xl shadow-2xl overflow-hidden" style={{ minHeight: '450px', maxHeight: '85vh' }}>
                  {/* Decorative elements */}
                  <div className="absolute top-0 right-0 w-72 h-72 bg-white opacity-10 rounded-full -mr-36 -mt-36"></div>
                  <div className="absolute bottom-0 left-0 w-56 h-56 bg-white opacity-10 rounded-full -ml-28 -mb-28"></div>
                  
                  {/* Card Content */}
                  <div className="relative h-full p-5 md:p-6 lg:p-7 flex flex-col justify-between" style={{ minHeight: '450px' }}>
                    {/* Top Section */}
                    <div className="flex flex-wrap items-start justify-between gap-3 mb-2">
                      <div className="min-w-0">
                        <h3 className="text-2xl md:text-3xl lg:text-4xl font-medium text-white mb-1" style={{ fontFamily: 'var(--font-roboto)' }}>LocalPerks</h3>
                        <p className="text-blue-200 text-sm md:text-base font-medium" style={{ fontFamily: 'var(--font-roboto)' }}>Loyalty Card</p>
                      </div>
                      {/* Chip */}
                      <div className="w-11 h-8 md:w-12 md:h-9 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-lg shadow-lg"></div>
                    </div>
                    
                    {/* Middle Section - QR Code */}
                    <div className="flex justify-center my-2 flex-shrink-0">
                      <div className="bg-white rounded-xl p-3 md:p-4 shadow-xl">
                        <QRCodeSVG 
                          value={qrCode || `rewards-${session?.user?.email || 'guest'}-app`} 
                          size={210}
                          level="H"
                          className="rounded-lg"
                        />
                      </div>
                    </div>
                    
                    {/* Bottom Section */}
                    <div className="space-y-2 mt-2">
                      {/* Customer Name */}
                      <div>
                        <p className="text-white text-sm md:text-base lg:text-lg font-medium tracking-wider" style={{ fontFamily: 'var(--font-roboto)' }}>
                          {session?.user?.name || 'Member'}
                        </p>
                      </div>
                      
                      {/* Customer ID */}
                      {customerId && (
                        <div className="flex items-center space-x-2">
                          <p className="text-blue-200 text-sm md:text-base font-medium uppercase" style={{ fontFamily: 'var(--font-roboto)' }}>ID:</p>
                          <p className="text-white text-sm md:text-base font-medium break-all uppercase" style={{ fontFamily: 'var(--font-roboto)' }}>{customerId}</p>
                        </div>
                      )}
                      
                      {/* Points and Tier */}
                      <div className="flex flex-wrap items-start justify-between gap-4 pt-2 border-t border-blue-500 border-opacity-30">
                        <div className="min-w-[140px]">
                          <p className="text-blue-200 text-xs md:text-sm tracking-wide font-medium" style={{ fontFamily: 'var(--font-roboto)' }}>Points</p>
                          <p className="text-white text-xl md:text-2xl lg:text-3xl font-medium" style={{ fontFamily: 'var(--font-roboto)' }}>{pointsData.points.toLocaleString()}</p>
                        </div>
                        <div className="text-right min-w-[140px]">
                          <p className="text-blue-200 text-xs md:text-sm tracking-wide font-medium" style={{ fontFamily: 'var(--font-roboto)' }}>Tier</p>
                          <p className="text-white text-lg md:text-xl lg:text-2xl font-medium" style={{ fontFamily: 'var(--font-roboto)' }}>{pointsData.tier}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Close hint */}
                <p className="text-white text-sm text-center mt-4 opacity-75">
                  Click outside to close
                </p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Progress Bar - All Tiers */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100"
        >
          <h2 className="font-semibold text-gray-900 mb-6" style={{ fontSize: '18px' }}>Tier Progress</h2>
          <div className="space-y-4" style={{ padding: '10px' }}>
            {/* Progress Bar Container */}
            <div className="relative pb-14">
              {/* Background Bar */}
              <div className="w-full bg-gray-200 rounded-full h-4 relative">
                {/* Gradient Progress Fill - Full gradient across all tiers */}
                <div
                  className="h-4 rounded-full transition-all duration-500 relative z-0"
                  style={{ 
                    width: `${tierInfo.overallProgress}%`,
                    background: 'linear-gradient(to right, #3b82f6 0%, #60a5fa 10%, #9ca3af 25%, #6b7280 35%, #facc15 50%, #fb923c 65%, #a855f7 85%, #ec4899 100%)'
                  }}
                ></div>
                
                {/* Tier Marker Lines - positioned on the progress bar */}
                {tierInfo.tiers.map((tier, index) => {
                  const position = (tier.points / tierInfo.maxPoints) * 100;
                  const isCurrentTier = pointsData.tier === tier.name;
                  
                  return (
                    <div
                      key={`marker-${tier.name}`}
                      className="absolute top-0 z-10"
                      style={{ left: `${position}%`, transform: 'translateX(-50%)' }}
                    >
                      {/* Vertical Line Marker */}
                      <div 
                        className={`w-0.5 transition-all duration-300 ${
                          isCurrentTier ? 'h-5 bg-black' : 'h-4 bg-gray-600'
                        }`}
                      ></div>
                    </div>
                  );
                })}
              </div>
              
              {/* Tier Labels - below the progress bar */}
              <div className="relative mt-6">
                {tierInfo.tiers.map((tier, index) => {
                  const position = (tier.points / tierInfo.maxPoints) * 100;
                  const isCurrentTier = pointsData.tier === tier.name;
                  const isFirst = index === 0;
                  const isLast = index === tierInfo.tiers.length - 1;
                  
                  // Adjust transform for edge labels to prevent overflow
                  let transformValue = 'translateX(-50%)';
                  if (isFirst) transformValue = 'translateX(0)';
                  if (isLast) transformValue = 'translateX(-100%)';
                  
                  return (
                    <div
                      key={`label-${tier.name}`}
                      className="absolute flex flex-col items-center"
                      style={{ 
                        left: `${position}%`, 
                        transform: transformValue,
                        maxWidth: '80px',
                        textAlign: 'center'
                      }}
                    >
                      {/* Tier Name */}
                      <div className={`font-semibold text-black whitespace-nowrap ${
                        isCurrentTier ? 'font-bold' : ''
                      }`} style={{ fontSize: '18px' }}>
                        {tier.name}
                      </div>
                      {/* Tier Points */}
                      <div className="text-black mt-1 font-medium whitespace-nowrap" style={{ fontSize: '18px' }}>
                        {tier.points === 0 ? '0' : tier.points.toLocaleString()} pts
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            
            {/* Current Status */}
            <div className="flex justify-between items-center pt-3 border-t border-gray-100">
              <div>
                <span className="text-black" style={{ fontSize: '18px' }}>Current Tier: </span>
                <span className="font-semibold text-black" style={{ fontSize: '18px' }}>{pointsData.tier}</span>
              </div>
              <div className="text-right">
                <span className="text-black" style={{ fontSize: '18px' }}>{tierInfo.currentPoints.toLocaleString()} pts</span>
              </div>
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
