import './globals.css';
import './styles/admin.css';
import AuthProvider from './components/AuthProvider';
import { R2Provider } from '../context/R2Context';

export const metadata = {
  title: 'Better Badges Admin',
  description: 'Protected admin section with Google OAuth',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50">
        <AuthProvider>
          <R2Provider>{children}</R2Provider>
        </AuthProvider>
      </body>
    </html>
  );
} 