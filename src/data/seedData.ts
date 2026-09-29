import {
  AgendaSurat,
  AppSettings,
  BeritaJemaat,
  InventarisAset,
  PemeliharaanAset,
  JabatanOrganisasi,
  JadwalIbadah,
  JadwalKatekisasi,
  KegiatanKategorial,
  KeuanganItem,
  IuranKewajiban,
  Lingkungan,
  MPHMember,
  PendaftaranAnggota,
  PenatuaDiakon,
  PelayananSakramen,
  PengurusKategorial,
  PengurusPembangunan,
  ProyekPembangunan,
  RancanganKhotbah,
  RenunganItem,
  UserAccount,
  WargaJemaat,
  AuditLog,
  MateriPengajaran,
  KatalogBuku,
  PeminjamanBuku,
  SesiPemilihan,
  KandidatPemilihan,
  SuaraVoting,
  NominasiAspirasi,
  WhatsAppBotConfig,
  WhatsAppKeywordRule,
  WhatsAppBroadcastMessage,
  WhatsAppMessageLog,
  WhatsAppPrayerRequest,
  PelayananTask,
  LaporanBug,
  SingerJemaat,
} from '../types';

export const initialLingkunganList: Lingkungan[] = [];
export const initialSingerJemaatList: SingerJemaat[] = [];

export const initialSettings: AppSettings = {
  namaAplikasi: 'SIKA GKE',
  deskripsiAplikasi: 'Sistem Informasi Manajemen Jemaat & Pelayanan Digital Jemaat GKE',
  namaJemaat: '',
  resortGke: '',
  alamatGereja: '',
  telepon: '',
  email: '',
  website: '',
  logoUrl: '',
  headerKopLine1: 'GEREJA KALIMANTAN EVANGELIS (GKE)',
  headerKopLine1b: '(Anggota Persekutuan Gereja-Gereja di Indonesia / PGI)',
  headerKopLine2: 'MAJELIS JEMAAT GKE',
  headerKopLine3a: 'Badan Hukum: Keputusan Menteri Agama RI No. 33 Tahun 1970 Tanggal 27 Mei 1970',
  headerKopLine3b: 'SK Dirjen Bimas Kristen Depag RI No. 129 Tahun 1989 Tanggal 18 Juli 1989',
  headerKopLine4: 'MAJELIS RESORT GKE',
  headerKopLine5: '',
  tempatDiterbitkan: '',
  namaKetuaJemaat: '',
  namaBendahara: '',
  namaSekretaris: '',
  nipKetuaJemaat: '',
  nipBendahara: '',
  nipSekretaris: '',
  periodePelayananMPH: '2024 - 2029',

  // Kas Pembangunan
  namaKetuaPembangunan: '',
  namaBendaharaPembangunan: '',
  nipKetuaPembangunan: '',
  nipBendaharaPembangunan: '',

  // Kas SPPer
  namaKetuaSpper: '',
  namaBendaharaSpper: '',
  nipKetuaSpper: '',
  nipBendaharaSpper: '',

  // Kas SPB
  namaKetuaSpb: '',
  namaBendaharaSpb: '',
  nipKetuaSpb: '',
  nipBendaharaSpb: '',

  // Kas SPPR/P
  namaKetuaSpprp: '',
  namaBendaharaSpprp: '',
  nipKetuaSpprp: '',
  nipBendaharaSpprp: '',

  // Kas Anak Sekolah Minggu (SPA / ASHM)
  namaKetuaSpa: '',
  namaBendaharaSpa: '',
  nipKetuaSpa: '',
  nipBendaharaSpa: '',

  // Penandatangan Khusus BPP & MP
  namaKetuaBpp: '',
  nipKetuaBpp: '',
  namaSekretarisBpp: '',
  nipSekretarisBpp: '',
  namaKetuaMp: '',
  nipKetuaMp: '',
  namaSekretarisMp: '',
  nipSekretarisMp: '',

  // QRIS & Persembahan Digital
  qrisMerchantName: '',
  qrisNmid: '',
  qrisImageUrl: '',
  gopayAccountName: '',
  gopayAccountNumber: '',
  noWhatsappAdmin: '',
  bankAccountBca: '',
  bankAccountMandiri: '',
  qrisAutoPollingEnabled: false,
  qrisAutoPollingDurationSeconds: 60,

  inactivityTimeoutMinutes: 15,

  // Pengaturan Background Halaman & Login
  loginBackgroundUrl: 'https://images.unsplash.com/photo-1543731068-7e0f5beff43a?auto=format&fit=crop&w=1920&q=80',
  loginBackgroundOverlayOpacity: 0.35,
  loginBackgroundBlur: 'none',

  // Pengaturan Form & Sistem Penomoran Pelaporan / Dokumen (Format Baku Juknis Persuratan Sinode GKE)
  tingkatOrganisasi: 'jemaat',
  kodeJemaatPenomoran: 'PR',
  kodeOrganisasiPenomoran: 'MPH-MJ.GKE',
  prefixSuratMasuk: 'SM',
  prefixSuratKeluar: 'SK',
  prefixSuratBaptis: 'SBK',
  prefixSuratSidi: 'SIDI',
  prefixSuratNikah: 'SN',
  prefixWartaJemaat: 'WARTA-GKE',
  prefixKjj: 'KJJ-GKE',
  prefixKasKeuangan: 'MKK',
  prefixKodeAset: 'AST',

  // Visibilitas Halaman Default (Semua Halaman Aktif/Enabled)
  portalPageVisibility: {
    beranda: true,
    jadwal: true,
    renungan: true,
    pendaftaran: true,
    sensus: true,
    kartu_keluarga: true,
    persembahan_qris: true,
    notifikasi_persembahan: true,
    keuangan: true,
    kepengurusan: true,
    aset: true,
  },

  // Mode Perbaikan & Pemeliharaan Sistem (Under Construction Mode)
  maintenanceModeEnabled: false,
  maintenanceTitle: 'Sistem Sedang Dalam Masa Pemeliharaan & Perbaikan',
  maintenanceMessage:
    'Mohon maaf atas ketidaknyamanan ini. Majelis Jemaat dan Tim IT saat ini sedang melakukan pembaruan sistem, optimasi database, dan peningkatan fitur pelayanan jemaat. Sistem informasi akan segera aktif kembali.',
  maintenanceEstimatedCompletion: 'Perkiraan selesai segera dalam beberapa saat',
  maintenanceContactPerson: 'Sekretariat Majelis Jemaat / WhatsApp Admin',
  maintenanceAllowedRoles: ['admin'],
};

export const initialUserAccounts: UserAccount[] = [
  {
    id: 'usr-admin',
    username: 'admin',
    namaLengkap: 'Administrator Majelis',
    namaPanggilan: 'Admin',
    email: 'AndrieG74@gmail.com',
    role: 'admin',
    status: 'aktif',
    password: 'admin',
    jabatanGereja: 'Administrator Sistem',
  },
];

export const initialJabatanOrganisasi: JabatanOrganisasi[] = [
  // 11 Jabatan Berdasarkan SK (Tanpa Nomor)
  {
    id: 'jab-sk-1',
    nama: 'KETUA SPP/R',
    kategori: 'Seksi Kategorial',
    deskripsi: 'Ketua Seksi Pelayanan Pemuda & Remaja (SPP/R) Jemaat GKE berdasarkan SK Majelis',
    urutan: 1,
    aktif: true,
  },
  {
    id: 'jab-sk-2',
    nama: 'BENDAHARA SPP/R',
    kategori: 'Seksi Kategorial',
    deskripsi: 'Bendahara Seksi Pelayanan Pemuda & Remaja (SPP/R) Jemaat GKE berdasarkan SK Majelis',
    urutan: 2,
    aktif: true,
  },
  {
    id: 'jab-sk-3',
    nama: 'SEKRETARIS SPP/R',
    kategori: 'Seksi Kategorial',
    deskripsi: 'Sekretaris Seksi Pelayanan Pemuda & Remaja (SPP/R) Jemaat GKE berdasarkan SK Majelis',
    urutan: 3,
    aktif: true,
  },
  {
    id: 'jab-sk-4',
    nama: 'KETUA MAJELIS PERTIMBANGAN (MP)',
    kategori: 'Badan & Majelis Pertimbangan',
    deskripsi: 'Ketua Majelis Pertimbangan (MP) Jemaat GKE berdasarkan SK',
    urutan: 4,
    aktif: true,
  },
  {
    id: 'jab-sk-5',
    nama: 'ANGGOTA MAJELIS PERTIMBANGAN (MP)',
    kategori: 'Badan & Majelis Pertimbangan',
    deskripsi: 'Anggota Majelis Pertimbangan (MP) Jemaat GKE berdasarkan SK',
    urutan: 5,
    aktif: true,
  },
  {
    id: 'jab-sk-6',
    nama: 'KETUA BADAN PEMERIKSA PERBENDAHARAAN (BPP)',
    kategori: 'Badan & Majelis Pertimbangan',
    deskripsi: 'Ketua Badan Pemeriksa Perbendaharaan (BPP) Jemaat GKE berdasarkan SK',
    urutan: 6,
    aktif: true,
  },
  {
    id: 'jab-sk-7',
    nama: 'ANGGOTA BADAN PEMERIKSA PERBENDAHARAAN (BPP)',
    kategori: 'Badan & Majelis Pertimbangan',
    deskripsi: 'Anggota Badan Pemeriksa Perbendaharaan (BPP) Jemaat GKE berdasarkan SK',
    urutan: 7,
    aktif: true,
  },
  {
    id: 'jab-sk-8',
    nama: 'KETUA SEKSI DIAKONIA',
    kategori: 'MPH / Majelis Jemaat',
    deskripsi: 'Ketua Seksi Diakonia & Sosial Jemaat GKE berdasarkan SK',
    urutan: 8,
    aktif: true,
  },
  {
    id: 'jab-sk-9',
    nama: 'ANGGOTA SEKSI DIAKONIA',
    kategori: 'MPH / Majelis Jemaat',
    deskripsi: 'Anggota Seksi Diakonia & Sosial Jemaat GKE berdasarkan SK',
    urutan: 9,
    aktif: true,
  },
  {
    id: 'jab-sk-10',
    nama: 'KETUA GEREJA RAMAH ANAK, REMAJA DAN PEMUDA (GRARP)',
    kategori: 'MPH / Majelis Jemaat',
    deskripsi: 'Ketua Pokja Gereja Ramah Anak, Remaja dan Pemuda (GRARP) berdasarkan SK',
    urutan: 10,
    aktif: true,
  },
  {
    id: 'jab-sk-11',
    nama: 'ANGGOTA GEREJA RAMAH ANAK, REMAJA DAN PEMUDA (GRARP)',
    kategori: 'MPH / Majelis Jemaat',
    deskripsi: 'Anggota Pokja Gereja Ramah Anak, Remaja dan Pemuda (GRARP) berdasarkan SK',
    urutan: 11,
    aktif: true,
  },
  // Jabatan Struktural MPH & Majelis Jemaat Utama
  {
    id: 'jab-mph-1',
    nama: 'Ketua Majelis Jemaat GKE',
    kategori: 'MPH / Majelis Jemaat',
    deskripsi: 'Pimpinan Utama & Ketua Majelis Pekerja Harian (MPH) Jemaat GKE',
    urutan: 12,
    aktif: true,
  },
  {
    id: 'jab-mph-2',
    nama: 'Wakil Ketua Majelis Jemaat GKE',
    kategori: 'MPH / Majelis Jemaat',
    deskripsi: 'Wakil Ketua Majelis Pekerja Harian (MPH) Jemaat GKE',
    urutan: 13,
    aktif: true,
  },
  {
    id: 'jab-mph-3',
    nama: 'Sekretaris Majelis Jemaat GKE',
    kategori: 'MPH / Majelis Jemaat',
    deskripsi: 'Sekretaris Majelis Pekerja Harian (MPH) Jemaat GKE',
    urutan: 14,
    aktif: true,
  },
  {
    id: 'jab-mph-4',
    nama: 'Wakil Sekretaris Majelis Jemaat GKE',
    kategori: 'MPH / Majelis Jemaat',
    deskripsi: 'Wakil Sekretaris Majelis Pekerja Harian (MPH) Jemaat GKE',
    urutan: 15,
    aktif: true,
  },
  {
    id: 'jab-mph-5',
    nama: 'Bendahara Majelis Jemaat GKE',
    kategori: 'MPH / Majelis Jemaat',
    deskripsi: 'Bendahara Majelis Pekerja Harian (MPH) Jemaat GKE',
    urutan: 16,
    aktif: true,
  },
  {
    id: 'jab-mph-6',
    nama: 'Anggota Majelis Jemaat',
    kategori: 'MPH / Majelis Jemaat',
    deskripsi: 'Anggota Majelis Pekerja Harian / Majelis Jemaat',
    urutan: 17,
    aktif: true,
  },
  // Jabatan Seksi Pelayanan Kategorial Lainnya
  {
    id: 'jab-kat-1',
    nama: 'Ketua Seksi Pelayanan Bapak (SPB)',
    kategori: 'Seksi Kategorial',
    deskripsi: 'Ketua Pengurus Seksi Pelayanan Bapak (SPB)',
    urutan: 18,
    aktif: true,
  },
  {
    id: 'jab-kat-2',
    nama: 'Sekretaris Seksi Pelayanan Bapak (SPB)',
    kategori: 'Seksi Kategorial',
    deskripsi: 'Sekretaris Pengurus Seksi Pelayanan Bapak (SPB)',
    urutan: 19,
    aktif: true,
  },
  {
    id: 'jab-kat-3',
    nama: 'Bendahara Seksi Pelayanan Bapak (SPB)',
    kategori: 'Seksi Kategorial',
    deskripsi: 'Bendahara Pengurus Seksi Pelayanan Bapak (SPB)',
    urutan: 20,
    aktif: true,
  },
  {
    id: 'jab-kat-4',
    nama: 'Ketua Seksi Pelayanan Perempuan (SPPer)',
    kategori: 'Seksi Kategorial',
    deskripsi: 'Ketua Pengurus Seksi Pelayanan Perempuan (SPPer)',
    urutan: 21,
    aktif: true,
  },
  {
    id: 'jab-kat-5',
    nama: 'Sekretaris Seksi Pelayanan Perempuan (SPPer)',
    kategori: 'Seksi Kategorial',
    deskripsi: 'Sekretaris Pengurus Seksi Pelayanan Perempuan (SPPer)',
    urutan: 22,
    aktif: true,
  },
  {
    id: 'jab-kat-6',
    nama: 'Bendahara Seksi Pelayanan Perempuan (SPPer)',
    kategori: 'Seksi Kategorial',
    deskripsi: 'Bendahara Pengurus Seksi Pelayanan Perempuan (SPPer)',
    urutan: 23,
    aktif: true,
  },
  {
    id: 'jab-kat-7',
    nama: 'Ketua Seksi Pelayanan Anak / Sekolah Minggu (SPA)',
    kategori: 'Seksi Kategorial',
    deskripsi: 'Ketua Pengurus Seksi Pelayanan Anak / Guru Sekolah Minggu (SPA/ASHM)',
    urutan: 24,
    aktif: true,
  },
  {
    id: 'jab-kat-8',
    nama: 'Sekretaris Seksi Pelayanan Anak / Sekolah Minggu (SPA)',
    kategori: 'Seksi Kategorial',
    deskripsi: 'Sekretaris Pengurus Seksi Pelayanan Anak / Sekolah Minggu (SPA/ASHM)',
    urutan: 25,
    aktif: true,
  },
  {
    id: 'jab-kat-9',
    nama: 'Bendahara Seksi Pelayanan Anak / Sekolah Minggu (SPA)',
    kategori: 'Seksi Kategorial',
    deskripsi: 'Bendahara Pengurus Seksi Pelayanan Anak / Sekolah Minggu (SPA/ASHM)',
    urutan: 26,
    aktif: true,
  },
  // Jabatan Panitia & Pokja
  {
    id: 'jab-pan-1',
    nama: 'Ketua Panitia Pembangunan',
    kategori: 'Panitia & Pokja',
    deskripsi: 'Ketua Panitia Pembangunan & Renovasi Sarana Gereja',
    urutan: 27,
    aktif: true,
  },
  {
    id: 'jab-pan-2',
    nama: 'Sekretaris Panitia Pembangunan',
    kategori: 'Panitia & Pokja',
    deskripsi: 'Sekretaris Panitia Pembangunan',
    urutan: 28,
    aktif: true,
  },
  {
    id: 'jab-pan-3',
    nama: 'Bendahara Panitia Pembangunan',
    kategori: 'Panitia & Pokja',
    deskripsi: 'Bendahara Panitia Pembangunan',
    urutan: 29,
    aktif: true,
  },
  {
    id: 'jab-pan-4',
    nama: 'Koordinator Teknis & Pengawasan',
    kategori: 'Panitia & Pokja',
    deskripsi: 'Koordinator Teknis Lapangan Panitia Pembangunan',
    urutan: 30,
    aktif: true,
  },
  {
    id: 'jab-pan-5',
    nama: 'Anggota Panitia Pembangunan',
    kategori: 'Panitia & Pokja',
    deskripsi: 'Anggota Tim Panitia Pembangunan',
    urutan: 31,
    aktif: true,
  },
];

export const initialMPHMembers: MPHMember[] = [];
export const initialPenatuaDiakon: PenatuaDiakon[] = [];
export const initialKeuanganItems: KeuanganItem[] = [];
export const initialIuranKewajibanList: IuranKewajiban[] = [];
export const initialWargaJemaat: WargaJemaat[] = [];
export const initialJadwalIbadah: JadwalIbadah[] = [];
export const initialInventarisAset: InventarisAset[] = [];
export const initialPemeliharaanAset: PemeliharaanAset[] = [];
export const initialRenunganItems: RenunganItem[] = [];
export const initialPendaftaranAnggota: PendaftaranAnggota[] = [];
export const initialRancanganKhotbah: RancanganKhotbah[] = [];
export const initialAgendaSurat: AgendaSurat[] = [];
export const initialPelayananSakramen: PelayananSakramen[] = [];
export const initialBeritaJemaatList: BeritaJemaat[] = [];
export const initialJadwalKatekisasi: JadwalKatekisasi[] = [];
export const initialPengurusKategorial: PengurusKategorial[] = [];
export const initialKegiatanKategorial: KegiatanKategorial[] = [];
export const initialPengurusPembangunan: PengurusPembangunan[] = [];
export const initialProyekPembangunan: ProyekPembangunan[] = [];

export const initialAuditLogs: AuditLog[] = [];

// Seed Data Perpustakaan & Bahan Pengajaran Rohani
export const initialMateriPengajaranList: MateriPengajaran[] = [];

export const initialKatalogBukuList: KatalogBuku[] = [];

export const initialPeminjamanBukuList: PeminjamanBuku[] = [];

// Seed Data Sesi Pemilihan & E-Voting
export const initialSesiPemilihanList: SesiPemilihan[] = [];

export const initialKandidatPemilihanList: KandidatPemilihan[] = [];

export const initialSuaraVotingList: SuaraVoting[] = [];

export const initialNominasiAspirasiList: NominasiAspirasi[] = [];

export const initialWhatsAppBotConfig: WhatsAppBotConfig = {
  isEnabled: true,
  provider: 'internal',
  nomorDevice: '0812-3456-7890',
  senderName: 'GKE Bot Pelayanan',
  apiKeyToken: 'INTERNAL_GKE_BOT_TOKEN_2026',
  apiKey: 'INTERNAL_GKE_BOT_TOKEN_2026',
  webhookSecret: '',
  autoGreetingEnabled: true,
  greetingMessage: 'Shalom! 🌿 Selamat datang di Layanan Otomatis WhatsApp Bot Jemaat GKE.\n\nKetik *MENU* untuk melihat daftar informasi ibadah, warta, renungan harian, rekening persembahan, maupun menyampaikan pokok doa.',
  fallbackMessage: 'Maaf, pesan Anda belum terdaftar dalam sistem bot kami. 🙏\n\nSilakan ketik *MENU* untuk melihat daftar kata kunci yang tersedia, atau ketik *DOA* jika ingin menyampaikan pokok doa kepada Majelis Jemaat.',
  jamOperasionalMulai: '06:00',
  jamOperasionalSelesai: '22:00',
  enableAiAssistant: true,
  notifyPastorOnPrayerRequest: false,
  notifTargetNumberPastor: '',
  terakhirSinkron: new Date().toLocaleDateString('id-ID'),
  statusKoneksi: 'Terhubung',
  cooldownMenitPerNomor: 10,
  cooldownSecondsBetweenMessages: 3,
  maxReplyQuotaPerFiveMin: 20,
  isCooldownEnabled: true,
};

export const initialWhatsAppKeywordRules: WhatsAppKeywordRule[] = [
  {
    id: 'kw-menu',
    keyword: 'MENU',
    label: 'Menu Layanan & Informasi Gereja',
    deskripsi: 'Menampilkan daftar kata kunci dan angka navigasi layanan digital gereja',
    matchType: 'EXACT',
    kategori: 'INFORMASI',
    responseTemplate: `🏛️ *LAYANAN WHATSAPP RESMI {nama_gereja}*
----------------------------------------
Shalom *{nama_pengirim}*! Selamat datang di layanan informasi digital jemaat terpadu.

Silakan pilih informasi yang Anda butuhkan dengan membalas *Angka (1-12)* atau *Kata Kunci* berikut:

1️⃣ *JADWAL* : Jadwal Ibadah Hari Minggu & Jam Kebaktian
2️⃣ *WARTA* : Warta Jemaat Edisi Terakhir & Lampiran PDF
3️⃣ *KAS* : Saldo Kas Jemaat Real-Time & Transparansi
4️⃣ *JIWA* : Jumlah Jiwa Warga Jemaat, Penatua & Diakon
5️⃣ *IURAN* : Data Iuran Kewajiban (Global & Cek Perorangan)
6️⃣ *PEMBANGUNAN* : Saldo Kas Pembangunan & Seksi Kategorial
7️⃣ *KATEKISASI* : Jadwal Katekisasi SIDI & Pernikahan
8️⃣ *PEMILIHAN* : E-Voting Versi Pemilihan Majelis / Panitia
9️⃣ *ULANGTAHUN* : Data Ulang Tahun Warga Jemaat
🔟 *PERSEMBAHAN* : Persembahan QRIS & Rekening Kas Bank
1️⃣1️⃣ *RENUNGAN* : Nats Renungan Firman Tuhan Hari Ini
1️⃣2️⃣ *KONTAK* : Kontak Majelis, Alamat & Lokasi Gedung

🔍 *Layanan Khusus Interaktif:*
👉 *IURAN#NoKJJ* : Cek iuran kewajiban keluarga perorangan (Contoh: *IURAN#1001*)
👉 *DOA#Nama#Rayon#PokokDoa* : Kirim permohonan doa syafaat ke Majelis Jemaat

💡 *Tips:* Anda cukup mengetik angka *1* sampai *12* untuk memilih informasi di atas.
_Tuhan Yesus memberkati kehidupan dan keluarga Anda!_ 🙏✝️`,
    isActive: true,
    hitCount: 0,
  },
  {
    id: 'kw-jadwal',
    keyword: 'JADWAL',
    label: 'Jadwal Ibadah Hari Minggu',
    deskripsi: 'Jadwal ibadah sesi 1, 2, 3, petugas liturgi & pengkhotbah minggu ini',
    matchType: 'CONTAINS',
    kategori: 'IBADAH',
    responseTemplate: `⏰ *JADWAL IBADAH - {nama_gereja}*
----------------------------------------
Shalom *{nama_pengirim}*, berikut jadwal ibadah persekutuan terdekat:

{jadwal_ibadah_real}

📍 Tempat: Gedung Gereja ({alamat_gereja})
_Mari bersama kita bersekutu, beribadah, dan memuji nama Tuhan!_ ✝️✨
Ketik *MENU* untuk melihat menu lainnya.`,
    isActive: true,
    hitCount: 0,
  },
  {
    id: 'kw-warta',
    keyword: 'WARTA',
    label: 'Warta Jemaat & Berita Pelayanan',
    deskripsi: 'Pengumuman kegiatan, persekutuan doa, sepekan dan lampiran PDF',
    matchType: 'CONTAINS',
    kategori: 'INFORMASI',
    responseTemplate: `📰 *WARTA JEMAAT EDISI TERAKHIR*
*{nama_gereja}*
----------------------------------------
Shalom *{nama_pengirim}*,
Berikut warta kegiatan pelayanan & pengumuman resmi sepekan:

{warta_jemaat_real}

📄 *LAMPIRAN DOKUMEN & PDF WARTA RESMI:*
Unduh atau baca Warta Jemaat versi dokumen PDF lengkap:
🔗 {link_pdf_warta}

Ketik *MENU* untuk kembali ke menu utama. 🙏`,
    isActive: true,
    hitCount: 0,
  },
  {
    id: 'kw-kas',
    keyword: 'KAS',
    label: 'Laporan Kas & Transparansi Keuangan',
    deskripsi: 'Informasi saldo kas gereja, total penerimaan, pengeluaran & posisi buku kas real-time',
    matchType: 'CONTAINS',
    kategori: 'KEUANGAN',
    responseTemplate: `💰 *LAPORAN KAS & KEUANGAN REAL-TIME*
*{nama_gereja}*
----------------------------------------
Shalom *{nama_pengirim}*,
Berikut posisi kas keuangan jemaat yang terintegrasi langsung dengan pembukuan kas gereja:

📅 *Posisi Per:* {tanggal}

📈 *Total Penerimaan Kas:*
Rp {total_penerimaan}

📉 *Total Pengeluaran Kas:*
Rp {total_pengeluaran}

💵 *SALDO KAS TERSEDIA:*
*Rp {saldo_kas_akhir}*

📊 *Rincian Pos Kas Jemaat:*
• Kas Umum & Operasional: Rp {saldo_kas_umum}
• Kas Pembangunan & Sarpras: Rp {saldo_kas_pembangunan}
• Kas Diakonia & Kasih: Rp {saldo_kas_diakonia}

⚖️ *Akuntabilitas & Transparansi:*
Seluruh persembahan dan kas jemaat dikelola secara akuntabel oleh Bendahara Majelis Jemaat dan diaudit berkala oleh Badan Pemeriksa Perbendaharaan (BPP).

Ketik *PEMBANGUNAN* untuk kas seksi/kategorial, atau *MENU* untuk menu utama. 🙏`,
    isActive: true,
    hitCount: 0,
  },
  {
    id: 'kw-jiwa',
    keyword: 'JIWA',
    label: 'Jumlah Jiwa, Penatua & Diakon',
    deskripsi: 'Statistik demografi warga jemaat, jumlah jiwa, jumlah KK, dan daftar penatua diakon aktif',
    matchType: 'CONTAINS',
    kategori: 'INFORMASI',
    responseTemplate: `👥 *STATISTIK JUMLAH JIWA & MAJELIS JEMAAT*
*{nama_gereja}*
----------------------------------------
Shalom *{nama_pengirim}*,
Berikut data demografi warga jemaat dan jajaran pelayan majelis jemaat yang tercatat di sistem:

{jiwa_dan_penatua_real}

Ketik *MENU* untuk kembali ke menu utama. 🙏`,
    isActive: true,
    hitCount: 0,
  },
  {
    id: 'kw-iuran',
    keyword: 'IURAN',
    label: 'Data Iuran Kewajiban (Global & Perorangan)',
    deskripsi: 'Rekapitulasi penerimaan iuran wajib se-jemaat dan panduan cek perorangan via IURAN#NoKJJ',
    matchType: 'CONTAINS',
    kategori: 'KEUANGAN',
    responseTemplate: `📑 *DATA IURAN KEWAJIBAN WARGA JEMAAT*
*{nama_gereja}*
----------------------------------------
Shalom *{nama_pengirim}*,
Berikut laporan ketercapaian iuran kewajiban warga jemaat tahun {tahun_iuran}:

{iuran_global_real}

🔍 *PANDUAN CEK IURAN KELUARGA PERORANGAN:*
Untuk mengecek status pembayaran & sisa kewajiban Kartu Keluarga Jemaat (KJJ) Anda, silakan kirim pesan WhatsApp dengan format:
👉 *IURAN#NoKJJ*

Contoh:
*IURAN#1001* atau *IURAN#KJJ-2026-001*

Sistem bot akan langsung mengecek dan menampilkan rincian bulan lunas serta sisa kewajiban KJJ Anda secara otomatis. 🙏

Ketik *MENU* untuk kembali ke menu utama.`,
    isActive: true,
    hitCount: 0,
  },
  {
    id: 'kw-pembangunan',
    keyword: 'PEMBANGUNAN',
    label: 'Kas Pembangunan & Seksi Kategorial',
    deskripsi: 'Saldo kas pembangunan fisik dan kas seksi kategorial SPB, SPPer, SPPR/P, ASHM',
    matchType: 'CONTAINS',
    kategori: 'KEUANGAN',
    responseTemplate: `🏗️ *SALDO KAS PEMBANGUNAN & KATEGORIAL*
*{nama_gereja}*
----------------------------------------
Shalom *{nama_pengirim}*,
Berikut posisi saldo kas pembangunan dan saldo pos seksi kategorial jemaat:

{saldo_pembangunan_dan_kategorial_real}

Ketik *PERSEMBAHAN* untuk menyalurkan partisipasi dana pembangunan / persembahan syukur kategorial. 🙏
Ketik *MENU* untuk kembali ke menu utama.`,
    isActive: true,
    hitCount: 0,
  },
  {
    id: 'kw-katekisasi',
    keyword: 'KATEKISASI',
    label: 'Jadwal Katekisasi SIDI & Pernikahan',
    deskripsi: 'Informasi dan jadwal kelas sidi remaja/dewasa dan katekisasi pra-nikah',
    matchType: 'CONTAINS',
    kategori: 'LAYANAN',
    responseTemplate: `🕊️ *JADWAL KATEKISASI SIDI & PERNIKAHAN*
*{nama_gereja}*
----------------------------------------
Shalom *{nama_pengirim}*,
Berikut informasi pembinaan iman dan katekisasi di {nama_gereja}:

{jadwal_katekisasi_real}

📞 Untuk pendaftaran sakramen & katekisasi, hubungi Kantor Sekretariat Majelis Jemaat ({kontak_gereja}).
Ketik *MENU* untuk kembali ke menu utama. 🙏`,
    isActive: true,
    hitCount: 0,
  },
  {
    id: 'kw-pemilihan',
    keyword: 'PEMILIHAN',
    label: 'E-Voting Versi Pemilihan',
    deskripsi: 'Informasi sesi e-voting pemilihan majelis/panitia, daftar calon kandidat & link voting',
    matchType: 'CONTAINS',
    kategori: 'INFORMASI',
    responseTemplate: `🗳️ *E-VOTING & SESI PEMILIHAN JEMAAT*
*{nama_gereja}*
----------------------------------------
Shalom *{nama_pengirim}*,
Berikut status pelaksanaan e-voting pemilihan kepengurusan / majelis gereja:

{sesi_pemilihan_real}

🌐 *Tautan E-Voting Resmi:* {link_voting_portal}
Setiap warga jemaat yang berhak memilih dapat menggunakan hak suaranya secara transparan dan terenkripsi.

Ketik *MENU* untuk kembali ke menu utama. 🙏`,
    isActive: true,
    hitCount: 0,
  },
  {
    id: 'kw-ulangtahun',
    keyword: 'ULANGTAHUN',
    label: 'Data Ulang Tahun Warga Jemaat',
    deskripsi: 'Daftar warga jemaat yang berulang tahun kelahiran & ulang tahun pernikahan',
    matchType: 'CONTAINS',
    kategori: 'PASTORAL',
    responseTemplate: `🎂 *DATA ULANG TAHUN WARGA JEMAAT*
*{nama_gereja}*
----------------------------------------
Shalom *{nama_pengirim}*,
Berikut warga jemaat yang merayakan hari ulang tahun:

{ulang_tahun_warga_real}

_"Kiranya TUHAN memberkati engkau dan melindungi engkau; TUHAN menyinari engkau dengan wajah-Nya dan memberi engkau kasih karunia." (Bilangan 6:24-25)_ 🙏✨

Ketik *MENU* untuk kembali ke menu utama.`,
    isActive: true,
    hitCount: 0,
  },
  {
    id: 'kw-persembahan',
    keyword: 'PERSEMBAHAN',
    label: 'Persembahan Digital & Scan QRIS',
    deskripsi: 'Panduan persembahan non-tunai melalui QRIS Nasional (GoPay/OVO/Dana/BCA/Mandiri/BRI)',
    matchType: 'CONTAINS',
    kategori: 'KEUANGAN',
    responseTemplate: `📲 *PERSEMBAHAN DIGITAL & QRIS NASIONAL*
*{nama_gereja}*
----------------------------------------
Shalom *{nama_pengirim}*,
{nama_gereja} melayani persembahan digital (non-tunai) yang aman, cepat, dan transparan:

1️⃣ *SCAN QRIS NASIONAL (Semua Bank & Dompet Digital):*
• Dapat discan via: BCA Mobile, Livin Mandiri, BRImo, BNI Mobile, QRIS Bank Kalteng, GoPay, OVO, DANA, ShopeePay, LinkAja.
• Merchant Resmi: *{merchant_qris}*
• NMID: *{nmid_qris}*
• Tautan Scan QRIS Web: {url_qris}

2️⃣ *TRANSFER REKENING BANK RESMI:*
🏛️ *Bank Mandiri (Kas Operasional Jemaat):*
• No. Rekening: *{no_rek_mandiri}*
• Atas Nama: *{an_rek_mandiri}*

🏛️ *Bank BPK / Bank Kalteng (Dana Pembangunan):*
• No. Rekening: *{no_rek_bpk}*
• Atas Nama: *{an_rek_bpk}*

3️⃣ *POS PENYALURAN PERSEMBAHAN:*
• Persembahan Syukur Ibadah Minggu & Bulanan
• Persembahan Perpuluhan (Maleakhi 3:10)
• Persembahan Khusus Pembangunan Gedung Gereja
• Dana Diakonia & Aksi Kasih Warga Jemaat

💬 *Konfirmasi Persembahan:*
Konfirmasi bukti transfer dapat dikirimkan ke WhatsApp Majelis ({kontak_gereja}) atau melalui formulir portal jemaat.

_"Muliakanlah TUHAN dengan hartamu dan dengan hasil pertama dari segala penghasilanmu." (Amsal 3:9)_ 🙏✝️`,
    isActive: true,
    hitCount: 0,
  },
  {
    id: 'kw-rekening',
    keyword: 'REKENING',
    label: 'Rekening Persembahan & Kas Jemaat',
    deskripsi: 'Nomor rekening bank kas jemaat, pembangunan, dan persembahan transfer',
    matchType: 'CONTAINS',
    kategori: 'KEUANGAN',
    responseTemplate: `💳 *NOMOR REKENING BANK RESMI - {nama_gereja}*
----------------------------------------
Shalom *{nama_pengirim}*,
Bagi warga jemaat dan simpatisan yang rindu menyalurkan persembahan syukur, perpuluhan, dan diakonia melalui transfer bank:

🏛️ *Bank Mandiri (Kas Operasional Jemaat):*
• No. Rekening: *{no_rek_mandiri}*
• Atas Nama: *{an_rek_mandiri}*

🏛️ *Bank BPK / Bank Kalteng (Dana Pembangunan):*
• No. Rekening: *{no_rek_bpk}*
• Atas Nama: *{an_rek_bpk}*

📲 *Persembahan QRIS:* Ketik *PERSEMBAHAN* untuk petunjuk scan QRIS via GoPay, OVO, Dana & Mobile Banking.

_"Hendaklah masing-masing memberikan menurut kerelaan hatinya, bukan dengan sedih hati atau karena paksaan, sebab Allah mengasihi orang yang memberi dengan sukacita." (2 Korintus 9:7)_ 🙏`,
    isActive: true,
    hitCount: 0,
  },
  {
    id: 'kw-renungan',
    keyword: 'RENUNGAN',
    label: 'Renungan & Nats Harian',
    deskripsi: 'Ayat Alkitab dan inspirasi firman Tuhan harian',
    matchType: 'CONTAINS',
    kategori: 'PASTORAL',
    responseTemplate: `📖 *RENUNGAN FIRMAN TUHAN HARI INI*
----------------------------------------
{renungan_real}

Shalom *{nama_pengirim}*,
Apapun pergumulan, kelelahan, dan beban hidup yang sedang dihadapi hari ini, ingatlah bahwa Tuhan tidak pernah tertidur. Kasih setia-Nya selalu baru setiap pagi. Tetaplah melangkah dengan iman dan penuh ucapan syukur!

_Tuhan Yesus memberkati hari dan aktivitas Anda!_ ✝️✨
Ketik *MENU* untuk kembali ke menu utama.`,
    isActive: true,
    hitCount: 0,
  },
  {
    id: 'kw-kontak',
    keyword: 'KONTAK',
    label: 'Kontak Majelis & Konseling',
    deskripsi: 'Nomor telepon kantor sekretariat, ketua majelis dan jadwal konseling pastoral',
    matchType: 'CONTAINS',
    kategori: 'LAYANAN',
    responseTemplate: `📞 *KONTAK MAJELIS JEMAAT & KONSELING*
----------------------------------------
Shalom *{nama_pengirim}*,
Berikut saluran komunikasi resmi {nama_gereja}:

• *Kantor Sekretariat:* {kontak_gereja}
• *Alamat Kantor:* {alamat_gereja}
• *Jam Layanan Kantor:* Selasa - Sabtu, pkl 08.00 - 15.00 WIB
• *Layanan Konseling Pastoral:* Pendeta Jemaat siap melayani konseling dengan perjanjian terlebih dahulu.

Ketik *MENU* untuk kembali ke menu utama. 🙏`,
    isActive: true,
    hitCount: 0,
  },
  {
    id: 'kw-lokasi',
    keyword: 'LOKASI',
    label: 'Lokasi & Alamat Gedung Gereja',
    deskripsi: 'Alamat fisik gedung gereja dan panduan navigasi Google Maps',
    matchType: 'CONTAINS',
    kategori: 'INFORMASI',
    responseTemplate: `📍 *LOKASI GEDUNG GEREJA - {nama_gereja}*
----------------------------------------
Shalom *{nama_pengirim}*,
Alamat lengkap gedung gereja:
🏢 *{alamat_gereja}*

📌 *Navigasi Google Maps:*
https://maps.google.com

_Tersedia area parkir yang luas, akses ramah lansia, dan ruang ibadah ber-AC._
Sampai jumpa di ibadah persekutuan Minggu! ✝️
Ketik *MENU* untuk kembali ke menu utama.`,
    isActive: true,
    hitCount: 0,
  },
  {
    id: 'kw-doa',
    keyword: 'DOA',
    label: 'Panduan Permohonan Doa Syafaat',
    deskripsi: 'Format pengiriman pokok doa warga jemaat yang langsung dicatat ke buku doa',
    matchType: 'STARTS_WITH',
    kategori: 'PASTORAL',
    responseTemplate: `🙏 *LAYANAN PERMOHONAN DOA SYAFAAT*
----------------------------------------
Shalom *{nama_pengirim}*,
Tim Doa Majelis Jemaat & Pendeta siap mendoakan pergumulan Anda.

Kirimkan permohonan doa Anda dengan format:
👉 *DOA#Nama#Rayon#PokokDoa*

Contoh:
*DOA#Ibu Maria#Rayon 3#Mohon doa kesembuhan untuk keluarga yang sedang sakit.*

Tim pendoa akan segera mencatat dan membawakan dalam doa persekutuan jemaat. Tuhan Yesus mendengar setiap seruan hati Anda! ❤️
Ketik *MENU* untuk kembali ke menu utama.`,
    isActive: true,
    hitCount: 0,
  },
];

export const initialWhatsAppBroadcastMessages: WhatsAppBroadcastMessage[] = [];

export const initialWhatsAppMessageLogs: WhatsAppMessageLog[] = [];

export const initialWhatsAppPrayerRequests: WhatsAppPrayerRequest[] = [];

export const initialPelayananTasks: PelayananTask[] = [];

export const initialLaporanBugList: LaporanBug[] = [
  {
    id: 'bug-1',
    judul: 'Pratinjau Cetak Laporan Keuangan Margin Rapi di Tampilan Mobile',
    kategori: 'Cetak & Ekspor Dokumen',
    prioritas: 'Sedang',
    halamanTerkait: 'Buku Kas Jemaat',
    deskripsi: 'Penyesuaian tata letak cetak dokumen kas dan laporan warta agar tabel tidak overflow pada layar berukuran kecil.',
    langkahReproduksi: '1. Buka modul Keuangan di smartphone\n2. Klik tombol Cetak Laporan\n3. Pilih periode bulan ini dan pratinjau',
    status: 'Selesai',
    pelapor: {
      nama: 'Bendahara Majelis',
      email: 'bendahara@gke.id',
      noHp: '081234567890',
      role: 'bendahara',
    },
    tanggapanAdmin: 'Telah disesuaikan dengan viewport responsif dan optimasi print media query standar A4/F4.',
    ditanganiOleh: 'Tim Pengembang Sistem GKE',
    tanggalLapor: '2026-08-25 09:30',
    tanggalUpdate: '2026-08-26 11:20',
    infoPerangkat: {
      browser: 'Chrome 128',
      os: 'Android / Windows',
      screenResolution: '1920x1080',
      url: '/keuangan',
      onlineStatus: true,
    },
  },
];

export { initialAlmanakNastList } from './almanakSeed';




