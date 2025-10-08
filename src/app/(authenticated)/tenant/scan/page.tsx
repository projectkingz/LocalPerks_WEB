'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface ScanResult {
  valid: boolean;
  customerId?: string;
  customerEmail?: string;
  points?: number;
  type: 'customer' | 'voucher';
  description?: string;
}

export default function TenantScanPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [code, setCode] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [success, setSuccess] = useState('');
  const [pointsPerPound, setPointsPerPound] = useState(5); // Default to 5 points per £1

  // Fetch points configuration on mount
  useEffect(() => {
    async function fetchPointsConfig() {
      try {
        const response = await fetch('/api/points/config');
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.config) {
            setPointsPerPound(data.config.basePointsPerPound);
          }
        }
      } catch (err) {
        console.error('Failed to fetch points config:', err);
        // Keep default of 5
      }
    }
    fetchPointsConfig();
  }, []);

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCode(e.target.value.toUpperCase());
    setError('');
    setScanResult(null);
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '' || /^\d*\.?\d{0,2}$/.test(value)) {
      setAmount(value);
      setError('');
    }
  };

  const validateCode = async () => {
    if (!code) {
      setError('Please enter a code');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Try customer QR code first
      const customerResponse = await fetch('/api/customers/qr', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code })
      });

      if (customerResponse.ok) {
        const data = await customerResponse.json();
        setScanResult({ ...data, type: 'customer' });
        return;
      }

      // If not a customer QR, try voucher
      const voucherResponse = await fetch('/api/rewards/vouchers', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, tenantId: session?.user?.id })
      });

      if (voucherResponse.ok) {
        const data = await voucherResponse.json();
        setScanResult({ ...data.voucher, type: 'voucher' });
        return;
      }

      setError('Invalid code');
    } catch (error) {
      setError('Failed to validate code');
    } finally {
      setLoading(false);
    }
  };

  const processTransaction = async () => {
    if (!scanResult) {
      setError('Please scan a code first');
      return;
    }

    if (scanResult.type === 'customer' && !amount) {
      setError('Please enter purchase amount');
      return;
    }

    setLoading(true);
    setError('');

    try {
      if (scanResult.type === 'customer') {
        // Process points earning - calculate using tenant-specific rate
        const calculatedPoints = Math.floor(parseFloat(amount) * pointsPerPound);
        const response = await fetch('/api/points/history', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            customerId: scanResult.customerId,
            points: calculatedPoints,
            amount: parseFloat(amount),
            description: `Purchase at ${session?.user?.name}`,
            type: 'EARNED'
          })
        });

        if (!response.ok) {
          throw new Error('Failed to process points');
        }

        // Clear form and show success
        setCode('');
        setAmount('');
        setScanResult(null);
        setSuccess('Points awarded successfully!');
      } else {
        // Voucher has already been processed in validateCode
        setCode('');
        setScanResult(null);
        setSuccess('Voucher redeemed successfully!');
      }
    } catch (error) {
      setError('Failed to process transaction');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-4xl font-extrabold mb-8 text-gray-900">
        Scan Customer Code
      </h1>
      
      <div className="bg-white shadow-lg rounded-2xl p-8">
        <form onSubmit={(e) => { e.preventDefault(); validateCode(); }} className="space-y-8">
          {/* Code Input */}
          <div className="relative">
            <input
              type="text"
              value={code}
              onChange={handleCodeChange}
              className="form-input block w-full rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:ring focus:ring-blue-200 transition duration-200 ease-in-out text-lg py-3 px-4"
              placeholder="Enter QR code or voucher code"
            />
          </div>

          {/* Scan Button */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full flex justify-center items-center py-4 px-6 border border-transparent rounded-xl text-lg font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-200 ease-in-out transform hover:scale-[1.02] ${
              loading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Scanning...
              </>
            ) : (
              <>
                <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
                Scan Code
              </>
            )}
          </button>
        </form>

        {/* Scan Result */}
        {scanResult && (
          <div className="mt-8 p-6 bg-gray-50 rounded-xl border-2 border-gray-100">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              {scanResult.type === 'customer' ? 'Customer Found' : 'Valid Voucher'}
            </h2>
            
            {scanResult.type === 'customer' ? (
              <>
                <div className="flex items-center space-x-2 mb-6">
                  <div className="h-3 w-3 bg-green-500 rounded-full"></div>
                  <p className="text-lg text-gray-600">
                    Customer ID: {scanResult.customerId}
                  </p>
                </div>
                <div className="space-y-6">
                  <div className="relative">
                    <div className="relative rounded-xl shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <span className="text-gray-500 text-lg">£</span>
                      </div>
                      <input
                        type="text"
                        value={amount}
                        onChange={handleAmountChange}
                        className="form-input block w-full pl-10 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:ring focus:ring-blue-200 transition duration-200 ease-in-out text-lg py-3"
                        placeholder="Enter purchase amount"
                      />
                    </div>
                  </div>
                  <button
                    onClick={processTransaction}
                    disabled={loading || !amount}
                    className={`w-full flex justify-center items-center py-4 px-6 rounded-xl text-lg font-bold text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition duration-200 ease-in-out transform hover:scale-[1.02] ${
                      (loading || !amount) ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    {loading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Processing...
                      </>
                    ) : (
                      <>
                        <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        Award Points
                      </>
                    )}
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="space-y-4 mb-6">
                  <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-100">
                    <span className="text-sm font-bold text-gray-500 uppercase">Points</span>
                    <span className="text-lg font-bold text-blue-600">{scanResult.points}</span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-100">
                    <span className="text-sm font-bold text-gray-500 uppercase">Description</span>
                    <span className="text-lg text-gray-900">{scanResult.description}</span>
                  </div>
                </div>
                <button
                  onClick={processTransaction}
                  disabled={loading}
                  className={`w-full flex justify-center items-center py-4 px-6 rounded-xl text-lg font-bold text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition duration-200 ease-in-out transform hover:scale-[1.02] ${
                    loading ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing...
                    </>
                  ) : (
                    <>
                      <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                      Redeem Voucher
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        )}

        {/* Error/Success Messages */}
        {error && (
          <div className="fixed bottom-4 right-4 bg-red-50 border-l-4 border-red-400 p-4 rounded-r-xl shadow-lg max-w-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}
        {success && (
          <div className="fixed bottom-4 right-4 bg-green-50 border-l-4 border-green-400 p-4 rounded-r-xl shadow-lg max-w-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-green-700">{success}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="mt-8 bg-white shadow-lg rounded-2xl p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Instructions</h2>
        <ul className="space-y-4">
          <li className="flex items-center text-gray-700">
            <svg className="h-6 w-6 mr-3 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            Scan customer's QR code to award points for purchases
          </li>
          <li className="flex items-center text-gray-700">
            <svg className="h-6 w-6 mr-3 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Scan voucher codes to redeem rewards
          </li>
          <li className="flex items-center text-gray-700">
            <svg className="h-6 w-6 mr-3 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Points are calculated based on purchase amount
          </li>
          <li className="flex items-center text-gray-700">
            <svg className="h-6 w-6 mr-3 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            Make sure to verify customer identity when redeeming vouchers
          </li>
        </ul>
      </div>
    </div>
  );
} 