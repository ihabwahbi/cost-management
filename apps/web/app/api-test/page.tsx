'use client';

/**
 * tRPC API Test Page
 * 
 * This page demonstrates the tRPC client working with type safety
 * 
 * NOTE: Requires tRPC Edge Function to be deployed
 * See: supabase/functions/README.md for deployment instructions
 */

import { useState } from 'react';
import { trpc } from '@/lib/trpc';

export default function APITestPage() {
  const [name, setName] = useState('World');
  const [result, setResult] = useState<any>(null);
  const [healthCheck, setHealthCheck] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleHelloTest = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await trpc.test.hello.query({ name });
      setResult(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const handleHealthCheck = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await trpc.test.healthCheck.query();
      setHealthCheck(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">tRPC API Test</h1>
      
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
        <p className="text-sm text-yellow-800">
          <strong>⚠️ Note:</strong> This page requires the tRPC Edge Function to be deployed.
          <br />
          See <code className="bg-yellow-100 px-1">supabase/functions/README.md</code> for deployment instructions.
        </p>
      </div>

      {/* Hello Test */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Test: hello</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Name:
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="Enter name"
            />
          </div>
          <button
            onClick={handleHelloTest}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
          >
            {loading ? 'Loading...' : 'Call trpc.test.hello'}
          </button>
          
          {result && (
            <div className="mt-4 p-4 bg-green-50 rounded-md">
              <p className="font-mono text-sm">{JSON.stringify(result, null, 2)}</p>
            </div>
          )}
        </div>
      </div>

      {/* Health Check */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Test: healthCheck</h2>
        <button
          onClick={handleHealthCheck}
          disabled={loading}
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400"
        >
          {loading ? 'Loading...' : 'Call trpc.test.healthCheck'}
        </button>
        
        {healthCheck && (
          <div className="mt-4 p-4 bg-green-50 rounded-md">
            <p className="font-mono text-sm whitespace-pre">{JSON.stringify(healthCheck, null, 2)}</p>
          </div>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="font-semibold text-red-800 mb-2">Error:</h3>
          <p className="text-red-700 font-mono text-sm">{error}</p>
          <p className="text-red-600 text-sm mt-2">
            Make sure NEXT_PUBLIC_TRPC_URL is set in .env.local and the Edge Function is deployed.
          </p>
        </div>
      )}

      {/* Setup Instructions */}
      <div className="bg-gray-50 rounded-lg p-6 mt-8">
        <h3 className="text-lg font-semibold mb-3">Setup Instructions:</h3>
        <ol className="list-decimal list-inside space-y-2 text-sm">
          <li>Deploy tRPC Edge Function: <code className="bg-gray-200 px-1">supabase functions deploy trpc</code></li>
          <li>Add <code className="bg-gray-200 px-1">NEXT_PUBLIC_TRPC_URL</code> to <code className="bg-gray-200 px-1">.env.local</code></li>
          <li>Restart Next.js dev server</li>
          <li>Refresh this page and test the endpoints</li>
        </ol>
      </div>
    </div>
  );
}
