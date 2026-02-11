'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Settings, Save, DollarSign, TrendingUp, Percent, AlertCircle, CreditCard, Plus, Edit, Trash2 } from 'lucide-react';
import ScrollControls from '@/components/ScrollControls';

export default function SystemConfigPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [config, setConfig] = useState({
    pointFaceValue: 0.008,
    platformReward: 0.007,
    systemFixedCharge: 0.01,
    systemVariableCharge: 0.06,
  });
  const [subscriptionTiers, setSubscriptionTiers] = useState([
    { id: '', name: 'BASIC', displayName: 'Basic', price: 19, isActive: true },
    { id: '', name: 'PLUS', displayName: 'Plus', price: 20, isActive: true },
    { id: '', name: 'PREMIUM', displayName: 'Premium', price: 21, isActive: true },
    { id: '', name: 'ELITE', displayName: 'Elite', price: 22, isActive: true },
  ]);
  const [editingTier, setEditingTier] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Check for SUPER_ADMIN access
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin?type=admin');
    } else if (status === 'authenticated') {
      if (session?.user?.role !== 'SUPER_ADMIN') {
        console.log('Access denied: User role is', session?.user?.role);
        router.push('/admin'); // Redirect regular admins to dashboard
      }
    }
  }, [status, session, router]);

  // Fetch current configuration
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const response = await fetch('/api/admin/system-config');
        if (response.status === 401) {
          router.push('/admin'); // Unauthorized
          return;
        }
        if (response.ok) {
          const data = await response.json();
          setConfig({
            pointFaceValue: data.pointFaceValue,
            platformReward: data.platformReward || 0.007,
            systemFixedCharge: data.systemFixedCharge,
            systemVariableCharge: data.systemVariableCharge,
          });
          if (data.subscriptionTiers) {
            setSubscriptionTiers(data.subscriptionTiers);
          }
        }
      } catch (error) {
        console.error('Error fetching config:', error);
        setMessage({ type: 'error', text: 'Failed to load configuration' });
      } finally {
        setIsLoading(false);
      }
    };

    if (status === 'authenticated' && session?.user?.role === 'SUPER_ADMIN') {
      fetchConfig();
    }
  }, [status, session, router]);

  const handleSave = async () => {
    setIsSaving(true);
    setMessage(null);

    try {
      const response = await fetch('/api/admin/system-config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...config,
          subscriptionTiers
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: 'Configuration updated successfully' });
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to update configuration' });
      }
    } catch (error) {
      console.error('Error saving config:', error);
      setMessage({ type: 'error', text: 'Failed to save configuration' });
    } finally {
      setIsSaving(false);
    }
  };

  const calculateExampleCharge = (points: number) => {
    const customerAndPlatformReward = points * (config.pointFaceValue + config.platformReward);
    const fixedCharge = points * config.systemFixedCharge;
    const subtotal = customerAndPlatformReward + fixedCharge;
    const total = subtotal * (1 + config.systemVariableCharge);
    return total.toFixed(4);
  };

  const handleTierEdit = (tierName: string) => {
    setEditingTier(tierName);
  };

  const handleTierUpdate = (tierName: string, field: string, value: any) => {
    setSubscriptionTiers(prev => 
      prev.map(tier => 
        tier.name === tierName 
          ? { ...tier, [field]: value }
          : tier
      )
    );
  };

  const handleTierSave = (tierName: string) => {
    setEditingTier(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <>
      <ScrollControls />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center">
            <Settings className="h-8 w-8 text-blue-600 mr-3" />
            System Configuration
          </h1>
          <p className="text-gray-600">
            Configure platform-wide settings for points issuance charges
          </p>
        </motion.div>

        {/* Message */}
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mb-6 p-4 rounded-lg ${
              message.type === 'success'
                ? 'bg-green-50 text-green-800 border border-green-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}
          >
            {message.text}
          </motion.div>
        )}

        {/* Configuration Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100"
        >
          <div className="space-y-6">
            {/* Point Face Value (Customer Reward) */}
            <div className="relative group">
              <input
                type="number"
                step="0.001"
                min="0.001"
                value={config.pointFaceValue}
                onChange={(e) =>
                  setConfig({ ...config, pointFaceValue: parseFloat(e.target.value) || 0 })
                }
                className="block w-full px-8 py-8 text-2xl text-gray-900 bg-gray-50 border-2 border-gray-200 rounded-3xl appearance-none transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-blue-500/30 focus:border-blue-500 focus:bg-white peer group-hover:border-gray-300 shadow-lg hover:shadow-xl min-h-[80px]"
                placeholder=" "
              />
              <label className="absolute text-xl font-medium text-gray-600 duration-200 transform -translate-y-4 scale-75 top-4 z-10 origin-[0] bg-white px-3 peer-focus:px-3 peer-focus:text-blue-600 peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 peer-focus:top-4 peer-focus:scale-75 peer-focus:-translate-y-4 left-3 peer-focus:bg-white group-hover:bg-white flex items-center">
                <DollarSign className="h-5 w-5 text-blue-600 mr-2" />
                Customer Reward - Point Face Value (£ per point)
              </label>
              <p className="mt-2 text-base text-gray-500 font-medium">
                Current: 1 point = £{config.pointFaceValue.toFixed(3)}
              </p>
            </div>

            {/* Platform Reward */}
            <div className="relative group">
              <input
                type="number"
                step="0.001"
                min="0"
                value={config.platformReward}
                onChange={(e) =>
                  setConfig({ ...config, platformReward: parseFloat(e.target.value) || 0 })
                }
                className="block w-full px-8 py-8 text-2xl text-gray-900 bg-gray-50 border-2 border-gray-200 rounded-3xl appearance-none transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-purple-500/30 focus:border-purple-500 focus:bg-white peer group-hover:border-gray-300 shadow-lg hover:shadow-xl min-h-[80px]"
                placeholder=" "
              />
              <label className="absolute text-xl font-medium text-gray-600 duration-200 transform -translate-y-4 scale-75 top-4 z-10 origin-[0] bg-white px-3 peer-focus:px-3 peer-focus:text-purple-600 peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 peer-focus:top-4 peer-focus:scale-75 peer-focus:-translate-y-4 left-3 peer-focus:bg-white group-hover:bg-white flex items-center">
                <DollarSign className="h-5 w-5 text-purple-600 mr-2" />
                Platform Reward (£ per point)
              </label>
              <p className="mt-2 text-base text-gray-500 font-medium">
                Current: £{config.platformReward.toFixed(3)} per point
              </p>
            </div>

            {/* System Fixed Charge */}
            <div className="relative group">
              <input
                type="number"
                step="0.0001"
                min="0"
                value={config.systemFixedCharge}
                onChange={(e) =>
                  setConfig({ ...config, systemFixedCharge: parseFloat(e.target.value) || 0 })
                }
                className="block w-full px-8 py-8 text-2xl text-gray-900 bg-gray-50 border-2 border-gray-200 rounded-3xl appearance-none transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-blue-500/30 focus:border-blue-500 focus:bg-white peer group-hover:border-gray-300 shadow-lg hover:shadow-xl min-h-[80px]"
                placeholder=" "
              />
              <label className="absolute text-xl font-medium text-gray-600 duration-200 transform -translate-y-4 scale-75 top-4 z-10 origin-[0] bg-white px-3 peer-focus:px-3 peer-focus:text-blue-600 peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 peer-focus:top-4 peer-focus:scale-75 peer-focus:-translate-y-4 left-3 peer-focus:bg-white group-hover:bg-white flex items-center">
                <TrendingUp className="h-5 w-5 text-blue-600 mr-2" />
                System Fixed Charge (£ per point)
              </label>
              <p className="mt-2 text-base text-gray-500 font-medium">
                Current: £{config.systemFixedCharge.toFixed(4)} per point issued
              </p>
            </div>

            {/* System Variable Charge */}
            <div className="relative group">
              <input
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={config.systemVariableCharge * 100}
                onChange={(e) =>
                  setConfig({ ...config, systemVariableCharge: (parseFloat(e.target.value) || 0) / 100 })
                }
                className="block w-full px-8 py-8 text-2xl text-gray-900 bg-gray-50 border-2 border-gray-200 rounded-3xl appearance-none transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-blue-500/30 focus:border-blue-500 focus:bg-white peer group-hover:border-gray-300 shadow-lg hover:shadow-xl min-h-[80px]"
                placeholder=" "
              />
              <label className="absolute text-xl font-medium text-gray-600 duration-200 transform -translate-y-4 scale-75 top-4 z-10 origin-[0] bg-white px-3 peer-focus:px-3 peer-focus:text-blue-600 peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 peer-focus:top-4 peer-focus:scale-75 peer-focus:-translate-y-4 left-3 peer-focus:bg-white group-hover:bg-white flex items-center">
                <Percent className="h-5 w-5 text-blue-600 mr-2" />
                System Variable Charge (Issuance Margin %)
              </label>
              <p className="mt-2 text-base text-gray-500 font-medium">
                Current: {(config.systemVariableCharge * 100).toFixed(2)}% margin on issuance
              </p>
            </div>

            {/* Formula Explanation */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mt-6">
              <h3 className="font-semibold text-blue-900 mb-3">Points Issue Charge Formula</h3>
              <p className="text-blue-800 font-mono text-sm mb-4">
                [(Points × (Customer Reward + Platform Reward)) + (Points × System Fixed Charge)] × (1 + System Variable Charge)
              </p>
              <div className="bg-white rounded-lg p-4 border border-blue-100">
                <p className="text-sm text-gray-700 mb-2 font-medium">Example Calculation:</p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">1,000 points:</span>
                    <span className="font-mono font-semibold text-gray-900">
                      £{calculateExampleCharge(1000)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">5,000 points:</span>
                    <span className="font-mono font-semibold text-gray-900">
                      £{calculateExampleCharge(5000)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">10,000 points:</span>
                    <span className="font-mono font-semibold text-gray-900">
                      £{calculateExampleCharge(10000)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end pt-6">
              <motion.button
                whileHover={{ scale: isSaving ? 1 : 1.02 }}
                whileTap={{ scale: isSaving ? 1 : 0.98 }}
                onClick={handleSave}
                disabled={isSaving}
                className={`group relative flex items-center justify-center py-8 px-8 border border-transparent text-2xl font-bold rounded-3xl text-white shadow-xl transition-all duration-200 min-h-[80px] ${
                  isSaving
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-offset-2 focus:ring-blue-500 hover:shadow-2xl transform hover:scale-[1.02]'
                }`}
              >
                <Save className="h-6 w-6 mr-3" />
                <span>{isSaving ? 'Saving...' : 'Save Configuration'}</span>
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* Subscription Tiers Configuration */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100 mt-8"
        >
          <div className="flex items-center mb-6">
            <CreditCard className="h-6 w-6 text-blue-600 mr-3" />
            <h2 className="text-2xl font-bold text-gray-900">Subscription Tiers</h2>
          </div>
          
          <p className="text-gray-600 mb-6">
            Configure monthly subscription fees for partner businesses. All partners start with Basic tier.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {subscriptionTiers.map((tier) => (
              <div key={tier.name} className="border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">{tier.displayName}</h3>
                  <button
                    onClick={() => handleTierEdit(tier.name)}
                    className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Display Name
                    </label>
                    {editingTier === tier.name ? (
                      <input
                        type="text"
                        value={tier.displayName}
                        onChange={(e) => handleTierUpdate(tier.name, 'displayName', e.target.value)}
                        className="w-full px-6 py-6 text-xl text-gray-900 bg-gray-50 border-2 border-gray-200 rounded-2xl appearance-none transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-blue-500/30 focus:border-blue-500 focus:bg-white shadow-lg hover:shadow-xl"
                      />
                    ) : (
                      <p className="text-gray-900 font-medium">{tier.displayName}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Monthly Price (£)
                    </label>
                    {editingTier === tier.name ? (
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={tier.price}
                        onChange={(e) => handleTierUpdate(tier.name, 'price', parseFloat(e.target.value) || 0)}
                        className="w-full px-6 py-6 text-xl text-gray-900 bg-gray-50 border-2 border-gray-200 rounded-2xl appearance-none transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-blue-500/30 focus:border-blue-500 focus:bg-white shadow-lg hover:shadow-xl"
                      />
                    ) : (
                      <p className="text-2xl font-bold text-blue-600">£{tier.price}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status
                    </label>
                    {editingTier === tier.name ? (
                      <select
                        value={tier.isActive ? 'active' : 'inactive'}
                        onChange={(e) => handleTierUpdate(tier.name, 'isActive', e.target.value === 'active')}
                        className="w-full px-6 py-6 text-xl text-gray-900 bg-gray-50 border-2 border-gray-200 rounded-2xl appearance-none transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-blue-500/30 focus:border-blue-500 focus:bg-white shadow-lg hover:shadow-xl"
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                      </select>
                    ) : (
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        tier.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {tier.isActive ? 'Active' : 'Inactive'}
                      </span>
                    )}
                  </div>
                  
                  {editingTier === tier.name && (
                    <div className="flex space-x-3 pt-4">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleTierSave(tier.name)}
                        className="flex-1 bg-blue-600 text-white px-6 py-6 rounded-2xl hover:bg-blue-700 transition-all text-lg font-bold shadow-lg hover:shadow-xl"
                      >
                        Save
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setEditingTier(null)}
                        className="flex-1 bg-gray-300 text-gray-700 px-6 py-6 rounded-2xl hover:bg-gray-400 transition-all text-lg font-bold shadow-lg hover:shadow-xl"
                      >
                        Cancel
                      </motion.button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> Partners are billed every 28 days starting from their registration date. 
              All existing partners will be set to Basic tier when this system is activated.
            </p>
          </div>
        </motion.div>

        {/* Impact Warning */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mt-6 bg-yellow-50 border border-yellow-200 rounded-xl p-4"
        >
          <p className="text-sm text-yellow-800">
            ⚠️ <strong>Important:</strong> Changes to these settings will affect all partner businesses on the platform. 
            The Points Issue Charge is used to calculate platform fees for all point issuance transactions.
          </p>
        </motion.div>
      </div>
    </div>
    </>
  );
}

