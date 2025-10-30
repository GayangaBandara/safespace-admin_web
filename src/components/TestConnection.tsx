import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export function TestConnection() {
  const [status, setStatus] = useState<'checking' | 'connected' | 'error'>('checking');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [adminCount, setAdminCount] = useState<number | null>(null);

  useEffect(() => {
    async function checkConnection() {
      try {
        // First, check environment variables
        const envCheck = {
          url: import.meta.env.VITE_SUPABASE_URL,
          key: import.meta.env.VITE_SUPABASE_ANON_KEY
        };

        if (!envCheck.url || !envCheck.key) {
          throw new Error(
            `Missing environment variables: ${!envCheck.url ? 'VITE_SUPABASE_URL' : ''} ${
              !envCheck.key ? 'VITE_SUPABASE_ANON_KEY' : ''
            }`.trim()
          );
        }

        // Test auth connection
        const { data: { session }, error: authError } = await supabase.auth.getSession();
        if (authError) {
          throw new Error(`Authentication error: ${authError.message}`);
        }

        // Test database connection
        const { data, error: dbError } = await supabase
          .from('users')
          .select('*', { count: 'exact', head: true });

        if (dbError) {
          // Check for specific error types
          if (dbError.message.includes('authentication')) {
            throw new Error('Database authentication failed. Check your Supabase anon key.');
          } else if (dbError.message.includes('connection')) {
            throw new Error('Could not connect to database. Check your Supabase URL.');
          } else {
            throw new Error(`Database error: ${dbError.message}`);
          }
        }

        console.log('Connection test results:', {
          environment: {
            VITE_SUPABASE_URL: envCheck.url ? '✓ Set' : '✗ Missing',
            VITE_SUPABASE_ANON_KEY: envCheck.key ? '✓ Set' : '✗ Missing'
          },
          auth: session ? '✓ Connected' : '✗ No session',
          database: data ? '✓ Connected' : '✗ No data'
        });

        setAdminCount(data?.length ?? 0);
        setStatus('connected');
      } catch (error) {
        console.error('Connection diagnostic results:', error);
        setStatus('error');
        setErrorMessage(error instanceof Error ? error.message : 'Unknown error');
      }
    }

    checkConnection();
  }, []);

  return (
    <div className="p-4">
      <h2 className="text-lg font-semibold mb-4">Supabase Connection Test</h2>
      
      {status === 'checking' && (
        <div className="text-blue-600">
          Checking connection...
        </div>
      )}
      
      {status === 'connected' && (
        <div className="text-green-600">
          ✓ Connected to Supabase successfully!
          <div className="mt-2 text-gray-600">
            Number of admins in database: {adminCount}
          </div>
        </div>
      )}
      
      {status === 'error' && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <h3 className="text-red-800 font-semibold">✗ Connection Error</h3>
          <p className="text-red-600 mt-2">{errorMessage}</p>
          <div className="mt-4 text-sm text-red-700">
            <p className="font-medium">Troubleshooting steps:</p>
            <ol className="list-decimal list-inside mt-2 space-y-2">
              <li>
                Check your .env file in the project root:
                <pre className="bg-red-100 p-2 mt-1 rounded text-xs">
                  VITE_SUPABASE_URL=your_project_url{'\n'}
                  VITE_SUPABASE_ANON_KEY=your_anon_key
                </pre>
              </li>
              <li>
                Verify your Supabase URL format:
                <div className="text-xs mt-1">Should look like: https://xxxxx.supabase.co</div>
              </li>
              <li>
                Verify your anon key format:
                <div className="text-xs mt-1">Should start with: eyJhbGciOiJIUzI1NiI...</div>
              </li>
              <li>
                If the values are correct:
                <ul className="list-disc list-inside ml-4 mt-1">
                  <li>Try clearing your browser cache</li>
                  <li>Check if Supabase service is running</li>
                  <li>Check your network connection</li>
                </ul>
              </li>
            </ol>
            <div className="mt-4 bg-yellow-50 p-2 rounded">
              <p className="font-medium text-yellow-800">Need the correct values?</p>
              <p className="mt-1 text-yellow-700">
                1. Go to your Supabase project dashboard<br />
                2. Click Project Settings → API<br />
                3. Find Project URL and anon/public key
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}