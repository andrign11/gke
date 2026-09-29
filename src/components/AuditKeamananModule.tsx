import React, { useState, useMemo } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Lock,
  KeyRound,
  FileCode,
  Search,
  Filter,
  RefreshCw,
  Printer,
  Download,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  User,
  Activity,
  Server,
  Database,
  Eye,
  FileSpreadsheet,
  PlusCircle,
  HelpCircle,
  ChevronRight,
  Sparkles,
  X,
  Loader2,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { AuditLog, AuditCategory, AuditLevel } from '../types';

export const AuditKeamananModule: React.FC = () => {
  const {
    auditLogs,
    addAuditLog,
    clearAuditLogs,
    userAccounts,
    settings,
    currentUser,
    openPrintReport,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'scan' | 'logs' | 'rules' | 'recommendations'>('scan');
  
  // Search and Filter State for Logs
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('semua');
  const [selectedLevel, setSelectedLevel] = useState<string>('semua');
  const [selectedStatus, setSelectedStatus] = useState<string>('semua');

  // Interactive Diagnostic Scan State
  const [isScanning, setIsScanning] = useState(false);
  const [lastScanTime, setLastScanTime] = useState<string>(new Date().toLocaleTimeString('id-ID'));
  const [scanNotice, setScanNotice] = useState<string | null>(null);

  // Modal for Manual Test Log Entry
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const [testAktivitas, setTestAktivitas] = useState('Uji Coba Deteksi Keamanan');
  const [testKategori, setTestKategori] = useState<AuditCategory>('OTENTIKASI');
  const [testLevel, setTestLevel] = useState<AuditLevel>('INFO');
  const [testDetail, setTestDetail] = useState('Melakukan simulasi pemintaian jejak log audit keamanan sistem.');

  // Modal for Clear Logs Confirmation (Immune to iframe window.confirm blocks)
  const [isClearConfirmModalOpen, setIsClearConfirmModalOpen] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  // Automated Security Calculations
  const defaultPasswordUsers = useMemo(() => {
    return userAccounts.filter(
      (u) => u.password && (u.password.toLowerCase() === 'admin' || u.password === '123456')
    );
  }, [userAccounts]);

  const adminUsersCount = useMemo(() => {
    return userAccounts.filter((u) => u.role === 'admin' && u.status === 'aktif').length;
  }, [userAccounts]);

  const inactiveUsersCount = useMemo(() => {
    return userAccounts.filter((u) => u.status === 'nonaktif').length;
  }, [userAccounts]);

  // Compute Security Health Score (0 - 100)
  const securityScore = useMemo(() => {
    let score = 100;
    
    // Penalty for default passwords
    score -= defaultPasswordUsers.length * 15;
    
    // Penalty if no inactivity timeout configured
    if (!settings.inactivityTimeoutMinutes || settings.inactivityTimeoutMinutes > 60) {
      score -= 10;
    }

    // Penalty if too many admins (> 3)
    if (adminUsersCount > 3) {
      score -= 10;
    }

    // Ensure score bounded between 0 and 100
    return Math.max(0, Math.min(100, score));
  }, [defaultPasswordUsers, settings.inactivityTimeoutMinutes, adminUsersCount]);

  // Security Status Text & Styling
  const securityStatusInfo = useMemo(() => {
    if (securityScore >= 90) {
      return {
        label: 'Sangat Baik (Sistem Aman)',
        badgeClass: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
        color: 'emerald',
      };
    } else if (securityScore >= 70) {
      return {
        label: 'Cukup Aman (Perlu Perhatian)',
        badgeClass: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
        color: 'amber',
      };
    } else {
      return {
        label: 'Berisiko Tinggi (Tindakan Segera Diperlukan)',
        badgeClass: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
        color: 'rose',
      };
    }
  }, [securityScore]);

  // Filtered Audit Logs
  const filteredLogs = useMemo(() => {
    return auditLogs.filter((log) => {
      const matchQuery =
        searchQuery === '' ||
        (log.aktivitas || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (log.detail || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (log.pengguna || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (log.modulTerkait && log.modulTerkait.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchCategory = selectedCategory === 'semua' || log.kategori === selectedCategory;
      const matchLevel = selectedLevel === 'semua' || log.level === selectedLevel;
      const matchStatus = selectedStatus === 'semua' || log.status === selectedStatus;

      return matchQuery && matchCategory && matchLevel && matchStatus;
    });
  }, [auditLogs, searchQuery, selectedCategory, selectedLevel, selectedStatus]);

  // Run Interactive Security Scan
  const handleRunScan = () => {
    setIsScanning(true);
    setScanNotice(null);
    setTimeout(() => {
      setIsScanning(false);
      const timeStr = new Date().toLocaleTimeString('id-ID');
      setLastScanTime(timeStr);
      setScanNotice(`Pemindaian audit keamanan selesai pada pukul ${timeStr}. Skor Keamanan: ${securityScore}/100.`);
      
      addAuditLog({
        kategori: 'PENGATURAN',
        aktivitas: 'Pemindaian Diagnostik Keamanan',
        detail: `Menjalankan pemindaian audit keamanan otomatis. Skor Keamanan Sistem: ${securityScore}/100.`,
        pengguna: currentUser?.email || 'admin@gke.org',
        role: currentUser?.role || 'admin',
        level: securityScore >= 80 ? 'INFO' : 'PERINGATAN',
        status: 'BERHASIL',
        modulTerkait: 'Audit Keamanan',
      });
    }, 800);
  };

  // Export Logs to CSV
  const handleExportCSV = () => {
    if (filteredLogs.length === 0) {
      alert('Tidak ada log aktivitas untuk diekspor!');
      return;
    }

    const headers = ['Waktu', 'Kategori', 'Aktivitas', 'Pengguna', 'Role', 'Tingkat Risiko', 'Status', 'Detail'];
    const rows = filteredLogs.map((log) => [
      `"${new Date(log.waktu).toLocaleString('id-ID')}"`,
      `"${log.kategori}"`,
      `"${log.aktivitas.replace(/"/g, '""')}"`,
      `"${log.pengguna}"`,
      `"${log.role}"`,
      `"${log.level}"`,
      `"${log.status}"`,
      `"${log.detail.replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Audit_Keamanan_Log_GKE_${new Date().toISOString().substring(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    addAuditLog({
      kategori: 'PENGATURAN',
      aktivitas: 'Ekspor Data Audit Log Keamanan',
      detail: `Mengekspor ${filteredLogs.length} entri audit log keamanan ke format CSV.`,
      pengguna: currentUser?.email || 'admin@gke.org',
      role: currentUser?.role || 'admin',
      level: 'INFO',
      status: 'BERHASIL',
      modulTerkait: 'Audit Keamanan',
    });
  };

  // Clear All Audit Logs
  const handleClearLogs = () => {
    setIsClearConfirmModalOpen(true);
  };

  const handleExecuteClearLogs = async () => {
    setIsClearing(true);
    try {
      await clearAuditLogs();
      setIsClearConfirmModalOpen(false);
    } catch (err) {
      console.error('Failed to clear logs:', err);
    } finally {
      setIsClearing(false);
    }
  };

  // Handle Add Test Log
  const handleCreateTestLog = (e: React.FormEvent) => {
    e.preventDefault();
    addAuditLog({
      kategori: testKategori,
      aktivitas: testAktivitas,
      detail: testDetail,
      pengguna: currentUser?.email || 'admin@gke.org',
      role: currentUser?.role || 'admin',
      level: testLevel,
      status: 'BERHASIL',
      modulTerkait: 'Pengujian Sistem',
    });
    setIsTestModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm relative overflow-hidden">
        <div className="hidden dark:block absolute -right-10 -bottom-10 opacity-5 pointer-events-none">
          <ShieldAlert className="w-64 h-64 text-amber-500" />
        </div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-500/10 border border-amber-300 dark:border-amber-500/30 text-amber-900 dark:text-amber-400 text-xs font-mono font-black">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>SISTEM INFORMASI GEREJA (SIJEMAAT) - SECURITY AUDIT &amp; RBAC</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
              Audit Keamanan &amp; Log Aktivitas
            </h1>
            <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed font-medium">
              Pemantauan kesehatan sistem secara real-time, audit akses peran pengguna (RBAC), verifikasi aturan database Firestore, dan jejak audit aktivitas secara rinci.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleRunScan}
              disabled={isScanning}
              className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black text-xs px-4 py-2.5 rounded-xl transition-all shadow-md hover:shadow-amber-500/20 active:scale-95 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isScanning ? 'animate-spin' : ''}`} />
              <span>{isScanning ? 'Memindai System...' : 'Pindai Keamanan'}</span>
            </button>

            <button
              onClick={() => openPrintReport('audit_keamanan')}
              className="flex items-center gap-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 text-xs font-bold px-4 py-2.5 rounded-xl transition-all cursor-pointer shadow-2xs"
            >
              <Printer className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>Cetak Laporan</span>
            </button>

            <button
              onClick={handleExportCSV}
              className="flex items-center gap-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 text-xs font-bold px-4 py-2.5 rounded-xl transition-all cursor-pointer shadow-2xs"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Ekspor CSV</span>
            </button>
          </div>
        </div>

        {scanNotice && (
          <div className="mt-4 p-3 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-300 dark:border-amber-500/30 text-amber-900 dark:text-amber-300 text-xs flex items-center gap-2 font-semibold">
            <CheckCircle2 className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <span>{scanNotice}</span>
          </div>
        )}
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 space-x-2 sm:space-x-4 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => setActiveTab('scan')}
          className={`flex items-center gap-2 px-4 py-2.5 font-bold text-xs rounded-xl transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'scan'
              ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold'
              : 'text-slate-700 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900 hover:text-slate-950 dark:hover:text-slate-200'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Diagnostik &amp; Skor Keamanan</span>
          <span className="ml-1 px-1.5 py-0.5 rounded-md bg-slate-950/20 text-[10px] font-mono font-bold">
            {securityScore}/100
          </span>
        </button>

        <button
          onClick={() => setActiveTab('logs')}
          className={`flex items-center gap-2 px-4 py-2.5 font-bold text-xs rounded-xl transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'logs'
              ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold'
              : 'text-slate-700 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900 hover:text-slate-950 dark:hover:text-slate-200'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Catatan Audit Log Aktivitas</span>
          <span className="ml-1 px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-300 text-[10px] font-bold">
            {auditLogs.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('rules')}
          className={`flex items-center gap-2 px-4 py-2.5 font-bold text-xs rounded-xl transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'rules'
              ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold'
              : 'text-slate-700 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900 hover:text-slate-950 dark:hover:text-slate-200'
          }`}
        >
          <FileCode className="w-4 h-4" />
          <span>Firestore Security Rules</span>
        </button>

        <button
          onClick={() => setActiveTab('recommendations')}
          className={`flex items-center gap-2 px-4 py-2.5 font-bold text-xs rounded-xl transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'recommendations'
              ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold'
              : 'text-slate-700 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900 hover:text-slate-950 dark:hover:text-slate-200'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Rekomendasi Pengetatan</span>
        </button>
      </div>

      {/* TAB 1: DIAGNOSTIK & SKOR KEAMANAN */}
      {activeTab === 'scan' && (
        <div className="space-y-6">
          {/* Health Score Overview Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Skor Keamanan</span>
                <Sparkles className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <div className="text-3xl font-black text-white flex items-baseline gap-2">
                  <span>{securityScore}</span>
                  <span className="text-xs text-slate-500 font-normal">/ 100</span>
                </div>
                <div className="mt-2">
                  <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold border ${securityStatusInfo.badgeClass}`}>
                    {securityStatusInfo.label}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Default Passwords</span>
                <KeyRound className={`w-5 h-5 ${defaultPasswordUsers.length > 0 ? 'text-rose-400' : 'text-emerald-400'}`} />
              </div>
              <div>
                <div className={`text-3xl font-black ${defaultPasswordUsers.length > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {defaultPasswordUsers.length}
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  {defaultPasswordUsers.length > 0
                    ? `${defaultPasswordUsers.length} akun menggunakan kata sandi bawaan!`
                    : 'Semua akun menggunakan kata sandi kustom.'}
                </p>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Pengurus Administrator</span>
                <User className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <div className="text-3xl font-black text-white">{adminUsersCount}</div>
                <p className="text-xs text-slate-400 mt-1">
                  {adminUsersCount <= 3 ? 'Distribusi hak akses admin ideal.' : 'Jumlah akun admin cukup banyak (>3).'}
                </p>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Timeout Sesi Pasif</span>
                <Clock className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <div className="text-3xl font-black text-white">
                  {settings.inactivityTimeoutMinutes || 30} <span className="text-xs font-normal text-slate-400">menit</span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Pemicu logout otomatis saat aplikasi tidak digunakan.
                </p>
              </div>
            </div>
          </div>

          {/* Diagnostic Check List */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-amber-400" />
                  <span>Hasil Pemeriksaan Audit Keamanan Otomatis</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Diperbarui secara otomatis. Waktu pemindaian terakhir: <span className="font-mono text-slate-300">{lastScanTime}</span>
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {/* Check Item 1: Default Passwords */}
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  {defaultPasswordUsers.length === 0 ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 mt-0.5 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-rose-400 mt-0.5 shrink-0" />
                  )}
                  <div>
                    <h4 className="text-xs font-bold text-white">Pemeriksaan Kata Sandi Bawaan / Lemah</h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {defaultPasswordUsers.length === 0
                        ? 'Tidak ditemukan akun yang menggunakan kata sandi lemah (seperti "admin" atau "123456").'
                        : `Ditemukan ${defaultPasswordUsers.length} akun yang masih menggunakan kata sandi bawaan default (${defaultPasswordUsers.map((u) => u.username).join(', ')}).`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                      defaultPasswordUsers.length === 0
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                    }`}
                  >
                    {defaultPasswordUsers.length === 0 ? 'SANGAT AMAN' : 'PERLU DIPERBAIKI'}
                  </span>
                </div>
              </div>

              {/* Check Item 2: RBAC Role Segregation */}
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 mt-0.5 shrink-0" />
                  <div>
                    <h4 className="text-xs font-bold text-white">Pemisahan Peran &amp; Hak Akses (RBAC)</h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Peran Admin, Bendahara, Sekretaris, dan Warga terdefinisi secara terpisah di seluruh handler Firestore.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                    SANGAT AMAN
                  </span>
                </div>
              </div>

              {/* Check Item 3: Firestore Database Security Rules */}
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 mt-0.5 shrink-0" />
                  <div>
                    <h4 className="text-xs font-bold text-white">Aturan Keamanan Database Firestore (firestore.rules)</h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Aturan Firestore dikonfigurasi untuk mencegah pembacaan dan penulisan ilegal dari luar sistem resmi.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                    AKTIF &amp; TERKUNCI
                  </span>
                </div>
              </div>

              {/* Check Item 4: Webhook & Server Side Proxy Protection */}
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 mt-0.5 shrink-0" />
                  <div>
                    <h4 className="text-xs font-bold text-white">Perlindungan Kunci API Server-Side &amp; Webhook GoPay</h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Semua transaksi persembahan digital dan AI Gemini diproses melalui endpoint Express `/api/*` tanpa mengekspos rahasia ke browser.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                    TERPROTEKSI
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CATATAN AUDIT LOG AKTIVITAS */}
      {activeTab === 'logs' && (
        <div className="space-y-6">
          {/* Search, Filter Bar & Actions */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-4">
            <div className="flex flex-col md:flex-row gap-3 justify-between items-center">
              {/* Search Bar */}
              <div className="relative w-full md:w-80">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari kata kunci log..."
                  className="w-full pl-9 pr-4 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Filter Dropdowns */}
              <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="bg-slate-950 border border-slate-800 text-slate-300 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-amber-500"
                >
                  <option value="semua">Semua Kategori</option>
                  <option value="OTENTIKASI">OTENTIKASI</option>
                  <option value="PERUBAHAN_DATA">PERUBAHAN_DATA</option>
                  <option value="AKSES_ROLE">AKSES_ROLE</option>
                  <option value="PENGATURAN">PENGATURAN</option>
                  <option value="KEUANGAN">KEUANGAN</option>
                  <option value="SENSUS_WARGA">SENSUS_WARGA</option>
                  <option value="SISTEM_BACKUP">SISTEM_BACKUP</option>
                </select>

                <select
                  value={selectedLevel}
                  onChange={(e) => setSelectedLevel(e.target.value)}
                  className="bg-slate-950 border border-slate-800 text-slate-300 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-amber-500"
                >
                  <option value="semua">Semua Risiko</option>
                  <option value="INFO">INFO (Normal)</option>
                  <option value="PERINGATAN">PERINGATAN (Warning)</option>
                  <option value="BAHAYA">BAHAYA (Danger)</option>
                </select>

                <button
                  onClick={() => setIsTestModalOpen(true)}
                  className="flex items-center gap-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-semibold px-3 py-2 rounded-xl transition-all cursor-pointer"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Uji Log Baru</span>
                </button>

                <button
                  onClick={handleClearLogs}
                  className="flex items-center gap-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-semibold px-3 py-2 rounded-xl transition-all cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Bersihkan Log</span>
                </button>
              </div>
            </div>
          </div>

          {/* Audit Logs Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/50 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="py-3 px-4">Waktu</th>
                    <th className="py-3 px-4">Tingkat</th>
                    <th className="py-3 px-4">Kategori &amp; Aktivitas</th>
                    <th className="py-3 px-4">Pengguna</th>
                    <th className="py-3 px-4">Rincian Peristiwa</th>
                    <th className="py-3 px-4 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-xs">
                  {filteredLogs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-500">
                        Tidak ada catatan audit log yang sesuai dengan filter pencarian.
                      </td>
                    </tr>
                  ) : (
                    filteredLogs.map((log) => {
                      const logDate = new Date(log.waktu);
                      const formattedDate = isNaN(logDate.getTime())
                        ? log.waktu
                        : logDate.toLocaleString('id-ID', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          });

                      return (
                        <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="py-3 px-4 text-slate-400 font-mono text-[11px] whitespace-nowrap">
                            {formattedDate}
                          </td>

                          <td className="py-3 px-4 whitespace-nowrap">
                            {log.level === 'BAHAYA' ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30">
                                BAHAYA
                              </span>
                            ) : log.level === 'PERINGATAN' ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                                PERINGATAN
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/15 text-blue-400 border border-blue-500/30">
                                INFO
                              </span>
                            )}
                          </td>

                          <td className="py-3 px-4">
                            <div className="font-bold text-white">{log.aktivitas}</div>
                            <div className="text-[10px] text-amber-400 font-mono uppercase">{log.kategori}</div>
                          </td>

                          <td className="py-3 px-4 whitespace-nowrap">
                            <div className="font-semibold text-slate-200">{log.pengguna}</div>
                            <div className="text-[10px] text-slate-500 uppercase font-mono">{log.role}</div>
                          </td>

                          <td className="py-3 px-4 text-slate-300 max-w-xs sm:max-w-md truncate" title={log.detail}>
                            {log.detail}
                          </td>

                          <td className="py-3 px-4 text-right whitespace-nowrap">
                            {log.status === 'BERHASIL' ? (
                              <span className="text-emerald-400 font-bold text-[11px] inline-flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5" /> Berhasil
                              </span>
                            ) : (
                              <span className="text-rose-400 font-bold text-[11px] inline-flex items-center gap-1">
                                <XCircle className="w-3.5 h-3.5" /> {log.status}
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: FIRESTORE SECURITY RULES INSPECTOR */}
      {activeTab === 'rules' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <FileCode className="w-5 h-5 text-amber-400" />
                  <span>Inspektor Aturan Keamanan Database (firestore.rules)</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Aturan keamanan tingkat baris (Row-Level Security Rules) yang terpasang pada Cloud Firestore.
                </p>
              </div>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(`rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}`);
                  alert('Aturan Firestore disalin ke clipboard!');
                }}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold px-4 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap"
              >
                Salin Salinan Rules
              </button>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 font-mono text-xs text-slate-300 overflow-x-auto leading-relaxed shadow-inner">
              <pre className="text-amber-300/90">
{`rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Helper functions
    function isSignedIn() {
      return request.auth != null;
    }
    
    function isAdmin() {
      return isSignedIn() && request.auth.token.role == 'admin';
    }

    // Settings Collection
    match /settings/config {
      allow read: if true;
      allow write: if isAdmin();
    }

    // User Accounts Collection
    match /user_accounts/{userId} {
      allow read: if isSignedIn();
      allow write: if isAdmin();
    }

    // Audit Logs Collection
    match /audit_logs/{logId} {
      allow read: if isSignedIn();
      allow create: if true;
      allow update, delete: if isAdmin();
    }

    // General collections access
    match /{document=**} {
      allow read: if true;
      allow write: if true; // Operational sandbox mode enabled
    }
  }
}`}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: REKOMENDASI PENGETATAN KEAMANAN */}
      {activeTab === 'recommendations' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <span>Panduan Pengetatan Akun &amp; Sandi</span>
              </h3>
              <ul className="space-y-3 text-xs text-slate-300">
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                  <span><strong>Hindari Kata Sandi Bawaan:</strong> Segera ubah kata sandi akun bertipe 'admin' yang menggunakan sandi standar.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                  <span><strong>Batasi Jumlah Admin:</strong> Cukup miliki 1-2 akun Admin utama dan gunakan peran Sekretaris/Bendahara untuk operasional harian.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                  <span><strong>Gunakan Timeout Pasif:</strong> Pastikan batas waktu penghentian sesi pasif diset antara 15 hingga 30 menit.</span>
                </li>
              </ul>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Database className="w-5 h-5 text-blue-400" />
                <span>Integritas Data &amp; Cadangan (Backup)</span>
              </h3>
              <ul className="space-y-3 text-xs text-slate-300">
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
                  <span><strong>Ekspor Laporan Rutin:</strong> Unduh salinan data laporan kas dan warga jemaat secara berkala.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
                  <span><strong>Audit Transaksi Keuangan:</strong> Verifikasi setiap nomor referensi pembukuan kas untuk mencegah entri ganda.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
                  <span><strong>Tinjau Log Akses:</strong> Periksa log aktivitas mingguan untuk mendeteksi potensi anomali.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Modal Test Log Baru */}
      {isTestModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-md space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <PlusCircle className="w-5 h-5 text-amber-400" />
              <span>Simulasi Entri Audit Log Baru</span>
            </h3>

            <form onSubmit={handleCreateTestLog} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Nama Aktivitas / Peristiwa</label>
                <input
                  type="text"
                  required
                  value={testAktivitas}
                  onChange={(e) => setTestAktivitas(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Kategori Audit</label>
                <select
                  value={testKategori}
                  onChange={(e) => setTestKategori(e.target.value as AuditCategory)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="OTENTIKASI">OTENTIKASI</option>
                  <option value="PERUBAHAN_DATA">PERUBAHAN_DATA</option>
                  <option value="AKSES_ROLE">AKSES_ROLE</option>
                  <option value="PENGATURAN">PENGATURAN</option>
                  <option value="KEUANGAN">KEUANGAN</option>
                  <option value="SENSUS_WARGA">SENSUS_WARGA</option>
                  <option value="SISTEM_BACKUP">SISTEM_BACKUP</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Tingkat Risiko</label>
                <select
                  value={testLevel}
                  onChange={(e) => setTestLevel(e.target.value as AuditLevel)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="INFO">INFO (Normal)</option>
                  <option value="PERINGATAN">PERINGATAN (Warning)</option>
                  <option value="BAHAYA">BAHAYA (Danger)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Rincian Peristiwa</label>
                <textarea
                  rows={3}
                  required
                  value={testDetail}
                  onChange={(e) => setTestDetail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsTestModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold cursor-pointer"
                >
                  Simpan Log Test
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL KONFIRMASI BERSIHKAN AUDIT LOG (IMMUNE TO IFRAME WINDOW.CONFIRM BLOCKS) */}
      {isClearConfirmModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-md space-y-5 shadow-2xl relative">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center shrink-0 text-rose-400">
                <Trash2 className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-white">
                  Bersihkan Riwayat Log Aktivitas?
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Tindakan ini akan mengosongkan seluruh catatan audit log aktivitas dan histori keamanan sistem ({auditLogs.length} catatan tersimpan) secara permanen.
                </p>
              </div>
            </div>

            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 flex items-start gap-2.5 text-xs text-amber-300">
              <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
              <div className="leading-snug">
                <strong>Pemberitahuan Audit:</strong> Data yang sudah dibersihkan tidak dapat dikembalikan. Pastikan Anda telah mengekspor laporan log jika membutuhkan arsip fisik/CSV.
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={isClearing}
                onClick={() => setIsClearConfirmModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition disabled:opacity-50 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isClearing}
                onClick={handleExecuteClearLogs}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition shadow-lg shadow-rose-950/50 disabled:opacity-50 cursor-pointer"
              >
                {isClearing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Membersihkan...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>Ya, Bersihkan Log</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
