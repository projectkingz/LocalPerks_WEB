'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { MessageCircle, ArrowLeft, RefreshCw } from 'lucide-react';
import Link from 'next/link';

function VerifyMobileContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mobile, setMobile] = useState('');
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  
  const userId = searchParams.get('userId');
  const email = searchParams.get('email');

  useEffect(() => {
    if (!userId || !email) {
      router.push('/auth/register/partner');
    }
  }, [userId, email, router]);

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSending(true);
    setError('');

    try {
      const response = await fetch('/api/auth/verify-mobile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          userId, 
          mobile,
          action: 'send'
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to send verification code');
      }

      setCodeSent(true);
    } catch (err: any) {
      setError(err.message || 'Failed to send verification code');
    } finally {
      setIsSending(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/verify-mobile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          userId, 
          mobile,
          code,
          action: 'verify'
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Verification failed');
      }

      setSuccess(true);
      setTimeout(() => {
        // Check if user is a partner (will need admin approval)
        if (data.user?.role === 'PARTNER' && data.user?.approvalStatus === 'PENDING') {
          router.push('/auth/signin?message=verification_complete_pending_approval');
        } else {
          router.push('/auth/signin?message=verification_complete');
        }
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Verification failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    setIsSending(true);
    setError('');

    try {
      const response = await fetch('/api/auth/verify-mobile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          userId, 
          mobile,
          action: 'send'
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to resend verification');
      }

      alert('Verification code sent successfully!');
    } catch (err: any) {
      setError(err.message || 'Failed to resend verification');
    } finally {
      setIsSending(false);
    }
  };

  if (!userId || !email) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50/30 py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full space-y-8 bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-gray-100"
      >
        <div className="text-center">
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="flex justify-center mb-6"
          >
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <MessageCircle className="w-8 h-8 text-green-600" />
            </div>
          </motion.div>
          
          <motion.h2
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="text-3xl font-extrabold text-gray-900 mb-2"
          >
            Verify Your Mobile
          </motion.h2>
          
          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="text-gray-600"
          >
            {codeSent 
              ? 'We\'ve sent a 6-digit verification code to your WhatsApp'
              : 'Enter your mobile number to receive a WhatsApp verification code'
            }
          </motion.p>
        </div>

        {success ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Mobile Verified!</h3>
            <p className="text-gray-600">Redirecting to sign in...</p>
          </motion.div>
        ) : !codeSent ? (
          <motion.form
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="mt-8 space-y-6"
            onSubmit={handleSendCode}
          >
            <div className="relative group">
              <input
                type="tel"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                required
                className="block w-full px-4 py-3.5 text-gray-900 bg-gray-50 border-2 border-gray-200 rounded-xl appearance-none transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 peer group-hover:border-gray-300"
                placeholder=" "
              />
              <label className="absolute text-sm font-medium text-gray-500 duration-200 transform -translate-y-4 scale-75 top-2 z-10 origin-[0] bg-gray-50 px-2 peer-focus:px-2 peer-focus:text-blue-600 peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 peer-focus:top-2 peer-focus:scale-75 peer-focus:-translate-y-4 left-1 peer-focus:bg-gray-50 group-hover:bg-gray-50">
                Mobile Number (with country code)
              </label>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="rounded-xl bg-red-50 p-4 border border-red-100"
              >
                <p className="text-sm font-medium text-red-800" role="alert">
                  {error}
                </p>
              </motion.div>
            )}

            <motion.div
              whileHover={{ scale: isSending ? 1 : 1.02 }}
              whileTap={{ scale: isSending ? 1 : 0.98 }}
            >
              <button
                type="submit"
                disabled={isSending || !mobile}
                className={`group relative w-full flex justify-center py-3.5 px-4 border border-transparent text-lg font-semibold rounded-xl text-white shadow-sm ${
                  isSending || !mobile
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-200'
                }`}
              >
                {isSending ? (
                  <div className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Sending...
                  </div>
                ) : (
                  'Send WhatsApp Code'
                )}
              </button>
            </motion.div>
          </motion.form>
        ) : (
          <motion.form
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="mt-8 space-y-6"
            onSubmit={handleVerify}
          >
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-2">
                Code sent to WhatsApp: <span className="font-semibold">{mobile}</span>
              </p>
            </div>

            <div className="relative group">
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                required
                className="block w-full px-4 py-3.5 text-center text-2xl font-mono tracking-widest bg-gray-50 border-2 border-gray-200 rounded-xl appearance-none transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                placeholder="000000"
                maxLength={6}
              />
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="rounded-xl bg-red-50 p-4 border border-red-100"
              >
                <p className="text-sm font-medium text-red-800" role="alert">
                  {error}
                </p>
              </motion.div>
            )}

            <motion.div
              whileHover={{ scale: isLoading ? 1 : 1.02 }}
              whileTap={{ scale: isLoading ? 1 : 0.98 }}
            >
              <button
                type="submit"
                disabled={isLoading || code.length !== 6}
                className={`group relative w-full flex justify-center py-3.5 px-4 border border-transparent text-lg font-semibold rounded-xl text-white shadow-sm ${
                  isLoading || code.length !== 6
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-200'
                }`}
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Verifying...
                  </div>
                ) : (
                  'Verify Mobile'
                )}
              </button>
            </motion.div>

            <div className="text-center">
              <button
                type="button"
                onClick={handleResend}
                disabled={isSending}
                className="flex items-center justify-center mx-auto px-4 py-2 text-sm font-medium text-green-600 bg-green-50 rounded-lg hover:bg-green-100 transition-colors disabled:opacity-50"
              >
                {isSending ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Resend Code
                  </>
                )}
              </button>
            </div>
          </motion.form>
        )}

        <div className="text-center">
          <Link
            href="/auth/signin"
            className="flex items-center justify-center text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Sign In
          </Link>
        </div>
      </motion.div>
    </div>
  );
}

export default function VerifyMobilePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50/30">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    }>
      <VerifyMobileContent />
    </Suspense>
  );
}
