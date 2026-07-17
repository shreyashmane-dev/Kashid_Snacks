import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { CreditCard, Tag, ArrowRight, ShieldCheck, MapPin, Truck, HelpCircle, CheckCircle } from 'lucide-react';
import { doc, setDoc } from 'firebase/firestore';
import { db, functions, isFirebaseMock } from '../../config/firebase';
import { httpsCallable } from 'firebase/functions';

const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export default function Checkout() {
  const { cartItems, cartSubtotal, cartTotal, discount, promoCode, applyPromoCode, removePromoCode, clearCart } = useCart();
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  // Redirect guest users if not logged in
  React.useEffect(() => {
    if (!currentUser) {
      navigate('/auth/login?redirect=/checkout');
    }
  }, [currentUser, navigate]);

  // Address fields
  const [name, setName] = useState(currentUser?.displayName || '');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');
  const [phone, setPhone] = useState('');

  // Payment fields
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [promoInput, setPromoInput] = useState('');
  
  const [upiId, setUpiId] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [promoError, setPromoError] = useState('');
  const [tempOrderData, setTempOrderData] = useState(null);

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
          
          setAddress(street);
          setCity(city);
          setState(state);
          setPincode(pincode);
        }
      } catch (err) {
        console.error("Error reverse geocoding:", err);
      }
    }, (error) => {
      console.error("Geolocation error:", error);
      alert("Unable to retrieve location. Please grant permission.");
    });
  };

  const handlePromoSubmit = async (e) => {
    e.preventDefault();
    if (!promoInput) return;
    try {
      setPromoError('');
      await applyPromoCode(promoInput);
      setPromoInput('');
    } catch (err) {
      setPromoError(err.message || "Invalid coupon");
    }
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (!name || !address || !city || !state || !pincode || !phone) {
      return setError("Please fill in all shipping details");
    }
    if (cartItems.length === 0) {
      return setError("Your snack bag is empty!");
    }

    // Payment validation checks
    if (paymentMethod === 'UPI') {
      if (!upiId || !upiId.includes('@')) {
        return setError("Please enter a valid UPI ID (e.g. name@upi)");
      }
    } else if (paymentMethod === 'Card') {
      const cleanCard = cardNumber.replace(/\s/g, '');
      if (cleanCard.length !== 16) {
        return setError("Please enter a valid 16-digit card number");
      }
      if (!cardExpiry || !cardExpiry.includes('/') || cardExpiry.length !== 5) {
        return setError("Please enter card expiry in MM/YY format");
      }
      if (cardCvv.length !== 3) {
        return setError("Please enter a 3-digit CVV number");
      }
    }

    setLoading(true);
    setError('');

    const orderId = `KS-${Math.floor(10000 + Math.random() * 90000)}`;
    const finalOrder = {
      id: orderId,
      userId: currentUser ? currentUser.uid : 'guest-uid',
      customerName: name,
      customerEmail: currentUser ? currentUser.email : 'guest@kashidsnacks.com',
      items: cartItems,
      subtotal: cartSubtotal,
      discount: discount,
      total: cartTotal,
      shippingAddress: {
        fullName: name,
        addressLine: address,
        city,
        state,
        pincode,
        phone
      },
      paymentMethod: paymentMethod,
      paymentId: paymentMethod === 'COD' ? 'COD-PAY' : '',
      paymentStatus: paymentMethod === 'COD' ? 'Pending' : 'Completed',
      status: 'Order Placed',
      timeline: [
        { status: 'Order Placed', time: new Date().toISOString(), note: 'Order successfully received.' }
      ],
      createdAt: new Date().toISOString()
    };

    // If COD, complete order instantly
    if (paymentMethod === 'COD') {
      try {
        await new Promise(resolve => setTimeout(resolve, 1200));

        if (isFirebaseMock) {
          const existingMockOrders = JSON.parse(localStorage.getItem('mock_orders_db') || '[]');
          existingMockOrders.unshift(finalOrder);
          localStorage.setItem('mock_orders_db', JSON.stringify(existingMockOrders));

          if (currentUser) {
            const userOrders = JSON.parse(localStorage.getItem('mock_user_orders') || '{}');
            const currentList = userOrders[currentUser.uid] || [];
            currentList.unshift(finalOrder);
            userOrders[currentUser.uid] = currentList;
            localStorage.setItem('mock_user_orders', JSON.stringify(userOrders));
          }
        } else {
          await setDoc(doc(db, 'orders', finalOrder.id), finalOrder);
        }

        const notificationList = JSON.parse(localStorage.getItem('kashid_notifications') || '[]');
        notificationList.unshift({
          id: Date.now(),
          title: `COD Order ${orderId} Confirmed!`,
          message: `Your Cash on Delivery order is confirmed. Pay ₹${cartTotal} at delivery.`,
          type: 'shipping',
          time: 'Just now',
          read: false
        });
        localStorage.setItem('kashid_notifications', JSON.stringify(notificationList));

        clearCart();
        navigate(`/order-success?orderId=${finalOrder.id}`);
      } catch (err) {
        setError("Failed to place COD order: " + err.message);
      } finally {
        setLoading(false);
      }
      return;
    }

    // Online payment mode
    const razorpayKey = import.meta.env.VITE_RAZORPAY_KEY_ID;

    if (isFirebaseMock || !razorpayKey) {
      // Mock execution fallback
      try {
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        const mockPayId = `PAY-${Math.floor(10000000 + Math.random() * 90000000)}`;
        const localFinalOrder = {
          ...finalOrder,
          paymentId: mockPayId,
          paymentStatus: 'Completed'
        };

        const existingMockOrders = JSON.parse(localStorage.getItem('mock_orders_db') || '[]');
        existingMockOrders.unshift(localFinalOrder);
        localStorage.setItem('mock_orders_db', JSON.stringify(existingMockOrders));

        if (currentUser) {
          const userOrders = JSON.parse(localStorage.getItem('mock_user_orders') || '{}');
          const currentList = userOrders[currentUser.uid] || [];
          currentList.unshift(localFinalOrder);
          userOrders[currentUser.uid] = currentList;
          localStorage.setItem('mock_user_orders', JSON.stringify(userOrders));
        }

        const notificationList = JSON.parse(localStorage.getItem('kashid_notifications') || '[]');
        notificationList.unshift({
          id: Date.now(),
          title: `Order ${orderId} Placed!`,
          message: `Payment successful! Kashi is preparing your box of spiced snacks.`,
          type: 'shipping',
          time: 'Just now',
          read: false
        });
        localStorage.setItem('kashid_notifications', JSON.stringify(notificationList));

        clearCart();
        navigate(`/order-success?orderId=${orderId}`);
      } catch (err) {
        setError("Mock payment failed: " + err.message);
      } finally {
        setLoading(false);
      }
      return;
    }

    // Live Secure Razorpay Server-Side Flow
    try {
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error("Razorpay script library failed to load");
      }

      // 1. Create order on server side
      const createOrderFn = httpsCallable(functions, 'createRazorpayOrder');
      const rzpOrderResponse = await createOrderFn({ amount: cartTotal });
      const rzpOrder = rzpOrderResponse.data;

      // 2. Configure payment options
      const options = {
        key: razorpayKey,
        amount: rzpOrder.amount,
        currency: rzpOrder.currency,
        name: "Kashid Snacks",
        description: `Snack Box Order ${orderId}`,
        order_id: rzpOrder.id,
        prefill: {
          name: name,
          contact: phone,
          email: currentUser ? currentUser.email : "customer@kashidsnacks.com"
        },
        theme: {
          color: "#ff7a1a"
        },
        handler: async function (response) {
          setLoading(true);
          try {
            // 3. Cryptographically verify signature server side
            const verifyPaymentFn = httpsCallable(functions, 'verifyRazorpayPayment');
            await verifyPaymentFn({
              orderId: orderId,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature
            });

            // 4. Save confirmed order data to database
            const verifiedOrder = {
              ...finalOrder,
              paymentId: response.razorpay_payment_id,
              paymentStatus: 'Completed',
              status: 'Order Placed',
              timeline: [
                { status: 'Order Placed', time: new Date().toISOString(), note: 'Order successfully verified.' }
              ]
            };

            await setDoc(doc(db, 'orders', orderId), verifiedOrder);

            // Add notification
            const notificationList = JSON.parse(localStorage.getItem('kashid_notifications') || '[]');
            notificationList.unshift({
              id: Date.now(),
              title: `Order ${orderId} Placed!`,
              message: `Payment successful! Kashi is preparing your box of spiced snacks.`,
              type: 'shipping',
              time: 'Just now',
              read: false
            });
            localStorage.setItem('kashid_notifications', JSON.stringify(notificationList));

            clearCart();
            navigate(`/order-success?orderId=${orderId}`);
          } catch (err) {
            setError("Payment verification failed: " + err.message);
          } finally {
            setLoading(false);
          }
        },
        modal: {
          ondismiss: function () {
            setLoading(false);
            setError("Payment overlay closed by user.");
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      setError("Secure payment setup failed: " + err.message);
      setLoading(false);
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className="max-w-xl mx-auto px-6 py-20 text-center flex flex-col items-center justify-center">
        <div className="w-20 h-20 rounded-full bg-saffron-light/10 flex items-center justify-center text-saffron mb-6">
          <Truck className="w-10 h-10" />
        </div>
        <h2 className="font-heading font-extrabold text-2xl text-charcoal">Your Snack Bag is Empty</h2>
        <p className="text-sm text-charcoal/60 mt-2 max-w-sm">Add some delicious snacks to your bag before checking out.</p>
        <Link 
          to="/shop" 
          className="bg-saffron hover:bg-saffron-dark text-white font-heading font-bold px-8 py-3.5 rounded-full mt-6 shadow-md inline-block text-sm transition-colors"
        >
          Go Shop Snacks
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-6 relative">
      <div className="mb-8">
        <h1 className="font-heading font-extrabold text-3xl text-charcoal">Secure Checkout</h1>
        <p className="text-xs text-charcoal/60 mt-1">Complete your shipping & payment details</p>
      </div>

      {error && (
        <div className="bg-maroon-light/20 border border-maroon-light/40 text-maroon text-xs rounded-xl p-3 mb-6">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start relative z-10">
        {/* SHIPPING FORM - LEFT (7 Columns) */}
        <form onSubmit={handlePlaceOrder} className="lg:col-span-7 space-y-6">
          {/* Shipping Address Card */}
          <div className="glass-panel p-6 rounded-3xl bg-white/40 border-white/60">
            <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-saffron" />
                <h2 className="font-heading font-bold text-lg text-charcoal">Delivery Address</h2>
              </div>
              <button
                type="button"
                onClick={handleGetLiveLocation}
                className="bg-maroon hover:bg-maroon-dark text-white font-heading font-bold text-[10px] px-3.5 py-1.5 rounded-full shadow-sm flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <MapPin className="w-3.5 h-3.5" /> Detect Live Location
              </button>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-[10px] font-bold text-charcoal/60 uppercase mb-1.5 ml-1">Contact Name</label>
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Amit Sharma"
                  className="w-full glass-input rounded-full py-2.5 px-4 text-sm"
                  required
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[10px] font-bold text-charcoal/60 uppercase mb-1.5 ml-1">Street Address</label>
                <input 
                  type="text" 
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Flat / House No, Street, Landmark"
                  className="w-full glass-input rounded-full py-2.5 px-4 text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-charcoal/60 uppercase mb-1.5 ml-1">City</label>
                <input 
                  type="text" 
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Mumbai"
                  className="w-full glass-input rounded-full py-2.5 px-4 text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-charcoal/60 uppercase mb-1.5 ml-1">State</label>
                <input 
                  type="text" 
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  placeholder="Maharashtra"
                  className="w-full glass-input rounded-full py-2.5 px-4 text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-charcoal/60 uppercase mb-1.5 ml-1">Pincode</label>
                <input 
                  type="text" 
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value)}
                  placeholder="400053"
                  maxLength={6}
                  className="w-full glass-input rounded-full py-2.5 px-4 text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-charcoal/60 uppercase mb-1.5 ml-1">Phone Number</label>
                <input 
                  type="tel" 
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="9876543210"
                  className="w-full glass-input rounded-full py-2.5 px-4 text-sm"
                  required
                />
              </div>
            </div>
          </div>

          {/* Payment Method Card */}
          <div className="glass-panel p-6 rounded-3xl bg-white/40 border-white/60">
            <div className="flex items-center gap-2 mb-6">
              <CreditCard className="w-5 h-5 text-maroon" />
              <h2 className="font-heading font-bold text-lg text-charcoal">Select Payment Method</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {['UPI', 'Card', 'COD'].map((method) => (
                <label 
                  key={method}
                  className={`flex flex-col items-center justify-center p-4 rounded-2xl border cursor-pointer transition-all relative ${
                    paymentMethod === method 
                      ? 'bg-saffron/10 border-saffron text-saffron-dark shadow-sm' 
                      : 'glass-card border-saffron-light/20 text-charcoal/70'
                  }`}
                >
                  <input 
                    type="radio" 
                    name="payment" 
                    value={method} 
                    checked={paymentMethod === method}
                    onChange={() => setPaymentMethod(method)}
                    className="sr-only"
                  />
                  <span className="font-heading font-bold text-sm">{method === 'COD' ? 'Cash On Delivery' : method}</span>
                  <span className="text-[10px] text-charcoal/50 mt-1">
                    {method === 'UPI' && 'GooglePay / Paytm'}
                    {method === 'Card' && 'Debit or Credit'}
                    {method === 'COD' && 'Pay at your door'}
                  </span>
                  {paymentMethod === method && (
                    <CheckCircle className="absolute top-2 right-2 w-4 h-4 text-saffron" />
                  )}
                </label>
              ))}
            </div>

            {/* Inline Secure Payment details */}
            {paymentMethod === 'UPI' && (
              <div className="mt-4 p-4 rounded-2xl bg-saffron-light/10 border border-saffron-light/20 space-y-2">
                <label className="block text-[10px] font-bold text-charcoal/60 uppercase ml-1">UPI Address (VPA)</label>
                <input 
                  type="text" 
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  placeholder="e.g. name@upi"
                  className="w-full glass-input rounded-full py-2.5 px-4 text-xs font-semibold"
                  required
                />
              </div>
            )}

            {paymentMethod === 'Card' && (
              <div className="mt-4 p-4 rounded-2xl bg-saffron-light/10 border border-saffron-light/20 space-y-3">
                <div>
                  <label className="block text-[10px] font-bold text-charcoal/60 uppercase ml-1 mb-1">Card Number</label>
                  <input 
                    type="text" 
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value.replace(/\s?/g, '').replace(/(\d{4})/g, '$1 ').trim().substring(0, 19))}
                    placeholder="1234 5678 1234 5678"
                    className="w-full glass-input rounded-full py-2.5 px-4 text-xs font-mono font-semibold"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-charcoal/60 uppercase ml-1 mb-1">Expiry Date</label>
                    <input 
                      type="text" 
                      value={cardExpiry}
                      onChange={(e) => {
                        let val = e.target.value.replace(/\D/g, '');
                        if (val.length > 2) val = val.substring(0, 2) + '/' + val.substring(2, 4);
                        setCardExpiry(val.substring(0, 5));
                      }}
                      placeholder="MM/YY"
                      className="w-full glass-input rounded-full py-2.5 px-4 text-xs font-semibold"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-charcoal/60 uppercase ml-1 mb-1">CVV</label>
                    <input 
                      type="password" 
                      value={cardCvv}
                      onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, '').substring(0, 3))}
                      placeholder="***"
                      className="w-full glass-input rounded-full py-2.5 px-4 text-xs font-mono text-center font-semibold"
                      required
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-gradient-to-r from-saffron to-saffron-dark hover:from-saffron-dark hover:to-maroon text-white font-heading font-bold py-4 rounded-full shadow-md flex items-center justify-center gap-2 text-sm transition-all"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                Place Order (₹{cartTotal})
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* ORDER REVIEW - RIGHT (5 Columns) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          {/* Order Summary */}
          <div className="glass-panel p-6 rounded-3xl bg-white/40 border-white/60 flex flex-col gap-4">
            <h2 className="font-heading font-bold text-lg text-charcoal border-b border-saffron-light/20 pb-3">Order Review</h2>
            
            {/* Items scroll */}
            <div className="max-h-60 overflow-y-auto space-y-3.5 pr-2">
              {cartItems.map((item) => (
                <div key={`${item.id}-${item.weight}`} className="flex items-center gap-3 text-xs">
                  <img src={item.image} alt={item.name} className="w-12 h-12 object-cover rounded-lg border border-saffron-light/20" />
                  <div className="flex-grow min-w-0">
                    <h4 className="font-semibold text-charcoal truncate">{item.name}</h4>
                    <p className="text-[10px] text-charcoal/50 mt-0.5">{item.weight} x {item.quantity}</p>
                  </div>
                  <span className="font-bold text-charcoal">₹{item.price * item.quantity}</span>
                </div>
              ))}
            </div>

            {/* Coupons Input Form */}
            <div className="border-t border-saffron-light/20 pt-4 mt-2">
              <form onSubmit={handlePromoSubmit} className="flex gap-2">
                <input 
                  type="text" 
                  value={promoInput}
                  onChange={(e) => setPromoInput(e.target.value)}
                  placeholder="Enter Promo Code"
                  className="flex-grow glass-input rounded-full px-4 py-2 text-xs"
                />
                <button 
                  type="submit"
                  className="bg-maroon hover:bg-maroon-dark text-white font-heading font-bold text-xs px-4 py-2 rounded-full shadow-sm transition-colors"
                >
                  Apply
                </button>
              </form>
              {promoError && <p className="text-[10px] text-maroon font-semibold mt-1.5 ml-1">{promoError}</p>}
              {promoCode && (
                <div className="flex justify-between items-center bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs px-3 py-1.5 rounded-full mt-3">
                  <span className="flex items-center gap-1.5 font-semibold">
                    <Tag className="w-3.5 h-3.5" /> {promoCode.code} Applied!
                  </span>
                  <button type="button" onClick={removePromoCode} className="text-[10px] font-bold text-maroon hover:underline">Remove</button>
                </div>
              )}
            </div>

            {/* Pricing breakdown */}
            <div className="border-t border-saffron-light/20 pt-4 flex flex-col gap-2.5 text-xs">
              <div className="flex justify-between text-charcoal/60">
                <span>Subtotal</span>
                <span className="font-semibold text-charcoal">₹{cartSubtotal}</span>
              </div>
              <div className="flex justify-between text-charcoal/60">
                <span>Delivery Charges</span>
                <span className="font-semibold text-emerald-600">FREE</span>
              </div>
              {promoCode && (
                <div className="flex justify-between text-emerald-600 font-semibold">
                  <span>Coupon Discount</span>
                  <span>-₹{discount}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-bold text-charcoal pt-3 border-t border-dashed border-saffron-light/20">
                <span>Total Payable</span>
                <span className="text-maroon text-base">₹{cartTotal}</span>
              </div>
            </div>
          </div>

          {/* Secure Trust Badge */}
          <div className="glass-panel p-4 rounded-2xl bg-white/40 border-white/60 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-saffron-light/20 flex items-center justify-center text-saffron shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-charcoal uppercase">100% Secured Payments</h4>
              <p className="text-[10px] text-charcoal/50 leading-tight">All transactions are encrypted and processed by PCI-compliant gates.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
