'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Settings, Save, DollarSign, TrendingUp, Percent } from 'lucide-react';

export default function SystemConfigPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [config, setConfig] = useState({
    pointFaceValue: 0.01,
    systemFixedCharge: 0.001,
    systemVariableCharge: 0.06,
  });
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Fetch current configuration
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const response = await fetch('/api/admin/system-config');
        if (response.ok) {
          const data = await response.json();
          setConfig({
            pointFaceValue: data.pointFaceValue,
            systemFixedCharge: data.systemFixedCharge,
            systemVariableCharge: data.systemVariableCharge,
          });
        }
      } catch (error) {
        console.error('Error fetching config:', error);
        setMessage({ type: 'error', text: 'Failed to load configuration' });
      } finally {
        setIsLoading(false);
      }
    };

    fetchConfig();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    setMessage(null);

    try {
      const response = await fetch('/api/admin/system-config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
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
  );
}

