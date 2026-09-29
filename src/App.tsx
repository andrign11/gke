import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { PrintModal } from './components/PrintModal';
import { PublicPortal } from './components/portal/PublicPortal';
import { LoginScreen } from './components/LoginScreen';
import { NetworkStatusBanner } from './components/NetworkStatusBanner';
import { UnderConstructionScreen } from './components/UnderConstructionScreen';
import { MaintenanceTopBanner } from './components/MaintenanceTopBanner';
import { ToastContainer } from './components/ToastContainer';

// Modules
import { DashboardModule } from './components/modules/DashboardModule';
import { PenatuaDiakonModule } from './components/modules/PenatuaDiakonModule';
import { KeuanganModule } from './components/modules/KeuanganModule';
import { IuranKewajibanModule } from './components/modules/IuranKewajibanModule';
import { WargaJemaatModule } from './components/modules/WargaJemaatModule';
import { KematianJemaatModule } from './components/modules/KematianJemaatModule';
import { JadwalIbadahModule } from './components/modules/JadwalIbadahModule';
import { MPHModule } from './components/modules/MPHModule';
import { InventarisModule } from './components/modules/InventarisModule';
import { PemeliharaanAsetModule } from './components/modules/PemeliharaanAsetModule';
import { JabatanModule } from './components/modules/JabatanModule';
import { RenunganModule } from './components/modules/RenunganModule';
import { SettingsModule } from './components/modules/SettingsModule';
import { PengaturanHalamanWargaModule } from './components/modules/PengaturanHalamanWargaModule';
import { PengaturanQrisModule } from './components/modules/PengaturanQrisModule';
import { UserManagementModule } from './components/modules/UserManagementModule';
import { PendaftaranAnggotaModule } from './components/modules/PendaftaranAnggotaModule';
import { RancanganKhotbahModule } from './components/modules/RancanganKhotbahModule';
import { LingkunganModule } from './components/modules/LingkunganModule';
import { SingerJemaatModule } from './components/modules/SingerJemaatModule';
import { SuratModule } from './components/modules/SuratModule';
import { PelayananSakramenModule } from './components/modules/PelayananSakramenModule';
import { SuratPelimpahanModule } from './components/modules/SuratPelimpahanModule';
import { BeritaJemaatModule } from './components/modules/BeritaJemaatModule';
import { PersembahanDigitalModule } from './components/modules/PersembahanDigitalModule';
import { GopayWebhookModule } from './components/modules/GopayWebhookModule';
import { JadwalKatekisasiModule } from './components/modules/JadwalKatekisasiModule';
import { SeksiKategorialModule } from './components/modules/SeksiKategorialModule';
import { PanitiaPembangunanModule } from './components/modules/PanitiaPembangunanModule';
import { UlangTahunModule } from './components/modules/UlangTahunModule';
import { AlmanakNastModule } from './components/modules/AlmanakNastModule';
import { PerpustakaanModule } from './components/modules/PerpustakaanModule';
import { PemilihanModule } from './components/modules/PemilihanModule';
import { WhatsAppBotModule } from './components/modules/WhatsAppBotModule';
import { TaskBoardModule } from './components/modules/TaskBoardModule';
import { AlkitabModule } from './components/modules/AlkitabModule';
import { AuditKeamananModule } from './components/AuditKeamananModule';
import { LaporanBugModule } from './components/modules/LaporanBugModule';
import { PengaturanBackgroundModule } from './components/modules/PengaturanBackgroundModule';
import { TutorialModule } from './components/modules/TutorialModule';

const MainAppContent: React.FC = () => {
  const { isAuthenticated, currentUser, viewMode, activeTab, printConfig, settings } = useApp();

  const isMaintenanceActive = Boolean(settings?.maintenanceModeEnabled);
  const isAllowedMaintenanceRole =
    currentUser?.role === 'admin' ||
    Boolean(
      settings?.maintenanceAllowedRoles &&
        currentUser?.role &&
        settings.maintenanceAllowedRoles.includes(currentUser.role)
    );

  // If maintenance mode is active:
  // 1. If not authenticated -> display Under Construction Screen (with Admin Login Modal option)
  if (isMaintenanceActive && !isAuthenticated) {
    return (
      <>
        <NetworkStatusBanner />
        <UnderConstructionScreen />
      </>
    );
  }

  // 2. If authenticated but role is NOT allowed -> display Under Construction Screen
  if (isMaintenanceActive && isAuthenticated && !isAllowedMaintenanceRole) {
    return (
      <>
        <NetworkStatusBanner />
        <UnderConstructionScreen />
      </>
    );
  }

  // If not authenticated (and maintenance mode is NOT active), require standard login
  if (!isAuthenticated) {
    return (
      <>
        <NetworkStatusBanner />
        <LoginScreen />
      </>
    );
  }

  // Determine effective view mode based on role access rules:
  // - Role 'warga' -> strictly public portal (tab MPH dinonaktifkan)
  // - Role 'admin' -> strictly admin panel (tab Warga Jemaat dinonaktifkan)
  // - Other staff roles ('bendahara', 'sekretaris') -> can toggle between admin and public portal
  const isWarga = currentUser?.role === 'warga';
  const isAdmin = currentUser?.role === 'admin';
  const effectiveViewMode = isWarga ? 'public' : isAdmin ? 'admin' : viewMode;

  // Render Portal View for Warga Jemaat
  if (effectiveViewMode === 'public') {
    return (
      <div className="h-screen h-[100dvh] w-screen max-w-full bg-slate-950 flex flex-col text-slate-100 overflow-hidden">
        <NetworkStatusBanner />
        {isMaintenanceActive && <MaintenanceTopBanner />}
        <Header />
        <main className="flex-1 overflow-y-auto w-full min-w-0 bg-slate-50">
          <PublicPortal />
        </main>
        {printConfig && <PrintModal />}
      </div>
    );
  }

  // Render Module based on Active Tab in Admin System
  const renderActiveModule = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardModule />;
      case 'penatua_diakon':
        return <PenatuaDiakonModule />;
      case 'keuangan':
        return <KeuanganModule />;
      case 'iuran_kewajiban':
      case 'iuran':
      case 'iuran_warga':
      case 'iuran_bulanan':
      case 'kewajiban_warga':
        return <IuranKewajibanModule />;
      case 'warga_jemaat':
        return <WargaJemaatModule />;
      case 'kematian_jemaat':
      case 'data_kematian':
      case 'buku_kematian':
      case 'wafat':
        return <KematianJemaatModule />;
      case 'lingkungan':
      case 'lingkungan_jemaat':
        return <LingkunganModule />;
      case 'pendaftaran':
      case 'pendaftaran_warga':
        return <PendaftaranAnggotaModule />;
      case 'jadwal_ibadah':
        return <JadwalIbadahModule />;
      case 'singer_jemaat':
      case 'singer':
      case 'pemandu_lagu':
      case 'kantoria':
        return <SingerJemaatModule />;
      case 'rancangan_khotbah':
        return <RancanganKhotbahModule />;
      case 'almanak_nast':
      case 'almanak':
      case 'almanak_gke':
      case 'nast_gke':
        return <AlmanakNastModule />;
      case 'alkitab':
      case 'alkitab_online':
      case 'bible':
      case 'kitab_suci':
        return <AlkitabModule />;
      case 'mph':
      case 'mph_jemaat':
        return <MPHModule />;
      case 'jabatan_struktural':
      case 'jabatan':
      case 'jabatan_kategorial':
        return <JabatanModule />;
      case 'inventaris':
      case 'inventaris_aset':
        return <InventarisModule />;
      case 'pemeliharaan_aset':
      case 'jadwal_pemeliharaan':
      case 'servis_aset':
        return <PemeliharaanAsetModule />;
      case 'renungan':
      case 'renungan_khotbah':
        return <RenunganModule />;
      case 'agenda_surat':
      case 'surat':
        return <SuratModule />;
      case 'pelayanan_sakramen':
        return <PelayananSakramenModule />;
      case 'surat_pelimpahan_nikah':
      case 'pelimpahan_nikah':
        return <SuratPelimpahanModule />;
      case 'jadwal_katekisasi':
      case 'katekisasi':
        return <JadwalKatekisasiModule />;
      case 'seksi_kategorial':
      case 'kategorial':
      case 'spb':
      case 'spper':
      case 'spprp':
      case 'spa':
        return <SeksiKategorialModule />;
      case 'panitia_pembangunan':
      case 'pembangunan':
        return <PanitiaPembangunanModule />;
      case 'perpustakaan':
      case 'perpustakaan_rohani':
      case 'materi_pengajaran':
      case 'buku_rohani':
        return <PerpustakaanModule />;
      case 'pemilihan':
      case 'pemilihan_majelis':
      case 'evoting':
      case 'e_voting':
      case 'voting':
      case 'nominasi':
        return <PemilihanModule />;
      case 'ulang_tahun_jemaat':
      case 'ulang_tahun':
        return <UlangTahunModule />;
      case 'berita_jemaat':
        return <BeritaJemaatModule />;
      case 'persembahan_digital':
      case 'persembahan':
        return <PersembahanDigitalModule />;
      case 'gopay_webhook':
      case 'webhook_gopay':
      case 'webhook':
        return <GopayWebhookModule />;
      case 'pengaturan':
        return <SettingsModule />;
      case 'pengaturan_background':
      case 'background_login':
      case 'background_gereja':
      case 'pengaturan_baground':
        return <PengaturanBackgroundModule />;
      case 'pengaturan_halaman_warga':
      case 'halaman_warga':
      case 'pengaturan_portal':
        return <PengaturanHalamanWargaModule />;
      case 'pengaturan_qris':
      case 'pengaturan_persembahan':
      case 'qris_settings':
        return <PengaturanQrisModule />;
      case 'whatsapp_bot':
      case 'whatsapp':
      case 'bot_wa':
      case 'wa_bot':
      case 'gateway_wa':
        return <WhatsAppBotModule />;
      case 'manajemen_tugas':
      case 'task_board':
      case 'tugas_pelayanan':
      case 'tugas':
        return <TaskBoardModule />;
      case 'kelola_akun':
        return <UserManagementModule />;
      case 'audit_keamanan':
      case 'audit':
      case 'log_keamanan':
        return <AuditKeamananModule />;
      case 'laporan_bug':
      case 'lapor_bug':
      case 'bug_report':
      case 'bantuan_bug':
        return <LaporanBugModule />;
      case 'tutorial':
      case 'panduan':
      case 'buku_panduan':
      case 'panduan_aplikasi':
      case 'bantuan':
        return <TutorialModule />;
      default:
        return <DashboardModule />;
    }
  };

  return (
    <div className="h-screen h-[100dvh] w-screen max-w-full bg-slate-50 dark:bg-slate-950 flex flex-col text-slate-900 dark:text-slate-100 antialiased font-sans selection:bg-indigo-500 selection:text-white overflow-hidden">
      <NetworkStatusBanner />
      {isMaintenanceActive && <MaintenanceTopBanner />}
      <Header />

      <div className="flex-1 flex overflow-hidden w-full relative">
        <Sidebar />

        <main className="flex-1 p-3 sm:p-4 md:p-6 overflow-y-auto bg-slate-100/70 dark:bg-slate-900/50 w-full min-w-0 flex flex-col justify-between">
          <div className="w-full max-w-[1600px] mx-auto space-y-6 flex-1">
            {renderActiveModule()}
          </div>

          {/* Footer Halaman */}
          <footer className="w-full max-w-[1600px] mx-auto mt-8 pt-6 pb-2 border-t border-slate-200/80 dark:border-slate-800/80 text-center select-none">
            <p className="text-slate-500 dark:text-slate-500 text-[11px] font-medium">
              GKE System Digital © 2026
            </p>
          </footer>
        </main>
      </div>

      {printConfig && <PrintModal />}
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainAppContent />
      <ToastContainer />
    </AppProvider>
  );
}
