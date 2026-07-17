import React, { useState } from 'react';
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
  BookOpen
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function AdminLayout() {
  const { currentUser, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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

          {/* Admin User Info */}
          <div className="flex items-center gap-3">
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
    </div>
  );
}
