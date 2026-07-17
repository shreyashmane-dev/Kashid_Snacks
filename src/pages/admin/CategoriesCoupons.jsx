import React, { useState, useEffect } from 'react';
import { CATEGORIES, MOCK_COUPONS_LIST } from '../../utils/mockData';
import { Tag, Plus, Trash2, CheckCircle2, XCircle, Grid } from 'lucide-react';
import { doc, getDocs, setDoc, deleteDoc, collection } from 'firebase/firestore';
import { db, isFirebaseMock } from '../../config/firebase';

export default function CategoriesCoupons() {
  const [categories, setCategories] = useState([]);
  const [coupons, setCoupons] = useState([]);

  // Category Form
  const [catName, setCatName] = useState('');
  const [catImage, setCatImage] = useState('');
  
  // Coupon Form
  const [coupCode, setCoupCode] = useState('');
  const [coupType, setCoupType] = useState('Percentage');
  const [coupVal, setCoupVal] = useState(10);
  const [coupMin, setCoupMin] = useState(100);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    if (isFirebaseMock) {
      // Categories
      const dbCats = JSON.parse(localStorage.getItem('mock_categories_db') || '[]');
      setCategories(dbCats.length > 0 ? dbCats : CATEGORIES);

      // Coupons
      const dbCoups = JSON.parse(localStorage.getItem('mock_coupons_db') || '[]');
      setCoupons(dbCoups.length > 0 ? dbCoups : MOCK_COUPONS_LIST);
    } else {
      // Live Firebase fetching
      try {
        const catSnap = await getDocs(collection(db, 'categories'));
        const cats = [];
        catSnap.forEach(doc => cats.push(doc.data()));
        setCategories(cats.length > 0 ? cats : CATEGORIES);

        const coupSnap = await getDocs(collection(db, 'coupons'));
        const coups = [];
        coupSnap.forEach(doc => coups.push(doc.data()));
        setCoupons(coups.length > 0 ? coups : MOCK_COUPONS_LIST);
      } catch (error) {
        console.error("Error loading categories/coupons:", error);
      }
    }
  };

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    if (!catName) return setError("Please fill category name");
    
    setError('');
    const id = catName.toLowerCase().replace(/\s+/g, '-');
    const newCat = {
      id,
      name: catName,
      image: catImage || 'https://images.unsplash.com/photo-1589476993333-f55b84301219?w=300&q=80',
      count: 0
    };

    const updated = [...categories, newCat];
    setCategories(updated);

    if (isFirebaseMock) {
      localStorage.setItem('mock_categories_db', JSON.stringify(updated));
    } else {
      await setDoc(doc(db, 'categories', id), newCat);
    }

    setCatName('');
    setCatImage('');
    setSuccess("Category created successfully!");
    setTimeout(() => setSuccess(''), 3000);
  };

  const handleCreateCoupon = async (e) => {
    e.preventDefault();
    if (!coupCode) return setError("Please fill in Coupon Code");

    setError('');
    const newCoup = {
      code: coupCode.toUpperCase(),
      type: coupType === 'Percentage' ? 'percentage' : 'fixed',
      value: Number(coupVal),
      minAmount: Number(coupMin),
      active: true
    };

    const updated = [newCoup, ...coupons];
    setCoupons(updated);

    if (isFirebaseMock) {
      localStorage.setItem('mock_coupons_db', JSON.stringify(updated));
      
      // Update coupons in CartContext mock coupons database as well
      const userCartsMockCoupons = JSON.parse(localStorage.getItem('mock_user_carts_coupons') || '[]');
      userCartsMockCoupons.push(newCoup);
      localStorage.setItem('mock_user_carts_coupons', JSON.stringify(userCartsMockCoupons));
    } else {
      await setDoc(doc(db, 'coupons', newCoup.code), newCoup);
    }

    setCoupCode('');
    setSuccess("Coupon code generated!");
    setTimeout(() => setSuccess(''), 3000);
  };

  const handleToggleCoupon = async (code) => {
    const updated = coupons.map(c => {
      if (c.code === code) return { ...c, active: !c.active };
      return c;
    });
    setCoupons(updated);

    if (isFirebaseMock) {
      localStorage.setItem('mock_coupons_db', JSON.stringify(updated));
    } else {
      const current = coupons.find(c => c.code === code);
      await setDoc(doc(db, 'coupons', code), { ...current, active: !current.active }, { merge: true });
    }
  };

  const handleDeleteCategory = async (catId) => {
    if (!window.confirm("Delete this category?")) return;
    const updated = categories.filter(c => c.id !== catId);
    setCategories(updated);
    
    if (isFirebaseMock) {
      localStorage.setItem('mock_categories_db', JSON.stringify(updated));
    } else {
      await deleteDoc(doc(db, 'categories', catId));
    }
  };

  return (
    <div className="space-y-8 relative z-10">
      {success && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs px-4 py-2.5 rounded-xl">
          {success}
        </div>
      )}
      {error && (
        <div className="bg-maroon-light/20 border border-maroon-light/40 text-maroon text-xs rounded-xl p-3">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* CATEGORIES SECTION */}
        <div className="space-y-6">
          <h3 className="font-heading font-bold text-base text-charcoal flex items-center gap-2 border-b border-saffron-light/20 pb-3">
            <Grid className="w-5 h-5 text-saffron" /> Category Management
          </h3>

          {/* Add Category Form */}
          <form onSubmit={handleCreateCategory} className="glass-panel p-5 rounded-3xl bg-white/40 border-white/60 flex flex-col gap-3">
            <h4 className="text-xs font-bold text-charcoal/70 uppercase">Add New Category</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input 
                type="text" 
                placeholder="Category Name" 
                value={catName} 
                onChange={e => setCatName(e.target.value)}
                className="w-full glass-input rounded-full py-2 px-3.5 text-xs font-semibold"
                required
              />
              <input 
                type="text" 
                placeholder="Image URL (optional)" 
                value={catImage} 
                onChange={e => setCatImage(e.target.value)}
                className="w-full glass-input rounded-full py-2 px-3.5 text-xs"
              />
            </div>
            <button type="submit" className="bg-saffron hover:bg-saffron-dark text-white font-heading font-bold text-xs py-2 rounded-full shadow-sm mt-1">
              Create Category
            </button>
          </form>

          {/* Categories Grid List */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {categories.map(c => (
              <div key={c.id} className="glass-panel p-3.5 rounded-2xl bg-white/40 border-white/60 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <img src={c.image} alt={c.name} className="w-10 h-10 object-cover rounded-lg border border-saffron-light/10 shadow-sm" />
                  <div>
                    <h5 className="font-heading font-bold text-xs text-charcoal">{c.name}</h5>
                    <span className="text-[9px] text-charcoal/40 font-bold uppercase">{c.count} items</span>
                  </div>
                </div>
                <button 
                  onClick={() => handleDeleteCategory(c.id)}
                  className="p-1 rounded-full hover:bg-maroon-light/20 text-maroon"
                  title="Delete Category"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* COUPONS SECTION */}
        <div className="space-y-6">
          <h3 className="font-heading font-bold text-base text-charcoal flex items-center gap-2 border-b border-saffron-light/20 pb-3">
            <Tag className="w-5 h-5 text-maroon" /> Coupon Management
          </h3>

          {/* Add Coupon Form */}
          <form onSubmit={handleCreateCoupon} className="glass-panel p-5 rounded-3xl bg-white/40 border-white/60 flex flex-col gap-3">
            <h4 className="text-xs font-bold text-charcoal/70 uppercase">Generate Coupon Code</h4>
            <div className="grid grid-cols-2 gap-3">
              <input 
                type="text" 
                placeholder="Code (e.g. SNACK50)" 
                value={coupCode} 
                onChange={e => setCoupCode(e.target.value)}
                className="w-full glass-input rounded-full py-2 px-3.5 text-xs font-bold"
                required
              />
              <select 
                value={coupType} 
                onChange={e => setCoupType(e.target.value)}
                className="w-full glass-input rounded-full py-2 px-3.5 text-xs font-semibold cursor-pointer"
              >
                <option value="Percentage">Percentage (%)</option>
                <option value="Fixed">Fixed Amount (₹)</option>
              </select>
              <div>
                <label className="block text-[8px] font-bold text-charcoal/50 ml-1 mb-1">Coupon Value</label>
                <input 
                  type="number" 
                  value={coupVal} 
                  onChange={e => setCoupVal(e.target.value)}
                  className="w-full glass-input rounded-full py-2 px-3.5 text-xs text-center font-bold"
                  required
                />
              </div>
              <div>
                <label className="block text-[8px] font-bold text-charcoal/50 ml-1 mb-1">Min. Order Value (₹)</label>
                <input 
                  type="number" 
                  value={coupMin} 
                  onChange={e => setCoupMin(e.target.value)}
                  className="w-full glass-input rounded-full py-2 px-3.5 text-xs text-center font-bold"
                  required
                />
              </div>
            </div>
            <button type="submit" className="bg-maroon hover:bg-maroon-dark text-white font-heading font-bold text-xs py-2 rounded-full shadow-sm mt-1">
              Generate Code
            </button>
          </form>

          {/* Coupons List Table */}
          <div className="glass-panel p-4 rounded-3xl bg-white/40 border-white/60 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-saffron-light/20 text-charcoal/40 uppercase font-bold tracking-wider">
                    <th className="pb-2">Code</th>
                    <th className="pb-2">Discount</th>
                    <th className="pb-2">Min. Purchase</th>
                    <th className="pb-2 text-right">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {coupons.map(c => (
                    <tr key={c.code} className="border-b border-saffron-light/10 hover:bg-white/30 last:border-0">
                      <td className="py-2.5 font-bold text-charcoal">{c.code}</td>
                      <td className="py-2.5 font-semibold text-charcoal/70">{c.value}{c.type === 'percentage' ? '%' : '₹'}</td>
                      <td className="py-2.5 font-semibold text-charcoal/70">₹{c.minAmount}</td>
                      <td className="py-2.5 text-right">
                        <button 
                          onClick={() => handleToggleCoupon(c.code)}
                          className="focus:outline-none"
                          title="Toggle Active"
                        >
                          {c.active ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-600 inline-block hover:scale-105 transition-transform" />
                          ) : (
                            <XCircle className="w-5 h-5 text-maroon inline-block hover:scale-105 transition-transform" />
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
