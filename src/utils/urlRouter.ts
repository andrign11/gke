/**
 * URL Router Utility for GKE Church Management System (v3.0)
 * Supports standard URL structures:
 * 1. Query Parameters: ?menu=jadwal_ibadah, ?tab=keuangan, ?halaman=pendaftaran_warga, ?modul=persembahan_digital
 * 2. Clean Pathnames: /path/jadwal-ibadah, /path/keuangan, /path/pendaftaran, /jadwal-ibadah, etc.
 * 3. Hash Slugs: #/jadwal-ibadah, #/menu=keuangan
 */

export const TAB_TO_PATH_MAP: Record<string, string> = {
  dashboard: '/path/dashboard',
  berita_jemaat: '/path/berita-jemaat',
  jadwal_ibadah: '/path/jadwal-ibadah',
  alkitab: '/path/alkitab',
  almanak_nast: '/path/almanak-nast',
  rancangan_khotbah: '/path/rancangan-khotbah',
  renungan: '/path/renungan',
  renungan_khotbah: '/path/renungan',
  perpustakaan: '/path/perpustakaan',
  warga_jemaat: '/path/warga-jemaat',
  pendaftaran_warga: '/path/pendaftaran-warga',
  pendaftaran: '/path/pendaftaran-warga',
  lingkungan_jemaat: '/path/lingkungan',
  lingkungan: '/path/lingkungan',
  ulang_tahun_jemaat: '/path/ulang-tahun',
  ulang_tahun: '/path/ulang-tahun',
  pelayanan_sakramen: '/path/pelayanan-sakramen',
  surat_pelimpahan_nikah: '/path/surat-pelimpahan-nikah',
  surat_pelimpahan: '/path/surat-pelimpahan-nikah',
  jadwal_katekisasi: '/path/jadwal-katekisasi',
  seksi_kategorial: '/path/seksi-kategorial',
  keuangan: '/path/keuangan',
  iuran_kewajiban: '/path/iuran-kewajiban',
  persembahan_digital: '/path/persembahan-digital',
  persembahan_qris: '/path/persembahan-digital',
  persembahan: '/path/persembahan-digital',
  gopay_webhook: '/path/gopay-webhook',
  webhook_gopay: '/path/gopay-webhook',
  panitia_pembangunan: '/path/panitia-pembangunan',
  mph_jemaat: '/path/mph',
  mph: '/path/mph',
  penatua_diakon: '/path/penatua-diakon',
  jabatan_struktural: '/path/jabatan-struktural',
  pemilihan: '/path/pemilihan',
  inventaris_aset: '/path/inventaris',
  inventaris: '/path/inventaris',
  pemeliharaan_aset: '/path/pemeliharaan-aset',
  pemeliharaan: '/path/pemeliharaan-aset',
  manajemen_tugas: '/path/manajemen-tugas',
  agenda_surat: '/path/agenda-surat',
  surat: '/path/agenda-surat',
  pengaturan: '/path/pengaturan',
  pengaturan_background: '/path/pengaturan-background',
  pengaturan_halaman_warga: '/path/pengaturan-portal',
  pengaturan_qris: '/path/pengaturan-qris',
  whatsapp_bot: '/path/whatsapp-bot',
  kelola_akun: '/path/kelola-akun',
  audit_keamanan: '/path/audit-keamanan',
  laporan_bug: '/path/laporan-bug',
  pengembangan_aplikasi: '/path/pengembangan-aplikasi',
};

// Aliases mapping for query parameters & slugs
export const TAB_ALIASES: Record<string, string> = {
  // Dashboard
  dashboard: 'dashboard',
  beranda: 'dashboard',
  home: 'dashboard',
  utama: 'dashboard',

  // Ibadah & Rohani
  jadwal_ibadah: 'jadwal_ibadah',
  'jadwal-ibadah': 'jadwal_ibadah',
  jadwal: 'jadwal_ibadah',
  ibadah: 'jadwal_ibadah',
  liturgi: 'jadwal_ibadah',

  alkitab: 'alkitab',
  'alkitab-online': 'alkitab',
  bible: 'alkitab',
  kitab: 'alkitab',

  almanak_nast: 'almanak_nast',
  'almanak-nast': 'almanak_nast',
  almanak: 'almanak_nast',
  nast: 'almanak_nast',
  'nast-gke': 'almanak_nast',

  rancangan_khotbah: 'rancangan_khotbah',
  'rancangan-khotbah': 'rancangan_khotbah',
  khotbah: 'rancangan_khotbah',

  renungan: 'renungan_khotbah',
  renungan_khotbah: 'renungan_khotbah',
  'renungan-khotbah': 'renungan_khotbah',
  buletin: 'renungan_khotbah',

  perpustakaan: 'perpustakaan',
  'e-library': 'perpustakaan',
  elibrary: 'perpustakaan',
  buku: 'perpustakaan',

  // Keanggotaan & Layanan
  warga_jemaat: 'warga_jemaat',
  'warga-jemaat': 'warga_jemaat',
  warga: 'warga_jemaat',
  jemaat: 'warga_jemaat',
  sensus: 'warga_jemaat',
  anggota: 'warga_jemaat',

  pendaftaran_warga: 'pendaftaran_warga',
  'pendaftaran-warga': 'pendaftaran_warga',
  pendaftaran: 'pendaftaran_warga',
  daftar: 'pendaftaran_warga',
  'daftar-warga': 'pendaftaran_warga',

  lingkungan_jemaat: 'lingkungan_jemaat',
  'lingkungan-jemaat': 'lingkungan_jemaat',
  lingkungan: 'lingkungan_jemaat',
  sektor: 'lingkungan_jemaat',
  rayon: 'lingkungan_jemaat',

  ulang_tahun_jemaat: 'ulang_tahun_jemaat',
  'ulang-tahun': 'ulang_tahun_jemaat',
  ulang_tahun: 'ulang_tahun_jemaat',
  ultah: 'ulang_tahun_jemaat',

  pelayanan_sakramen: 'pelayanan_sakramen',
  'pelayanan-sakramen': 'pelayanan_sakramen',
  sakramen: 'pelayanan_sakramen',
  baptis: 'pelayanan_sakramen',
  sidi: 'pelayanan_sakramen',
  nikah: 'pelayanan_sakramen',

  surat_pelimpahan_nikah: 'surat_pelimpahan_nikah',
  'surat-pelimpahan-nikah': 'surat_pelimpahan_nikah',
  surat_pelimpahan: 'surat_pelimpahan_nikah',
  pelimpahan_nikah: 'surat_pelimpahan_nikah',

  jadwal_katekisasi: 'jadwal_katekisasi',
  'jadwal-katekisasi': 'jadwal_katekisasi',
  katekisasi: 'jadwal_katekisasi',

  seksi_kategorial: 'seksi_kategorial',
  'seksi-kategorial': 'seksi_kategorial',
  kategorial: 'seksi_kategorial',
  spb: 'seksi_kategorial',
  spper: 'seksi_kategorial',
  spprp: 'seksi_kategorial',
  spa: 'seksi_kategorial',

  // Keuangan
  keuangan: 'keuangan',
  'buku-kas': 'keuangan',
  buku_kas: 'keuangan',
  kas: 'keuangan',

  iuran_kewajiban: 'iuran_kewajiban',
  'iuran-kewajiban': 'iuran_kewajiban',
  iuran: 'iuran_kewajiban',
  iuran_warga: 'iuran_kewajiban',
  'iuran-warga': 'iuran_kewajiban',
  iuran_bulanan: 'iuran_kewajiban',
  'iuran-bulanan': 'iuran_kewajiban',
  kewajiban_warga: 'iuran_kewajiban',

  persembahan_digital: 'persembahan_digital',
  'persembahan-digital': 'persembahan_digital',
  persembahan_qris: 'persembahan_digital',
  'persembahan-qris': 'persembahan_digital',
  persembahan: 'persembahan_digital',
  qris: 'persembahan_digital',
  donasi: 'persembahan_digital',

  gopay_webhook: 'gopay_webhook',
  'gopay-webhook': 'gopay_webhook',
  webhook: 'gopay_webhook',

  panitia_pembangunan: 'panitia_pembangunan',
  'panitia-pembangunan': 'panitia_pembangunan',
  pembangunan: 'panitia_pembangunan',
  proyek: 'panitia_pembangunan',

  // Tata Kelola & Aset
  mph_jemaat: 'mph_jemaat',
  'mph-jemaat': 'mph_jemaat',
  mph: 'mph_jemaat',

  penatua_diakon: 'penatua_diakon',
  'penatua-diakon': 'penatua_diakon',
  majelis: 'penatua_diakon',
  penatua: 'penatua_diakon',
  diakon: 'penatua_diakon',

  jabatan_struktural: 'jabatan_struktural',
  'jabatan-struktural': 'jabatan_struktural',
  jabatan: 'jabatan_struktural',
  sk: 'jabatan_struktural',

  pemilihan: 'pemilihan',
  'e-voting': 'pemilihan',
  evoting: 'pemilihan',
  voting: 'pemilihan',

  inventaris_aset: 'inventaris_aset',
  'inventaris-aset': 'inventaris_aset',
  inventaris: 'inventaris_aset',
  aset: 'inventaris_aset',

  pemeliharaan_aset: 'pemeliharaan_aset',
  'pemeliharaan-aset': 'pemeliharaan_aset',
  pemeliharaan: 'pemeliharaan_aset',
  servis_aset: 'pemeliharaan_aset',
  'servis-aset': 'pemeliharaan_aset',
  servis: 'pemeliharaan_aset',

  manajemen_tugas: 'manajemen_tugas',
  'manajemen-tugas': 'manajemen_tugas',
  task: 'manajemen_tugas',
  'task-board': 'manajemen_tugas',
  tugas: 'manajemen_tugas',

  agenda_surat: 'agenda_surat',
  'agenda-surat': 'agenda_surat',
  surat: 'agenda_surat',
  persuratan: 'agenda_surat',

  berita_jemaat: 'berita_jemaat',
  'berita-jemaat': 'berita_jemaat',
  berita: 'berita_jemaat',
  warta: 'berita_jemaat',

  // Pengaturan & Sistem
  pengaturan: 'pengaturan',
  settings: 'pengaturan',
  setting: 'pengaturan',

  pengaturan_background: 'pengaturan_background',
  'pengaturan-background': 'pengaturan_background',
  background_login: 'pengaturan_background',
  background_gereja: 'pengaturan_background',

  pengaturan_halaman_warga: 'pengaturan_halaman_warga',
  'pengaturan-portal': 'pengaturan_halaman_warga',
  portal_warga: 'pengaturan_halaman_warga',

  pengaturan_qris: 'pengaturan_qris',
  'pengaturan-qris': 'pengaturan_qris',
  qris_settings: 'pengaturan_qris',

  whatsapp_bot: 'whatsapp_bot',
  'whatsapp-bot': 'whatsapp_bot',
  whatsapp: 'whatsapp_bot',
  wa_bot: 'whatsapp_bot',
  bot_wa: 'whatsapp_bot',

  kelola_akun: 'kelola_akun',
  'kelola-akun': 'kelola_akun',
  akun: 'kelola_akun',
  users: 'kelola_akun',

  audit_keamanan: 'audit_keamanan',
  'audit-keamanan': 'audit_keamanan',
  audit: 'audit_keamanan',
  log: 'audit_keamanan',

  laporan_bug: 'laporan_bug',
  'laporan-bug': 'laporan_bug',
  lapor_bug: 'laporan_bug',
  'lapor-bug': 'laporan_bug',
  bug: 'laporan_bug',
  bantuan: 'laporan_bug',

  pengembangan_aplikasi: 'pengembangan_aplikasi',
  'pengembangan-aplikasi': 'pengembangan_aplikasi',
  about: 'pengembangan_aplikasi',
  developer: 'pengembangan_aplikasi',
};

/**
 * Resolves internal activeTab ID from window.location (Query Params, Pathname, or Hash)
 */
export const resolveTabFromLocation = (): string => {
  if (typeof window === 'undefined') return 'dashboard';

  // 1. Priority: Check Search Query Parameters (?menu=..., ?tab=..., ?halaman=..., ?modul=..., ?page=...)
  try {
    const searchParams = new URLSearchParams(window.location.search);
    const queryMenu =
      searchParams.get('menu') ||
      searchParams.get('tab') ||
      searchParams.get('halaman') ||
      searchParams.get('modul') ||
      searchParams.get('page') ||
      searchParams.get('p');

    if (queryMenu) {
      const normalizedQuery = queryMenu.trim().toLowerCase().replace(/-/g, '_');
      if (TAB_ALIASES[normalizedQuery]) {
        return TAB_ALIASES[normalizedQuery];
      }
      if (TAB_ALIASES[queryMenu.trim().toLowerCase()]) {
        return TAB_ALIASES[queryMenu.trim().toLowerCase()];
      }
    }
  } catch (err) {
    console.warn('[urlRouter] Failed to parse search params', err);
  }

  // 2. Check Hash Fragment (#/jadwal-ibadah, #/menu=jadwal_ibadah)
  try {
    const hash = window.location.hash;
    if (hash) {
      const cleanHash = hash.replace(/^#\/?/, '').toLowerCase();
      if (cleanHash.startsWith('menu=') || cleanHash.startsWith('tab=')) {
        const hashParam = cleanHash.split('=')[1];
        if (hashParam && TAB_ALIASES[hashParam]) {
          return TAB_ALIASES[hashParam];
        }
      }
      const hashKey = cleanHash.replace(/^\/+/, '').split('?')[0];
      if (TAB_ALIASES[hashKey]) {
        return TAB_ALIASES[hashKey];
      }
    }
  } catch {
    // ignore
  }

  // 3. Check Pathname (/path/jadwal-ibadah, /jadwal-ibadah)
  const pathname = window.location.pathname;
  return getTabFromPath(pathname);
};

/**
 * Normalizes incoming pathnames to standard clean format (/path/halaman).
 */
export const normalizePathname = (pathname: string): string => {
  if (!pathname || pathname === '/' || pathname === '/path' || pathname === '/path/' || pathname === '/halaman' || pathname === '/halaman/') {
    return '/path/dashboard';
  }

  const pathOnly = pathname.split('?')[0];
  let clean = pathOnly.replace(/\/+$/, '');
  clean = clean.replace(/\.(php|html)$/i, '');

  if (!clean || clean === '/' || clean === '/path' || clean === '/halaman') return '/path/dashboard';

  if (clean.startsWith('/path/') || clean.startsWith('/halaman/')) {
    const parts = clean.split('/').filter(Boolean);
    const lastPart = parts[parts.length - 1];
    return `/path/${lastPart}`;
  }

  if (clean.startsWith('/page/')) {
    const parts = clean.split('/').filter(Boolean);
    const lastPart = parts[parts.length - 1];
    return `/path/${lastPart}`;
  }

  return `/path${clean.startsWith('/') ? clean : `/${clean}`}`;
};

/**
 * Resolves internal activeTab ID from browser pathname
 */
export const getTabFromPath = (pathname: string): string => {
  const normalized = normalizePathname(pathname);
  const segments = normalized.split('/').filter(Boolean);
  const lastSegment = segments[segments.length - 1] || 'dashboard';
  const cleanSegment = lastSegment.toLowerCase();

  if (TAB_ALIASES[cleanSegment]) {
    return TAB_ALIASES[cleanSegment];
  }

  const underscored = cleanSegment.replace(/-/g, '_');
  if (TAB_ALIASES[underscored]) {
    return TAB_ALIASES[underscored];
  }

  return 'dashboard';
};

/**
 * Resolves clean URL path for a given tab ID in format /path/tab-name
 */
export const getPathFromTab = (tab: string): string => {
  if (TAB_TO_PATH_MAP[tab]) {
    return TAB_TO_PATH_MAP[tab];
  }
  const slug = tab.replace(/_/g, '-');
  return `/path/${slug}`;
};

/**
 * Generates standard shareable URL with ?menu=... query parameter and clean path
 */
export const generateShareableMenuUrl = (tab: string): string => {
  if (typeof window === 'undefined') return `?menu=${tab}`;
  const origin = window.location.origin;
  const standardMenu = tab.replace(/_/g, '-');
  return `${origin}/?menu=${standardMenu}`;
};

/**
 * Resolves active portal tab from window location
 */
export const PORTAL_ALIASES: Record<string, string> = {
  beranda: 'beranda',
  home: 'beranda',
  jadwal: 'jadwal',
  jadwal_ibadah: 'jadwal',
  'jadwal-ibadah': 'jadwal',
  warta: 'warta',
  berita: 'warta',
  berita_jemaat: 'warta',
  'berita-jemaat': 'warta',
  khotbah: 'khotbah',
  rancangan_khotbah: 'khotbah',
  'rancangan-khotbah': 'khotbah',
  renungan: 'renungan',
  renungan_khotbah: 'renungan',
  'renungan-khotbah': 'renungan',
  almanak: 'almanak',
  almanak_nast: 'almanak',
  'almanak-nast': 'almanak',
  alkitab: 'alkitab',
  bible: 'alkitab',
  keuangan: 'keuangan',
  kas: 'keuangan',
  buku_kas: 'keuangan',
  persembahan: 'persembahan',
  persembahan_digital: 'persembahan',
  'persembahan-digital': 'persembahan',
  qris: 'persembahan',
  pendaftaran: 'pendaftaran',
  pendaftaran_warga: 'pendaftaran',
  'pendaftaran-warga': 'pendaftaran',
  daftar: 'pendaftaran',
  sakramen: 'sakramen',
  pelayanan_sakramen: 'sakramen',
  'pelayanan-sakramen': 'sakramen',
  katekisasi: 'katekisasi',
  jadwal_katekisasi: 'katekisasi',
  'jadwal-katekisasi': 'katekisasi',
  kategorial: 'kategorial',
  seksi_kategorial: 'kategorial',
  'seksi-kategorial': 'kategorial',
  pembangunan: 'pembangunan',
  panitia_pembangunan: 'pembangunan',
  'panitia-pembangunan': 'pembangunan',
  pengurus: 'pengurus',
  mph: 'pengurus',
  majelis: 'pengurus',
  surat: 'surat',
  agenda_surat: 'surat',
  'agenda-surat': 'surat',
  pelimpahan: 'pelimpahan',
  surat_pelimpahan_nikah: 'pelimpahan',
  'surat-pelimpahan-nikah': 'pelimpahan',
  ulangtahun: 'ulangtahun',
  ulang_tahun: 'ulangtahun',
  'ulang-tahun': 'ulangtahun',
  perpustakaan: 'perpustakaan',
  elibrary: 'perpustakaan',
  'e-library': 'perpustakaan',
};

export const resolvePortalTabFromLocation = (): string => {
  if (typeof window === 'undefined') return 'beranda';

  try {
    const searchParams = new URLSearchParams(window.location.search);
    const query =
      searchParams.get('portal') ||
      searchParams.get('menu') ||
      searchParams.get('tab') ||
      searchParams.get('halaman') ||
      searchParams.get('page');

    if (query) {
      const normalized = query.trim().toLowerCase().replace(/-/g, '_');
      if (PORTAL_ALIASES[normalized]) {
        return PORTAL_ALIASES[normalized];
      }
      if (PORTAL_ALIASES[query.trim().toLowerCase()]) {
        return PORTAL_ALIASES[query.trim().toLowerCase()];
      }
    }
  } catch {
    // ignore
  }

  return 'beranda';
};

/**
 * Synchronizes the browser address bar with standard ?menu= query parameter and clean /path/... URL
 */
export const updateBrowserUrl = (tab: string, replace: boolean = false): void => {
  if (typeof window === 'undefined') return;

  try {
    const url = new URL(window.location.href);
    const menuSlug = tab.replace(/_/g, '-');

    // Set standard ?menu parameter
    url.searchParams.set('menu', menuSlug);

    const targetUrl = url.pathname + url.search + url.hash;

    if (replace) {
      window.history.replaceState({ tab }, '', targetUrl);
    } else {
      window.history.pushState({ tab }, '', targetUrl);
    }
  } catch (err) {
    console.warn('[urlRouter] Failed to update browser URL', err);
  }
};

/**
 * Synchronizes browser URL for public portal
 */
export const updatePortalBrowserUrl = (portalTab: string, replace: boolean = false): void => {
  if (typeof window === 'undefined') return;

  try {
    const url = new URL(window.location.href);
    const slug = portalTab.replace(/_/g, '-');
    url.searchParams.set('menu', slug);

    const targetUrl = url.pathname + url.search + url.hash;

    if (replace) {
      window.history.replaceState({ portalTab }, '', targetUrl);
    } else {
      window.history.pushState({ portalTab }, '', targetUrl);
    }
  } catch (err) {
    console.warn('[urlRouter] Failed to update portal URL', err);
  }
};



