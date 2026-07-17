import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ShieldCheck, Info, FileText, ArrowLeft, BookOpen } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db, isFirebaseMock } from '../../config/firebase';

const DEFAULT_ABOUT_STORY = {
  title: "Our Heritage & Story",
  tag: "Handcrafted Legacies",
  intro: "Founded in Pune, Kashid Snacks began with a simple vision: to elevate traditional Indian namkeen into a premium culinary experience. Named after our master chef family lineage, we combine regional spice blends with state-of-the-art preparation methods.",
  mascotPara: "Our mascot, Kashi—the friendly personified spice jar—represents our commitment to keeping flavors natural, fresh, and close to home. Every snack we craft uses authentic Kashmiri saffron, Alleppey turmeric, and spicy Byadgi chillies sourced directly from verified farmer clusters.",
  whyHeading: "Why Kashid is Different?",
  bullet1: "Cryogenic Grinding: We mill spices at sub-zero temperatures to preserve volatile aromatic oils that traditional hot-stone grinding burns away.",
  bullet2: "Zero Added Preservatives: We rely exclusively on nitrogen-flushed barrier pouches to lock in flavor and guarantee a crisp crunch.",
  bullet3: "Ghee-Roasted Ranges: Our healthy snack options (like makhana) are slow-roasted in pure, anti-inflammatory cow ghee rather than refined seed oils.",
};

function AboutContent({ story }) {
  const renderBullet = (text) => {
    if (!text) return null;
    const colonIdx = text.indexOf(':');
    if (colonIdx > -1) {
      const title = text.substring(0, colonIdx);
      const rest = text.substring(colonIdx + 1);
      return <><strong>{title}:</strong>{rest}</>;
    }
    return text;
  };

  return (
    <div className="space-y-6 text-sm text-charcoal/80 leading-relaxed font-body">
      <p>{story.intro}</p>
      <p>{story.mascotPara}</p>
      <h4 className="font-heading font-extrabold text-base text-maroon mt-6">{story.whyHeading}</h4>
      <ul className="list-disc pl-5 space-y-2">
        {[story.bullet1, story.bullet2, story.bullet3].filter(Boolean).map((b, i) => (
          <li key={i}>{renderBullet(b)}</li>
        ))}
      </ul>
    </div>
  );
}

const STATIC_CONTENTS = {
  terms: {
    title: "Terms & Conditions",
    icon: FileText,
    tag: "Legal Framework",
    content: (
      <div className="space-y-6 text-sm text-charcoal/80 leading-relaxed font-body">
        <p>
          Welcome to Kashid Snacks. By accessing and installing this Progressive Web App (PWA), you agree to comply with and be bound by the following terms of service.
        </p>
        <h4 className="font-heading font-extrabold text-base text-maroon">1. Deliveries and Returns</h4>
        <p>
          Orders placed before 2:00 PM are dispatched on the same business day. Delivery times range from 2 to 5 business days depending on location. Due to the perishable food nature of snacks, we only accept returns if the seal was damaged prior to delivery.
        </p>
        <h4 className="font-heading font-extrabold text-base text-maroon">2. Payments</h4>
        <p>
          All electronic transactions are processed securely via our payments partner Razorpay. Cash on Delivery (COD) is available in select pin codes only, with a maximum order limit of ₹2,500.
        </p>
      </div>
    )
  },
  privacy: {
    title: "Privacy Policy",
    icon: ShieldCheck,
    tag: "Data Protection",
    content: (
      <div className="space-y-6 text-sm text-charcoal/80 leading-relaxed font-body">
        <p>
          Your privacy is paramount. Kashid Snacks Pvt Ltd collects user profiles, delivery addresses, and cart logs strictly to complete transaction processing and fulfill deliveries.
        </p>
        <h4 className="font-heading font-extrabold text-base text-maroon">1. Security & Firebase Authentication</h4>
        <p>
          We utilize Google Firebase Authentication for secure client logins, and Firestore databases for order archiving. None of your passwords or credential entries are stored in plaintext. We implement rate limiting blocks on login inputs to safeguard account security.
        </p>
        <h4 className="font-heading font-extrabold text-base text-maroon">2. Cookies & LocalStorage</h4>
        <p>
          We store guest cart arrays and installation prompt statuses in local browser storage to provide a seamless e-commerce PWA experience even during network interruptions.
        </p>
      </div>
    )
  }
};

export default function StaticPage() {
  const { pageId } = useParams();
  const [aboutStory, setAboutStory] = useState(null);
  const [aboutLoading, setAboutLoading] = useState(pageId === 'about');

  // Load dynamic About/Our Story content
  useEffect(() => {
    if (pageId !== 'about') return;

    const loadAbout = async () => {
      try {
        if (isFirebaseMock) {
          const saved = localStorage.getItem('admin_our_story');
          setAboutStory(saved ? JSON.parse(saved) : DEFAULT_ABOUT_STORY);
        } else {
          const snap = await getDoc(doc(db, 'site_content', 'about'));
          setAboutStory(snap.exists() ? { ...DEFAULT_ABOUT_STORY, ...snap.data() } : DEFAULT_ABOUT_STORY);
        }
      } catch {
        setAboutStory(DEFAULT_ABOUT_STORY);
      } finally {
        setAboutLoading(false);
      }
    };

    loadAbout();
  }, [pageId]);

  // Render the about page dynamically
  if (pageId === 'about') {
    if (aboutLoading) {
      return (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-saffron border-t-transparent rounded-full animate-spin" />
        </div>
      );
    }

    const story = aboutStory || DEFAULT_ABOUT_STORY;
    return (
      <div className="max-w-4xl mx-auto px-6 py-12 relative">
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-saffron/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-maroon/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="mb-6">
          <Link to="/home" className="inline-flex items-center gap-1.5 text-xs font-bold text-charcoal/60 hover:text-saffron transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Home
          </Link>
        </div>

        <div className="glass-panel p-8 sm:p-12 rounded-3xl bg-white/40 border-white/60 shadow-glass-warm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-saffron/10 to-transparent pointer-events-none" />
          <div className="flex items-center gap-4 mb-8 pb-6 border-b border-saffron-light/20">
            <div className="w-12 h-12 rounded-2xl bg-saffron-light/30 border border-saffron/20 text-saffron flex items-center justify-center shadow-sm">
              <Info className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-saffron uppercase tracking-widest block">{story.tag}</span>
              <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-charcoal mt-1">{story.title}</h1>
            </div>
          </div>
          <AboutContent story={story} />
        </div>
      </div>
    );
  }

  // Static pages (terms, privacy)
  const page = STATIC_CONTENTS[pageId] || STATIC_CONTENTS.terms;
  const Icon = page.icon;

  return (
    <div className="max-w-4xl mx-auto px-6 py-12 relative">
      <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-saffron/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-maroon/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="mb-6">
        <Link to="/home" className="inline-flex items-center gap-1.5 text-xs font-bold text-charcoal/60 hover:text-saffron transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>
      </div>

      <div className="glass-panel p-8 sm:p-12 rounded-3xl bg-white/40 border-white/60 shadow-glass-warm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-saffron/10 to-transparent pointer-events-none" />

        <div className="flex items-center gap-4 mb-8 pb-6 border-b border-saffron-light/20">
          <div className="w-12 h-12 rounded-2xl bg-saffron-light/30 border border-saffron/20 text-saffron flex items-center justify-center shadow-sm">
            <Icon className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-saffron uppercase tracking-widest block">{page.tag}</span>
            <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-charcoal mt-1">{page.title}</h1>
          </div>
        </div>

        {page.content}
      </div>
    </div>
  );
}
