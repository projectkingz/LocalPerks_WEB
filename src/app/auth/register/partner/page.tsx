'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Star } from 'lucide-react';
import Link from 'next/link';

export default function PartnerRegistration() {
  const [logoError, setLogoError] = useState(false);
  const [formData, setFormData] = useState({
    businessName: '',
    ownerFirstName: '',
    ownerLastName: '',
    email: '',
    mobile: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/register/partner', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          businessName: formData.businessName,
          name: `${formData.ownerFirstName} ${formData.ownerLastName}`,
          email: formData.email,
          mobile: formData.mobile,
          password: formData.password
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      // Check if email verification is required
      if (data.requiresEmailVerification) {
        router.push(`/auth/verify-email?userId=${data.user.id}&email=${formData.email}`);
      } else {
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
            <div className="relative w-20 h-20">
              {logoError ? (
                <Star className="w-20 h-20 text-blue-600" />
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
            transition={{ delay: 0.2, duration: 0.5 }}
            className="text-4xl font-extrabold text-gray-900 mb-2"
          >
            Register Your Business
          </motion.h2>
          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="text-lg text-gray-600"
          >
            Start rewarding your loyal customers today
          </motion.p>
        </div>

        <motion.form
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="mt-8 space-y-6"
          onSubmit={handleSubmit}
        >
          <div className="space-y-5">
            <div className="relative group">
              <input
                type="text"
                name="businessName"
                id="businessName"
                value={formData.businessName}
                onChange={handleChange}
                required
                className="block w-full px-4 py-3.5 text-gray-900 bg-gray-50 border-2 border-gray-200 rounded-xl appearance-none transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 peer group-hover:border-gray-300"
                placeholder=" "
              />
              <label
                htmlFor="businessName"
                className="absolute text-sm font-medium text-gray-500 duration-200 transform -translate-y-4 scale-75 top-2 z-10 origin-[0] bg-gray-50 px-2 peer-focus:px-2 peer-focus:text-blue-600 peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 peer-focus:top-2 peer-focus:scale-75 peer-focus:-translate-y-4 left-1 peer-focus:bg-gray-50 group-hover:bg-gray-50"
              >
                Business Name
              </label>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="relative group">
                <input
                  type="text"
                  name="ownerFirstName"
                  id="ownerFirstName"
                  value={formData.ownerFirstName}
                  onChange={handleChange}
                  required
                  className="block w-full px-4 py-3.5 text-gray-900 bg-gray-50 border-2 border-gray-200 rounded-xl appearance-none transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 peer group-hover:border-gray-300"
                  placeholder=" "
                />
                <label
                  htmlFor="ownerFirstName"
                  className="absolute text-sm font-medium text-gray-500 duration-200 transform -translate-y-4 scale-75 top-2 z-10 origin-[0] bg-gray-50 px-2 peer-focus:px-2 peer-focus:text-blue-600 peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 peer-focus:top-2 peer-focus:scale-75 peer-focus:-translate-y-4 left-1 peer-focus:bg-gray-50 group-hover:bg-gray-50"
                >
                  Owner First Name
                </label>
              </div>
              <div className="relative group">
                <input
                  type="text"
                  name="ownerLastName"
                  id="ownerLastName"
                  value={formData.ownerLastName}
                  onChange={handleChange}
                  required
                  className="block w-full px-4 py-3.5 text-gray-900 bg-gray-50 border-2 border-gray-200 rounded-xl appearance-none transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 peer group-hover:border-gray-300"
                  placeholder=" "
                />
                <label
                  htmlFor="ownerLastName"
                  className="absolute text-sm font-medium text-gray-500 duration-200 transform -translate-y-4 scale-75 top-2 z-10 origin-[0] bg-gray-50 px-2 peer-focus:px-2 peer-focus:text-blue-600 peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 peer-focus:top-2 peer-focus:scale-75 peer-focus:-translate-y-4 left-1 peer-focus:bg-gray-50 group-hover:bg-gray-50"
                >
                  Owner Last Name
                </label>
              </div>
            </div>

            <div className="relative group">
              <input
                type="email"
                name="email"
                id="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="block w-full px-4 py-3.5 text-gray-900 bg-gray-50 border-2 border-gray-200 rounded-xl appearance-none transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 peer group-hover:border-gray-300"
                placeholder=" "
              />
              <label
                htmlFor="email"
                className="absolute text-sm font-medium text-gray-500 duration-200 transform -translate-y-4 scale-75 top-2 z-10 origin-[0] bg-gray-50 px-2 peer-focus:px-2 peer-focus:text-blue-600 peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 peer-focus:top-2 peer-focus:scale-75 peer-focus:-translate-y-4 left-1 peer-focus:bg-gray-50 group-hover:bg-gray-50"
              >
                Business Email
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
                className="block w-full px-4 py-3.5 text-gray-900 bg-gray-50 border-2 border-gray-200 rounded-xl appearance-none transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 peer group-hover:border-gray-300"
                placeholder=" "
              />
              <label
                htmlFor="mobile"
                className="absolute text-sm font-medium text-gray-500 duration-200 transform -translate-y-4 scale-75 top-2 z-10 origin-[0] bg-gray-50 px-2 peer-focus:px-2 peer-focus:text-blue-600 peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 peer-focus:top-2 peer-focus:scale-75 peer-focus:-translate-y-4 left-1 peer-focus:bg-gray-50 group-hover:bg-gray-50"
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
                className="block w-full px-4 py-3.5 text-gray-900 bg-gray-50 border-2 border-gray-200 rounded-xl appearance-none transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 peer group-hover:border-gray-300"
                placeholder=" "
              />
              <label
                htmlFor="password"
                className="absolute text-sm font-medium text-gray-500 duration-200 transform -translate-y-4 scale-75 top-2 z-10 origin-[0] bg-gray-50 px-2 peer-focus:px-2 peer-focus:text-blue-600 peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 peer-focus:top-2 peer-focus:scale-75 peer-focus:-translate-y-4 left-1 peer-focus:bg-gray-50 group-hover:bg-gray-50"
              >
                Password
              </label>
            </div>

            <div className="relative group">
              <input
                type="password"
                name="confirmPassword"
                id="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                className="block w-full px-4 py-3.5 text-gray-900 bg-gray-50 border-2 border-gray-200 rounded-xl appearance-none transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 peer group-hover:border-gray-300"
                placeholder=" "
              />
              <label
                htmlFor="confirmPassword"
                className="absolute text-sm font-medium text-gray-500 duration-200 transform -translate-y-4 scale-75 top-2 z-10 origin-[0] bg-gray-50 px-2 peer-focus:px-2 peer-focus:text-blue-600 peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 peer-focus:top-2 peer-focus:scale-75 peer-focus:-translate-y-4 left-1 peer-focus:bg-gray-50 group-hover:bg-gray-50"
              >
                Confirm Password
              </label>
            </div>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
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
              disabled={loading}
              className={`group relative w-full flex justify-center py-3.5 px-4 border border-transparent text-lg font-semibold rounded-xl text-white shadow-sm ${
                loading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200'
              }`}
            >
              {loading ? (
                <div className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating account...
                </div>
              ) : (
                'Create Account'
              )}
            </button>
          </motion.div>

          <div className="text-center mt-4">
            <p className="text-sm text-gray-600">
              Already have a partner account?{' '}
              <Link
                href="/auth/signin?type=partner"
                className="font-medium text-blue-600 hover:text-blue-500 transition-colors duration-200"
              >
                Sign in here
              </Link>
            </p>
          </div>
        </motion.form>

        <div className="mt-6">
          <p className="text-center text-sm text-gray-500">
            Already have an account?{' '}
            <a href="/auth/signin" className="font-medium text-blue-600 hover:text-blue-500">
              Sign in
            </a>
          </p>
        </div>
      </motion.div>
    </div>
  );
} 