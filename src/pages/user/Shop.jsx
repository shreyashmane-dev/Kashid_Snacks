import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { PRODUCTS, CATEGORIES } from '../../utils/mockData';
import { Search, Star, Heart, SlidersHorizontal, ArrowUpDown, Minus, Plus } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import KashiMascot from '../../components/KashiMascot';
import { useAuth } from '../../context/AuthContext';
import { collection, getDocs, doc, getDoc, updateDoc } from 'firebase/firestore';
import { db, isFirebaseMock } from '../../config/firebase';

export default function Shop() {
  const { currentUser } = useAuth();
  const { addToCart, cartItems, updateQuantity } = useCart();
  const [searchParams, setSearchParams] = useSearchParams();
  const categoryFilter = searchParams.get('category') || 'all';

  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('popular');
  const [allProducts, setAllProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch products from Firestore database
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        if (isFirebaseMock) {
          const dbProducts = JSON.parse(localStorage.getItem('mock_products_db') || '[]');
          setAllProducts(dbProducts.length > 0 ? dbProducts : PRODUCTS);
        } else {
          const querySnapshot = await getDocs(collection(db, 'products'));
          const list = [];
          querySnapshot.forEach((doc) => {
            list.push(doc.data());
          });
          setAllProducts(list);
        }
      } catch (error) {
        console.error("Error loading products:", error);
        setAllProducts(isFirebaseMock ? PRODUCTS : []);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const [wishlistIds, setWishlistIds] = useState([]);

  // Fetch user wishlist on startup/auth change
  useEffect(() => {
    const fetchWishlist = async () => {
      if (!currentUser) {
        setWishlistIds([]);
        return;
      }
      if (isFirebaseMock) {
        const userWish = JSON.parse(localStorage.getItem('mock_user_wishlist') || '{}');
        setWishlistIds(userWish[currentUser.uid] || []);
      } else {
        try {
          const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
          if (userDoc.exists()) {
            setWishlistIds(userDoc.data().wishlist || []);
          }
        } catch (err) {
          console.error("Error loading user wishlist:", err);
        }
      }
    };
    fetchWishlist();
  }, [currentUser]);

  const toggleWishlist = async (productId) => {
    if (!currentUser) {
      alert("Please log in to manage your wishlist!");
      return;
    }
    const updatedIds = wishlistIds.includes(productId)
      ? wishlistIds.filter(id => id !== productId)
      : [...wishlistIds, productId];
      
    setWishlistIds(updatedIds);

    if (isFirebaseMock) {
      const userWish = JSON.parse(localStorage.getItem('mock_user_wishlist') || '{}');
      userWish[currentUser.uid] = updatedIds;
      localStorage.setItem('mock_user_wishlist', JSON.stringify(userWish));
    } else {
      try {
        const userRef = doc(db, 'users', currentUser.uid);
        await updateDoc(userRef, { wishlist: updatedIds });
      } catch (err) {
        console.error("Error updating wishlist in Firestore:", err);
      }
    }
  };

  // Apply filters and sort
  useEffect(() => {
    let result = [...allProducts];

    // 1. Category Filter
    if (categoryFilter !== 'all') {
      result = result.filter(p => p.category === categoryFilter);
    }

    // 2. Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(p => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q));
    }

    // 3. Sorting
    if (sortBy === 'price-low') {
      result.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-high') {
      result.sort((a, b) => b.price - a.price);
    } else if (sortBy === 'rating') {
      result.sort((a, b) => b.rating - a.rating);
    }

    setFilteredProducts(result);
  }, [categoryFilter, searchQuery, sortBy, allProducts]);

  const handleCategoryChange = (catId) => {
    if (catId === 'all') {
      searchParams.delete('category');
    } else {
      searchParams.set('category', catId);
    }
    setSearchParams(searchParams);
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-6 relative">
      {/* Background spice spots */}
      <div className="absolute top-[10%] right-[5%] w-80 h-80 bg-saffron/5 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-[20%] left-[5%] w-80 h-80 bg-maroon/5 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="mb-10 text-center md:text-left">
        <h1 className="font-heading font-extrabold text-3xl sm:text-4xl text-charcoal">The Royal Snack Shelf</h1>
        <p className="text-xs sm:text-sm text-charcoal/60 mt-1.5">Freshly made, packed with premium cryo-ground Indian spices</p>
      </div>

      {/* FILTER & SEARCH CONTROLS */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-12 z-10 relative">
        {/* Search Input */}
        <div className="lg:col-span-2 relative">
          <input 
            type="text" 
            placeholder="Search spice bhujia, chivda, sweets..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full glass-input rounded-full py-3.5 pl-12 pr-6 text-sm"
          />
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-charcoal/40" />
        </div>

        {/* Category Dropdown (or sort) */}
        <div className="relative">
          <div className="relative">
            <select 
              value={categoryFilter}
              onChange={(e) => handleCategoryChange(e.target.value)}
              className="w-full glass-input rounded-full py-3.5 pl-11 pr-10 text-sm appearance-none font-semibold cursor-pointer text-charcoal/80"
            >
              <option value="all">All Categories</option>
              {CATEGORIES.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <SlidersHorizontal className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal/40 pointer-events-none" />
          </div>
        </div>

        {/* Sort Dropdown */}
        <div className="relative">
          <div className="relative">
            <select 
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full glass-input rounded-full py-3.5 pl-11 pr-10 text-sm appearance-none font-semibold cursor-pointer text-charcoal/80"
            >
              <option value="popular">Sort: Popular</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="rating">Rating: Highest First</option>
            </select>
            <ArrowUpDown className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal/40 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* CATEGORY FAST PILLS (Desktop) */}
      <div className="hidden md:flex flex-wrap gap-3 mb-10 z-10 relative">
        <button 
          onClick={() => handleCategoryChange('all')}
          className={`px-5 py-2 rounded-full font-heading font-semibold text-xs transition-all shadow-sm border ${
            categoryFilter === 'all' 
              ? 'bg-saffron text-white border-saffron shadow-glass-glow' 
              : 'glass-card text-charcoal/70 hover:border-saffron/30'
          }`}
        >
          All Snacks
        </button>
        {CATEGORIES.map((cat) => (
          <button 
            key={cat.id}
            onClick={() => handleCategoryChange(cat.id)}
            className={`px-5 py-2 rounded-full font-heading font-semibold text-xs transition-all shadow-sm border ${
              categoryFilter === cat.id 
                ? 'bg-saffron text-white border-saffron shadow-glass-glow' 
                : 'glass-card text-charcoal/70 hover:border-saffron/30'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* PRODUCTS GRID */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 z-10 relative">
          <div className="w-10 h-10 border-4 border-saffron border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-sm font-semibold text-charcoal/60">Loading Premium Snacks...</p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="glass-panel text-center py-12 px-6 rounded-3xl z-10 relative max-w-xl mx-auto mt-6 flex flex-col items-center">
          <div className="w-44 h-44 mb-4">
            <KashiMascot stage={0} className="w-full h-full" />
          </div>
          <p className="font-heading font-extrabold text-xl text-charcoal">No Snacks Available</p>
          <p className="text-sm text-charcoal/60 mt-1.5 leading-relaxed max-w-md">
            Our kitchens are currently preparing a fresh batch of authentic snacks. Kashi will bring them to the shelves shortly!
          </p>
          <button 
            onClick={() => {
              setSearchQuery('');
              handleCategoryChange('all');
            }}
            className="bg-saffron hover:bg-saffron-dark text-white font-heading font-bold px-6 py-2.5 rounded-full shadow-md mt-6 text-sm transition-colors cursor-pointer"
          >
            Reset Catalog Search
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 z-10 relative">
          {filteredProducts.map((product) => (
            <div 
              key={product.id} 
              className="glass-panel p-5 rounded-3xl bg-white/60 relative overflow-hidden flex flex-col h-full group hover:shadow-lg transition-all"
            >
              {/* Wishlist toggle */}
              <button 
                onClick={() => toggleWishlist(product.id)}
                className={`absolute top-4 right-4 p-2 rounded-full transition-all shadow-sm z-10 cursor-pointer ${
                  wishlistIds.includes(product.id)
                    ? 'bg-maroon/10 text-maroon hover:bg-maroon/20'
                    : 'bg-white/70 hover:bg-white text-charcoal/40 hover:text-maroon'
                }`}
              >
                <Heart className={`w-4 h-4 ${wishlistIds.includes(product.id) ? 'fill-current' : ''}`} />
              </button>

              {/* Product Image */}
              <Link to={`/product/${product.id}`} className="aspect-[4/3] rounded-2xl overflow-hidden shadow-sm border border-saffron-light/20 relative block">
                <img 
                  src={product.images[0]} 
                  alt={product.name} 
                  className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                />
                {product.stock <= 10 && (
                  <span className="absolute bottom-3 left-3 bg-maroon text-white text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded shadow-sm">
                    Only {product.stock} Left!
                  </span>
                )}
              </Link>

              {/* Product Info */}
              <div className="mt-5 flex-grow">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-saffron uppercase tracking-widest">
                    {CATEGORIES.find(c => c.id === product.category)?.name || product.category}
                  </span>
                  <div className="flex items-center text-turmeric gap-0.5 text-xs font-bold">
                    <Star className="w-3.5 h-3.5 fill-current" />
                    <span className="text-charcoal/70">{product.rating}</span>
                  </div>
                </div>
                
                <Link to={`/product/${product.id}`} className="block mt-1">
                  <h3 className="font-heading font-extrabold text-lg text-charcoal hover:text-saffron transition-colors truncate">
                    {product.name}
                  </h3>
                </Link>
                
                <p className="text-xs text-charcoal/60 mt-1.5 leading-relaxed font-body line-clamp-2">
                  {product.description}
                </p>
              </div>

              {/* Price & Add */}
              <div className="mt-5 pt-4 border-t border-saffron-light/20 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-charcoal/50 block">Price ({product.weight})</span>
                  <span className="font-heading font-extrabold text-lg text-maroon">₹{product.price}</span>
                </div>
                
                {(() => {
                  const itemInCart = cartItems.find(i => i.id === product.id);
                  const quantityInCart = itemInCart ? itemInCart.quantity : 0;
                  const selectedWeight = product.variants?.[0]?.weight || product.weight;
                  
                  if (quantityInCart > 0) {
                    return (
                      <div className="flex items-center gap-2 bg-cream-container border border-saffron-light/25 rounded-full p-0.5 shadow-sm">
                        <button 
                          onClick={() => updateQuantity(product.id, selectedWeight, quantityInCart - 1)}
                          className="p-1 rounded-full hover:bg-white text-charcoal/80 hover:text-saffron transition-colors cursor-pointer"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="text-xs font-bold w-4 text-center">{quantityInCart}</span>
                        <button 
                          onClick={() => updateQuantity(product.id, selectedWeight, quantityInCart + 1)}
                          className="p-1 rounded-full hover:bg-white text-charcoal/80 hover:text-saffron transition-colors cursor-pointer"
                          disabled={quantityInCart >= product.stock}
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  }

                  return (
                    <button 
                      onClick={() => addToCart(product, 1, product.variants?.[0] || null)}
                      className="bg-saffron hover:bg-saffron-dark text-white font-heading font-semibold text-xs px-5 py-2.5 rounded-full shadow-sm hover:shadow transition-colors cursor-pointer"
                    >
                      Quick Add
                    </button>
                  );
                })()}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
