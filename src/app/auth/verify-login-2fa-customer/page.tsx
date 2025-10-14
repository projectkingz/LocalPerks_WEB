'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { motion } from 'framer-motion';
import { Shield, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

function VerifyLogin2FACustomerContent() {
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [mobile, setMobile] = useState<string | null>(null);
  const codeSentRef = useRef(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email');

  useEffect(() => {
    // Prevent duplicate sends
    if (codeSentRef.current) {
      console.log('⏭️  Code already sent, skipping entire effect');
      return;
    }

    // Fetch user data to get userId and mobile
    const fetchUserData = async () => {
      if (!email) {
        setError('Email is required');
        return;
      }

      // Mark as sent immediately to prevent race conditions
      codeSentRef.current = true;
      console.log('🔒 Locked - preventing duplicate sends');

      try {
        const response = await fetch(`/api/auth/user-by-email?email=${encodeURIComponent(email)}`);
        if (response.ok) {
          const userData = await response.json();
          setUserId(userData.id);
          setMobile(userData.mobile || 'your registered mobile');
          
          // Send initial 2FA code
          await sendCode(userData.id, userData.email);
        } else {
          setError('Failed to fetch user data');
          codeSentRef.current = false; // Reset on error
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        setError('Failed to fetch user data');
        codeSentRef.current = false; // Reset on error
      }
    };

    fetchUserData();
  }, [email]);

  const sendCode = async (userIdToUse: string, userEmail: string) => {
    try {
      console.log('📤 Sending customer 2FA code request...');
      const response = await fetch('/api/auth/login-2fa-customer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          userId: userIdToUse,
          email: userEmail
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('❌ Failed to send code:', data.message || data.error);
        return false;
      }

      console.log('✅ Customer 2FA code sent successfully:', data.message);
      console.log('📱 Check your WhatsApp or console for the verification code');
      return true;
    } catch (error) {
      console.error('❌ Error sending code:', error);
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!userId) {
      setError('User data not loaded. Please try again.');
      setLoading(false);
      return;
    }

    if (code.length !== 6) {
      setError('Please enter a valid 6-digit code');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/verify-login-2fa', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, code }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Invalid verification code');
        setLoading(false);
        return;
      }

      setSuccess(true);
      
      // Now sign in the user
      const result = await signIn('credentials', {
        email: email,
        password: '__2FA_VERIFIED__', // Special flag to bypass password check
        redirect: false,
      });

      if (result?.error) {
        setError('Login failed after verification. Please try again.');
        setLoading(false);
        return;
      }

      // Redirect to customer dashboard
      setTimeout(() => {
        router.push('/customer/dashboard');
      }, 1000);
    } catch (error) {
      console.error('Verification error:', error);
      setError('An error occurred during verification');
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (!userId || !email) {
      setError('User data not loaded. Please try again.');
      return;
    }

    setResendLoading(true);
    setError(null);
    setResendSuccess(false);

    const sent = await sendCode(userId, email);
    
    if (sent) {
      setResendSuccess(true);
      setTimeout(() => setResendSuccess(false), 3000);
    } else {
      setError('Failed to resend code. Please try again.');
    }

    setResendLoading(false);
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setCode(value);
    if (error) setError(null);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
              <Shield className="w-8 h-8 text-blue-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Two-Factor Authentication
            </h1>
            <p className="text-gray-600">
              We've sent a 6-digit code to {mobile}
            </p>
            {process.env.NODE_ENV === 'development' && (
              <p className="text-xs text-gray-500 mt-2">
                (Check your console for the verification code in development mode)
              </p>
            )}
          </div>

          {/* Success Message */}
          {success && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg"
            >
              <p className="text-green-800 text-center font-medium">
                ✓ Verification successful! Signing you in...
              </p>
            </motion.div>
          )}

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg"
            >
              <p className="text-red-800 text-center">{error}</p>
            </motion.div>
          )}

          {/* Resend Success Message */}
          {resendSuccess && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg"
            >
              <p className="text-blue-800 text-center">
                ✓ Verification code resent successfully!
              </p>
            </motion.div>
          )}

          {/* Verification Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-2">
                Enter verification code
              </label>
              <input
                id="code"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={code}
                onChange={handleCodeChange}
                placeholder="000000"
                maxLength={6}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-2xl tracking-widest font-mono"
                disabled={loading || success}
                autoFocus
              />
            </div>

            <button
              type="submit"
              disabled={loading || success || code.length !== 6}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Verifying...
                </span>
              ) : success ? (
                'Verified ✓'
              ) : (
                'Verify Code'
              )}
            </button>
          </form>

          {/* Resend Code */}
          <div className="mt-6 text-center">
            <button
              onClick={handleResendCode}
              disabled={resendLoading || success}
              className="text-blue-600 hover:text-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {resendLoading ? 'Sending...' : 'Resend Code'}
            </button>
          </div>

          {/* Back to Sign In */}
          <div className="mt-6 text-center">
            <Link
              href="/auth/signin"
              className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Sign In
            </Link>
          </div>
        </div>

        {/* Help Text */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Didn't receive a code? Check your WhatsApp or contact support.
          </p>
        </div>
      </motion.div>
    </div>
  );
}

export default function VerifyLogin2FACustomerPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <VerifyLogin2FACustomerContent />
    </Suspense>
  );
}


