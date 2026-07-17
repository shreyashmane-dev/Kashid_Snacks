import React, { useState, useEffect } from 'react';
import { Settings, Shield, MapPin, Sparkles, MessageSquare } from 'lucide-react';

export default function StoreSettings() {
  const [deliveryFee, setDeliveryFee] = useState(40);
  const [freeThreshold, setFreeThreshold] = useState(200);
  const [heroHeading, setHeroHeading] = useState("A Modern Spin On Traditional Taste.");
  const [heroSub, setHeroSub] = useState("Indulge in India's finest snacking heritage. Experience our handcrafted collection wrapped in premium glassmorphic freshness.");

  const [address, setAddress] = useState("Spice Bhavan, Sector 12, Pune, MH");
  const [helpline, setHelpline] = useState("+91 820 546 0ef8");

  const [success, setSuccess] = useState('');

  const handleSave = (e) => {
    e.preventDefault();
    // Save to localstorage stubs
    localStorage.setItem('admin_delivery_fee', deliveryFee);
    localStorage.setItem('admin_free_threshold', freeThreshold);
    localStorage.setItem('admin_hero_heading', heroHeading);
    localStorage.setItem('admin_hero_sub', heroSub);
    localStorage.setItem('admin_store_address', address);
    localStorage.setItem('admin_store_helpline', helpline);

    setSuccess("Store settings updated successfully!");
    setTimeout(() => setSuccess(''), 3000);
  };

  return (
    <div className="space-y-6 max-w-3xl relative z-10">
      {success && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs px-4 py-2.5 rounded-xl">
          {success}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Logistics & Delivery Settings */}
        <div className="glass-panel p-6 rounded-3xl bg-white/40 border-white/60 space-y-4">
          <h3 className="font-heading font-bold text-base text-charcoal flex items-center gap-2 border-b border-saffron-light/20 pb-2">
            <Settings className="w-5 h-5 text-saffron" /> Logistics & Shipping
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-charcoal/60 uppercase mb-1.5 ml-1">Standard Delivery Fee (₹)</label>
              <input 
                type="number" 
                value={deliveryFee}
                onChange={e => setDeliveryFee(Number(e.target.value))}
                className="w-full glass-input rounded-full py-2.5 px-4 text-xs font-bold"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-charcoal/60 uppercase mb-1.5 ml-1">Free Shipping Threshold (₹)</label>
              <input 
                type="number" 
                value={freeThreshold}
                onChange={e => setFreeThreshold(Number(e.target.value))}
                className="w-full glass-input rounded-full py-2.5 px-4 text-xs font-bold"
              />
            </div>
          </div>
        </div>

        {/* Content management */}
        <div className="glass-panel p-6 rounded-3xl bg-white/40 border-white/60 space-y-4">
          <h3 className="font-heading font-bold text-base text-charcoal flex items-center gap-2 border-b border-saffron-light/20 pb-2">
            <Sparkles className="w-5 h-5 text-maroon" /> Homepage Content
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-charcoal/60 uppercase mb-1.5 ml-1">Hero Section Main Heading</label>
              <input 
                type="text" 
                value={heroHeading}
                onChange={e => setHeroHeading(e.target.value)}
                className="w-full glass-input rounded-full py-2.5 px-4 text-xs font-semibold"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-charcoal/60 uppercase mb-1.5 ml-1">Hero Section Subtext Description</label>
              <textarea 
                value={heroSub}
                onChange={e => setHeroSub(e.target.value)}
                rows={3}
                className="w-full glass-input rounded-2xl py-3 px-4 text-xs font-medium resize-none"
              />
            </div>
          </div>
        </div>

        {/* Store Contacts */}
        <div className="glass-panel p-6 rounded-3xl bg-white/40 border-white/60 space-y-4">
          <h3 className="font-heading font-bold text-base text-charcoal flex items-center gap-2 border-b border-saffron-light/20 pb-2">
            <MapPin className="w-5 h-5 text-turmeric-dark" /> Store Contact Details
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-charcoal/60 uppercase mb-1.5 ml-1">Store Physical Location Address</label>
              <input 
                type="text" 
                value={address}
                onChange={e => setAddress(e.target.value)}
                className="w-full glass-input rounded-full py-2.5 px-4 text-xs font-semibold"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-charcoal/60 uppercase mb-1.5 ml-1">Customer Helpline Contact</label>
              <input 
                type="text" 
                value={helpline}
                onChange={e => setHelpline(e.target.value)}
                className="w-full glass-input rounded-full py-2.5 px-4 text-xs font-semibold"
              />
            </div>
          </div>
        </div>

        <button 
          type="submit"
          className="w-full bg-gradient-to-r from-saffron to-saffron-dark hover:from-saffron-dark hover:to-maroon text-white font-heading font-bold py-3.5 rounded-full shadow-md transition-all text-sm flex items-center justify-center gap-1.5"
        >
          Save All Store Configurations
        </button>
      </form>
    </div>
  );
}
