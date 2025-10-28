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
    pointFaceValue: 0.01,
    systemFixedCharge: 0.001,
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
    const faceValueCost = points * config.pointFaceValue;
    const fixedCost = points * config.systemFixedCharge;
    const subtotal = faceValueCost + fixedCost;
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
            {/* Point Face Value */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                <DollarSign className="h-4 w-4 text-blue-600 mr-2" />
                Point Face Value (£ per point)
              </label>
              <input
                type="number"
                step="0.001"
                min="0.001"
                value={config.pointFaceValue}
                onChange={(e) =>
                  setConfig({ ...config, pointFaceValue: parseFloat(e.target.value) || 0 })
                }
                className="block w-full rounded-xl border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-lg px-4 py-3"
              />
              <p className="mt-1 text-sm text-gray-500">
                Current: 1 point = £{config.pointFaceValue.toFixed(3)}
              </p>
            </div>

            {/* System Fixed Charge */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                <TrendingUp className="h-4 w-4 text-blue-600 mr-2" />
                System Fixed Charge (£ per point)
              </label>
              <input
                type="number"
                step="0.0001"
                min="0"
                value={config.systemFixedCharge}
                onChange={(e) =>
                  setConfig({ ...config, systemFixedCharge: parseFloat(e.target.value) || 0 })
                }
                className="block w-full rounded-xl border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-lg px-4 py-3"
              />
              <p className="mt-1 text-sm text-gray-500">
                Current: £{config.systemFixedCharge.toFixed(4)} per point issued
              </p>
            </div>

            {/* System Variable Charge */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                <Percent className="h-4 w-4 text-blue-600 mr-2" />
                System Variable Charge (Issuance Margin %)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={config.systemVariableCharge * 100}
                onChange={(e) =>
                  setConfig({ ...config, systemVariableCharge: (parseFloat(e.target.value) || 0) / 100 })
                }
                className="block w-full rounded-xl border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-lg px-4 py-3"
              />
              <p className="mt-1 text-sm text-gray-500">
                Current: {(config.systemVariableCharge * 100).toFixed(2)}% margin on issuance
              </p>
            </div>

            {/* Formula Explanation */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mt-6">
              <h3 className="font-semibold text-blue-900 mb-3">Points Issue Charge Formula</h3>
              <p className="text-blue-800 font-mono text-sm mb-4">
                (Points × Point Face Value + Points × System Fixed Cost) × (1 + System Variable Charge)
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
            <div className="flex justify-end pt-4">
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
              >
                <Save className="h-5 w-5 mr-2" />
                {isSaving ? 'Saving...' : 'Save Configuration'}
              </button>
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
                        className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2"
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
                        className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2"
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
                        className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2"
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
                    <div className="flex space-x-2 pt-2">
                      <button
                        onClick={() => handleTierSave(tier.name)}
                        className="flex-1 bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingTier(null)}
                        className="flex-1 bg-gray-300 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-400 transition-colors text-sm font-medium"
                      >
                        Cancel
                      </button>
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

