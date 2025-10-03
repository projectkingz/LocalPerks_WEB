'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Lock, Eye, EyeOff, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { validatePassword, getPasswordStrengthColor, getPasswordStrengthText } from '@/lib/utils/password';

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [passwordValidation, setPasswordValidation] = useState(validatePassword(''));
  const [token, setToken] = useState('');
  const [email, setEmail] = useState('');

  useEffect(() => {
    const tokenParam = searchParams.get('token');
    const emailParam = searchParams.get('email');
    
    if (!tokenParam || !emailParam) {
      setError('Invalid reset link. Please request a new password reset.');
      return;
    }

    setToken(tokenParam);
    setEmail(emailParam);
  }, [searchParams]);

  const handleNewPasswordChange = (value: string) => {
    setNewPassword(value);
    setPasswordValidation(validatePassword(value));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (!passwordValidation.isValid) {
      setError('Password does not meet strength requirements');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          token,
          newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to reset password');
      }

      setSuccess(true);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full space-y-8 bg-white rounded-2xl shadow-lg p-8"
        >
          <div className="text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-3xl font-extrabold text-gray-900 mb-2">
              Password Reset Successful!
            </h2>
            <p className="text-gray-600 mb-6">
              Your password has been successfully reset. You can now sign in with your new password.
            </p>
            <Link
              href="/auth/signin"
              className="inline-flex items-center justify-center w-full py-4 px-4 border border-transparent text-lg font-bold rounded-xl text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
            >
              Sign In
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  if (error && !token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full space-y-8 bg-white rounded-2xl shadow-lg p-8"
        >
          <div className="text-center">
            <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-3xl font-extrabold text-gray-900 mb-2">
              Invalid Reset Link
            </h2>
            <p className="text-gray-600 mb-6">
              {error}
            </p>
            <div className="space-y-4">
              <Link
                href="/auth/forgot-password"
                className="inline-flex items-center justify-center w-full py-4 px-4 border border-transparent text-lg font-bold rounded-xl text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
              >
                Request New Reset Link
              </Link>
              <Link
                href="/auth/signin"
                className="inline-flex items-center justify-center w-full py-3 px-4 border border-gray-300 text-lg font-medium rounded-xl text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
              >
                Back to Sign In
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full space-y-8 bg-white rounded-2xl shadow-lg p-8"
      >
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900">
            Reset Your Password
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Enter your new password below
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              New Password
            </label>
            <div className="relative">
              <div className="flex rounded-xl shadow-sm">
                <span className="inline-flex items-center px-3 rounded-l-xl border border-r-0 border-gray-300 bg-gray-50 text-gray-500">
                  <Lock className="h-4 w-4" />
                </span>
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => handleNewPasswordChange(e.target.value)}
                  placeholder="Enter your new password"
                  className="flex-1 block w-full rounded-none rounded-r-xl border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="inline-flex items-center px-3 rounded-r-xl border border-l-0 border-gray-300 bg-gray-50 text-gray-500 hover:text-gray-700"
                >
                  {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            
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
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Confirm New Password
            </label>
            <div className="relative">
              <div className="flex rounded-xl shadow-sm">
                <span className="inline-flex items-center px-3 rounded-l-xl border border-r-0 border-gray-300 bg-gray-50 text-gray-500">
                  <Lock className="h-4 w-4" />
                </span>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your new password"
                  className={`flex-1 block w-full rounded-none rounded-r-xl border-gray-300 focus:border-blue-500 focus:ring-blue-500 ${
                    confirmPassword && newPassword !== confirmPassword ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="inline-flex items-center px-3 rounded-r-xl border border-l-0 border-gray-300 bg-gray-50 text-gray-500 hover:text-gray-700"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
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

          <button
            type="submit"
            disabled={loading || !newPassword || !confirmPassword || newPassword !== confirmPassword || !passwordValidation.isValid}
            className={`group relative w-full flex justify-center py-4 px-4 border border-transparent text-lg font-bold rounded-xl text-white ${
              loading || !newPassword || !confirmPassword || newPassword !== confirmPassword || !passwordValidation.isValid
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200'
            }`}
          >
            {loading ? 'Resetting Password...' : 'Reset Password'}
          </button>

          <div className="text-center">
            <Link
              href="/auth/signin"
              className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-500 transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Sign In
            </Link>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ResetPasswordContent />
    </Suspense>
  );
} 