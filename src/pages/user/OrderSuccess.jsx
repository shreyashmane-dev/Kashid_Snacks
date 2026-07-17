import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { MOCK_ORDERS } from '../../utils/mockData';
import { Check, Calendar, MapPin, Truck, ChevronRight } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db, isFirebaseMock } from '../../config/firebase';

export default function OrderSuccess() {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('orderId');
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      if (!orderId) return setLoading(false);

      if (isFirebaseMock) {
        // Load from localStorage or mockData
        const existingMockOrders = JSON.parse(localStorage.getItem('mock_orders_db') || '[]');
        const found = existingMockOrders.find(o => o.id === orderId) || MOCK_ORDERS.find(o => o.id === orderId);
        setOrder(found || null);
      } else {
        try {
          const docRef = doc(db, 'orders', orderId);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setOrder(docSnap.data());
          }
        } catch (error) {
          console.error("Error fetching order:", error);
        }
      }
      setLoading(false);
    };

    fetchOrder();
  }, [orderId]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-saffron border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-md mx-auto text-center py-20 px-6">
        <h2 className="font-heading font-extrabold text-2xl text-charcoal">Order Not Found</h2>
        <p className="text-sm text-charcoal/60 mt-2">We couldn't locate details for Order ID: {orderId}</p>
        <Link to="/" className="bg-saffron text-white font-heading font-bold px-6 py-2.5 rounded-full inline-block mt-6 text-sm">
          Return to Home
        </Link>
      </div>
    );
  }

  // Active status in timeline check
  const statuses = ['Order Placed', 'Confirmed', 'Shipped', 'Delivered'];
  const currentStatusIndex = statuses.indexOf(order.status) !== -1 ? statuses.indexOf(order.status) : 0;

  return (
    <div className="max-w-4xl mx-auto px-6 py-10 relative">
      {/* Background decorations */}
      <div className="absolute top-[20%] left-10 w-64 h-64 bg-saffron/15 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="flex flex-col items-center text-center mb-10 relative z-10">
        <div className="w-16 h-16 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-md animate-scaleUp">
          <Check className="w-8 h-8" />
        </div>
        <h1 className="font-heading font-extrabold text-3xl text-charcoal mt-6">Order Placed Successfully!</h1>
        <p className="text-sm text-charcoal/60 mt-1.5 max-w-sm">
          Thank you for choosing Kashid Snacks. Your order <span className="font-bold text-maroon">{order.id}</span> is on its way.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start relative z-10">
        {/* BILLING / ITEMS - LEFT (7 Columns) */}
        <div className="md:col-span-7 space-y-6">
          <div className="glass-panel p-6 rounded-3xl bg-white/40 border-white/60">
            <h3 className="font-heading font-bold text-base text-charcoal mb-4 border-b border-saffron-light/20 pb-2">Order Receipt</h3>
            
            <div className="space-y-4">
              {order.items.map((item) => (
                <div key={`${item.id}-${item.weight}`} className="flex items-center justify-between text-xs pb-3 border-b border-saffron-light/10 last:border-0 last:pb-0">
                  <div className="flex items-center gap-3">
                    <img src={item.image} alt={item.name} className="w-10 h-10 object-cover rounded-lg border border-saffron-light/10" />
                    <div>
                      <h4 className="font-semibold text-charcoal">{item.name}</h4>
                      <p className="text-[10px] text-charcoal/50 mt-0.5">{item.weight} x {item.quantity}</p>
                    </div>
                  </div>
                  <span className="font-bold text-charcoal">₹{item.price * item.quantity}</span>
                </div>
              ))}
            </div>

            {/* Total */}
            <div className="border-t border-saffron-light/20 pt-4 mt-4 flex flex-col gap-2 text-xs">
              <div className="flex justify-between text-charcoal/60">
                <span>Subtotal</span>
                <span>₹{order.subtotal}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-emerald-600 font-semibold">
                  <span>Discount</span>
                  <span>-₹{order.discount}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-bold text-charcoal pt-2.5 border-t border-dashed border-saffron-light/20">
                <span>Total Paid</span>
                <span className="text-maroon">₹{order.total}</span>
              </div>
            </div>
          </div>

          {/* Delivery & Payment details */}
          <div className="glass-panel p-6 rounded-3xl bg-white/40 border-white/60 grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <h4 className="text-xs font-bold text-charcoal uppercase tracking-wider mb-2.5 flex items-center gap-1.5"><MapPin className="w-4 h-4 text-saffron" /> Delivery Address</h4>
              <p className="text-xs font-bold text-charcoal">{order.shippingAddress.fullName}</p>
              <p className="text-xs text-charcoal/70 mt-1 leading-relaxed">
                {order.shippingAddress.addressLine}, <br />
                {order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.pincode}
              </p>
              <p className="text-xs text-charcoal/60 mt-1.5">Phone: {order.shippingAddress.phone}</p>
            </div>
            <div>
              <h4 className="text-xs font-bold text-charcoal uppercase tracking-wider mb-2.5 flex items-center gap-1.5"><Calendar className="w-4 h-4 text-maroon" /> Order Summary</h4>
              <p className="text-xs text-charcoal/70">Date: {new Date(order.createdAt).toLocaleDateString()}</p>
              <p className="text-xs text-charcoal/70 mt-1">Payment Method: {order.paymentMethod}</p>
              <p className="text-xs text-charcoal/70 mt-1">Status: <span className="font-bold text-saffron-dark">{order.status}</span></p>
            </div>
          </div>
        </div>

        {/* TIMELINE TRACKER - RIGHT (5 Columns) */}
        <div className="md:col-span-5">
          <div className="glass-panel p-6 rounded-3xl bg-white/40 border-white/60">
            <h3 className="font-heading font-bold text-base text-charcoal mb-6 border-b border-saffron-light/20 pb-2 flex items-center gap-2"><Truck className="w-5 h-5 text-saffron" /> Track Shipment</h3>
            
            <div className="relative pl-6 space-y-8 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-saffron-light/30">
              {statuses.map((status, index) => {
                const isCompleted = index <= currentStatusIndex;
                const isActive = index === currentStatusIndex;
                
                return (
                  <div key={status} className="relative text-xs">
                    {/* Circle Indicator */}
                    <span className={`absolute -left-6 top-0.5 w-4.5 h-4.5 rounded-full border-2 flex items-center justify-center transition-all ${
                      isCompleted 
                        ? 'bg-saffron border-saffron text-white scale-110 shadow-sm' 
                        : 'bg-white border-saffron-light/40 text-transparent'
                    }`}>
                      {isCompleted && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                    </span>
                    
                    <div className="ml-2">
                      <h4 className={`font-bold ${isActive ? 'text-saffron-dark' : isCompleted ? 'text-charcoal' : 'text-charcoal/40'}`}>
                        {status}
                      </h4>
                      <p className="text-[10px] text-charcoal/50 mt-0.5">
                        {status === 'Order Placed' && 'We have received your order.'}
                        {status === 'Confirmed' && 'Ingredients packed and verified.'}
                        {status === 'Shipped' && 'Dispatched via our royal logistics.'}
                        {status === 'Delivered' && 'Delivered directly to your hands.'}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-8 pt-4 border-t border-saffron-light/20 flex flex-col gap-3">
              <Link 
                to="/profile" 
                className="w-full bg-maroon hover:bg-maroon-dark text-white font-heading font-semibold py-2.5 rounded-full text-center text-xs flex items-center justify-center gap-1.5 transition-colors shadow-sm"
              >
                Go to My Orders <ChevronRight className="w-4 h-4" />
              </Link>
              <Link 
                to="/shop" 
                className="w-full glass-card hover:bg-white text-charcoal font-heading font-semibold py-2.5 rounded-full text-center text-xs transition-colors"
              >
                Keep Snacking
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
