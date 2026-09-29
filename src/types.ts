export type AuditCategory =
  | 'OTENTIKASI'
  | 'PERUBAHAN_DATA'
  | 'AKSES_ROLE'
  | 'PENGATURAN'
  | 'KEUANGAN'
  | 'SENSUS_WARGA'
  | 'IBADAH'
  | 'INVENTARIS'
  | 'PELAYANAN'
  | 'PELAYANAN_SAKRAMEN'
  | 'TATA_KELOLA'
  | 'PERPUSTAKAAN'
  | 'PEMILIHAN'
  | 'WHATSAPP_BOT'
  | 'MULTIMEDIA'
  | 'SISTEM_BACKUP'
  | 'SISTEM'
  | 'LAPORAN_BUG';

export type AuditLevel = 'INFO' | 'PERINGATAN' | 'BAHAYA';

export interface AuditLog {
  id: string;
  waktu: string;
  kategori: AuditCategory;
  aktivitas: string;
  detail: string;
  pengguna: string;
  role: UserRole | 'system' | 'publik';
  ipAddress?: string;
  level: AuditLevel;
  status: 'BERHASIL' | 'GAGAL' | 'DITOLAK';
  modulTerkait?: string;
}

export type UserRole = 'admin' | 'bendahara' | 'sekretaris' | 'warga';

export type ThemeMode = 'dark' | 'light';

export interface UserAccount {
  id: string;
  username: string;
  namaLengkap: string;
  namaPanggilan?: string;
  email: string;
  role: UserRole;
  status: 'aktif' | 'nonaktif';
  lastLogin?: string;
  noHp?: string;
  password?: string;
  foto?: string;
  jabatanGereja?: string;
  noKjj?: string;
  nik?: string;
  wargaId?: string;
  pendaftaranId?: string;
  source?: 'pendaftaran_mandiri' | 'manual' | 'system';
}

export interface Lingkungan {
  id: string;
  kode: string;
  nama: string;
  wilayahSektor?: string;
  ketuaLingkungan?: string;
  sekretarisLingkungan?: string;
  jumlahKeluarga?: number;
  keterangan?: string;
  status: 'Aktif' | 'Nonaktif';
}

export interface PenatuaDiakon {
  id: string;
  nama: string;
  gelar: string;
  jabatan: 'Penatua' | 'Diakon' | 'Penatua Ketua Lingkungan' | 'Penatua Sekretaris Lingkungan';
  rayon: string;
  tanggalPenahbisan: string;
  masaBakti: string;
  status: 'Aktif' | 'Purnabakti' | 'Pindah';
  noHp: string;
  foto?: string;
  alamat: string;
}

export interface SingerJemaat {
  id: string;
  nama: string;
  suara?: 'Sopran' | 'Alto' | 'Tenor' | 'Bass' | 'Campuran' | 'Pemandu Umum' | string;
  rayon?: string;
  noHp?: string;
  wargaId?: string;
  status: 'Aktif' | 'Nonaktif';
  keterangan?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface KeuanganItem {
  id: string;
  tanggal: string;
  jenis: 'pemasukan' | 'pengeluaran';
  posKas?: 
    | 'Kas Umum' 
    | 'Kas Pembangunan'
    | 'Kas Kupon'
    | 'Kas Diakonia'
    | 'Kas Iuran Kewajiban'
    | 'Kas Iuran Pembangunan'
    | 'Kas SPPer'
    | 'Kas SPB'
    | 'Kas SPPR/P'
    | 'Kas Anak Sekolah Hari Minggu';
  kategori: 
    | 'Persembahan Minggu' 
    | 'Persembahan Perpuluhan' 
    | 'Ucapan Syukur' 
    | 'Pembangunan & Renovasi' 
    | 'Sumbangan Donatur Pembangunan'
    | 'Janji Iman Pembangunan'
    | 'Bahan Bangunan & Material'
    | 'Upah Tukang & Pekerja'
    | 'Kupon Pembangunan/Bazar'
    | 'Diakonia & Duka' 
    | 'Iuran Kewajiban Warga'
    | 'Iuran Pembangunan Warga'
    | 'Persembahan SPPer (Perempuan)'
    | 'Persembahan SPB (Bapak)'
    | 'Persembahan SPPR/P (Pemuda/i)'
    | 'Persembahan ASHM (Sekolah Minggu)'
    | 'Persembahan Kebaktian Lingkungan' 
    | 'Beban Operasional & Listrik/Air' 
    | 'Honorarium Pelayan Firman' 
    | 'Pemeliharaan Aset' 
    | 'Lain-lain';
  jumlah: number;
  keterangan: string;
  noReferensi: string;
  posAnggaran?: string;
  masuk?: number;
  keluar?: number;
  tipe?: string;
  kasSumber?: string;
  disetujuiOleh?: string;
  status?: 'disetujui' | 'pending' | 'ditolak';
}

export interface IuranBulanDetail {
  lunas: boolean;
  nominal: number;
  tanggalBayar?: string;
  metodePembayaran?: 'Tunai' | 'Transfer Bank' | 'QRIS' | 'GoPay / Digital' | string;
  noReferensiKas?: string;
  idKas?: string;
  petugasPenerima?: string;
  catatan?: string;
}

export interface IuranKewajiban {
  id: string; // e.g. `ikw-${tahun}-${noKjj}`
  tahun: number; // e.g. 2026
  noKjj: string; // Nomor Kartu Keluarga Jemaat (KJJ)
  namaKepalaKeluarga: string;
  wargaId?: string;
  rayon: string;
  alamat?: string;
  noHp?: string;
  nominalPerBulan: number; // Nominal wajib per bulan (default e.g. Rp 25.000 / Rp 50.000)
  iuranBulanan: {
    [bulan: number]: IuranBulanDetail; // 1 (Januari) s/d 12 (Desember)
  };
  totalSetorTahun: number;
  targetTahun: number;
  sisaTunggakan: number;
  statusPembayaran: 'Lunas' | 'Sebagian' | 'Belum Bayar';
  updatedAt?: string;
}

export interface WargaJemaat {
  id: string;
  noKjj: string; // Kartu Keluarga Jemaat
  namaLengkap: string;
  nik: string;
  jenisKelamin: 'L' | 'P';
  tempatLahir: string;
  tanggalLahir: string;
  rayon: string;
  statusKeanggotaan: 'Tetap' | 'Titipan' | 'Pindah' | 'Meninggal';
  statusBaptis: boolean;
  statusSidi: boolean;
  statusNikah: 'Belum Menikah' | 'Menikah' | 'Janda' | 'Duda';
  tanggalPernikahan?: string;
  pekerjaan: string;
  alamat: string;
  noHp: string;
  hubunganKeluarga: 'Kepala Keluarga' | 'Istri' | 'Anak' | 'Famili Lain';
  username?: string;
  password?: string;

  // Bidang Khusus Tata Kelola Kematian / Warga Berpulang
  tanggalMeninggal?: string;
  tempatMeninggal?: string;
  tempatPemakaman?: string;
  nomorSuratKematian?: string;
  keteranganMeninggal?: string;
  keluargaDitinggalkan?: string;
  pelayanPemakaman?: string;
}

export interface JadwalIbadah {
  id: string;
  tanggal: string;            // 1. tanggal ibadah
  namaIbadah: string;         // 2. nama kebaktian/ibadah
  kategoriIbadah?: 'Umum / Hari Minggu' | 'Kategorial' | 'Rayon / Lingkungan' | 'Sakramen / Khusus' | string;
  seksi?: 'SPB' | 'SPPer' | 'SPPR/P' | 'ASHM' | string;
  rayon?: string;
  tuanRumah?: string;
  pelayanFirman: string;      // 3. pelayan firman (Pengkhotbah)
  pengkhotbah: string;        // alias for backward compatibility
  natsKhotbah?: string;       // Nats / Tema Khotbah
  koordinatorPelayanan?: string; // Koordinator Pelayanan
  kuponUndian?: string;       // Kupon / Undian / Doorprize
  pemusik: string;            // 4. pemusik/organis
  pewartaBerita?: string;     // 5. Pewarta Berita Jemaat
  waktu: string;              // 6. waktu pelaksanaan
  tempat: string;             // 7. tempat pelaksanaan
  liturgos: string;           // 8. Liturgos
  operatorMultimedia?: string;// 9. Operator Multimedia dan Sound System
  pemanduLagu?: string;       // 10. Singer/Pemandu lagu 1 dan 2
  kantoria?: string;          // alias for backward compatibility
  kolektan?: string;          // 11. Kolektan / Petugas Persembahan
  penerimaTamu?: string;      // 12. Penerima Tamu / Petugas Sambutan
  pembacaanAlkitab: string;   // 13. pembacaan alkitab
  wartaKhusus?: string;       // 14. wartaKhusus/catatan
  keteranganKhusus?: string;  // alias
  sektorRayon?: string;
}

export interface MPHMember {
  id: string;
  jabatan: string;
  nama: string;
  gelar: string;
  periode: string;
  noHp: string;
  foto?: string;
}

export type KategoriJabatan =
  | 'MPH / Majelis Jemaat'
  | 'Seksi Kategorial'
  | 'Badan & Majelis Pertimbangan'
  | 'Panitia & Pokja'
  | 'Lainnya';

export interface JabatanOrganisasi {
  id: string;
  nama: string;
  kategori: KategoriJabatan | string;
  deskripsi?: string;
  urutan?: number;
  aktif?: boolean;
  tanggalDitambahkan?: string;
}

export interface InventarisAset {
  id: string;
  kodeAset: string;
  namaBarang: string;
  kategori: 
    | 'Bangunan & Tanah' 
    | 'Kendaraan Operasional' 
    | 'Sound System & Peralatan Musik' 
    | 'Mebel & Furnitur' 
    | 'Alat Elektronik & IT' 
    | 'Peralatan Sakramen & Ibadah';
  tanggalPerolehan: string;
  kuantitas: number;
  satuan: string;
  kondisi: 'Baik' | 'Rusak Ringan' | 'Rusak Berat';
  nilaiAset: number; // Dalam Rupiah
  lokasiPenyimpanan: string;
  penanggungJawab: string;
  tanggalServisTerakhir?: string;
  tanggalServisBerikutnya?: string;
  siklusPemeliharaanBulan?: number;
  statusPemeliharaan?: 'Normal' | 'Perlu Servis' | 'Dalam Perbaikan';
}

export type JenisPemeliharaan =
  | 'Servis Rutin'
  | 'Pemeriksaan Berkala'
  | 'Perbaikan Kerusakan'
  | 'Penggantian Suku Cadang'
  | 'Kalibrasi & Tuning'
  | 'Pembersihan Menyeluruh'
  | 'Pengecatan / Renovasi Fisik'
  | 'Lainnya';

export type StatusPemeliharaan =
  | 'Terjadwal'
  | 'Mendekati Jatuh Tempo'
  | 'Terlambat'
  | 'Sedang Dikerjakan'
  | 'Selesai'
  | 'Dibatalkan';

export type TingkatPrioritas = 'Rendah' | 'Sedang' | 'Tinggi' | 'Darurat';

export interface PemeliharaanAset {
  id: string;
  asetId: string; // Relasi ke InventarisAset.id
  kodeAset: string;
  namaBarang: string;
  kategoriAset: string;
  lokasiAset?: string;
  
  judulPemeliharaan: string;
  jenisPemeliharaan: JenisPemeliharaan;
  tingkatPrioritas: TingkatPrioritas;
  
  tanggalTerakhirServis?: string;
  tanggalJatuhTempo: string; // YYYY-MM-DD
  siklusBulan?: number; // Pengulangan servis berkala (1, 3, 6, 12 bulan)
  
  status: StatusPemeliharaan;
  tanggalSelesai?: string;
  
  biayaEstimasi?: number;
  biayaRealisasi?: number;
  
  penanggungJawabInternal: string;
  kontakPenanggungJawab?: string;
  teknisiVendor?: string;
  kontakTeknisiVendor?: string;
  
  keterangan?: string;
  tindakanPerbaikan?: string;
  kondisiAsetSetelahServis?: 'Baik' | 'Rusak Ringan' | 'Rusak Berat';
  
  notifikasiTerkirim?: boolean;
  notifikasiTerakhirDikirim?: string;
  
  createdAt?: string;
  updatedAt?: string;
}

export interface RenunganItem {
  id: string;
  tanggal: string;
  judul: string;
  natsAlkitab: string;
  penulis: string;
  isi: string;
  aplikasiDoa: string;
  kategori: 'Renungan Harian' | 'Khotbah Minggu' | 'Suara Gembala' | 'Warta Sukacita';
  dipublikasikan: boolean;
  dipostingKeBuletin?: boolean;
}

export interface PendaftaranAnggota {
  id: string;
  tanggalDaftar: string;
  noKjj: string;
  namaLengkap: string;
  nik: string;
  jenisKelamin: 'L' | 'P';
  tempatLahir: string;
  tanggalLahir: string;
  rayon: string;
  statusKeanggotaan: 'Tetap' | 'Titipan' | 'Pindah';
  statusBaptis: boolean;
  statusSidi: boolean;
  statusNikah: 'Belum Menikah' | 'Menikah' | 'Janda' | 'Duda';
  pekerjaan: string;
  alamat: string;
  noHp: string;
  hubunganKeluarga: 'Kepala Keluarga' | 'Istri' | 'Anak' | 'Famili Lain';
  statusKonfirmasiMPH: 'Menunggu Konfirmasi' | 'Disetujui' | 'Ditolak';
  catatanMPH?: string;
  tanggalKonfirmasi?: string;
  username?: string;
  password?: string;
}

export interface PoinKhotbah {
  judulPoin: string;
  penjelasan: string;
  nasihatPastoral?: string;
  durasiMenit: number;
}

export interface TujuanPastoral {
  kognitif?: string;
  afektif?: string;
  psikomotorik?: string;
}

export interface RancanganKhotbah {
  id: string;
  judulKhotbah: string;
  natsAlkitab: string;
  temaKhotbah: string;
  pengkhotbah: string;
  tanggal: string;
  durasiTotalMenit: number; // e.g. 15, 20, 30, 45
  jenisIbadah?: string; // Kebaktian Minggu, Rayon, Pemuda, Wanita, Bapak, Sakramen, Duka, DLL
  metodeHomiletika?: string; // e.g. Tekstual-Ekspositori, Tematis-Doktrinal, Pastoral-Konseling, Naratif Konteks Kalimantan
  nadaPastoral?: string; // e.g. Penguatan & Penghiburan, Pemberdayaan & Aksi, Refleksi & Pertobatan, Pengucapan Syukur
  sasaranPendengar?: string; // e.g. Seluruh Jemaat Lintas Generasi, Pemuda SPRP, Seksi Wanita SPW, Keluarga Berduka
  tujuanPastoral?: TujuanPastoral;
  pendahuluan: string;
  poinUtama: PoinKhotbah[];
  penerapanAplikasi: string;
  penutupDoa: string;
  catatanLiturgis?: string;
  statusArsip?: 'Aktif' | 'Diarsipkan';
  sumberAI?: boolean;
  versiKhotbah?: string; // e.g. 'Versi AI Homiletika & Pastoral' | 'Versi Manual Pelayan Firman'
}

export interface AgendaSurat {
  id: string;
  jenis: 'surat_masuk' | 'surat_keluar';
  noAgenda: string;
  noSurat: string;
  tanggalSurat: string;
  tanggalTerimaKirim: string;
  pengirim: string;
  penerima: string;
  perihal: string;
  sifatSurat: 'Biasa' | 'Penting' | 'Rahasia / Khusus' | 'Undangan' | 'Pemberitahuan' | 'Permohonan';
  kodeTujuan?: 'U.I' | 'U.II' | 'U.III' | 'U.IV' | 'U.V' | 'U.VI' | 'U.VII' | string;
  lampiran?: string;
  ringkasanIsi?: string;
  disposisi?: string;
  status: 'Diterima' | 'Proses Disposisi' | 'Selesai' | 'Dikirim';
  fileUrl?: string;
}

export interface PelayananSakramen {
  id: string;
  jenisPelayanan: 'baptis' | 'sidi' | 'nikah';
  noSuratResmi: string;
  tanggalPelayanan: string;
  tempatPelayanan: string;
  pelayanFirman: string;
  namaUtama: string;
  tempatTanggalLahir?: string;
  alamatUtama?: string;
  namaPasangan?: string;
  tempatTanggalLahirPasangan?: string;
  alamatPasangan?: string;
  fotoCoupleUrl?: string;
  namaAyah?: string;
  namaIbu?: string;
  namaAyahPasangan?: string;
  namaIbuPasangan?: string;
  saksi1?: string;
  saksi2?: string;
  status: 'Permohonan' | 'Diproses / Katekisasi' | 'Disetujui & Diterbitkan' | 'Diarsipkan';
  catatanPastoral?: string;
  tersimpanKeAgendaSurat?: boolean;
  tanggalKonfirmasi?: string;

  // Kebutuhan Surat Baptisan Kudus GKE & Sakramen
  majelisJemaat?: string;
  resortGke?: string;
  jabatanPelayan?: string;
  nasKhotbah?: string;
  isiNasKhotbah?: string;
  nasPeringatan?: string;
  tempatDikeluarkan?: string;
  tanggalDikeluarkan?: string;
  ketuaMajelis?: string;
  sekretarisMajelis?: string;

  // Surat Pelimpahan Peneguhan & Pemberkatan Nikah GKE
  penerimaSurat?: string;
  tujuanDi?: string;
  jemaatAsalPria?: string;
  jemaatAsalWanita?: string;
  pekerjaanPria?: string;
  pekerjaanWanita?: string;
  tanggalRencanaIbadahSyukur?: string;
  jemaatTujuanPelayanan?: string;
  tembusanSurat?: string;
  scanSuratPelimpahanUrl?: string;
  checklistPelimpahan?: {
    aktaBaptis?: boolean;
    aktaSidi?: boolean;
    suratPengantarRayon?: boolean;
    suratBebasKomitmen?: boolean;
    pasFotoPasangan?: boolean;
    ktpKkMempelai?: boolean;
  };
}

export interface JadwalKatekisasi {
  id: string;
  kategori: 'sidi' | 'pernikahan';
  judulProgram: string;
  materiBahasan: string;
  pengajar: string;
  tanggal: string;
  waktu: string;
  tempat: string;
  pesertaTarget: string;
  jumlahPertemuan?: string;
  status: 'Terjadwal' | 'Berlangsung' | 'Selesai' | 'Ditunda';
  persyaratan?: string;
  keterangan?: string;
  statusArsip?: 'Aktif' | 'Diarsipkan';
  tanggalArsip?: string;
  alasanArsip?: string;
}

export interface AppSettings {
  namaAplikasi: string;
  deskripsiAplikasi: string;
  namaJemaat: string;
  resortGke: string;
  alamatGereja: string;
  telepon: string;
  email: string;
  website: string;
  logoUrl: string;
  headerKopLine1: string; // Baris Header 1 (Underline)
  headerKopLine1b?: string; // Baris Header Baru di bawah Header 1 (Ukuran -2 dari Header 1)
  headerKopLine2: string; // BARIS HEADER 2
  headerKopLine3a?: string; // BARIS HEADER 3 - Badan Hukum (Baris 1)
  headerKopLine3b?: string; // BARIS HEADER 3 - Badan Hukum (Baris 2)
  headerKopLine4?: string; // BARIS HEADER 4 - Majelis Resort
  headerKopLine5?: string; // BARIS HEADER 5 - Alamat dan No Telp
  tempatDiterbitkan?: string; // Tempat/Kota Diterbitkan Surat & Laporan Resmi
  namaKetuaJemaat: string;
  namaBendahara: string;
  namaSekretaris: string;
  nipKetuaJemaat: string;
  nipBendahara: string;
  nipSekretaris: string;
  periodePelayananMPH?: string; // Periode Pelayanan / Masa Bakti MPH (e.g. 2024 - 2029)

  // Penandatangan Khusus Pos Kas / Seksi / Panitia
  namaKetuaPembangunan?: string;
  namaBendaharaPembangunan?: string;
  nipKetuaPembangunan?: string;
  nipBendaharaPembangunan?: string;

  namaKetuaSpper?: string;
  namaBendaharaSpper?: string;
  nipKetuaSpper?: string;
  nipBendaharaSpper?: string;

  namaKetuaSpb?: string;
  namaBendaharaSpb?: string;
  nipKetuaSpb?: string;
  nipBendaharaSpb?: string;

  namaKetuaSpprp?: string;
  namaBendaharaSpprp?: string;
  nipKetuaSpprp?: string;
  nipBendaharaSpprp?: string;

  namaKetuaSpa?: string;
  namaBendaharaSpa?: string;
  nipKetuaSpa?: string;
  nipBendaharaSpa?: string;

  // Penandatangan Khusus BPP & MP (Badan Pemeriksa Perbendaharaan & Majelis Pertimbangan)
  namaKetuaBpp?: string;
  nipKetuaBpp?: string;
  namaSekretarisBpp?: string;
  nipSekretarisBpp?: string;

  namaKetuaMp?: string;
  nipKetuaMp?: string;
  namaSekretarisMp?: string;
  nipSekretarisMp?: string;

  // Pengaturan QRIS & Persembahan Digital (GoPay, OVO, DANA, Bank)
  qrisMerchantName?: string;
  qrisNmid?: string;
  qrisImageUrl?: string;
  qrisPayload?: string; // String payload QRIS baku (00020101...) dari bank/GoPay
  gopayAccountName?: string;
  gopayAccountNumber?: string;
  bankAccountBca?: string;
  bankAccountMandiri?: string;

  // Pengaturan Gateway Auto-Polling Persembahan
  qrisAutoPollingEnabled?: boolean; // Toggle Aktif/Nonaktif Auto-Polling Gateway
  qrisAutoPollingDurationSeconds?: number; // Durasi hitungan mundur polling (detik)
  noWhatsappAdmin?: string; // Nomor Whatsapp Admin / Bendahara (e.g. 6281255667788 atau 0812-5566-7788)

  // Fitur Keamanan & Cache
  inactivityTimeoutMinutes?: number; // 0 = disabled, default 15 menit

  // Pengaturan Background Halaman & Login
  loginBackgroundUrl?: string; // URL Foto Background Gereja untuk Halaman Login
  loginBackgroundOverlayOpacity?: number; // Opasitas overlay putih/terang (0.1 - 0.9, default 0.35)
  loginBackgroundBlur?: 'none' | 'sm' | 'md' | 'lg'; // Intensitas blur background gereja

  // Pengaturan Custom Saldo Awal Kas / Pos Kas
  saldoAwalCustomKasUmum?: number;
  saldoAwalCustomKasPembangunan?: number;
  saldoAwalCustomKasDiakonia?: number;
  saldoAwalCustomKasSpper?: number;
  saldoAwalCustomKasSpb?: number;
  saldoAwalCustomKasSpprp?: number;
  saldoAwalCustomKasSpa?: number;

  // Pengaturan Form & Sistem Penomoran Pelaporan / Dokumen
  tingkatOrganisasi?: 'jemaat' | 'resort' | 'sinode';
  kodeJemaatPenomoran?: string; // Misal: SL (Selat), EFT (Efata), KK (Kuala Kapuas)
  kodeOrganisasiPenomoran?: string; // Format lengkap instansi (e.g. MPHJ-GKE-SL / MPHR-GKE-KK / MPHS-GKE)
  prefixSuratMasuk?: string;
  prefixSuratKeluar?: string;
  prefixSuratBaptis?: string;
  prefixSuratSidi?: string;
  prefixSuratNikah?: string;
  prefixWartaJemaat?: string;
  prefixKjj?: string;
  prefixKasKeuangan?: string;
  prefixKodeAset?: string;
  nominalIuranWajibPerBulan?: number; // Nominal default Iuran Wajib Warga per bulan (e.g. 25000 / 50000)
  posKasIuranKewajiban?: string; // 'Kas Iuran Kewajiban' atau 'Kas Umum'

  // Pengaturan Visibilitas Halaman Portal Warga Jemaat (Enabled/Disabled)
  portalPageVisibility?: {
    beranda?: boolean;
    jadwal?: boolean;
    renungan?: boolean;
    pendaftaran?: boolean;
    sensus?: boolean;
    kartu_keluarga?: boolean;
    persembahan_qris?: boolean;
    notifikasi_persembahan?: boolean;
    keuangan?: boolean;
    kepengurusan?: boolean;
    aset?: boolean;
    [key: string]: boolean | undefined;
  };

  // Pengaturan Tema Terpisah (Admin Panel & Warga Jemaat)
  defaultAdminTheme?: 'dark' | 'light';
  defaultPortalTheme?: 'dark' | 'light';

  // Mode Perbaikan & Pemeliharaan Sistem (Under Construction Mode)
  maintenanceModeEnabled?: boolean; // Toggle aktif/nonaktif mode perbaikan
  maintenanceTitle?: string; // Judul status perbaikan (e.g. Sistem Sedang Dalam Masa Perbaikan)
  maintenanceMessage?: string; // Pesan / Pengumuman untuk jemaat
  maintenanceEstimatedCompletion?: string; // Perkiraan waktu selesai (e.g. 27 Agustus 2026, 18:00 WIB)
  maintenanceContactPerson?: string; // Narahubung darurat / Nomor WhatsApp sekretariat
  maintenanceAllowedRoles?: string[]; // Role yang diizinkan mengakses saat mode perbaikan (default: ['admin'])

  // Record Cadangan Backup Cloud (Tersinkronisasi Realtime di Semua Perangkat)
  lastBackupTimestamp?: string;
  lastBackupType?: 'full' | 'crucial' | 'custom';
  lastBackupTotalRecords?: number;
  lastBackupBy?: string;
  lastBackupFilename?: string;
  lastCrucialBackupTimestamp?: string;
  lastCrucialBackupTotalRecords?: number;
  lastCrucialBackupBy?: string;
}

export interface BackupHistoryRecord {
  id: string;
  timestamp: string;
  type: 'full' | 'crucial' | 'custom';
  totalRecords: number;
  collectionCount?: number;
  performedBy: string;
  role?: string;
  filename?: string;
}

// Interfaces untuk Berita / Warta Jemaat
export interface BeritaPelayananItem {
  id: string;
  namaIbadah: string;
  kategoriIbadah: 'Minggu Utama' | 'SPPer (Perempuan)' | 'SPB (Bapak)' | 'SPPR/P (Pemuda)' | 'ASHM (Sekolah Minggu)' | 'Kebaktian Lingkungan/Rayon' | 'Ibadah Sakramen' | 'Ibadah Kasual/Khusus' | string;
  tanggal: string;
  waktu: string;
  tempat: string;
  pelayanFirman: string;
  natsKhotbah?: string;
  koordinatorPelayanan?: string;
  kuponUndian?: string;
  liturgos: string;
  pemusik: string;
  pemanduLagu: string;
  operatorMultimedia?: string;
  kolektan?: string;
  penerimaTamu?: string;
  pembacaanAlkitab: string;
  keteranganKhusus?: string;
}

export interface BeritaKeuanganRincian {
  namaPos: string;
  pemasukan: number;
  pengeluaran: number;
  saldo: number;
}

export interface BeritaKeuanganTransaksiItem {
  id?: string;
  tanggal: string;
  jenis: 'pemasukan' | 'pengeluaran';
  namaPosKas?: string;
  kategori: string;
  keterangan: string;
  jumlah: number;
  noBukti?: string;
}

export interface BeritaKeuanganItem {
  periodeJudul: string;
  tanggalMulai: string;
  tanggalSelesai: string;
  saldoAwal: number;
  totalPemasukan: number;
  totalPengeluaran: number;
  saldoAkhir: number;
  rincianPosKas?: BeritaKeuanganRincian[];
  rincianTransaksiMingguIni?: BeritaKeuanganTransaksiItem[];
  catatanKeuangan?: string;
}

export interface BeritaUlangTahunItem {
  id: string;
  jenis: 'kelahiran' | 'pernikahan';
  nama: string;
  rayon: string;
  tanggal: string;
  keterangan?: string;
}

export interface BeritaDukaItem {
  id: string;
  namaMeninggal: string;
  usia: number | string;
  rayon: string;
  tanggalMeninggal: string;
  tempatDuka: string;
  jadwalPemakaman: string;
  keluargaYangBerduka: string;
  keterangan?: string;
}

export interface UndanganPernikahanItem {
  id: string;
  namaMempelaiPria: string;
  namaMempelaiWanita: string;
  orangTuaPria: string;
  orangTuaWanita: string;
  rayonAtauJemaatAsal: string;
  tanggalPemberkatan: string;
  waktuPemberkatan: string;
  tempatGereja: string;
  keterangan?: string;
}

export interface BeritaTambahanUmum {
  id: string;
  judul: string;
  kategori: 'Pengumuman Umum' | 'Rapat & Sidang' | 'Kegiatan Kategorial' | 'Lain-lain';
  tanggal: string;
  isi: string;
}

export interface BeritaJemaat {
  id: string;
  nomorEdisi: string;
  tanggalTerbit: string;
  judulWarta: string;
  temaKhotbah: string;
  natsPembimbing: string;
  status: 'Draf' | 'Diterbitkan' | 'Arsip';
  publishedAt?: string; // ISO timestamp when status was changed to 'Diterbitkan'
  
  // Section 1: Berita Pelayanan (Hari Minggu & Kategorial)
  beritaPelayananList: BeritaPelayananItem[];
  
  // Section 2: Berita Keuangan (Rekapitulasi Keuangan)
  beritaKeuangan: BeritaKeuanganItem;
  
  // Section 3: Berita Ulang Tahun (Kelahiran & Pernikahan)
  beritaUlangTahunList: BeritaUlangTahunItem[];
  
  // Section 4: Berita Tambahan (Duka & Undangan Nikah & Pengumuman Umum)
  beritaDukaList: BeritaDukaItem[];
  undanganPernikahanList: UndanganPernikahanItem[];
  beritaTambahanList: BeritaTambahanUmum[];

  catatanGembala?: string;
}

export interface PengurusKategorial {
  id: string;
  seksi: 'SPB' | 'SPPer' | 'SPPR/P' | 'SPA';
  jabatan: string;
  nama: string;
  gelar?: string;
  periode: string;
  noHp: string;
  email?: string;
  alamat?: string;
  foto?: string;
  status: 'Aktif' | 'Demisioner';
}

export interface KegiatanKategorial {
  id: string;
  seksi: 'SPB' | 'SPPer' | 'SPPR/P' | 'SPA';
  namaProgram: string;
  kategori: 'Ibadah / Kebaktian Seksi' | 'Pembinaan / Pelatihan' | 'Aksi Kasih / Sosial' | 'Penggalangan Dana' | 'Latihan Vokal Group / Paduan Suara' | 'Retreat / Camping' | 'Lain-lain';
  tanggal: string;
  waktu: string;
  tempat: string;
  penanggungJawab: string;
  anggaranEstimasi: number;
  realisasiBiaya: number;
  status: 'Rencana' | 'Berlangsung' | 'Selesai' | 'Batal';
  keterangan?: string;
}

export interface PengurusPembangunan {
  id: string;
  jabatan: string;
  nama: string;
  gelar?: string;
  periode: string;
  noHp: string;
  email?: string;
  alamat?: string;
  status: 'Aktif' | 'Demisioner';
  foto?: string;
}

export interface ProyekPembangunan {
  id: string;
  namaProyek: string;
  kategoriProyek: 'Pembangunan Gedung' | 'Renovasi' | 'Infrastruktur & Parkir' | 'Pengadaan Sound & Alat' | 'Perbaikan Pastori' | 'Pembuatan Pagar / Kanopi';
  targetAnggaran: number;
  realisasiAnggaran: number;
  progresPersen: number; // 0 - 100
  tanggalMulai: string;
  targetSelesai: string;
  status: 'Perencanaan' | 'Proses Pekerjaan' | 'Selesai' | 'Tertunda';
  penanggungJawabTeknis: string;
  keterangan?: string;
}

export interface AlmanakNastGKE {
  id: string;
  tanggal: string; // Format ISO: YYYY-MM-DD or formatted "01 April 2026"
  hari: string; // e.g. "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu", "Senin", "Selasa"
  keteranganHari?: string; // e.g. "JUMAT AGUNG", "PASKAH I \n PERAYAAN HUT KE 187 GKE", "Paskah II", "Hut GKE", "1 Ses. Paskah, Quasimodogeniti"
  warnaStola?: string; // e.g. "Hitam", "Putih/Kuning", "Putih", "Hijau", "Ungu", "Merah"
  nastBacaan: string; // e.g. "Yohanes 13:21-30", "Yesaya 52:13-53:12"
  nastKhotbah?: string; // e.g. "Lukas 23:13-32", "Lukas 24:36-49", "Kolose 3:5-11"
  isHariRaya?: boolean; // Flag to indicate Sunday or special Holy Day
  temaMinggu?: string;
  catatanLiturgis?: string;
  judulPerikop?: string;
  judulPerikopBacaan?: string;
  judulPerikopKhotbah?: string;
  perikop?: string;
}

// ==========================================
// 1. MODUL PERPUSTAKAAN & BAHAN PENGAJARAN ROHANI
// ==========================================

export interface MateriPengajaran {
  id: string;
  judul: string;
  kategori:
    | 'Kurikulum Sekolah Minggu (ASHM)'
    | 'Modul Katekisasi SIDI'
    | 'Bimbingan Pra-Nikah'
    | 'Bahan Pemahaman Alkitab (PA)'
    | 'Tata Ibadah & Liturgi Khusus'
    | 'Buku Panduan & Teologi'
    | 'Lainnya'
    | string;
  seksiSasaran?: string;
  targetAudiens?: string;
  jenjangUsia?: string;
  penyusun: string;
  tanggalRilis?: string;
  tanggalTerbit?: string;
  deskripsi?: string;
  ringkasan?: string;
  isiMateri?: string;
  isiRingkas?: string;
  fileUrl?: string;
  tipeFile?: string;
  linkEksternal?: string;
  ayatAlkitabReferensi?: string;
  tags?: string[];
  totalDiunduh?: number;
  unduhanCount?: number;
  status: 'Aktif' | 'Arsip' | string;
}

export interface KatalogBuku {
  id: string;
  kodeBuku: string;
  judulBuku: string;
  pengarang: string;
  penerbit: string;
  tahunTerbit: string;
  isbn?: string;
  kategori:
    | 'Doktrin & Teologi GKE'
    | 'Spiritualitas & Doa'
    | 'Pernikahan & Keluarga Kristen'
    | 'Kepemimpinan & Pastoral'
    | 'Biografi Misionaris & Tokoh Gereja'
    | 'Cerita Alkitab Anak'
    | 'Konseling & Etika Kristen'
    | 'Lainnya'
    | string;
  jumlahTotal: number;
  jumlahTersedia: number;
  lokasiRak: string;
  sinopsis?: string;
  deskripsi?: string;
  coverUrl?: string;
  bahasa?: string;
  status: 'Tersedia' | 'Habis Dipinjam' | 'Perbaikan' | string;
}

export interface PeminjamanBuku {
  id: string;
  noTransaksi: string;
  bukuId: string;
  kodeBuku: string;
  judulBuku: string;
  namaPeminjam: string;
  kontakPeminjam: string;
  kategoriPeminjam: 'Warga Jemaat' | 'Majelis Jemaat' | 'Guru Sekolah Minggu' | 'Seksi Kategorial' | 'Umum' | string;
  noKjj?: string;
  tanggalPinjam: string;
  tanggalJatuhTempo: string;
  tanggalKembali?: string;
  status: 'Dipinjam' | 'Dikembalikan' | 'Terlambat' | string;
  catatan?: string;
  petugasPelayanan: string;
}

// ==========================================
// 2. MODUL PEMILIHAN MAJELIS / PANITIA & E-VOTING
// ==========================================

export interface SesiPemilihan {
  id: string;
  kodeSesi?: string;
  judulPemilihan: string;
  periode?: string;
  jenisSesi?: string;
  kategoriSasaran?: string;
  rayonSpesifik?: string;
  tanggalMulai: string;
  tanggalSelesai: string;
  maksimalPilihan?: number;
  maxPilihan?: number;
  status: 'Draf' | 'Aktif' | 'Selesai' | 'Ditutup' | 'Draft' | string;
  deskripsi?: string;
  deskripsiTataTertib?: string;
  petunjukPemilihan?: string;
  anonim?: boolean;
  totalDPT?: number;
  panitiaPemilihan?: string;
}

export interface KandidatPemilihan {
  id: string;
  sesiId: string;
  nomorUrut: number;
  namaLengkap: string;
  gelar?: string;
  jabatanDicalonkan: string;
  rayonAtauSeksi?: string;
  lingkungan?: string;
  noHp?: string;
  fotoUrl?: string;
  latarBelakang?: string;
  visiMisi: string;
  riwayatPelayanan?: string;
  pengalamanPelayanan?: string;
  jumlahSuara: number;
}

export interface SuaraVoting {
  id: string;
  sesiId: string;
  voterId: string;
  voterNama: string;
  voterRayon?: string;
  voterNoKjj?: string;
  kandidatIdList: string[];
  waktuVote: string;
  kodeVerifikasi: string;
}

export interface NominasiAspirasi {
  id: string;
  sesiId: string;
  pengusulId?: string;
  pengusulNama: string;
  pengusulRayon?: string;
  namaCalonDiusulkan: string;
  jabatanDiusulkan: string;
  alasanUsulan: string;
  statusVerifikasi?: string;
  kriteriaKesesuaian?: string;
  waktuUsulan: string;
}

export type ReportType = 
  | 'penatua_diakon'
  | 'keuangan_mingguan'
  | 'keuangan_bulanan'
  | 'keuangan_triwulan'
  | 'keuangan_tahanan'
  | 'warga_jemaat'
  | 'jadwal_ibadah'
  | 'detail_jadwal_ibadah'
  | 'mph_jemaat'
  | 'inventaris_aset'
  | 'jadwal_pemeliharaan_aset'
  | 'buletin_renungan'
  | 'pendaftaran_warga'
  | 'rancangan_khotbah'
  | 'kartu_keluarga_jemaat'
  | 'agenda_surat'
  | 'pelayanan_baptis'
  | 'pelayanan_sidi'
  | 'pelayanan_nikah'
  | 'surat_pelimpahan_nikah'
  | 'pelayanan_sakramen_rekap'
  | 'berita_jemaat'
  | 'jadwal_katekisasi'
  | 'qris_banner'
  | 'lingkungan'
  | 'lingkungan_jemaat'
  | 'seksi_kategorial'
  | 'panitia_pembangunan'
  | 'ulang_tahun'
  | 'perpustakaan'
  | 'perpustakaan_katalog'
  | 'perpustakaan_peminjaman'
  | 'materi_pengajaran'
  | 'pemilihan'
  | 'pemilihan_rekap'
  | 'pemilihan_hasil'
  | 'pemilihan_berita_acara'
  | 'audit_keamanan'
  | 'almanak_nast_gke'
  | 'whatsapp_bot_rekap'
  | 'task_board'
  | 'tugas_pelayanan'
  | 'alkitab_bacaan'
  | 'iuran_kewajiban'
  | 'iuran_kewajiban_kwitansi'
  | 'surat_keterangan_kematian'
  | 'surat_duka_cita'
  | 'warga_meninggal_rekap'
  | 'buku_panduan'
  | 'tutorial_aplikasi';

// ==========================================
// ALKITAB DIGITAL (TERJEMAHAN BARU - TB)
// ==========================================

export type TestamentType = 'PL' | 'PB';

export interface AlkitabBook {
  abbr: string; // e.g. "Kej", "Mat"
  name: string; // e.g. "Kejadian", "Matius"
  fullName: string;
  testament: TestamentType;
  totalChapters: number;
  totalVerses: number;
  group: string; // e.g. "Taurat", "Sejarah", "Puisi & Hikmat", "Nabi-nabi", "Injil", "Surat Paulus", "Surat Umum", "Wahyu"
}

export interface AlkitabVerse {
  id: number;
  kitab: string;
  kitabName?: string;
  pasal: number;
  ayat: number;
  firman: string;
  highlight?: string;
  isBookmarked?: boolean;
  perikop?: string;
}

export interface AlkitabBookmark {
  id: string;
  verseId: number;
  kitab: string;
  kitabName: string;
  pasal: number;
  ayat: number;
  firman: string;
  color?: string;
  catatan?: string;
  createdAt: string;
}

export interface AlkitabSearchResult {
  id: number;
  kitab: string;
  kitabName: string;
  pasal: number;
  ayat: number;
  firman: string;
  testament: TestamentType;
}

// ==========================================
// WHATSAPP BOT & GATEWAY SYSTEM TYPES
// ==========================================

export type WhatsAppProvider =
  | 'internal'
  | 'fonnte'
  | 'wablas'
  | 'whacenter'
  | 'twilio'
  | 'meta_cloud'
  | 'baileys'
  | 'waha'
  | 'custom_webhook'
  | 'custom_url'
  | string;

export interface WhatsAppBotConfig {
  isEnabled: boolean;
  provider: WhatsAppProvider;
  nomorDevice: string; // e.g. "081234567890" or "628123456789"
  senderName: string; // e.g. "GKE Bot Pelayanan"
  apiKeyToken: string;
  apiKey?: string;
  webhookSecret?: string;
  autoGreetingEnabled: boolean;
  greetingMessage: string;
  fallbackMessage: string;
  jamOperasionalMulai: string; // "06:00"
  jamOperasionalSelesai: string; // "22:00"
  enableAiAssistant?: boolean;
  notifyPastorOnPrayerRequest?: boolean;
  notifTargetNumberPastor?: string;
  terakhirSinkron?: string;
  statusKoneksi?: 'Terhubung' | 'Terputus' | 'Belum Dikonfigurasi';
  // Admin Cooldown Configuration
  cooldownMenitPerNomor?: number; // Kunci Cooldown Menit per Nomor (default: 10)
  cooldownSecondsBetweenMessages?: number; // Jeda minimum antar pesan beruntun (detik, default: 3)
  maxReplyQuotaPerFiveMin?: number; // Kuota pesan per nomor dalam 5 menit (default: 20)
  isCooldownEnabled?: boolean; // Sakelar aktif/nonaktif kunci cooldown
  customGatewayEndpoint?: string; // URL endpoint server gateway mandiri (misal: http://localhost:3000 atau VPS sendiri)
  customGatewayMode?: 'BUILTIN_ENGINE' | 'BAILEYS_SOCKET' | 'WAHA_DOCKER' | 'CUSTOM_PROXY';
  // Provider Luar di Luar Combo (Custom External Provider seperti wagate.ai.studio)
  customProviderName?: string; // Nama provider luar (misal: "Wagate AI Studio")
  customApiUrl?: string; // URL endpoint atau web provider luar (misal: "https://wagate.ai.studio" atau "https://wagate.ai.studio/api/send")
  customAuthHeaderType?: 'bearer' | 'token_direct' | 'x_api_key' | 'body_param';
}

export interface WhatsAppKeywordRule {
  id: string;
  keyword: string; // e.g. "MENU", "JADWAL", "WARTA", "RENUNGAN", "REKENING", "DOA", "KAS", "PERSEMBAHAN"
  label: string; // "Menu Utama & Bantuan"
  deskripsi: string;
  matchType: 'EXACT' | 'CONTAINS' | 'STARTS_WITH';
  kategori: 'INFORMASI' | 'IBADAH' | 'KEUANGAN' | 'PASTORAL' | 'LAYANAN' | 'UMUM' | string;
  responseTemplate: string;
  isActive: boolean;
  hitCount: number;
  terakhirDipanggil?: string;
}

export interface WhatsAppBroadcastMessage {
  id: string;
  judulSiaran: string;
  kategoriSasaran: 'Semua Warga' | 'Rayon Tertentu' | 'Pelayan Ibadah' | 'Kategorial' | 'Ulang Tahun Hari Ini' | 'Kustom';
  targetRayon?: string;
  targetKategorial?: string;
  isiPesan: string;
  waktuKirim: string;
  totalPenerima: number;
  totalTerkirim: number;
  totalGagal: number;
  status: 'Terkirim' | 'Gagal' | 'Dijadwalkan' | 'Draf';
  pengirim: string;
}

export interface WhatsAppMessageLog {
  id: string;
  nomorTelepon: string;
  namaPengirim: string;
  arah: 'INCOMING' | 'OUTGOING';
  pesanTeks: string;
  keywordTerpicu?: string;
  balasanBot?: string;
  status: 'Terkirim' | 'Diterima' | 'Gagal' | 'Diproses';
  waktu: string;
}

export interface WhatsAppPrayerRequest {
  id: string;
  namaPemohon: string;
  noHpWa: string;
  lingkunganRayon?: string;
  pokokDoa: string;
  kategoriDoa: 'Keluarga' | 'Kesembuhan / Sakit' | 'Pekerjaan & Usaha' | 'Syukur' | 'Duka' | 'Pendidikan / Anak' | 'Lain-lain';
  status: 'Baru' | 'Didoakan' | 'Kunjungan Terjadwal' | 'Selesai';
  waktuMasuk: string;
  catatanTindakLanjut?: string;
  ditanganiOleh?: string;
}

export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'COMPLETED';
export type TaskPriority = 'RENDAH' | 'SEDANG' | 'TINGGI' | 'MENDESAK';
export type TaskCategory =
  | 'IBADAH'
  | 'DIAKONIA'
  | 'PEMBANGUNAN'
  | 'KATEKISASI'
  | 'SEKRETARIAT'
  | 'KEUANGAN'
  | 'SARPRAS'
  | 'ACARA_KHUSUS'
  | 'PELAYANAN_ANAK_REMAJA';

export interface TaskSubtask {
  id: string;
  judul: string;
  isDone: boolean;
  assignedTo?: string;
}

export interface TaskProgressNote {
  id: string;
  penulis: string;
  catatan: string;
  waktu: string;
  userRole?: string;
}

export interface PelayananTask {
  id: string;
  judul: string;
  deskripsi: string;
  kategori: TaskCategory;
  prioritas: TaskPriority;
  status: TaskStatus;
  penanggungJawab: string;
  penanggungJawabRole?: string;
  penanggungJawabHp?: string;
  pemberiTugas: string;
  tanggalDibuat: string;
  tenggatWaktu: string;
  tanggalSelesai?: string;
  subtasks: TaskSubtask[];
  catatanProgres: TaskProgressNote[];
  anggaran?: number;
  realisasiAnggaran?: number;
  lokasiTerkait?: string;
  lampiranUrl?: string;
  tags?: string[];
}

export type BugKategori =
  | 'Tampilan (UI/UX)'
  | 'Fungsionalitas / Fitur Rusak'
  | 'Keuangan & Buku Kas'
  | 'Data Warga & Sensus'
  | 'Jadwal & Ibadah'
  | 'Cetak & Ekspor Dokumen'
  | 'Performa & Koneksi'
  | 'Keamanan & Akun'
  | 'Lainnya';

export type BugPrioritas = 'Rendah' | 'Sedang' | 'Tinggi' | 'Kritis';
export type BugStatus = 'Baru' | 'Dalam Penanganan' | 'Selesai' | 'Ditolak';

export interface InfoPerangkat {
  browser?: string;
  os?: string;
  screenResolution?: string;
  url?: string;
  onlineStatus?: boolean;
}

export interface PelaporBugInfo {
  nama: string;
  email?: string;
  noHp?: string;
  role: string;
  userId?: string;
}

export interface LaporanBug {
  id: string;
  judul: string;
  kategori: BugKategori;
  prioritas: BugPrioritas;
  halamanTerkait: string;
  deskripsi: string;
  langkahReproduksi?: string;
  pesanError?: string;
  lampiranUrl?: string;
  status: BugStatus;
  pelapor: PelaporBugInfo;
  tanggapanAdmin?: string;
  ditanganiOleh?: string;
  tanggalLapor: string;
  tanggalUpdate?: string;
  infoPerangkat?: InfoPerangkat;
}

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastAction {
  label: string;
  onClick: () => void;
  primary?: boolean;
}

export interface ToastItem {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number; // ms, default 4000
  createdAt: number;
  action?: ToastAction;
}

export interface ToastOptions {
  type?: ToastType;
  title?: string;
  message: string;
  duration?: number;
  action?: ToastAction;
}


