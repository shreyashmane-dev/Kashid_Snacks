import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import KashiMascot from '../../components/KashiMascot';

export default function SplashPage() {
  const navigate = useNavigate();

  useEffect(() => {
    const splashShown = sessionStorage.getItem('kashid_splash_shown');
    const onboarded = localStorage.getItem('kashid_onboarded');

    if (splashShown === 'true') {
      if (onboarded === 'true') {
        navigate('/home', { replace: true });
      } else {
        navigate('/onboarding', { replace: true });
      }
      return;
    }

    const timer = setTimeout(() => {
      sessionStorage.setItem('kashid_splash_shown', 'true');
      if (onboarded === 'true') {
        navigate('/home', { replace: true });
      } else {
        navigate('/onboarding', { replace: true });
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-cream overflow-hidden">
      {/* Background spice blobs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-saffron/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-maroon/10 rounded-full blur-[120px] pointer-events-none"></div>
      
      <div className="flex flex-col items-center relative z-10">
        {/* Pulsing Mascot Wrapper */}
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: [1, 1.08, 1], opacity: 1 }}
          transition={{
            scale: { duration: 1.5, repeat: Infinity, ease: "easeInOut" },
            opacity: { duration: 0.8 }
          }}
          className="w-48 h-48 rounded-full bg-gradient-to-tr from-saffron-light/40 to-maroon-light/30 flex items-center justify-center shadow-glass-warm border border-white/40 p-4 mb-6 backdrop-blur-md"
        >
          <KashiMascot stage={0} className="w-full h-full" />
        </motion.div>

        {/* Text Fade-in */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="text-center"
        >
          <span className="font-heading font-extrabold text-3xl tracking-tight bg-gradient-to-r from-saffron-dark via-maroon to-maroon bg-clip-text text-transparent block">
            Kashid Snacks
          </span>
          <span className="text-xs text-charcoal/50 uppercase tracking-widest font-bold mt-2 block">
            Pure Indian Spices & Crunch
          </span>
        </motion.div>

        {/* Loading Bar */}
        <div className="w-40 h-1 bg-saffron-light/30 rounded-full mt-8 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: "100%" }}
            transition={{ duration: 2, ease: "easeInOut" }}
            className="h-full bg-gradient-to-r from-saffron to-maroon"
          />
        </div>
      </div>
    </div>
  );
}
