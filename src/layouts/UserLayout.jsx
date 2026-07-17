import React, { useState, useEffect } from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { ShoppingBag, User, LogOut, Menu, X, Trash2, Plus, Minus, ArrowRight, Shield, Bell, Check, Home } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { motion, AnimatePresence } from 'framer-motion';
import KashiMascot from '../components/KashiMascot';

export default function UserLayout() {
  const { currentUser, logout, isAdmin } = useAuth();
  const { cartItems, cartCount, cartTotal, updateQuantity, removeFromCart, promoCode, discount, removePromoCode } = useCart();
  
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const navigate = useNavigate();

  // Notifications State
  const [unreadNotifs, setUnreadNotifs] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  // PWA Install Prompt State
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);

  useEffect(() => {
    // 1. Sync Notifications
    const fetchNotifs = () => {
      const saved = localStorage.getItem('kashid_notifications');
      if (saved) {
        const parsed = JSON.parse(saved);
        setNotifications(parsed);
        setUnreadNotifs(parsed.filter(n => !n.read).length);
      }
    };
    fetchNotifs();
    const interval = setInterval(fetchNotifs, 4000);

    // 2. Listen for PWA Install Prompt
    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      const dismissed = sessionStorage.getItem('kashid_install_dismissed');
      if (!dismissed) {
        setShowInstallBanner(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    return () => {
      clearInterval(interval);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`PWA install outcome: ${outcome}`);
    setDeferredPrompt(null);
    setShowInstallBanner(false);
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const markNotifRead = (id) => {
    const updated = notifications.map(n => n.id === id ? { ...n, read: true } : n);
    setNotifications(updated);
    setUnreadNotifs(updated.filter(n => !n.read).length);
    localStorage.setItem('kashid_notifications', JSON.stringify(updated));
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* FLOATING GLASS HEADER */}
      <header className="fixed top-4 left-1/2 -translate-x-1/2 z-40 w-[95%] max-w-7xl">
        <div className="glass-panel rounded-full px-6 py-3 flex items-center justify-between shadow-glass-warm">
          {/* Logo */}
          <Link to="/home" className="flex items-center gap-2 group">
            <img 
              src="/kashid_logo.svg" 
              alt="Kashid Snacks Logo" 
              className="w-10 h-10 object-contain group-hover:scale-105 transition-transform"
            />
            <span className="font-heading font-extrabold text-xl tracking-tight bg-gradient-to-r from-saffron-dark via-maroon to-maroon bg-clip-text text-transparent">
              Kashid Snacks
            </span>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-8 font-heading font-semibold text-charcoal/80">
            <Link to="/home" className="hover:text-saffron transition-colors">Home</Link>
            <Link to="/shop" className="hover:text-saffron transition-colors">Shop Snacks</Link>
            <Link to="/info/about" className="hover:text-saffron transition-colors">Our Story</Link>
            {isAdmin && (
              <Link to="/admin" className="flex items-center gap-1.5 text-maroon hover:text-saffron transition-colors">
                <Shield className="w-4 h-4" /> Admin
              </Link>
            )}
          </nav>

          {/* Action Icons */}
          <div className="flex items-center gap-3 relative">
            {/* Notifications Dropdown Bell */}
            <div className="relative">
              <button 
                onClick={() => { setIsNotifOpen(!isNotifOpen); setIsCartOpen(false); }}
                className="relative p-2.5 rounded-full hover:bg-saffron-light/30 transition-colors group"
                aria-label="Notifications"
              >
                <Bell className="w-5 h-5 text-charcoal group-hover:text-saffron transition-colors" />
                {unreadNotifs > 0 && (
                  <span className="absolute top-1.5 right-1.5 bg-maroon text-white text-[8px] font-bold rounded-full w-4 h-4 flex items-center justify-center border border-cream-light">
                    {unreadNotifs}
                  </span>
                )}
              </button>

              {/* Glass Dropdown pane */}
              <AnimatePresence>
                {isNotifOpen && (
                  <motion.div 
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 15 }}
                    className="absolute right-0 mt-3 w-72 glass-panel rounded-2xl p-4 shadow-xl z-50 text-xs text-charcoal bg-white/95"
                  >
                    <div className="flex justify-between items-center border-b border-saffron-light/20 pb-2 mb-3">
                      <span className="font-heading font-bold">Latest Updates</span>
                      <Link to="/notifications" onClick={() => setIsNotifOpen(false)} className="text-[10px] text-saffron hover:underline font-semibold">View All</Link>
                    </div>

                    <div className="space-y-2.5 max-h-56 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <p className="text-center py-6 text-charcoal/45 italic">No notifications yet.</p>
                      ) : (
                        notifications.slice(0, 3).map((n) => (
                          <div 
                            key={n.id} 
                            onClick={() => markNotifRead(n.id)}
                            className={`p-2 rounded-xl transition-colors cursor-pointer flex gap-2 relative ${
                              n.read ? 'bg-cream-container/20' : 'bg-saffron-light/10 border-l-2 border-saffron'
                            }`}
                          >
                            <div className="flex-grow min-w-0 pr-4">
                              <h5 className="font-bold truncate text-[11px]">{n.title}</h5>
                              <p className="text-[10px] text-charcoal/60 truncate mt-0.5">{n.message}</p>
                            </div>
                            {!n.read && (
                              <button className="text-[8px] text-emerald-600 hover:text-emerald-700 absolute top-2 right-2">
                                <Check className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Cart Icon */}
            <button 
              onClick={() => { setIsCartOpen(true); setIsNotifOpen(false); }}
              className="relative p-2.5 rounded-full hover:bg-saffron-light/30 transition-colors group"
              aria-label="Open Cart"
            >
              <ShoppingBag className="w-5 h-5 text-charcoal group-hover:text-saffron transition-colors" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-saffron text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center border-2 border-cream-light animate-bounce">
                  {cartCount}
                </span>
              )}
            </button>

            {/* Profile Dropdown / Login */}
            {currentUser ? (
              <div className="flex items-center gap-2">
                <Link 
                  to="/profile" 
                  className="p-2.5 rounded-full hover:bg-saffron-light/30 transition-colors flex items-center gap-1.5 group text-sm font-semibold"
                >
                  <User className="w-5 h-5 text-charcoal group-hover:text-saffron transition-colors" />
                  <span className="hidden lg:inline-block max-w-[100px] truncate text-charcoal/80">
                    {currentUser.displayName || 'Profile'}
                  </span>
                </Link>
                <button 
                  onClick={handleLogout}
                  className="p-2.5 rounded-full hover:bg-maroon-light/30 text-maroon hover:text-maroon-dark transition-colors"
                  title="Logout"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <Link 
                to="/auth/login" 
                className="bg-saffron hover:bg-saffron-dark text-white font-heading font-semibold px-5 py-2 rounded-full shadow-md hover:shadow-lg transition-all text-sm"
              >
                Sign In
              </Link>
            )}

            {/* Mobile Menu Icon */}
            <button 
              className="md:hidden p-2 rounded-full hover:bg-saffron-light/30 transition-colors"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="md:hidden mt-2 glass-panel rounded-2xl p-5 flex flex-col gap-4 shadow-lg"
            >
              <Link to="/home" onClick={() => setIsMenuOpen(false)} className="font-heading font-semibold hover:text-saffron p-2 rounded-lg hover:bg-saffron-light/10">Home</Link>
              <Link to="/shop" onClick={() => setIsMenuOpen(false)} className="font-heading font-semibold hover:text-saffron p-2 rounded-lg hover:bg-saffron-light/10">Shop Snacks</Link>
              <Link to="/info/about" onClick={() => setIsMenuOpen(false)} className="font-heading font-semibold hover:text-saffron p-2 rounded-lg hover:bg-saffron-light/10">Our Story</Link>
              {isAdmin && (
                <Link to="/admin" onClick={() => setIsMenuOpen(false)} className="font-heading font-semibold text-maroon flex items-center gap-2 p-2 rounded-lg hover:bg-maroon-light/10">
                  <Shield className="w-4 h-4" /> Admin Panel
                </Link>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* PAGE CONTENT */}
      <main className="flex-grow pt-24 pb-20 md:pb-12">
        <Outlet />
      </main>

      {/* FOOTER */}
      <footer id="about" className="relative mt-auto border-t border-saffron-light/30 bg-maroon-dark text-cream-light py-12 px-6 overflow-hidden">
        {/* Drifting gradient blobs */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-saffron/10 rounded-full blur-[100px] pointer-events-none animate-pulse"></div>
        <div className="absolute bottom-0 left-10 w-64 h-64 bg-maroon/10 rounded-full blur-[90px] pointer-events-none animate-pulse" style={{ animationDelay: '2s' }}></div>

        {/* Mascot Peek-Up Scroll Animation */}
        <motion.div 
          initial={{ y: 90 }}
          whileInView={{ y: 15 }}
          viewport={{ once: false, amount: 0.1 }}
          transition={{ type: 'spring', stiffness: 70, damping: 14 }}
          className="absolute bottom-0 right-4 w-28 h-28 pointer-events-none z-20"
        >
          <KashiMascot stage={0} className="w-full h-full" />
        </motion.div>
        
        {/* Staggered Column Reveal */}
        <motion.div 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.1 } }
          }}
          className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 relative z-10"
        >
          <motion.div 
            variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
            className="flex flex-col gap-4"
          >
            <span className="font-heading font-extrabold text-2xl tracking-wider text-saffron">
              Kashid Snacks
            </span>
            <p className="text-sm text-cream-container/70 leading-relaxed font-body">
              Bringing you the premium, authentic flavors of Indian heritage snacks. Handcrafted with traditional recipes and a modern touch of culinary excellence.
            </p>
          </motion.div>

          <motion.div 
            variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
          >
            <h4 className="font-heading font-bold text-lg text-turmeric mb-4">Quick Links</h4>
            <ul className="flex flex-col gap-2.5 text-sm text-cream-container/80">
              <li><Link to="/home" className="hover:text-saffron transition-colors">Home</Link></li>
              <li><Link to="/shop" className="hover:text-saffron transition-colors">Shop Snacks</Link></li>
              <li><Link to="/info/about" className="hover:text-saffron transition-colors">Our Brand Story</Link></li>
              <li><Link to="/profile" className="hover:text-saffron transition-colors">Track Orders</Link></li>
            </ul>
          </motion.div>

          <motion.div 
            variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
          >
            <h4 className="font-heading font-bold text-lg text-turmeric mb-4">Contact Info</h4>
            <ul className="flex flex-col gap-2.5 text-sm text-cream-container/80">
              <li>Spice Bhavan, Sector 12, Pune, MH</li>
              <li>Email: namkeen@kashidsnacks.com</li>
              <li>Phone: +91 820 546 0ef8</li>
              <li>WhatsApp Support: Available 24x7</li>
            </ul>
          </motion.div>

          <motion.div 
            variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
            className="flex flex-col gap-4"
          >
            <h4 className="font-heading font-bold text-lg text-turmeric">Newsletter</h4>
            <p className="text-xs text-cream-container/70">Subscribe for early festival snack drops and coupon codes.</p>
            <div className="flex gap-2">
              <input 
                type="email" 
                placeholder="Your email" 
                className="bg-cream/10 border border-cream/20 text-white rounded-full px-4 py-2 text-sm focus:outline-none focus:border-saffron w-full"
              />
              <button className="bg-saffron hover:bg-saffron-dark text-white rounded-full p-2.5 shadow-md flex items-center justify-center transition-colors">
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        </motion.div>

        <div className="max-w-7xl mx-auto mt-12 pt-6 border-t border-cream/10 text-center text-xs text-cream-container/50 relative z-10 flex flex-col md:flex-row justify-between gap-4">
          <p>© 2026 Kashid Snacks Private Limited. All rights reserved.</p>
          <p className="flex justify-center gap-4 font-semibold text-cream-light/60">
            <span>UPI Supported</span>
            <span>•</span>
            <span>COD Available</span>
          </p>
        </div>
      </footer>

      {/* FLOATING CART DRAWER */}
      <AnimatePresence>
        {isCartOpen && (
          <>
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCartOpen(false)}
              className="fixed inset-0 bg-charcoal/40 backdrop-blur-sm z-50"
            />
            {/* Drawer */}
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.3 }}
              className="fixed top-0 right-0 h-full w-full sm:max-w-md bg-cream/95 backdrop-blur-md shadow-2xl border-l border-saffron-light/30 z-50 flex flex-col"
            >
              <div className="p-5 border-b border-saffron-light/20 flex items-center justify-between bg-white/50">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-saffron" />
                  <h3 className="font-heading font-extrabold text-lg text-charcoal">Your Snack Bag</h3>
                  <span className="bg-saffron/10 text-saffron text-xs font-bold px-2 py-0.5 rounded-full">
                    {cartCount}
                  </span>
                </div>
                <button 
                  onClick={() => setIsCartOpen(false)}
                  className="p-1.5 rounded-full hover:bg-saffron-light/20 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Cart Items list */}
              <div className="flex-grow overflow-y-auto p-5 flex flex-col gap-4">
                {cartItems.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center gap-4 py-20">
                    <div className="w-20 h-20 rounded-full bg-saffron-light/10 flex items-center justify-center text-saffron">
                      <ShoppingBag className="w-10 h-10" />
                    </div>
                    <div>
                      <h4 className="font-heading font-bold text-lg text-charcoal">Bag is empty!</h4>
                      <p className="text-sm text-charcoal/60 mt-1">Fill it up with delicious spiced snacks!</p>
                    </div>
                    <Link 
                      to="/shop" 
                      onClick={() => setIsCartOpen(false)}
                      className="bg-saffron hover:bg-saffron-dark text-white font-heading font-semibold px-6 py-2.5 rounded-full shadow-md text-sm mt-2 inline-block transition-colors"
                    >
                      Shop Now
                    </Link>
                  </div>
                ) : (
                  cartItems.map((item, idx) => (
                    <div key={`${item.id}-${item.weight}`} className="glass-card p-3.5 rounded-xl flex gap-3.5 items-center relative overflow-hidden bg-white/80">
                      <img 
                        src={item.image} 
                        alt={item.name} 
                        className="w-16 h-16 object-cover rounded-lg shadow-sm border border-saffron-light/20"
                      />
                      <div className="flex-grow min-w-0">
                        <h4 className="font-heading font-bold text-sm text-charcoal truncate">{item.name}</h4>
                        <p className="text-xs text-charcoal/60 mt-0.5">Weight: {item.weight}</p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="font-bold text-sm text-maroon">₹{item.price * item.quantity}</span>
                          
                          {/* Quantity Selector */}
                          <div className="flex items-center gap-2 bg-cream-container/50 border border-saffron-light/20 rounded-full p-0.5">
                            <button 
                              onClick={() => updateQuantity(item.id, item.selectedVariant?.weight || item.weight, item.quantity - 1)}
                              className="p-1 rounded-full hover:bg-white text-charcoal/80 hover:text-saffron transition-colors"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="text-xs font-bold w-4 text-center">{item.quantity}</span>
                            <button 
                              onClick={() => updateQuantity(item.id, item.selectedVariant?.weight || item.weight, item.quantity + 1)}
                              className="p-1 rounded-full hover:bg-white text-charcoal/80 hover:text-saffron transition-colors"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Remove Button */}
                      <button 
                        onClick={() => removeFromCart(item.id, item.selectedVariant?.weight)}
                        className="absolute top-2 right-2 text-charcoal/30 hover:text-maroon transition-colors p-1"
                        title="Remove"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>

              {/* Subtotal & Checkout */}
              {cartItems.length > 0 && (
                <div className="p-5 border-t border-saffron-light/20 bg-white/60">
                  <div className="flex flex-col gap-2.5 text-sm mb-5">
                    <div className="flex justify-between text-charcoal/70">
                      <span>Subtotal</span>
                      <span className="font-semibold text-charcoal">₹{cartItems.reduce((total, item) => total + (item.price * item.quantity), 0)}</span>
                    </div>
                    {promoCode && (
                      <div className="flex justify-between text-emerald-600">
                        <span className="flex items-center gap-1">
                          Discount ({promoCode.code})
                          <button onClick={removePromoCode} className="text-xs underline hover:text-maroon ml-1">Remove</button>
                        </span>
                        <span className="font-semibold">-₹{discount}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-base font-bold text-charcoal pt-2.5 border-t border-dashed border-saffron-light/20">
                      <span>Total Amount</span>
                      <span className="text-maroon text-lg">₹{cartTotal}</span>
                    </div>
                  </div>

                  <button 
                    onClick={() => {
                      setIsCartOpen(false);
                      navigate('/checkout');
                    }}
                    className="w-full bg-gradient-to-r from-saffron to-saffron-dark hover:from-saffron-dark hover:to-maroon text-white font-heading font-bold py-3.5 rounded-full shadow-md flex items-center justify-center gap-2 group transition-all"
                  >
                    Proceed to Checkout
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Sliding PWA Install Banner */}
      <AnimatePresence>
        {showInstallBanner && (
          <motion.div 
            initial={{ y: 120, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 120, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 80, damping: 15 }}
            className="fixed bottom-24 left-6 right-6 md:left-auto md:right-6 md:max-w-md z-50 glass-panel p-5 rounded-3xl bg-white/95 border-saffron/30 shadow-2xl flex items-center justify-between gap-4"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-saffron to-maroon flex items-center justify-center font-heading font-extrabold text-white text-lg shrink-0 shadow-md">
                KS
              </div>
              <div className="min-w-0 flex-grow">
                <h4 className="font-heading font-bold text-xs text-charcoal">Add Kashid Snacks to Home Screen</h4>
                <p className="text-[10px] text-charcoal/50 leading-tight mt-0.5">Install our PWA for offline snacks browsing, fast checkout, and updates.</p>
              </div>
            </div>
            <div className="flex gap-2 shrink-0">
              <button 
                onClick={handleInstallClick}
                className="bg-saffron hover:bg-saffron-dark text-white font-heading font-bold text-[10px] px-4 py-2 rounded-full shadow-sm transition-colors cursor-pointer"
              >
                Install
              </button>
              <button 
                onClick={() => {
                  setShowInstallBanner(false);
                  sessionStorage.setItem('kashid_install_dismissed', 'true');
                }}
                className="text-[10px] font-bold text-charcoal/40 hover:text-charcoal px-2 cursor-pointer"
              >
                Later
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sticky Mobile Bottom Navigation Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/90 backdrop-blur-md border-t border-saffron-light/20 flex justify-around py-3.5 md:hidden shadow-lg">
        <Link to="/home" className="flex flex-col items-center gap-1 text-charcoal/65 hover:text-saffron transition-colors">
          <Home className="w-5 h-5" />
          <span className="text-[9px] font-bold uppercase tracking-wider">Home</span>
        </Link>
        <Link to="/shop" className="flex flex-col items-center gap-1 text-charcoal/65 hover:text-saffron transition-colors">
          <ShoppingBag className="w-5 h-5" />
          <span className="text-[9px] font-bold uppercase tracking-wider">Shop</span>
        </Link>
        <button 
          onClick={() => { setIsCartOpen(true); setIsNotifOpen(false); }}
          className="flex flex-col items-center gap-1 text-charcoal/65 hover:text-saffron transition-colors relative"
        >
          <ShoppingBag className="w-5 h-5" />
          {cartCount > 0 && (
            <span className="absolute -top-1.5 right-2 bg-saffron text-white text-[8px] font-extrabold rounded-full w-4.5 h-4.5 flex items-center justify-center border border-white">
              {cartCount}
            </span>
          )}
          <span className="text-[9px] font-bold uppercase tracking-wider">Bag</span>
        </button>
        <Link to="/notifications" className="flex flex-col items-center gap-1 text-charcoal/65 hover:text-saffron transition-colors relative">
          <Bell className="w-5 h-5" />
          {unreadNotifs > 0 && (
            <span className="absolute -top-1.5 right-3.5 bg-maroon text-white text-[8px] font-extrabold rounded-full w-4.5 h-4.5 flex items-center justify-center border border-white">
              {unreadNotifs}
            </span>
          )}
          <span className="text-[9px] font-bold uppercase tracking-wider">Alerts</span>
        </Link>
        <Link to="/profile" className="flex flex-col items-center gap-1 text-charcoal/65 hover:text-saffron transition-colors">
          <User className="w-5 h-5" />
          <span className="text-[9px] font-bold uppercase tracking-wider">Profile</span>
        </Link>
      </div>
    </div>
  );
}
