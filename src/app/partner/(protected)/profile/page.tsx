'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Building,
  Mail,
  Phone,
  MapPin,
  Settings,
  Save,
  QrCode,
  Lock,
  Edit
} from 'lucide-react';
import QRScanner from '@/components/QRScanner';
import TransactionForm from '@/components/TransactionForm';
import PasswordChangeForm from '@/components/PasswordChangeForm';

export default function PartnerProfile() {
  const [customerQRCode, setCustomerQRCode] = useState<string | null>(null);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [businessProfile, setBusinessProfile] = useState({
    businessName: "",
    contactName: "",
    email: "",
    mobile: "",
    pointsConfig: {
      pointsPerPound: 5,
      minimumPurchase: 5
    }
  });
  const [editFormData, setEditFormData] = useState({
    businessName: "",
    contactName: "",
    email: "",
    mobile: ""
  });

  // Fetch business profile data
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch('/api/tenants/profile');
        if (response.ok) {
          const data = await response.json();
          setBusinessProfile(prev => ({
            ...prev,
            businessName: data.businessName || data.name || "",
            contactName: data.contactName || "",
            email: data.email || "",
            mobile: data.mobile || data.phone || ""
          }));
          setEditFormData({
            businessName: data.businessName || data.name || "",
            contactName: data.contactName || "",
            email: data.email || "",
            mobile: data.mobile || data.phone || ""
          });
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, []);

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

  const handleEditSave = async () => {
    try {
      // Here you would implement the API call to update the business profile
      // For now, we'll just update the local state
      setBusinessProfile(prev => ({
        ...prev,
        businessName: editFormData.businessName,
        contactName: editFormData.contactName,
        email: editFormData.email,
        mobile: editFormData.mobile
      }));
      setShowEditModal(false);
    } catch (error) {
      console.error('Error saving profile:', error);
    }
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
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                <Building className="h-5 w-5 text-blue-600 mr-2" />
                Business Information
              </h2>
              <button
                onClick={() => setShowEditModal(true)}
                className="flex items-center px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </button>
            </div>
            
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Business Name</label>
                    <div className="p-3 bg-gray-50 rounded-lg border">
                      <p className="text-gray-900 font-medium">{businessProfile.businessName}</p>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Contact Name</label>
                    <div className="p-3 bg-gray-50 rounded-lg border">
                      <p className="text-gray-900 font-medium">{businessProfile.contactName}</p>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                    <div className="p-3 bg-gray-50 rounded-lg border flex items-center">
                      <Mail className="h-4 w-4 text-gray-500 mr-3" />
                      <p className="text-gray-900">{businessProfile.email}</p>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Mobile Number</label>
                    <div className="p-3 bg-gray-50 rounded-lg border flex items-center">
                      <Phone className="h-4 w-4 text-gray-500 mr-3" />
                      <p className="text-gray-900">{businessProfile.mobile}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </motion.div>

        </div>
      </div>

      {/* Edit Business Information Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Edit Business Information</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Business Name</label>
                <input
                  type="text"
                  value={editFormData.businessName}
                  onChange={(e) => setEditFormData({ ...editFormData, businessName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Contact Name</label>
                <input
                  type="text"
                  value={editFormData.contactName}
                  onChange={(e) => setEditFormData({ ...editFormData, contactName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  value={editFormData.email}
                  onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Mobile Number</label>
                <input
                  type="tel"
                  value={editFormData.mobile}
                  onChange={(e) => setEditFormData({ ...editFormData, mobile: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleEditSave}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Save Changes
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
} 