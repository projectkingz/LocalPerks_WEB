'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signIn, getProviders } from 'next-auth/react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { FaGoogle, FaFacebook } from 'react-icons/fa';
import { Star } from 'lucide-react';
import Link from 'next/link';

export default function CustomerRegistration() {
  const [logoError, setLogoError] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    mobile: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [providers, setProviders] = useState<any>(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const loadProviders = async () => {
      try {
        const providers = await getProviders();
        console.log('Available providers:', providers);
        setProviders(providers);
      } finally {
        setIsInitialLoad(false);
      }
    };
    loadProviders();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/register/customer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          mobile: formData.mobile,
          password: formData.password
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      // Check if mobile verification is required (MANDATORY WhatsApp 2FA)
      if (data.requiresMobileVerification) {
        // Redirect to mobile verification page
        router.push(`/auth/verify-mobile?userId=${data.user.id}&email=${encodeURIComponent(data.user.email)}`);
      } else {
        // Redirect to sign in page
        router.push('/auth/signin?registered=true');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during registration');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSocialSignIn = (provider: string) => {
    signIn(provider, { callbackUrl: '/customer/dashboard' });
  };

  // Only show social login section if there are providers other than credentials
  const socialProviders = providers ? Object.values(providers).filter(
    (provider: any) => provider.id !== 'credentials'
  ) : [];

  const showSocialLogin = socialProviders.length > 0;

  if (isInitialLoad) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-blue-50/40 to-indigo-50/30 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl w-full space-y-8 bg-white rounded-3xl shadow-2xl p-12 md:p-16 border-2 border-gray-100">
          <div className="animate-pulse space-y-8">
            <div className="flex justify-center">
              <div className="w-24 h-24 bg-gray-200 rounded-full"></div>
            </div>
            <div className="space-y-3 text-center">
              <div className="h-10 bg-gray-200 rounded-lg w-3/4 mx-auto"></div>
              <div className="h-5 bg-gray-200 rounded-lg w-1/2 mx-auto"></div>
            </div>
            <div className="space-y-4">
              <div className="h-16 bg-gray-200 rounded-xl w-full"></div>
            </div>
            <div className="space-y-8">
              <div className="h-20 bg-gray-200 rounded-3xl w-full"></div>
              <div className="h-20 bg-gray-200 rounded-3xl w-full"></div>
              <div className="h-20 bg-gray-200 rounded-3xl w-full"></div>
              <div className="h-20 bg-gray-200 rounded-3xl w-full"></div>
            </div>
            <div className="h-20 bg-gray-200 rounded-3xl w-full"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-blue-50/40 to-indigo-50/30 py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="max-w-2xl w-full space-y-12 bg-white rounded-3xl shadow-2xl p-12 md:p-16 border-2 border-gray-100/50 backdrop-blur-sm"
      >
        <div className="text-center">
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="flex justify-center mb-8"
          >
            <div className="relative w-28 h-28 md:w-32 md:h-32">
              {logoError ? (
                <Star className="w-28 h-28 md:w-32 md:h-32 text-blue-600" />
              ) : (
                <Image
                  src="/logo.png"
                  alt="LocalPerks Logo"
                  fill
                  className="object-contain"
                  priority
                  onError={() => setLogoError(true)}
                />
              )}
            </div>
          </motion.div>
          <motion.h2
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="text-5xl md:text-6xl font-extrabold text-gray-900 mb-3 tracking-tight"
          >
            Create Your Account
          </motion.h2>
          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="text-xl md:text-2xl text-gray-600 font-medium"
          >
            Join our rewards program and start earning points
          </motion.p>
        </div>

        {/* Social Sign In Buttons */}
        <AnimatePresence>
          {showSocialLogin && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              className="space-y-4"
            >
              {process.env.NEXT_PUBLIC_GOOGLE_ENABLED && (
                <motion.button
                  key="google"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1, duration: 0.4 }}
                  onClick={() => handleSocialSignIn('google')}
                  className="w-full flex items-center justify-center px-6 py-5 bg-white text-gray-700 rounded-2xl border-2 border-gray-200 hover:border-blue-500 hover:bg-gray-50 focus:outline-none focus:ring-4 focus:ring-blue-200 text-lg font-semibold transition-all duration-200 transform hover:scale-[1.02] shadow-md hover:shadow-lg"
                >
                  <FaGoogle className="mr-3 text-xl" /> Sign up with Google
                </motion.button>
              )}

              {process.env.NEXT_PUBLIC_FACEBOOK_ENABLED && (
                <motion.button
                  key="facebook"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.4 }}
                  onClick={() => handleSocialSignIn('facebook')}
                  className="w-full flex items-center justify-center px-6 py-5 bg-blue-600 text-white rounded-2xl border-2 border-transparent hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-500 focus:ring-offset-2 text-lg font-semibold transition-all duration-200 transform hover:scale-[1.02] shadow-lg hover:shadow-xl"
                >
                  <FaFacebook className="mr-3 text-xl" /> Sign up with Facebook
                </motion.button>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {showSocialLogin && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.4 }}
            className="relative py-2"
          >
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t-2 border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500 font-medium text-base">Or continue with email</span>
            </div>
          </motion.div>
        )}

        {showSocialLogin && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.45, duration: 0.4 }}
            className="text-center"
          >
            <p className="text-sm text-gray-500 bg-blue-50 px-4 py-3 rounded-xl border-2 border-blue-100 font-medium">
              💡 <strong>Security Note:</strong> Choose your authentication method carefully.
              Once you sign up with email/password or social login, you can only use that method for future sign-ins.
            </p>
          </motion.div>
        )}

        <motion.form
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="mt-10 space-y-8"
          onSubmit={handleSubmit}
        >
          <div className="space-y-8">
            <div className="relative group">
              <input
                type="text"
                name="name"
                id="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="block w-full px-8 py-8 text-2xl text-gray-900 bg-gray-50 border-2 border-gray-200 rounded-3xl appearance-none transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-blue-500/30 focus:border-blue-500 focus:bg-white peer group-hover:border-gray-300 shadow-lg hover:shadow-xl min-h-[80px]"
                placeholder=" "
              />
              <label
                htmlFor="name"
                className="absolute text-xl font-medium text-gray-600 duration-200 transform -translate-y-4 scale-75 top-4 z-10 origin-[0] bg-white px-3 peer-focus:px-3 peer-focus:text-blue-600 peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 peer-focus:top-4 peer-focus:scale-75 peer-focus:-translate-y-4 left-3 peer-focus:bg-white group-hover:bg-white"
              >
                First Name
              </label>
            </div>

            <div className="relative group">
              <input
                type="email"
                name="email"
                id="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="block w-full px-8 py-8 text-2xl text-gray-900 bg-gray-50 border-2 border-gray-200 rounded-3xl appearance-none transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-blue-500/30 focus:border-blue-500 focus:bg-white peer group-hover:border-gray-300 shadow-lg hover:shadow-xl min-h-[80px]"
                placeholder=" "
              />
              <label
                htmlFor="email"
                className="absolute text-xl font-medium text-gray-600 duration-200 transform -translate-y-4 scale-75 top-4 z-10 origin-[0] bg-white px-3 peer-focus:px-3 peer-focus:text-blue-600 peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 peer-focus:top-4 peer-focus:scale-75 peer-focus:-translate-y-4 left-3 peer-focus:bg-white group-hover:bg-white"
              >
                Email address
              </label>
            </div>

            <div className="relative group">
              <input
                type="tel"
                name="mobile"
                id="mobile"
                value={formData.mobile}
                onChange={handleChange}
                required
                className="block w-full px-8 py-8 text-2xl text-gray-900 bg-gray-50 border-2 border-gray-200 rounded-3xl appearance-none transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-blue-500/30 focus:border-blue-500 focus:bg-white peer group-hover:border-gray-300 shadow-lg hover:shadow-xl min-h-[80px]"
                placeholder=" "
              />
              <label
                htmlFor="mobile"
                className="absolute text-xl font-medium text-gray-600 duration-200 transform -translate-y-4 scale-75 top-4 z-10 origin-[0] bg-white px-3 peer-focus:px-3 peer-focus:text-blue-600 peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 peer-focus:top-4 peer-focus:scale-75 peer-focus:-translate-y-4 left-3 peer-focus:bg-white group-hover:bg-white"
              >
                Mobile Number
              </label>
            </div>

            <div className="relative group">
              <input
                type="password"
                name="password"
                id="password"
                value={formData.password}
                onChange={handleChange}
                required
                className="block w-full px-8 py-8 text-2xl text-gray-900 bg-gray-50 border-2 border-gray-200 rounded-3xl appearance-none transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-blue-500/30 focus:border-blue-500 focus:bg-white peer group-hover:border-gray-300 shadow-lg hover:shadow-xl min-h-[80px]"
                placeholder=" "
              />
              <label
                htmlFor="password"
                className="absolute text-xl font-medium text-gray-600 duration-200 transform -translate-y-4 scale-75 top-4 z-10 origin-[0] bg-white px-3 peer-focus:px-3 peer-focus:text-blue-600 peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 peer-focus:top-4 peer-focus:scale-75 peer-focus:-translate-y-4 left-3 peer-focus:bg-white group-hover:bg-white"
              >
                Password
              </label>
            </div>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="rounded-2xl bg-red-50 p-5 border-2 border-red-200 shadow-md"
            >
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-base font-semibold text-red-800" role="alert">
                    {error}
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          <motion.div
            whileHover={{ scale: loading ? 1 : 1.02 }}
            whileTap={{ scale: loading ? 1 : 0.98 }}
            className="pt-2"
          >
            <button
              type="submit"
              disabled={loading}
              className={`group relative w-full flex justify-center py-8 px-8 border border-transparent text-2xl font-bold rounded-3xl text-white shadow-xl transition-all duration-200 min-h-[80px] ${
                loading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-offset-2 focus:ring-blue-500 hover:shadow-2xl transform hover:scale-[1.02]'
              }`}
            >
              {loading ? (
                <div className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span className="text-2xl">Creating account...</span>
                </div>
              ) : (
                <span className="text-2xl">Create Account</span>
              )}
            </button>
          </motion.div>

          <div className="text-center pt-4">
            <p className="text-base text-gray-600 font-medium">
              Already have an account?{' '}
              <Link
                href="/auth/signin"
                className="font-bold text-blue-600 hover:text-blue-700 transition-colors duration-200 underline decoration-2 underline-offset-2"
              >
                Sign in here
              </Link>
            </p>
          </div>
        </motion.form>
      </motion.div>
    </div>
  );
}
