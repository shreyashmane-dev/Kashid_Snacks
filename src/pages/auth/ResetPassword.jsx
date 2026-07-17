import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Mail, ArrowLeft, AlertCircle, CheckCircle } from 'lucide-react';

export default function ResetPassword() {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return setError("Please enter your email");

    try {
      setError('');
      setLoading(true);
      await resetPassword(email);
      setSuccess(true);
    } catch (err) {
      setError(err.message || "Failed to send reset email. Verify user email exists.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 relative py-12">
      {/* Background radial blobs */}
      <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-saffron/10 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-maroon/10 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="glass-panel max-w-md w-full p-8 rounded-3xl shadow-glass-warm relative overflow-hidden bg-white/40">
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent pointer-events-none"></div>

        {/* Title */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-3">
            <span className="w-9 h-9 rounded-full bg-gradient-to-tr from-saffron to-maroon flex items-center justify-center font-heading font-extrabold text-white text-sm">
              KS
            </span>
            <span className="font-heading font-extrabold text-lg text-charcoal">Kashid Snacks</span>
          </Link>
          <h2 className="font-heading font-extrabold text-2xl text-charcoal font-heading">Reset Password</h2>
          <p className="text-xs text-charcoal/60 mt-1">We will send you instructions to reset your password</p>
        </div>

        {error && (
          <div className="bg-maroon-light/20 border border-maroon-light/40 text-maroon text-xs rounded-xl p-3 mb-6 flex items-start gap-2 animate-shake">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {success ? (
          <div className="text-center space-y-6">
            <div className="bg-emerald-100 border border-emerald-300 text-emerald-800 text-xs rounded-xl p-4 flex items-start gap-2 text-left">
              <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Reset Email Sent</p>
                <p className="mt-0.5">Please check your inbox. If the email doesn't appear in a few minutes, check your spam folder.</p>
              </div>
            </div>
            <Link 
              to="/auth/login" 
              className="w-full bg-gradient-to-r from-saffron to-saffron-dark text-white font-heading font-bold py-3.5 rounded-full shadow-md flex items-center justify-center gap-2 text-sm"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Sign In
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-charcoal/80 uppercase tracking-wider mb-1.5 ml-1">Email Address</label>
              <div className="relative">
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full glass-input rounded-full py-3 pl-11 pr-5 text-sm"
                  required
                />
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal/40" />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-gradient-to-r from-saffron to-saffron-dark hover:from-saffron-dark hover:to-maroon text-white font-heading font-bold py-3.5 rounded-full shadow-md hover:shadow-lg transition-all text-sm mt-6 flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : "Send Reset Link"}
            </button>

            <div className="text-center mt-6">
              <Link to="/auth/login" className="inline-flex items-center gap-1.5 text-xs font-bold text-charcoal/60 hover:text-saffron transition-colors">
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
