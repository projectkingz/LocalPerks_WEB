'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Building,
  Mail,
  Phone,
  MapPin,
  Clock,
  Settings,
  CreditCard,
  Save,
  QrCode,
  Lock
} from 'lucide-react';
import QRScanner from '@/components/QRScanner';
import TransactionForm from '@/components/TransactionForm';
import PasswordChangeForm from '@/components/PasswordChangeForm';

export default function PartnerProfile() {
  const [customerQRCode, setCustomerQRCode] = useState<string | null>(null);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  // This would be fetched from the API
  const [businessProfile, setBusinessProfile] = useState({
    name: "Joe's Coffee Shop",
    email: "joe@joescoffee.test",
    phone: "(555) 123-4567",
    address: "123 Main St, Anytown, ST 12345",
    hours: {
      monday: "7:00 AM - 7:00 PM",
      tuesday: "7:00 AM - 7:00 PM",
      wednesday: "7:00 AM - 7:00 PM",
      thursday: "7:00 AM - 7:00 PM",
      friday: "7:00 AM - 8:00 PM",
      saturday: "8:00 AM - 8:00 PM",
      sunday: "8:00 AM - 6:00 PM"
    },
    pointsConfig: {
      pointsPerPound: 10,
      minimumPurchase: 5
    }
  });

  const handleScanSuccess = (qrCode: string) => {
    setCustomerQRCode(qrCode);
  };

  const handleScanError = (error: string) => {
    console.error('QR scan error:', error);
  };

  const handleTransactionSubmit = async (data: {
    amount: number;
    spendDate: string;
    customerQRCode: string;
  }) => {
    try {
      // This would be an API call to record the transaction
      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to record transaction');
      }

      // Reset the form after successful submission
      setCustomerQRCode(null);
    } catch (error) {
      throw error;
    }
  };

  const handlePasswordSuccess = () => {
    setShowPasswordForm(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">Business Profile</h1>

        <div className="space-y-6">
          {!customerQRCode && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100"
            >
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <QrCode className="h-5 w-5 text-blue-600 mr-2" />
                Scan Customer QR Code
              </h2>
              <QRScanner
                onScanSuccess={handleScanSuccess}
                onScanError={handleScanError}
              />
            </motion.div>
          )}

          {customerQRCode && (
            <TransactionForm
              customerQRCode={customerQRCode}
              pointsPerPound={businessProfile.pointsConfig.pointsPerPound}
              minimumPurchase={businessProfile.pointsConfig.minimumPurchase}
              onSubmit={handleTransactionSubmit}
              onReset={() => setCustomerQRCode(null)}
            />
          )}

          {/* Account Settings */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                <Settings className="h-5 w-5 text-blue-600 mr-2" />
                Account Settings
              </h2>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-xl">
                <div>
                  <h3 className="font-medium text-gray-900">Password</h3>
                  <p className="text-sm text-gray-600">Update your account password</p>
                </div>
                <button
                  onClick={() => setShowPasswordForm(!showPasswordForm)}
                  className="flex items-center px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  <Lock className="h-4 w-4 mr-2" />
                  {showPasswordForm ? 'Cancel' : 'Change Password'}
                </button>
              </div>
            </div>

            {showPasswordForm && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-6"
              >
                <PasswordChangeForm
                  onSuccess={handlePasswordSuccess}
                  onCancel={() => setShowPasswordForm(false)}
                />
              </motion.div>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100"
          >
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Building className="h-5 w-5 text-blue-600 mr-2" />
              Business Information
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Business Name</label>
                <input
                  type="text"
                  value={businessProfile.name}
                  onChange={(e) => setBusinessProfile({ ...businessProfile, name: e.target.value })}
                  className="mt-1 block w-full rounded-xl border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <div className="mt-1 flex rounded-xl shadow-sm">
                    <span className="inline-flex items-center px-3 rounded-l-xl border border-r-0 border-gray-300 bg-gray-50 text-gray-500">
                      <Mail className="h-4 w-4" />
                    </span>
                    <input
                      type="email"
                      value={businessProfile.email}
                      onChange={(e) => setBusinessProfile({ ...businessProfile, email: e.target.value })}
                      className="flex-1 block w-full rounded-none rounded-r-xl border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Phone</label>
                  <div className="mt-1 flex rounded-xl shadow-sm">
                    <span className="inline-flex items-center px-3 rounded-l-xl border border-r-0 border-gray-300 bg-gray-50 text-gray-500">
                      <Phone className="h-4 w-4" />
                    </span>
                    <input
                      type="tel"
                      value={businessProfile.phone}
                      onChange={(e) => setBusinessProfile({ ...businessProfile, phone: e.target.value })}
                      className="flex-1 block w-full rounded-none rounded-r-xl border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Address</label>
                <div className="mt-1 flex rounded-xl shadow-sm">
                  <span className="inline-flex items-center px-3 rounded-l-xl border border-r-0 border-gray-300 bg-gray-50 text-gray-500">
                    <MapPin className="h-4 w-4" />
                  </span>
                  <input
                    type="text"
                    value={businessProfile.address}
                    onChange={(e) => setBusinessProfile({ ...businessProfile, address: e.target.value })}
                    className="flex-1 block w-full rounded-none rounded-r-xl border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100"
          >
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Clock className="h-5 w-5 text-blue-600 mr-2" />
              Business Hours
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(businessProfile.hours).map(([day, hours]) => (
                <div key={day}>
                  <label className="block text-sm font-medium text-gray-700 capitalize">
                    {day}
                  </label>
                  <input
                    type="text"
                    value={hours}
                    onChange={(e) => setBusinessProfile({
                      ...businessProfile,
                      hours: { ...businessProfile.hours, [day]: e.target.value }
                    })}
                    className="mt-1 block w-full rounded-xl border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100"
          >
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <CreditCard className="h-5 w-5 text-blue-600 mr-2" />
              Points Configuration
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Points per Pound</label>
                <input
                  type="number"
                  value={businessProfile.pointsConfig.pointsPerPound}
                  onChange={(e) => setBusinessProfile({
                    ...businessProfile,
                    pointsConfig: { 
                      ...businessProfile.pointsConfig, 
                      pointsPerPound: parseInt(e.target.value) || 0 
                    }
                  })}
                  className="mt-1 block w-full rounded-xl border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Minimum Purchase (£)</label>
                <input
                  type="number"
                  value={businessProfile.pointsConfig.minimumPurchase}
                  onChange={(e) => setBusinessProfile({
                    ...businessProfile,
                    pointsConfig: { 
                      ...businessProfile.pointsConfig, 
                      minimumPurchase: parseInt(e.target.value) || 0 
                    }
                  })}
                  className="mt-1 block w-full rounded-xl border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex justify-end"
          >
            <button
              type="button"
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-xl shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Save className="h-5 w-5 mr-2" />
              Save Changes
            </button>
          </motion.div>
        </div>
      </div>
    </div>
  );
} 