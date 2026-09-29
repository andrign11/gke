import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Church,
  Code2,
  Cpu,
  ExternalLink,
  Globe,
  Heart,
  Info,
  Mail,
  Phone,
  ShieldCheck,
  Sparkles,
  X,
  Bug,
  BookOpen,
  DollarSign,
  Users,
  Building2,
  Bot,
  Layers,
  CheckCircle2,
  Database,
  Vote,
  Library,
  Calendar,
  Lock,
  MessageSquare
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { LaporkanBugModal } from './LaporkanBugModal';

interface AboutDeveloperModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AboutDeveloperModal: React.FC<AboutDeveloperModalProps> = ({ isOpen, onClose }) => {
  const { settings } = useApp();
  const [isBugModalOpen, setIsBugModalOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<'all' | 'ibadah' | 'warga' | 'keuangan' | 'tata_kelola' | 'sistem'>('all');

  if (!isOpen) return null;

  const moduleCategories = [
    {
      id: 'ibadah',
      title: 'Ibadah & Pembinaan Rohani',
      icon: BookOpen,
      color: 'text-indigo-400',
      badgeBg: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20',
      items: [
        { name: 'Jadwal Ibadah, Liturgi & Petugas Firman', desc: 'Pengaturan jadwal ibadah raya, kategorial & petugas liturgi' },
        { name: 'Alkitab Digital Lengkap TB (66 Kitab)', desc: 'Pencarian ayat cepat, pasal, perikop & pembacaan terpadu' },
        { name: 'Almanak Nast Sinode GKE', desc: 'Ayat harian, bacaan hari minggu & tema renungan sinode' },
        { name: 'Rancangan Khotbah & Buletin Jemaat', desc: 'Penyusunan khotbah, warta jemaat mingguan & buletin rohani' },
        { name: 'Perpustakaan & E-Book Rohani (E-Library)', desc: 'Koleksi buku rohani digital, tata gereja & materi pembinaan' },
      ],
    },
    {
      id: 'warga',
      title: 'Keanggotaan & Layanan Sakramen',
      icon: Users,
      color: 'text-emerald-400',
      badgeBg: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
      items: [
        { name: 'Sensus Data Warga & Kartu Keluarga (KK)', desc: 'Pendataan digital komprehensif, filtering KK & statistik demografi' },
        { name: 'Pendaftaran Anggota Mandiri (Self-Registration)', desc: 'Formulir daring jemaat baru dengan verifikasi admin majelis' },
        { name: 'Sektor Lingkungan & Rayon Pelayanan', desc: 'Pemetaan jemaat berbasis wilayah pelayanan & koordinator lingkungan' },
        { name: 'Pelayanan Sakramen Nikah, Baptis & Sidi', desc: 'Pencatatan akta sakramen, nomor register & arsip digital' },
        { name: 'Surat Pelimpahan Nikah & Katekisasi', desc: 'Penerbitan surat pengantar nikah ke resort lain & kelas sidi' },
        { name: 'Seksi Pelayanan Kategorial (SPB, SPPer, SPA, SPR)', desc: 'Manajemen program kerja bapa, perempuan, anak & remaja' },
      ],
    },
    {
      id: 'keuangan',
      title: 'Keuangan & Persembahan Digital',
      icon: DollarSign,
      color: 'text-amber-400',
      badgeBg: 'bg-amber-500/10 text-amber-300 border-amber-500/20',
      items: [
        { name: 'Buku Kas Jemaat Multi-Akun & Laporan', desc: 'Pencatatan pemasukan, pengeluaran & cetak buku kas standar akuntansi' },
        { name: 'Persembahan QRIS Dinamis & GoPay Webhook', desc: 'Donasi nontunai instan dengan notifikasi real-time & verifikasi otomatis' },
        { name: 'Panitia Pembangunan & Proyek Fisik', desc: 'Manajemen anggaran, progres fisik, donatur & pertanggungjawaban dana' },
        { name: 'Cetak Kwitansi & Rekapitulasi Transparansi', desc: 'Ekspor PDF, Excel, print out & laporan keuangan siap warta' },
      ],
    },
    {
      id: 'tata_kelola',
      title: 'Tata Kelola, Aset & Pemilihan',
      icon: Building2,
      color: 'text-sky-400',
      badgeBg: 'bg-sky-500/10 text-sky-300 border-sky-500/20',
      items: [
        { name: 'Pengurus MPH Jemaat, Penatua & Diakon', desc: 'Bagan struktur kepengurusan majelis, masa bakti & pembagian tugas' },
        { name: 'Jabatan Struktural & Master SK Majelis', desc: 'Penerbitan nomor surat keputusan, penugasan & arsip SK' },
        { name: 'Pemilihan Majelis & E-Voting Digital', desc: 'Pemilihan penatua/diakon daring yang aman, transparan & real-time' },
        { name: 'Inventarisasi & Penilaian Aset Gereja', desc: 'Pencatatan inventaris gedung, tanah, alat musik & kalkulasi depresiasi' },
        { name: 'Manajemen Tugas Pelayanan (Task Board)', desc: 'Papan Kanban penugasan majelis, prioritas & tenggat waktu' },
        { name: 'Agenda Surat Masuk & Surat Keluar', desc: 'Penomoran otomatis surat resmi gereja & arsip digital dokumen' },
      ],
    },
    {
      id: 'sistem',
      title: 'Integrasi, AI & Keamanan Cloud',
      icon: Bot,
      color: 'text-purple-400',
      badgeBg: 'bg-purple-500/10 text-purple-300 border-purple-500/20',
      items: [
        { name: 'WhatsApp BOT & Gateway Center', desc: 'Pemberitahuan otomatis jadwal ibadah, ucapan ulang tahun & warta' },
        { name: 'Helpdesk Pelaporan Bug & Kendala Sistem', desc: 'Kirim laporan error dengan diagnostik perangkat & penanganan admin' },
        { name: 'Audit Keamanan & Log Aktivitas (RBAC)', desc: 'Pelacakan riwayat aktivitas user, proteksi multi-level & keamanan data' },
        { name: 'Cadangan & Pemulihan Database Realtime', desc: 'Ekspor/impor skema Firestore cloud dengan verifikasi integritas data' },
      ],
    },
  ];

  const filteredCategories = activeCategory === 'all' 
    ? moduleCategories 
    : moduleCategories.filter(c => c.id === activeCategory);

  return (
    <>
      {createPortal(
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
          className="fixed inset-0 lg:left-64 z-[9999] flex items-center justify-center bg-slate-950/70 dark:bg-slate-950/80 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto animate-in fade-in duration-200"
        >
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden max-h-[94vh] sm:max-h-[90vh] flex flex-col my-auto animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/90 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                <div className="p-2 sm:p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20 flex-shrink-0">
                  <Info className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm sm:text-base flex items-center gap-2 flex-wrap">
                    <span>Tentang Pengembang &amp; Sistem</span>
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30 whitespace-nowrap shadow-2xs">
                      v3.0 Enterprise
                    </span>
                  </h3>
                  <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 truncate">
                    Sistem Informasi Manajemen Jemaat &amp; Pelayanan Digital Terpadu GKE
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition flex-shrink-0 cursor-pointer ml-2"
                title="Tutup Modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

          {/* Scrollable Content Body */}
          <div className="p-4 sm:p-6 space-y-4 sm:space-y-5 text-xs text-slate-300 overflow-y-auto flex-1 custom-scrollbar">
            {/* Main App Hero Badge */}
            <div className="bg-gradient-to-r from-indigo-950/80 via-slate-900 to-slate-950 p-3.5 sm:p-4 rounded-xl border border-indigo-500/30 flex items-center gap-3.5 sm:gap-4">
              <div className="w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center p-1 overflow-hidden flex-shrink-0">
                {settings.logoUrl ? (
                  <img
                    src={settings.logoUrl}
                    alt="Logo"
                    className="w-full h-full object-cover rounded-lg sm:rounded-xl"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/src/assets/images/gke_logo_official_1785341836111.jpg';
                    }}
                  />
                ) : (
                  <img
                    src="/src/assets/images/gke_logo_official_1785341836111.jpg"
                    alt="Logo GKE"
                    className="w-full h-full object-cover rounded-lg sm:rounded-xl"
                    referrerPolicy="no-referrer"
                  />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="text-sm sm:text-base font-bold text-white flex items-center gap-1.5 flex-wrap">
                  <span className="truncate">{settings.namaAplikasi}</span>
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
                </h4>
                <p className="text-[11px] sm:text-xs text-indigo-300 font-medium mt-0.5 leading-snug">
                  {settings.deskripsiAplikasi || 'Sistem Informasi Manajemen Jemaat & Pelayanan Gereja Digital'}
                </p>
                <p className="text-[10px] sm:text-[11px] text-slate-400 mt-1 truncate">
                  {settings.namaJemaat} — {settings.resortGke}
                </p>
              </div>
            </div>

            {/* Quick Bug Report Action Bar */}
            <div className="bg-rose-950/40 border border-rose-500/30 p-3 rounded-xl flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="p-2 rounded-lg bg-rose-500/20 text-rose-300 flex-shrink-0">
                  <Bug className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-white text-xs">Menemukan Kendala atau Masukan?</p>
                  <p className="text-[11px] text-slate-400 truncate">
                    Kirimkan laporan bug atau saran untuk pembaruan fitur pelayanan
                  </p>
                </div>
              </div>
              <button
                type="button"
                id="btn-modal-laporkan-bug"
                onClick={() => setIsBugModalOpen(true)}
                className="btn-laporkan-bug btn-solid-white-text px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-[11px] flex-shrink-0 transition cursor-pointer shadow-sm flex items-center gap-1.5"
              >
                <MessageSquare className="w-3.5 h-3.5 text-white" />
                <span className="text-white font-bold">Laporkan Bug</span>
              </button>
            </div>

            {/* Tim Pengembang & Spesifikasi */}
            <div className="space-y-2.5">
              <h4 className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 text-xs uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                <Code2 className="w-4 h-4 flex-shrink-0" />
                Tim Developer &amp; Arsitektur Sistem
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
                <div className="bg-slate-50 dark:bg-slate-950/60 p-3 rounded-xl border border-slate-200 dark:border-slate-800/80 space-y-1">
                  <p className="font-bold text-slate-800 dark:text-slate-200 text-xs flex items-center justify-between">
                    <span>Pengembang Utama</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-500/20 dark:text-indigo-300 dark:border-indigo-500/30 font-mono">
                      v3.0.0
                    </span>
                  </p>
                  <p className="text-slate-600 dark:text-slate-400 text-[11px]">Tim Pengembang Pelayanan Digital GKE</p>
                  <p className="text-indigo-600 dark:text-indigo-400 text-[10px] font-semibold pt-0.5">
                    Pengembangan Perangkat Lunak &amp; Sistem Manajemen Gereja
                  </p>
                </div>

                <div className="bg-slate-50 dark:bg-slate-950/60 p-3 rounded-xl border border-slate-200 dark:border-slate-800/80 space-y-1">
                  <p className="font-bold text-slate-800 dark:text-slate-200 text-xs flex items-center justify-between">
                    <span>Teknologi Stack</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/30 font-mono">
                      Cloud Native
                    </span>
                  </p>
                  <p className="text-slate-600 dark:text-slate-400 text-[11px]">React 19, TypeScript, Tailwind CSS, Vite</p>
                  <p className="text-emerald-600 dark:text-emerald-400 text-[10px] font-semibold pt-0.5 flex items-center gap-1">
                    <Database className="w-3 h-3" /> Realtime Cloud Database &amp; Security Rules
                  </p>
                </div>
              </div>
            </div>

            {/* Core Modules & Features - Enhanced & Categorized */}
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <h4 className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 text-xs uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                  <Cpu className="w-4 h-4 flex-shrink-0" />
                  Modul Utama Terintegrasi (Full Suite)
                </h4>
                
                {/* Category Pills */}
                <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none text-[10px]">
                  <button
                    type="button"
                    onClick={() => setActiveCategory('all')}
                    className={`px-2 py-0.5 rounded-md font-medium whitespace-nowrap transition cursor-pointer ${
                      activeCategory === 'all'
                        ? 'bg-indigo-600 text-white font-bold'
                        : 'bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-400 hover:text-slate-950 dark:hover:text-slate-200'
                    }`}
                  >
                    Semua
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveCategory('ibadah')}
                    className={`px-2 py-0.5 rounded-md font-medium whitespace-nowrap transition cursor-pointer ${
                      activeCategory === 'ibadah'
                        ? 'bg-indigo-600 text-white font-bold'
                        : 'bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-400 hover:text-slate-950 dark:hover:text-slate-200'
                    }`}
                  >
                    Ibadah
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveCategory('warga')}
                    className={`px-2 py-0.5 rounded-md font-medium whitespace-nowrap transition cursor-pointer ${
                      activeCategory === 'warga'
                        ? 'bg-indigo-600 text-white font-bold'
                        : 'bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-400 hover:text-slate-950 dark:hover:text-slate-200'
                    }`}
                  >
                    Keanggotaan
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveCategory('keuangan')}
                    className={`px-2 py-0.5 rounded-md font-medium whitespace-nowrap transition cursor-pointer ${
                      activeCategory === 'keuangan'
                        ? 'bg-indigo-600 text-white font-bold'
                        : 'bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-400 hover:text-slate-950 dark:hover:text-slate-200'
                    }`}
                  >
                    Keuangan
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveCategory('tata_kelola')}
                    className={`px-2 py-0.5 rounded-md font-medium whitespace-nowrap transition cursor-pointer ${
                      activeCategory === 'tata_kelola'
                        ? 'bg-indigo-600 text-white font-bold'
                        : 'bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-400 hover:text-slate-950 dark:hover:text-slate-200'
                    }`}
                  >
                    Tata Kelola
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveCategory('sistem')}
                    className={`px-2 py-0.5 rounded-md font-medium whitespace-nowrap transition cursor-pointer ${
                      activeCategory === 'sistem'
                        ? 'bg-indigo-600 text-white font-bold'
                        : 'bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-400 hover:text-slate-950 dark:hover:text-slate-200'
                    }`}
                  >
                    Sistem &amp; AI
                  </button>
                </div>
              </div>

              {/* Modules List Grid */}
              <div className="space-y-3">
                {filteredCategories.map((cat) => (
                  <div key={cat.id} className="bg-slate-50 dark:bg-slate-950/40 p-3 rounded-xl border border-slate-200 dark:border-slate-800/70 space-y-2">
                    <div className="flex items-center gap-2">
                      <cat.icon className={`w-3.5 h-3.5 ${cat.color} flex-shrink-0`} />
                      <span className="font-bold text-slate-800 dark:text-slate-200 text-[11px]">{cat.title}</span>
                      <span className="text-[9px] text-slate-500 font-mono ml-auto">
                        {cat.items.length} Fitur
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      {cat.items.map((item, idx) => (
                        <div
                          key={idx}
                          className="bg-white dark:bg-slate-900/70 p-2 rounded-lg border border-slate-200 dark:border-slate-800/60 flex items-start gap-2 hover:border-indigo-500/30 transition group shadow-2xs"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400 flex-shrink-0 mt-0.5 group-hover:text-emerald-500 transition-colors" />
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-slate-800 dark:text-slate-200 text-[11px] leading-tight group-hover:text-indigo-600 dark:group-hover:text-white">
                              {item.name}
                            </p>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight mt-0.5 line-clamp-1">
                              {item.desc}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Contact Support & Legal */}
            <div className="border-t border-slate-200 dark:border-slate-800/80 pt-3 sm:pt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 sm:gap-3 text-[11px]">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-slate-600 dark:text-slate-400">
                <span className="flex items-center gap-1 break-all">
                  <Mail className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 flex-shrink-0" /> {settings.email}
                </span>
                <span className="hidden sm:inline">•</span>
                <span className="flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" /> {settings.telepon}
                </span>
              </div>

              {settings.website && (
                <a
                  href={
                    settings.website.startsWith('http://') || settings.website.startsWith('https://')
                      ? settings.website
                      : `https://${settings.website}`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-indigo-400 hover:text-indigo-300 font-semibold break-all"
                >
                  <span>{settings.website}</span>
                  <ExternalLink className="w-3 h-3 flex-shrink-0" />
                </a>
              )}
            </div>

            {/* Footer note */}
            <div className="text-center text-[10px] text-slate-500 pt-1 sm:pt-2 flex items-center justify-center gap-1 flex-wrap">
              <span>Dikembangkan dengan</span>
              <Heart className="w-3 h-3 text-rose-500 fill-rose-500 flex-shrink-0" />
              <span>untuk Kemuliaan Nama Tuhan &amp; Pelayanan Jemaat GKE</span>
            </div>
          </div>
        </div>
      </div>,
      document.body
    )}

      <LaporkanBugModal
        isOpen={isBugModalOpen}
        onClose={() => setIsBugModalOpen(false)}
      />
    </>
  );
};
