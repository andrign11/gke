import React, { useState, useEffect } from 'react';
import { AlertTriangle, Loader2, Trash2, X } from 'lucide-react';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  title?: string;
  itemName?: string;
  description?: string;
  message?: string;
  onConfirm: () => Promise<void> | void;
  onClose?: () => void;
  onCancel?: () => void;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  title = 'Konfirmasi Hapus Data',
  itemName,
  description,
  message,
  onConfirm,
  onClose,
  onCancel,
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleClose = () => {
    if (typeof onClose === 'function') {
      onClose();
    } else if (typeof onCancel === 'function') {
      onCancel();
    }
  };

  const displayItemName = itemName || message || 'Data terpilih';
  const displayDescription =
    description ||
    (message && message !== displayItemName
      ? message
      : 'Apakah Anda yakin ingin menghapus data ini? Data yang telah dihapus tidak dapat dikembalikan.');

  useEffect(() => {
    let interval: any;
    if (isDeleting) {
      setProgress(15);
      interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) return prev;
          return prev + 15;
        });
      }, 120);
    } else {
      setProgress(0);
    }
    return () => clearInterval(interval);
  }, [isDeleting]);

  if (!isOpen) return null;

  const handleExecuteDelete = async () => {
    try {
      setIsDeleting(true);
      await onConfirm();
      setProgress(100);
      await new Promise((res) => setTimeout(res, 200));
    } catch (err) {
      console.error('Failed to delete item:', err);
    } finally {
      setIsDeleting(false);
      handleClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md overflow-hidden bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2.5 text-rose-400 font-bold text-sm sm:text-base">
            <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20">
              <AlertTriangle className="w-5 h-5 text-rose-400" />
            </div>
            <span>{title}</span>
          </div>
          <button
            onClick={handleClose}
            disabled={isDeleting}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          <div className="p-3.5 bg-rose-950/30 border border-rose-500/30 rounded-xl">
            <p className="text-xs text-rose-200/80 uppercase font-bold tracking-wider mb-1">Target Data:</p>
            <p className="text-sm font-extrabold text-white leading-snug break-words">{displayItemName}</p>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">{displayDescription}</p>

          {/* Progress / Spinner State */}
          {isDeleting && (
            <div className="p-3 rounded-xl bg-indigo-950/50 border border-indigo-500/30 space-y-2.5">
              <div className="flex items-center justify-between text-xs text-indigo-300 font-semibold">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-indigo-400 shrink-0" />
                  <span>Proses Menghapus Data & Hak Akses...</span>
                </div>
                <span className="font-mono text-indigo-400 font-bold">{progress}%</span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-indigo-500 h-full transition-all duration-150 rounded-full"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-2.5 p-4 bg-slate-950/80 border-t border-slate-800">
          <button
            type="button"
            onClick={handleClose}
            disabled={isDeleting}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-bold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition disabled:opacity-50 min-h-[44px] flex items-center justify-center cursor-pointer"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleExecuteDelete}
            disabled={isDeleting}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 shadow-lg shadow-rose-600/20 transition flex items-center justify-center gap-2 disabled:opacity-50 min-h-[44px] cursor-pointer"
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Menghapus...</span>
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                <span>Ya, Hapus Data</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
