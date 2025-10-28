'use client';

export default function SignupSuccess() {
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
              onClick={() => window.location.href = '/partner/dashboard'}
              className="bg-blue-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors"
            >
              Go to Dashboard
            </button>
            <button 
              onClick={() => window.location.href = '/partner/pending-approval'}
              className="bg-gray-100 text-gray-700 px-8 py-3 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
            >
              Check Status
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

