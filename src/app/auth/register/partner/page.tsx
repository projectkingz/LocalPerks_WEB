'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Star, CreditCard, Check } from 'lucide-react';
import Link from 'next/link';

function PartnerRegistrationContent() {
  const [logoError, setLogoError] = useState(false);
  const [formData, setFormData] = useState({
    businessName: '',
    fullName: '',
    email: '',
    mobile: '',
    password: ''
  });
  const [subscriptionTiers, setSubscriptionTiers] = useState<any[]>([]);
  const [selectedTier, setSelectedTier] = useState('BASIC');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: Registration, 2: Subscription, 3: Authentication
  const [tenantId, setTenantId] = useState('');
  const [userId, setUserId] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();

  // Handle URL parameters for step and user data
  useEffect(() => {
    const stepParam = searchParams.get('step');
    const userIdParam = searchParams.get('userId');
    const emailParam = searchParams.get('email');
    const paymentSuccess = searchParams.get('payment') === 'success';
    
    if (stepParam) {
      const stepNumber = parseInt(stepParam);
      setStep(stepNumber);
      
      // If coming from payment success, ensure we stay on step 3
      if (paymentSuccess && stepNumber === 3) {
        router.push('/partner/dashboard'); return;
      }
    }
    
    if (userIdParam) {
      setUserId(userIdParam);
    }
    
    if (emailParam) {
      setFormData(prev => ({ ...prev, email: emailParam }));
    }
  }, [searchParams, router]);

  // Check subscription status when component mounts or userId changes
  useEffect(() => {
    const checkSubscriptionStatus = async () => {
      if (!userId) return;
      
      try {
        const response = await fetch(`/api/partner/subscription-status?userId=${userId}`);
        if (response.ok) {
          const data = await response.json();
          
          // If no active subscription and trying to go to step 3, redirect to step 2
          if (!data.hasActiveSubscription && false && false && step === 3) {
            setStep(2);
            setError('Payment required before verification. Please complete your subscription first.');
          }
        }
      } catch (error) {
        console.error('Error checking subscription status:', error);
      }
    };

    checkSubscriptionStatus();
  }, [userId, step]);

  // Fetch subscription tiers
  useEffect(() => {
    const fetchTiers = async () => {
      try {
        const response = await fetch('/api/subscription-tiers');
        if (response.ok) {
          const data = await response.json();
          setSubscriptionTiers(data.subscriptionTiers || []);
        }
      } catch (error) {
        console.error('Error fetching subscription tiers:', error);
      }
    };
    fetchTiers();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/register/partner', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          businessName: formData.businessName,
          name: formData.fullName,
          email: formData.email,
          mobile: formData.mobile,
          password: formData.password
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      // Store tenant ID and user ID, move to subscription step
      setTenantId(data.tenant.id);
      setUserId(data.user.id);
      setStep(2);
    } catch (err: any) {
      setError(err.message || 'An error occurred during registration');
    } finally {
      setLoading(false);
    }
  };

  const handleSubscriptionPayment = async () => {
    setError('');
    setLoading(true);

    try {
      // Create Stripe checkout session
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
          body: JSON.stringify({
            email: formData.email,
            name: formData.fullName,
            tenantId: tenantId,
            tierName: selectedTier,
          }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session');
      }

      // Redirect to Stripe checkout
      window.location.href = data.url;
    } catch (err: any) {
      setError(err.message || 'An error occurred during payment setup');
      setLoading(false);
    }
  };

  const handleSkipToAuthentication = async () => {
    // Check subscription status before allowing skip
    if (userId) {
      try {
        const response = await fetch(`/api/partner/subscription-status?userId=${userId}`);
        if (response.ok) {
          const data = await response.json();
          if (!data.hasActiveSubscription) {
            setError('Payment required before verification. Please complete your subscription first.');
            return;
          }
        }
      } catch (error) {
        console.error('Error checking subscription status:', error);
        setError('Unable to verify subscription status. Please try again.');
        return;
      }
    }
    
    router.push('/partner/dashboard'); return;
  };

  const handleStepChange = async (newStep: number) => {
    // If trying to go to step 3, check subscription status first
    if (newStep === 3 && userId) {
      try {
        const response = await fetch(`/api/partner/subscription-status?userId=${userId}`);
        if (response.ok) {
          const data = await response.json();
          if (!data.hasActiveSubscription) {
            setError('Payment required before verification. Please complete your subscription first.');
            setStep(2);
            return;
          }
        }
      } catch (error) {
        console.error('Error checking subscription status:', error);
        setError('Unable to verify subscription status. Please try again.');
        return;
      }
    }
    
    setStep(newStep);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-blue-50/40 to-indigo-50/30 py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="max-w-2xl w-full space-y-10 bg-white rounded-3xl shadow-2xl p-10 md:p-12 border-2 border-gray-100/50 backdrop-blur-sm"
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
            Register Your Business
          </motion.h2>
          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="text-xl md:text-2xl text-gray-600 font-medium"
          >
            Start rewarding your loyal customers today
          </motion.p>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center justify-center mb-10">
          <div className="flex items-center space-x-3">
            <div className={`flex items-center justify-center w-12 h-12 rounded-full text-lg font-bold ${
              step >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
            }`}>
              1
            </div>
            <div className={`w-12 h-1 ${step >= 2 ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
            <div className={`flex items-center justify-center w-12 h-12 rounded-full text-lg font-bold ${
              step >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
            }`}>
              2
            </div>
            <div className={`w-12 h-1 ${step >= 3 ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
            <div className={`flex items-center justify-center w-12 h-12 rounded-full text-lg font-bold ${
              step >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
            }`}>
              3
            </div>
          </div>
        </div>

        {step === 1 && (
          <motion.form
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="mt-10 space-y-8"
            onSubmit={handleSubmit}
          >
          <div className="space-y-6">
            <div className="relative group">
              <input
                type="text"
                name="businessName"
                id="businessName"
                value={formData.businessName}
                onChange={handleChange}
                required
                className="block w-full px-8 py-8 text-2xl text-gray-900 bg-gray-50 border-2 border-gray-200 rounded-3xl appearance-none transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-blue-500/30 focus:border-blue-500 focus:bg-white peer group-hover:border-gray-300 shadow-lg hover:shadow-xl min-h-[80px]"
                placeholder=" "
              />
              <label
                htmlFor="businessName"
                className="absolute text-xl font-medium text-gray-600 duration-200 transform -translate-y-4 scale-75 top-4 z-10 origin-[0] bg-white px-3 peer-focus:px-3 peer-focus:text-blue-600 peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 peer-focus:top-4 peer-focus:scale-75 peer-focus:-translate-y-4 left-3 peer-focus:bg-white group-hover:bg-white"
              >
                Business Name
              </label>
            </div>

            <div className="relative group">
              <input
                type="text"
                name="fullName"
                id="fullName"
                value={formData.fullName}
                onChange={handleChange}
                required
                className="block w-full px-8 py-8 text-2xl text-gray-900 bg-gray-50 border-2 border-gray-200 rounded-3xl appearance-none transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-blue-500/30 focus:border-blue-500 focus:bg-white peer group-hover:border-gray-300 shadow-lg hover:shadow-xl min-h-[80px]"
                placeholder=" "
              />
              <label
                htmlFor="fullName"
                className="absolute text-xl font-medium text-gray-600 duration-200 transform -translate-y-4 scale-75 top-4 z-10 origin-[0] bg-white px-3 peer-focus:px-3 peer-focus:text-blue-600 peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 peer-focus:top-4 peer-focus:scale-75 peer-focus:-translate-y-4 left-3 peer-focus:bg-white group-hover:bg-white"
              >
                Full Name
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
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
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
                  <span className="text-2xl">Continue to Payment</span>
                )}
              </button>
            </motion.div>

            <div className="text-center pt-4">
              <p className="text-base text-gray-600 font-medium">
                Already have a partner account?{' '}
                <Link
                  href="/auth/signin?type=partner"
                  className="font-bold text-blue-600 hover:text-blue-700 transition-colors duration-200 underline decoration-2 underline-offset-2"
                >
                  Sign in here
                </Link>
              </p>
            </div>
          </motion.form>
        )}

        {step === 2 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="mt-10 space-y-8"
          >
            <div className="text-center mb-8">
              <h3 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-3 tracking-tight">Choose Your Subscription Plan</h3>
              <p className="text-xl md:text-2xl text-gray-600 font-medium">Select a plan to start your partner journey</p>
              {userId && !searchParams.get('payment') && (
                <div className="mt-4 bg-yellow-50 border-2 border-yellow-200 rounded-2xl p-6 shadow-md">
                  <div className="flex items-center justify-center">
                    <svg className="w-6 h-6 text-yellow-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    <span className="text-yellow-800 font-bold text-lg">Payment Required</span>
                  </div>
                  <p className="text-yellow-700 text-base font-medium mt-2">Please complete your subscription to continue with verification.</p>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {subscriptionTiers.map((tier: any) => (
                <motion.div
                  key={tier.name}
                  whileHover={{ scale: 1.02 }}
                  className={`relative border-2 rounded-3xl p-8 cursor-pointer transition-all duration-200 shadow-lg hover:shadow-xl ${
                    selectedTier === tier.name
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedTier(tier.name)}
                >
                  {selectedTier === tier.name && (
                    <div className="absolute top-6 right-6">
                      <Check className="h-8 w-8 text-blue-600" />
                    </div>
                  )}
                  
                  <div className="flex items-center mb-6">
                    <CreditCard className="h-8 w-8 text-blue-600 mr-3" />
                    <h4 className="text-2xl font-bold text-gray-900">{tier.displayName}</h4>
                  </div>
                  
                  <div className="text-4xl font-extrabold text-blue-600 mb-3">
                    £{tier.price}
                    <span className="text-lg font-medium text-gray-500">/28 days</span>
                  </div>
                  
                  <p className="text-base text-gray-600 font-medium">
                    {tier.name === 'BASIC' && 'Perfect for small businesses starting out'}
                    {tier.name === 'PLUS' && 'Great for growing businesses with more customers'}
                    {tier.name === 'PREMIUM' && 'Ideal for established businesses with high volume'}
                    {tier.name === 'ELITE' && 'For large businesses with premium features'}
                  </p>
                </motion.div>
              ))}
            </div>

            <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-6 shadow-md">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-bold text-blue-800 mb-3">Billing Information</h3>
                  <div className="space-y-2 text-base text-blue-700 font-medium">
                    <p>• You'll be billed every 28 days starting from today</p>
                    <p>• You can upgrade or downgrade your plan anytime</p>
                    <p>• Cancel anytime with no long-term commitment</p>
                  </div>
                </div>
              </div>
            </div>

            <motion.div
              whileHover={{ scale: loading ? 1 : 1.02 }}
              whileTap={{ scale: loading ? 1 : 0.98 }}
            >
              <button
                onClick={handleSubscriptionPayment}
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
                    <span className="text-2xl">Processing...</span>
                  </div>
                ) : (
                  <span className="text-2xl">Pay £{subscriptionTiers.find((t: any) => t.name === selectedTier)?.price || 19} and Continue</span>
                )}
              </button>
            </motion.div>

            <div className="text-center">
              <button
                onClick={() => setStep(1)}
                className="text-base font-semibold text-gray-600 hover:text-gray-800 transition-colors duration-200"
              >
                ← Back to Registration
              </button>
            </div>
          </motion.div>
        )}

        {false && false && step === 3 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="mt-10 space-y-8"
          >
            <div className="text-center mb-8">
              <h3 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-3 tracking-tight">Verify Your Account</h3>
              <p className="text-xl md:text-2xl text-gray-600 font-medium">Complete authentication to activate your partner account</p>
              {searchParams.get('payment') === 'success' && (
                <div className="mt-4 bg-green-50 border border-green-200 rounded-xl p-4">
                  <div className="flex items-center justify-center">
                    <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-green-800 font-bold text-lg">Payment Successful!</span>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-8 shadow-md">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="h-8 w-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <h4 className="text-2xl font-bold text-blue-900 mb-4">Next Steps</h4>
                  <div className="space-y-3 text-base text-blue-800 font-medium">
                    <p>• Check your email for verification code</p>
                    <p>• Verify your mobile number with SMS code</p>
                    <p>• Wait for admin approval (usually within 24 hours)</p>
                    <p>• You'll receive an email when your account is approved</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-gray-50 rounded-2xl p-6 shadow-md">
                <h4 className="text-xl font-bold text-gray-900 mb-4">Account Status</h4>
                <div className="space-y-3 text-base text-gray-600 font-medium">
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-yellow-400 rounded-full mr-3"></div>
                    <span>Registration: Complete</span>
                  </div>
                  <div className="flex items-center">
                    <div className={`w-2 h-2 rounded-full mr-3 ${
                      searchParams.get('payment') === 'success' ? 'bg-green-400' : 'bg-yellow-400'
                    }`}></div>
                    <span>Subscription: {searchParams.get('payment') === 'success' ? 'Payment Complete' : 'Pending Payment'}</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-gray-300 rounded-full mr-3"></div>
                    <span>Email Verification: Pending</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-gray-300 rounded-full mr-3"></div>
                    <span>Mobile Verification: Pending</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-gray-300 rounded-full mr-3"></div>
                    <span>Admin Approval: Pending</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-6">
                <button
                  onClick={() => router.push(`/auth/verify-email?userId=${userId}&email=${formData.email}`)}
                  className="flex-1 bg-blue-600 text-white py-6 px-8 rounded-3xl text-xl font-bold hover:bg-blue-700 transition-all duration-200 shadow-xl hover:shadow-2xl transform hover:scale-[1.02] min-h-[80px]"
                >
                  Verify Email & Mobile
                </button>
                <button
                  onClick={handleSkipToAuthentication}
                  className="flex-1 bg-gray-100 text-gray-700 py-6 px-8 rounded-3xl text-xl font-bold hover:bg-gray-200 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-[1.02] min-h-[80px]"
                >
                  Skip for Now
                </button>
              </div>
            </div>

            <div className="text-center">
              <button
                onClick={() => handleStepChange(2)}
                className="text-base font-semibold text-gray-600 hover:text-gray-800 transition-colors duration-200"
              >
                ← Back to Subscription
              </button>
            </div>
          </motion.div>
        )}

        <div className="mt-6">
          <p className="text-center text-base text-gray-600 font-medium">
            Already have an account?{' '}
            <a href="/auth/signin" className="font-bold text-blue-600 hover:text-blue-700 underline decoration-2 underline-offset-2">
              Sign in
            </a>
          </p>
        </div>
      </motion.div>
    </div>
  );
}

export default function PartnerRegistration() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50/30">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <PartnerRegistrationContent />
    </Suspense>
  );
}
