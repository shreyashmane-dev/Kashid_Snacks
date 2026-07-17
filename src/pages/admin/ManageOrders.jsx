import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { MOCK_ORDERS } from '../../utils/mockData';
import { Receipt, Search, ChevronRight, X, Clock, MapPin, Edit, Truck, ShieldAlert } from 'lucide-react';
import { doc, getDocs, updateDoc, collection } from 'firebase/firestore';
import { db, isFirebaseMock } from '../../config/firebase';

export default function ManageOrders() {
  const [searchParams] = useSearchParams();
  const directOrderId = searchParams.get('orderId');

  const [orders, setOrders] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  
  // Update status form states
  const [statusVal, setStatusVal] = useState('Order Placed');
  const [statusNote, setStatusNote] = useState('');

  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    loadOrders();
  }, []);

  useEffect(() => {
    if (directOrderId && orders.length > 0) {
      const found = orders.find(o => o.id === directOrderId);
      if (found) {
        setSelectedOrder(found);
        setStatusVal(found.status);
      }
    }
  }, [directOrderId, orders]);

  const loadOrders = async () => {
    if (isFirebaseMock) {
      const dbOrders = JSON.parse(localStorage.getItem('mock_orders_db') || '[]');
      setOrders(dbOrders.length > 0 ? dbOrders : MOCK_ORDERS);
    } else {
      try {
        const querySnapshot = await getDocs(collection(db, 'orders'));
        const list = [];
        querySnapshot.forEach((doc) => {
          list.push(doc.data());
        });
        setOrders(list.length > 0 ? list : MOCK_ORDERS);
      } catch (error) {
        console.error("Error fetching firestore orders:", error);
      }
    }
  };

  const handleOpenInspector = (order) => {
    setSelectedOrder(order);
    setStatusVal(order.status);
    setStatusNote('');
  };

  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    if (!selectedOrder) return;

    try {
      setUpdating(true);
      const newTimelineEvent = {
        status: statusVal,
        time: new Date().toISOString(),
        note: statusNote || `Status updated to ${statusVal}.`
      };

      const updatedTimeline = [...selectedOrder.timeline, newTimelineEvent];
      const updatedOrder = {
        ...selectedOrder,
        status: statusVal,
        timeline: updatedTimeline
      };

      if (isFirebaseMock) {
        const dbOrders = JSON.parse(localStorage.getItem('mock_orders_db') || '[]');
        const listToFilter = dbOrders.length > 0 ? dbOrders : MOCK_ORDERS;
        const updatedList = listToFilter.map(o => o.id === selectedOrder.id ? updatedOrder : o);
        localStorage.setItem('mock_orders_db', JSON.stringify(updatedList));
        
        // Also update individual user orders list
        const userOrders = JSON.parse(localStorage.getItem('mock_user_orders') || '{}');
        if (userOrders[selectedOrder.userId]) {
          userOrders[selectedOrder.userId] = userOrders[selectedOrder.userId].map(o => o.id === selectedOrder.id ? updatedOrder : o);
          localStorage.setItem('mock_user_orders', JSON.stringify(userOrders));
        }
      } else {
        await updateDoc(doc(db, 'orders', selectedOrder.id), {
          status: statusVal,
          timeline: updatedTimeline
        });
      }

      setSelectedOrder(updatedOrder);
      setStatusNote('');
      loadOrders();
    } catch (err) {
      console.error("Failed to update status:", err);
    } finally {
      setUpdating(false);
    }
  };

  const printInvoice = () => {
    window.print();
  };

  const filtered = orders.filter(o => 
    o.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    o.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    o.status.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const exportOrdersCSV = () => {
    if (orders.length === 0) return;
    
    const headers = ["Order ID", "Customer Name", "Customer Email", "Subtotal", "Discount", "Total", "Payment Method", "Status", "Date"];
    const rows = orders.map(o => [
      o.id,
      o.customerName,
      o.customerEmail,
      o.subtotal,
      o.discount,
      o.total,
      o.paymentMethod,
      o.status,
      o.createdAt ? new Date(o.createdAt).toLocaleDateString() : ''
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(","))].join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `kashid_orders_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 relative z-10">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div className="relative w-full max-w-xs">
          <input 
            type="text" 
            placeholder="Search Order ID, Client, Status..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full glass-input rounded-full py-2.5 pl-10 pr-4 text-xs font-semibold"
          />
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal/40" />
        </div>
        <button 
          onClick={exportOrdersCSV}
          className="bg-saffron hover:bg-saffron-dark text-white font-heading font-bold text-xs px-5 py-2.5 rounded-full shadow-sm flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          Export Orders CSV
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* ORDERS TABLE LIST - LEFT (7 Columns) */}
        <div className="lg:col-span-7 glass-panel p-6 rounded-3xl bg-white/40 border-white/60">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-saffron-light/20 text-charcoal/40 uppercase font-bold tracking-wider">
                  <th className="pb-3 pl-3">Order ID</th>
                  <th className="pb-3">Client</th>
                  <th className="pb-3">Total Payable</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3 pr-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((order) => (
                  <tr key={order.id} className="border-b border-saffron-light/10 hover:bg-white/30 transition-colors">
                    <td className="py-3.5 pl-3 font-bold text-charcoal">{order.id}</td>
                    <td className="py-3.5">
                      <p className="font-semibold text-charcoal">{order.customerName}</p>
                      <p className="text-[10px] text-charcoal/50 font-medium">{new Date(order.createdAt).toLocaleDateString()}</p>
                    </td>
                    <td className="py-3.5 font-heading font-extrabold text-maroon">₹{order.total}</td>
                    <td className="py-3.5">
                      <span className={`text-[9px] font-bold px-2.5 py-0.5 rounded-full ${
                        order.status === 'Delivered' ? 'bg-emerald-100 text-emerald-800' : 'bg-saffron-light/35 text-saffron-dark'
                      }`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="py-3.5 pr-3 text-right">
                      <button 
                        onClick={() => handleOpenInspector(order)}
                        className="text-saffron hover:underline font-bold flex items-center justify-end gap-1 w-full"
                      >
                        Inspect <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ORDER DETAILS INSPECTOR - RIGHT (5 Columns) */}
        <div className="lg:col-span-5">
          {!selectedOrder ? (
            <div className="glass-panel p-8 rounded-3xl bg-white/40 border-white/60 text-center py-20 flex flex-col items-center">
              <div className="w-14 h-14 bg-saffron-light/20 text-saffron rounded-full flex items-center justify-center mb-4">
                <Receipt className="w-7 h-7" />
              </div>
              <p className="font-heading font-bold text-charcoal">No Order Selected</p>
              <p className="text-xs text-charcoal/50 mt-1 max-w-[200px] mx-auto">Select an order from the list to update its status or print invoices.</p>
            </div>
          ) : (
            <div id="printable-area" className="glass-panel p-6 rounded-3xl bg-white/40 border-white/60 space-y-6 relative overflow-hidden">
              <div className="flex justify-between items-center border-b border-saffron-light/20 pb-3">
                <div>
                  <h3 className="font-heading font-extrabold text-base text-charcoal">{selectedOrder.id}</h3>
                  <span className="text-[9px] text-charcoal/40 font-mono">Date: {new Date(selectedOrder.createdAt).toLocaleString()}</span>
                </div>
                <button onClick={() => setSelectedOrder(null)} className="p-1 rounded-full hover:bg-saffron-light/20 print:hidden">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Client Info */}
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <h4 className="font-bold text-charcoal/60 uppercase text-[9px] flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-saffron" /> Shipping Address</h4>
                  <p className="font-bold text-charcoal mt-1.5">{selectedOrder.shippingAddress.fullName}</p>
                  <p className="text-charcoal/70 leading-normal mt-0.5">
                    {selectedOrder.shippingAddress.addressLine}, <br />
                    {selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state} - {selectedOrder.shippingAddress.pincode}
                  </p>
                  <p className="text-charcoal/50 mt-1">Phone: {selectedOrder.shippingAddress.phone}</p>
                </div>
                <div>
                  <h4 className="font-bold text-charcoal/60 uppercase text-[9px] flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-maroon" /> Payment Info</h4>
                  <p className="text-charcoal/70 mt-1.5">Method: {selectedOrder.paymentMethod}</p>
                  <p className="text-charcoal/70">Subtotal: ₹{selectedOrder.subtotal}</p>
                  {selectedOrder.discount > 0 && <p className="text-emerald-600 font-semibold">Discount: -₹{selectedOrder.discount}</p>}
                  <p className="font-bold text-maroon text-sm mt-1">Total Paid: ₹{selectedOrder.total}</p>
                </div>
              </div>

              {/* Items Purchased */}
              <div className="border-t border-saffron-light/20 pt-4 text-xs">
                <h4 className="font-bold text-charcoal/60 uppercase text-[9px] mb-2.5">Items Purchased</h4>
                <div className="space-y-2.5">
                  {selectedOrder.items.map((item) => (
                    <div key={`${item.id}-${item.weight}`} className="flex justify-between items-center">
                      <span className="font-semibold text-charcoal truncate max-w-[180px]">{item.name} ({item.weight}) x {item.quantity}</span>
                      <span className="font-bold text-charcoal">₹{item.price * item.quantity}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* UPDATE STATUS TIMELINE - print:hidden */}
              <div className="border-t border-saffron-light/20 pt-4 print:hidden">
                <h4 className="font-bold text-charcoal/60 uppercase text-[9px] mb-3 flex items-center gap-1"><Edit className="w-3.5 h-3.5 text-saffron" /> Update Status</h4>
                <form onSubmit={handleUpdateStatus} className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <select 
                      value={statusVal} 
                      onChange={e => setStatusVal(e.target.value)}
                      className="w-full glass-input rounded-full py-2 px-3 text-xs font-semibold cursor-pointer"
                    >
                      <option value="Order Placed">Order Placed</option>
                      <option value="Confirmed">Confirmed</option>
                      <option value="Shipped">Shipped</option>
                      <option value="Delivered">Delivered</option>
                    </select>
                    
                    <input 
                      type="text" 
                      placeholder="Timeline Note (optional)" 
                      value={statusNote}
                      onChange={e => setStatusNote(e.target.value)}
                      className="w-full glass-input rounded-full py-2 px-3.5 text-xs"
                    />
                  </div>
                  
                  <button 
                    type="submit" 
                    disabled={updating}
                    className="w-full bg-maroon hover:bg-maroon-dark text-white font-heading font-bold text-xs py-2 rounded-full shadow-sm transition-colors"
                  >
                    {updating ? "Updating..." : "Update Status Timeline"}
                  </button>
                </form>
              </div>

              {/* Print Action */}
              <div className="flex gap-2 pt-2 border-t border-saffron-light/10 print:hidden">
                <button 
                  onClick={printInvoice}
                  className="flex-1 bg-cream-container hover:bg-cream-highest text-charcoal font-heading font-bold py-2 rounded-full border border-charcoal/10 text-xs flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Receipt className="w-3.5 h-3.5" /> Print Receipt
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
