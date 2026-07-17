import React, { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ShoppingBag, 
  Receipt, 
  Settings, 
  LogOut, 
  ChevronRight, 
  ArrowLeft, 
  Tag, 
  Menu, 
  X,
  Home,
  BookOpen,
  Bell
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db, isFirebaseMock } from '../config/firebase';

export default function AdminLayout() {
  const { currentUser, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [toast, setToast] = useState(null);

  // Play a premium tone using Web Audio API so we don't need audio files
  const playNotificationSound = () => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      gainNode.gain.setValueAtTime(0.08, audioCtx.currentTime);
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.15);
      
      setTimeout(() => {
        const osc2 = audioCtx.createOscillator();
        const gain2 = audioCtx.createGain();
        osc2.connect(gain2);
        gain2.connect(audioCtx.destination);
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(880, audioCtx.currentTime); // A5
        gain2.gain.setValueAtTime(0.08, audioCtx.currentTime);
        osc2.start();
        osc2.stop(audioCtx.currentTime + 0.3);
      }, 150);
    } catch (e) {
      console.warn("Audio Context blocked or unsupported:", e);
    }
  };

  // Auto-dismiss toast
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 6000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Real-time order listeners (Mock & Live Firestore)
  useEffect(() => {
    let unsubscribe = null;
    let isInitialLoad = true;

    const saved = localStorage.getItem('kashid_admin_notifications');
    let loadedNotifs = saved ? JSON.parse(saved) : [];
    setNotifications(loadedNotifs);

    if (isFirebaseMock) {
      // In mock mode, check localStorage for new orders
      let lastKnownOrders = JSON.parse(localStorage.getItem('mock_orders_db') || '[]');
      let lastKnownCount = lastKnownOrders.length;
      
      const interval = setInterval(() => {
        const currentOrders = JSON.parse(localStorage.getItem('mock_orders_db') || '[]');
        if (currentOrders.length > lastKnownCount) {
          const newOrders = currentOrders.slice(0, currentOrders.length - lastKnownCount);
          newOrders.forEach(o => {
            const newNotif = {
              id: `notif-${Date.now()}-${o.id}`,
              title: '🆕 New Order Received!',
              message: `Order ${o.id} placed by ${o.customerName} for ₹${o.total}`,
              orderId: o.id,
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              read: false
            };
            loadedNotifs = [newNotif, ...loadedNotifs];
            setNotifications(loadedNotifs);
            localStorage.setItem('kashid_admin_notifications', JSON.stringify(loadedNotifs));
            
            setToast({ message: `New Order ${o.id} placed for ₹${o.total}!`, orderId: o.id });
            playNotificationSound();
          });
          lastKnownCount = currentOrders.length;
        }
      }, 2500);

      return () => clearInterval(interval);
    } else {
      // Live Firebase: Listen for newly added orders
      const ordersRef = collection(db, 'orders');
      const q = query(ordersRef, orderBy('createdAt', 'desc'), limit(15));

      unsubscribe = onSnapshot(q, (snapshot) => {
        if (isInitialLoad) {
          isInitialLoad = false;
          return; // Skip triggering alerts for pre-existing history docs
        }

        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            const o = change.doc.data();
            const newNotif = {
              id: `notif-${Date.now()}-${o.id}`,
              title: '🆕 New Order Received!',
              message: `Order ${o.id} placed by ${o.customerName} for ₹${o.total}`,
              orderId: o.id,
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              read: false
            };
            loadedNotifs = [newNotif, ...loadedNotifs];
            setNotifications(loadedNotifs);
            localStorage.setItem('kashid_admin_notifications', JSON.stringify(loadedNotifs));

            setToast({ message: `New Order ${o.id} placed for ₹${o.total}!`, orderId: o.id });
            playNotificationSound();
          }
        });
      }, (err) => {
        console.error("Admin order real-time listener failed:", err);
      });
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const clearAllNotifications = () => {
    setNotifications([]);
    localStorage.removeItem('kashid_admin_notifications');
  };

  const markAsRead = (id) => {
    const updated = notifications.map(n => n.id === id ? { ...n, read: true } : n);
    setNotifications(updated);
    localStorage.setItem('kashid_admin_notifications', JSON.stringify(updated));
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const navItems = [
    { name: 'Dashboard', path: '/admin', icon: LayoutDashboard },
    { name: 'Manage Products', path: '/admin/products', icon: ShoppingBag },
    { name: 'Manage Orders', path: '/admin/orders', icon: Receipt },
    { name: 'Categories & Coupons', path: '/admin/coupons', icon: Tag },
    { name: 'Homepage Editor', path: '/admin/homepage-editor', icon: Home },
    { name: 'Our Story', path: '/admin/our-story', icon: BookOpen },
    { name: 'Settings', path: '/admin/settings', icon: Settings },
  ];

  const getPageTitle = () => {
    const active = navItems.find(item => item.path === location.pathname);
    return active ? active.name : 'Admin Panel';
  };

  return (
    <div className="min-h-screen bg-slate-50 flex relative font-sans">
      {/* SIDEBAR - DESKTOP */}
      <aside className="hidden lg:flex flex-col w-64 bg-slate-900 border-r border-slate-800 p-5 z-10 shrink-0 text-slate-300">
        {/* Brand */}
        <div className="flex items-center gap-2 mb-8 px-2 border-b border-slate-800 pb-5">
          <img 
            src="/kashid_logo.svg" 
            alt="Kashid Snacks Logo" 
            className="w-8 h-8 object-contain"
          />
          <div>
            <h2 className="font-heading font-extrabold text-sm text-white leading-none">Kashid Snacks</h2>
            <span className="text-[9px] font-bold text-saffron uppercase tracking-widest mt-1 inline-block">Admin Console</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-grow flex flex-col gap-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link 
                key={item.name} 
                to={item.path}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-lg font-heading font-semibold text-xs transition-all group ${
                  isActive 
                    ? 'bg-saffron text-white shadow-sm' 
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </div>
                <ChevronRight className={`w-3.5 h-3.5 transition-transform ${isActive ? 'translate-x-0.5' : 'opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5'}`} />
              </Link>
            );
          })}
        </nav>

        {/* Footer actions */}
        <div className="mt-auto border-t border-slate-800 pt-4 flex flex-col gap-2">
          <Link 
            to="/" 
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg font-heading text-xs font-semibold text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Storefront
          </Link>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg font-heading text-xs font-semibold text-rose-400 hover:bg-rose-950/20 transition-colors"
          >
            <LogOut className="w-4 h-4" /> Log Out
          </button>
        </div>
      </aside>

      {/* MOBILE HEADER & SIDEBAR */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            <div 
              onClick={() => setIsSidebarOpen(false)}
              className="fixed inset-0 bg-slate-900/60 z-40 lg:hidden"
            />
            <div className="fixed top-0 left-0 bottom-0 w-64 bg-slate-900 p-5 z-50 lg:hidden flex flex-col text-slate-300">
              <div className="flex items-center justify-between mb-8 border-b border-slate-800 pb-4">
                <span className="font-heading font-extrabold text-sm text-saffron uppercase tracking-wider">KS Admin</span>
                <button onClick={() => setIsSidebarOpen(false)} className="p-1 rounded-full hover:bg-slate-800 text-slate-400">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <nav className="flex-grow flex flex-col gap-1.5">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  return (
                    <Link 
                      key={item.name} 
                      to={item.path}
                      onClick={() => setIsSidebarOpen(false)}
                      className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg font-heading font-semibold text-xs transition-all ${
                        isActive 
                          ? 'bg-saffron text-white' 
                          : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
              </nav>
              <div className="mt-auto border-t border-slate-800 pt-4 flex flex-col gap-2">
                <Link to="/" onClick={() => setIsSidebarOpen(false)} className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-400"><ArrowLeft className="w-4 h-4" /> Storefront</Link>
                <button onClick={handleLogout} className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-rose-400"><LogOut className="w-4 h-4" /> Log Out</button>
              </div>
            </div>
          </>
        )}
      </AnimatePresence>

      {/* MAIN CONTENT AREA */}
      <div className="flex-grow flex flex-col min-w-0 z-10">
        {/* Top Header */}
        <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-1.5 rounded-full hover:bg-slate-100 text-slate-700"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="font-heading font-extrabold text-lg text-slate-800">{getPageTitle()}</h1>
          </div>

          {/* Admin User Info & Notifications */}
          <div className="flex items-center gap-4 relative">
            {/* Bell Icon & Badge */}
            <div className="relative">
              <button
                onClick={() => setShowNotifDropdown(!showNotifDropdown)}
                className="p-2 rounded-full hover:bg-slate-100 text-slate-650 transition-colors relative flex items-center justify-center border border-slate-200"
                aria-label="Admin Notifications"
              >
                <Bell className="w-4 h-4 text-slate-600" />
                {notifications.filter(n => !n.read).length > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-saffron animate-pulse" />
                )}
              </button>

              {/* Dropdown */}
              <AnimatePresence>
                {showNotifDropdown && (
                  <>
                    <div 
                      className="fixed inset-0 z-35" 
                      onClick={() => setShowNotifDropdown(false)} 
                    />
                    <div className="absolute right-0 mt-2 w-80 bg-slate-900 border border-slate-800 text-white rounded-2xl shadow-xl py-3 px-4 z-40 space-y-3">
                      <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                        <span className="font-heading font-extrabold text-[10px] text-saffron uppercase tracking-widest">Alerts</span>
                        {notifications.length > 0 && (
                          <button
                            onClick={clearAllNotifications}
                            className="text-[10px] text-rose-450 hover:underline"
                          >
                            Clear All
                          </button>
                        )}
                      </div>
                      <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                        {notifications.length === 0 ? (
                          <p className="text-xs text-slate-500 text-center py-4 italic">No new alerts.</p>
                        ) : (
                          notifications.map((n) => (
                            <div 
                              key={n.id} 
                              onClick={() => {
                                markAsRead(n.id);
                                navigate(`/admin/orders?orderId=${n.orderId}`);
                                setShowNotifDropdown(false);
                              }}
                              className={`p-2.5 rounded-xl text-left cursor-pointer transition-all hover:bg-slate-800 flex flex-col gap-1 border border-transparent ${n.read ? 'opacity-50' : 'bg-slate-800/40 border-saffron/10'}`}
                            >
                              <div className="flex justify-between items-center">
                                <span className="font-bold text-[11px] text-saffron">{n.title}</span>
                                <span className="text-[9px] text-slate-500">{n.time}</span>
                              </div>
                              <p className="text-[11px] text-slate-300 leading-snug">{n.message}</p>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </>
                )}
              </AnimatePresence>
            </div>

            <div className="text-right hidden sm:block">
              <p className="font-heading font-bold text-xs text-slate-800">{currentUser?.displayName || 'Store Owner'}</p>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Super Administrator</p>
            </div>
            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-700 text-sm border border-slate-200">
              👑
            </div>
          </div>
        </header>

        {/* Render child pages */}
        <main className="flex-grow p-6 overflow-y-auto bg-slate-50">
          <Outlet />
        </main>
      </div>

      {/* Floating Toast Alert Banner */}
      <AnimatePresence>
        {toast && (
          <div className="fixed top-4 right-4 z-50 max-w-sm w-full bg-slate-900 border border-slate-800 text-white p-4 rounded-2xl shadow-2xl flex items-start gap-3 animate-fadeIn">
            <div className="w-9 h-9 rounded-full bg-saffron/10 text-saffron flex items-center justify-center shrink-0 border border-saffron/20">
              <Bell className="w-4 h-4 animate-bounce text-saffron" />
            </div>
            <div className="flex-grow">
              <h4 className="font-heading font-extrabold text-[10px] text-saffron uppercase tracking-widest">New Order Alert</h4>
              <p className="text-xs mt-1 text-slate-200 leading-normal">{toast.message}</p>
              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => {
                    navigate(`/admin/orders?orderId=${toast.orderId}`);
                    setToast(null);
                  }}
                  className="bg-saffron hover:bg-saffron-dark text-white font-heading font-bold text-[10px] px-3.5 py-1.5 rounded-full shadow-sm transition-colors"
                >
                  Inspect Order
                </button>
                <button
                  onClick={() => setToast(null)}
                  className="text-slate-400 hover:text-white font-heading font-bold text-[10px] px-2 py-1.5"
                >
                  Dismiss
                </button>
              </div>
            </div>
            <button onClick={() => setToast(null)} className="text-slate-450 hover:text-white shrink-0">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
