'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import toast from 'react-hot-toast';
import ScrollControls from '@/components/ScrollControls';

interface PointsData {
  points: number;
  tier: string;
}

interface Reward {
  id: string;
  name: string;
  description: string;
  points: number;
  createdAt: string;
  tenant: {
    id: string;
    name: string;
  };
  hasVoucher?: boolean;
  voucherStatus?: string | null;
  voucherUsedAt?: Date | null;
}

export default function RewardsPage() {
  const { data: session } = useSession();
  const [pointsData, setPointsData] = useState<PointsData>({ points: 0, tier: 'Standard' });
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReward, setSelectedReward] = useState<string | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [selectedDiscount, setSelectedDiscount] = useState<number | null>(null);
  const [showDiscountConfirmation, setShowDiscountConfirmation] = useState(false);
  const [availableDiscount, setAvailableDiscount] = useState<number>(0);
  const [pointFaceValue, setPointFaceValue] = useState<number>(0.008);
  const [availableDiscounts, setAvailableDiscounts] = useState<number[]>([]);

  // Color variations with same visual weight as vibrant blue
  const getCardColors = (index: number) => {
    const colorSets = [
      { primary: '#2176FF', light: '#EFF6FF' }, // Blue
      { primary: '#DC2626', light: '#FEF2F2' }, // Red
      { primary: '#059669', light: '#ECFDF5' }, // Green
      { primary: '#7C3AED', light: '#F5F3FF' }, // Purple
      { primary: '#EA580C', light: '#FFF7ED' }, // Orange
      { primary: '#0891B2', light: '#F0F9FF' }, // Cyan
      { primary: '#BE185D', light: '#FDF2F8' }, // Pink
      { primary: '#CA8A04', light: '#FFFBEB' }, // Yellow
    ];
    return colorSets[index % colorSets.length];
  };

  // Helper to recalculate available monetary discount and tiers
  const recalculateDiscounts = (points: number, faceValue: number) => {
    if (!faceValue || points < 0) {
      setAvailableDiscount(0);
      setAvailableDiscounts([]);
      return;
    }

    const totalDiscount = points * faceValue;
    setAvailableDiscount(totalDiscount);

    const discounts: number[] = [];
    const maxDiscountPounds = Math.floor(totalDiscount);
    for (let i = 1; i <= 20; i++) {
      if (i <= maxDiscountPounds) {
        discounts.push(i);
      }
    }
    setAvailableDiscounts(discounts);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch points data
        const pointsResponse = await fetch('/api/points');
        if (!pointsResponse.ok) {
          toast.error('Failed to fetch points data');
          return;
        }
        const pointsJson = await pointsResponse.json();
        console.log('Points data fetched:', pointsJson);
        setPointsData(pointsJson);

        // Fetch points configuration to get face value
        const configResponse = await fetch('/api/points/config');
        if (configResponse.ok) {
          const configData = await configResponse.json();
          if (configData.success && configData.config) {
            const faceValue = configData.config.pointFaceValue || 0.008;
            setPointFaceValue(faceValue);
            recalculateDiscounts(pointsJson.points, faceValue);
          } else {
            // Fallback: still compute with default face value if config missing
            recalculateDiscounts(pointsJson.points, pointFaceValue || 0.008);
          }
        }

        // Fetch rewards
        const rewardsResponse = await fetch('/api/rewards');
        if (!rewardsResponse.ok) {
          toast.error('Failed to fetch rewards');
          return;
        }
        const rewardsData = await rewardsResponse.json();
        console.log('Rewards data fetched:', rewardsData);
        setRewards(rewardsData);
      } catch (error) {
        toast.error('Failed to load data');
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (session?.user?.email) {
      fetchData();
    }
  }, [session?.user?.email]);

  const handleRewardSelect = (rewardId: string) => {
    const reward = rewards.find(r => r.id === rewardId);
    if (!reward) return;

    // Rewards/vouchers are free (0 points) - default to 0 if points field is missing
    const rewardPoints = reward.points ?? 0;

    console.log('Reward selected:', {
      rewardId,
      rewardName: reward.name,
      rewardPoints,
      userPoints: pointsData.points,
      hasEnoughPoints: pointsData.points >= rewardPoints
    });

    if (pointsData.points < rewardPoints) {
      console.log('Insufficient points - user has', pointsData.points, 'but needs', rewardPoints);
      toast.error('Not enough points for this reward');
      return;
    }

    setSelectedReward(rewardId);
    setShowConfirmation(true);
  };

  const createVoucher = async () => {
    if (!selectedReward || !session?.user?.email) return;

    const selectedRewardData = rewards.find(r => r.id === selectedReward);
    if (!selectedRewardData) return;

    console.log('Creating voucher with data:', {
      rewardId: selectedReward,
      points: selectedRewardData.points,
      userEmail: session.user.email
    });

    setLoading(true);

    try {
      const requestBody = {
        rewardId: selectedReward,
        points: selectedRewardData.points
      };
      
      console.log('Sending request to /api/rewards/vouchers:', requestBody);
      
      const response = await fetch('/api/rewards/vouchers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error response:', errorData);
        throw new Error(errorData.error || 'Failed to create voucher');
      }

      const data = await response.json();
      console.log('Success response:', data);
      toast.success(`Voucher created! View it in Vouchers. Code: ${data.voucher.code}`);
      
      // Update points
      const pointsResponse = await fetch('/api/points');
      const updatedPoints = await pointsResponse.json();
      setPointsData(updatedPoints);
      recalculateDiscounts(updatedPoints.points, pointFaceValue);
    } catch (error) {
      console.error('Error in createVoucher:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create voucher');
    } finally {
      setLoading(false);
      setShowConfirmation(false);
      setSelectedReward(null);
    }
  };

  const handleDiscountSelect = (discountAmount: number) => {
    const requiredPoints = Math.ceil(discountAmount / pointFaceValue);
    
    console.log('Discount selected:', {
      discountAmount,
      requiredPoints,
      userPoints: pointsData.points,
      hasEnoughPoints: pointsData.points >= requiredPoints
    });

    if (pointsData.points < requiredPoints) {
      toast.error(`Not enough points for £${discountAmount} discount`);
      return;
    }

    setSelectedDiscount(discountAmount);
    setShowDiscountConfirmation(true);
  };

  const redeemDiscount = async () => {
    if (!selectedDiscount || !session?.user?.email) return;

    setLoading(true);

    try {
      const response = await fetch('/api/discounts/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ discountAmount: selectedDiscount })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to redeem discount');
      }

      const data = await response.json();
      toast.success(`Redeemed £${selectedDiscount} discount! View in Vouchers. Code: ${data.voucher?.code || 'N/A'}`);
      
      // Update points
      const pointsResponse = await fetch('/api/points');
      const updatedPoints = await pointsResponse.json();
      setPointsData(updatedPoints);

      // Recalculate available discounts based on the new balance
      recalculateDiscounts(updatedPoints.points, pointFaceValue);
      
      // Refresh rewards list to update voucher status
      const rewardsResponse = await fetch('/api/rewards');
      if (rewardsResponse.ok) {
        const rewardsData = await rewardsResponse.json();
        setRewards(rewardsData);
      }
    } catch (error) {
      console.error('Error redeeming discount:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to redeem discount');
    } finally {
      setLoading(false);
      setShowDiscountConfirmation(false);
      setSelectedDiscount(null);
    }
  };

  return (
    <>
      <ScrollControls />
      <div className="space-y-6">
        <h1 className="text-3xl font-bold mb-8">Rewards</h1>

      {/* Points Balance */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold">Available Points</h2>
            <p className="text-3xl font-bold text-blue-600 mt-2">
              {loading ? 'Loading...' : pointsData.points}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Current Tier</p>
            <p className="text-lg font-semibold">{pointsData.tier}</p>
          </div>
        </div>
      </div>

      {/* Available Discounts Summary */}
      <div className="bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg rounded-lg p-6 text-white">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold">Available Discounts</h2>
            <p className="text-4xl font-bold mt-2">£{Math.floor(availableDiscount)}</p>
            <p className="text-sm text-green-100 mt-2">
              Redeemable discount value
            </p>
          </div>
          <div className="text-5xl">🎟️</div>
        </div>
      </div>

      {/* Discount Vouchers */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Redeem Discount Voucher</h2>
        <p className="text-gray-600 mb-6">Enter any amount up to your available discount balance</p>
        
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-500 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading...</p>
          </div>
        ) : Math.floor(availableDiscount) < 1 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <p className="text-gray-600">You need at least 100 points (£1.00 value) to redeem discount vouchers.</p>
            <p className="text-sm text-gray-500 mt-2">Current: {pointsData.points} points = £{availableDiscount.toFixed(2)}</p>
          </div>
        ) : (
          <div className="max-w-md mx-auto">
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Discount Amount (£)
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-semibold text-gray-600">£</span>
                <input
                  type="number"
                  min="1"
                  max={Math.floor(availableDiscount)}
                  step="1"
                  value={selectedDiscount || ''}
                  onChange={(e) => {
                    const value = parseInt(e.target.value);
                    if (!isNaN(value) && value > 0) {
                      setSelectedDiscount(value);
                    } else {
                      setSelectedDiscount(null);
                    }
                  }}
                  placeholder="0"
                  className="block w-full pl-12 pr-4 py-4 text-3xl font-bold border-2 border-gray-300 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-200 transition"
                />
              </div>
              <div className="mt-2 space-y-1">
                <div className="text-sm text-gray-500">
                  Maximum: £{Math.floor(availableDiscount)}
                </div>
                {selectedDiscount && (
                  <div className="text-sm text-green-600 font-medium">
                    {Math.ceil(selectedDiscount / pointFaceValue)} points required
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={() => selectedDiscount && handleDiscountSelect(selectedDiscount)}
              disabled={!selectedDiscount || selectedDiscount > Math.floor(availableDiscount) || loading}
              className="w-full py-4 px-6 bg-green-600 text-white text-lg font-semibold rounded-xl hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
            >
              {selectedDiscount ? `Redeem £${selectedDiscount} Discount` : 'Enter Amount'}
            </button>

            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                💡 <strong>Tip:</strong> You can enter any whole pound amount from £1 to £{Math.floor(availableDiscount)}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Available Rewards */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Available Rewards</h2>
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading rewards...</p>
          </div>
        ) : rewards.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-600">No rewards available at the moment.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {rewards.map((reward, index) => {
              const colors = getCardColors(index);
              // Rewards/vouchers are free (0 points) - default to 0 if points field is missing
              const rewardPoints = reward.points ?? 0;
              const canRedeem = pointsData.points >= rewardPoints;
              const isRedeemed = reward.hasVoucher === true && reward.voucherStatus === 'active';
              const isSuspended = reward.hasVoucher === true && reward.voucherStatus === 'suspended';
              const isClickable = canRedeem && !isRedeemed && !isSuspended;
              
              return (
                <div
                  key={reward.id}
                  className={`rounded-lg p-6 text-white transition-all duration-200 relative ${
                    isClickable
                      ? 'cursor-pointer hover:shadow-lg hover:scale-105'
                      : isSuspended
                      ? 'opacity-60'
                      : 'opacity-75'
                  }`}
                  style={{ backgroundColor: colors.primary }}
                  onClick={() => isClickable && handleRewardSelect(reward.id)}
                >
                  {/* Redeemed Badge */}
                  {isRedeemed && (
                    <div className="absolute top-2 right-2 bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                      ✓ Redeemed
                    </div>
                  )}
                  
                  {/* Suspended Badge */}
                  {isSuspended && (
                    <div className="absolute top-2 right-2 bg-amber-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                      ⚠ Suspended
                    </div>
                  )}
                  
                  <div className="flex items-center justify-center mb-4">
                    <div className="w-12 h-12 rounded-full bg-white bg-opacity-20 flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                      </svg>
                    </div>
                  </div>
                  
                  <h3 className="font-bold text-xl mb-2 text-center">{reward.name}</h3>
                  <p className="text-sm text-white text-opacity-90 mb-4 text-center">{reward.description}</p>
                  
                  <div 
                    className="rounded-lg p-3 mb-4 text-center"
                    style={{ backgroundColor: colors.light }}
                  >
                    <p className="text-sm font-semibold" style={{ color: colors.primary }}>
                      Redeem At: {reward.tenant?.name === 'LocalPerks System' || reward.tenant?.name === 'System Default Tenant'
                        ? 'Any LocalPerks Partner'
                        : (reward.tenant?.name || 'Unknown Business')}
                    </p>
                  </div>
                  
                  <div className="flex justify-center items-center gap-2">
                    <p className="text-lg font-bold text-white">
                      {rewardPoints === 0 ? 'Free' : `${rewardPoints} points`}
                    </p>
                    {isRedeemed ? (
                      <svg className="w-5 h-5 text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    ) : isSuspended ? (
                      <svg className="w-5 h-5 text-amber-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    ) : canRedeem ? (
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5 text-white opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    )}
                  </div>
                  
                  {isRedeemed && (
                    <p className="text-xs text-white text-opacity-80 text-center mt-2">
                      Voucher created - view in Vouchers page
                    </p>
                  )}
                  
                  {isSuspended && (
                    <p className="text-xs text-white text-opacity-80 text-center mt-2">
                      This voucher has been suspended and cannot be used
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Reward Confirmation Modal */}
      {showConfirmation && selectedReward && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Confirm Reward</h3>
            <p className="text-gray-600 mb-4">
              Are you sure you want to redeem{' '}
              {rewards.find(r => r.id === selectedReward)?.name}?
              {(rewards.find(r => r.id === selectedReward)?.points ?? 0) > 0 && (
                <> This will cost {rewards.find(r => r.id === selectedReward)?.points ?? 0} points.</>
              )}
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => {
                  setShowConfirmation(false);
                  setSelectedReward(null);
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={createVoucher}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Discount Confirmation Modal */}
      {showDiscountConfirmation && selectedDiscount && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Confirm Discount Redemption</h3>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
              <p className="text-2xl font-bold text-green-600 text-center mb-2">
                £{selectedDiscount} Discount
              </p>
              <p className="text-sm text-gray-600 text-center">
                This will deduct {Math.ceil(selectedDiscount / pointFaceValue)} points from your balance
              </p>
            </div>
            <p className="text-gray-600 mb-4">
              Are you sure you want to redeem this discount?
            </p>
            <div className="bg-yellow-50 border border-yellow-200 rounded p-3 mb-4">
              <p className="text-xs text-yellow-800">
                ⓘ This discount will be recorded as a "SPENT" transaction in your history
              </p>
            </div>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => {
                  setShowDiscountConfirmation(false);
                  setSelectedDiscount(null);
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={redeemDiscount}
                disabled={loading}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
              >
                {loading ? 'Redeeming...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
    </>
  );
} 