import React, { useState, useEffect } from 'react';
import { PRODUCTS, MOCK_ORDERS } from '../../utils/mockData';
import { IndianRupee, ShoppingCart, UserCheck, AlertTriangle, ArrowUpRight, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { collection, getDocs } from 'firebase/firestore';
import { db, isFirebaseMock } from '../../config/firebase';

export default function Dashboard() {
  const [stats, setStats] = useState({
    revenue: 0,
    ordersCount: 0,
    customersCount: 0,
    lowStockCount: 0
  });

  const [recentOrders, setRecentOrders] = useState([]);
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [chartPath, setChartPath] = useState('');
  const [chartAreaPath, setChartAreaPath] = useState('');
  const [maxChartVal, setMaxChartVal] = useState(1000);

  useEffect(() => {
    const fetchDashboardData = async () => {
      let allOrders = [];
      let allProducts = [];
      let usersCount = 0;

      if (isFirebaseMock) {
        const dbOrders = JSON.parse(localStorage.getItem('mock_orders_db') || '[]');
        allOrders = [...dbOrders, ...MOCK_ORDERS];

        const dbProducts = JSON.parse(localStorage.getItem('mock_products_db') || '[]');
        allProducts = dbProducts.length > 0 ? dbProducts : PRODUCTS;
        usersCount = 12;
      } else {
        try {
          // Fetch live orders from Firestore (no fallback)
          const ordersSnapshot = await getDocs(collection(db, 'orders'));
          const ordersList = [];
          ordersSnapshot.forEach((doc) => {
            ordersList.push(doc.data());
          });
          allOrders = ordersList;

          // Fetch live products from Firestore (no fallback)
          const productsSnapshot = await getDocs(collection(db, 'products'));
          const productsList = [];
          productsSnapshot.forEach((doc) => {
            productsList.push(doc.data());
          });
          allProducts = productsList;

          // Fetch live registered customers count from users collection
          const usersSnapshot = await getDocs(collection(db, 'users'));
          usersCount = usersSnapshot.size;
        } catch (error) {
          console.error("Error loading dashboard data from firestore:", error);
        }
      }

      // Sort orders by date descending
      allOrders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setRecentOrders(allOrders.slice(0, 5));

      // Calculate Gross Revenue
      const rev = allOrders.reduce((total, order) => total + order.total, 0);

      // Check low stock items (stock <= 10)
      const lowStock = [];
      allProducts.forEach(p => {
        if (p.variants && p.variants.length > 0) {
          p.variants.forEach(v => {
            if (v.stock <= 10) {
              lowStock.push({ name: `${p.name} (${v.weight})`, stock: v.stock });
            }
          });
        } else if (p.stock <= 10) {
          lowStock.push({ name: p.name, stock: p.stock });
        }
      });

      // Calculate revenue over the last 7 days (Mon-Sun)
      const dayRevenues = [0, 0, 0, 0, 0, 0, 0];
      const now = new Date();
      allOrders.forEach(order => {
        const orderDate = new Date(order.createdAt);
        const diffTime = Math.abs(now - orderDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays <= 7) {
          const dayIndex = orderDate.getDay(); // 0 is Sunday, 1 is Monday ... 6 is Saturday
          const index = dayIndex === 0 ? 6 : dayIndex - 1; // Map to Mon(0)...Sun(6)
          dayRevenues[index] += order.total;
        }
      });

      const maxVal = Math.max(...dayRevenues, 500);
      setMaxChartVal(maxVal);

      // Generate points for SVG chart (Width: 500, Height: 180)
      const points = dayRevenues.map((revVal, idx) => {
        const x = 10 + idx * 80;
        const y = 150 - (revVal / maxVal) * 120; // range [30, 150]
        return { x, y };
      });

      if (points.length > 0) {
        let pLine = `M ${points[0].x} ${points[0].y}`;
        for (let i = 1; i < points.length; i++) {
          pLine += ` L ${points[i].x} ${points[i].y}`;
        }
        setChartPath(pLine);
        setChartAreaPath(`${pLine} L ${points[6].x} 180 L ${points[0].x} 180 Z`);
      }

      setLowStockProducts(lowStock);
      setStats({
        revenue: rev,
        ordersCount: allOrders.length,
        customersCount: usersCount,
        lowStockCount: lowStock.length
      });
    };

    fetchDashboardData();
  }, []);

  return (
    <div className="space-y-6 relative z-10">
      {/* STATS WIDGETS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Revenue */}
        <div className="glass-panel p-5 rounded-3xl bg-white/40 border-white/60 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-saffron/15 text-saffron flex items-center justify-center shadow-sm">
            <IndianRupee className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] text-charcoal/50 font-bold uppercase tracking-wider block">Gross Revenue</span>
            <span className="font-heading font-extrabold text-2xl text-charcoal">₹{stats.revenue}</span>
            <span className="text-[8px] text-emerald-600 font-bold flex items-center gap-0.5 mt-0.5"><TrendingUp className="w-3 h-3" /> +14.2% this week</span>
          </div>
        </div>

        {/* Orders */}
        <div className="glass-panel p-5 rounded-3xl bg-white/40 border-white/60 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-maroon/10 text-maroon flex items-center justify-center shadow-sm">
            <ShoppingCart className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] text-charcoal/50 font-bold uppercase tracking-wider block">Total Orders</span>
            <span className="font-heading font-extrabold text-2xl text-charcoal">{stats.ordersCount}</span>
            <span className="text-[8px] text-emerald-600 font-bold flex items-center gap-0.5 mt-0.5"><TrendingUp className="w-3 h-3" /> +6.5% vs yesterday</span>
          </div>
        </div>

        {/* Customers */}
        <div className="glass-panel p-5 rounded-3xl bg-white/40 border-white/60 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-turmeric/15 text-turmeric-dark flex items-center justify-center shadow-sm">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] text-charcoal/50 font-bold uppercase tracking-wider block">Active Customers</span>
            <span className="font-heading font-extrabold text-2xl text-charcoal">{stats.customersCount}</span>
            <span className="text-[8px] text-charcoal/40 font-semibold block mt-0.5">Registered Customers</span>
          </div>
        </div>

        {/* Stock Alerts */}
        <div className={`glass-panel p-5 rounded-3xl border-white/60 flex items-center gap-4 ${stats.lowStockCount > 0 ? 'bg-maroon-light/10 border-maroon-light/30' : 'bg-white/40'}`}>
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm ${stats.lowStockCount > 0 ? 'bg-maroon/15 text-maroon' : 'bg-charcoal/10 text-charcoal/60'}`}>
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] text-charcoal/50 font-bold uppercase tracking-wider block">Low Stock Alerts</span>
            <span className={`font-heading font-extrabold text-2xl ${stats.lowStockCount > 0 ? 'text-maroon' : 'text-charcoal'}`}>{stats.lowStockCount}</span>
            <span className="text-[8px] text-charcoal/40 font-semibold block mt-0.5">Need restock soon</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* SALES TREND CHART - LEFT (7 Columns) */}
        <div className="lg:col-span-7 glass-panel p-6 rounded-3xl bg-white/40 border-white/60 flex flex-col gap-6">
          <div className="flex justify-between items-center border-b border-saffron-light/10 pb-3">
            <h3 className="font-heading font-bold text-base text-charcoal">Revenue Analytics</h3>
            <span className="text-[10px] font-bold text-saffron uppercase tracking-widest bg-saffron-light/20 px-2.5 py-1 rounded-full">Weekly Trend</span>
          </div>
          
          {/* Glassmorphic SVG Sparkline Chart */}
          <div className="h-60 relative w-full flex items-end">
            <svg viewBox="0 0 500 180" className="w-full h-full text-saffron shrink-0">
              <defs>
                <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ff7a1a" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#ff7a1a" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              {/* Gridlines */}
              <line x1="0" y1="30" x2="500" y2="30" stroke="rgba(255, 122, 26, 0.1)" strokeDasharray="5" />
              <line x1="0" y1="90" x2="500" y2="90" stroke="rgba(255, 122, 26, 0.1)" strokeDasharray="5" />
              <line x1="0" y1="150" x2="500" y2="150" stroke="rgba(255, 122, 26, 0.1)" strokeDasharray="5" />
              
              {/* Curve area */}
              {chartAreaPath && (
                <path 
                  d={chartAreaPath} 
                  fill="url(#chartGrad)" 
                />
              )}
              {/* Curve line */}
              {chartPath && (
                <path 
                  d={chartPath} 
                  fill="none" 
                  stroke="#ff7a1a" 
                  strokeWidth="4" 
                />
              )}
            </svg>
            <div className="absolute top-2 left-2 text-[10px] font-bold text-charcoal/40">₹{maxChartVal.toLocaleString()}</div>
            <div className="absolute bottom-6 left-2 text-[10px] font-bold text-charcoal/40">₹0</div>
          </div>

          <div className="flex justify-between text-[10px] text-charcoal/50 font-bold px-2">
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
            <span>Sun</span>
          </div>
        </div>

        {/* STOCK WARNINGS - RIGHT (5 Columns) */}
        <div className="lg:col-span-5 glass-panel p-6 rounded-3xl bg-white/40 border-white/60 flex flex-col">
          <h3 className="font-heading font-bold text-base text-charcoal border-b border-saffron-light/10 pb-3 mb-4">Stock Attention</h3>
          
          {lowStockProducts.length === 0 ? (
            <div className="flex-grow flex items-center justify-center text-center py-10">
              <p className="text-xs text-charcoal/40">All products are healthy and well-stocked.</p>
            </div>
          ) : (
            <div className="space-y-3.5 overflow-y-auto max-h-64 pr-2">
              {lowStockProducts.map((p, idx) => (
                <div key={idx} className="flex justify-between items-center bg-white/40 border border-saffron-light/10 p-3 rounded-xl">
                  <span className="text-xs font-semibold text-charcoal truncate max-w-[200px]">{p.name}</span>
                  <span className="bg-maroon-light/25 border border-maroon-light/50 text-maroon text-[10px] font-extrabold px-2.5 py-0.5 rounded-full">
                    {p.stock} units left
                  </span>
                </div>
              ))}
            </div>
          )}

          <Link 
            to="/admin/products" 
            className="w-full bg-cream-container hover:bg-cream-highest border border-charcoal/10 text-charcoal font-heading font-bold py-2.5 rounded-full text-center text-xs flex items-center justify-center gap-1.5 mt-auto transition-colors"
          >
            Manage Stock <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* RECENT ORDERS LIST TABLE */}
      <div className="glass-panel p-6 rounded-3xl bg-white/40 border-white/60">
        <div className="flex justify-between items-center border-b border-saffron-light/10 pb-3 mb-6">
          <h3 className="font-heading font-bold text-base text-charcoal">Recent Customer Checkouts</h3>
          <Link to="/admin/orders" className="text-xs font-bold text-saffron hover:underline">View All Orders →</Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-saffron-light/20 text-charcoal/40 uppercase font-bold tracking-wider">
                <th className="pb-3 pl-3">Order ID</th>
                <th className="pb-3">Customer</th>
                <th className="pb-3">Items</th>
                <th className="pb-3">Amount</th>
                <th className="pb-3">Status</th>
                <th className="pb-3 pr-3 text-right">Details</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((order) => (
                <tr key={order.id} className="border-b border-saffron-light/10 hover:bg-white/30 transition-colors">
                  <td className="py-3.5 pl-3 font-bold text-charcoal">{order.id}</td>
                  <td className="py-3.5">
                    <p className="font-semibold text-charcoal">{order.customerName}</p>
                    <p className="text-[10px] text-charcoal/50 font-medium">{order.customerEmail}</p>
                  </td>
                  <td className="py-3.5 font-medium text-charcoal/70 truncate max-w-[200px]">
                    {order.items.map(i => `${i.name} (${i.weight})`).join(', ')}
                  </td>
                  <td className="py-3.5 font-heading font-bold text-maroon">₹{order.total}</td>
                  <td className="py-3.5">
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                      order.status === 'Delivered' ? 'bg-emerald-100 text-emerald-800' : 'bg-saffron-light/35 text-saffron-dark'
                    }`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="py-3.5 pr-3 text-right">
                    <Link 
                      to={`/admin/orders?orderId=${order.id}`}
                      className="text-saffron hover:underline font-bold"
                    >
                      Inspect
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
