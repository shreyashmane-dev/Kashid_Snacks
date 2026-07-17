import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Mail, Lock, User, AlertCircle } from 'lucide-react';
import { useRateLimiter } from '../../hooks/useRateLimiter';

export default function SignUp() {
  const { signup } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [agree, setAgree] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Rate Limiting
  const signupLimiter = useRateLimiter('signup', 5, 15);

  const handleSignup = async (e) => {
    e.preventDefault();
    if (!name || !email || !password) return setError("Please fill in all fields");
    if (!agree) return setError("You must agree to the Terms of Service");
    if (password.length < 6) return setError("Password must be at least 6 characters long");
    if (signupLimiter.isLocked) return;

    try {
      setError('');
      setLoading(true);
      await signup(email, password, name);
      signupLimiter.resetLimiter();
      navigate('/home');
    } catch (err) {
      signupLimiter.recordAttempt();
      const remaining = 5 - (signupLimiter.attempts + 1);
      if (remaining > 0) {
        setError(`${err.message || "Failed to create account."} (${remaining} attempts remaining)`);
      } else {
        setError("Too many signup attempts. Locked out for 15 minutes.");
      }
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
        {/* Lockout Overlay */}
        {signupLimiter.isLocked && (
          <div className="absolute inset-0 bg-cream/95 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center z-20 rounded-3xl animate-fadeIn">
            <AlertCircle className="w-12 h-12 text-maroon mb-4 animate-bounce" />
            <h3 className="font-heading font-extrabold text-lg text-charcoal">Signup Lockout</h3>
            <p className="text-xs text-charcoal/70 mt-2 max-w-xs leading-relaxed font-body">
              Too many signup attempts detected. Please wait before creating a new account.
            </p>
            <div className="mt-6 bg-maroon/10 border border-maroon/20 text-maroon px-5 py-2.5 rounded-full font-heading font-bold text-xs tracking-wide">
              Try again in: {signupLimiter.timeLeftFormatted}
            </div>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent pointer-events-none"></div>

        {/* Title */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-3">
            <span className="w-9 h-9 rounded-full bg-gradient-to-tr from-saffron to-maroon flex items-center justify-center font-heading font-extrabold text-white text-sm">
              KS
            </span>
            <span className="font-heading font-extrabold text-lg text-charcoal">Kashid Snacks</span>
          </Link>
          <h2 className="font-heading font-extrabold text-2xl text-charcoal">Create Account</h2>
          <p className="text-xs text-charcoal/60 mt-1">Start your premium Indian snacks journey today</p>
        </div>

        {error && (
          <div className="bg-maroon-light/20 border border-maroon-light/40 text-maroon text-xs rounded-xl p-3 mb-6 flex items-start gap-2 animate-shake">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-charcoal/80 uppercase tracking-wider mb-1.5 ml-1">Full Name</label>
            <div className="relative">
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Amit Sharma"
                className="w-full glass-input rounded-full py-3 pl-11 pr-5 text-sm"
                required
              />
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal/40" />
            </div>
          </div>

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

          <div>
            <label className="block text-xs font-bold text-charcoal/80 uppercase tracking-wider mb-1.5 ml-1">Password</label>
            <div className="relative">
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min. 6 characters"
                className="w-full glass-input rounded-full py-3 pl-11 pr-5 text-sm"
                required
              />
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal/40" />
            </div>
          </div>

          <div className="flex items-start gap-2.5 pt-1.5 ml-1">
            <input 
              type="checkbox" 
              id="agree" 
              checked={agree}
              onChange={(e) => setAgree(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-saffron-light text-saffron focus:ring-saffron"
            />
            <label htmlFor="agree" className="text-xs text-charcoal/70 leading-normal">
              I agree to the <a href="#terms" className="font-semibold text-saffron hover:underline">Terms of Service</a> and <a href="#privacy" className="font-semibold text-saffron hover:underline">Privacy Policy</a>
            </label>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-gradient-to-r from-saffron to-saffron-dark hover:from-saffron-dark hover:to-maroon text-white font-heading font-bold py-3.5 rounded-full shadow-md hover:shadow-lg transition-all text-sm mt-6 flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : "Create Account"}
          </button>
        </form>

        <p className="text-center text-xs text-charcoal/60 mt-8">
          Already have a snack account?{' '}
          <Link to="/auth/login" className="font-bold text-maroon hover:text-saffron transition-colors">Sign In</Link>
        </p>
      </div>
    </div>
  );
}
