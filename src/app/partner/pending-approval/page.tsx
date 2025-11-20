'use client';

export default function PendingApproval() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50/30 py-12 px-4">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center">
          <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
            </svg>
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-4">Account Pending Approval</h1>

          <p className="text-lg text-gray-600 mb-8">
            Your partner account is awaiting admin approval. We'll notify you once it's been reviewed.
          </p>

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-6">
            <h3 className="font-semibold text-blue-900 mb-4">What to Expect</h3>
            <ul className="text-sm text-blue-800 space-y-2 text-left">
              <li>• Your account is pending review by our admin team</li>
              <li>• Approval typically takes 24-48 hours</li>
              <li>• You'll receive an email notification when your account is approved</li>
              <li>• Once approved, you can access your partner dashboard</li>
            </ul>
          </div>

          <div className="flex gap-4 justify-center">
            <button 
              onClick={() => window.location.href = '/auth/signin'}
              className="bg-gray-100 text-gray-700 px-8 py-3 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
            >
              Return to Sign In
            </button>
            <button 
              onClick={() => window.location.href = '/partner'}
              className="bg-blue-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors"
            >
              Learn More
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

