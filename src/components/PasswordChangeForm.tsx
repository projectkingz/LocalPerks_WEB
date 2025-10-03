'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Lock, CheckCircle, AlertCircle } from 'lucide-react';
import { validatePassword, getPasswordStrengthColor, getPasswordStrengthText } from '@/lib/utils/password';

interface PasswordChangeFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function PasswordChangeForm({ onSuccess, onCancel }: PasswordChangeFormProps) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [passwordValidation, setPasswordValidation] = useState(validatePassword(''));

  const handleNewPasswordChange = (value: string) => {
    setNewPassword(value);
    setPasswordValidation(validatePassword(value));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validate passwords match
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      setLoading(false);
      return;
    }

    // Validate password strength
    if (!passwordValidation.isValid) {
      setError('Password does not meet strength requirements');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to change password');
      }

      setSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setError('');
      
      // Call success callback after a delay
      setTimeout(() => {
        onSuccess?.();
      }, 2000);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const PasswordInput = ({ 
    value, 
    onChange, 
    placeholder, 
    showPassword, 
    setShowPassword, 
    error 
  }: {
    value: string;
    onChange: (value: string) => void;
    placeholder: string;
    showPassword: boolean;
    setShowPassword: (show: boolean) => void;
    error?: boolean;
  }) => (
    <div className="relative">
      <div className="flex rounded-xl shadow-sm">
        <span className="inline-flex items-center px-3 rounded-l-xl border border-r-0 border-gray-300 bg-gray-50 text-gray-500">
          <Lock className="h-4 w-4" />
        </span>
        <input
          type={showPassword ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`flex-1 block w-full rounded-none rounded-r-xl border-gray-300 focus:border-blue-500 focus:ring-blue-500 ${
            error ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''
          }`}
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="inline-flex items-center px-3 rounded-r-xl border border-l-0 border-gray-300 bg-gray-50 text-gray-500 hover:text-gray-700"
        >
          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );

  if (success) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-green-50 border border-green-200 rounded-xl p-6 text-center"
      >
        <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-green-800 mb-2">Password Updated Successfully!</h3>
        <p className="text-green-600">Your password has been changed successfully.</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100"
    >
      <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
        <Lock className="h-5 w-5 text-blue-600 mr-2" />
        Change Password
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Current Password
          </label>
          <PasswordInput
            value={currentPassword}
            onChange={setCurrentPassword}
            placeholder="Enter your current password"
            showPassword={showCurrentPassword}
            setShowPassword={setShowCurrentPassword}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            New Password
          </label>
          <PasswordInput
            value={newPassword}
            onChange={handleNewPasswordChange}
            placeholder="Enter your new password"
            showPassword={showNewPassword}
            setShowPassword={setShowNewPassword}
          />
          
          {/* Password strength indicator */}
          {newPassword && (
            <div className="mt-2">
              <div className="flex items-center space-x-2">
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${
                      passwordValidation.score === 0 ? 'bg-red-500 w-1/5' :
                      passwordValidation.score === 1 ? 'bg-orange-500 w-2/5' :
                      passwordValidation.score === 2 ? 'bg-yellow-500 w-3/5' :
                      passwordValidation.score === 3 ? 'bg-blue-500 w-4/5' :
                      'bg-green-500 w-full'
                    }`}
                  />
                </div>
                <span className={`text-sm font-medium ${getPasswordStrengthColor(passwordValidation.score)}`}>
                  {getPasswordStrengthText(passwordValidation.score)}
                </span>
              </div>
              
              {/* Password requirements */}
              <div className="mt-2 space-y-1">
                {passwordValidation.errors.map((error, index) => (
                  <div key={index} className="flex items-center text-sm text-red-600">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {error}
                  </div>
                ))}
                {passwordValidation.suggestions.map((suggestion, index) => (
                  <div key={index} className="flex items-center text-sm text-gray-600">
                    <CheckCircle className="h-4 w-4 mr-1" />
                    {suggestion}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Confirm New Password
          </label>
          <PasswordInput
            value={confirmPassword}
            onChange={setConfirmPassword}
            placeholder="Confirm your new password"
            showPassword={showConfirmPassword}
            setShowPassword={setShowConfirmPassword}
            error={confirmPassword ? newPassword !== confirmPassword : undefined}
          />
          {confirmPassword && newPassword !== confirmPassword && (
            <p className="mt-1 text-sm text-red-600">Passwords do not match</p>
          )}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        )}

        <div className="flex space-x-4">
          <button
            type="submit"
            disabled={loading || !currentPassword || !newPassword || !confirmPassword || newPassword !== confirmPassword || !passwordValidation.isValid}
            className={`flex-1 py-3 px-4 rounded-xl font-medium text-white transition-colors ${
              loading || !currentPassword || !newPassword || !confirmPassword || newPassword !== confirmPassword || !passwordValidation.isValid
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
            }`}
          >
            {loading ? 'Updating Password...' : 'Update Password'}
          </button>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="py-3 px-4 rounded-xl font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </motion.div>
  );
} 