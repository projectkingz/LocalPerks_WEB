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
  X
} from 'lucide-react';
import PasswordChangeForm from '@/components/PasswordChangeForm';

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

  // Fetch admin profile data
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch('/api/admin/profile');
        if (response.ok) {
          const data = await response.json();
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-xl p-6 max-w-md w-full"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Edit Admin Information</h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                <input
                  type="text"
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Mobile Number</label>
                <input
                  type="tel"
                  value={editFormData.mobile}
                  onChange={(e) => setEditFormData({ ...editFormData, mobile: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="07402611112"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleEditSave}
                  disabled={isSaving}
                  className="flex-1 flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {isSaving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

