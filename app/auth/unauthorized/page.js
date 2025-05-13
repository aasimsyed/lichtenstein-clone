'use client';

import Link from 'next/link';
import { useAuth } from '../useAuth';

function UnauthorizedContent() {
  const { logout } = useAuth();

  return (
    <div className="flex h-screen flex-col items-center justify-center bg-gray-50">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-md text-center">
        <h1 className="mb-4 text-2xl font-bold text-red-600">Access Denied</h1>
        <p className="mb-6 text-gray-700">
          Your Google account is not authorized to access the admin area.
        </p>
        <div className="flex flex-col space-y-3">
          <Link href="/" className="text-blue-600 hover:underline">
            Return to Homepage
          </Link>
          <button
            onClick={() => logout()}
            className="text-red-600 hover:underline"
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Unauthorized() {
  return <UnauthorizedContent />;
} 