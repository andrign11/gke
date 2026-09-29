import React, { useState, useMemo } from 'react';
import {
  AlertTriangle,
  Lock,
  Eye,
  EyeOff,
  Trash2,
  X,
  Download,
  Users,
  Home,
  CheckCircle2,
  ShieldAlert,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { downloadSensusExcel } from '../utils/sensusExcelUtils';

interface DeleteKeluargaModalProps {
  isOpen: boolean;
  onClose?: () => void;
  initialNoKjj?: string;
  onSuccess?: () => void;
}

export const DeleteKeluargaModal: React.FC<DeleteKeluargaModalProps> = ({
  isOpen,
  onClose,
  initialNoKjj,
  onSuccess,
}) => {
  const handleSafeClose = () => {
    if (typeof onClose === 'function') onClose();
  };
  const {
    wargaJemaatList,
    lingkunganList,
    clearAllWargaJemaat,
    deleteKeluargaByKjj,
    currentUser,
    userAccounts,
    churchProfile,
  } = useApp();

  const [mode, setMode] = useState<'all' | 'rayon' | 'single_kjj'>(
    initialNoKjj ? 'single_kjj' : 'all'
  );
  const [selectedRayon, setSelectedRayon] = useState<string>('');
  const [selectedKjj, setSelectedKjj] = useState<string>(initialNoKjj || '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [backupDownloaded, setBackupDownloaded] = useState(false);

  // Available Lingkungans
  const availableLingkungans = useMemo(() => {
    const list = lingkunganList.map((l) => l.nama).filter(Boolean);
    if (list.length === 0) {
      return [
        'Lingkungan I - Ebenezer',
        'Lingkungan II - Yerusalem',
        'Lingkungan III - Bethel',
        'Lingkungan IV - Sion',
        'Lingkungan V - Filadelfia',
      ];
    }
    return list;
  }, [lingkunganList]);

  // Set default selected rayon if not set
  React.useEffect(() => {
    if (!selectedRayon && availableLingkungans.length > 0) {
      setSelectedRayon(availableLingkungans[0]);
    }
  }, [availableLingkungans, selectedRayon]);

  React.useEffect(() => {
    if (isOpen) {
      setPassword('');
      setPasswordError('');
      setBackupDownloaded(false);
      if (initialNoKjj) {
        setMode('single_kjj');
        setSelectedKjj(initialNoKjj);
      } else {
        setMode('all');
      }
    }
  }, [isOpen, initialNoKjj]);

  // All unique KKJs
  const allFamilies = useMemo(() => {
    const map = new Map<string, { noKjj: string; kepalaKeluarga: string; memberCount: number; rayon: string }>();
    wargaJemaatList.forEach((w) => {
      const kjj = w.noKjj || 'TANPA_KJJ';
      const existing = map.get(kjj);
      const isKepala = w.hubunganKeluarga === 'Kepala Keluarga' || w.hubunganKeluarga === 'Kepala' || (!existing && !w.hubunganKeluarga);
      if (existing) {
        existing.memberCount += 1;
        if (isKepala) existing.kepalaKeluarga = w.namaLengkap;
      } else {
        map.set(kjj, {
          noKjj: kjj,
          kepalaKeluarga: isKepala ? w.namaLengkap : (w.namaLengkap || 'Belum Ditentukan'),
          memberCount: 1,
          rayon: w.rayon || '-',
        });
      }
    });
    return Array.from(map.values());
  }, [wargaJemaatList]);

  // Selected single family info
  const currentFamilyInfo = useMemo(() => {
    if (!selectedKjj) return null;
    return allFamilies.find((f) => f.noKjj.toLowerCase() === selectedKjj.toLowerCase()) || null;
  }, [allFamilies, selectedKjj]);

  // Statistics based on current mode
  const targetStats = useMemo(() => {
    if (mode === 'single_kjj') {
      const members = wargaJemaatList.filter(
        (w) => w.noKjj && w.noKjj.trim().toLowerCase() === selectedKjj.trim().toLowerCase()
      );
      return {
        totalJiwa: members.length,
        totalKk: members.length > 0 ? 1 : 0,
        description: `Keluarga No. KJJ: ${selectedKjj || '-'} (${currentFamilyInfo?.kepalaKeluarga || 'Kepala Keluarga'})`,
      };
    }
    if (mode === 'rayon') {
      const members = wargaJemaatList.filter((w) => w.rayon === selectedRayon);
      const kks = new Set(members.map((w) => w.noKjj).filter(Boolean));
      return {
        totalJiwa: members.length,
        totalKk: kks.size,
        description: `${selectedRayon}`,
      };
    }
    // Mode 'all'
    const kks = new Set(wargaJemaatList.map((w) => w.noKjj).filter(Boolean));
    return {
      totalJiwa: wargaJemaatList.length,
      totalKk: kks.size,
      description: 'Seluruh Data Jemaat (Semua Lingkungan)',
    };
  }, [mode, selectedRayon, selectedKjj, wargaJemaatList, currentFamilyInfo]);

  if (!isOpen) return null;

  // Handle instant backup download
  const handleDownloadBackup = async () => {
    try {
      setIsBackingUp(true);
      await downloadSensusExcel({
        wargaList: wargaJemaatList,
        churchName: churchProfile?.namaGereja || 'GKE',
        availableLingkungans,
        customFilename: `Backup_Sebelum_Hapus_Sensus_${Date.now()}.xlsx`,
      });
      setBackupDownloaded(true);
    } catch (err) {
      console.error('Backup download error:', err);
    } finally {
      setIsBackingUp(false);
    }
  };

  // Verify password and execute deletion
  const handleDelete = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');

    if (!password.trim()) {
      setPasswordError('Silakan masukkan kata sandi (password) akun Anda.');
      return;
    }

    // Authenticate password
    const userInAccounts = userAccounts.find(
      (u) =>
        u.id === currentUser?.id ||
        (u.username && currentUser?.username && u.username.toLowerCase() === currentUser.username.toLowerCase())
    );

    const validPasswords = new Set<string>();
    if (currentUser?.password) validPasswords.add(currentUser.password);
    if (userInAccounts?.password) validPasswords.add(userInAccounts.password);

    // If user has admin role or username is admin, also accept default admin fallback
    const isAdmin = currentUser?.role === 'admin' || currentUser?.username?.toLowerCase() === 'admin';
    if (isAdmin) {
      validPasswords.add('admin');
      validPasswords.add('123');
      validPasswords.add('admin123');
    }

    const isMatch = validPasswords.has(password.trim());

    if (!isMatch) {
      setPasswordError('Password yang Anda masukkan salah. Mohon periksa kembali password akun login Anda.');
      return;
    }

    setIsDeleting(true);
    try {
      if (mode === 'single_kjj') {
        await deleteKeluargaByKjj(selectedKjj);
      } else if (mode === 'rayon') {
        await clearAllWargaJemaat({ rayon: selectedRayon });
      } else {
        await clearAllWargaJemaat();
      }

      if (onSuccess) onSuccess();
      handleSafeClose();
    } catch (err) {
      console.error('Error during deletion:', err);
      setPasswordError('Terjadi kesalahan saat menghapus data. Silakan coba lagi.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div
      id="delete-keluarga-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div
        id="delete-keluarga-modal-card"
        className="w-full max-w-xl bg-slate-900 border border-rose-900/60 rounded-2xl shadow-2xl overflow-hidden text-slate-100 flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="px-6 py-4 bg-rose-950/40 border-b border-rose-900/40 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-wide">
                Hapus Data Keluarga Jemaat
              </h2>
              <p className="text-xs text-rose-300/80">
                Kosongkan data lama untuk mempermudah penggantian data baru
              </p>
            </div>
          </div>
          <button
            onClick={handleSafeClose}
            disabled={isDeleting}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleDelete} className="p-6 overflow-y-auto space-y-5">
          {/* Warning Banner */}
          <div className="p-4 rounded-xl bg-rose-950/30 border border-rose-800/40 text-rose-200 text-xs leading-relaxed space-y-2">
            <div className="flex items-center gap-2 font-semibold text-rose-300">
              <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
              <span>Peringatan Penghapusan Data Permanen</span>
            </div>
            <p>
              Tindakan ini akan menghapus data sensus anggota keluarga jemaat dari database. Akun login jemaat (termasuk akun yang diterbitkan melalui formulir pendaftaran mandiri) yang terhubung dengan data keluarga ini juga akan otomatis terhapus demi menjaga integritas data. Sangat disarankan untuk mengunduh salinan cadangan (backup) data sebelum melanjutkan.
            </p>
            <div className="pt-1 flex items-center gap-2">
              <button
                type="button"
                onClick={handleDownloadBackup}
                disabled={isBackingUp || wargaJemaatList.length === 0}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-emerald-800/60 font-medium text-xs transition-colors shadow-sm disabled:opacity-50"
              >
                {backupDownloaded ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Backup Berhasil Diunduh</span>
                  </>
                ) : (
                  <>
                    <Download className="w-3.5 h-3.5" />
                    <span>{isBackingUp ? 'Mengunduh...' : 'Unduh Backup Data Excel Terlebih Dahulu'}</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Scope Selection */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Pilih Cakupan Data yang Ingin Dihapus
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setMode('all')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  mode === 'all'
                    ? 'bg-rose-950/50 border-rose-500/80 text-white shadow-md ring-1 ring-rose-500/30'
                    : 'bg-slate-800/40 border-slate-700/60 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-2 font-medium text-xs">
                  <Users className="w-4 h-4 text-rose-400" />
                  <span>Semua Jemaat</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  Seluruh {wargaJemaatList.length} jiwa
                </p>
              </button>

              <button
                type="button"
                onClick={() => setMode('rayon')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  mode === 'rayon'
                    ? 'bg-rose-950/50 border-rose-500/80 text-white shadow-md ring-1 ring-rose-500/30'
                    : 'bg-slate-800/40 border-slate-700/60 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-2 font-medium text-xs">
                  <Home className="w-4 h-4 text-amber-400" />
                  <span>Per Lingkungan</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  1 Lingkungan/Rayon
                </p>
              </button>

              <button
                type="button"
                onClick={() => setMode('single_kjj')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  mode === 'single_kjj'
                    ? 'bg-rose-950/50 border-rose-500/80 text-white shadow-md ring-1 ring-rose-500/30'
                    : 'bg-slate-800/40 border-slate-700/60 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-2 font-medium text-xs">
                  <Users className="w-4 h-4 text-sky-400" />
                  <span>1 Keluarga (KJJ)</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  Pilih nomor KJJ
                </p>
              </button>
            </div>
          </div>

          {/* Conditional Controls for Rayon / Single KJJ */}
          {mode === 'rayon' && (
            <div className="space-y-1.5 p-3 rounded-xl bg-slate-800/50 border border-slate-700">
              <label className="text-xs font-medium text-slate-300">
                Pilih Lingkungan yang Akan Dihapus:
              </label>
              <select
                value={selectedRayon}
                onChange={(e) => setSelectedRayon(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
              >
                {availableLingkungans.map((ling) => {
                  const count = wargaJemaatList.filter((w) => w.rayon === ling).length;
                  return (
                    <option key={ling} value={ling}>
                      {ling} ({count} Jiwa)
                    </option>
                  );
                })}
              </select>
            </div>
          )}

          {mode === 'single_kjj' && (
            <div className="space-y-1.5 p-3 rounded-xl bg-slate-800/50 border border-slate-700">
              <label className="text-xs font-medium text-slate-300">
                Pilih Nomor KJJ Keluarga yang Akan Dihapus:
              </label>
              <select
                value={selectedKjj}
                onChange={(e) => setSelectedKjj(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
              >
                <option value="">-- Pilih Kartu Keluarga Jemaat (KJJ) --</option>
                {allFamilies.map((f) => (
                  <option key={f.noKjj} value={f.noKjj}>
                    {f.noKjj} - {f.kepalaKeluarga} ({f.memberCount} Jiwa, {f.rayon})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Impact Summary Box */}
          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between text-xs">
            <div className="space-y-0.5">
              <span className="text-slate-400">Data yang akan dihapus:</span>
              <p className="font-semibold text-slate-200">{targetStats.description}</p>
            </div>
            <div className="text-right">
              <span className="text-lg font-bold text-rose-400">{targetStats.totalJiwa}</span>
              <span className="text-xs text-slate-400 ml-1">Jiwa ({targetStats.totalKk} KK)</span>
            </div>
          </div>

          {/* Password Confirmation Field */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <div className="flex items-center justify-between">
              <label
                htmlFor="confirm-admin-password"
                className="text-xs font-semibold text-rose-300 flex items-center gap-1.5"
              >
                <Lock className="w-3.5 h-3.5 text-rose-400" />
                <span>Konfirmasi Password Akun Anda (*)</span>
              </label>
              <span className="text-[11px] text-slate-400">
                Akun: <strong className="text-white">{currentUser?.namaLengkap || currentUser?.username || 'Admin'}</strong>
              </span>
            </div>
            <p className="text-[11px] text-slate-400 leading-normal">
              Demi keamanan, masukkan kata sandi login Anda untuk mengotorisasi tindakan penghapusan ini.
            </p>

            <div className="relative">
              <input
                id="confirm-admin-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (passwordError) setPasswordError('');
                }}
                placeholder="Masukkan kata sandi login Anda"
                className={`w-full bg-slate-950 border ${
                  passwordError ? 'border-rose-500 ring-1 ring-rose-500' : 'border-slate-700 focus:border-rose-500'
                } rounded-xl px-3.5 py-2.5 pr-10 text-sm text-white placeholder:text-slate-600 focus:outline-none transition-colors`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {passwordError && (
              <p className="text-xs text-rose-400 font-medium animate-in fade-in">
                {passwordError}
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={handleSafeClose}
              disabled={isDeleting}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isDeleting || targetStats.totalJiwa === 0}
              className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white text-xs font-semibold shadow-lg shadow-rose-950 flex items-center gap-2 transition-all hover:scale-[1.02] disabled:opacity-50 disabled:pointer-events-none"
            >
              {isDeleting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Menghapus Data...</span>
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  <span>Konfirmasi & Hapus ({targetStats.totalJiwa} Jiwa)</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
