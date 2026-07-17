import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import KashiMascot from '../../components/KashiMascot';

const ONBOARDING_STEPS = [
  {
    title: "Royal Indian Flavors",
    description: "Sourcing Grade-A spices directly from local farms. Handpicked Kashmiri saffron, Alleppey turmeric, and Byadgi chillies mixed to perfection.",
    image: "", // Rendered via KashiMascot component
    badge: "Traditional Heritage"
  },
  {
    title: "Cryogenic Cold Grinding",
    description: "Our spices are processed under sub-zero temperatures, locking in 100% of the natural essential oils, intense aromas, and rich taste profiles.",
    image: "https://images.unsplash.com/photo-1505253716362-afaea1d3d1af?w=600&q=80",
    badge: "Advanced Tech"
  },
  {
    title: "Nitrogen Freshness Seal",
    description: "No chemical preservatives! We flush every glassmorphic pouch with nitrogen, keeping the crunch fresh and delicious from our kitchen to your home.",
    image: "https://images.unsplash.com/photo-1601050690597-df056fb4ce78?w=600&q=80",
    badge: "100% Pure & Fresh"
  }
];

export default function Onboarding() {
  const [currentStep, setCurrentStep] = useState(0);
  const navigate = useNavigate();

  const handleNext = () => {
    if (currentStep < ONBOARDING_STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleFinish();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleFinish = () => {
    localStorage.setItem('kashid_onboarded', 'true');
    navigate('/home');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-cream px-4 overflow-hidden">
      {/* Background spice blobs */}
      <div className="absolute top-1/4 left-1/3 w-80 h-80 bg-saffron/10 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/3 w-80 h-80 bg-maroon/10 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="glass-panel max-w-xl w-full p-8 rounded-3xl shadow-glass-warm relative overflow-hidden bg-white/40 border-white/60 flex flex-col justify-between min-h-[550px]">
        {/* Skip button top right */}
        <button 
          onClick={handleFinish} 
          className="absolute top-6 right-6 text-xs font-bold text-charcoal/50 hover:text-saffron transition-colors"
        >
          Skip Tutorial
        </button>

        {/* Carousel Slide */}
        <div className="flex-grow flex flex-col items-center justify-center py-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col items-center text-center gap-6"
            >
              {/* Badge */}
              <span className="inline-flex items-center gap-1 bg-saffron-light/40 border border-saffron/30 text-saffron-dark text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                <Sparkles className="w-3 h-3" /> {ONBOARDING_STEPS[currentStep].badge}
              </span>

              {/* Stage Illustration / Image */}
              <div className="w-56 h-40 rounded-2xl overflow-hidden border border-white/60 shadow-md relative bg-white/60 flex items-center justify-center p-2">
                {currentStep === 0 ? (
                  <KashiMascot stage={0} className="w-full h-full" />
                ) : (
                  <img 
                    src={ONBOARDING_STEPS[currentStep].image} 
                    alt={ONBOARDING_STEPS[currentStep].title} 
                    className="w-full h-full object-cover rounded-xl"
                  />
                )}
              </div>

              {/* Text Blocks */}
              <div>
                <h2 className="font-heading font-extrabold text-2xl text-charcoal leading-tight">
                  {ONBOARDING_STEPS[currentStep].title}
                </h2>
                <p className="text-sm text-charcoal/70 leading-relaxed font-body mt-3 max-w-sm mx-auto">
                  {ONBOARDING_STEPS[currentStep].description}
                </p>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Controls and Footer */}
        <div className="border-t border-saffron-light/20 pt-6 flex items-center justify-between">
          {/* Back button */}
          <button
            onClick={handleBack}
            disabled={currentStep === 0}
            className={`p-2 rounded-full border transition-all ${
              currentStep === 0 
                ? 'border-charcoal/10 text-charcoal/20 cursor-not-allowed' 
                : 'border-saffron-light/50 text-charcoal/70 hover:bg-saffron-light/25 hover:text-saffron'
            }`}
            aria-label="Back"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          {/* Dots Indicator */}
          <div className="flex gap-2">
            {ONBOARDING_STEPS.map((_, idx) => (
              <span 
                key={idx} 
                className={`h-2 rounded-full transition-all duration-300 ${
                  currentStep === idx ? 'w-6 bg-saffron' : 'w-2 bg-saffron-light'
                }`}
              />
            ))}
          </div>

          {/* Next / Done button */}
          <button
            onClick={handleNext}
            className="bg-gradient-to-r from-saffron to-saffron-dark hover:from-saffron-dark hover:to-maroon text-white font-heading font-bold text-sm px-6 py-3 rounded-full shadow-md flex items-center gap-1.5 transition-all group"
          >
            <span>{currentStep === ONBOARDING_STEPS.length - 1 ? "Get Started" : "Continue"}</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
}
