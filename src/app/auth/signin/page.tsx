'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { signIn, getProviders, getSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { FaGoogle, FaGithub, FaFacebook } from 'react-icons/fa';
import Link from 'next/link';
import { Star } from 'lucide-react';

function SignInContent() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [providers, setProviders] = useState<any>(null);
  const [formErrors, setFormErrors] = useState({
    email: '',
    password: ''
  });
  const [touched, setTouched] = useState({
    email: false,
    password: false
  });
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [logoError, setLogoError] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const type = searchParams.get('type');
  const errorParam = searchParams.get('error');
  const callbackUrl = searchParams.get('callbackUrl') || 
    (type === 'admin' ? '/admin' : 
     type === 'partner' ? '/partner/dashboard' : 
     '/customer/dashboard');

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

  useEffect(() => {
    if (providers) {
      console.log('Current providers:', providers);
      const socialProviders = Object.values(providers).filter(
        (provider: any) => provider.id !== 'credentials'
      );
      console.log('Social providers:', socialProviders);
    }
  }, [providers]);

  useEffect(() => {
    // Handle URL error parameter
    console.log('Error parameter from URL:', errorParam);
    if (errorParam) {
      if (errorParam === 'account_under_review') {
        setError('⏳ ACCOUNT UNDER REVIEW - Your account is under review and will be activated by an administrator. You will be able to sign in once approved.');
      } else if (errorParam === 'email_verification_required') {
        setError('📧 EMAIL VERIFICATION REQUIRED - Please verify your email address before signing in. Check your inbox for the verification link.');
      } else if (errorParam === 'pending_approval') {
        setError('⏳ PENDING APPROVAL - Your account is pending approval. You will be notified once an administrator activates your account.');
      } else if (errorParam === 'suspended') {
        setError('🚫 ACCOUNT SUSPENDED - Your account has been suspended. Please contact support for assistance.');
      } else if (errorParam === 'email_password_only') {
        setError('This account was created with email and password. Please sign in using your email and password instead of social login.');
      } else if (errorParam === 'wrong_social_provider') {
        setError('This account was created with a different social login provider. Please use the same provider you used when signing up.');
      } else if (errorParam === 'OAuthAccountNotLinked') {
        setError('This account was created with a different authentication method. Please use the same method you used when signing up.');
      } else {
        setError(errorParam);
      }
    }
    
    // Handle success messages
    const messageParam = searchParams.get('message');
    if (messageParam === 'account_under_review') {
      setError('✅ Account created successfully! Your account is under review and will be activated by an administrator.');
    } else if (messageParam === 'verification_complete_pending_approval') {
      setError('✅ Verification complete! Your account is now pending admin approval. You will be able to sign in once an administrator activates your account.');
    } else if (messageParam === 'verification_complete') {
      setError('✅ Verification complete! You can now sign in with your credentials.');
    }
  }, [errorParam, searchParams]);

  const validateEmail = (email: string): string => {
    if (!email) {
      return 'Email is required';
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      return 'Please enter a valid email address';
    }
    return '';
  };

  const validatePassword = (password: string): string => {
    if (!password) {
      return 'Password is required';
    }
    if (password.length < 6) {
      return 'Password must be at least 6 characters';
    }
    return '';
  };

  const handleBlur = (field: 'email' | 'password') => {
    setTouched({ ...touched, [field]: true });
    if (field === 'email') {
      setFormErrors({ ...formErrors, email: validateEmail(email) });
    } else {
      setFormErrors({ ...formErrors, password: validatePassword(password) });
    }
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEmail = e.target.value;
    setEmail(newEmail);
    if (touched.email) {
      setFormErrors(prev => ({ ...prev, email: validateEmail(newEmail) }));
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPassword = e.target.value;
    setPassword(newPassword);
    if (touched.password) {
      setFormErrors(prev => ({ ...prev, password: validatePassword(newPassword) }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Validate all fields before submission
    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);
    setFormErrors({ email: emailError, password: passwordError });
    setTouched({ email: true, password: true });

    if (emailError || passwordError) {
      setLoading(false);
      return;
    }

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      console.log('SignIn result:', result);
      
      if (result?.error) {
        console.log('SignIn error:', result.error);
        
        if (result.error === '2FA_REQUIRED') {
          // Redirect to 2FA verification page
          window.location.href = `/auth/verify?email=${encodeURIComponent(email)}`;
          return;
        } else if (result.error === 'PARTNER_EMAIL_VERIFICATION_REQUIRED') {
          // Get userId from the user - we need to fetch it
          const userResponse = await fetch(`/api/auth/user-by-email?email=${encodeURIComponent(email)}`);
          if (userResponse.ok) {
            const userData = await userResponse.json();
            window.location.href = `/auth/verify-email?userId=${userData.id}&email=${encodeURIComponent(email)}`;
          } else {
            setError('Please complete email verification. Check your email for the verification code.');
          }
          return;
        } else if (result.error === 'PARTNER_MOBILE_VERIFICATION_REQUIRED') {
          // Get userId from the user
          const userResponse = await fetch(`/api/auth/user-by-email?email=${encodeURIComponent(email)}`);
          if (userResponse.ok) {
            const userData = await userResponse.json();
            window.location.href = `/auth/verify-mobile?userId=${userData.id}&email=${encodeURIComponent(email)}`;
          } else {
            setError('Please complete mobile verification.');
          }
          return;
        } else if (result.error === 'ACCOUNT_UNDER_REVIEW') {
          setError('⏳ ACCOUNT UNDER REVIEW - Your account is under review and will be activated by an administrator. You will be able to sign in once approved.');
        } else if (result.error === 'EMAIL_VERIFICATION_REQUIRED') {
          setError('📧 EMAIL VERIFICATION REQUIRED - Please verify your email address before signing in. Check your inbox for the verification link.');
        } else if (result.error === 'PENDING_APPROVAL') {
          setError('⏳ PENDING APPROVAL - Your account is pending approval. You will be notified once an administrator activates your account.');
        } else if (result.error === 'ACCOUNT_SUSPENDED') {
          setError('🚫 ACCOUNT SUSPENDED - Your account has been suspended. Please contact support for assistance.');
        } else if (result.error === 'SOCIAL_LOGIN_ONLY') {
          setError('This account was created with social login. Please sign in using the same social login provider you used when signing up.');
        } else if (result.error === 'CredentialsSignin') {
          setError('Sign In Details Incorrect - Please check your email and password and try again.');
        } else {
          setError(result.error);
        }
      } else {
        // Wait for session to update
        let session = null;
        let attempts = 0;
        while (attempts < 50) {
          session = await getSession();
          if (session?.user?.role) break;
          await new Promise(res => setTimeout(res, 100));
        }
        
        // Check if user is an admin (ADMIN or SUPER_ADMIN)
        const isAdmin = session?.user?.role === 'ADMIN' || session?.user?.role === 'SUPER_ADMIN';
        
        // Check if user is a partner (PARTNER only)
        const isPartner = session?.user?.role === 'PARTNER';
        
        if (isAdmin) {
          router.push('/admin');
        } else if (isPartner) {
          router.push('/partner/dashboard');
        } else {
          window.location.href = callbackUrl;
        }
      }
    } catch (error) {
      // Do not set a generic error message. Only set specific errors.
    } finally {
      setLoading(false);
    }
  };

  const handleSocialSignIn = (provider: string) => {
    signIn(provider, { callbackUrl });
  };

  // Only show social login section if there are providers other than credentials
  const socialProviders = providers ? Object.values(providers).filter(
    (provider: any) => provider.id !== 'credentials'
  ) : [];

  const showSocialLogin = socialProviders.length > 0;

  const fadeIn = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 }
  };

  if (isInitialLoad) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 bg-white rounded-2xl shadow-lg p-8">
          <div className="animate-pulse space-y-8">
            {/* Logo skeleton */}
            <div className="flex justify-center">
              <div className="w-20 h-20 bg-gray-200 rounded-full"></div>
            </div>
            
            {/* Title skeletons */}
            <div className="space-y-3 text-center">
              <div className="h-8 bg-gray-200 rounded-lg w-3/4 mx-auto"></div>
              <div className="h-4 bg-gray-200 rounded-lg w-1/2 mx-auto"></div>
            </div>

            {/* Social buttons skeleton */}
            <div className="space-y-4">
              <div className="h-14 bg-gray-200 rounded-xl w-full"></div>
              <div className="h-14 bg-gray-200 rounded-xl w-full"></div>
            </div>

            {/* Divider skeleton */}
            <div className="relative py-4">
              <div className="h-0.5 bg-gray-200 w-full"></div>
            </div>

            {/* Form fields skeleton */}
            <div className="space-y-4">
              <div className="h-14 bg-gray-200 rounded-xl w-full"></div>
              <div className="h-14 bg-gray-200 rounded-xl w-full"></div>
            </div>

            {/* Button skeleton */}
            <div className="h-14 bg-gray-200 rounded-xl w-full"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50/30 py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial="hidden"
        animate="visible"
        variants={fadeIn}
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
            Welcome Back
          </motion.h2>
          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="text-lg text-gray-600"
          >
            {type === 'admin' ? 'Sign in to access admin panel' : 
             type === 'partner' ? 'Sign in to access your partner profile' : 
             'Sign in to access your rewards'}
          </motion.p>
        </div>

        {/* Social Sign In Buttons */}
        <AnimatePresence>
          {showSocialLogin && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              {process.env.NEXT_PUBLIC_GOOGLE_ENABLED && (
                <motion.button
                  key="google"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1, duration: 0.3 }}
                  onClick={() => handleSocialSignIn('google')}
                  className="w-full flex items-center justify-center px-4 py-4 bg-white text-gray-700 rounded-xl border-2 border-gray-200 hover:border-blue-500 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-200 text-lg font-medium transition-all duration-200 transform hover:scale-[1.02]"
                >
                  <FaGoogle className="mr-2" /> Sign in with Google
                </motion.button>
              )}
              

              
              {process.env.NEXT_PUBLIC_FACEBOOK_ENABLED && (
                <motion.button
                  key="facebook"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.3 }}
                  onClick={() => handleSocialSignIn('facebook')}
                  className="w-full flex items-center justify-center px-4 py-4 bg-blue-600 text-white rounded-xl border-2 border-transparent hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 text-lg font-medium transition-all duration-200 transform hover:scale-[1.02]"
                >
                  <FaFacebook className="mr-2" /> Sign in with Facebook
                </motion.button>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {showSocialLogin && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.3 }}
            className="relative"
          >
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Or continue with email</span>
            </div>
          </motion.div>
        )}

        {showSocialLogin && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.45, duration: 0.3 }}
            className="text-center"
          >
            <p className="text-xs text-gray-500 bg-blue-50 px-3 py-2 rounded-lg border border-blue-100">
              💡 <strong>Security Note:</strong> You can only use the same authentication method you used when signing up. 
              If you signed up with email/password, you cannot use social login and vice versa.
            </p>
          </motion.div>
        )}

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
                type="email"
                name="email"
                id="email"
                value={email}
                onChange={handleEmailChange}
                onBlur={() => handleBlur('email')}
                required
                className="block w-full px-4 py-3.5 text-gray-900 bg-gray-50 border-2 border-gray-200 rounded-xl appearance-none transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 peer group-hover:border-gray-300"
                placeholder=" "
              />
              <label
                htmlFor="email"
                className="absolute text-sm font-medium text-gray-500 duration-200 transform -translate-y-4 scale-75 top-2 z-10 origin-[0] bg-gray-50 px-2 peer-focus:px-2 peer-focus:text-blue-600 peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 peer-focus:top-2 peer-focus:scale-75 peer-focus:-translate-y-4 left-1 peer-focus:bg-gray-50 group-hover:bg-gray-50"
              >
                Email address
              </label>
              {touched.email && formErrors.email && (
                <p className="mt-1 text-sm text-red-500">{formErrors.email}</p>
              )}
            </div>

            <div className="relative group">
              <input
                type="password"
                name="password"
                id="password"
                value={password}
                onChange={handlePasswordChange}
                onBlur={() => handleBlur('password')}
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
              {touched.password && formErrors.password && (
                <p className="mt-1 text-sm text-red-500">{formErrors.password}</p>
              )}
            </div>

            <div className="flex items-center justify-end">
              <Link
                href="/auth/forgot-password"
                className="text-sm font-medium text-blue-600 hover:text-blue-500 transition-colors"
              >
                Forgot your password?
              </Link>
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
                    {error?.toLowerCase().includes('suspend')
                      ? 'Your account has been suspended. Please contact Customer Support.'
                      : error}
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
                  Signing in...
                </div>
              ) : (
                'Sign In'
              )}
            </button>
          </motion.div>
        </motion.form>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.3 }}
          className="mt-8 space-y-4"
        >
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">New to Rewards?</span>
            </div>
          </div>

          <div className="flex flex-col space-y-3">
            <motion.a
              href="/auth/register/customer"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center justify-center px-4 py-3 border-2 border-blue-500 text-blue-600 rounded-xl hover:bg-blue-50 transition-colors duration-200 text-lg font-medium"
            >
              <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Sign up as a Customer
            </motion.a>

            <motion.a
              href="/auth/register/partner"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center justify-center px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors duration-200 text-lg font-medium"
            >
              <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              Register as a Partner
            </motion.a>
          </div>

          <p className="text-center text-sm text-gray-500">
            By signing up, you agree to our{' '}
            <a href="/terms" className="text-blue-600 hover:text-blue-500 font-medium">
              Terms of Service
            </a>{' '}
            and{' '}
            <a href="/privacy" className="text-blue-600 hover:text-blue-500 font-medium">
              Privacy Policy
            </a>
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SignInContent />
    </Suspense>
  );
}
