import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Info,
  X,
  ArrowRight,
} from 'lucide-react';
import { ToastItem, ToastType } from '../types';
import { useApp } from '../context/AppContext';

interface ToastItemProps {
  toast: ToastItem;
  onDismiss: (id: string) => void;
  isLight?: boolean;
}

const getToastConfig = (type: ToastType, isLight: boolean = false) => {
  switch (type) {
    case 'success':
      return {
        icon: CheckCircle2,
        bgGradient: isLight ? 'bg-white' : 'from-slate-900 via-slate-900 to-slate-950',
        borderColor: isLight
          ? 'border-emerald-500 shadow-xl shadow-emerald-500/10'
          : 'border-emerald-500/60 shadow-emerald-950/50',
        iconBg: isLight
          ? 'bg-emerald-100 text-emerald-700 border border-emerald-300'
          : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40',
        iconColor: isLight ? '#059669' : '#34d399',
        barColor: isLight ? 'bg-emerald-600' : 'bg-emerald-400',
        barTrack: isLight ? 'bg-slate-100' : 'bg-slate-800/80',
        titleColor: isLight ? 'text-emerald-900' : 'text-emerald-400',
        titleHex: isLight ? '#065f46' : '#34d399',
        defaultTitle: 'Aksi Berhasil',
        glowColor: isLight ? 'bg-emerald-500/5' : 'bg-emerald-500/20',
        bgColor: isLight ? '#ffffff' : '#0f172a',
        textColor: isLight ? '#0f172a' : '#ffffff',
        closeColor: isLight ? '#475569' : '#cbd5e1',
        textShadow: isLight ? 'none' : '0 1px 2px rgba(0,0,0,0.5)',
      };
    case 'error':
      return {
        icon: AlertCircle,
        bgGradient: isLight ? 'bg-white' : 'from-slate-900 via-slate-900 to-slate-950',
        borderColor: isLight
          ? 'border-rose-500 shadow-xl shadow-rose-500/10'
          : 'border-rose-500/60 shadow-rose-950/50',
        iconBg: isLight
          ? 'bg-rose-100 text-rose-700 border border-rose-300'
          : 'bg-rose-500/20 text-rose-400 border border-rose-500/40',
        iconColor: isLight ? '#e11d48' : '#fb7185',
        barColor: isLight ? 'bg-rose-600' : 'bg-rose-400',
        barTrack: isLight ? 'bg-slate-100' : 'bg-slate-800/80',
        titleColor: isLight ? 'text-rose-900' : 'text-rose-400',
        titleHex: isLight ? '#9f1239' : '#fb7185',
        defaultTitle: 'Terjadi Kesalahan',
        glowColor: isLight ? 'bg-rose-500/5' : 'bg-rose-500/20',
        bgColor: isLight ? '#ffffff' : '#0f172a',
        textColor: isLight ? '#0f172a' : '#ffffff',
        closeColor: isLight ? '#475569' : '#cbd5e1',
        textShadow: isLight ? 'none' : '0 1px 2px rgba(0,0,0,0.5)',
      };
    case 'warning':
      return {
        icon: AlertTriangle,
        bgGradient: isLight ? 'bg-white' : 'from-slate-900 via-slate-900 to-slate-950',
        borderColor: isLight
          ? 'border-amber-500 shadow-xl shadow-amber-500/10'
          : 'border-amber-500/60 shadow-amber-950/50',
        iconBg: isLight
          ? 'bg-amber-100 text-amber-800 border border-amber-300'
          : 'bg-amber-500/20 text-amber-400 border border-amber-500/40',
        iconColor: isLight ? '#d97706' : '#fbbf24',
        barColor: isLight ? 'bg-amber-600' : 'bg-amber-400',
        barTrack: isLight ? 'bg-slate-100' : 'bg-slate-800/80',
        titleColor: isLight ? 'text-amber-900' : 'text-amber-400',
        titleHex: isLight ? '#92400e' : '#fbbf24',
        defaultTitle: 'Peringatan Sistem',
        glowColor: isLight ? 'bg-amber-500/5' : 'bg-amber-500/20',
        bgColor: isLight ? '#ffffff' : '#0f172a',
        textColor: isLight ? '#0f172a' : '#ffffff',
        closeColor: isLight ? '#475569' : '#cbd5e1',
        textShadow: isLight ? 'none' : '0 1px 2px rgba(0,0,0,0.5)',
      };
    case 'info':
    default:
      return {
        icon: Info,
        bgGradient: isLight ? 'bg-white' : 'from-slate-900 via-slate-900 to-slate-950',
        borderColor: isLight
          ? 'border-indigo-500 shadow-xl shadow-indigo-500/10'
          : 'border-indigo-500/60 shadow-indigo-950/50',
        iconBg: isLight
          ? 'bg-indigo-100 text-indigo-700 border border-indigo-300'
          : 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/40',
        iconColor: isLight ? '#4f46e5' : '#818cf8',
        barColor: isLight ? 'bg-indigo-600' : 'bg-indigo-400',
        barTrack: isLight ? 'bg-slate-100' : 'bg-slate-800/80',
        titleColor: isLight ? 'text-indigo-900' : 'text-indigo-400',
        titleHex: isLight ? '#3730a3' : '#818cf8',
        defaultTitle: 'Informasi',
        glowColor: isLight ? 'bg-indigo-500/5' : 'bg-indigo-500/20',
        bgColor: isLight ? '#ffffff' : '#0f172a',
        textColor: isLight ? '#0f172a' : '#ffffff',
        closeColor: isLight ? '#475569' : '#cbd5e1',
        textShadow: isLight ? 'none' : '0 1px 2px rgba(0,0,0,0.5)',
      };
  }
};

export const SingleToast: React.FC<ToastItemProps> = ({ toast, onDismiss, isLight = false }) => {
  const duration = toast.duration ?? 4000;
  const config = getToastConfig(toast.type, isLight);
  const Icon = config.icon;
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(100);
  const startTimeRef = useRef<number>(Date.now());
  const remainingTimeRef = useRef<number>(duration);

  useEffect(() => {
    if (duration <= 0) return; // Sticky toast

    let animationFrameId: number;

    const tick = () => {
      if (!isPaused) {
        const elapsedSinceLastResume = Date.now() - startTimeRef.current;
        const currentRemaining = Math.max(0, remainingTimeRef.current - elapsedSinceLastResume);
        const percent = (currentRemaining / duration) * 100;
        setProgress(percent);

        if (currentRemaining <= 0) {
          onDismiss(toast.id);
          return;
        }
      }
      animationFrameId = requestAnimationFrame(tick);
    };

    startTimeRef.current = Date.now();
    animationFrameId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [duration, isPaused, onDismiss, toast.id]);

  const handleMouseEnter = () => {
    if (duration > 0) {
      const elapsed = Date.now() - startTimeRef.current;
      remainingTimeRef.current = Math.max(0, remainingTimeRef.current - elapsed);
      setIsPaused(true);
    }
  };

  const handleMouseLeave = () => {
    if (duration > 0) {
      startTimeRef.current = Date.now();
      setIsPaused(false);
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16, scale: 0.96, x: 20 }}
      animate={{ opacity: 1, y: 0, scale: 1, x: 0 }}
      exit={{ opacity: 0, scale: 0.92, y: 12, transition: { duration: 0.2 } }}
      transition={{ type: 'spring', stiffness: 450, damping: 32 }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      role="alert"
      aria-live="polite"
      className={`app-toast-item app-toast-${toast.type} relative group overflow-hidden w-full ${
        isLight ? 'bg-white shadow-xl shadow-slate-900/10' : 'bg-slate-900 shadow-2xl'
      } border ${config.borderColor} rounded-2xl p-3.5 sm:p-4 flex items-start gap-3 select-none pointer-events-auto transition-all`}
      style={{
        backgroundColor: config.bgColor,
        color: config.textColor,
      }}
    >
      {/* Subtle background glow in dark mode */}
      {!isLight && (
        <div
          className={`absolute -top-10 -right-10 w-24 h-24 rounded-full blur-2xl pointer-events-none ${config.glowColor}`}
        />
      )}

      {/* Icon Badge */}
      <div className={`app-toast-icon-badge p-2 rounded-xl shrink-0 ${config.iconBg} shadow-inner`}>
        <Icon className="w-5 h-5 shrink-0" style={{ color: config.iconColor }} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 pr-1 space-y-1">
        <div className="flex items-center justify-between gap-2">
          <h4
            className={`app-toast-title text-xs font-black uppercase tracking-wider ${config.titleColor}`}
            style={{
              color: config.titleHex,
              WebkitTextFillColor: config.titleHex,
              textShadow: config.textShadow,
            }}
          >
            {toast.title || config.defaultTitle}
          </h4>
        </div>
        <p
          className={`app-toast-message text-xs font-bold leading-relaxed break-words ${
            isLight ? 'text-slate-900' : 'text-white'
          }`}
          style={{
            color: config.textColor,
            WebkitTextFillColor: config.textColor,
            textShadow: config.textShadow,
          }}
        >
          {toast.message}
        </p>

        {/* Optional Action Button */}
        {toast.action && (
          <div className="pt-2">
            <button
              onClick={() => {
                toast.action?.onClick();
                onDismiss(toast.id);
              }}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer border shadow-sm active:scale-95 ${
                isLight
                  ? 'bg-slate-900 hover:bg-slate-800 text-white border-slate-700'
                  : 'bg-white/15 hover:bg-white/25 text-white border-white/25'
              }`}
            >
              <span>{toast.action.label}</span>
              <ArrowRight className="w-3 h-3 text-white" />
            </button>
          </div>
        )}
      </div>

      {/* Close button */}
      <button
        onClick={() => onDismiss(toast.id)}
        aria-label="Tutup notifikasi"
        className={`app-toast-close p-1.5 rounded-lg active:scale-90 transition-all cursor-pointer shrink-0 ${
          isLight
            ? 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
            : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
        }`}
        style={{ color: config.closeColor }}
      >
        <X className="w-4 h-4" />
      </button>

      {/* Progress Bar for Auto-dismiss */}
      {duration > 0 && (
        <div className={`absolute bottom-0 left-0 right-0 h-[3px] ${config.barTrack} overflow-hidden`}>
          <div
            className={`h-full ${config.barColor} transition-all ease-linear`}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </motion.div>
  );
};

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast, theme } = useApp();
  const isLight = theme === 'light';

  if (!toasts || toasts.length === 0) return null;

  return (
    <div
      aria-label="Notifikasi Global"
      className="fixed bottom-4 right-4 z-[99999] flex flex-col-reverse gap-2.5 max-w-sm sm:max-w-md w-full px-3 sm:px-0 pointer-events-none"
    >
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <SingleToast key={toast.id} toast={toast} onDismiss={removeToast} isLight={isLight} />
        ))}
      </AnimatePresence>
    </div>
  );
};
