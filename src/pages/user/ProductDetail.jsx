import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { PRODUCTS, CATEGORIES } from '../../utils/mockData';
import { Star, ShoppingBag, Plus, Minus, ArrowLeft, Heart, ShieldCheck, Truck, RotateCcw, Sparkles, CheckCircle2, ThumbsUp, Filter, MessageSquare, Award, Flame, Check } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { doc, getDoc, updateDoc, setDoc, collection, query, where, onSnapshot } from 'firebase/firestore';
import { db, isFirebaseMock } from '../../config/firebase';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { currentUser } = useAuth();
  
  const [product, setProduct] = useState(null);
  const [activeImage, setActiveImage] = useState('');
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [quantity, setQuantity] = useState(1);

  const [reviewsList, setReviewsList] = useState([]);
  const [newReviewName, setNewReviewName] = useState('');
  const [newReviewComment, setNewReviewComment] = useState('');
  const [newReviewRating, setNewReviewRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [filterRating, setFilterRating] = useState('all');
  const [helpfulState, setHelpfulState] = useState({});
  const [activeTab, setActiveTab] = useState('description');
  const [reviewSuccessMsg, setReviewSuccessMsg] = useState('');
  const [isEditingReview, setIsEditingReview] = useState(false);

  const [wishlistIds, setWishlistIds] = useState([]);

  // Find existing review from this customer for this specific product
  const existingUserReview = reviewsList.find(r => {
    if (currentUser) {
      if (r.userId && r.userId === currentUser.uid) return true;
      if (r.userEmail && r.userEmail === currentUser.email) return true;
      if (r.user && currentUser.displayName && r.user.toLowerCase() === currentUser.displayName.toLowerCase()) return true;
    }
    if (newReviewName && r.user && r.user.trim().toLowerCase() === newReviewName.trim().toLowerCase()) return true;
    return false;
  });

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

  // Prefill review name with current user name if logged in
  useEffect(() => {
    if (currentUser) {
      setNewReviewName(currentUser.displayName || currentUser.email?.split('@')[0] || '');
    }
  }, [currentUser]);

  const toggleWishlist = async () => {
    if (!currentUser) {
      alert("Please log in to manage your wishlist!");
      return;
    }
    const updatedIds = wishlistIds.includes(product.id)
      ? wishlistIds.filter(id => id !== product.id)
      : [...wishlistIds, product.id];
      
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

  // Real-time Google Reviews System Synchronization across all users globally
  useEffect(() => {
    let unsubSnapshot = () => {};
    let unsubStorage = () => {};

    const loadProductAndReviews = async () => {
      // 1. Initial product info lookup
      let baseProduct = PRODUCTS.find(p => String(p.id) === String(id));
      
      const dbProducts = JSON.parse(localStorage.getItem('mock_products_db') || '[]');
      const localProduct = dbProducts.find(p => String(p.id) === String(id));
      if (localProduct) {
        baseProduct = { ...baseProduct, ...localProduct };
      }

      if (!baseProduct) {
        return navigate('/shop');
      }

      setProduct(baseProduct);
      setActiveImage(baseProduct.images?.[0] || '');
      if (baseProduct.variants && baseProduct.variants.length > 0) {
        setSelectedVariant(baseProduct.variants[0]);
      }

      // Helper function to combine default mock reviews with user submitted reviews from all users
      const mergeWithDefaultReviews = (userRevs) => {
        const defaultRevs = baseProduct.reviews || [];
        const mergedMap = new Map();

        // Add user submitted reviews first (take priority)
        userRevs.forEach(r => {
          if (r && r.id) {
            mergedMap.set(String(r.id), r);
          }
        });

        // Add default mock reviews if not overwritten
        defaultRevs.forEach(defRev => {
          if (defRev && defRev.id && !mergedMap.has(String(defRev.id))) {
            mergedMap.set(String(defRev.id), defRev);
          }
        });

        const merged = Array.from(mergedMap.values());

        // Recalculate aggregate rating & reviews count
        const totalRating = merged.reduce((sum, r) => sum + Number(r.rating || 5), 0);
        const avgRating = merged.length > 0 ? Number((totalRating / merged.length).toFixed(1)) : 5;

        setReviewsList(merged);
        setProduct(prev => prev ? {
          ...prev,
          rating: avgRating,
          reviewsCount: merged.length,
          reviews: merged
        } : prev);
      };

      const loadFromAllSources = (firestoreRevs = []) => {
        const globalKeyRevs = JSON.parse(localStorage.getItem(`kashid_reviews_${id}`) || '[]');
        const globalAllRevs = JSON.parse(localStorage.getItem('kashid_all_global_reviews') || '[]')
          .filter(r => String(r.productId) === String(id));
        const dbProducts = JSON.parse(localStorage.getItem('mock_products_db') || '[]');
        const dbProd = dbProducts.find(p => String(p.id) === String(id));
        const localProdRevs = dbProd?.reviews || [];

        const combined = [...firestoreRevs];
        [...globalKeyRevs, ...globalAllRevs, ...localProdRevs].forEach(r => {
          if (r && !combined.some(c => String(c.id) === String(r.id))) {
            combined.push(r);
          }
        });

        mergeWithDefaultReviews(combined);
      };

      // 2. Load reviews from Firestore (Live Real-Time across all users) or Local Fallback
      if (!isFirebaseMock) {
        try {
          // Listen to reviews collection without where index clause so it never fails
          unsubSnapshot = onSnapshot(collection(db, 'reviews'), (snapshot) => {
            const firestoreReviews = [];
            snapshot.forEach((docSnap) => {
              const data = docSnap.data();
              if (String(data.productId) === String(id)) {
                firestoreReviews.push({ id: docSnap.id, ...data });
              }
            });
            loadFromAllSources(firestoreReviews);
          }, (err) => {
            console.error("Firestore reviews listener warning:", err);
            loadFromAllSources([]);
          });
        } catch (err) {
          console.error("Error creating real-time reviews listener:", err);
          loadFromAllSources([]);
        }
      } else {
        loadFromAllSources([]);
      }

      // Listen for custom review broadcast & storage events across tabs/windows
      const handleSyncEvent = () => loadFromAllSources([]);
      window.addEventListener('storage', handleSyncEvent);
      window.addEventListener('kashid_review_updated', handleSyncEvent);
      unsubStorage = () => {
        window.removeEventListener('storage', handleSyncEvent);
        window.removeEventListener('kashid_review_updated', handleSyncEvent);
      };
    };

    loadProductAndReviews();

    return () => {
      unsubSnapshot();
      unsubStorage();
    };
  }, [id, navigate]);

  if (!product) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-saffron border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const handleVariantChange = (variant) => {
    setSelectedVariant(variant);
    setQuantity(1); // Reset quantity on variant change
  };

  const handleAddToCart = () => {
    addToCart(product, quantity, selectedVariant);
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!newReviewName.trim() || !newReviewComment.trim()) return;

    // Generate unique review ID based on user identity + product ID (Google Reviews 1-review-per-user system)
    const userIdentifier = currentUser?.uid || currentUser?.email || newReviewName.trim().toLowerCase();
    const reviewDocId = existingUserReview?.id || `rev_${id}_${userIdentifier.replace(/[^a-zA-Z0-9]/g, '_')}`;

    const newRevObj = {
      id: reviewDocId,
      productId: String(id),
      userId: currentUser?.uid || `guest-${userIdentifier.replace(/[^a-zA-Z0-9]/g, '_')}`,
      userEmail: currentUser?.email || '',
      user: newReviewName.trim(),
      comment: newReviewComment.trim(),
      rating: Number(newReviewRating),
      date: new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString()
    };

    // 1. Update in-memory state immediately for instant feedback
    let updatedUserReviews;
    if (existingUserReview) {
      updatedUserReviews = reviewsList.map(r => String(r.id) === String(reviewDocId) ? { ...r, ...newRevObj } : r);
    } else {
      updatedUserReviews = [newRevObj, ...reviewsList];
    }

    const totalRating = updatedUserReviews.reduce((sum, r) => sum + Number(r.rating || 5), 0);
    const avgRating = Number((totalRating / updatedUserReviews.length).toFixed(1));

    setReviewsList(updatedUserReviews);
    setProduct(prev => prev ? {
      ...prev,
      rating: avgRating,
      reviewsCount: updatedUserReviews.length,
      reviews: updatedUserReviews
    } : prev);

    // 2. Save in product-specific & global local storage for cross-tab & offline persistence
    const currentProductReviews = JSON.parse(localStorage.getItem(`kashid_reviews_${id}`) || '[]');
    const filteredLocal = currentProductReviews.filter(r => String(r.id) !== String(reviewDocId));
    filteredLocal.unshift(newRevObj);
    localStorage.setItem(`kashid_reviews_${id}`, JSON.stringify(filteredLocal));

    const globalAllRevs = JSON.parse(localStorage.getItem('kashid_all_global_reviews') || '[]');
    const filteredGlobalAll = globalAllRevs.filter(r => String(r.id) !== String(reviewDocId));
    filteredGlobalAll.unshift(newRevObj);
    localStorage.setItem('kashid_all_global_reviews', JSON.stringify(filteredGlobalAll));

    // Also update global mock_products_db
    const dbProducts = JSON.parse(localStorage.getItem('mock_products_db') || '[]');
    const baseList = dbProducts.length > 0 ? dbProducts : PRODUCTS;
    let foundProd = false;
    const updatedDbProducts = baseList.map(p => {
      if (String(p.id) === String(id)) {
        foundProd = true;
        return {
          ...p,
          rating: avgRating,
          reviewsCount: updatedUserReviews.length,
          reviews: updatedUserReviews
        };
      }
      return p;
    });
    if (!foundProd && product) {
      updatedDbProducts.push({
        ...product,
        rating: avgRating,
        reviewsCount: updatedUserReviews.length,
        reviews: updatedUserReviews
      });
    }
    localStorage.setItem('mock_products_db', JSON.stringify(updatedDbProducts));

    // Broadcast event so other open tabs/windows update in real-time
    window.dispatchEvent(new Event('storage'));
    window.dispatchEvent(new CustomEvent('kashid_review_updated', { detail: newRevObj }));

    // 3. Save to Global Live Firebase Firestore in `reviews` collection (so ALL users worldwide see it in real-time!)
    if (!isFirebaseMock) {
      try {
        await setDoc(doc(db, 'reviews', reviewDocId), newRevObj, { merge: true });
        
        // Also update summary in products collection if accessible
        try {
          await setDoc(doc(db, 'products', String(id)), {
            rating: avgRating,
            reviewsCount: updatedUserReviews.length
          }, { merge: true });
        } catch (e) {
          // Ignore admin-only product write error
        }
      } catch (err) {
        console.error("Failed to persist global review to Firestore:", err);
      }
    }

    setIsEditingReview(false);
    setNewReviewComment('');
    setNewReviewRating(5);
    setReviewSuccessMsg(existingUserReview ? "Your review has been updated and published!" : "Thank you! Your review has been published globally.");
    setTimeout(() => setReviewSuccessMsg(''), 4000);
  };

  const currentPrice = selectedVariant ? selectedVariant.price : product.price;
  const currentStock = selectedVariant ? selectedVariant.stock : product.stock;

  return (
    <div className="max-w-7xl mx-auto px-6 py-6 relative">
      <div className="mb-6">
        <Link to="/shop" className="inline-flex items-center gap-1.5 text-xs font-bold text-charcoal/60 hover:text-saffron transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Snack Shelf
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start relative z-10">
        {/* IMAGE GALLERY - LEFT (5 Columns) */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <div className="aspect-[4/3] rounded-3xl overflow-hidden shadow-sm border border-saffron-light/20 bg-white/40">
            <img 
              src={activeImage} 
              alt={product.name} 
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex gap-4">
            {product.images.map((img, idx) => (
              <button 
                key={idx}
                onClick={() => setActiveImage(img)}
                className={`w-20 h-20 rounded-xl overflow-hidden border-2 transition-all ${
                  activeImage === img ? 'border-saffron shadow-sm' : 'border-transparent opacity-60 hover:opacity-100'
                }`}
              >
                <img src={img} alt="thumbnail" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>

        {/* DETAILS - RIGHT (7 Columns) */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          <div>
            <span className="text-xs font-bold text-saffron uppercase tracking-widest bg-saffron-light/20 px-3 py-1 rounded-full">
              {CATEGORIES.find(c => c.id === product.category)?.name || product.category}
            </span>
            <h1 className="font-heading font-extrabold text-3xl sm:text-4xl text-charcoal mt-3">{product.name}</h1>
            
            {/* Rating */}
            <div className="flex items-center gap-1.5 text-turmeric mt-3">
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <Star 
                    key={i} 
                    className={`w-4 h-4 ${i < Math.floor(product.rating) ? 'fill-current' : 'text-charcoal/20'}`} 
                  />
                ))}
              </div>
              <span className="text-xs text-charcoal/50 font-bold ml-1">{product.rating} ({reviewsList.length} Reviews)</span>
            </div>
          </div>

          <div className="border-y border-saffron-light/20 py-4 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-charcoal/50 uppercase font-bold tracking-wider">Price</span>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="font-heading font-extrabold text-3xl text-maroon">₹{currentPrice}</span>
                {selectedVariant && <span className="text-xs text-charcoal/50">/ {selectedVariant.weight}</span>}
              </div>
            </div>
            
            <div>
              <span className="text-[10px] text-charcoal/50 uppercase font-bold tracking-wider block text-right">Stock Status</span>
              {currentStock > 10 ? (
                <span className="text-xs text-emerald-600 font-bold bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full mt-1 inline-block">In Stock</span>
              ) : currentStock > 0 ? (
                <span className="text-xs text-saffron-dark font-bold bg-saffron-light/20 border border-saffron-light/40 px-3 py-1 rounded-full mt-1 inline-block">Low Stock ({currentStock} left)</span>
              ) : (
                <span className="text-xs text-maroon font-bold bg-maroon-light/20 border border-maroon-light/40 px-3 py-1 rounded-full mt-1 inline-block">Out of Stock</span>
              )}
            </div>
          </div>

          {/* Weight Variants */}
          {product.variants && product.variants.length > 0 && (
            <div>
              <h3 className="text-xs font-bold text-charcoal/50 uppercase tracking-wider mb-3">Select weight variant</h3>
              <div className="flex gap-3">
                {product.variants.map((v) => (
                  <button 
                    key={v.weight}
                    onClick={() => handleVariantChange(v)}
                    className={`px-5 py-2.5 rounded-full font-heading text-xs font-bold border transition-all ${
                      selectedVariant?.weight === v.weight 
                        ? 'bg-maroon border-maroon text-white shadow-md' 
                        : 'glass-card text-charcoal/70 border-saffron-light/30 hover:border-saffron/40'
                    }`}
                  >
                    {v.weight} - ₹{v.price}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quantity and Actions */}
          <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center pt-2">
            {/* Quantity */}
            <div className="flex items-center justify-between border border-saffron-light/30 bg-white/50 backdrop-blur-md rounded-full px-4 py-2 w-full sm:w-36">
              <button 
                onClick={() => setQuantity(q => Math.max(1, q - 1))}
                className="p-1 text-charcoal/60 hover:text-saffron transition-colors"
                disabled={currentStock === 0}
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="font-heading font-extrabold text-sm text-charcoal">{quantity}</span>
              <button 
                onClick={() => setQuantity(q => Math.min(currentStock, q + 1))}
                className="p-1 text-charcoal/60 hover:text-saffron transition-colors"
                disabled={currentStock === 0}
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Add to Cart & Wishlist */}
            <div className="flex gap-3 flex-grow">
              <button 
                onClick={handleAddToCart}
                disabled={currentStock === 0}
                className="flex-grow bg-gradient-to-r from-saffron to-saffron-dark hover:from-saffron-dark hover:to-maroon disabled:from-charcoal/30 disabled:to-charcoal/40 text-white font-heading font-bold py-3.5 rounded-full shadow-md flex items-center justify-center gap-2 text-sm transition-all"
              >
                <ShoppingBag className="w-4 h-4" />
                {currentStock === 0 ? "Out of Stock" : "Add to Snack Bag"}
              </button>
              
              <button 
                onClick={toggleWishlist}
                className={`p-3.5 rounded-full border border-saffron-light/30 transition-all cursor-pointer ${
                  wishlistIds.includes(product.id)
                    ? 'bg-maroon/10 border-maroon/20 text-maroon' 
                    : 'glass-card text-charcoal/40 hover:text-maroon'
                }`}
                title="Add to Wishlist"
              >
                <Heart className={`w-5 h-5 ${wishlistIds.includes(product.id) ? 'fill-current' : ''}`} />
              </button>
            </div>
          </div>

          {/* Badges / Commitments */}
          <div className="grid grid-cols-3 gap-3 border-t border-saffron-light/20 pt-6 mt-2 text-center">
            <div className="flex flex-col items-center gap-1.5 p-2 bg-cream-container/20 rounded-xl">
              <Truck className="w-5 h-5 text-saffron" />
              <span className="text-[10px] font-bold text-charcoal/80 uppercase">Free Delivery</span>
              <span className="text-[8px] text-charcoal/50">On orders above ₹200</span>
            </div>
            <div className="flex flex-col items-center gap-1.5 p-2 bg-cream-container/20 rounded-xl">
              <ShieldCheck className="w-5 h-5 text-maroon" />
              <span className="text-[10px] font-bold text-charcoal/80 uppercase">100% Quality</span>
              <span className="text-[8px] text-charcoal/50">Hygienically Packed</span>
            </div>
            <div className="flex flex-col items-center gap-1.5 p-2 bg-cream-container/20 rounded-xl">
              <RotateCcw className="w-5 h-5 text-turmeric-dark" />
              <span className="text-[10px] font-bold text-charcoal/80 uppercase">Easy Returns</span>
              <span className="text-[8px] text-charcoal/50">7-Day Snack Replacement</span>
            </div>
          </div>
        </div>
      </div>

      {/* TABS CONTAINER */}
      <div className="mt-16 glass-panel p-6 sm:p-8 rounded-3xl bg-white/40 border-white/60 relative z-10">
        <div className="flex border-b border-saffron-light/20 gap-8">
          <button 
            onClick={() => setActiveTab('description')}
            className={`pb-3.5 px-2 font-heading font-extrabold text-sm uppercase tracking-wider transition-all border-b-2 cursor-pointer ${
              activeTab === 'description'
                ? 'border-maroon text-maroon'
                : 'border-transparent text-charcoal/40 hover:text-charcoal'
            }`}
          >
            Product Description
          </button>
          <button 
            onClick={() => setActiveTab('reviews')}
            className={`pb-3.5 px-2 font-heading font-extrabold text-sm uppercase tracking-wider transition-all border-b-2 cursor-pointer flex items-center gap-2 ${
              activeTab === 'reviews'
                ? 'border-maroon text-maroon'
                : 'border-transparent text-charcoal/40 hover:text-charcoal'
            }`}
          >
            <span>Reviews ({reviewsList.length})</span>
            <span className="text-[10px] bg-saffron/20 text-saffron-dark px-2 py-0.5 rounded-full font-bold">★ {product.rating}</span>
          </button>
        </div>

        <div className="mt-8">
          {activeTab === 'description' ? (
            <div className="space-y-4 max-w-3xl">
              <h3 className="font-heading font-bold text-lg text-charcoal">About {product.name}</h3>
              <p className="text-sm text-charcoal/70 leading-relaxed font-body whitespace-pre-line">{product.description}</p>
            </div>
          ) : (
            <div className="space-y-8">
              {/* RICH RATING OVERVIEW & BREAKDOWN DASHBOARD */}
              <div className="glass-panel p-6 rounded-3xl bg-gradient-to-r from-saffron-light/10 via-white/50 to-amber-500/10 border-white/80 grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
                {/* Left Big Score Badge */}
                <div className="md:col-span-4 flex flex-col items-center justify-center text-center border-b md:border-b-0 md:border-r border-saffron-light/20 pb-6 md:pb-0 md:pr-6">
                  <span className="font-heading font-black text-5xl sm:text-6xl text-maroon tracking-tight">{product.rating}</span>
                  <div className="flex text-turmeric my-2">
                    {[...Array(5)].map((_, i) => (
                      <Star 
                        key={i} 
                        className={`w-5 h-5 ${i < Math.floor(product.rating) ? 'fill-current text-turmeric' : 'text-charcoal/20'}`} 
                      />
                    ))}
                  </div>
                  <p className="text-xs font-bold text-charcoal/70 mt-1">Based on {reviewsList.length} Snack Lover reviews</p>
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100/80 px-3 py-1 rounded-full mt-3">
                    <CheckCircle2 className="w-3.5 h-3.5" /> 98% Verified Snack Approval
                  </span>
                </div>

                {/* Right Star Rating Breakdown Progress Bars */}
                <div className="md:col-span-8 space-y-2.5">
                  {[5, 4, 3, 2, 1].map((star) => {
                    const count = reviewsList.filter(r => r.rating === star).length;
                    const percent = reviewsList.length > 0 ? (count / reviewsList.length) * 100 : 0;
                    return (
                      <div key={star} className="flex items-center gap-3 text-xs">
                        <span className="font-bold text-charcoal/70 w-12 flex items-center gap-1">
                          {star} <Star className="w-3 h-3 fill-current text-turmeric inline" />
                        </span>
                        <div className="flex-grow h-3 bg-charcoal/10 rounded-full overflow-hidden relative">
                          <div 
                            className="h-full bg-gradient-to-r from-saffron to-maroon rounded-full transition-all duration-500" 
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                        <span className="text-[11px] font-mono text-charcoal/60 w-12 text-right">{count} ({Math.round(percent)}%)</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* REVIEWS FILTER CHIPS */}
              <div className="flex items-center justify-between flex-wrap gap-3 pt-2 border-t border-saffron-light/20">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold text-charcoal/60 uppercase tracking-wider flex items-center gap-1 mr-2">
                    <Filter className="w-3.5 h-3.5 text-saffron" /> Filter Reviews:
                  </span>
                  {['all', 5, 4, 3, 2, 1].map((filterVal) => {
                    const count = filterVal === 'all' ? reviewsList.length : reviewsList.filter(r => r.rating === filterVal).length;
                    const isActive = filterRating === filterVal;
                    return (
                      <button
                        key={filterVal}
                        onClick={() => setFilterRating(filterVal)}
                        className={`text-xs font-heading font-bold px-3.5 py-1.5 rounded-full border transition-all cursor-pointer ${
                          isActive 
                            ? 'bg-maroon border-maroon text-white shadow-sm' 
                            : 'glass-card text-charcoal/70 border-saffron-light/20 hover:border-saffron/40'
                        }`}
                      >
                        {filterVal === 'all' ? `All (${count})` : `${filterVal} Stars (${count})`}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* MAIN CONTENT GRID: REVIEWS LIST + INTERACTIVE SUBMIT FORM */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* REVIEWS LIST (7 Columns) */}
                <div className="lg:col-span-7 space-y-4">
                  {(() => {
                    const filteredReviews = filterRating === 'all' 
                      ? reviewsList 
                      : reviewsList.filter(r => r.rating === Number(filterRating));

                    if (filteredReviews.length === 0) {
                      return (
                        <div className="glass-panel p-8 text-center rounded-3xl bg-white/30 border-white/60">
                          <MessageSquare className="w-10 h-10 text-saffron/40 mx-auto mb-3" />
                          <h4 className="font-heading font-bold text-sm text-charcoal">No Reviews Found for Selection</h4>
                          <p className="text-xs text-charcoal/50 mt-1">Be the first to share your thoughts for this rating level!</p>
                        </div>
                      );
                    }

                    return filteredReviews.map((rev) => {
                      const userInitial = (rev.user || 'S').charAt(0).toUpperCase();
                      const isHelpful = helpfulState[rev.id];
                      const helpfulCount = (rev.helpfulCount || 0) + (isHelpful ? 1 : 0);
                      const isUserOwnReview = existingUserReview && rev.id === existingUserReview.id;

                      return (
                        <div 
                          key={rev.id} 
                          className={`glass-panel p-6 rounded-3xl transition-all duration-300 shadow-sm hover:shadow-glass-warm relative overflow-hidden ${
                            isUserOwnReview
                              ? 'bg-amber-50/60 border-2 border-saffron/60 shadow-md'
                              : 'bg-white/50 border-white/80 hover:border-saffron/40 hover:-translate-y-1'
                          }`}
                        >
                          <div className="flex justify-between items-start flex-wrap gap-2">
                            <div className="flex items-center gap-3">
                              {/* Avatar circle with dynamic gradient */}
                              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-saffron via-amber-500 to-maroon text-white font-heading font-extrabold flex items-center justify-center text-sm shadow-sm shrink-0">
                                {userInitial}
                              </div>
                              <div>
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <h4 className="font-heading font-bold text-sm text-charcoal">{rev.user}</h4>
                                  <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-full">
                                    <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Verified Buyer
                                  </span>
                                  {isUserOwnReview && (
                                    <span className="inline-flex items-center gap-0.5 text-[9px] font-extrabold text-maroon bg-saffron-light/30 px-2.5 py-0.5 rounded-full border border-saffron-light/50">
                                      ✨ Your Review
                                    </span>
                                  )}
                                </div>
                                <span className="text-[10px] text-charcoal/40 font-medium">{rev.date}</span>
                              </div>
                            </div>

                            {/* Stars rating badge */}
                            <div className="flex items-center gap-1 text-turmeric bg-amber-50 border border-amber-200 px-3 py-1 rounded-full">
                              {[...Array(5)].map((_, i) => (
                                <Star key={i} className={`w-3.5 h-3.5 ${i < rev.rating ? 'fill-current text-turmeric' : 'text-charcoal/20'}`} />
                              ))}
                              <span className="text-xs font-bold text-charcoal/80 ml-1">{rev.rating}.0</span>
                            </div>
                          </div>

                          <p className="text-xs sm:text-sm text-charcoal/80 leading-relaxed font-body mt-4 pl-1 border-l-2 border-saffron-light/40">
                            "{rev.comment}"
                          </p>

                          {/* Reaction bar */}
                          <div className="mt-4 pt-3 border-t border-saffron-light/10 flex items-center justify-between text-xs">
                            <span className="text-[10px] font-bold text-saffron uppercase tracking-wider flex items-center gap-1">
                              <Sparkles className="w-3 h-3" /> Royal Flavor Approved
                            </span>
                            <button
                              onClick={() => {
                                setHelpfulState(prev => ({
                                  ...prev,
                                  [rev.id]: !prev[rev.id]
                                }));
                              }}
                              className={`flex items-center gap-1.5 text-xs px-3 py-1 rounded-full transition-all cursor-pointer ${
                                isHelpful 
                                  ? 'bg-saffron text-white font-bold shadow-sm' 
                                  : 'bg-charcoal/5 hover:bg-saffron-light/20 text-charcoal/60 hover:text-saffron font-semibold'
                              }`}
                            >
                              <ThumbsUp className={`w-3.5 h-3.5 ${isHelpful ? 'fill-current' : ''}`} />
                              <span>Helpful ({helpfulCount})</span>
                            </button>
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>

                {/* SUBMIT OR ALREADY REVIEWED FORM PANEL (5 Columns) */}
                <div className="lg:col-span-5 glass-panel p-6 rounded-3xl bg-white/60 border-saffron-light/30 shadow-glass-warm sticky top-24">
                  {existingUserReview && !isEditingReview ? (
                    /* ALREADY REVIEWED DISPLAY CARD */
                    <div className="space-y-4 text-center py-2 animate-fadeIn">
                      <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
                        <CheckCircle2 className="w-8 h-8" />
                      </div>
                      <div>
                        <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full">Review Submitted</span>
                        <h3 className="font-heading font-extrabold text-lg text-charcoal mt-3">You've Reviewed This Snack!</h3>
                        <p className="text-xs text-charcoal/60 mt-1">Each customer can leave one review per product. Thank you for sharing your thoughts!</p>
                      </div>

                      <div className="glass-panel p-4 rounded-2xl bg-saffron-light/10 border border-saffron-light/20 text-left space-y-2">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-bold text-charcoal">{existingUserReview.user}</span>
                          <div className="flex text-turmeric">
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} className={`w-3 h-3 ${i < existingUserReview.rating ? 'fill-current' : 'text-charcoal/20'}`} />
                            ))}
                          </div>
                        </div>
                        <p className="text-xs italic text-charcoal/70">"{existingUserReview.comment}"</p>
                        <span className="text-[9px] text-charcoal/40 font-mono block text-right">{existingUserReview.date}</span>
                      </div>

                      {reviewSuccessMsg && (
                        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl p-3 text-center animate-fadeIn">
                          <span className="font-semibold">{reviewSuccessMsg}</span>
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          setIsEditingReview(true);
                          setNewReviewRating(existingUserReview.rating);
                          setNewReviewComment(existingUserReview.comment);
                          if (existingUserReview.user) setNewReviewName(existingUserReview.user);
                        }}
                        className="w-full bg-saffron hover:bg-saffron-dark text-white font-heading font-bold py-3 rounded-full text-xs shadow-sm transition-all cursor-pointer"
                      >
                        Edit Your Review
                      </button>
                    </div>
                  ) : (
                    /* REVIEW FORM (NEW OR EDITING) */
                    <div>
                      <div className="flex items-center justify-between mb-4 border-b border-saffron-light/20 pb-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-saffron-light/20 flex items-center justify-center text-saffron">
                            <Sparkles className="w-4 h-4" />
                          </div>
                          <div>
                            <h3 className="font-heading font-bold text-base text-charcoal">
                              {isEditingReview ? 'Update Your Review' : 'Write a Review'}
                            </h3>
                            <p className="text-[10px] text-charcoal/60">
                              {isEditingReview ? 'Modify your previously submitted review' : 'Share your royal crunch experience'}
                            </p>
                          </div>
                        </div>
                        {isEditingReview && (
                          <button
                            type="button"
                            onClick={() => setIsEditingReview(false)}
                            className="text-[10px] font-bold text-charcoal/50 hover:text-maroon underline"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                      
                      {reviewSuccessMsg && (
                        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl p-3.5 mb-4 flex items-center gap-2 animate-fadeIn shadow-sm">
                          <CheckCircle2 className="w-4.5 h-4.5 text-emerald-600 shrink-0" />
                          <span className="font-semibold">{reviewSuccessMsg}</span>
                        </div>
                      )}

                      <form onSubmit={handleReviewSubmit} className="space-y-4">
                        <div>
                          <label className="block text-[10px] font-bold text-charcoal/75 uppercase tracking-wide mb-1.5">Your Name</label>
                          <input 
                            type="text" 
                            value={newReviewName}
                            onChange={e => setNewReviewName(e.target.value)}
                            placeholder="Amit Sharma"
                            className="w-full glass-input rounded-full py-2.5 px-4 text-xs font-semibold"
                            required
                          />
                        </div>

                        {/* INTERACTIVE STAR SELECTOR */}
                        <div>
                          <label className="block text-[10px] font-bold text-charcoal/75 uppercase tracking-wide mb-1.5">Rate Your Experience</label>
                          <div className="flex items-center gap-2 bg-saffron-light/10 p-3 rounded-2xl border border-saffron-light/20">
                            <div className="flex gap-1" onMouseLeave={() => setHoverRating(0)}>
                              {[1, 2, 3, 4, 5].map((starVal) => {
                                const isFilled = starVal <= (hoverRating || newReviewRating);
                                return (
                                  <button
                                    key={starVal}
                                    type="button"
                                    onClick={() => setNewReviewRating(starVal)}
                                    onMouseEnter={() => setHoverRating(starVal)}
                                    className="p-1 transition-transform hover:scale-125 focus:outline-none cursor-pointer"
                                  >
                                    <Star 
                                      className={`w-6 h-6 transition-all ${
                                        isFilled ? 'fill-turmeric text-turmeric drop-shadow-sm' : 'text-charcoal/20'
                                      }`} 
                                    />
                                  </button>
                                );
                              })}
                            </div>
                            <span className="text-[11px] font-extrabold text-maroon ml-auto">
                              {newReviewRating === 5 && '🌟 Royal (5/5)'}
                              {newReviewRating === 4 && '😋 Tasty (4/5)'}
                              {newReviewRating === 3 && '👌 Average (3/5)'}
                              {newReviewRating === 2 && '🌶️ Less Spice (2/5)'}
                              {newReviewRating === 1 && '😞 Poor (1/5)'}
                            </span>
                          </div>
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-charcoal/75 uppercase tracking-wide mb-1.5">Your Review Comments</label>
                          <textarea 
                            value={newReviewComment}
                            onChange={e => setNewReviewComment(e.target.value)}
                            placeholder="Describe the crunchiness, aroma, fresh seasoning, and spice level!"
                            className="w-full glass-input rounded-2xl py-3 px-4 text-xs h-28 resize-none font-body"
                            required
                          />
                        </div>

                        <button 
                          type="submit"
                          className="w-full bg-gradient-to-r from-saffron to-saffron-dark hover:from-saffron-dark hover:to-maroon text-white font-heading font-extrabold py-3.5 rounded-full text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <Sparkles className="w-4 h-4" />
                          {isEditingReview ? 'Update Your Review' : 'Submit Snack Review'}
                        </button>
                      </form>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
