'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import { Upload, Camera, Receipt, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function CustomerScanPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [file, setFile] = useState<File | null>(null);
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [pointsData, setPointsData] = useState<{ points: number; tier: string }>({ points: 0, tier: 'Standard' });

  // Fetch points data
  React.useEffect(() => {
    const fetchPoints = async () => {
      try {
        const response = await fetch('/api/points');
        if (response.ok) {
          const data = await response.json();
          setPointsData(data);
        }
      } catch (error) {
        console.error('Failed to fetch points:', error);
      }
    };

    if (session?.user?.email) {
      fetchPoints();
    }
  }, [session?.user?.email]);

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
      
      // Convert file to base64 for storage (in a real app, you'd upload to cloud storage)
      const reader = new FileReader();
      reader.onload = async () => {
        const base64Image = reader.result as string;
        
        // Create pending transaction
        const response = await fetch('/api/points/history', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            points,
            description: `Receipt scan - £${amount} purchase`,
            type: 'EARNED',
            amount: parseFloat(amount),
            receiptImage: base64Image,
            isReceipt: true,
            source: 'customer'
          }),
        });

        if (response.ok) {
          const data = await response.json();
          setSuccess('Receipt submitted for approval! You will receive points once approved by admin.');
          
          // Clear form
          setFile(null);
          setAmount('');
          
          setTimeout(() => {
            router.push('/customer/transactions');
          }, 3000);
        } else {
          throw new Error('Failed to submit receipt');
        }
      };
      
      reader.readAsDataURL(file);
    } catch (error) {
      setError('Failed to process receipt. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center mb-8">
        <Link
          href="/customer/dashboard"
          className="flex items-center text-gray-600 hover:text-gray-800 mr-4"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back to Dashboard
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Scan Receipt</h1>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Upload Form */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white shadow rounded-lg p-6"
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* File Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload Receipt Image
              </label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:border-blue-400 transition-colors">
                <div className="space-y-1 text-center">
                  <Upload className="mx-auto h-12 w-12 text-gray-400" />
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
                  className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full text-lg border-gray-300 rounded-md py-4 px-3"
                  placeholder="0.00"
                  value={amount}
                  onChange={handleAmountChange}
                />
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md">{error}</div>
            )}

            {/* Success Message */}
            {success && (
              <div className="text-green-600 text-sm bg-green-50 p-3 rounded-md">{success}</div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors ${
                loading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {loading ? 'Processing...' : 'Submit Receipt'}
            </button>
          </form>
        </motion.div>

        {/* Info Panel */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-6"
        >
          {/* Points Info */}
          <div className="bg-blue-50 rounded-lg p-6">
            <h2 className="text-lg font-medium text-blue-900 mb-3 flex items-center">
              <Receipt className="h-5 w-5 mr-2" />
              How Points Work
            </h2>
            <ul className="text-sm text-blue-800 space-y-2">
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">•</span>
                Earn 1 point for every £1 spent
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">•</span>
                Points are rounded down to the nearest whole number
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">•</span>
                Points will be added to your account after receipt verification
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">•</span>
                Receipts must be clear and legible
              </li>
            </ul>
          </div>

          {/* Tips */}
          <div className="bg-gray-50 rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
              <Camera className="h-5 w-5 mr-2" />
              Tips for Best Results
            </h2>
            <ul className="text-sm text-gray-600 space-y-2">
              <li className="flex items-start">
                <span className="text-gray-500 mr-2">•</span>
                Ensure good lighting when taking photos
              </li>
              <li className="flex items-start">
                <span className="text-gray-500 mr-2">•</span>
                Keep the receipt flat and avoid shadows
              </li>
              <li className="flex items-start">
                <span className="text-gray-500 mr-2">•</span>
                Make sure the total amount is clearly visible
              </li>
              <li className="flex items-start">
                <span className="text-gray-500 mr-2">•</span>
                Include the date and store information
              </li>
            </ul>
          </div>

          {/* Current Points */}
          {session?.user?.email && (
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-2">Your Points</h2>
              <p className="text-3xl font-bold text-blue-600">
                {pointsData.points.toLocaleString()}
              </p>
              <p className="text-sm text-gray-500 mt-1">Current balance - {pointsData.tier} tier</p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
} 