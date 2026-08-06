import { useState, useRef, useEffect } from 'react';
import Modal from './Modal';
import { ShieldAlert } from 'lucide-react';

export default function BetaWarningPopup() {
  const [isOpen, setIsOpen] = useState(true);
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  const scrollRef = useRef(null);

  const handleClose = () => {
    if (hasScrolledToBottom) {
      setIsOpen(false);
    }
  };

  const handleScroll = () => {
    if (scrollRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
      // Allow a 10px margin of error for different device pixel ratios
      if (Math.abs(scrollHeight - clientHeight - scrollTop) < 10) {
        setHasScrolledToBottom(true);
      }
    }
  };

  useEffect(() => {
    // Check if scrolling is even necessary on mount
    if (scrollRef.current) {
      const { scrollHeight, clientHeight } = scrollRef.current;
      if (scrollHeight <= clientHeight) {
        setHasScrolledToBottom(true);
      }
    }
  }, []);

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="md">
      <div className="flex flex-col max-h-[80vh]">
        
        {/* Scrollable Content */}
        <div 
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex flex-col space-y-3 overflow-y-auto pr-3 pl-1 pb-4 scrollbar-thin scrollbar-thumb-gray-200 mt-1"
        >
          
          {/* Header Icon & Title */}
        <div className="flex flex-col items-center text-center space-y-2 pt-1">
          <div className="w-12 h-12 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center ring-4 ring-red-50/50 mb-1">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-gray-900 tracking-tight">JeevaLink Beta Notice</h2>
            <div className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">
              © 2026 Trawbit Technologies
            </div>
          </div>
        </div>

        {/* Highlighted Warning */}
        <div className="bg-amber-50 text-amber-800 p-3 rounded-xl text-xs border border-amber-200/50 text-center leading-relaxed">
          This platform is currently under development and is intended <strong className="text-amber-900 font-bold">for testing purposes only</strong>.
        </div>

        {/* Rules List */}
        <div className="space-y-2.5">
          <p className="font-semibold text-gray-900 text-xs">By continuing, you agree to the following:</p>

          <ul className="space-y-2.5 text-[12px] text-gray-600 bg-slate-50 border border-slate-100 p-3.5 rounded-xl">
            <li className="flex items-start gap-2">
              <span className="text-red-500 font-bold shrink-0 mt-0.5">•</span>
              <span className="leading-relaxed"><strong>Do not use real personal information</strong> (phone numbers, addresses, ID, medical details). Use <strong>dummy data only</strong>.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 font-bold shrink-0 mt-0.5">•</span>
              <span className="leading-relaxed"><strong>You may use your real email address only</strong> for account registration and verification.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-500 font-bold shrink-0 mt-0.5">•</span>
              <span className="leading-relaxed"><strong>Do not share</strong> this testing link, credentials, or content with unauthorized individuals.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-slate-400 font-bold shrink-0 mt-0.5">•</span>
              <span className="leading-relaxed">Features may contain bugs or be temporarily unavailable.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-slate-400 font-bold shrink-0 mt-0.5">•</span>
              <span className="leading-relaxed">Test data may be modified or deleted at any time.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-500 font-bold shrink-0 mt-0.5">•</span>
              <span className="leading-relaxed">Any misuse or abuse of this platform may result in immediate termination of testing access.</span>
            </li>
          </ul>
        </div>

        </div>

        {/* Fixed Footer & Action */}
        <div className="pt-4 border-t border-slate-100 mt-1 shrink-0">
          <p className="text-xs text-gray-500 text-center mb-3 transition-colors">
            {hasScrolledToBottom
              ? <span>By selecting <strong>"I Agree"</strong>, you accept these terms.</span>
              : <span className="text-amber-600 font-medium animate-pulse">Please <strong>scroll down</strong> to accept terms.</span>
            }
          </p>

          <button
            onClick={handleClose}
            disabled={!hasScrolledToBottom}
            className={`w-full font-bold py-3 px-4 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 text-sm
              ${hasScrolledToBottom
                ? 'bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/20 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
              }`}
          >
            I Agree
          </button>
        </div>

      </div>
    </Modal>
  );
}
