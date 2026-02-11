'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, User, Mail, Shield, Crown, Users } from 'lucide-react';

interface User {
  id: string;
  name: string | null;
  email: string;
  role: string;
  suspended?: boolean;
  createdAt: string;
  updatedAt: string;
  tenantId: string | null;
  businessName?: string | null; // Business name for partners
  points: number;
}

interface EditUserModalProps {
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedUser: Partial<User>) => void;
  currentUserRole: string;
  loading?: boolean;
}

export default function EditUserModal({
  user,
  isOpen,
  onClose,
  onSave,
  currentUserRole,
  loading = false
}: EditUserModalProps) {
  const [formData, setFormData] = useState<Partial<User>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isSuperAdmin = currentUserRole === 'SUPER_ADMIN';
  const canEditPassword = isSuperAdmin;
  const canEditRole = isSuperAdmin;

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email,
        role: user.role,
        points: user.points,
        suspended: user.suspended,
        tenantId: user.tenantId,
        businessName: user.businessName || ''
      });
      setErrors({});
    }
  }, [user]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name?.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email?.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (formData.points !== undefined && formData.points < 0) {
      newErrors.points = 'Points cannot be negative';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSave(formData);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return <Crown className="h-4 w-4 text-purple-600" />;
      case 'ADMIN':
        return <Shield className="h-4 w-4 text-blue-600" />;
      case 'PARTNER':
        return <Users className="h-4 w-4 text-green-600" />;
      case 'CUSTOMER':
        return <User className="h-4 w-4 text-gray-600" />;
      default:
        return <User className="h-4 w-4 text-gray-400" />;
    }
  };

  const canEditThisUser = () => {
    if (!user) return false;
    if (isSuperAdmin) return true;
    if (user.role === 'SUPER_ADMIN') return false;
    return true;
  };

  if (!user || !canEditThisUser()) {
    return null;
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-50 overflow-y-auto pt-8 pb-8 px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full border-2 border-gray-100/50 backdrop-blur-sm my-8"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-10 md:p-12 border-b-2 border-gray-200">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-gray-50 rounded-2xl">
                  {getRoleIcon(user.role)}
                </div>
                <div>
                  <h2 className="text-5xl md:text-6xl font-extrabold text-gray-900 tracking-tight">Edit User</h2>
                  <p className="text-xl text-gray-600 font-medium mt-2">{user.email}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-8 w-8" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-10 md:p-12 space-y-8">
              {/* Name */}
              <div className="relative group">
                <input
                  type="text"
                  value={formData.name || ''}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  required
                  className={`block w-full px-8 py-8 text-2xl text-gray-900 bg-gray-50 border-2 rounded-3xl appearance-none transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-blue-500/30 focus:border-blue-500 focus:bg-white peer group-hover:border-gray-300 shadow-lg hover:shadow-xl min-h-[80px] ${
                    errors.name ? 'border-red-300' : 'border-gray-200'
                  }`}
                  placeholder=" "
                />
                <label className="absolute text-xl font-medium text-gray-600 duration-200 transform -translate-y-4 scale-75 top-4 z-10 origin-[0] bg-white px-3 peer-focus:px-3 peer-focus:text-blue-600 peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 peer-focus:top-4 peer-focus:scale-75 peer-focus:-translate-y-4 left-3 peer-focus:bg-white group-hover:bg-white">
                  {user.role === 'PARTNER' ? 'Owner Name' : 'Name'} *
                </label>
                {errors.name && (
                  <p className="mt-2 text-base text-red-500 font-medium">{errors.name}</p>
                )}
              </div>

              {/* Business Name (for Partners only) */}
              {user.role === 'PARTNER' && (
                <div className="relative group">
                  <input
                    type="text"
                    value={formData.businessName || ''}
                    onChange={(e) => handleInputChange('businessName', e.target.value)}
                    className="block w-full px-8 py-8 text-2xl text-gray-900 bg-gray-50 border-2 border-gray-200 rounded-3xl appearance-none transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-blue-500/30 focus:border-blue-500 focus:bg-white peer group-hover:border-gray-300 shadow-lg hover:shadow-xl min-h-[80px]"
                    placeholder=" "
                  />
                  <label className="absolute text-xl font-medium text-gray-600 duration-200 transform -translate-y-4 scale-75 top-4 z-10 origin-[0] bg-white px-3 peer-focus:px-3 peer-focus:text-blue-600 peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 peer-focus:top-4 peer-focus:scale-75 peer-focus:-translate-y-4 left-3 peer-focus:bg-white group-hover:bg-white">
                    Business Name
                  </label>
                </div>
              )}

              {/* Email */}
              <div className="relative group">
                <input
                  type="email"
                  value={formData.email || ''}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  required
                  className={`block w-full px-8 py-8 text-2xl text-gray-900 bg-gray-50 border-2 rounded-3xl appearance-none transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-blue-500/30 focus:border-blue-500 focus:bg-white peer group-hover:border-gray-300 shadow-lg hover:shadow-xl min-h-[80px] ${
                    errors.email ? 'border-red-300' : 'border-gray-200'
                  }`}
                  placeholder=" "
                />
                <label className="absolute text-xl font-medium text-gray-600 duration-200 transform -translate-y-4 scale-75 top-4 z-10 origin-[0] bg-white px-3 peer-focus:px-3 peer-focus:text-blue-600 peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 peer-focus:top-4 peer-focus:scale-75 peer-focus:-translate-y-4 left-3 peer-focus:bg-white group-hover:bg-white">
                  Email *
                </label>
                {errors.email && (
                  <p className="mt-2 text-base text-red-500 font-medium">{errors.email}</p>
                )}
              </div>

              {/* Role */}
              <div className="relative group">
                <select
                  value={formData.role || ''}
                  onChange={(e) => handleInputChange('role', e.target.value)}
                  disabled={!canEditRole}
                  className={`block w-full px-8 py-8 text-2xl text-gray-900 bg-gray-50 border-2 rounded-3xl appearance-none transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-blue-500/30 focus:border-blue-500 focus:bg-white peer group-hover:border-gray-300 shadow-lg hover:shadow-xl min-h-[80px] ${
                    !canEditRole ? 'bg-gray-100 cursor-not-allowed' : 'border-gray-200'
                  }`}
                >
                  <option value="CUSTOMER">Customer</option>
                  <option value="PARTNER">Partner</option>
                  <option value="ADMIN">Admin</option>
                  {isSuperAdmin && <option value="SUPER_ADMIN">Super Admin</option>}
                </select>
                <label className="absolute text-xl font-medium text-gray-600 duration-200 transform -translate-y-4 scale-75 top-4 z-10 origin-[0] bg-white px-3 peer-focus:px-3 peer-focus:text-blue-600 left-3 peer-focus:bg-white group-hover:bg-white pointer-events-none">
                  Role
                </label>
                {!canEditRole && (
                  <p className="mt-2 text-base text-gray-500 font-medium">
                    Only Super Admins can change roles
                  </p>
                )}
              </div>

              {/* Points */}
              <div className="relative group">
                <input
                  type="number"
                  value={formData.points || 0}
                  onChange={(e) => handleInputChange('points', parseInt(e.target.value) || 0)}
                  min="0"
                  className={`block w-full px-8 py-8 text-2xl text-gray-900 bg-gray-50 border-2 rounded-3xl appearance-none transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-blue-500/30 focus:border-blue-500 focus:bg-white peer group-hover:border-gray-300 shadow-lg hover:shadow-xl min-h-[80px] ${
                    errors.points ? 'border-red-300' : 'border-gray-200'
                  }`}
                  placeholder=" "
                />
                <label className="absolute text-xl font-medium text-gray-600 duration-200 transform -translate-y-4 scale-75 top-4 z-10 origin-[0] bg-white px-3 peer-focus:px-3 peer-focus:text-blue-600 peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 peer-focus:top-4 peer-focus:scale-75 peer-focus:-translate-y-4 left-3 peer-focus:bg-white group-hover:bg-white">
                  Points
                </label>
                {errors.points && (
                  <p className="mt-2 text-base text-red-500 font-medium">{errors.points}</p>
                )}
              </div>

              {/* Suspended Status */}
              <div className="flex items-center space-x-4 p-6 bg-gray-50 rounded-3xl border-2 border-gray-200">
                <input
                  type="checkbox"
                  id="suspended"
                  checked={formData.suspended || false}
                  onChange={(e) => handleInputChange('suspended', e.target.checked)}
                  className="h-6 w-6 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="suspended" className="text-xl font-medium text-gray-700">
                  Suspended Account
                </label>
              </div>

              {/* Tenant ID */}
              <div className="relative group">
                <input
                  type="text"
                  value={formData.tenantId || ''}
                  onChange={(e) => handleInputChange('tenantId', e.target.value || null)}
                  className="block w-full px-8 py-8 text-2xl text-gray-900 bg-gray-50 border-2 border-gray-200 rounded-3xl appearance-none transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-blue-500/30 focus:border-blue-500 focus:bg-white peer group-hover:border-gray-300 shadow-lg hover:shadow-xl min-h-[80px]"
                  placeholder=" "
                />
                <label className="absolute text-xl font-medium text-gray-600 duration-200 transform -translate-y-4 scale-75 top-4 z-10 origin-[0] bg-white px-3 peer-focus:px-3 peer-focus:text-blue-600 peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 peer-focus:top-4 peer-focus:scale-75 peer-focus:-translate-y-4 left-3 peer-focus:bg-white group-hover:bg-white">
                  Tenant ID (optional)
                </label>
              </div>

              {/* Password Change (Super Admin Only) */}
              {canEditPassword && (
                <div className="relative group">
                  <input
                    type="password"
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    className="block w-full px-8 py-8 text-2xl text-gray-900 bg-gray-50 border-2 border-gray-200 rounded-3xl appearance-none transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-blue-500/30 focus:border-blue-500 focus:bg-white peer group-hover:border-gray-300 shadow-lg hover:shadow-xl min-h-[80px]"
                    placeholder=" "
                  />
                  <label className="absolute text-xl font-medium text-gray-600 duration-200 transform -translate-y-4 scale-75 top-4 z-10 origin-[0] bg-white px-3 peer-focus:px-3 peer-focus:text-blue-600 peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 peer-focus:top-4 peer-focus:scale-75 peer-focus:-translate-y-4 left-3 peer-focus:bg-white group-hover:bg-white">
                    New Password (optional)
                  </label>
                  <p className="mt-2 text-base text-gray-500 font-medium">
                    Only Super Admins can change passwords
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex space-x-4 pt-6">
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onClose}
                  className="flex-1 px-8 py-8 border-2 border-gray-300 text-2xl font-bold rounded-3xl text-gray-700 bg-white hover:bg-gray-50 transition-all duration-200 shadow-lg hover:shadow-xl min-h-[80px]"
                >
                  Cancel
                </motion.button>
                <motion.button
                  type="submit"
                  whileHover={{ scale: loading ? 1 : 1.02 }}
                  whileTap={{ scale: loading ? 1 : 0.98 }}
                  disabled={loading}
                  className={`group relative flex-1 flex justify-center items-center py-8 px-8 border border-transparent text-2xl font-bold rounded-3xl text-white shadow-xl transition-all duration-200 min-h-[80px] ${
                    loading
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-offset-2 focus:ring-blue-500 hover:shadow-2xl transform hover:scale-[1.02]'
                  }`}
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span className="text-2xl">Saving...</span>
                    </>
                  ) : (
                    <>
                      <Save className="h-6 w-6 mr-3" />
                      <span className="text-2xl">Save Changes</span>
                    </>
                  )}
                </motion.button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
} 