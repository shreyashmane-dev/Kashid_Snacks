import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform, useSpring, AnimatePresence } from 'framer-motion';
import { ArrowRight, Star, Heart, Shield, Droplets, Zap, Sparkles, Sun, Flame, Package } from 'lucide-react';
import { PRODUCTS, CATEGORIES } from '../../utils/mockData';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { db, isFirebaseMock } from '../../config/firebase';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';
import KashiMascot from '../../components/KashiMascot';

const DEFAULT_CONTENT = {
  heroHeadline: "A Modern Spin On Traditional Taste.",
  heroSubtext: "Indulge in India's finest snacking heritage. Experience our handcrafted collection wrapped in premium glassmorphic freshness.",
  featuredSnacks: ['saffron-bhujia', 'turmeric-chivda', 'maroon-makhana'],
  banners: [
    { id: 1, title: "Royal Diwali Offer", image: "https://images.unsplash.com/photo-1601050690597-df056fb4ce78?w=800&q=80", link: "/shop?category=sweets" }
  ],
  storytellingStages: [
    { title: "Ethical Sourcing", desc: "Selecting the finest saffron from Pampore, turmeric from Alleppey, and Byadgi chillies directly from local farms.", kashiStage: "Kashi waving near farm crop fields." },
    { title: "Natural Sun-Drying", desc: "Slow sun-drying under clean mountain winds to lock in organic flavor compounds naturally.", kashiStage: "Kashi wearing shades under a warm sun." },
    { title: "Cryogenic Milling", desc: "Grinding spices at sub-zero cold temperatures to retain precious natural essential oils.", kashiStage: "Kashi shivering in icy grinding wind." },
    { title: "Ghee Slow-Roasting", desc: "Slow cooking in pure cow ghee for healthy fat enrichment and a satisfying, premium crunch.", kashiStage: "Kashi dancing next to a slow ghee cooker." },
    { title: "Nitrogen Fresh-Pack", desc: "Sealing in thick nitrogen-flushed barrier pouches to lock in flavor and guarantee freshness.", kashiStage: "Kashi jumping into a snack pouch." }
  ]
};

export default function Home() {
  const { addToCart } = useCart();
  const { isAdmin } = useAuth();
  const [liveContent, setLiveContent] = useState(DEFAULT_CONTENT);
  const [loadingContent, setLoadingContent] = useState(true);
  const [dbProducts, setDbProducts] = useState([]);

  // Fetch Homepage Content (Firestore Live or LocalStorage Mock)
  useEffect(() => {
    const fetchContent = async () => {
      // 1. Fetch homepage layout
      if (isFirebaseMock) {
        const local = localStorage.getItem('mock_homepage_content');
        if (local) {
          setLiveContent(JSON.parse(local));
        } else {
          setLiveContent(DEFAULT_CONTENT);
        }
      } else {
        try {
          const docRef = doc(db, 'HomepageContent', 'live');
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setLiveContent(docSnap.data());
          } else {
            setLiveContent(DEFAULT_CONTENT);
          }
        } catch (error) {
          console.error("Firestore home content failed, using fallback:", error);
          setLiveContent(DEFAULT_CONTENT);
        }
      }

      // 2. Fetch products from Firestore
      try {
        if (isFirebaseMock) {
          const mockDb = JSON.parse(localStorage.getItem('mock_products_db') || '[]');
          setDbProducts(mockDb.length > 0 ? mockDb : PRODUCTS);
        } else {
          const querySnapshot = await getDocs(collection(db, 'products'));
          const list = [];
          querySnapshot.forEach((doc) => {
            list.push(doc.data());
          });
          setDbProducts(list);
        }
      } catch (err) {
        console.error("Error loading products for homepage:", err);
        setDbProducts(isFirebaseMock ? PRODUCTS : []);
      }

      setLoadingContent(false);
    };

    fetchContent();

    // Listen for live updates in mock mode
    const handleUpdate = () => fetchContent();
    window.addEventListener('homepage_content_updated', handleUpdate);
    return () => window.removeEventListener('homepage_content_updated', handleUpdate);
  }, []);

  // Filter products based on live featured selections
  const featuredIds = liveContent.featuredSnacks || ['saffron-bhujia', 'turmeric-chivda', 'maroon-makhana'];
  const featuredSnacks = dbProducts.filter(p => featuredIds.includes(p.id));

  // Scrollytelling Setup
  const scrollyContainerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: scrollyContainerRef,
    offset: ["start start", "end end"]
  });

  // Spring animation for smooth mascot tracking
  const smoothProgress = useSpring(scrollYProgress, { stiffness: 100, damping: 20 });

  // Map scroll progress to active stage index (0 to 4)
  const [activeStage, setActiveStage] = useState(0);
  useEffect(() => {
    return scrollYProgress.onChange((v) => {
      const stage = Math.min(Math.floor(v * 5), 4);
      setActiveStage(stage);
    });
  }, [scrollYProgress]);

  // Mascot dynamic transitions
  const mascotY = useTransform(smoothProgress, [0, 0.2, 0.4, 0.6, 0.8, 1], [0, -30, 20, -10, 30, 0]);
  const mascotRotate = useTransform(smoothProgress, [0, 0.25, 0.5, 0.75, 1], [0, 10, -12, 18, 0]);
  const mascotScale = useTransform(smoothProgress, [0, 0.25, 0.5, 0.75, 1], [1, 1.05, 0.95, 1.1, 1]);

  // Custom stage helpers
  const stagesList = (liveContent.storytellingStages && liveContent.storytellingStages.length === 5)
    ? liveContent.storytellingStages
    : DEFAULT_CONTENT.storytellingStages;

  // Floating Molecule Animation Effect (SVG Spices) in Hero
  const heroMoleculeRotate = useTransform(smoothProgress, [0, 1], [0, 180]);

  return (
    <div className="relative">
      {/* 1. HERO SECTION */}
      <section className="relative min-h-[90vh] flex items-center justify-center px-6 overflow-hidden">
        {/* Floating Molecule Animation Effect */}
        <div className="absolute inset-0 pointer-events-none z-0">
          <motion.div 
            style={{ rotate: heroMoleculeRotate }}
            className="absolute top-[20%] left-[10%] w-16 h-16 bg-gradient-to-tr from-saffron/20 to-turmeric/20 rounded-full blur-md"
          />
          <motion.div 
            animate={{ y: [0, 30, 0] }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
            className="absolute bottom-[20%] right-[15%] w-24 h-24 bg-gradient-to-tr from-maroon/20 to-saffron/10 rounded-full blur-md"
          />
          
          {/* Detailed Floating Spice SVGs */}
          <motion.svg 
            animate={{ y: [0, -15, 0], rotate: [0, 45, 0] }}
            transition={{ duration: 6, repeat: Infinity }}
            className="absolute top-[25%] right-[12%] w-12 h-12 text-saffron/40 opacity-70"
            viewBox="0 0 24 24" fill="currentColor"
          >
            {/* Star anise shape */}
            <path d="M12 2l2 4 4-2-2 4 4 2-4 2 2 4-4-2-2 4-2-4-4 2 2-4-4-2 4-2-2-4 4 2z" />
          </motion.svg>
        </div>

        {/* Content container */}
        <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10">
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="flex flex-col gap-6"
          >
            <span className="inline-flex items-center gap-1.5 self-start bg-saffron-light/40 border border-saffron/30 text-saffron-dark px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 animate-spin" /> Pure Indian Spices & Crunch
            </span>
            <h1 className="font-heading font-extrabold text-4xl sm:text-5xl lg:text-6xl text-charcoal leading-tight">
              {liveContent.heroHeadline.split('Traditional').map((part, index) => (
                <React.Fragment key={index}>
                  {index > 0 && <span className="bg-gradient-to-r from-saffron via-maroon to-maroon bg-clip-text text-transparent">Traditional</span>}
                  {part}
                </React.Fragment>
              ))}
            </h1>
            <p className="text-base sm:text-lg text-charcoal/70 leading-relaxed font-body max-w-lg">
              {liveContent.heroSubtext}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 mt-4">
              <Link 
                to="/shop" 
                className="bg-gradient-to-r from-saffron to-saffron-dark hover:from-saffron-dark hover:to-maroon text-white font-heading font-bold px-8 py-4 rounded-full shadow-md hover:shadow-lg transition-all text-center flex items-center justify-center gap-2 group"
              >
                Shop Our Collection
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <a 
                href="#scrollytelling" 
                className="glass-card hover:bg-white/90 text-charcoal font-heading font-bold px-8 py-4 rounded-full text-center flex items-center justify-center transition-colors"
              >
                Our Recipe Secrets
              </a>
            </div>
          </motion.div>

          {/* Hero Premium Glass Card */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1 }}
            className="relative flex justify-center"
          >
            <div className="glass-panel p-6 sm:p-8 rounded-3xl w-full max-w-md shadow-glass-warm border-white/60 relative overflow-hidden bg-white/40">
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-saffron/20 rounded-full blur-2xl"></div>
              
              <img 
                src="/papad_snack_hero.png" 
                alt="Kashid Snacks Hero" 
                className="w-full h-64 object-cover rounded-2xl shadow-md border border-saffron-light/20"
              />
              
              <div className="mt-6 flex justify-between items-center">
                <div>
                  <h3 className="font-heading font-bold text-base text-charcoal">Royal Crunchy Papad</h3>
                  <p className="text-xs text-charcoal/60 mt-0.5">Infused with Black Pepper & Cumin</p>
                </div>
                <span className="font-heading font-extrabold text-lg text-maroon">₹120</span>
              </div>
              
              <div className="mt-4 flex gap-1.5 text-turmeric">
                {[...Array(5)].map((_, i) => <Star key={i} className="w-3.5 h-3.5 fill-current" />)}
                <span className="text-[10px] text-charcoal/50 font-bold ml-1">4.8 (128 reviews)</span>
              </div>

              {(() => {
                const papadProduct = dbProducts.find(p => p.id === 'crunchy-papad') || PRODUCTS.find(p => p.id === 'crunchy-papad') || PRODUCTS[0];
                return (
                  <button 
                    onClick={() => addToCart(papadProduct, 1, papadProduct.variants?.[1] || null)}
                    className="w-full bg-saffron hover:bg-saffron-dark text-white font-heading font-bold py-3 rounded-full mt-6 shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    Add to Cart
                  </button>
                );
              })()}
            </div>
          </motion.div>
        </div>
      </section>      {/* 2. STICKY MASCOT SCROLLYTELLING SECTION */}
      <section 
        id="scrollytelling" 
        ref={scrollyContainerRef} 
        className="relative h-[350vh] bg-gradient-to-b from-transparent via-saffron-light/10 to-transparent"
      >
        {/* Sticky Containment viewport */}
        <div className="sticky top-20 h-[90vh] flex flex-col justify-center overflow-hidden">
          <div className="max-w-7xl mx-auto w-full px-6 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center h-full">
            
            {/* Left Column: Mascot Container (5 Columns) */}
            <div className="lg:col-span-5 flex justify-center items-center h-full max-h-[50vh] lg:max-h-none">
              <div className="glass-panel w-72 h-72 lg:w-96 lg:h-96 rounded-full flex items-center justify-center p-8 shadow-glass-glow border-white/60 relative bg-white/30 backdrop-blur-lg">
                
                {/* Floating ambient halo indicators depending on stage */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-saffron/10 via-maroon/10 to-turmeric/10 blur-xl"></div>
                
                {/* Animated Mascot Image */}
                <motion.div
                  style={{
                    y: mascotY,
                    rotate: mascotRotate,
                    scale: mascotScale
                  }}
                  className="w-full h-full relative z-10 flex items-center justify-center"
                >
                  <KashiMascot stage={activeStage} className="w-full h-full" />
                  
                  {/* Dynamic interactive icons that pop up next to Kashi depending on stage */}
                  {activeStage === 0 && (
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute -top-2 -right-2 bg-saffron text-white p-2.5 rounded-full shadow-md"><Sparkles className="w-4 h-4" /></motion.div>
                  )}
                  {activeStage === 1 && (
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute -top-2 -right-2 bg-turmeric text-charcoal p-2.5 rounded-full shadow-md"><Sun className="w-4 h-4" /></motion.div>
                  )}
                  {activeStage === 2 && (
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute -top-2 -right-2 bg-blue-100 text-blue-700 p-2.5 rounded-full shadow-md"><Droplets className="w-4 h-4" /></motion.div>
                  )}
                  {activeStage === 3 && (
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute -top-2 -right-2 bg-maroon text-white p-2.5 rounded-full shadow-md"><Flame className="w-4 h-4" /></motion.div>
                  )}
                  {activeStage === 4 && (
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute -top-2 -right-2 bg-emerald-600 text-white p-2.5 rounded-full shadow-md"><Package className="w-4 h-4" /></motion.div>
                  )}
                </motion.div>
              </div>
            </div>

            {/* Right Column: Narrative Steps (7 Columns) - Active Slide Animates In */}
            <div className="lg:col-span-7 flex flex-col justify-center min-h-[40vh] relative pr-6">
              <div className="pb-4">
                <span className="text-xs font-bold text-saffron uppercase tracking-widest bg-saffron-light/40 px-3.5 py-1 rounded-full">Kashi's Scrollytelling Journey</span>
                <h2 className="font-heading font-extrabold text-3xl sm:text-4xl text-charcoal mt-3">Crafting Royal Indian Crunch</h2>
                <p className="text-xs text-charcoal/50 mt-1.5">Scroll down to trace Kashi's 5-stage snack preparation narrative</p>
              </div>

              <div className="relative min-h-[220px] flex items-center mt-4">
                <AnimatePresence mode="wait">
                  <motion.div 
                    key={activeStage}
                    initial={{ opacity: 0, x: 40 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -40 }}
                    transition={{ duration: 0.35, ease: "easeInOut" }}
                    className="glass-panel p-6 sm:p-8 rounded-3xl bg-white/70 shadow-md border-saffron/40 w-full"
                  >
                    <h3 className="font-heading font-extrabold text-xl text-charcoal flex items-center gap-2.5 mb-3">
                      <span className="text-xs text-white bg-saffron w-6 h-6 rounded-full flex items-center justify-center font-bold">{activeStage + 1}</span>
                      {stagesList[activeStage]?.title}
                    </h3>
                    <p className="text-sm text-charcoal/70 leading-relaxed font-body">
                      {stagesList[activeStage]?.desc}
                    </p>

                    {/* Progress indicators inside the card */}
                    <div className="flex gap-2 mt-6">
                      {stagesList.map((_, idx) => (
                        <div 
                          key={idx} 
                          className={`h-1.5 rounded-full transition-all duration-300 ${
                            activeStage === idx ? 'bg-saffron w-8' : 'bg-charcoal/10 w-2.5'
                          }`}
                        />
                      ))}
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 3. CATEGORIES SECTION */}
      <section className="py-20 px-6 max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-12">
          <div>
            <span className="text-xs font-bold text-saffron uppercase tracking-widest">Handcrafted Varieties</span>
            <h2 className="font-heading font-extrabold text-3xl text-charcoal mt-2">Explore Categories</h2>
          </div>
          <Link to="/shop" className="text-sm font-bold text-maroon hover:text-saffron flex items-center gap-1 group transition-colors">
            View All Categories <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {CATEGORIES.map((cat) => (
            <Link 
              key={cat.id} 
              to={`/shop?category=${cat.id}`}
              className="glass-card p-4 rounded-2xl flex flex-col gap-4 text-center group bg-white/50 relative overflow-hidden"
            >
              <div className="aspect-square rounded-xl overflow-hidden shadow-sm">
                <img 
                  src={cat.image} 
                  alt={cat.name} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div>
                <h3 className="font-heading font-bold text-sm text-charcoal group-hover:text-saffron transition-colors">{cat.name}</h3>
                <span className="text-[10px] text-charcoal/50 font-semibold uppercase tracking-wider mt-1 inline-block">{cat.count} Items</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 4. POPULAR PRODUCTS SHELF */}
      <section className="py-20 px-6 bg-saffron-light/10 border-y border-saffron-light/20">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-12">
            <div>
              <span className="text-xs font-bold text-saffron uppercase tracking-widest">Fresh From Kitchen</span>
              <h2 className="font-heading font-extrabold text-3xl text-charcoal mt-2">Best Selling Spiced Snacks</h2>
            </div>
            <Link to="/shop" className="text-sm font-bold text-maroon hover:text-saffron flex items-center gap-1 group transition-colors">
              View Entire Shop <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredSnacks.map((product) => (
              <div key={product.id} className="glass-panel p-5 rounded-3xl bg-white/60 relative overflow-hidden flex flex-col h-full group hover:shadow-lg transition-shadow">
                {/* Image */}
                <Link to={`/product/${product.id}`} className="aspect-[4/3] rounded-2xl overflow-hidden shadow-sm border border-saffron-light/20 relative">
                  <img 
                    src={product.images[0]} 
                    alt={product.name} 
                    className="w-full h-full object-cover group-hover:scale-102 transition-transform"
                  />
                  {product.stock <= 10 && (
                    <span className="absolute bottom-3 left-3 bg-maroon text-white text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded">
                      Low Stock
                    </span>
                  )}
                </Link>

                <div className="mt-5 flex-grow">
                  <span className="text-[10px] font-bold text-saffron uppercase tracking-widest">
                    {CATEGORIES.find(c => c.id === product.category)?.name || product.category}
                  </span>
                  <Link to={`/product/${product.id}`} className="block mt-1">
                    <h3 className="font-heading font-bold text-base text-charcoal hover:text-saffron transition-colors truncate">
                      {product.name}
                    </h3>
                  </Link>
                  <p className="text-xs text-charcoal/60 mt-1.5 leading-relaxed font-body line-clamp-2">
                    {product.description}
                  </p>
                </div>

                <div className="mt-5 pt-4 border-t border-saffron-light/20 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-charcoal/50 block">Price ({product.weight})</span>
                    <span className="font-heading font-extrabold text-base text-maroon">₹{product.price}</span>
                  </div>
                  <button 
                    onClick={() => addToCart(product, 1, product.variants?.[0] || null)}
                    className="bg-saffron hover:bg-saffron-dark text-white font-heading font-semibold text-xs px-5 py-2.5 rounded-full shadow-sm hover:shadow transition-colors"
                  >
                    Quick Add
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. UGC / INSTAGRAM GALLERY */}
      <section className="py-20 px-6 max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <span className="text-xs font-bold text-saffron uppercase tracking-widest">#KashidCrunch</span>
          <h2 className="font-heading font-extrabold text-3xl text-charcoal mt-2">Loved by Snackers Across India</h2>
          <p className="text-sm text-charcoal/60 mt-1.5">Tag us on social media for a chance to be featured in our royal gallery.</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="aspect-square rounded-2xl overflow-hidden shadow-sm relative group">
            <img src="https://images.unsplash.com/photo-1599599810769-bcde5a160d32?w=400&q=80" alt="Snack post" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
            <div className="absolute inset-0 bg-maroon/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-heading font-semibold">@riya_snacks</div>
          </div>
          <div className="aspect-square rounded-2xl overflow-hidden shadow-sm relative group">
            <img src="https://images.unsplash.com/photo-1589476993333-f55b84301219?w=400&q=80" alt="Snack post" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
            <div className="absolute inset-0 bg-maroon/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-heading font-semibold">@teatime_crunch</div>
          </div>
          <div className="aspect-square rounded-2xl overflow-hidden shadow-sm relative group">
            <img src="https://images.unsplash.com/photo-1601050690597-df056fb4ce78?w=400&q=80" alt="Snack post" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
            <div className="absolute inset-0 bg-maroon/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-heading font-semibold">@foodie_nikhil</div>
          </div>
          <div className="aspect-square rounded-2xl overflow-hidden shadow-sm relative group">
            <img src="https://images.unsplash.com/photo-1505253716362-afaea1d3d1af?w=400&q=80" alt="Snack post" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
            <div className="absolute inset-0 bg-maroon/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-heading font-semibold">@healthy_crunch</div>
          </div>
        </div>
      </section>

      {isAdmin && (
        <div className="fixed bottom-24 right-6 z-50">
          <Link 
            to="/admin/homepage-editor" 
            className="bg-maroon hover:bg-maroon-dark text-white font-heading font-bold text-xs px-5 py-3.5 rounded-full shadow-2xl flex items-center gap-1.5 transition-all hover:scale-105 cursor-pointer"
          >
            <Package className="w-4 h-4" /> Edit Brand Story
          </Link>
        </div>
      )}
    </div>
  );
}
