import { useState } from 'react';
import { motion } from 'framer-motion';
import { CreditCard, Loader2, Calendar } from 'lucide-react';

interface TransactionFormProps {
  customerQRCode: string | null;
  pointsPerPound: number;
  minimumPurchase: number;
  onSubmit: (data: {
    amount: number;
    spendDate: string;
    customerQRCode: string;
  }) => Promise<void>;
  onReset: () => void;
}

export default function TransactionForm({
  customerQRCode,
  pointsPerPound,
  minimumPurchase,
  onSubmit,
  onReset
}: TransactionFormProps) {
  const [amount, setAmount] = useState('');
  const [spendDate, setSpendDate] = useState(new Date().toISOString().split('T')[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerQRCode) return;

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum < minimumPurchase) {
      setError(`Minimum purchase amount is £${minimumPurchase}`);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await onSubmit({
        amount: amountNum,
        spendDate,
        customerQRCode
      });
      setAmount('');
      setSpendDate(new Date().toISOString().split('T')[0]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to record transaction');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!customerQRCode) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100"
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center">
          <CreditCard className="h-5 w-5 text-blue-600 mr-2" />
          Record Transaction
        </h2>
        <button
          onClick={onReset}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          Cancel
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-bold uppercase tracking-wide text-gray-700 mb-2">
            Spend Amount
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <span className="text-2xl font-bold text-gray-900">£</span>
            </div>
            <input
              type="number"
              step="0.01"
              min={minimumPurchase}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="block w-full pl-10 pr-5 py-4 text-2xl font-bold text-gray-900 rounded-xl border-2 border-gray-200 bg-gray-50 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all outline-none"
              required
            />
          </div>
          <p className="mt-2 text-sm font-semibold text-blue-600">
            Will earn {Math.floor(parseFloat(amount || '0') * pointsPerPound).toLocaleString()} points
          </p>
        </div>

        <div>
          <label className="block text-sm font-bold uppercase tracking-wide text-gray-700 mb-2">
            Spend Date
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Calendar className="h-6 w-6 text-gray-500" />
            </div>
            <input
              type="date"
              value={spendDate}
              onChange={(e) => setSpendDate(e.target.value)}
              className="block w-full pl-12 pr-5 py-4 text-xl font-bold text-gray-900 rounded-xl border-2 border-gray-200 bg-gray-50 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all outline-none"
              required
            />
          </div>
        </div>

        {error && (
          <div className="text-sm text-red-600">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="animate-spin h-5 w-5 mr-2" />
              Recording...
            </>
          ) : (
            'Record Transaction'
          )}
        </button>
      </form>
    </motion.div>
  );
} 