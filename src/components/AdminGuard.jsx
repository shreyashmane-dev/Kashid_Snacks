import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, ArrowLeft, RefreshCw } from 'lucide-react';

export default function AdminGuard({ children }) {
  const { currentUser, isAdmin, loading, refreshAdmin } = useAuth();
  const navigate = useNavigate();
  const [checking, setChecking] = useState(false);
  const [checked, setChecked] = useState(false);

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
    const handleRefresh = async () => {
      setChecking(true);
      setChecked(false);
      await refreshAdmin?.();
      setChecking(false);
      setChecked(true);
      // Navigate after short delay so state updates can propagate
      setTimeout(() => navigate('/admin'), 300);
    };

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

          {/* Show refresh button if user is logged in but not yet admin */}
          {currentUser && (
            <button
              onClick={handleRefresh}
              disabled={checking}
              className="w-full mb-3 flex items-center justify-center gap-2 bg-saffron/10 hover:bg-saffron/20 border border-saffron/30 text-saffron-dark font-heading font-semibold py-2.5 rounded-full text-sm transition-colors disabled:opacity-60"
            >
              <RefreshCw className={`w-4 h-4 ${checking ? 'animate-spin' : ''}`} />
              {checking ? 'Re-checking your role…' : checked ? 'Checked! Redirecting…' : 'Already an admin? Refresh Role'}
            </button>
          )}

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
