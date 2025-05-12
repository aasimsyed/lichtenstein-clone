'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

export default function AuthError() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  const errorMessages = {
    Configuration: "There is a problem with the server configuration.",
    AccessDenied: "You do not have permission to sign in.",
    Verification: "The verification link was invalid or has expired.",
    OAuthSignin: "Error in the OAuth sign-in process.",
    OAuthCallback: "Error in the OAuth callback process.",
    OAuthCreateAccount: "Could not create OAuth provider account.",
    EmailCreateAccount: "Could not create email provider account.",
    Callback: "Error in the authentication callback.",
    OAuthAccountNotLinked: "This account is already linked to another sign-in method.",
    EmailSignin: "Error sending the email verification link.",
    CredentialsSignin: "Sign-in failed. Check the provided credentials.",
    SessionRequired: "You must be signed in to access this page.",
    Default: "An unexpected authentication error occurred."
  };

  const errorMessage = error ? (errorMessages[error] || errorMessages.Default) : errorMessages.Default;

  return (
    <div className="flex h-screen flex-col items-center justify-center bg-gray-50">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-md text-center">
        <h1 className="mb-4 text-2xl font-bold text-red-600">Authentication Error</h1>
        <p className="mb-4 text-gray-700">{errorMessage}</p>
        {error && <p className="mb-6 text-sm text-gray-500">Error code: {error}</p>}
        <div className="flex flex-col space-y-3">
          <Link href="/auth/signin" className="text-blue-600 hover:underline">
            Try Signing In Again
          </Link>
          <Link href="/" className="text-blue-600 hover:underline">
            Return to Homepage
          </Link>
        </div>
      </div>
    </div>
  );
} 