'use client';

import { ReactNode } from 'react';
import { useSession } from 'next-auth/react';
import SuspendedBanner from './SuspendedBanner';
import { AlertTriangle, Lock } from 'lucide-react';

interface SuspendedUserWrapperProps {
  children: ReactNode;
}

export default function SuspendedUserWrapper({ children }: SuspendedUserWrapperProps) {
  const { data: session } = useSession();
  const isSuspended = session?.user?.suspended;

  if (!isSuspended) {
    return <>{children}</>;
  }

  return (
    <div className="relative">
      {/* Suspended Banner */}
      <SuspendedBanner />
      
      {/* Main Content with Overlay */}
      <div className="relative">
        {/* Overlay to prevent interactions */}
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 pointer-events-auto" />
        
        {/* Suspended Content */}
        <div className="relative z-50 min-h-screen bg-gray-50 py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center py-16">
              <div className="mx-auto w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mb-6">
                <Lock className="h-12 w-12 text-red-600" />
              </div>
              
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                ACCOUNT SUSPENDED
              </h1>
              
              <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
                Your account has been suspended due to a violation of our terms of service. 
                You are unable to access any features of the application at this time.
              </p>
              
              <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
                <div className="flex items-start">
                  <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
                  <div className="text-left">
                    <h3 className="text-sm font-medium text-red-800 mb-2">
                      What you can do:
                    </h3>
                    <ul className="text-sm text-red-700 space-y-1">
                      <li>• Contact customer support for assistance</li>
                      <li>• Review our terms of service</li>
                      <li>• Wait for account review completion</li>
                    </ul>
                  </div>
                </div>
              </div>
              
              <div className="mt-8">
                <button
                  onClick={() => window.location.href = '/auth/signout'}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 