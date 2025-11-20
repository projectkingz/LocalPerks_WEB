'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';

function SignupSuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const verified = searchParams.get('verified');
  const userId = searchParams.get('userId');
  const email = searchParams.get('email');
  
  const [userData, setUserData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Fetch user data from session storage if available
    const storedUserId = sessionStorage.getItem('partnerUserId');
    const storedEmail = sessionStorage.getItem('partnerEmail');
    const storedTenant = sessionStorage.getItem('partnerTenant');
    
    if (storedUserId && storedEmail) {
      setUserData({
        userId: storedUserId,
        email: storedEmail,
        tenant: storedTenant ? JSON.parse(storedTenant) : null,
      });
    }
    
    setIsLoading(false);
  }, []);

  const handleStartVerification = () => {
    if (userData?.userId && userData?.email) {
      router.push(`/auth/verify-email?userId=${userData.userId}&email=${encodeURIComponent(userData.email)}`);
    } else {
      alert('User data not found. Please contact support.');
    }
  };

  // Show final success screen if verified
  if (verified === 'true') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50/30">
        <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Welcome to LocalPerks!</h1>
            
            <p className="text-lg text-gray-600 mb-8">
              Payment successful! Your partner account has been created and is pending admin approval.
            </p>
            
            <div className="bg-gray-50 rounded-xl p-6 mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">What's Next?</h3>
              <ul className="text-sm text-gray-700 space-y-2 text-left">
                <li>• Wait for admin approval (usually within 24 hours)</li>
                <li>• You'll receive an email when approved</li>
                <li>• Once approved, you can access your partner dashboard</li>
              </ul>
            </div>
            
            <div className="flex gap-4 justify-center">
              <button 
                onClick={() => window.location.href = '/partner/pending-approval'}
                className="bg-blue-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors"
              >
                Check Status
              </button>
              <button 
                onClick={() => router.push('/auth/signin')}
                className="bg-gray-100 text-gray-700 px-8 py-3 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
              >
                Sign In
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show verification prompt
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50/30">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50/30">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center">
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Complete Your Verification</h1>
          
          <p className="text-lg text-gray-600 mb-8">
            Payment successful! To activate your partner account, please complete email and mobile verification.
          </p>
          
          <div className="bg-blue-50 rounded-xl p-6 mb-8 text-left">
            <h3 className="text-lg font-semibold text-blue-900 mb-4">Verification Steps:</h3>
            <ol className="text-sm text-blue-800 space-y-3">
              <li className="flex items-start">
                <span className="font-bold mr-2">1.</span>
                <span><strong>Email Verification:</strong> A 6-digit code will be sent to your email address.</span>
              </li>
              <li className="flex items-start">
                <span className="font-bold mr-2">2.</span>
                <span><strong>Mobile Verification:</strong> A 6-digit code will be sent to your mobile number via WhatsApp.</span>
              </li>
              <li className="flex items-start">
                <span className="font-bold mr-2">3.</span>
                <span><strong>Admin Approval:</strong> Once verified, your account will be reviewed by our admin team.</span>
              </li>
            </ol>
          </div>
          
          <button 
            onClick={handleStartVerification}
            className="w-full bg-blue-600 text-white py-4 px-8 rounded-xl font-semibold hover:bg-blue-700 transition-colors"
          >
            Start Email Verification
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SignupSuccess() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50/30">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <SignupSuccessContent />
    </Suspense>
  );
}

