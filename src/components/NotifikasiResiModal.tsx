import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  Bell,
  X,
  Search,
  CheckCircle2,
  Clock,
  XCircle,
  FileText,
  Printer,
  MessageCircle,
  ExternalLink,
  Download,
  ShieldCheck,
  RefreshCw,
  Coins,
  ArrowUpRight,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { KeuanganItem } from '../types';
import { downloadReceiptAsImage, shareReceiptToWhatsApp } from '../utils/generateReceiptImage';

interface NotifikasiResiModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotifikasiResiModal: React.FC<NotifikasiResiModalProps> = ({ isOpen, onClose }) => {
  const {
    keuanganList,
    updateKeuanganItem,
    settings,
    currentUser,
    setViewMode,
    setActiveTab,
    setActivePortalTab,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'semua' | 'pending' | 'disetujui' | 'ditolak'>('semua');
  const [selectedReceipt, setSelectedReceipt] = useState<KeuanganItem | null>(null);

  // Filter only digital income transactions (persembahan/transfers/resi)
  const allResiList = useMemo(() => {
    return (keuanganList || []).filter(
      (k) =>
        k.jenis === 'pemasukan' &&
        (k.noReferensi ||
          k.buktiTransferUrl ||
          k.status === 'pending' ||
          k.status === 'disetujui' ||
          k.status === 'ditolak' ||
          k.disetujuiOleh ||
          (k.kategori && /persembahan|qris|transfer|iuran|lelang/i.test(k.kategori)) ||
          (k.keterangan && /persembahan|qris|transfer|resi|kantong/i.test(k.keterangan)))
    );
  }, [keuanganList]);

  const pendingCount = useMemo(() => {
    return allResiList.filter(
      (k) => k.status === 'pending' || k.disetujuiOleh?.includes('Menunggu')
    ).length;
  }, [allResiList]);

  const verifiedCount = useMemo(() => {
    return allResiList.filter(
      (k) => k.status === 'disetujui' || (!k.status && !k.disetujuiOleh?.includes('Menunggu'))
    ).length;
  }, [allResiList]);

  const rejectedCount = useMemo(() => {
    return allResiList.filter((k) => k.status === 'ditolak').length;
  }, [allResiList]);

  const filteredList = useMemo(() => {
    return allResiList.filter((item) => {
      const isPending = item.status === 'pending' || item.disetujuiOleh?.includes('Menunggu');
      const isVerified = item.status === 'disetujui' || (!item.status && !item.disetujuiOleh?.includes('Menunggu'));
      const isRejected = item.status === 'ditolak';

      if (filterStatus === 'pending' && !isPending) return false;
      if (filterStatus === 'disetujui' && !isVerified) return false;
      if (filterStatus === 'ditolak' && !isRejected) return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        (item.noReferensi && item.noReferensi.toLowerCase().includes(q)) ||
        (item.keterangan && item.keterangan.toLowerCase().includes(q)) ||
        (item.kategori && item.kategori.toLowerCase().includes(q)) ||
        (item.posKas && item.posKas.toLowerCase().includes(q)) ||
        item.jumlah.toString().includes(q)
      );
    });
  }, [allResiList, filterStatus, searchQuery]);

  const isStaff = Boolean(
    currentUser && ['admin', 'bendahara', 'sekretaris'].includes(currentUser.role)
  );

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header Dialog */}
        <div className="px-5 py-4 bg-gradient-to-r from-amber-600 via-amber-500 to-indigo-600 text-white flex items-center justify-between gap-3 shrink-0 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 text-white shadow-xs">
              <Bell className="w-5 h-5 animate-bounce" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black tracking-tight leading-tight flex items-center gap-2">
                <span>Notifikasi &amp; Verifikasi Resi Persembahan</span>
                {pendingCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-rose-600 text-white font-extrabold text-[10px] tracking-wide uppercase shadow-xs">
                    {pendingCount} Menunggu
                  </span>
                )}
              </h3>
              <p className="text-xs text-amber-100 font-medium">
                Pencatatan konfirmasi bukti persembahan digital (QRIS, Bank Transfer, &amp; GoPay)
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            title="Tutup Jendela"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Top Summary Cards */}
        <div className="p-4 sm:p-5 bg-slate-50 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800 shrink-0 space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <button
              type="button"
              onClick={() => setFilterStatus('semua')}
              className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                filterStatus === 'semua'
                  ? 'bg-slate-900 text-white border-slate-900 dark:bg-indigo-600 dark:border-indigo-500 shadow-sm'
                  : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-800 hover:border-slate-300'
              }`}
            >
              <span className="text-[10px] font-bold uppercase tracking-wider block opacity-80">
                Total Bukti Resi
              </span>
              <div className="text-xl font-black font-mono mt-0.5">{allResiList.length}</div>
            </button>

            <button
              type="button"
              onClick={() => setFilterStatus('pending')}
              className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                filterStatus === 'pending'
                  ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-sm font-bold'
                  : 'bg-amber-50 dark:bg-amber-950/30 text-amber-900 dark:text-amber-200 border-amber-200 dark:border-amber-800/60 hover:border-amber-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider block opacity-90">
                  Menunggu
                </span>
                {pendingCount > 0 && <Clock className="w-3.5 h-3.5 animate-spin" />}
              </div>
              <div className="text-xl font-black font-mono mt-0.5">{pendingCount}</div>
            </button>

            <button
              type="button"
              onClick={() => setFilterStatus('disetujui')}
              className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                filterStatus === 'disetujui'
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm font-bold'
                  : 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200 border-emerald-200 dark:border-emerald-800/60 hover:border-emerald-300'
              }`}
            >
              <span className="text-[10px] font-bold uppercase tracking-wider block opacity-90">
                Terverifikasi
              </span>
              <div className="text-xl font-black font-mono mt-0.5">{verifiedCount}</div>
            </button>

            <button
              type="button"
              onClick={() => setFilterStatus('ditolak')}
              className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                filterStatus === 'ditolak'
                  ? 'bg-rose-600 text-white border-rose-600 shadow-sm font-bold'
                  : 'bg-rose-50 dark:bg-rose-950/30 text-rose-900 dark:text-rose-200 border-rose-200 dark:border-rose-800/60 hover:border-rose-300'
              }`}
            >
              <span className="text-[10px] font-bold uppercase tracking-wider block opacity-90">
                Ditolak
              </span>
              <div className="text-xl font-black font-mono mt-0.5">{rejectedCount}</div>
            </button>
          </div>

          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari No. Referensi, Nama Pengirim, atau Keterangan..."
              className="w-full pl-10 pr-4 py-2 text-xs font-semibold rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-amber-500 shadow-inner"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Resi Items List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3">
          {filteredList.length === 0 ? (
            <div className="text-center py-12 px-4 space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
                <FileText className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                Tidak ada data resi ditemukan
              </h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                {searchQuery
                  ? `Tidak ada transaksi persembahan yang cocok dengan kata kunci "${searchQuery}".`
                  : 'Belum ada bukti resi yang masuk dalam kategori status ini.'}
              </p>
            </div>
          ) : (
            filteredList.map((item) => {
              const isPending =
                item.status === 'pending' || item.disetujuiOleh?.includes('Menunggu');
              const isVerified =
                item.status === 'disetujui' || (!item.status && !item.disetujuiOleh?.includes('Menunggu'));
              const isRejected = item.status === 'ditolak';

              return (
                <div
                  key={item.id}
                  className="p-3.5 sm:p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 transition-all shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3.5"
                >
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono font-black text-xs text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700">
                        {item.noReferensi || 'REF-GKE-OFFLINE'}
                      </span>
                      <span className="text-[11px] text-slate-500 font-medium">{item.tanggal}</span>

                      {/* Status Badges */}
                      {isPending && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-800 text-[10px] font-extrabold animate-pulse">
                          <Clock className="w-3 h-3" /> Menunggu Verifikasi
                        </span>
                      )}
                      {isVerified && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 text-[10px] font-extrabold">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Terverifikasi Sah
                        </span>
                      )}
                      {isRejected && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-100 text-rose-900 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-300 dark:border-rose-800 text-[10px] font-extrabold">
                          <XCircle className="w-3 h-3 text-rose-600" /> Ditolak
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-slate-900 dark:text-slate-100 text-xs">
                        {item.kategori}
                      </span>
                      <span className="text-slate-300 dark:text-slate-700">•</span>
                      <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 text-[10px] font-bold border border-indigo-200 dark:border-indigo-800/60">
                        {item.posKas || 'Kas Umum'}
                      </span>
                      <span className="text-slate-300 dark:text-slate-700">•</span>
                      <span className="text-xs font-mono font-black text-emerald-600 dark:text-emerald-400">
                        Rp {item.jumlah.toLocaleString('id-ID')}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                      {item.keterangan || 'Persembahan jemaat via sistem digital GKE.'}
                    </p>

                    {item.disetujuiOleh && (
                      <p className="text-[10px] text-slate-500 dark:text-slate-500">
                        Catatan validasi: <strong className="text-slate-700 dark:text-slate-300">{item.disetujuiOleh}</strong>
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap items-center gap-2 shrink-0 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800">
                    {/* Cetak / Unduh Gambar Resi */}
                    <button
                      type="button"
                      onClick={() => downloadReceiptAsImage(item, settings)}
                      className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                      title="Unduh Gambar Resi Resmi Digital"
                    >
                      <Download className="w-3.5 h-3.5 text-indigo-500" />
                      <span>Unduh Resi</span>
                    </button>

                    {/* WhatsApp Notif Share */}
                    <button
                      type="button"
                      onClick={() => shareReceiptToWhatsApp(item, settings)}
                      className="px-2.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                      title="Kirim Notifikasi Resi ke WhatsApp"
                    >
                      <MessageCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span>Kirim WA</span>
                    </button>

                    {/* Admin Verification Actions */}
                    {isStaff && isPending && (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            updateKeuanganItem(item.id, {
                              status: 'disetujui',
                              disetujuiOleh: currentUser?.namaLengkap || 'Bendahara Majelis',
                            });
                          }}
                          className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-sm transition cursor-pointer active:scale-95"
                          title="Setujui dan masukkan otomatis ke Buku Kas Jemaat"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Setujui</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            updateKeuanganItem(item.id, {
                              status: 'ditolak',
                              disetujuiOleh: 'Ditolak Admin (Bukti tidak sesuai)',
                            });
                          }}
                          className="px-2.5 py-1.5 rounded-xl bg-rose-100 hover:bg-rose-200 dark:bg-rose-950/60 dark:hover:bg-rose-900/80 text-rose-700 dark:text-rose-300 text-xs font-bold flex items-center gap-1 transition cursor-pointer"
                          title="Tolak bukti persembahan ini"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Tolak</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Navigation */}
        <div className="p-4 bg-slate-50 dark:bg-slate-950/80 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex flex-wrap items-center gap-2">
            {currentUser?.role !== 'admin' && (
              <button
                type="button"
                onClick={() => {
                  setViewMode('public');
                  setActivePortalTab('notifikasi_persembahan');
                  onClose();
                }}
                className="px-3.5 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/50 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
              >
                <span>Buka Halaman Penuh di Portal Warga</span>
                <ArrowUpRight className="w-4 h-4" />
              </button>
            )}

            {isStaff && (
              <button
                type="button"
                onClick={() => {
                  setViewMode('admin');
                  setActiveTab('keuangan');
                  onClose();
                }}
                className="px-3.5 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
              >
                <Coins className="w-4 h-4 text-amber-500" />
                <span>Buka Buku Kas Jemaat</span>
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-950 text-xs font-extrabold transition cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
