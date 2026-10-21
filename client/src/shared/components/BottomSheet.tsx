import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  maxHeight?: string;
}

export const BottomSheet: React.FC<BottomSheetProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxHeight = 'max-h-[92vh]'
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      {/* Click outside to close */}
      <div className="flex-1" onClick={onClose} />

      {/* Sheet Container */}
      <div
        className={`w-full max-w-lg mx-auto bg-[#0d121f] border-t border-slate-800 rounded-t-[28px] shadow-2xl flex flex-col ${maxHeight} overflow-hidden animate-in slide-in-from-bottom-5 duration-200`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Drag Pill */}
        <div className="pt-3 pb-1 flex justify-center cursor-grab active:cursor-grabbing" onClick={onClose}>
          <div className="w-12 h-1.5 rounded-full bg-slate-700/80 hover:bg-slate-600 transition-colors" />
        </div>

        {/* Header */}
        {(title || subtitle) && (
          <div className="px-5 py-3 border-b border-slate-800/80 flex items-center justify-between">
            <div>
              {title && <h3 className="text-base font-bold text-white tracking-tight">{title}</h3>}
              {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Sheet Content Body */}
        <div className="p-5 overflow-y-auto flex-1 safe-bottom overscroll-contain">
          {children}
        </div>
      </div>
    </div>
  );
};
