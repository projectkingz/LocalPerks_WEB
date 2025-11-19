'use client';

import Link from 'next/link';

export default function AdminSubscriptions() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-lg shadow p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Subscription Management Offline</h1>
          <p className="text-gray-600 mb-4">
            Subscription tracking now happens outside the LocalPerks admin portal. Follow the offline process in the operations playbook to review or update partner subscriptions.
          </p>
          <p className="text-gray-600">
            If you reached this page from a bookmark, head back to the{' '}
            <Link href="/admin" className="text-blue-600 hover:underline">
              admin dashboard
            </Link>{' '}
            to keep managing rewards, redemptions, or customer accounts.
          </p>
        </div>
      </div>
    </div>
  );
}




