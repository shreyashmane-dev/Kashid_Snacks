import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Mail, Lock, Phone, MessageSquare, AlertCircle, Sparkles } from 'lucide-react';
import { useRateLimiter } from '../../hooks/useRateLimiter';

export default function Login() {
  const { login, loginWithGoogle, verifyPhoneOTP } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get('redirect') || '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [isPhoneMode, setIsPhoneMode] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [phoneConfirmation, setPhoneConfirmation] = useState(null);
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Rate Limiting
  const loginLimiter = useRateLimiter('login', 5, 15);
  const otpLimiter = useRateLimiter('otp', 3, 10);

  const getFriendlyErrorMessage = (errorMsg) => {
    if (!errorMsg) return "Failed to sign in.";
    const lower = errorMsg.toLowerCase();
    if (lower.includes("invalid-credential") || lower.includes("auth/invalid-credential")) {
      return "Incorrect email or password. Please try again.";
    }
    if (lower.includes("user-not-found") || lower.includes("auth/user-not-found")) {
      return "No account found with this email. Please sign up first.";
    }
    if (lower.includes("wrong-password") || lower.includes("auth/wrong-password")) {
      return "Incorrect password. Please try again.";
    }
    return errorMsg;
  };

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) return setError("Please fill in all fields");
    if (loginLimiter.isLocked) return;

    try {
      setError('');
      setLoading(true);
      
      // Attempt login
      await login(email, password);
      loginLimiter.resetLimiter();
      navigate(redirect);
    } catch (err) {
      // Record failed attempt
      loginLimiter.recordAttempt();
      
      const remaining = 5 - (loginLimiter.attempts + 1);
      const friendlyMsg = getFriendlyErrorMessage(err.message);
      if (remaining > 0) {
        setError(`${friendlyMsg} (${remaining} attempts remaining)`);
      } else {
        setError("Too many login attempts. Locked out for 15 minutes.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setError('');
      setLoading(true);
      await loginWithGoogle();
      navigate(redirect);
    } catch (err) {
      setError(err.message || "Failed to login with Google");
    } finally {
      setLoading(false);
    }
  };

  const handleSendOTP = async (e) => {
    e.preventDefault();
    if (!phone) return setError("Please enter a valid phone number");
    if (otpLimiter.isLocked) return;

    try {
      setError('');
      setLoading(true);
      
      // Send OTP
      const confirmation = await verifyPhoneOTP(phone);
      setPhoneConfirmation(confirmation);
      setOtpSent(true);
      otpLimiter.resetLimiter(); // Reset on successful send (or we can record sends if preferred)
    } catch (err) {
      otpLimiter.recordAttempt();
      const remaining = 3 - (otpLimiter.attempts + 1);
      if (remaining > 0) {
        setError(`${err.message || "Failed to send OTP."} (${remaining} requests remaining)`);
      } else {
        setError("Too many OTP requests. Locked out for 10 minutes.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    if (!otpCode) return setError("Please enter the 6-digit OTP");

    try {
      setError('');
      setLoading(true);
      await phoneConfirmation.confirm(otpCode);
      navigate(redirect);
    } catch (err) {
      setError(err.message || "Invalid OTP code");
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
        {/* Email Login Lockout Overlay */}
        {!isPhoneMode && loginLimiter.isLocked && (
          <div className="absolute inset-0 bg-cream/95 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center z-20 rounded-3xl animate-fadeIn">
            <AlertCircle className="w-12 h-12 text-maroon mb-4 animate-bounce" />
            <h3 className="font-heading font-extrabold text-lg text-charcoal">Account Lockout</h3>
            <p className="text-xs text-charcoal/70 mt-2 max-w-xs leading-relaxed font-body">
              Too many failed login attempts. To safeguard your credentials, a temporary lockout has been activated.
            </p>
            <div className="mt-6 bg-maroon/10 border border-maroon/20 text-maroon px-5 py-2.5 rounded-full font-heading font-bold text-xs tracking-wide">
              Try again in: {loginLimiter.timeLeftFormatted}
            </div>
          </div>
        )}

        {/* OTP Request Lockout Overlay */}
        {isPhoneMode && otpLimiter.isLocked && (
          <div className="absolute inset-0 bg-cream/95 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center z-20 rounded-3xl animate-fadeIn">
            <AlertCircle className="w-12 h-12 text-maroon mb-4 animate-bounce" />
            <h3 className="font-heading font-extrabold text-lg text-charcoal">OTP Limit Exceeded</h3>
            <p className="text-xs text-charcoal/70 mt-2 max-w-xs leading-relaxed font-body">
              You have requested too many OTP verification codes. Please wait before attempting again.
            </p>
            <div className="mt-6 bg-maroon/10 border border-maroon/20 text-maroon px-5 py-2.5 rounded-full font-heading font-bold text-xs tracking-wide">
              Try again in: {otpLimiter.timeLeftFormatted}
            </div>
          </div>
        )}
        {/* Shimmer overlay */}
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent pointer-events-none"></div>

        {/* Title */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-3">
            <span className="w-9 h-9 rounded-full bg-gradient-to-tr from-saffron to-maroon flex items-center justify-center font-heading font-extrabold text-white text-sm">
              KS
            </span>
            <span className="font-heading font-extrabold text-lg text-charcoal">Kashid Snacks</span>
          </Link>
          <h2 className="font-heading font-extrabold text-2xl text-charcoal">Welcome Back</h2>
          <p className="text-xs text-charcoal/60 mt-1">Authentic flavors, premium crunch, delivered to you</p>
        </div>

        {error && (
          <div className="bg-maroon-light/20 border border-maroon-light/40 text-maroon text-xs rounded-xl p-3 mb-6 flex items-start gap-2 animate-shake">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Email Form */}
        {!isPhoneMode ? (
          <form onSubmit={handleEmailLogin} className="space-y-4">
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
              <div className="flex justify-between items-center mb-1.5 ml-1">
                <label className="block text-xs font-bold text-charcoal/80 uppercase tracking-wider">Password</label>
                <Link to="/auth/reset" className="text-xs font-semibold text-saffron hover:underline">Forgot Password?</Link>
              </div>
              <div className="relative">
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full glass-input rounded-full py-3 pl-11 pr-5 text-sm"
                  required
                />
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal/40" />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-gradient-to-r from-saffron to-saffron-dark hover:from-saffron-dark hover:to-maroon text-white font-heading font-bold py-3.5 rounded-full shadow-md hover:shadow-lg transition-all text-sm mt-6 flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : "Sign In with Email"}
            </button>
          </form>
        ) : (
          /* Phone OTP Form */
          <form onSubmit={!otpSent ? handleSendOTP : handleVerifyOTP} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-charcoal/80 uppercase tracking-wider mb-1.5 ml-1">Phone Number</label>
              <div className="relative">
                <input 
                  type="tel" 
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full glass-input rounded-full py-3 pl-11 pr-5 text-sm"
                  disabled={otpSent}
                  required
                />
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal/40" />
              </div>
            </div>

            {otpSent && (
              <div className="animate-fadeIn">
                <div className="flex justify-between items-center mb-1.5 ml-1">
                  <label className="block text-xs font-bold text-charcoal/80 uppercase tracking-wider">6-Digit OTP Code</label>
                  <button type="button" onClick={() => setOtpSent(false)} className="text-xs font-semibold text-saffron hover:underline">Change Number</button>
                </div>
                <div className="relative">
                  <input 
                    type="text" 
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    placeholder="123456"
                    maxLength={6}
                    className="w-full glass-input rounded-full py-3 pl-11 pr-5 text-sm tracking-widest font-bold"
                    required
                  />
                  <MessageSquare className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal/40" />
                </div>
                <p className="text-[10px] text-saffron-dark font-medium mt-1.5 ml-1">💡 For mock testing, use OTP: 123456</p>
              </div>
            )}

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-gradient-to-r from-saffron to-saffron-dark hover:from-saffron-dark hover:to-maroon text-white font-heading font-bold py-3.5 rounded-full shadow-md hover:shadow-lg transition-all text-sm mt-6 flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : !otpSent ? "Send OTP Code" : "Verify & Sign In"}
            </button>
          </form>
        )}

        {/* Toggle Login Method */}
        <div className="text-center mt-4">
          <button 
            type="button"
            onClick={() => {
              setIsPhoneMode(!isPhoneMode);
              setError('');
              setOtpSent(false);
            }}
            className="text-xs font-semibold text-charcoal/60 hover:text-saffron transition-colors"
          >
            {isPhoneMode ? "Or login using Email & Password" : "Or login using Phone & OTP"}
          </button>
        </div>

        {/* Divider */}
        <div className="relative my-6 flex items-center justify-center">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-saffron-light/20"></div></div>
          <span className="relative bg-cream-light/60 backdrop-blur-md px-3 text-[10px] font-bold text-charcoal/40 uppercase tracking-widest">Or Connect With</span>
        </div>

        {/* Google Login */}
        <button 
          type="button"
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full bg-white/80 hover:bg-white border border-saffron-light/30 text-charcoal font-heading font-semibold py-2.5 rounded-full shadow-sm hover:shadow-md transition-all text-sm flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" width="24" height="24">
            <g transform="matrix(1, 0, 0, 1, 0, 0)">
              <path d="M21.35,11.1H12v2.7h5.38c-0.24,1.28 -0.96,2.37 -2.05,3.1v2.58h3.31c1.94,-1.78 3.06,-4.41 3.06,-7.48c0,-0.61 -0.06,-1.2 -0.16,-1.72z" fill="#4285F4" />
              <path d="M12,20.6c2.32,0 4.27,-0.77 5.69,-2.1l-3.31,-2.58c-0.92,0.62 -2.1,0.98 -3.38,0.98c-2.6,0 -4.8,-1.76 -5.58,-4.12H2.03v2.66c1.47,2.92 4.5,4.92 8.07,4.92z" fill="#34A853" />
              <path d="M6.42,12.78c-0.2,-0.6 -0.31,-1.24 -0.31,-1.9s0.11,-1.3 0.31,-1.9V6.32H2.03c-0.66,1.32 -1.03,2.8 -1.03,4.38s0.37,3.06 1.03,4.38l4.39,-3.3z" fill="#FBBC05" />
              <path d="M12,5.2c1.26,0 2.4,0.43 3.3,1.28l2.48,-2.48C16.27,2.57 14.32,1.8 12,1.8C8.43,1.8 5.4,3.8 3.93,6.72l4.39,3.3c0.78,-2.36 2.98,-4.12 5.58,-4.12z" fill="#EA4335" />
            </g>
          </svg>
          Sign In with Google
        </button>

        {/* Footer Link */}
        <p className="text-center text-xs text-charcoal/60 mt-8">
          Don't have a snack account?{' '}
          <Link to="/auth/signup" className="font-bold text-maroon hover:text-saffron transition-colors">Sign Up</Link>
        </p>

      </div>
    </div>
  );
}
