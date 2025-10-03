'use client';

import { AlertTriangle, X } from 'lucide-react';
import { useState } from 'react';

interface SuspendedBannerProps {
  onDismiss?: () => void;
}

export default function SuspendedBanner({ onDismiss }: SuspendedBannerProps) {
  const [isVisible, setIsVisible] = useState(true);

  const handleDismiss = () => {
    setIsVisible(false);
    onDismiss?.();
  };

  if (!isVisible) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-red-600 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-3">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 mr-2" />
            <div>
              <p className="text-sm font-medium">
                ACCOUNT SUSPENDED
              </p>
              <p className="text-xs opacity-90">
                Your account has been suspended. Please contact support for assistance.
              </p>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="text-white hover:text-red-200 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
} 