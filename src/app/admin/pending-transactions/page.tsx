'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import { RefreshCw, Search, CheckCircle, XCircle, Clock } from 'lucide-react';

interface PendingTransaction {
  id: string;
  customerEmail: string;
  amount: number;
  points: number;
  description: string;
  status: string;
  createdAt: string;
  adminNotes?: string;
}

export default function AdminPendingTransactionsPage() {
  const { data: session } = useSession();
  const [pending, setPending] = useState<PendingTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchPending();
  }, []);

  const fetchPending = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/admin/pending-transactions');
      if (!response.ok) throw new Error('Failed to fetch pending transactions');
      const data = await response.json();
      setPending(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Move filtering logic inside render to ensure pending is always defined
  const getFilteredPending = () => {
    if (!pending || !Array.isArray(pending)) return [];
    return pending.filter(txn =>
      txn.customerEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      txn.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pending Transactions</h1>
          <p className="mt-1 text-sm text-gray-500">Approve or reject pending transactions submitted by customers</p>
        </div>
        <button
          onClick={fetchPending}
          className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search pending transactions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Points</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Admin Notes</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {getFilteredPending().map((txn) => (
                <tr key={txn.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{txn.customerEmail}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{txn.description}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{txn.amount}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{txn.points}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      txn.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                      txn.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                      txn.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {txn.status === 'PENDING' && <Clock className="h-4 w-4 mr-1" />}
                      {txn.status === 'APPROVED' && <CheckCircle className="h-4 w-4 mr-1" />}
                      {txn.status === 'REJECTED' && <XCircle className="h-4 w-4 mr-1" />}
                      <span>{txn.status}</span>
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(txn.createdAt).toLocaleDateString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{txn.adminNotes || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {getFilteredPending().length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500">No pending transactions found</p>
          </div>
        )}
      </div>
    </div>
  );
} 