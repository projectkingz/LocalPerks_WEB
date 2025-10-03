'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

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
  customer: {
    id: string;
    name: string;
    email: string;
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

export default function RewardsPage() {
  const { data: session } = useSession();
  const [pointsData, setPointsData] = useState<PointsData>({ points: 0, tier: 'Standard' });
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedReward, setSelectedReward] = useState<string | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);

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

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError('');

        // Fetch points data
        const pointsResponse = await fetch('/api/points');
        if (!pointsResponse.ok) {
          setError('Failed to fetch points data');
          return;
        }
        const pointsData = await pointsResponse.json();
        console.log('Points data fetched:', pointsData);
        setPointsData(pointsData);

        // Fetch rewards
        const rewardsResponse = await fetch('/api/rewards');
        if (!rewardsResponse.ok) {
          setError('Failed to fetch rewards');
          return;
        }
        const rewardsData = await rewardsResponse.json();
        console.log('Rewards data fetched:', rewardsData);
        setRewards(rewardsData);

        // Fetch vouchers
        const vouchersResponse = await fetch('/api/rewards/vouchers');
        if (vouchersResponse.ok) {
          const vouchersData = await vouchersResponse.json();
          console.log('Vouchers data fetched:', vouchersData);
          setVouchers(vouchersData);
        }
      } catch (error) {
        setError('Failed to load data');
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

    console.log('Reward selected:', {
      rewardId,
      rewardName: reward.name,
      rewardPoints: reward.points,
      userPoints: pointsData.points,
      hasEnoughPoints: pointsData.points >= reward.points
    });

    if (pointsData.points < reward.points) {
      console.log('Insufficient points - user has', pointsData.points, 'but needs', reward.points);
      setError('Not enough points for this reward');
      return;
    }

    setSelectedReward(rewardId);
    setShowConfirmation(true);
    setError('');
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
    setError('');

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
      setSuccess(`Voucher created successfully! Your voucher code is: ${data.voucher.code}`);
      
      // Update points
      const pointsResponse = await fetch('/api/points');
      const pointsData = await pointsResponse.json();
      setPointsData(pointsData);

      // Update vouchers
      const vouchersResponse = await fetch('/api/rewards/vouchers');
      if (vouchersResponse.ok) {
        const vouchersData = await vouchersResponse.json();
        setVouchers(vouchersData);
      }
    } catch (error) {
      console.error('Error in createVoucher:', error);
      setError(error instanceof Error ? error.message : 'Failed to create voucher');
    } finally {
      setLoading(false);
      setShowConfirmation(false);
      setSelectedReward(null);
    }
  };

  const getRewardName = (rewardId: string) => {
    const reward = rewards.find(r => r.id === rewardId);
    return reward ? reward.name : 'Unknown Reward';
  };

  return (
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
              const canRedeem = pointsData.points >= reward.points;
              return (
                <div
                  key={reward.id}
                  className={`rounded-lg p-6 text-white transition-all duration-200 ${
                    canRedeem
                      ? 'cursor-pointer hover:shadow-lg hover:scale-105'
                      : 'opacity-50'
                  }`}
                  style={{ backgroundColor: colors.primary }}
                  onClick={() => handleRewardSelect(reward.id)}
                >
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
                      Redeem At: {reward.tenant?.name || 'Unknown Business'}
                    </p>
                  </div>
                  
                  <div className="flex justify-center items-center gap-2">
                    <p className="text-lg font-bold text-white">
                      {reward.points} points
                    </p>
                    {canRedeem ? (
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5 text-white opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* My Vouchers */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">My Vouchers</h2>
        {vouchers.length === 0 ? (
          <p className="text-gray-600">No vouchers yet. Redeem a reward to get started!</p>
        ) : (
          <div className="space-y-4">
            {vouchers.map((voucher) => (
              <div key={voucher.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-semibold">{voucher.reward.name}</h3>
                    <p className="text-sm text-gray-600">{voucher.reward.description}</p>
                    <p className="text-sm text-gray-600">
                      Redeemed for {voucher.redemption.points} points
                    </p>
                    <div className="mt-2">
                      <p className="text-xs text-gray-500">
                        Created: {new Date(voucher.createdAt).toLocaleDateString()}
                      </p>
                      {voucher.expiresAt && (
                        <p className="text-xs text-gray-500">
                          Expires: {new Date(voucher.expiresAt).toLocaleDateString()}
                        </p>
                      )}
                      {voucher.usedAt && (
                        <p className="text-xs text-gray-500">
                          Used: {new Date(voucher.usedAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right ml-4">
                    <div className="mb-2">
                      <code className="text-sm bg-gray-100 px-2 py-1 rounded font-mono">
                        {voucher.code}
                      </code>
                    </div>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      voucher.status === 'active' ? 'bg-green-100 text-green-800' :
                      voucher.status === 'used' ? 'bg-blue-100 text-blue-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {voucher.status}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {showConfirmation && selectedReward && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Confirm Reward</h3>
            <p className="text-gray-600 mb-4">
              Are you sure you want to redeem{' '}
              {rewards.find(r => r.id === selectedReward)?.name} for{' '}
              {rewards.find(r => r.id === selectedReward)?.points} points?
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

      {/* Error and Success Messages */}
      {error && (
        <div className="fixed top-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}
      {success && (
        <div className="fixed top-4 right-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
          {success}
        </div>
      )}
    </div>
  );
} 