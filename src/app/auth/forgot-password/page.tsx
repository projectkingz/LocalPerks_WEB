'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, ArrowLeft, CheckCircle, AlertCircle, Star } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [logoError, setLogoError] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to send reset email');
      }

      setSuccess(true);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const Logo = () => (
    <div className="flex justify-center mb-6">
      <div className="relative w-20 h-20">
        {!logoError ? (
          <Image
            src="/logo.png"
            alt="Logo"
            fill
            className="object-contain"
            priority
            onError={() => setLogoError(true)}
          />
        ) : (
          <div className="w-20 h-20 flex items-center justify-center">
            <Star className="w-20 h-20 text-blue-600" />
          </div>
        )}
      </div>
    </div>
  );

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full space-y-8 bg-white rounded-2xl shadow-lg p-8"
        >
          <div className="text-center">
            <Logo />
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="mb-6"
            >
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-3xl font-extrabold text-gray-900 mb-2">
                Check Your Email
              </h2>
              <p className="text-gray-600">
                We've sent password reset instructions to <strong>{email}</strong>
              </p>
            </motion.div>

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="space-y-4"
            >
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <p className="text-sm text-blue-800">
                  <strong>Didn't receive the email?</strong> Check your spam folder or try again with a different email address.
                </p>
              </div>

              <div className="flex space-x-4">
                <button
                  onClick={() => {
                    setSuccess(false);
                    setEmail('');
                    setError('');
                  }}
                  className="flex-1 py-3 px-4 rounded-xl font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors"
                >
                  Try Again
                </button>
                <Link
                  href="/auth/signin"
                  className="flex-1 py-3 px-4 rounded-xl font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors text-center"
                >
                  Back to Sign In
                </Link>
              </div>
            </motion.div>
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
          <Logo />
          <motion.h2
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="text-3xl font-extrabold text-gray-900"
          >
            Forgot Your Password?
          </motion.h2>
          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="mt-2 text-sm text-gray-600"
          >
            Enter your email address and we'll send you a link to reset your password.
          </motion.p>
        </div>

        <motion.form
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          onSubmit={handleSubmit}
          className="mt-8 space-y-6"
        >
          <div className="space-y-5">
            <div className="relative group">
              <input
                type="email"
                name="email"
                id="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full px-4 py-3.5 text-gray-900 bg-gray-50 border-2 border-gray-200 rounded-xl appearance-none transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 peer group-hover:border-gray-300"
                placeholder=" "
              />
              <label
                htmlFor="email"
                className="absolute text-sm font-medium text-gray-500 duration-200 transform -translate-y-4 scale-75 top-2 z-10 origin-[0] bg-gray-50 px-2 peer-focus:px-2 peer-focus:text-blue-600 peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 peer-focus:top-2 peer-focus:scale-75 peer-focus:-translate-y-4 left-1 peer-focus:bg-gray-50 group-hover:bg-gray-50"
              >
                Email address
              </label>
            </div>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl bg-red-50 p-4 border border-red-100"
            >
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-red-800" role="alert">
                    {error}
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          <motion.div
            whileHover={{ scale: loading ? 1 : 1.02 }}
            whileTap={{ scale: loading ? 1 : 0.98 }}
          >
            <button
              type="submit"
              disabled={loading || !email}
              className={`group relative w-full flex justify-center py-3.5 px-4 border border-transparent text-lg font-semibold rounded-xl text-white shadow-sm ${
                loading || !email
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200'
              }`}
            >
              {loading ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center"
                >
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Sending Reset Link...
                </motion.div>
              ) : (
                <motion.div
                  key="button"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center"
                >
                  Send Reset Link
                </motion.div>
              )}
            </button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="text-center"
          >
            <Link
              href="/auth/signin"
              className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-500 transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Sign In
            </Link>
          </motion.div>
        </motion.form>
      </motion.div>
    </div>
  );
} 