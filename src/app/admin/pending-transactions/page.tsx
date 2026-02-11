'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import { RefreshCw, Search, CheckCircle, XCircle, Clock, Eye, X } from 'lucide-react';

interface PendingTransaction {
  id: string;
  customerEmail: string;
  amount: number;
  points: number;
  description: string;
  status: string;
  createdAt: string;
  adminNotes?: string;
  receiptImage?: string | null;
  customerName?: string;
  tenantName?: string;
}

export default function AdminPendingTransactionsPage() {
  const { data: session } = useSession();
  const [pending, setPending] = useState<PendingTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTransaction, setSelectedTransaction] = useState<PendingTransaction | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [processing, setProcessing] = useState(false);

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
      // Handle both response formats: { pendingTransactions: [...] } or direct array
      const transactions = data.pendingTransactions || data || [];
      console.log('Fetched pending transactions:', transactions.length);
      // Debug: Log receipt images in response
      transactions.forEach((txn: PendingTransaction, idx: number) => {
        if (txn.receiptImage) {
          console.log(`Transaction ${idx + 1} (${txn.id}) has receipt image (length: ${txn.receiptImage.length})`);
        } else {
          console.log(`Transaction ${idx + 1} (${txn.id}) has NO receipt image`);
        }
      });
      setPending(transactions);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching pending transactions:', err);
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

  const handleApprove = async () => {
    if (!selectedTransaction) return;

    try {
      setProcessing(true);
      setError(null);

      const response = await fetch('/api/admin/pending-transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transactionId: selectedTransaction.id,
          action: 'approve',
          adminNotes: adminNotes,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to approve transaction');
      }

      const result = await response.json();
      console.log('Transaction approved:', result);

      // Refresh the list
      await fetchPending();
      // Close the detail view
      setSelectedTransaction(null);
      setAdminNotes('');
      alert('Transaction approved successfully!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to approve transaction');
      console.error('Error approving transaction:', err);
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedTransaction) return;

    try {
      setProcessing(true);
      setError(null);

      const response = await fetch('/api/admin/pending-transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transactionId: selectedTransaction.id,
          action: 'reject',
          adminNotes: adminNotes,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to reject transaction');
      }

      const result = await response.json();
      console.log('Transaction rejected:', result);

      // Refresh the list
      await fetchPending();
      // Close the detail view
      setSelectedTransaction(null);
      setAdminNotes('');
      alert('Transaction rejected successfully!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reject transaction');
      console.error('Error rejecting transaction:', err);
    } finally {
      setProcessing(false);
    }
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
                <tr 
                  key={txn.id} 
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => setSelectedTransaction(txn)}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{txn.customerEmail}</div>
                    {txn.customerName && (
                      <div className="text-sm text-gray-500">{txn.customerName}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{txn.description}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">£{txn.amount.toFixed(2)}</td>
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
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedTransaction(txn);
                      }}
                      className="inline-flex items-center px-3 py-1 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </button>
                  </td>
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

      {/* Transaction Detail Modal */}
      {selectedTransaction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-50 overflow-y-auto pt-8 pb-8 px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[calc(100vh-4rem)] overflow-y-auto border-2 border-gray-100/50 my-8"
          >
            <div className="sticky top-0 bg-white border-b-2 border-gray-200 px-10 py-6 flex justify-between items-center">
              <h2 className="text-5xl md:text-6xl font-extrabold text-gray-900 tracking-tight">Transaction Details</h2>
              <button
                onClick={() => {
                  setSelectedTransaction(null);
                  setAdminNotes('');
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-8 w-8" />
              </button>
            </div>

            <div className="p-10 md:p-12 space-y-8">
              {/* Transaction Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Customer Email</label>
                  <p className="text-sm text-gray-900">{selectedTransaction.customerEmail}</p>
                </div>
                {selectedTransaction.customerName && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name</label>
                    <p className="text-sm text-gray-900">{selectedTransaction.customerName}</p>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                  <p className="text-sm text-gray-900">£{selectedTransaction.amount.toFixed(2)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Points</label>
                  <p className="text-sm text-gray-900">{selectedTransaction.points}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <p className="text-sm text-gray-900">{selectedTransaction.description}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Created</label>
                  <p className="text-sm text-gray-900">{new Date(selectedTransaction.createdAt).toLocaleString()}</p>
                </div>
                {selectedTransaction.tenantName && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tenant</label>
                    <p className="text-sm text-gray-900">{selectedTransaction.tenantName}</p>
                  </div>
                )}
              </div>

              {/* Receipt Image */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Receipt Image
                </label>
                {selectedTransaction.receiptImage ? (
                  <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={selectedTransaction.receiptImage}
                      alt="Receipt"
                      className="max-w-full h-auto rounded border mx-auto"
                      onError={(e) => {
                        console.error('Error loading receipt image:', e);
                        console.log('Image src:', selectedTransaction.receiptImage?.substring(0, 100));
                      }}
                      onLoad={() => {
                        console.log('Receipt image loaded successfully');
                      }}
                    />
                  </div>
                ) : (
                  <div className="text-sm text-gray-500 italic border border-gray-200 rounded-lg p-4 bg-gray-50">
                    No receipt image available for this transaction
                  </div>
                )}
              </div>

              {/* Admin Notes */}
              <div className="relative group">
                <textarea
                  id="adminNotes"
                  rows={4}
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  className="block w-full px-8 py-8 text-2xl text-gray-900 bg-gray-50 border-2 border-gray-200 rounded-3xl appearance-none transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-blue-500/30 focus:border-blue-500 focus:bg-white peer group-hover:border-gray-300 shadow-lg hover:shadow-xl resize-none"
                  placeholder=" "
                />
                <label
                  htmlFor="adminNotes"
                  className="absolute text-xl font-medium text-gray-600 duration-200 transform -translate-y-4 scale-75 top-4 z-10 origin-[0] bg-white px-3 peer-focus:px-3 peer-focus:text-blue-600 peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-8 peer-focus:top-4 peer-focus:scale-75 peer-focus:-translate-y-4 left-3 peer-focus:bg-white group-hover:bg-white"
                >
                  Admin Notes (optional)
                </label>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-4 pt-6 border-t-2 border-gray-200">
                <motion.button
                  whileHover={{ scale: processing ? 1 : 1.02 }}
                  whileTap={{ scale: processing ? 1 : 0.98 }}
                  onClick={() => {
                    setSelectedTransaction(null);
                    setAdminNotes('');
                  }}
                  disabled={processing}
                  className="px-8 py-8 border-2 border-gray-300 text-2xl font-bold rounded-3xl text-gray-700 bg-white hover:bg-gray-50 transition-all duration-200 shadow-lg hover:shadow-xl min-h-[80px] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={{ scale: processing ? 1 : 1.02 }}
                  whileTap={{ scale: processing ? 1 : 0.98 }}
                  onClick={handleReject}
                  disabled={processing}
                  className="px-8 py-8 border-2 border-red-300 text-2xl font-bold rounded-3xl text-red-700 bg-white hover:bg-red-50 transition-all duration-200 shadow-lg hover:shadow-xl min-h-[80px] disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center"
                >
                  <XCircle className="h-6 w-6 mr-3" />
                  <span>{processing ? 'Processing...' : 'Reject'}</span>
                </motion.button>
                <motion.button
                  whileHover={{ scale: processing ? 1 : 1.02 }}
                  whileTap={{ scale: processing ? 1 : 0.98 }}
                  onClick={handleApprove}
                  disabled={processing}
                  className={`group relative flex justify-center items-center py-8 px-8 border border-transparent text-2xl font-bold rounded-3xl text-white shadow-xl transition-all duration-200 min-h-[80px] ${
                    processing
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-4 focus:ring-offset-2 focus:ring-green-500 hover:shadow-2xl transform hover:scale-[1.02]'
                  } inline-flex items-center justify-center`}
                >
                  <CheckCircle className="h-6 w-6 mr-3" />
                  <span>{processing ? 'Processing...' : 'Approve'}</span>
                </motion.button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
} 