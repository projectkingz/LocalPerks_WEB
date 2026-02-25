'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import { 
  User,
  Mail,
  Phone,
  Settings,
  Lock,
  Edit,
  Save,
  X,
  KeyRound,
  QrCode
} from 'lucide-react';
import QRScanner from '@/components/QRScanner';
import TransactionForm from '@/components/TransactionForm';
import PasswordChangeForm from '@/components/PasswordChangeForm';
import ScrollControls from '@/components/ScrollControls';

export default function AdminProfile() {
  const { data: session } = useSession();
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [adminProfile, setAdminProfile] = useState({
    name: "",
    email: "",
    mobile: "",
    role: "",
  });
  const [editFormData, setEditFormData] = useState({
    name: "",
    mobile: ""
  });
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [customerQRCode, setCustomerQRCode] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState('');
  const [manualCodeLoading, setManualCodeLoading] = useState(false);
  const [manualCodeError, setManualCodeError] = useState<string | null>(null);
  const [voucherSuccess, setVoucherSuccess] = useState<string | null>(null);
  const [pointsConfig, setPointsConfig] = useState({ basePointsPerPound: 5, minimumSpend: 0 });

  // Fetch admin profile data and points config
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const [profileRes, configRes] = await Promise.all([
          fetch('/api/admin/profile'),
          fetch('/api/points/config')
        ]);
        if (profileRes.ok) {
          const data = await profileRes.json();
          setAdminProfile({
            name: data.name || "",
            email: data.email || "",
            mobile: data.mobile || "",
            role: data.role || "",
          });
          setEditFormData({
            name: data.name || "",
            mobile: data.mobile || ""
          });
        }
        if (configRes.ok) {
          const configData = await configRes.json();
          if (configData.config) {
            setPointsConfig({
              basePointsPerPound: configData.config.basePointsPerPound ?? 5,
              minimumSpend: configData.config.minimumSpend ?? 0
            });
          }
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handlePasswordSuccess = () => {
    setShowPasswordForm(false);
    setMessage({ type: 'success', text: 'Password changed successfully' });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleScanSuccess = (qrCode: string) => {
    setCustomerQRCode(qrCode);
  };

  const handleScanError = (error: string) => {
    console.error('QR scan error:', error);
  };

  const handleManualCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = manualCode?.trim();
    if (!code) {
      setManualCodeError('Please enter a code');
      return;
    }

    setManualCodeLoading(true);
    setManualCodeError(null);
    setVoucherSuccess(null);

    try {
      // Try customer QR code first (for recording transactions)
      const customerRes = await fetch('/api/customers/qr', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });

      if (customerRes.ok) {
        setCustomerQRCode(code);
        setManualCode('');
        return;
      }

      // Try customer display ID (6-char format) as fallback
      if (/^[0-9A-Za-z]{6}$/.test(code)) {
        const lookupRes = await fetch(`/api/customers/lookup?displayId=${encodeURIComponent(code.toUpperCase())}`);
        if (lookupRes.ok) {
          const data = await lookupRes.json();
          if (data.customer) {
            setCustomerQRCode(data.customer.qrCode || code.toUpperCase());
            setManualCode('');
            return;
          }
        }
      }

      // Try voucher code (for redeeming vouchers)
      const voucherRes = await fetch('/api/vouchers/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ voucherCode: code }),
      });

      if (voucherRes.ok) {
        const data = await voucherRes.json();
        setVoucherSuccess(data.message || 'Voucher redeemed successfully!');
        setManualCode('');
        setTimeout(() => setVoucherSuccess(null), 4000);
        return;
      }

      const errData = await voucherRes.json().catch(() => ({}));
      setManualCodeError(errData.error || 'Invalid code. Enter customer QR code, display ID, or voucher code.');
    } catch (err) {
      setManualCodeError('Failed to validate code');
    } finally {
      setManualCodeLoading(false);
    }
  };

  const handleTransactionSubmit = async (data: {
    amount: number;
    spendDate: string;
    customerQRCode: string;
  }) => {
    try {
      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to record transaction');
      }

      setCustomerQRCode(null);
      setMessage({ type: 'success', text: 'Transaction recorded successfully' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      throw error;
    }
  };

  const handleEditSave = async () => {
    setIsSaving(true);
    setMessage(null);

    try {
      const response = await fetch('/api/admin/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editFormData),
      });

      const data = await response.json();

      if (response.ok) {
        setAdminProfile(prev => ({
          ...prev,
          name: editFormData.name,
          mobile: editFormData.mobile,
        }));
        setShowEditModal(false);
        setMessage({ type: 'success', text: 'Profile updated successfully' });
        setTimeout(() => setMessage(null), 3000);
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to update profile' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update profile' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <ScrollControls />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">Admin Profile</h1>

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

        <div className="space-y-6">
          {/* Scan Customer QR Code / Redeem Voucher - same as partner */}
          {!customerQRCode && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100"
            >
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <QrCode className="h-5 w-5 text-blue-600 mr-2" />
                Scan Customer QR Code or Redeem Voucher
              </h2>
              <QRScanner
                onScanSuccess={handleScanSuccess}
                onScanError={handleScanError}
              />

              <div className="mt-6 pt-6 border-t border-gray-100">
                <label className="block text-sm font-bold uppercase tracking-wide text-gray-700 mb-2 flex items-center">
                  <KeyRound className="h-4 w-4 text-gray-600 mr-2" />
                  Camera not available? Enter code manually
                </label>
                <form onSubmit={handleManualCodeSubmit} className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={manualCode}
                      onChange={(e) => {
                        setManualCode(e.target.value.toUpperCase());
                        setManualCodeError(null);
                      }}
                      placeholder="Customer QR, display ID (6 chars), or voucher code"
                      className="block w-full pl-4 pr-5 py-4 text-xl font-bold text-gray-900 rounded-xl border-2 border-gray-200 bg-gray-50 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all outline-none placeholder:text-gray-400 placeholder:font-medium disabled:opacity-60"
                      disabled={manualCodeLoading}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={manualCodeLoading || !manualCode.trim()}
                    className="px-6 py-4 rounded-xl bg-blue-600 text-white text-base font-bold hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    {manualCodeLoading ? 'Checking...' : 'Use Code'}
                  </button>
                </form>
                {manualCodeError && (
                  <p className="mt-2 text-sm text-red-600">{manualCodeError}</p>
                )}
                {voucherSuccess && (
                  <p className="mt-2 text-sm text-green-600 font-medium">{voucherSuccess}</p>
                )}
              </div>
            </motion.div>
          )}

          {customerQRCode && (
            <TransactionForm
              customerQRCode={customerQRCode}
              pointsPerPound={pointsConfig.basePointsPerPound}
              minimumPurchase={Math.max(pointsConfig.minimumSpend, 0)}
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

          {/* Admin Information */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                <User className="h-5 w-5 text-blue-600 mr-2" />
                Admin Information
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
                    <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                    <div className="p-3 bg-gray-50 rounded-lg border">
                      <p className="text-gray-900 font-medium">{adminProfile.name}</p>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                    <div className="p-3 bg-gray-50 rounded-lg border">
                      <p className="text-gray-900 font-medium">{adminProfile.role}</p>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                    <div className="p-3 bg-gray-50 rounded-lg border flex items-center">
                      <Mail className="h-4 w-4 text-gray-500 mr-3" />
                      <p className="text-gray-900">{adminProfile.email}</p>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Mobile Number</label>
                    <div className="p-3 bg-gray-50 rounded-lg border flex items-center">
                      <Phone className="h-4 w-4 text-gray-500 mr-3" />
                      <p className="text-gray-900">{adminProfile.mobile || 'Not provided'}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>

      {/* Edit Admin Information Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-50 overflow-y-auto pt-8 pb-8 px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl shadow-2xl p-10 md:p-12 max-w-2xl w-full border-2 border-gray-100/50 backdrop-blur-sm my-8"
          >
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-5xl md:text-6xl font-extrabold text-gray-900 tracking-tight">Edit Admin Information</h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-8 w-8" />
              </button>
            </div>

            <div className="space-y-8">
              <div className="relative group">
                <input
                  type="text"
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  className="block w-full px-8 py-8 text-2xl text-gray-900 bg-gray-50 border-2 border-gray-200 rounded-3xl appearance-none transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-blue-500/30 focus:border-blue-500 focus:bg-white peer group-hover:border-gray-300 shadow-lg hover:shadow-xl min-h-[80px]"
                  placeholder=" "
                />
                <label className="absolute text-xl font-medium text-gray-600 duration-200 transform -translate-y-4 scale-75 top-4 z-10 origin-[0] bg-white px-3 peer-focus:px-3 peer-focus:text-blue-600 peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 peer-focus:top-4 peer-focus:scale-75 peer-focus:-translate-y-4 left-3 peer-focus:bg-white group-hover:bg-white">
                  Full Name
                </label>
              </div>

              <div className="relative group">
                <input
                  type="tel"
                  value={editFormData.mobile}
                  onChange={(e) => setEditFormData({ ...editFormData, mobile: e.target.value })}
                  className="block w-full px-8 py-8 text-2xl text-gray-900 bg-gray-50 border-2 border-gray-200 rounded-3xl appearance-none transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-blue-500/30 focus:border-blue-500 focus:bg-white peer group-hover:border-gray-300 shadow-lg hover:shadow-xl min-h-[80px]"
                  placeholder=" "
                />
                <label className="absolute text-xl font-medium text-gray-600 duration-200 transform -translate-y-4 scale-75 top-4 z-10 origin-[0] bg-white px-3 peer-focus:px-3 peer-focus:text-blue-600 peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 peer-focus:top-4 peer-focus:scale-75 peer-focus:-translate-y-4 left-3 peer-focus:bg-white group-hover:bg-white">
                  Mobile Number
                </label>
              </div>

              <div className="flex gap-4 pt-6">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 px-8 py-8 border-2 border-gray-300 text-2xl font-bold rounded-3xl text-gray-700 bg-white hover:bg-gray-50 transition-all duration-200 shadow-lg hover:shadow-xl min-h-[80px]"
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={{ scale: isSaving ? 1 : 1.02 }}
                  whileTap={{ scale: isSaving ? 1 : 0.98 }}
                  onClick={handleEditSave}
                  disabled={isSaving}
                  className={`flex-1 flex items-center justify-center py-8 px-8 border border-transparent text-2xl font-bold rounded-3xl text-white shadow-xl transition-all duration-200 min-h-[80px] ${
                    isSaving
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-offset-2 focus:ring-blue-500 hover:shadow-2xl transform hover:scale-[1.02]'
                  }`}
                >
                  <Save className="h-6 w-6 mr-3" />
                  <span>{isSaving ? 'Saving...' : 'Save'}</span>
                </motion.button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
    </>
  );
}

