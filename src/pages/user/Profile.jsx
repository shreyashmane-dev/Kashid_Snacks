import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { MOCK_ORDERS, PRODUCTS } from '../../utils/mockData';
import { ShoppingBag, MapPin, Heart, Settings, User, Clock, Trash2, Plus, Eye, Key, Package, CheckCircle2, Truck, Home, Star } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import KashiMascot from '../../components/KashiMascot';
import { doc, getDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db, isFirebaseMock } from '../../config/firebase';
import { useNavigate, Link } from 'react-router-dom';

// Amazon-style 5-step order status tracker
const ORDER_STEPS = [
  { key: 'Order Placed',      label: 'Ordered',          icon: CheckCircle2 },
  { key: 'Confirmed',         label: 'Confirmed',        icon: Package },
  { key: 'Shipped',           label: 'Shipped',          icon: Truck },
  { key: 'Out for Delivery',  label: 'Out for Delivery', icon: MapPin },
  { key: 'Delivered',         label: 'Delivered',        icon: Home },
];

const STATUS_INDEX = {
  'Order Placed': 0,
  'Confirmed': 1,
  'Shipped': 2,
  'Out for Delivery': 3,
  'Delivered': 4,
};

function AmazonOrderTracker({ order, onBack }) {
  const currentIdx = STATUS_INDEX[order.status] ?? 0;

  // Estimated delivery: 5 days from order
  const estDate = new Date(order.createdAt);
  estDate.setDate(estDate.getDate() + 5);
  const estDelivery = estDate.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex justify-between items-center">
        <button onClick={onBack} className="text-xs font-bold text-charcoal/60 hover:text-saffron flex items-center gap-1 transition-colors">
          ← Back to Orders
        </button>
        <span className="font-bold text-xs text-charcoal bg-saffron-light/20 px-3 py-1 rounded-full">{order.id}</span>
      </div>

      {/* Amazon stepper */}
      <div className="glass-panel p-6 rounded-3xl bg-white/40 border-white/60">
        <div className="flex items-start justify-between mb-2">
          <div>
            <p className="text-[10px] text-charcoal/50 uppercase font-bold tracking-wider">Delivery Status</p>
            <h3 className="font-heading font-extrabold text-lg text-charcoal mt-0.5">
              {order.status === 'Delivered' ? '🎉 Package Delivered!' : `Estimated by ${estDelivery}`}
            </h3>
          </div>
          <span className={`text-[10px] font-bold px-3 py-1 rounded-full ${
            order.status === 'Delivered' ? 'bg-emerald-100 text-emerald-700' :
            order.status === 'Out for Delivery' ? 'bg-blue-100 text-blue-700' :
            'bg-saffron-light/30 text-saffron-dark'
          }`}>
            {order.status}
          </span>
        </div>

        {/* 5-step horizontal stepper */}
        <div className="relative mt-6 mb-2">
          {/* Background connector line */}
          <div className="absolute top-5 left-[10%] right-[10%] h-0.5 bg-charcoal/10 z-0" />
          {/* Progress fill */}
          <div
            className="absolute top-5 left-[10%] h-0.5 bg-gradient-to-r from-saffron to-maroon z-0 transition-all duration-700"
            style={{ width: `${(currentIdx / (ORDER_STEPS.length - 1)) * 80}%` }}
          />

          <div className="relative z-10 flex justify-between">
            {ORDER_STEPS.map((step, idx) => {
              const StepIcon = step.icon;
              const isCompleted = idx <= currentIdx;
              const isCurrent = idx === currentIdx;

              return (
                <div key={step.key} className="flex flex-col items-center w-[20%]">
                  <div className={`
                    w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-500
                    ${isCompleted
                      ? 'bg-gradient-to-br from-saffron to-maroon border-saffron text-white shadow-md'
                      : 'bg-white border-charcoal/15 text-charcoal/30'}
                    ${isCurrent ? 'scale-110 ring-4 ring-saffron/20' : ''}
                  `}>
                    <StepIcon className="w-4 h-4" />
                  </div>
                  <span className={`text-[9px] font-bold mt-2 text-center leading-tight ${
                    isCompleted ? 'text-maroon' : 'text-charcoal/35'
                  }`}>
                    {step.label}
                  </span>
                  {isCurrent && (
                    <span className="text-[8px] text-saffron font-extrabold mt-0.5 uppercase tracking-wide">● Now</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Two-col: timeline + shipping */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Timeline events */}
        <div className="glass-panel p-5 rounded-3xl bg-white/40 border-white/60">
          <h4 className="text-[10px] font-bold text-charcoal/50 uppercase tracking-wider mb-4">Activity Log</h4>
          <div className="relative pl-5 space-y-4 before:absolute before:left-2 before:top-1 before:bottom-1 before:w-0.5 before:bg-saffron-light/30">
            {(order.timeline || []).slice().reverse().map((event, idx) => (
              <div key={idx} className="relative text-xs">
                <span className="absolute -left-5 top-1 w-3 h-3 rounded-full bg-saffron border-2 border-white shadow-sm" />
                <h5 className="font-bold text-charcoal">{event.status}</h5>
                <p className="text-[10px] text-charcoal/50 mt-0.5 leading-relaxed">{event.note}</p>
                <span className="text-[8px] text-charcoal/35 font-mono block mt-1">
                  {new Date(event.time).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Order details */}
        <div className="space-y-3">
          {/* Shipping */}
          <div className="glass-panel p-4 rounded-2xl bg-white/40 border-white/60">
            <h4 className="text-[10px] font-bold text-charcoal/50 uppercase tracking-wider mb-2 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-saffron" /> Delivery Address
            </h4>
            <p className="text-xs font-bold text-charcoal">{order.shippingAddress?.fullName}</p>
            <p className="text-[11px] text-charcoal/60 mt-1 leading-relaxed">
              {order.shippingAddress?.addressLine},<br />
              {order.shippingAddress?.city}, {order.shippingAddress?.state} - {order.shippingAddress?.pincode}
            </p>
          </div>

          {/* Pricing */}
          <div className="glass-panel p-4 rounded-2xl bg-white/40 border-white/60 space-y-2">
            <h4 className="text-[10px] font-bold text-charcoal/50 uppercase tracking-wider mb-2">Price Breakdown</h4>
            <div className="flex justify-between text-[11px] text-charcoal/60">
              <span>Subtotal</span><span className="font-semibold text-charcoal">₹{order.subtotal}</span>
            </div>
            <div className="flex justify-between text-[11px] text-charcoal/60">
              <span className="flex items-center gap-1"><Truck className="w-3 h-3" /> Delivery</span>
              <span className={`font-semibold ${order.deliveryCharge === 0 ? 'text-emerald-600' : 'text-charcoal'}`}>
                {order.deliveryCharge === 0 ? 'FREE' : `₹${order.deliveryCharge}`}
              </span>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between text-[11px] text-emerald-600 font-semibold">
                <span>Discount</span><span>-₹{order.discount}</span>
              </div>
            )}
            <div className="flex justify-between text-xs font-bold text-charcoal border-t border-dashed border-saffron-light/20 pt-2 mt-1">
              <span>Total Paid</span><span className="text-maroon">₹{order.total}</span>
            </div>
            <p className="text-[10px] text-charcoal/40 mt-1">via {order.paymentMethod}</p>
          </div>

          {/* Items */}
          <div className="glass-panel p-4 rounded-2xl bg-white/40 border-white/60">
            <h4 className="text-[10px] font-bold text-charcoal/50 uppercase tracking-wider mb-2">Items</h4>
            <div className="space-y-1.5">
              {order.items?.map((item, i) => (
                <div key={i} className="flex justify-between text-[11px]">
                  <span className="text-charcoal font-medium truncate max-w-[180px]">{item.name} ({item.weight}) × {item.quantity}</span>
                  <span className="font-bold text-charcoal">₹{item.price * item.quantity}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Profile() {
  const { currentUser, loading } = useAuth();
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('orders');

  const [orders, setOrders] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [displayName, setDisplayName] = useState('');

  const [loadingOrders, setLoadingOrders] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Address form states
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [newStreet, setNewStreet] = useState('');
  const [newCity, setNewCity] = useState('');
  const [newState, setNewState] = useState('');
  const [newPincode, setNewPincode] = useState('');
  const [newPhone, setNewPhone] = useState('');

  const [successMsg, setSuccessMsg] = useState('');

  // Navigation Guard for profile
  useEffect(() => {
    if (!loading && !currentUser) {
      navigate('/auth/login?redirect=/profile');
    } else if (currentUser) {
      setDisplayName(currentUser.displayName || '');
    }
  }, [currentUser, loading, navigate]);

  useEffect(() => {
    const loadProfileData = async () => {
      if (!currentUser) return;

      // 1. Fetch products from Firestore (so wishlist items match database entries)
      let dbProductsList = [];
      try {
        if (isFirebaseMock) {
          const dbProducts = JSON.parse(localStorage.getItem('mock_products_db') || '[]');
          dbProductsList = dbProducts.length > 0 ? dbProducts : PRODUCTS;
        } else {
          const productsSnapshot = await getDocs(collection(db, 'products'));
          const list = [];
          productsSnapshot.forEach((doc) => {
            list.push(doc.data());
          });
          dbProductsList = list.length > 0 ? list : PRODUCTS;
        }
      } catch (err) {
        console.error("Error loading products for profile view:", err);
        dbProductsList = PRODUCTS;
      }

      if (isFirebaseMock) {
        // Orders
        const userOrders = JSON.parse(localStorage.getItem('mock_user_orders') || '{}');
        const list = userOrders[currentUser.uid] || MOCK_ORDERS.filter(o => o.userId === currentUser.uid);
        setOrders(list);

        // Addresses
        const userAddrs = JSON.parse(localStorage.getItem('mock_user_addresses') || '{}');
        setAddresses(userAddrs[currentUser.uid] || [
          { id: '1', fullName: currentUser.displayName, addressLine: 'A-404, Shanti Heights, Link Road', city: 'Mumbai', state: 'Maharashtra', pincode: '400053', phone: '9876543210' }
        ]);

        // Wishlist
        const userWish = JSON.parse(localStorage.getItem('mock_user_wishlist') || '{}');
        const wishIds = userWish[currentUser.uid] || ['saffron-bhujia', 'kaju-katli'];
        setWishlist(dbProductsList.filter(p => wishIds.includes(p.id)));

        // Profile display name fallback
        const savedUser = JSON.parse(localStorage.getItem('mock_user') || '{}');
        if (savedUser.displayName) {
          setDisplayName(savedUser.displayName);
        }

      } else {
        // Live Firebase profile fetch
        try {
          const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            setAddresses(data.addresses || []);
            
            // Set displayName from Firestore database
            if (data.displayName) {
              setDisplayName(data.displayName);
            }

            // Map wishlist IDs to actual database products
            const wishIds = data.wishlist || [];
            setWishlist(dbProductsList.filter(p => wishIds.includes(p.id)));
          }

          // Fetch orders collection matching userId from Firestore
          const q = query(collection(db, 'orders'), where('userId', '==', currentUser.uid));
          const querySnapshot = await getDocs(q);
          const fetchedOrders = [];
          querySnapshot.forEach((doc) => {
            fetchedOrders.push(doc.data());
          });
          fetchedOrders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
          setOrders(fetchedOrders);
        } catch (error) {
          console.error("Error loading live profile data:", error);
        }
      }
      setLoadingOrders(false);
    };

    loadProfileData();
  }, [currentUser]);

  const handleUpdateName = async (e) => {
    e.preventDefault();
    if (isFirebaseMock) {
      const mock = JSON.parse(localStorage.getItem('mock_user') || '{}');
      mock.displayName = displayName;
      localStorage.setItem('mock_user', JSON.stringify(mock));
      setSuccessMsg("Profile name updated locally!");
      setTimeout(() => setSuccessMsg(''), 3000);
    } else {
      try {
        await updateDoc(doc(db, 'users', currentUser.uid), { displayName });
        setSuccessMsg("Profile updated successfully!");
        setTimeout(() => setSuccessMsg(''), 3000);
      } catch (error) {
        console.error("Update profile failed:", error);
      }
    }
  };

  const handleGetLiveLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }
    
    navigator.geolocation.getCurrentPosition(async (position) => {
      const { latitude, longitude } = position.coords;
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
        const data = await res.json();
        if (data && data.address) {
          const addr = data.address;
          const street = addr.road || addr.suburb || addr.neighbourhood || '';
          const city = addr.city || addr.town || addr.village || '';
          const state = addr.state || '';
          const pincode = addr.postcode || '';
          
          setNewStreet(street);
          setNewCity(city);
          setNewState(state);
          setNewPincode(pincode);
        }
      } catch (err) {
        console.error("Error reverse geocoding:", err);
      }
    }, (error) => {
      console.error("Geolocation error:", error);
      alert("Unable to retrieve location. Please grant permission.");
    });
  };

  const handleAddAddress = (e) => {
    e.preventDefault();
    const newAddr = {
      id: `addr-${Date.now()}`,
      fullName: displayName,
      addressLine: newStreet,
      city: newCity,
      state: newState,
      pincode: newPincode,
      phone: newPhone
    };

    const updated = [...addresses, newAddr];
    setAddresses(updated);

    if (isFirebaseMock) {
      const userAddrs = JSON.parse(localStorage.getItem('mock_user_addresses') || '{}');
      userAddrs[currentUser.uid] = updated;
      localStorage.setItem('mock_user_addresses', JSON.stringify(userAddrs));
    } else {
      updateDoc(doc(db, 'users', currentUser.uid), { addresses: updated });
    }

    // Reset fields
    setNewStreet('');
    setNewCity('');
    setNewState('');
    setNewPincode('');
    setNewPhone('');
    setShowAddressForm(false);
  };

  const handleDeleteAddress = (addrId) => {
    const updated = addresses.filter(a => a.id !== addrId);
    setAddresses(updated);
    if (isFirebaseMock) {
      const userAddrs = JSON.parse(localStorage.getItem('mock_user_addresses') || '{}');
      userAddrs[currentUser.uid] = updated;
      localStorage.setItem('mock_user_addresses', JSON.stringify(userAddrs));
    } else {
      updateDoc(doc(db, 'users', currentUser.uid), { addresses: updated });
    }
  };

  const removeFromWishlist = (productId) => {
    const updated = wishlist.filter(p => p.id !== productId);
    setWishlist(updated);

    if (isFirebaseMock) {
      const userWish = JSON.parse(localStorage.getItem('mock_user_wishlist') || '{}');
      userWish[currentUser.uid] = updated.map(p => p.id);
      localStorage.setItem('mock_user_wishlist', JSON.stringify(userWish));
    } else {
      updateDoc(doc(db, 'users', currentUser.uid), { wishlist: updated.map(p => p.id) });
    }
  };

  if (loading || !currentUser) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-saffron border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-6 relative">
      <div className="flex flex-col md:flex-row items-center gap-6 mb-10 pb-8 border-b border-saffron-light/20">
        <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-saffron to-maroon text-white flex items-center justify-center font-heading font-extrabold text-3xl shadow-md shrink-0">
          {displayName ? displayName.charAt(0).toUpperCase() : 'U'}
        </div>
        <div className="text-center md:text-left flex-grow">
          <h1 className="font-heading font-extrabold text-2xl text-charcoal">{displayName || 'Snack Lover'}</h1>
          <p className="text-xs text-charcoal/50 mt-1">User Email: {currentUser?.email}</p>
          <div className="flex justify-center md:justify-start gap-3 mt-3">
            <span className="bg-saffron/10 border border-saffron/20 text-saffron-dark text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full">
              {isFirebaseMock ? 'Mock Member' : 'Loyalty Member'}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start relative z-10">
        {/* TABS SELECTOR - LEFT (3 Columns) */}
        <div className="lg:col-span-3 flex flex-col gap-2">
          <button
            onClick={() => { setActiveTab('orders'); setSelectedOrder(null); }}
            className={`flex items-center gap-3 px-4 py-3 rounded-2xl font-heading font-bold text-sm text-left transition-all ${activeTab === 'orders'
                ? 'bg-maroon text-white shadow-md'
                : 'glass-card text-charcoal/70 hover:bg-saffron-light/20'
              }`}
          >
            <Clock className="w-5 h-5" />
            <span>My Orders</span>
          </button>
          <button
            onClick={() => setActiveTab('addresses')}
            className={`flex items-center gap-3 px-4 py-3 rounded-2xl font-heading font-bold text-sm text-left transition-all ${activeTab === 'addresses'
                ? 'bg-maroon text-white shadow-md'
                : 'glass-card text-charcoal/70 hover:bg-saffron-light/20'
              }`}
          >
            <MapPin className="w-5 h-5" />
            <span>Saved Addresses</span>
          </button>
          <button
            onClick={() => setActiveTab('wishlist')}
            className={`flex items-center gap-3 px-4 py-3 rounded-2xl font-heading font-bold text-sm text-left transition-all ${activeTab === 'wishlist'
                ? 'bg-maroon text-white shadow-md'
                : 'glass-card text-charcoal/70 hover:bg-saffron-light/20'
              }`}
          >
            <Heart className="w-5 h-5" />
            <span>Wishlist</span>
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-3 px-4 py-3 rounded-2xl font-heading font-bold text-sm text-left transition-all ${activeTab === 'settings'
                ? 'bg-maroon text-white shadow-md'
                : 'glass-card text-charcoal/70 hover:bg-saffron-light/20'
              }`}
          >
            <Settings className="w-5 h-5" />
            <span>Settings</span>
          </button>
        </div>

        {/* TAB DETAILS - RIGHT (9 Columns) */}
        <div className="lg:col-span-9">
          {/* A. ORDERS HISTORY */}
          {activeTab === 'orders' && (
            <div className="space-y-6">
              {selectedOrder ? (
                <AmazonOrderTracker order={selectedOrder} onBack={() => setSelectedOrder(null)} />
              ) : (
                <>
                  <h3 className="font-heading font-bold text-lg text-charcoal flex items-center gap-2 mb-2"><ShoppingBag className="w-5 h-5 text-saffron" /> Your Order History</h3>

                  {loadingOrders ? (
                    <div className="py-12 flex justify-center"><div className="w-8 h-8 border-4 border-saffron border-t-transparent rounded-full animate-spin"></div></div>
                  ) : orders.length === 0 ? (
                    <div className="glass-panel text-center py-10 px-6 rounded-3xl bg-white/40 flex flex-col items-center">
                      <div className="w-36 h-36 mb-4">
                        <KashiMascot stage={0} className="w-full h-full" />
                      </div>
                      <p className="font-heading font-bold text-charcoal">No Orders Placed Yet</p>
                      <p className="text-xs text-charcoal/50 mt-1 max-w-xs leading-relaxed">Ready to munch? Kashi is waiting in the kitchen to pack your first custom box!</p>
                      <Link to="/shop" className="bg-saffron hover:bg-saffron-dark text-white font-heading font-bold px-6 py-2.5 rounded-full inline-block mt-4 text-xs shadow-sm transition-colors cursor-pointer">Shop Snacks Now</Link>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {orders.map((o) => {
                        const stepIdx = STATUS_INDEX[o.status] ?? 0;
                        const progress = Math.round((stepIdx / (ORDER_STEPS.length - 1)) * 100);
                        return (
                          <div
                            key={o.id}
                            className="glass-panel p-5 rounded-3xl bg-white/40 border-white/60 hover:shadow-md transition-shadow cursor-pointer"
                            onClick={() => setSelectedOrder(o)}
                          >
                            <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-3">
                              <div className="flex-grow">
                                <div className="flex items-center gap-3 flex-wrap">
                                  <span className="font-bold text-sm text-charcoal">{o.id}</span>
                                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                                    o.status === 'Delivered' ? 'bg-emerald-100 text-emerald-800' :
                                    o.status === 'Out for Delivery' ? 'bg-blue-100 text-blue-700' :
                                    'bg-saffron-light/35 text-saffron-dark'
                                  }`}>
                                    {o.status}
                                  </span>
                                </div>
                                <p className="text-[10px] text-charcoal/50 mt-1">Placed on: {new Date(o.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                                <p className="text-xs font-semibold text-charcoal/70 mt-1.5">{o.items?.slice(0, 2).map(i => `${i.name} (${i.weight})`).join(', ')}{o.items?.length > 2 ? ` +${o.items.length - 2} more` : ''}</p>

                                {/* Mini progress bar */}
                                <div className="mt-3 flex items-center gap-2">
                                  <div className="flex-grow h-1.5 bg-charcoal/10 rounded-full overflow-hidden">
                                    <div
                                      className="h-full bg-gradient-to-r from-saffron to-maroon rounded-full transition-all duration-500"
                                      style={{ width: `${progress}%` }}
                                    />
                                  </div>
                                  <span className="text-[9px] font-bold text-charcoal/40 shrink-0">{ORDER_STEPS[stepIdx]?.label}</span>
                                </div>
                              </div>

                              <div className="flex items-center justify-between sm:flex-col sm:items-end gap-4 border-t sm:border-0 pt-3 sm:pt-0">
                                <span className="font-heading font-extrabold text-maroon text-base">₹{o.total}</span>
                                <button className="text-xs font-bold text-saffron hover:underline flex items-center gap-1">
                                  Track <Eye className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* B. ADDRESS BOOK */}
          {activeTab === 'addresses' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="font-heading font-bold text-lg text-charcoal flex items-center gap-2"><MapPin className="w-5 h-5 text-saffron" /> Address Book</h3>
                <button
                  onClick={() => setShowAddressForm(!showAddressForm)}
                  className="bg-saffron hover:bg-saffron-dark text-white font-heading font-bold text-xs px-4 py-2 rounded-full shadow-sm flex items-center gap-1.5 transition-colors"
                >
                  <Plus className="w-4 h-4" /> Add Address
                </button>
              </div>

              {showAddressForm && (
                <form onSubmit={handleAddAddress} className="glass-panel p-5 rounded-3xl bg-white/50 border-saffron-light/20 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2 flex justify-between items-center">
                    <h4 className="text-xs font-bold text-charcoal uppercase tracking-wider">New Delivery Contact</h4>
                    <button
                      type="button"
                      onClick={handleGetLiveLocation}
                      className="bg-maroon hover:bg-maroon-dark text-white font-heading font-bold text-[10px] px-3.5 py-1.5 rounded-full shadow-sm flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <MapPin className="w-3.5 h-3.5" /> Detect Location
                    </button>
                  </div>
                  <div className="sm:col-span-2">
                    <input
                      type="text"
                      placeholder="Street Address, Area"
                      value={newStreet}
                      onChange={e => setNewStreet(e.target.value)}
                      className="w-full glass-input rounded-full py-2 px-4 text-xs"
                      required
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      placeholder="City"
                      value={newCity}
                      onChange={e => setNewCity(e.target.value)}
                      className="w-full glass-input rounded-full py-2 px-4 text-xs"
                      required
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      placeholder="State"
                      value={newState}
                      onChange={e => setNewState(e.target.value)}
                      className="w-full glass-input rounded-full py-2 px-4 text-xs"
                      required
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      placeholder="Pincode (6 digits)"
                      value={newPincode}
                      onChange={e => setNewPincode(e.target.value)}
                      className="w-full glass-input rounded-full py-2 px-4 text-xs"
                      maxLength={6}
                      required
                    />
                  </div>
                  <div>
                    <input
                      type="tel"
                      placeholder="Mobile Phone"
                      value={newPhone}
                      onChange={e => setNewPhone(e.target.value)}
                      className="w-full glass-input rounded-full py-2 px-4 text-xs"
                      required
                    />
                  </div>
                  <div className="sm:col-span-2 flex justify-end gap-2.5 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowAddressForm(false)}
                      className="bg-cream-container hover:bg-cream-highest text-charcoal font-semibold text-xs px-4 py-2 rounded-full border border-charcoal/10"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="bg-maroon hover:bg-maroon-dark text-white font-heading font-bold text-xs px-5 py-2.5 rounded-full"
                    >
                      Save Address
                    </button>
                  </div>
                </form>
              )}

              {addresses.length === 0 ? (
                <div className="glass-panel text-center py-8 rounded-3xl bg-white/40">
                  <p className="text-xs text-charcoal/50">No saved addresses.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {addresses.map((a) => (
                    <div key={a.id} className="glass-panel p-5 rounded-2xl bg-white/40 border-white/60 flex flex-col justify-between relative">
                      <div>
                        <h4 className="font-bold text-xs text-charcoal">{a.fullName}</h4>
                        <p className="text-[11px] text-charcoal/70 mt-1.5 leading-relaxed">
                          {a.addressLine}, <br />
                          {a.city}, {a.state} - {a.pincode}
                        </p>
                        <p className="text-[10px] text-charcoal/50 mt-1">Mobile: {a.phone}</p>
                      </div>
                      <div className="flex justify-end mt-4 pt-3 border-t border-saffron-light/10">
                        <button
                          onClick={() => handleDeleteAddress(a.id)}
                          className="text-[10px] font-bold text-maroon hover:underline flex items-center gap-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* C. WISHLIST */}
          {activeTab === 'wishlist' && (
            <div className="space-y-6">
              <h3 className="font-heading font-bold text-lg text-charcoal flex items-center gap-2"><Heart className="w-5 h-5 text-maroon" /> Your Wishlisted Snacks</h3>

              {wishlist.length === 0 ? (
                <div className="glass-panel text-center py-12 rounded-3xl bg-white/40">
                  <p className="text-xs text-charcoal/50">Your wishlist is empty.</p>
                  <Link to="/shop" className="bg-saffron text-white font-heading font-bold px-6 py-2.5 rounded-full inline-block mt-4 text-xs">Explore Snacks</Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {wishlist.map((item) => (
                    <div key={item.id} className="glass-panel p-4 rounded-2xl bg-white/40 border-white/60 flex gap-4 items-center relative">
                      <img src={item.images[0]} alt={item.name} className="w-16 h-16 object-cover rounded-lg border border-saffron-light/20" />
                      <div className="flex-grow min-w-0">
                        <h4 className="font-heading font-bold text-sm text-charcoal truncate">{item.name}</h4>
                        <span className="font-bold text-xs text-maroon mt-0.5 block">₹{item.price}</span>
                        <div className="flex gap-3.5 mt-2.5">
                          <button
                            onClick={() => addToCart(item, 1, item.variants?.[0] || null)}
                            className="text-[10px] font-bold text-saffron hover:underline"
                          >
                            Add to Bag
                          </button>
                          <button
                            onClick={() => removeFromWishlist(item.id)}
                            className="text-[10px] font-bold text-maroon hover:underline"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* D. ACCOUNT SETTINGS */}
          {activeTab === 'settings' && (
            <div className="glass-panel p-6 rounded-3xl bg-white/40 border-white/60 space-y-6">
              <h3 className="font-heading font-bold text-lg text-charcoal flex items-center gap-2"><User className="w-5 h-5 text-saffron" /> Account Settings</h3>

              {successMsg && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs px-4 py-2 rounded-xl">
                  {successMsg}
                </div>
              )}

              <form onSubmit={handleUpdateName} className="space-y-4 max-w-md">
                <div>
                  <label className="block text-[10px] font-bold text-charcoal/60 uppercase mb-1.5 ml-1">Profile Name</label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={e => setDisplayName(e.target.value)}
                    className="w-full glass-input rounded-full py-2.5 px-4 text-xs font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-charcoal/60 uppercase mb-1.5 ml-1">User Email (read-only)</label>
                  <input
                    type="email"
                    value={currentUser?.email}
                    disabled
                    className="w-full glass-input rounded-full py-2.5 px-4 text-xs opacity-50 bg-charcoal/5 cursor-not-allowed"
                  />
                </div>
                <div className="pt-2">
                  <button
                    type="submit"
                    className="bg-saffron hover:bg-saffron-dark text-white font-heading font-bold text-xs px-6 py-2.5 rounded-full shadow-md transition-colors"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
