import React, { useState, useEffect } from 'react';
import { BookOpen, Save, Eye, EyeOff, Sparkles, RotateCcw } from 'lucide-react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db, isFirebaseMock } from '../../config/firebase';

const STORAGE_KEY = 'admin_our_story';

const DEFAULT_STORY = {
  title: "Our Heritage & Story",
  tag: "Handcrafted Legacies",
  intro: "Founded in Pune, Kashid Snacks began with a simple vision: to elevate traditional Indian namkeen into a premium culinary experience. Named after our master chef family lineage, we combine regional spice blends with state-of-the-art preparation methods.",
  mascotPara: "Our mascot, Kashi—the friendly personified spice jar—represents our commitment to keeping flavors natural, fresh, and close to home. Every snack we craft uses authentic Kashmiri saffron, Alleppey turmeric, and spicy Byadgi chillies sourced directly from verified farmer clusters.",
  whyHeading: "Why Kashid is Different?",
  bullet1: "Cryogenic Grinding: We mill spices at sub-zero temperatures to preserve volatile aromatic oils that traditional hot-stone grinding burns away.",
  bullet2: "Zero Added Preservatives: We rely exclusively on nitrogen-flushed barrier pouches to lock in flavor and guarantee a crisp crunch.",
  bullet3: "Ghee-Roasted Ranges: Our healthy snack options (like makhana) are slow-roasted in pure, anti-inflammatory cow ghee rather than refined seed oils.",
};

export default function OurStoryEditor() {
  const [form, setForm] = useState(DEFAULT_STORY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  // Load existing content on mount
  useEffect(() => {
    const loadContent = async () => {
      try {
        if (isFirebaseMock) {
          const saved = localStorage.getItem(STORAGE_KEY);
          if (saved) setForm(JSON.parse(saved));
        } else {
          const snap = await getDoc(doc(db, 'site_content', 'about'));
          if (snap.exists()) {
            setForm({ ...DEFAULT_STORY, ...snap.data() });
          }
        }
      } catch (err) {
        console.error('Failed to load Our Story content:', err);
      } finally {
        setLoading(false);
      }
    };
    loadContent();
  }, []);

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSuccess('');
    try {
      if (isFirebaseMock) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(form));
      } else {
        await setDoc(doc(db, 'site_content', 'about'), form, { merge: true });
      }
      setSuccess('Our Story content saved successfully! Changes are live on the About page.');
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      console.error('Failed to save Our Story:', err);
      setSuccess('Error saving content. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (window.confirm('Reset to default content? This will overwrite your edits.')) {
      setForm(DEFAULT_STORY);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-saffron border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl relative z-10">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="font-heading font-extrabold text-xl text-slate-800 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-saffron" /> Our Story Editor
          </h2>
          <p className="text-xs text-slate-500 mt-1">Edit the content shown on the public /info/about page.</p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setShowPreview(!showPreview)}
            className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-heading font-bold text-xs px-4 py-2 rounded-full transition-colors"
          >
            {showPreview ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            {showPreview ? 'Hide Preview' : 'Live Preview'}
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 font-heading font-bold text-xs px-4 py-2 rounded-full transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Reset
          </button>
        </div>
      </div>

      {success && (
        <div className={`text-xs px-4 py-3 rounded-xl font-semibold ${
          success.startsWith('Error') 
            ? 'bg-rose-50 border border-rose-200 text-rose-700'
            : 'bg-emerald-50 border border-emerald-200 text-emerald-800'
        }`}>
          {success}
        </div>
      )}

      <div className={`grid gap-6 ${showPreview ? 'grid-cols-1 xl:grid-cols-2' : 'grid-cols-1'}`}>
        {/* EDITOR FORM */}
        <form onSubmit={handleSave} className="space-y-5">
          {/* Page Metadata */}
          <div className="glass-panel p-6 rounded-3xl bg-white/60 border-white/80 space-y-4">
            <h3 className="font-heading font-bold text-sm text-slate-700 flex items-center gap-2 border-b border-slate-100 pb-2">
              <Sparkles className="w-4 h-4 text-saffron" /> Page Header
            </h3>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5 ml-1">Page Title</label>
              <input
                type="text"
                value={form.title}
                onChange={e => handleChange('title', e.target.value)}
                className="w-full glass-input rounded-full py-2.5 px-4 text-sm font-semibold"
                placeholder="Our Heritage & Story"
                required
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5 ml-1">Tag / Badge Text</label>
              <input
                type="text"
                value={form.tag}
                onChange={e => handleChange('tag', e.target.value)}
                className="w-full glass-input rounded-full py-2.5 px-4 text-xs font-semibold"
                placeholder="Handcrafted Legacies"
              />
            </div>
          </div>

          {/* Main Content */}
          <div className="glass-panel p-6 rounded-3xl bg-white/60 border-white/80 space-y-4">
            <h3 className="font-heading font-bold text-sm text-slate-700 border-b border-slate-100 pb-2">Main Body Content</h3>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5 ml-1">Intro Paragraph</label>
              <textarea
                value={form.intro}
                onChange={e => handleChange('intro', e.target.value)}
                rows={4}
                className="w-full glass-input rounded-2xl py-3 px-4 text-xs font-medium resize-none leading-relaxed"
                placeholder="Founded in Pune..."
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5 ml-1">Mascot / Ingredients Paragraph</label>
              <textarea
                value={form.mascotPara}
                onChange={e => handleChange('mascotPara', e.target.value)}
                rows={3}
                className="w-full glass-input rounded-2xl py-3 px-4 text-xs font-medium resize-none leading-relaxed"
                placeholder="Our mascot, Kashi..."
              />
            </div>
          </div>

          {/* Why Different */}
          <div className="glass-panel p-6 rounded-3xl bg-white/60 border-white/80 space-y-4">
            <h3 className="font-heading font-bold text-sm text-slate-700 border-b border-slate-100 pb-2">USP Section — "Why Different?"</h3>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5 ml-1">Section Heading</label>
              <input
                type="text"
                value={form.whyHeading}
                onChange={e => handleChange('whyHeading', e.target.value)}
                className="w-full glass-input rounded-full py-2.5 px-4 text-xs font-semibold"
                placeholder="Why Kashid is Different?"
              />
            </div>
            {[
              { field: 'bullet1', label: 'USP Point 1' },
              { field: 'bullet2', label: 'USP Point 2' },
              { field: 'bullet3', label: 'USP Point 3' },
            ].map(({ field, label }) => (
              <div key={field}>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5 ml-1">{label}</label>
                <textarea
                  value={form[field]}
                  onChange={e => handleChange(field, e.target.value)}
                  rows={2}
                  className="w-full glass-input rounded-2xl py-2.5 px-4 text-xs font-medium resize-none"
                  placeholder="Point title: Description..."
                />
              </div>
            ))}
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-gradient-to-r from-saffron to-saffron-dark hover:from-saffron-dark hover:to-maroon text-white font-heading font-bold py-3.5 rounded-full shadow-md transition-all text-sm flex items-center justify-center gap-2 disabled:opacity-70"
          >
            {saving ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {saving ? 'Saving...' : 'Save & Publish Our Story'}
          </button>
        </form>

        {/* LIVE PREVIEW */}
        {showPreview && (
          <div className="glass-panel p-8 rounded-3xl bg-white/50 border-white/70 space-y-6 h-fit sticky top-4">
            <div className="flex items-center gap-3 pb-5 border-b border-saffron-light/20">
              <div className="w-10 h-10 rounded-xl bg-saffron-light/30 border border-saffron/20 text-saffron flex items-center justify-center">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-saffron uppercase tracking-widest block">{form.tag}</span>
                <h2 className="font-heading font-extrabold text-xl text-charcoal mt-0.5">{form.title}</h2>
              </div>
            </div>
            <div className="space-y-4 text-sm text-charcoal/80 leading-relaxed">
              <p>{form.intro}</p>
              <p>{form.mascotPara}</p>
              <h4 className="font-heading font-extrabold text-base text-maroon mt-4">{form.whyHeading}</h4>
              <ul className="list-disc pl-5 space-y-2 text-sm">
                {[form.bullet1, form.bullet2, form.bullet3].filter(Boolean).map((b, i) => {
                  const [title, ...rest] = b.split(':');
                  return (
                    <li key={i}>
                      {rest.length > 0 ? <><strong>{title}:</strong>{rest.join(':')}</> : b}
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
