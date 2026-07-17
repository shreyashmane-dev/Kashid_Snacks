import React from 'react';
import { WifiOff, RotateCcw, AlertTriangle } from 'lucide-react';
import KashiMascot from '../../components/KashiMascot';

export default function Offline() {
  const handleRetry = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 relative py-16">
      {/* Background blobs */}
      <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-saffron/10 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-maroon/10 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="glass-panel max-w-md w-full p-8 rounded-3xl shadow-glass-warm text-center relative overflow-hidden bg-white/40 border-white/60">
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent pointer-events-none"></div>
        
        {/* Mascot Wrapper */}
        <div className="w-40 h-40 rounded-full bg-saffron-light/20 border border-saffron/20 flex items-center justify-center p-3 mx-auto mb-6">
          <KashiMascot stage={2} className="w-full h-full grayscale opacity-75" />
        </div>

        {/* Warning Indicator */}
        <div className="inline-flex items-center gap-1.5 bg-maroon-light/30 border border-maroon-light/40 text-maroon-dark text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full mb-4">
          <WifiOff className="w-3.5 h-3.5" /> Connection Lost
        </div>

        <h2 className="font-heading font-extrabold text-2xl text-charcoal">Spice Signal Dropped!</h2>
        <p className="text-sm text-charcoal/70 leading-relaxed font-body mt-3 max-w-sm mx-auto">
          Kashi is looking for the network signals. You are currently offline, but you can still browse previously cached pages and snacks!
        </p>

        <div className="mt-8 flex flex-col gap-3">
          <button 
            onClick={handleRetry}
            className="w-full bg-gradient-to-r from-saffron to-saffron-dark hover:from-saffron-dark hover:to-maroon text-white font-heading font-bold py-3.5 rounded-full shadow-md flex items-center justify-center gap-2 transition-all group"
          >
            <RotateCcw className="w-4 h-4 group-hover:rotate-45 transition-transform" />
            Check Connection Again
          </button>
          
          <button 
            onClick={() => window.history.back()}
            className="w-full glass-card hover:bg-white/80 text-charcoal font-heading font-bold py-3.5 rounded-full text-sm transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
}
