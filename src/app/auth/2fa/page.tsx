'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import Image from 'next/image';

function TwoFactorAuthContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [method, setMethod] = useState<'email' | 'sms'>('email');
  const [contact, setContact] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [codeSent, setCodeSent] = useState(false);

  const handleSendCode = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await fetch('/api/auth/2fa/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          method,
          [method]: contact,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to send verification code');
      }

      setCodeSent(true);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await fetch('/api/auth/2fa/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Invalid verification code');
      }

      // Redirect to the intended destination or dashboard
      const callbackUrl = searchParams.get('callbackUrl') || '/customer/dashboard';
      router.push(callbackUrl);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full space-y-8 bg-white rounded-2xl shadow-lg p-8"
      >
        <div className="text-center">
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="flex justify-center mb-6"
          >
            <div className="relative w-20 h-20">
              <Image
                src="/logo.png"
                alt="Logo"
                fill
                className="object-contain"
                priority
              />
            </div>
          </motion.div>
          <motion.h2
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="text-3xl font-extrabold text-gray-900"
          >
            Two-Factor Authentication
          </motion.h2>
          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="mt-2 text-sm text-gray-600"
          >
            Please verify your identity to continue
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="mt-8 space-y-6"
        >
          {!codeSent ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Verification Method
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setMethod('email')}
                    className={`py-3 px-4 rounded-xl border-2 flex items-center justify-center ${
                      method === 'email'
                        ? 'border-blue-500 text-blue-600 bg-blue-50'
                        : 'border-gray-200 text-gray-500 hover:border-gray-300'
                    }`}
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    Email
                  </button>
                  <button
                    type="button"
                    onClick={() => setMethod('sms')}
                    className={`py-3 px-4 rounded-xl border-2 flex items-center justify-center ${
                      method === 'sms'
                        ? 'border-blue-500 text-blue-600 bg-blue-50'
                        : 'border-gray-200 text-gray-500 hover:border-gray-300'
                    }`}
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    SMS
                  </button>
                </div>
              </div>

              <div className="relative">
                <input
                  type={method === 'email' ? 'email' : 'tel'}
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  placeholder={method === 'email' ? 'Enter your email' : 'Enter your phone number'}
                  className="block w-full px-4 py-3 text-lg text-gray-900 bg-white border-2 border-gray-200 rounded-xl appearance-none focus:outline-none focus:ring-0 focus:border-blue-500"
                  required
                />
              </div>

              <motion.div
                whileHover={{ scale: loading ? 1 : 1.02 }}
                whileTap={{ scale: loading ? 1 : 0.98 }}
              >
                <button
                  onClick={handleSendCode}
                  disabled={loading || !contact}
                  className={`group relative w-full flex justify-center py-4 px-4 border border-transparent text-lg font-bold rounded-xl text-white ${
                    loading || !contact
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
                      Sending code...
                    </motion.div>
                  ) : (
                    'Send Verification Code'
                  )}
                </button>
              </motion.div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="relative">
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="Enter verification code"
                  className="block w-full px-4 py-3 text-lg text-gray-900 bg-white border-2 border-gray-200 rounded-xl appearance-none focus:outline-none focus:ring-0 focus:border-blue-500"
                  required
                />
              </div>

              <motion.div
                whileHover={{ scale: loading ? 1 : 1.02 }}
                whileTap={{ scale: loading ? 1 : 0.98 }}
              >
                <button
                  onClick={handleVerifyCode}
                  disabled={loading || code.length !== 6}
                  className={`group relative w-full flex justify-center py-4 px-4 border border-transparent text-lg font-bold rounded-xl text-white ${
                    loading || code.length !== 6
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
                      Verifying...
                    </motion.div>
                  ) : (
                    'Verify Code'
                  )}
                </button>
              </motion.div>

              <div className="text-center">
                <button
                  onClick={() => setCodeSent(false)}
                  className="text-sm text-blue-600 hover:text-blue-500"
                >
                  Try a different method
                </button>
              </div>
            </div>
          )}

          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="rounded-md bg-red-50 p-4"
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
        </motion.div>
      </motion.div>
    </div>
  );
}

export default function TwoFactorAuth() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <TwoFactorAuthContent />
    </Suspense>
  );
} 