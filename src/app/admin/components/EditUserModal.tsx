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
        tenantId: user.tenantId
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                {getRoleIcon(user.role)}
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Edit User</h2>
                  <p className="text-sm text-gray-500">{user.email}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={formData.name || ''}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.name ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Enter name"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email || ''}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.email ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Enter email"
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                )}
              </div>

              {/* Role */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role
                </label>
                <select
                  value={formData.role || ''}
                  onChange={(e) => handleInputChange('role', e.target.value)}
                  disabled={!canEditRole}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    !canEditRole ? 'bg-gray-100 cursor-not-allowed' : 'border-gray-300'
                  }`}
                >
                  <option value="CUSTOMER">Customer</option>
                  <option value="PARTNER">Partner</option>
                  <option value="ADMIN">Admin</option>
                  {isSuperAdmin && <option value="SUPER_ADMIN">Super Admin</option>}
                </select>
                {!canEditRole && (
                  <p className="mt-1 text-sm text-gray-500">
                    Only Super Admins can change roles
                  </p>
                )}
              </div>

              {/* Points */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Points
                </label>
                <input
                  type="number"
                  value={formData.points || 0}
                  onChange={(e) => handleInputChange('points', parseInt(e.target.value) || 0)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.points ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Enter points"
                  min="0"
                />
                {errors.points && (
                  <p className="mt-1 text-sm text-red-600">{errors.points}</p>
                )}
              </div>

              {/* Suspended Status */}
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="suspended"
                  checked={formData.suspended || false}
                  onChange={(e) => handleInputChange('suspended', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="suspended" className="text-sm font-medium text-gray-700">
                  Suspended Account
                </label>
              </div>

              {/* Tenant ID */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tenant ID
                </label>
                <input
                  type="text"
                  value={formData.tenantId || ''}
                  onChange={(e) => handleInputChange('tenantId', e.target.value || null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter tenant ID (optional)"
                />
              </div>

              {/* Password Change (Super Admin Only) */}
              {canEditPassword && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    New Password (optional)
                  </label>
                  <input
                    type="password"
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Leave blank to keep current password"
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    Only Super Admins can change passwords
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
} 