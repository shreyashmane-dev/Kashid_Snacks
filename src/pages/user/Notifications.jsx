import React, { useState, useEffect } from 'react';
import { Bell, Trash2, CheckCircle2, Ticket, Package, Info, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const MOCK_NOTIFICATIONS = [
  {
    id: 1,
    title: "Festive Season Snack Drop!",
    message: "Get 20% off on all Sweets with coupon code FESTIVE20. Valid on orders above ₹500.",
    type: "coupon",
    time: "2 hours ago",
    read: false
  },
  {
    id: 2,
    title: "Order KS-83921 Shipped!",
    message: "Your box of Royal Saffron Bhujia is on its way via BlueDart. Track delivery details in your Profile.",
    type: "shipping",
    time: "1 day ago",
    read: true
  },
  {
    id: 3,
    title: "Mascot Kashi Says Hello!",
    message: "Discover our authentic cold grinding preparation secrets in the storytelling timeline.",
    type: "info",
    time: "3 days ago",
    read: true
  }
];

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    // Load notifications from local storage if they exist, otherwise set mock ones
    const saved = localStorage.getItem('kashid_notifications');
    if (saved) {
      setNotifications(JSON.parse(saved));
    } else {
      setNotifications(MOCK_NOTIFICATIONS);
      localStorage.setItem('kashid_notifications', JSON.stringify(MOCK_NOTIFICATIONS));
    }
  }, []);

  const saveAndSetNotifs = (updated) => {
    setNotifications(updated);
    localStorage.setItem('kashid_notifications', JSON.stringify(updated));
  };

  const handleMarkAsRead = (id) => {
    const updated = notifications.map(n => n.id === id ? { ...n, read: true } : n);
    saveAndSetNotifs(updated);
  };

  const handleDelete = (id) => {
    const updated = notifications.filter(n => n.id !== id);
    saveAndSetNotifs(updated);
  };

  const handleMarkAllRead = () => {
    const updated = notifications.map(n => ({ ...n, read: true }));
    saveAndSetNotifs(updated);
  };

  const handleClearAll = () => {
    saveAndSetNotifs([]);
  };

  const getIcon = (type) => {
    switch (type) {
      case 'coupon': return <Ticket className="w-5 h-5 text-emerald-600" />;
      case 'shipping': return <Package className="w-5 h-5 text-saffron" />;
      default: return <Info className="w-5 h-5 text-maroon" />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-12 relative">
      {/* Background blobs */}
      <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-saffron/10 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-maroon/10 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="mb-6 flex items-center justify-between">
        <Link 
          to="/home" 
          className="inline-flex items-center gap-1.5 text-xs font-bold text-charcoal/60 hover:text-saffron transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>
        {notifications.length > 0 && (
          <div className="flex gap-4">
            <button 
              onClick={handleMarkAllRead} 
              className="text-xs font-bold text-saffron hover:underline"
            >
              Mark all read
            </button>
            <button 
              onClick={handleClearAll} 
              className="text-xs font-bold text-charcoal/40 hover:text-maroon transition-colors"
            >
              Clear all
            </button>
          </div>
        )}
      </div>

      <div className="glass-panel p-6 sm:p-8 rounded-3xl bg-white/40 border-white/60 shadow-glass-warm relative overflow-hidden">
        <div className="flex items-center gap-3 mb-8 pb-4 border-b border-saffron-light/20">
          <div className="w-10 h-10 rounded-full bg-saffron/10 text-saffron flex items-center justify-center">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-heading font-extrabold text-xl text-charcoal">Notifications Center</h1>
            <p className="text-xs text-charcoal/50">Stay updated on your orders, special discount vouchers, and fresh recipes</p>
          </div>
        </div>

        {notifications.length === 0 ? (
          <div className="text-center py-16 flex flex-col items-center justify-center gap-4">
            <div className="w-16 h-16 rounded-full bg-saffron-light/10 text-charcoal/30 flex items-center justify-center">
              <Bell className="w-8 h-8" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-base text-charcoal">No notifications yet</h3>
              <p className="text-xs text-charcoal/50 mt-1">We'll alert you here when new spice drops or order updates roll out.</p>
            </div>
            <Link 
              to="/shop" 
              className="bg-saffron hover:bg-saffron-dark text-white font-heading font-bold text-xs px-6 py-2.5 rounded-full mt-2"
            >
              Browse Snacks
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {notifications.map((n) => (
              <div 
                key={n.id} 
                className={`glass-card p-4 rounded-2xl flex gap-4 items-start relative border-l-4 transition-all ${
                  n.read 
                    ? 'border-l-charcoal/20 bg-white/50' 
                    : 'border-l-saffron bg-white/85 shadow-sm'
                }`}
              >
                <div className="p-2.5 rounded-xl bg-cream-container/50 border border-saffron-light/10 shrink-0">
                  {getIcon(n.type)}
                </div>
                <div className="flex-grow pr-8">
                  <div className="flex items-baseline gap-2">
                    <h3 className="font-heading font-bold text-sm text-charcoal">{n.title}</h3>
                    {!n.read && (
                      <span className="w-1.5 h-1.5 rounded-full bg-saffron shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-charcoal/70 leading-relaxed font-body mt-1">
                    {n.message}
                  </p>
                  <span className="text-[9px] text-charcoal/40 mt-2 block font-mono">{n.time}</span>
                </div>

                {/* Individual Action Tools */}
                <div className="absolute top-4 right-4 flex gap-2">
                  {!n.read && (
                    <button 
                      onClick={() => handleMarkAsRead(n.id)}
                      className="p-1 rounded-full hover:bg-emerald-50 text-charcoal/30 hover:text-emerald-600 transition-colors"
                      title="Mark as read"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button 
                    onClick={() => handleDelete(n.id)}
                    className="p-1 rounded-full hover:bg-maroon-light/20 text-charcoal/30 hover:text-maroon transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
