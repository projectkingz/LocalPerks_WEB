'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';

function VerifyLogin2FAContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email');
  
  const [userId, setUserId] = useState<string | null>(null);
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingUser, setIsFetchingUser] = useState(true);
  const [error, setError] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const [codeSent, setCodeSent] = useState(false);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);
  const [deliveryMethod, setDeliveryMethod] = useState<'whatsapp' | 'email'>('whatsapp');

  // Function to send 2FA code
  const send2FACode = useCallback(async () => {
    if (!email) return;

    try {
      setIsSendingCode(true);
      setError('');
      
      console.log('📤 Sending 2FA code request for:', email);
      const response = await fetch('/api/auth/login-2fa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle different error status codes
        console.error('❌ Failed to send 2FA code:', data.message, 'Status:', response.status);
        setError(data.message || 'Failed to send verification code. Please try again.');
        setIsSendingCode(false);
        return;
      }

      if (data.codeSent) {
        setCodeSent(true);
        if (data.method) {
          setDeliveryMethod(data.method);
        }
        setResendCooldown(60);
        const timer = setInterval(() => {
          setResendCooldown((prev) => {
            if (prev <= 1) {
              clearInterval(timer);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
        console.log('✅ 2FA code sent successfully');
        console.log('💡 Check your server console for the verification code (in development mode)');
        setError(''); // Clear any previous errors
      } else {
        // Even if sending fails, the code should be in console for development
        console.warn('⚠️  Failed to send 2FA code:', data.message);
        console.warn('💡 Check the server console for the verification code');
        setError(data.message || 'Failed to send code, but check the console for the code in development mode');
        // Still mark as sent so user can try entering code from console
        setCodeSent(true);
      }
    } catch (err) {
      console.error('Error sending 2FA code:', err);
      setError('Failed to send verification code. Please try again.');
    } finally {
      setIsSendingCode(false);
    }
  }, [email]);

  useEffect(() => {
    if (!email) {
      router.push('/auth/signin');
      return;
    }

    // Only initialize once
    if (hasInitialized) return;

    let mounted = true;

    // Fetch userId from email and send 2FA code
    const initialize = async () => {
      try {
        setIsFetchingUser(true);
        console.log('🔄 Fetching user for email:', email);
        
        // Add timeout to prevent hanging
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
        
        try {
          const response = await fetch(`/api/auth/user-by-email?email=${encodeURIComponent(email)}`, {
            signal: controller.signal
          });
          
          clearTimeout(timeoutId);
          
          if (!response.ok) {
            console.error('❌ Failed to fetch user:', response.status);
            if (mounted) {
              setError('User not found');
              setIsFetchingUser(false);
            }
            return;
          }

          const userData = await response.json();
          console.log('✅ User fetched:', userData.id);
          
          if (mounted) {
            setUserId(userData.id);
            setHasInitialized(true);
            setIsFetchingUser(false);
            
            // After getting userId, automatically send the 2FA code
            console.log('📤 Sending 2FA code...');
            send2FACode();
          }
        } catch (fetchError: any) {
          clearTimeout(timeoutId);
          if (fetchError.name === 'AbortError') {
            console.error('❌ Request timeout');
            if (mounted) {
              setError('Request timed out. Please check your connection and try again.');
              setIsFetchingUser(false);
            }
            return;
          }
          throw fetchError;
        }
      } catch (err) {
        console.error('❌ Error initializing:', err);
        if (mounted) {
          setError('Failed to load user information. Please try again.');
          setIsFetchingUser(false);
        }
      }
    };

    initialize();

    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [email]);

  const handleCodeChange = (index: number, value: string) => {
    if (value.length > 1) return;
    
    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    if (value && index < 5) {
      const nextInput = document.getElementById(`code-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      const prevInput = document.getElementById(`code-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 6);
    const newCode = pastedData.split('').concat(['', '', '', '', '']).slice(0, 6);
    setCode(newCode);
    
    // Focus on the last input
    const lastIndex = Math.min(pastedData.length - 1, 5);
    const lastInput = document.getElementById(`code-${lastIndex}`);
    lastInput?.focus();
  };

  const handleVerify = async () => {
    if (!userId || !email) {
      setError('Missing user information');
      return;
    }

    const verificationCode = code.join('');
    
    if (verificationCode.length !== 6) {
      setError('Please enter the complete 6-digit code');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Verify 2FA code
      const response = await fetch('/api/auth/verify-login-2fa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, code: verificationCode }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle specific error cases
        if (data.error === 'CUSTOMER_EMAIL_VERIFICATION_REQUIRED') {
          router.push(`/auth/verify-email?userId=${userId}&email=${encodeURIComponent(email)}`);
          return;
        } else if (data.error === 'CUSTOMER_MOBILE_VERIFICATION_REQUIRED') {
          router.push(`/auth/verify-mobile?userId=${userId}&email=${encodeURIComponent(email)}`);
          return;
        } else if (data.error === 'ACCOUNT_SUSPENDED') {
          setError('Your account has been suspended. Please contact support.');
          setIsLoading(false);
          return;
        }
        
        setError(data.error || 'Invalid or expired verification code');
        setIsLoading(false);
        return;
      }

      // 2FA verification successful - now complete the login
      console.log('✅ 2FA verified, completing login...');
      
      // Use the special bypass password to complete login
      const signInResult = await signIn('credentials', {
        email: email,
        password: '__2FA_VERIFIED__',
        redirect: false,
      });

      if (signInResult?.error) {
        console.error('Sign-in error after 2FA:', signInResult.error);
        
        // Handle specific errors
        if (signInResult.error === 'ACCOUNT_SUSPENDED') {
          setError('Your account has been suspended. Please contact support.');
          setIsLoading(false);
          return;
        }
        
        setError('Failed to complete login. Please try again.');
        setIsLoading(false);
        return;
      }

      // Login successful - redirect to customer dashboard
      console.log('✅ Login successful!');
      router.push('/customer/dashboard');
      
    } catch (err) {
      console.error('Verification error:', err);
      setError('Network error. Please try again.');
      setIsLoading(false);
    }
  };

  if (isFetchingUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50/30">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm max-w-md mx-auto">
              {error}
              <button
                onClick={() => {
                  setHasInitialized(false);
                  setIsFetchingUser(true);
                  setError('');
                  window.location.reload();
                }}
                className="block mt-2 text-red-600 hover:text-red-800 underline"
              >
                Retry
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50/30 py-12 px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Two-Factor Authentication</h1>
          <p className="text-gray-600">
            {isSendingCode 
              ? 'Sending verification code...'
              : codeSent
                ? `We've sent a 6-digit verification code via ${deliveryMethod === 'whatsapp' ? 'WhatsApp' : 'email'}`
                : 'A 6-digit verification code will be sent to your WhatsApp or email'}
            <br />
            <span className="font-semibold text-gray-900">{email}</span>
          </p>
          <p className="text-xs text-gray-500 mt-2">
            💡 In development mode, check your server console for the code
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
            {error}
          </div>
        )}

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Enter verification code
            </label>
            <div className="flex gap-2" onPaste={handlePaste}>
              {code.map((digit, index) => (
                <input
                  key={index}
                  id={`code-${index}`}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleCodeChange(index, e.target.value.replace(/\D/g, ''))}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className="w-12 h-14 text-center text-2xl font-semibold border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-colors"
                  disabled={isLoading || !userId}
                />
              ))}
            </div>
          </div>

          <button
            onClick={handleVerify}
            disabled={isLoading || code.join('').length !== 6 || !userId}
            className="w-full bg-blue-600 text-white py-4 rounded-xl font-semibold hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Verifying...' : 'Verify & Sign In'}
          </button>

          <div className="text-center">
            <p className="text-sm text-gray-600 mb-2">
              Didn't receive the code?
            </p>
            <button
              onClick={send2FACode}
              disabled={isLoading || resendCooldown > 0 || isSendingCode || !userId}
              className="text-blue-600 font-semibold hover:text-blue-700 disabled:text-gray-400 disabled:cursor-not-allowed"
            >
              {isSendingCode 
                ? 'Sending...' 
                : resendCooldown > 0 
                  ? `Resend in ${resendCooldown}s` 
                  : 'Resend Code'}
            </button>
            {codeSent && (
              <p className="text-xs text-gray-500 mt-2">
                💡 Check your {deliveryMethod === 'whatsapp' ? 'WhatsApp' : 'email'} or server console for the code
              </p>
            )}
          </div>

          <div className="text-center pt-4 border-t border-gray-200">
            <button
              onClick={() => router.push('/auth/signin')}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              ← Back to Sign In
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function VerifyLogin2FACustomer() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50/30">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <VerifyLogin2FAContent />
    </Suspense>
  );
}

