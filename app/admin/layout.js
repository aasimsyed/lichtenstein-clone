'use client';

import ProtectedRoute from '../auth/protected-route';

export default function AdminLayout({ children }) {
  return (
    <ProtectedRoute>
      {children}
    </ProtectedRoute>
  );
} 