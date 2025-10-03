'use client';

import { useState } from 'react';

export default function TestAdmin() {
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const testAdminAPI = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/users');
      const data = await response.json();
      setResult(JSON.stringify(data, null, 2));
    } catch (error) {
      setResult(`Error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Admin API Test</h1>
      <button
        onClick={testAdminAPI}
        disabled={loading}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? 'Testing...' : 'Test Admin API'}
      </button>
      {result && (
        <pre className="mt-4 p-4 bg-gray-100 rounded overflow-auto max-h-96">
          {result}
        </pre>
      )}
    </div>
  );
} 