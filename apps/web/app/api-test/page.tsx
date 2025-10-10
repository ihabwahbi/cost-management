'use client';

/**
 * tRPC API Test Page
 * 
 * This page demonstrates the tRPC React Query hooks working with type safety
 * 
 * NOTE: Requires tRPC Edge Function to be deployed
 * See: supabase/functions/README.md for deployment instructions
 */

import { useState } from 'react';
import { trpc } from '@/lib/trpc';

export default function APITestPage() {
  const [name, setName] = useState('World');
  
  // Use tRPC React Query hooks - auto-fetch on mount
  const helloQuery = trpc.test.hello.useQuery({ name });
  const healthQuery = trpc.test.healthCheck.useQuery();

  const handleHelloTest = () => {
    helloQuery.refetch();
  };

  const handleHealthCheck = () => {
    healthQuery.refetch();
  };

  return (
    <div className="container mx-auto p-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">tRPC API Test (React Query Hooks)</h1>
      
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
        <p className="text-sm text-yellow-800">
          <strong>⚠️ Note:</strong> This page requires the tRPC Edge Function to be deployed.
          <br />
          See <code className="bg-yellow-100 px-1">supabase/functions/README.md</code> for deployment instructions.
        </p>
      </div>

      {/* Hello Test */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Test: hello (useQuery hook)</h2>
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
            disabled={helloQuery.isFetching}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
          >
            {helloQuery.isFetching ? 'Loading...' : 'Call trpc.test.hello.useQuery'}
          </button>
          
          {helloQuery.data && (
            <div className="mt-4 p-4 bg-green-50 rounded-md">
              <p className="font-mono text-sm">{JSON.stringify(helloQuery.data, null, 2)}</p>
            </div>
          )}
          
          {helloQuery.error && (
            <div className="mt-4 p-4 bg-red-50 rounded-md">
              <p className="text-red-700 font-mono text-sm">{helloQuery.error.message}</p>
            </div>
          )}
        </div>
      </div>

      {/* Health Check */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Test: healthCheck (useQuery hook)</h2>
        <button
          onClick={handleHealthCheck}
          disabled={healthQuery.isFetching}
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400"
        >
          {healthQuery.isFetching ? 'Loading...' : 'Call trpc.test.healthCheck.useQuery'}
        </button>
        
        {healthQuery.data && (
          <div className="mt-4 p-4 bg-green-50 rounded-md">
            <p className="font-mono text-sm whitespace-pre">{JSON.stringify(healthQuery.data, null, 2)}</p>
          </div>
        )}
        
        {healthQuery.error && (
          <div className="mt-4 p-4 bg-red-50 rounded-md">
            <p className="text-red-700 font-mono text-sm">{healthQuery.error.message}</p>
          </div>
        )}
      </div>

      {/* Error Display */}
      {(helloQuery.error || healthQuery.error) && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="font-semibold text-red-800 mb-2">Connection Error:</h3>
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
