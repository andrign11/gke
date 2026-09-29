import React, { useState } from 'react';
import {
  Construction,
  Power,
  Eye,
  Settings,
  X,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Radio,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { UnderConstructionScreen } from './UnderConstructionScreen';

export const MaintenanceTopBanner: React.FC = () => {
  const { settings, updateSettings, currentUser, setActiveTab } = useApp();
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isDisabling, setIsDisabling] = useState(false);
  const [successToast, setSuccessToast] = useState(false);

  if (!settings?.maintenanceModeEnabled) {
    return null;
  }

  // Only show this banner if currentUser is admin or allowed
  const isAllowed =
    currentUser?.role === 'admin' ||
    (settings.maintenanceAllowedRoles &&
      settings.maintenanceAllowedRoles.includes(currentUser?.role || ''));

  if (!isAllowed) {
    return null;
  }

  const handleDisableNow = async () => {
    try {
      setIsDisabling(true);
      await updateSettings({
        ...settings,
        maintenanceModeEnabled: false,
      });
      setSuccessToast(true);
      setTimeout(() => setSuccessToast(false), 3000);
    } catch (err) {
      console.error('Gagal menonaktifkan mode perbaikan:', err);
    } finally {
      setIsDisabling(false);
    }
  };

  return (
    <>
      <div className="bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 text-slate-950 px-3 sm:px-6 py-2.5 shadow-lg border-b border-amber-400/50 sticky top-0 z-40 flex flex-wrap items-center justify-between gap-2.5 print:hidden">
        {/* Left Notice */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="p-1.5 rounded-lg bg-slate-950/20 text-slate-950 flex-shrink-0 animate-bounce">
            <Construction className="w-4 h-4" />
          </div>
          <div className="text-xs">
            <span className="font-black uppercase tracking-wider bg-slate-950 text-amber-300 px-2 py-0.5 rounded text-[10px] mr-2 shadow-xs">
              Mode Perbaikan Aktif
            </span>
            <span className="font-bold text-slate-950">
              Aplikasi dalam masa pemeliharaan (Under Construction).
            </span>{' '}
            <span className="text-slate-900 hidden md:inline font-medium">
              Warga dan pengguna publik sementara tidak dapat mengakses portal hingga mode perbaikan dimatikan.
            </span>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {successToast ? (
            <span className="px-3 py-1 bg-emerald-950 text-emerald-300 font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-md animate-pulse">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Mode Perbaikan Dimatikan!</span>
            </span>
          ) : (
            <>
              {/* Preview Button */}
              <button
                type="button"
                onClick={() => setIsPreviewOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950/20 hover:bg-slate-950/30 text-slate-950 font-bold text-xs transition active:scale-95 cursor-pointer border border-slate-950/20"
                title="Lihat tampilan yang muncul di layar warga jemaat"
              >
                <Eye className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Pratinjau Tampilan</span>
              </button>

              {/* Settings Shortcut */}
              <button
                type="button"
                onClick={() => setActiveTab('pengaturan')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950/20 hover:bg-slate-950/30 text-slate-950 font-bold text-xs transition active:scale-95 cursor-pointer border border-slate-950/20"
                title="Buka pengaturan pesan & estimasi selesai"
              >
                <Settings className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Pengaturan</span>
              </button>

              {/* Quick Turn Off Button */}
              <button
                type="button"
                onClick={handleDisableNow}
                disabled={isDisabling}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-950 hover:bg-slate-900 text-amber-300 font-extrabold text-xs transition active:scale-95 cursor-pointer shadow-md disabled:opacity-60"
                title="Kembalikan sistem ke mode operasional normal"
              >
                <Power className="w-3.5 h-3.5 text-emerald-400" />
                <span>{isDisabling ? 'Memproses...' : 'Nonaktifkan Sekarang'}</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Fullscreen Preview Modal */}
      {isPreviewOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <UnderConstructionScreen
            isPreview={true}
            onClosePreview={() => setIsPreviewOpen(false)}
          />
        </div>
      )}
    </>
  );
};
