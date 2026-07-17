import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { PRODUCTS, CATEGORIES } from '../../utils/mockData';
import { Star, ShoppingBag, Plus, Minus, ArrowLeft, Heart, ShieldCheck, Truck, RotateCcw } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
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
  const [activeTab, setActiveTab] = useState('description');

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

  useEffect(() => {
    const loadProduct = async () => {
      let found = null;
      if (isFirebaseMock) {
        const dbProducts = JSON.parse(localStorage.getItem('mock_products_db') || '[]');
        const list = dbProducts.length > 0 ? dbProducts : PRODUCTS;
        found = list.find(p => p.id === id);
      } else {
        try {
          const docRef = doc(db, 'products', id);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            found = docSnap.data();
          }
        } catch (error) {
          console.error("Error loading product detail from firestore:", error);
        }
      }

      if (found) {
        setProduct(found);
        setActiveImage(found.images?.[0] || '');
        setReviewsList(found.reviews || []);
        if (found.variants && found.variants.length > 0) {
          setSelectedVariant(found.variants[0]);
        }
      } else {
        navigate('/shop');
      }
    };
    loadProduct();
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
    if (!newReviewName || !newReviewComment) return;

    const newRev = {
      id: Date.now(),
      user: newReviewName,
      comment: newReviewComment,
      rating: Number(newReviewRating),
      date: new Date().toISOString().split('T')[0]
    };

    const updatedReviews = [newRev, ...reviewsList];
    const totalRating = updatedReviews.reduce((sum, r) => sum + r.rating, 0);
    const avgRating = Number((totalRating / updatedReviews.length).toFixed(1));

    // Update locally in component state
    setReviewsList(updatedReviews);
    setProduct(prev => ({
      ...prev,
      rating: avgRating,
      reviewsCount: updatedReviews.length,
      reviews: updatedReviews
    }));

    if (isFirebaseMock) {
      // Save in mock local storage database
      const dbProducts = JSON.parse(localStorage.getItem('mock_products_db') || '[]');
      const updatedList = dbProducts.map(p => {
        if (p.id === id) {
          return {
            ...p,
            rating: avgRating,
            reviewsCount: updatedReviews.length,
            reviews: updatedReviews
          };
        }
        return p;
      });
      localStorage.setItem('mock_products_db', JSON.stringify(updatedList));
    } else {
      // Save in Live Firebase Firestore
      try {
        await updateDoc(doc(db, 'products', id), {
          reviews: updatedReviews,
          rating: avgRating,
          reviewsCount: updatedReviews.length
        });
      } catch (err) {
        console.error("Failed to persist product review to Firestore:", err);
      }
    }

    setNewReviewComment('');
    setNewReviewRating(5);
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
            className={`pb-3.5 px-2 font-heading font-extrabold text-sm uppercase tracking-wider transition-all border-b-2 cursor-pointer ${
              activeTab === 'reviews'
                ? 'border-maroon text-maroon'
                : 'border-transparent text-charcoal/40 hover:text-charcoal'
            }`}
          >
            Reviews ({reviewsList.length})
          </button>
        </div>

        <div className="mt-8">
          {activeTab === 'description' ? (
            <div className="space-y-4 max-w-3xl">
              <h3 className="font-heading font-bold text-lg text-charcoal">About {product.name}</h3>
              <p className="text-sm text-charcoal/70 leading-relaxed font-body whitespace-pre-line">{product.description}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start">
              {/* Reviews List */}
              <div className="lg:col-span-2 space-y-4">
                {reviewsList.length === 0 ? (
                  <p className="text-xs text-charcoal/50 italic">No reviews submitted yet for this product. Be the first to share your spiced thoughts!</p>
                ) : (
                  reviewsList.map((rev) => (
                    <div key={rev.id} className="glass-panel p-5 rounded-2xl bg-white/45 border-white/60">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-heading font-bold text-sm text-charcoal">{rev.user}</h4>
                          <span className="text-[10px] text-charcoal/40 font-medium">{rev.date}</span>
                        </div>
                        <div className="flex text-turmeric">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className={`w-3.5 h-3.5 ${i < rev.rating ? 'fill-current' : 'text-charcoal/20'}`} />
                          ))}
                        </div>
                      </div>
                      <p className="text-xs text-charcoal/70 leading-relaxed font-body mt-3">"{rev.comment}"</p>
                    </div>
                  ))
                )}
              </div>

              {/* Submit Review Form */}
              <div className="glass-panel p-6 rounded-3xl bg-white/50 border-saffron-light/20">
                <h3 className="font-heading font-bold text-base text-charcoal mb-4 flex items-center gap-1.5"><Sparkles className="w-4 h-4 text-saffron" /> Share Your Review</h3>
                <form onSubmit={handleReviewSubmit} className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold text-charcoal/75 uppercase tracking-wide mb-1">Your Name</label>
                    <input 
                      type="text" 
                      value={newReviewName}
                      onChange={e => setNewReviewName(e.target.value)}
                      placeholder="Amit Sharma"
                      className="w-full glass-input rounded-full py-2 px-4 text-xs"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-charcoal/75 uppercase tracking-wide mb-1">Rating</label>
                    <select 
                      value={newReviewRating}
                      onChange={e => setNewReviewRating(e.target.value)}
                      className="w-full glass-input rounded-full py-2 px-4 text-xs font-semibold"
                    >
                      <option value={5}>5 Stars (Royal Taste)</option>
                      <option value={4}>4 Stars (Very Good)</option>
                      <option value={3}>3 Stars (Average Crunch)</option>
                      <option value={2}>2 Stars (Lacks Spice)</option>
                      <option value={1}>1 Star (Bad Batch)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-charcoal/75 uppercase tracking-wide mb-1">Comments</label>
                    <textarea 
                      value={newReviewComment}
                      onChange={e => setNewReviewComment(e.target.value)}
                      placeholder="Tell us what you liked about the crunch, aroma, and spice blend!"
                      className="w-full glass-input rounded-2xl py-2 px-4 text-xs h-24 resize-none"
                      required
                    />
                  </div>

                  <button 
                    type="submit"
                    className="w-full bg-saffron hover:bg-saffron-dark text-white font-heading font-bold py-2.5 rounded-full text-xs shadow-sm transition-colors cursor-pointer"
                  >
                    Submit Review
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
