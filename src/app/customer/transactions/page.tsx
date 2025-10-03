'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { formatDate } from '@/lib/utils/date';

interface Transaction {
  id: string;
  date: string;
  points: number;
  description: string;
  type: 'EARNED' | 'SPENT';
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'VOID';
  receiptImage?: string;
  amount?: number;
}

interface PendingTransaction {
  id: string;
  date: string;
  points: number;
  description: string;
  amount: number;
  receiptImage?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'VOID';
  adminNotes?: string;
}

export default function TransactionsPage() {
  const { data: session } = useSession();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [pendingTransactions, setPendingTransactions] = useState<PendingTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        setLoading(true);
        setError('');
        
        console.log('Fetching transactions for user:', session?.user?.email);
        
        const response = await fetch('/api/points/history');
        if (!response.ok) {
          console.error('Transactions API error:', response.status, response.statusText);
          throw new Error('Failed to load transaction history');
        }
        
        const data = await response.json();
        console.log('Transactions data received:', data);
        setTransactions(data.transactions);
        setPendingTransactions(data.pendingTransactions || []);
      } catch (error) {
        console.error('Error fetching transactions:', error);
        setError('Failed to load transaction history');
      } finally {
        setLoading(false);
      }
    };

    if (session?.user?.email) {
      fetchTransactions();
    }
  }, [session?.user?.email]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED': return 'text-green-600 bg-green-100';
      case 'PENDING': return 'text-yellow-600 bg-yellow-100';
      case 'REJECTED': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'APPROVED': return 'Approved';
      case 'PENDING': return 'Pending';
      case 'REJECTED': return 'Rejected';
      default: return status;
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold mb-8">Points History</h1>

      {/* Pending Transactions */}
      {pendingTransactions.length > 0 && (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Pending Approvals</h2>
            <p className="text-sm text-gray-500">Receipts waiting for admin approval</p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Points
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {pendingTransactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(transaction.date)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {transaction.description}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      £{transaction.amount.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                      {transaction.points}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(transaction.status)}`}>
                        {getStatusText(transaction.status)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Approved Transactions */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Transaction History</h2>
          <p className="text-sm text-gray-500">All approved and completed transactions</p>
        </div>
        {loading ? (
          <div className="p-6 text-center">Loading...</div>
        ) : error ? (
          <div className="p-6 text-center text-red-600">{error}</div>
        ) : transactions.length === 0 ? (
          <div className="p-6 text-center text-gray-500">No transactions found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Points
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {transactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(transaction.date)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {transaction.description}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <span
                        className={
                          transaction.type === 'EARNED' || transaction.status === 'VOID'
                            ? 'text-green-600'
                            : transaction.type === 'SPENT'
                            ? 'text-red-600'
                            : ''
                        }
                      >
                        {transaction.points}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {transaction.type === 'EARNED' ? 'Earned' : 'Spent'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(transaction.status)}`}>
                        {getStatusText(transaction.status)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
} 