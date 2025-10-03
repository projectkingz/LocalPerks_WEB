'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ScanPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError('');
    }
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '' || /^\d*\.?\d{0,2}$/.test(value)) {
      setAmount(value);
      setError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!file) {
      setError('Please select a receipt image');
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // In a real app, we would upload the receipt image and process it
      // For now, we'll just simulate points calculation
      const points = Math.floor(parseFloat(amount));
      
      // Record the points transaction
      const response = await fetch('/api/points/history', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          points,
          description: `Receipt scan - £${amount} purchase`,
          type: 'EARNED',
        }),
      });

      if (response.ok) {
        setSuccess('Points added successfully!');
        setTimeout(() => {
          router.push('/customer/transactions');
        }, 2000);
      } else {
        throw new Error('Failed to record points');
      }
    } catch (error) {
      setError('Failed to process receipt. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-3xl font-bold mb-8">Scan Receipt</h1>
      
      <div className="bg-white shadow rounded-lg p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload Receipt Image
            </label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
              <div className="space-y-1 text-center">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  stroke="currentColor"
                  fill="none"
                  viewBox="0 0 48 48"
                  aria-hidden="true"
                >
                  <path
                    d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <div className="flex text-sm text-gray-600">
                  <label
                    htmlFor="file-upload"
                    className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                  >
                    <span>Upload a file</span>
                    <input
                      id="file-upload"
                      name="file-upload"
                      type="file"
                      className="sr-only"
                      accept="image/*"
                      onChange={handleFileChange}
                    />
                  </label>
                  <p className="pl-1">or drag and drop</p>
                </div>
                <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
              </div>
            </div>
            {file && (
              <p className="mt-2 text-sm text-gray-600">
                Selected file: {file.name}
              </p>
            )}
          </div>

          {/* Purchase Amount */}
          <div>
            <label
              htmlFor="amount"
              className="block text-sm font-medium text-gray-700"
            >
              Purchase Amount (£)
            </label>
            <div className="mt-1">
              <input
                type="text"
                name="amount"
                id="amount"
                className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                placeholder="0.00"
                value={amount}
                onChange={handleAmountChange}
              />
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="text-red-600 text-sm">{error}</div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
              loading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {loading ? 'Processing...' : 'Submit Receipt'}
          </button>
        </form>
      </div>

      {/* Points Info */}
      <div className="mt-8 bg-gray-50 rounded-lg p-4">
        <h2 className="text-lg font-medium text-gray-900 mb-2">How Points Work</h2>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• Earn 1 point for every £1 spent</li>
          <li>• Points are rounded down to the nearest whole number</li>
          <li>• Points will be added to your account after receipt verification</li>
          <li>• Receipts must be clear and legible</li>
        </ul>
      </div>
    </div>
  );
} 