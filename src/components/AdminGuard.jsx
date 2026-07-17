import React from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

export default function AdminGuard({ children }) {
  const { currentUser, isAdmin, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-full border-4 border-saffron border-t-transparent animate-spin"></div>
          <p className="font-heading font-semibold text-charcoal/60 text-sm">Authenticating Admin...</p>
        </div>
      </div>
    );
  }

  if (!currentUser || !isAdmin) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center p-6">
        <div className="glass-panel max-w-md w-full p-8 rounded-3xl text-center shadow-glass-warm flex flex-col items-center">
          <div className="w-16 h-16 rounded-2xl bg-maroon/10 flex items-center justify-center text-maroon mb-6 animate-pulse">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="font-heading font-extrabold text-2xl text-charcoal mb-2">Access Denied</h2>
          <p className="text-sm text-charcoal/70 mb-6 leading-relaxed">
            This section is restricted to store administrators only. To access the admin panel, please log in with administrative privileges.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 w-full">
            <Link 
              to="/auth/login?redirect=/admin" 
              className="flex-1 bg-maroon hover:bg-maroon-dark text-white font-heading font-semibold py-2.5 rounded-full shadow-md text-sm transition-colors"
            >
              Log in as Admin
            </Link>
            <Link 
              to="/" 
              className="flex-1 bg-cream-container hover:bg-cream-highest text-charcoal font-heading font-semibold py-2.5 rounded-full border border-charcoal/10 text-sm flex items-center justify-center gap-1.5 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Go Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return children;
}
