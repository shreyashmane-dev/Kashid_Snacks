import React, { useState, useEffect } from 'react';
import { db, isFirebaseMock } from '../../config/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { Home, Save, Sparkles, Image, Check, Plus, Trash2, ArrowLeft } from 'lucide-react';
import { uploadToCloudinary } from '../../config/cloudinary';

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

export default function HomepageContentEditor() {
  const [content, setContent] = useState(DEFAULT_CONTENT);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  
  // Banner upload helper states
  const [uploadingIndex, setUploadingIndex] = useState(null);

  useEffect(() => {
    const fetchHomeContent = async () => {
      if (isFirebaseMock) {
        const local = localStorage.getItem('mock_homepage_content');
        if (local) {
          setContent(JSON.parse(local));
        }
      } else {
        try {
          const docRef = doc(db, 'HomepageContent', 'live');
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setContent(docSnap.data());
          }
        } catch (error) {
          console.error("Error fetching Firestore homepage content:", error);
        }
      }
      setLoading(false);
    };

    fetchHomeContent();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    
    if (isFirebaseMock) {
      localStorage.setItem('mock_homepage_content', JSON.stringify(content));
      // Dispatch custom event to let client tabs know settings changed live
      window.dispatchEvent(new Event('homepage_content_updated'));
      setTimeout(() => {
        setSaving(false);
        setMessage("Homepage content saved locally!");
        setTimeout(() => setMessage(''), 3000);
      }, 1000);
    } else {
      try {
        await setDoc(doc(db, 'HomepageContent', 'live'), {
          ...content,
          updatedAt: new Date().toISOString()
        });
        setSaving(false);
        setMessage("Homepage content updated live on Firestore!");
        setTimeout(() => setMessage(''), 3000);
      } catch (error) {
        console.error("Save content failed:", error);
        setSaving(false);
      }
    }
  };

  const handleBannerUpload = async (index, file) => {
    if (!file) return;
    try {
      setUploadingIndex(index);
      const url = await uploadToCloudinary(file);
      const updatedBanners = [...content.banners];
      updatedBanners[index].image = url;
      setContent({ ...content, banners: updatedBanners });
    } catch (err) {
      alert("Image upload failed: " + err.message);
    } finally {
      setUploadingIndex(null);
    }
  };

  const addBanner = () => {
    const newBanner = {
      id: Date.now(),
      title: "New Festive Banner",
      image: "https://images.unsplash.com/photo-1589476993333-f55b84301219?w=800&q=80",
      link: "/shop"
    };
    setContent({ ...content, banners: [...content.banners, newBanner] });
  };

  const removeBanner = (id) => {
    setContent({ ...content, banners: content.banners.filter(b => b.id !== id) });
  };

  const handleStageChange = (index, field, value) => {
    const updatedStages = [...content.storytellingStages];
    updatedStages[index][field] = value;
    setContent({ ...content, storytellingStages: updatedStages });
  };

  if (loading) {
    return <div className="p-8 text-center text-charcoal/60">Loading Content Settings...</div>;
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-cream-dark">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-saffron/10 text-saffron flex items-center justify-center">
            <Home className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-heading font-extrabold text-2xl text-charcoal">Edit Homepage Content</h1>
            <p className="text-xs text-charcoal/50">Edit Hero text, banners, storytelling stages, and featured lists live</p>
          </div>
        </div>
        
        <button 
          onClick={handleSave}
          disabled={saving}
          className="bg-maroon hover:bg-maroon-dark text-white font-heading font-bold px-6 py-3 rounded-full flex items-center gap-2 shadow-md transition-colors disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Saving...' : 'Save Live Content'}
        </button>
      </div>

      {message && (
        <div className="bg-emerald-100 border border-emerald-300 text-emerald-800 rounded-xl p-4 mb-6 flex items-center gap-2">
          <Check className="w-5 h-5" />
          <span className="text-sm font-bold">{message}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-8">
        {/* HERO CONTENT PANEL */}
        <div className="glass-panel p-6 rounded-3xl bg-white/40 space-y-4">
          <h2 className="font-heading font-bold text-lg text-charcoal border-b border-saffron-light/10 pb-2 flex items-center gap-1.5"><Sparkles className="w-5 h-5 text-saffron" /> Hero Section</h2>
          
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-xs font-bold text-charcoal/80 uppercase tracking-wider mb-1.5">Hero Headline Title</label>
              <input 
                type="text" 
                value={content.heroHeadline}
                onChange={e => setContent({ ...content, heroHeadline: e.target.value })}
                className="w-full glass-input rounded-xl p-3.5 text-sm" 
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-charcoal/80 uppercase tracking-wider mb-1.5">Hero Subtext Description</label>
              <textarea 
                value={content.heroSubtext}
                onChange={e => setContent({ ...content, heroSubtext: e.target.value })}
                className="w-full glass-input rounded-xl p-3.5 text-sm h-24 resize-none" 
                required
              />
            </div>
          </div>
        </div>

        {/* STORYTELLING STAGES PANEL */}
        <div className="glass-panel p-6 rounded-3xl bg-white/40 space-y-6">
          <h2 className="font-heading font-bold text-lg text-charcoal border-b border-saffron-light/10 pb-2">Mascot Scrollytelling Stages (5 Narrative Blocks)</h2>
          
          <div className="space-y-6">
            {content.storytellingStages.map((stage, idx) => (
              <div key={idx} className="p-4 rounded-2xl bg-white/50 border border-saffron-light/20 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-charcoal/80 uppercase mb-1">Stage {idx + 1} Title</label>
                  <input 
                    type="text" 
                    value={stage.title} 
                    onChange={e => handleStageChange(idx, 'title', e.target.value)}
                    className="w-full glass-input rounded-lg p-2 text-xs font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-charcoal/80 uppercase mb-1">Description</label>
                  <input 
                    type="text" 
                    value={stage.desc} 
                    onChange={e => handleStageChange(idx, 'desc', e.target.value)}
                    className="w-full glass-input rounded-lg p-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-charcoal/80 uppercase mb-1">Kashi Mascot Action</label>
                  <input 
                    type="text" 
                    value={stage.kashiStage || ''} 
                    onChange={e => handleStageChange(idx, 'kashiStage', e.target.value)}
                    className="w-full glass-input rounded-lg p-2 text-xs font-mono text-saffron-dark bg-saffron-light/10"
                    placeholder="Mascot actions details"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* PROMO BANNERS PANEL */}
        <div className="glass-panel p-6 rounded-3xl bg-white/40 space-y-6">
          <div className="flex justify-between items-center border-b border-saffron-light/10 pb-2">
            <h2 className="font-heading font-bold text-lg text-charcoal">Promotional Carousels & Banners</h2>
            <button 
              type="button"
              onClick={addBanner}
              className="text-xs font-bold text-saffron flex items-center gap-1 hover:underline"
            >
              <Plus className="w-4 h-4" /> Add Banner
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {content.banners.map((banner, idx) => (
              <div key={banner.id} className="p-4 rounded-2xl bg-white/50 border border-saffron-light/20 relative flex flex-col gap-3">
                <button 
                  type="button"
                  onClick={() => removeBanner(banner.id)}
                  className="absolute top-3 right-3 p-1.5 rounded-full hover:bg-maroon-light/20 text-charcoal/30 hover:text-maroon transition-colors"
                  title="Remove banner"
                >
                  <Trash2 className="w-4 h-4" />
                </button>

                <div className="aspect-[2/1] rounded-xl overflow-hidden bg-cream border border-saffron-light/10 relative">
                  <img src={banner.image} alt={banner.title} className="w-full h-full object-cover" />
                  <div className="absolute bottom-2 right-2">
                    <label className="bg-charcoal/70 text-white rounded-full p-2 text-xs flex items-center gap-1.5 cursor-pointer hover:bg-charcoal">
                      <Image className="w-4 h-4" />
                      <span className="text-[10px]">{uploadingIndex === idx ? 'Uploading...' : 'Change Image'}</span>
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={e => handleBannerUpload(idx, e.target.files[0])} 
                      />
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-charcoal/60 uppercase">Banner Headline</label>
                    <input 
                      type="text" 
                      value={banner.title} 
                      onChange={e => {
                        const updated = [...content.banners];
                        updated[idx].title = e.target.value;
                        setContent({ ...content, banners: updated });
                      }}
                      className="w-full glass-input rounded-lg p-2 text-xs font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-charcoal/60 uppercase">Target Redirect Link</label>
                    <input 
                      type="text" 
                      value={banner.link} 
                      onChange={e => {
                        const updated = [...content.banners];
                        updated[idx].link = e.target.value;
                        setContent({ ...content, banners: updated });
                      }}
                      className="w-full glass-input rounded-lg p-2 text-xs"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </form>
    </div>
  );
}
