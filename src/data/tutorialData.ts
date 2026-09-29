import {
  Compass,
  Users,
  Church,
  DollarSign,
  FileText,
  Vote,
  Settings,
  ShieldCheck,
  Smartphone,
  CheckCircle2,
  BookOpen,
} from 'lucide-react';

export interface TutorialStep {
  stepNumber: number;
  title: string;
  description: string;
  tips?: string;
  actionTab?: string;
  actionPortalTab?: string;
  actionLabel?: string;
  badge?: string;
}

export interface TutorialCategory {
  id: string;
  title: string;
  shortDesc: string;
  icon: any;
  color: string;
  roleBadge: string;
  steps: TutorialStep[];
}

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
  category: string;
  relatedTab?: string;
  relatedTabLabel?: string;
}

export const tutorialCategories: TutorialCategory[] = [
  {
    id: 'quickstart',
    title: 'Mulai Cepat (Pengenalan Dasar & Antarmuka)',
    shortDesc: 'Pelajari navigasi dasar, beralih mode MPH vs Warga, tema tampilan, dan instalasi PWA di HP.',
    icon: Compass,
    color: 'from-blue-600 to-indigo-700',
    roleBadge: 'Semua Pengguna',
    steps: [
      {
        stepNumber: 1,
        title: 'Mengenal Dua Mode Tampilan: Panel MPH & Portal Warga',
        description:
          'Aplikasi ini memiliki 2 tampilan terintegrasi:\n1. **Mode Panel MPH (Administrasi)**: Digunakan oleh pengurus, pendeta, penatua, diakon, dan sekretariat untuk mencatat data warga jemaat, mengelola buku kas, dan menyusun liturgi ibadah.\n2. **Mode Portal Warga Jemaat**: Halaman publik interaktif bagi seluruh jemaat untuk membaca warta gereja, cek jadwal ibadah, pendaftaran mandiri, renungan nast, dan memberikan persembahan QRIS.',
        tips: 'Pengurus dapat beralih mode kapan saja melalui tombol "MPH" dan "Warga Jemaat" pada bilah atas (Header) untuk meninjau tampilan warta jemaat.',
        badge: 'Konsep Dasar',
      },
      {
        stepNumber: 2,
        title: 'Navigasi Menu Sidebar & Pencarian Modul',
        description:
          'Di sebelah kiri terdapat Menu Sidebar yang terkelompok rapi sesuai bidang:\n- Ringkasan & Berita Utama\n- Ibadah & Pembinaan Rohani\n- Keanggotaan & Layanan Jemaat\n- Keuangan & Kas Jemaat\n- Tata Kelola, Aset & Persuratan\n- Pengaturan Sistem & Hak Akses.\nPada ponsel (HP), klik ikon hamburger (garis tiga) di pojok kiri atas untuk membuka navigasi.',
        tips: 'Setiap menu menampilkan lencana angka (badge) notifikasi data baru, seperti permohonan anggota yang menunggu verifikasi atau servis aset yang jatuh tempo.',
        actionTab: 'dashboard',
        actionLabel: 'Buka Dashboard Utama',
      },
      {
        stepNumber: 3,
        title: 'Instalasi Aplikasi di Ponsel (Android & iPhone PWA)',
        description:
          'Aplikasi didesain dengan standar Progressive Web App (PWA) yang sangat ringan:\n- **Android (Google Chrome)**: Klik tombol titik tiga di kanan atas > pilih "Tambahkan ke Layar Utama" (Add to Home screen).\n- **iPhone (Apple Safari)**: Klik tombol Bagikan (Share - ikon kotak panah ke atas) > pilih "Add to Home Screen".\nAplikasi akan terpasang di HP Anda layaknya aplikasi resmi tanpa membebani memori penyimpanan.',
        tips: 'Aplikasi yang terpasang di layar utama akan terbuka satu layar penuh (fullscreen) tanpa bilah URL peramban.',
        badge: 'PWA Mobile',
      },
      {
        stepNumber: 4,
        title: 'Beralih Tema Terang & Tema Gelap (Dark / Light Mode)',
        description:
          'Klik tombol Matahari / Bulan pada Header atas untuk memilih tema yang paling nyaman bagi mata Anda. Tampilan dioptimalkan dengan kontras tinggi sehingga teks selalu terbaca jernih baik di luar ruangan maupun dalam ruangan redup.',
        tips: 'Pilihan tema tersimpan secara otomatis pada peramban perangkat Anda.',
      },
      {
        stepNumber: 5,
        title: 'Indikator Online / Offline & Sinkronisasi Cloud Firestore',
        description:
          'Bilah atas menampilkan status koneksi internet. Jika terjadi gangguan jaringan sesaat, data lokal di HP/laptop tetap aman. Saat internet kembali terhubung, sistem otomatis menyinkronkan seluruh perubahan ke database Google Cloud Firestore.',
        tips: 'Klik ikon WiFi pada Header untuk memicu pemeriksaan koneksi internet secara manual kapan saja.',
      },
    ],
  },
  {
    id: 'warga',
    title: 'Panduan Warga Jemaat & Layanan Publik',
    shortDesc: 'Pendaftaran anggota mandiri, persembahan digital QRIS, notifikasi resi, alkitab & warta jemaat.',
    icon: Users,
    color: 'from-emerald-600 to-teal-700',
    roleBadge: 'Warga Jemaat & Simpatisan',
    steps: [
      {
        stepNumber: 1,
        title: 'Pendaftaran Anggota Jemaat Secara Mandiri',
        description:
          'Warga jemaat baru atau mutasi dapat mendaftarkan diri secara mandiri tanpa harus datang ke kantor gereja:\n1. Buka menu **Form Pendaftaran Anggota (Mandiri)** di Portal Warga.\n2. Isi identitas lengkap, tempat/tanggal lahir, nomor WhatsApp aktif, dan alamat domisili.\n3. Lengkapi riwayat sakramen (Baptis, Sidi, atau Pernikahan Kudus).\n4. Klik **Kirim Permohonan Pendaftaran**.\n5. Sekretariat jemaat akan memvalidasi data dan menerbitkan Nomor Induk Anggota (NIA) resmi.',
        tips: 'Pastikan nomor WhatsApp aktif untuk menerima konfirmasi nomor anggota gereja.',
        actionTab: 'pendaftaran_warga',
        actionLabel: 'Buka Form Pendaftaran Warga',
      },
      {
        stepNumber: 2,
        title: 'Memberikan Persembahan Digital via QRIS & GoPay',
        description:
          'Mendukung persembahan non-tunai (cashless) yang aman, transparan, dan tercatat otomatis:\n1. Buka menu **Persembahan QRIS & GoPay** atau klik tombol QRIS di Portal Warga.\n2. Pilih peruntukan persembahan: Kantong I, Kantong II, Perpuluhan, Syukur, Pembangunan, atau Diakonia.\n3. Masukkan jumlah nominal rupiah.\n4. Sistem memunculkan kode QRIS Dinamis yang dapat dipindai oleh semua aplikasi m-Banking (BCA, Mandiri, BRI, BNI, Bank Kalteng) dan dompet digital (GoPay, OVO, Dana, ShopeePay, LinkAja).\n5. Setelah transfer berhasil, Anda dapat mengunggah bukti pembayaran dan langsung mengunduh bukti resi tanda terima.',
        tips: 'Resi tanda terima digital dapat disimpan ke galeri foto atau dikirim langsung ke WhatsApp Bendahara Gereja.',
        actionTab: 'persembahan_digital',
        actionLabel: 'Buka Modul Persembahan QRIS',
      },
      {
        stepNumber: 3,
        title: 'Memantau Status Resi Persembahan (Notifikasi Resi)',
        description:
          'Fitur Notifikasi Resi di Header atas dan menu Profil memungkinkan warga dan pengurus melacak status verifikasi persembahan:\n- Cek apakah persembahan berstatus "Menunggu Verifikasi" atau "Disetujui Sah".\n- Lihat nomor transaksi, tanggal, pos persembahan, dan rincian nominal.\n- Unduh struk gambar tanda terima resmi berkop gereja kapan saja.',
        tips: 'Klik ikon Lonceng Resi di bilah Header untuk langsung membuka riwayat resi persembahan Anda.',
      },
      {
        stepNumber: 4,
        title: 'Melihat Jadwal Ibadah, Pelayan Firman & Liturgi',
        description:
          'Warga jemaat dapat memeriksa jadwal Ibadah Hari Minggu, Ibadah Kategorial (SPB, SPPer, SPPR, SPA), serta Ibadah Lingkungan Rumah Tangga lengkap dengan pengkhotbah, liturgos, pemandu pujian, pemain musik, serta bacaan nast Alkitab.',
        tips: 'Tersedia tombol unduh dan cetak tata ibadah bagi yang bertugas.',
        actionTab: 'jadwal_ibadah',
        actionLabel: 'Buka Jadwal Ibadah',
      },
      {
        stepNumber: 5,
        title: 'Membaca Alkitab Digital (TB 66 Kitab) & Almanak Nast Harian GKE',
        description:
          'Aplikasi menyediakan Alkitab Elektronik Lengkap (Perjanjian Lama & Baru 66 Kitab) serta Almanak Nast Harian Sinode GKE lengkap dengan panduan pembacaan Alkitab setahun dan bahan renungan keluarga.',
        actionTab: 'alkitab',
        actionLabel: 'Buka Alkitab Online',
      },
      {
        stepNumber: 6,
        title: 'Layanan Permohonan Sakramen & Pencatatan Duka Cita',
        description:
          'Warga jemaat dapat mengajukan permohonan pelayanan Baptisan Kudus Anak/Dewasa, Katekisasi Sidi, dan Pemberkatan Nikah secara langsung melalui portal, serta menyampaikan kabar duka cita keluarga.',
        actionTab: 'pelayanan_sakramen',
        actionLabel: 'Buka Layanan Sakramen',
      },
    ],
  },
  {
    id: 'pelayan',
    title: 'Panduan Majelis, Liturgos & Pelayan Ibadah',
    shortDesc: 'Menyusun jadwal ibadah, rancangan khotbah, penugasan pelayan, dan administrasi sakramen.',
    icon: Church,
    color: 'from-indigo-600 to-purple-700',
    roleBadge: 'Pendeta, Penatua & Diakon',
    steps: [
      {
        stepNumber: 1,
        title: 'Membuat & Menata Jadwal Ibadah Mingguan',
        description:
          '1. Buka modul **Jadwal Ibadah & Liturgi**.\n2. Klik tombol **+ Tambah Jadwal Ibadah**.\n3. Tentukan jenis ibadah, tanggal, jam pelaksanaan, gereja/keluarga tuan rumah, dan tema ibadah.\n4. Pilih petugas pelayan: Pengkhotbah, Liturgos, Pemandu Lagu, Pemain Musik, Multimedia, dan Kolektan.\n5. Klik Simpan. Jadwal langsung tayang di portal warga dan siap dicetak.',
        tips: 'Gunakan fitur duplikasi jadwal dari minggu sebelumnya untuk mempercepat penugasan rutin.',
        actionTab: 'jadwal_ibadah',
        actionLabel: 'Kelola Jadwal Ibadah',
      },
      {
        stepNumber: 2,
        title: 'Menyusun Rancangan Khotbah & Arsip Naskah Renungan',
        description:
          'Pendeta dan Penatua yang bertugas dapat menyimpan naskah khotbah di modul **Rancangan Khotbah**:\n- Masukkan Nast Alkitab, Tema Khotbah, Tujuan Teologis, dan Pokok-pokok Renungan.\n- Seluruh naskah tersimpan rapi sebagai khazanah literasi teologi jemaat.',
        actionTab: 'rancangan_khotbah',
        actionLabel: 'Buka Rancangan Khotbah',
      },
      {
        stepNumber: 3,
        title: 'Papan Tugas Pelayanan (Task Board / Kanban)',
        description:
          'Mengkoordinasikan persiapan hari raya gerejawi (Natal, Paskah, HUT GKE) dan tugas rutin majelis menggunakan papan Kanban:\n- Kolom: Belum Dikerjakan, Sedang Berjalan, dan Selesai.\n- Tentukan Penanggung Jawab (PIC), batas waktu (deadline), dan prioritas tugas.',
        tips: 'Klik status pada kartu tugas untuk memperbarui progres ke seluruh tim majelis.',
        actionTab: 'manajemen_tugas',
        actionLabel: 'Buka Task Board Pelayanan',
      },
      {
        stepNumber: 4,
        title: 'Buku Registrasi Sakramen & Cetak Surat Akta',
        description:
          'Modul **Pelayanan Nikah, Baptis & Sidi** digunakan untuk:\n1. Mendaftarkan peserta Baptisan Anak/Dewasa, Sidi, dan Pernikahan Kudus.\n2. Mencatat nomor registrasi akta gereja, pendeta yang melayani, dan saksi-saksi.\n3. Mencetak Surat Akta Baptis, Sidi, atau Surat Keterangan Nikah berformat resmi kop jemaat.',
        actionTab: 'pelayanan_sakramen',
        actionLabel: 'Buka Pelayanan Sakramen',
      },
      {
        stepNumber: 5,
        title: 'Pencatatan Duka Cita & Surat Keterangan Kematian',
        description:
          'Mencatat peristiwa meninggalnya warga jemaat, tanggal pemakaman, tempat pemakaman, pendeta pelayan, dan mencetak Surat Keterangan Kematian resmi berkop Majelis Jemaat GKE.',
        actionTab: 'data_kematian',
        actionLabel: 'Buka Data Kematian',
      },
    ],
  },
  {
    id: 'keuangan',
    title: 'Panduan Bendahara & Pengelolaan Kas Jemaat',
    shortDesc: 'Pencatatan kas masuk/keluar, buku iuran 12 bulan, verifikasi resi, dan laporan pertanggungjawaban.',
    icon: DollarSign,
    color: 'from-amber-600 to-orange-700',
    roleBadge: 'Bendahara & Tim Verifikasi',
    steps: [
      {
        stepNumber: 1,
        title: 'Mencatat Pemasukan & Pengeluaran Kas Jemaat',
        description:
          '1. Buka modul **Buku Kas Jemaat**.\n2. Klik **+ Catat Transaksi Baru**.\n3. Pilih Jenis: **Pemasukan** (Kolekte, Syukur, Perpuluhan, Lelang) atau **Pengeluaran** (Operasional, Honor Pelayan, Diakonia, Pembangunan, Setoran Sinode/Resort).\n4. Tentukan Pos Kas & Akun Bank (Kas Tunai, Rekening BRI, Mandiri, GoPay/QRIS).\n5. Masukkan Jumlah Rupiah, Uraian Transaksi, dan lampirkan nota jika ada.\n6. Klik Simpan. Saldo kas otomatis terkalkulasi seketika.',
        tips: 'Grafik ringkasan di dashboard kas menampilkan perbandingan pemasukan vs pengeluaran dan tren saldo.',
        actionTab: 'keuangan',
        actionLabel: 'Buka Buku Kas Jemaat',
      },
      {
        stepNumber: 2,
        title: 'Pemisahan Pos Kas & Pengaturan Saldo Awal',
        description:
          'Sistem mengelola pos kas independen: Kas Umum, Kas Pembangunan, Kas Diakonia, dan Kas Seksi Kategorial. Bendahara dapat mengatur **Saldo Awal** per pos pada awal tahun buku untuk menjamin keakuratan laporan kumulatif.',
        actionTab: 'keuangan',
        actionLabel: 'Kelola Pos Kas & Saldo Awal',
      },
      {
        stepNumber: 3,
        title: 'Buku Iuran Kewajiban Warga Jemaat (Januari - Desember)',
        description:
          'Sistem menyediakan matriks pelacakan iuran bulanan per Kepala Keluarga (KK):\n- Kolom bulan Januari hingga Desember dengan centang hijau jika sudah lunas.\n- Klik pada kotak bulan tertentu untuk mencatat pelunasan iuran atau tanggal bayar.\n- Tersedia tombol cetak Kwitansi Tanda Terima Iuran Resmi berkop gereja.',
        tips: 'Gunakan Filter Lingkungan / Rayon untuk melihat warga yang masih memiliki tunggakan iuran.',
        actionTab: 'iuran_kewajiban',
        actionLabel: 'Buka Buku Iuran Warga',
      },
      {
        stepNumber: 4,
        title: 'Verifikasi Resi Persembahan Digital (Otomatis Masuk Kas)',
        description:
          'Ketika jemaat mengirim konfirmasi transfer persembahan QRIS atau bank:\n1. Buka jendela **Notifikasi Resi** (ikon bel di Header) atau modul **Monitor Webhook & Callback**.\n2. Periksa nominal dan foto bukti transfer jemaat.\n3. Klik tombol **Setujui / Verifikasi**.\n4. Nominal transaksi otomatis ditambahkan ke Buku Kas Jemaat tanpa perlu input ulang.',
        actionTab: 'gopay_webhook',
        actionLabel: 'Buka Verifikasi Resi',
      },
      {
        stepNumber: 5,
        title: 'Cetak & Ekspor Laporan Pertanggungjawaban Kas Resmi',
        description:
          '1. Pada modul Buku Kas, pilih rentang tanggal atau filter pos yang diinginkan.\n2. Klik tombol **Cetak Laporan Kas** atau **Simpan Word (.doc)**.\n3. Format dokumen sudah mencakup Kop Surat resmi gereja, rincian per pos kas, saldo awal, penerimaan, pengeluaran, saldo akhir, serta kolom tanda tangan sah Ketua MPH dan Bendahara Jemaat.',
        tips: 'Laporan ini siap digandakan untuk warta keuangan hari Minggu atau Sidang Jemaat.',
      },
    ],
  },
  {
    id: 'administrasi',
    title: 'Panduan Sekretariat, Persuratan & Aset',
    shortDesc: 'Penomoran surat baku GKE, agenda surat, surat pelimpahan nikah, inventaris & jadwal servis alat.',
    icon: FileText,
    color: 'from-teal-600 to-cyan-700',
    roleBadge: 'Sekretaris & Bagian Aset',
    steps: [
      {
        stepNumber: 1,
        title: 'Format Penomoran Surat Resmi Baku Kearsipan Sinode GKE',
        description:
          'Penomoran surat keluar mengikuti format baku tata gereja GKE:\n`[Nomor Urut]/[Kode Klasifikasi]/MPH-JEMAAT/GKE/[Bulan Romawi]/[Tahun]`\nContoh: `042/B-1/MPH-JEMAAT/GKE/IV/2026`.\nSistem membantu pengisian otomatis kode klasifikasi untuk surat umum, pastoral, keuangan, maupun rekomendasi.',
        badge: 'Standar Sinode',
        actionTab: 'agenda_surat',
        actionLabel: 'Buka Agenda Surat',
      },
      {
        stepNumber: 2,
        title: 'Agenda Surat Masuk, Surat Keluar & Lembar Disposisi',
        description:
          '1. Buka modul **Agenda Surat Masuk & Keluar**.\n2. Surat Masuk: catat nomor surat asal, tanggal terima, pengirim, perihal, dan unggah scan surat.\n3. Surat Keluar: catat tujuan surat, tanggal terbit, dan lampiran berkas.\n4. Catat disposisi Ketua Majelis Jemaat untuk arahan tindak lanjut kepada sekretariat atau seksi terkait.',
        actionTab: 'agenda_surat',
        actionLabel: 'Kelola Agenda Surat',
      },
      {
        stepNumber: 3,
        title: 'Menerbitkan Surat Pelimpahan Pelayanan Nikah',
        description:
          'Jika ada anggota jemaat yang akan melangsungkan pemberkatan pernikahan di gereja jemaat/resort lain:\n1. Buka modul **Surat Pelimpahan Nikah**.\n2. Masukkan data calon mempelai pria dan wanita beserta jemaat tujuan.\n3. Sistem langsung menghasilkan Surat Pelimpahan resmi berstandar Sinode GKE siap cetak.',
        actionTab: 'surat_pelimpahan_nikah',
        actionLabel: 'Buka Surat Pelimpahan Nikah',
      },
      {
        stepNumber: 4,
        title: 'Pencatatan Inventaris Aset & Nilai Properti Gereja',
        description:
          'Mencatat seluruh properti bergerak dan tidak bergerak milik jemaat:\n- Alat Musik & Sound System (Keyboard, Mixer, Mic, Sound, Amplifier).\n- Perlengkapan Ibadah (Mimbar, Bejana Baptis, Perlengkapan Perjamuan Kudus, Salib).\n- Gedung Gereja, Pastori, Tanah, Bangku Jemaat, dan Kendaraan Operasional.\n- Catat kondisi barang: Baik, Rusak Ringan, Rusak Berat beserta taksiran nilai aset.',
        actionTab: 'inventaris_aset',
        actionLabel: 'Buka Inventaris Aset',
      },
      {
        stepNumber: 5,
        title: 'Jadwal Servis Berkala & Kirim WhatsApp ke Teknisi',
        description:
          'Mencegah kerusakan mendadak alat ibadah dengan jadwal servis berkala:\n1. Buka modul **Jadwal Servis & Pemeliharaan**.\n2. Masukkan jadwal servis rutin (servis AC tiap 3 bulan, ganti oli genset, tune-up sound system).\n3. Tentukan tanggal jatuh tempo dan kontak teknisi / penanggung jawab.\n4. Sistem memunculkan tanda peringatan saat jadwal jatuh tempo.\n5. Klik tombol **Kirim WA** untuk mengirim pesan pengingat langsung ke nomor teknisi.',
        actionTab: 'pemeliharaan_aset',
        actionLabel: 'Buka Pemeliharaan Aset',
      },
    ],
  },
  {
    id: 'pembangunan_voting',
    title: 'Panitia Pembangunan, Kategorial & E-Voting',
    shortDesc: 'RAB & progres fisik pembangunan, seksi kategorial, serta e-voting pemilihan majelis jemaat.',
    icon: Vote,
    color: 'from-violet-600 to-indigo-700',
    roleBadge: 'Panitia & Seksi Kategorial',
    steps: [
      {
        stepNumber: 1,
        title: 'Pengelolaan Anggaran (RAB) & Realisasi Pembangunan Fisik',
        description:
          'Modul **Panitia Pembangunan** mengakomodasi rincian Rencana Anggaran Biaya (RAB), pencatatan belanja material, pembayaran tukang/kontraktor, serta persentase capaian fisik pembangunan gedung gereja atau renovasi pastori.',
        actionTab: 'panitia_pembangunan',
        actionLabel: 'Buka Panitia Pembangunan',
      },
      {
        stepNumber: 2,
        title: 'Manajemen Seksi Kategorial (SPPer, SPB, SPPR, SPA)',
        description:
          'Mengelola kegiatan, kepengurusan, dan program kerja 4 Seksi Pelayanan Kategorial:\n- Seksi Pelayanan Perempuan (SPPer)\n- Seksi Pelayanan Bapak (SPB)\n- Seksi Pelayanan Pemuda & Remaja (SPPR/P)\n- Seksi Pelayanan Anak (SPA)',
        actionTab: 'seksi_kategorial',
        actionLabel: 'Buka Seksi Kategorial',
      },
      {
        stepNumber: 3,
        title: 'Sistem E-Voting Pemilihan Calon Penatua & Diakon',
        description:
          'Menyelenggarakan pemilihan calon majelis jemaat baru secara digital, cepat, dan rahasia:\n1. Input daftar calon penatua dan calon diakon per lingkungan.\n2. Jemaat memberikan suara melalui bilik suara digital.\n3. Sistem menghitung perolehan suara secara otomatis (Quick Count Real-Time) lengkap dengan diagram perolehan.',
        actionTab: 'e_voting',
        actionLabel: 'Buka E-Voting Pemilihan',
      },
      {
        stepNumber: 4,
        title: 'Cetak Berita Acara Rapat Pemilihan Majelis Jemaat',
        description:
          'Setelah pemungutan suara selesai, sistem dapat langsung mencetak Berita Acara Rapat Pemilihan Calon Penatua dan Diakon resmi berkop GKE lengkap dengan tanda tangan Panitia Pemilihan.',
      },
    ],
  },
  {
    id: 'admin_it',
    title: 'Panduan Administrator Sistem & IT Gereja',
    shortDesc: 'Pengaturan identitas jemaat, background gereja, hak akses user, backup JSON, dan audit log.',
    icon: Settings,
    color: 'from-rose-600 to-pink-700',
    roleBadge: 'Administrator & IT Gereja',
    steps: [
      {
        stepNumber: 1,
        title: 'Pengaturan Identitas Jemaat & Pejabat MPH Penandatangan',
        description:
          '1. Buka modul **Pengaturan Identitas & Kop Surat**.\n2. Masukkan Nama Jemaat resmi, Nama Resort, Alamat Gereja, Nomor Telepon, Email, dan unggah Logo Resmi GKE.\n3. Lengkapi susunan Pejabat Majelis Pekerja Harian (Ketua, Sekretaris, Bendahara) beserta gelar dan NIP/NRP.\n4. Data ini otomatis digunakan di seluruh kop surat, laporan kas, dan akta gereja.',
        tips: 'Gunakan logo berformat PNG latar belakang transparan untuk hasil cetak dokumen yang rapi dan profesional.',
        actionTab: 'pengaturan',
        actionLabel: 'Buka Pengaturan Identitas',
      },
      {
        stepNumber: 2,
        title: 'Kustomisasi Background Foto Gedung Gereja & Overlay Cahaya',
        description:
          '1. Buka modul **Pengaturan Background Gereja**.\n2. Pilih foto gereja dari galeri bawaan atau unggah foto gedung gereja Anda sendiri dari laptop/HP.\n3. Sesuaikan slider **Kekuatan Lapisan Cahaya (Light Overlay)** dan **Efek Kelembutan (Blur)**.\n4. Pratinjau langsung (Live Preview) menjamin seluruh teks pada kartu dan tabel tetap kontras dan nyaman dibaca.',
        actionTab: 'pengaturan_background',
        actionLabel: 'Buka Pengaturan Background',
      },
      {
        stepNumber: 3,
        title: 'Pencadangan Mandiri (Backup JSON) & Pemulihan Data',
        description:
          'Sangat penting untuk mencadangkan data secara berkala:\n1. Buka menu Pengaturan atau klik Profil > "Backup & Restore Database".\n2. Klik tombol **Unduh Cadangan JSON** untuk menyimpan seluruh arsip data jemaat ke komputer Anda secara offline.\n3. Jika berpindah perangkat atau melakukan pemulihan, gunakan tombol **Pilih Berkas JSON & Pulihkan**.',
        tips: 'Simpan berkas cadangan JSON di penyimpanan Google Drive atau flashdisk cadangan majelis.',
        actionTab: 'pengaturan',
        actionLabel: 'Buka Backup & Restore',
      },
      {
        stepNumber: 4,
        title: 'Manajemen Akun Pengguna & Pembagian Peran (Role)',
        description:
          'Admin dapat mengelola hak akses akun gereja:\n- **Admin**: Akses penuh ke konfigurasi sistem, keuangan, data jemaat, dan audit log.\n- **Bendahara**: Akses ke Buku Kas, Iuran Bulanan, Resi Persembahan, dan Laporan Keuangan.\n- **Sekretaris**: Akses ke Pendataan Warga, Persuratan, Sakramen, Inventaris, dan Jadwal Ibadah.\n- **Warga**: Akses portal publik untuk warta, jadwal, renungan nast, dan persembahan.',
        actionTab: 'kelola_akun',
        actionLabel: 'Buka Kelola Akun',
      },
      {
        stepNumber: 5,
        title: 'Integrasi WhatsApp BOT & Gateway Pengingat',
        description:
          'Modul WhatsApp Gateway memungkinkan aplikasi mengirimkan pesan otomatis:\n- Ucapan selamat ulang tahun otomatis kepada jemaat yang berulang tahun setiap pagi.\n- Notifikasi konfirmasi pendaftaran anggota jemaat baru.\n- Notifikasi pengingat jadwal servis alat ibadah ke nomor teknisi.\n- Broadcast warta ibadah ke jemaat.',
        actionTab: 'whatsapp_bot',
        actionLabel: 'Kelola WhatsApp BOT',
      },
      {
        stepNumber: 6,
        title: 'Audit Keamanan & Rekaman Log Aktivitas Sistem',
        description:
          'Sistem secara otomatis mencatat setiap aktivitas krusial pada modul **Audit Keamanan**:\n- Waktu login pengguna, browser yang digunakan, dan status sesi.\n- Riwayat penambahan, pengubahan, atau penghapusan transaksi keuangan dan data jemaat.\n- Melindungi sistem dari manipulasi dan menjamin akuntabilitas kepengurusan gereja.',
        actionTab: 'audit_keamanan',
        actionLabel: 'Buka Log Audit Keamanan',
      },
    ],
  },
];

export const faqList: FaqItem[] = [
  {
    id: 'faq-1',
    category: 'Akun & Akses',
    question: 'Bagaimana jika pengurus atau jemaat lupa kata sandi (password)?',
    answer:
      'Administrator dapat mengatur ulang (reset) kata sandi pengguna melalui menu "Kelola Akun & Hak Akses User". Cari nama pengguna yang bersangkutan, klik tombol "Ubah / Reset Password", lalu masukkan kata sandi baru. Pengguna juga dapat mengubah kata sandi mandiri melalui menu "Edit Profil Saya" di pojok kanan atas.',
    relatedTab: 'kelola_akun',
    relatedTabLabel: 'Buka Kelola Akun',
  },
  {
    id: 'faq-2',
    category: 'Penyimpanan & Keamanan',
    question: 'Apakah data gereja aman jika laptop atau komputer gereja rusak atau hilang?',
    answer:
      'Sangat aman! Seluruh data tersimpan secara terenkripsi di Google Cloud Firestore. Jika perangkat Anda rusak atau hilang, Anda cukup membuka tautan aplikasi ini di laptop atau ponsel baru dan masuk dengan akun Anda, seluruh data warga, keuangan, dan arsip gereja akan langsung muncul kembali secara utuh.',
  },
  {
    id: 'faq-3',
    category: 'Pencetakan & Format',
    question: 'Bagaimana cara mencetak warta, jadwal, atau laporan jika di gereja tidak ada printer?',
    answer:
      'Saat Anda mengklik tombol "Cetak" di modul mana saja, dialog cetak peramban akan muncul. Di bagian pilihan printer (Destination), pilih opsi "Save as PDF" (Simpan sebagai PDF). Dokumen PDF akan tersimpan di laptop/ponsel Anda dan dapat dibagikan melalui WhatsApp ke percetakan atau jemaat. Anda juga dapat memilih tombol "Simpan Word (.doc)" untuk mengedit dokumen di Microsoft Word.',
  },
  {
    id: 'faq-4',
    category: 'Aplikasi Ponsel (HP)',
    question: 'Dapatkah aplikasi ini diinstal sebagai aplikasi di layar utama HP (Android / iPhone)?',
    answer:
      'Bisa! Aplikasi ini didesain sebagai Progressive Web App (PWA). Di Google Chrome Android, klik ikon titik tiga di kanan atas lalu pilih "Tambahkan ke Layar Utama" (Add to Home screen). Di iPhone (Safari), klik tombol Share (kotak dengan panah ke atas) lalu pilih "Add to Home Screen". Aplikasi akan terpasang di HP Anda layaknya aplikasi resmi dari Play Store / App Store.',
  },
  {
    id: 'faq-5',
    category: 'Keuangan & QRIS',
    question: 'Mengapa persembahan QRIS yang di-scan warga belum langsung masuk ke saldo kas?',
    answer:
      'Untuk transaksi QRIS dinamis atau transfer bank yang menggunakan bukti resi manual, bendahara perlu memverifikasi bukti transfer di menu "Notifikasi Resi" (ikon lonceng di Header) atau menu "Monitor Webhook & Callback". Setelah bendahara mengklik "Setujui", saldo kas akan langsung bertambah secara otomatis.',
    relatedTab: 'gopay_webhook',
    relatedTabLabel: 'Buka Verifikasi Resi',
  },
  {
    id: 'faq-6',
    category: 'Mode Perbaikan',
    question: 'Kapan Mode Perbaikan (Under Construction) sebaiknya diaktifkan?',
    answer:
      'Mode Perbaikan diaktifkan melalui menu "Pengaturan Identitas" ketika panitia sedang melakukan pemeliharaan data besar-besaran (misalnya tutup buku akhir tahun atau sensus jemaat). Saat mode ini aktif, warga jemaat yang membuka portal akan melihat pesan bahwa sistem sedang dalam pembaruan.',
    relatedTab: 'pengaturan',
    relatedTabLabel: 'Buka Pengaturan',
  },
  {
    id: 'faq-7',
    category: 'Backup Data',
    question: 'Seberapa sering pengurus gereja sebaiknya melakukan unduh cadangan (backup) JSON?',
    answer:
      'Disarankan melakukan pencadangan sekurang-kurangnya sekali sebulan atau sesudah kegiatan penting (seperti penutupan buku kas bulanan, sensus berkala, atau sesudah acara hari raya). Berkas JSON dapat disimpan pada penyimpanan awan (Google Drive) atau flashdisk khusus kantor jemaat.',
    relatedTab: 'pengaturan',
    relatedTabLabel: 'Buka Pengaturan',
  },
  {
    id: 'faq-8',
    category: 'Persuratan',
    question: 'Bagaimana format penomoran surat keluar resmi berstandar Sinode GKE?',
    answer:
      'Format penomoran surat baku GKE adalah: [Nomor Urut]/[Kode Klasifikasi]/MPH-JEMAAT/GKE/[Bulan Romawi]/[Tahun]. Kode klasifikasi meliputi: A (Pemerintahan/Umum), B (Pelayanan/Pastoral/Khotbah), C (Keuangan/Perbendaharaan), D (Kepegawaian/Personalia), E (Aset/Gedung/Inventaris).',
    relatedTab: 'agenda_surat',
    relatedTabLabel: 'Buka Agenda Surat',
  },
  {
    id: 'faq-9',
    category: 'Warga & Mutasi',
    question: 'Bagaimana mencatat anggota keluarga jemaat yang pindah gereja atau menikah keluar?',
    answer:
      'Buka modul "Data Induk Anggota", cari anggota jemaat yang bersangkutan, ubah status keanggotaan menjadi "Mutasi Keluar", lalu masukkan nomor Surat Atestasi Pindah yang diterbitkan sekretariat jemaat. Riwayat data tetap tersimpan sebagai arsip historis.',
    relatedTab: 'warga',
    relatedTabLabel: 'Buka Data Warga',
  },
  {
    id: 'faq-10',
    category: 'Notifikasi Resi',
    question: 'Di mana pengurus dan jemaat dapat memeriksa daftar resi persembahan yang sudah diterbitkan?',
    answer:
      'Klik tombol "Resi" dengan ikon lonceng pada bilah atas (Header) atau pilih "Notifikasi Resi" pada menu profil Anda di pojok kanan atas. Jendela modal Notifikasi Resi akan menampilkan seluruh daftar resi, rincian status verifikasi, opsi unduh struk tanda terima resmi, dan tautan kirim pesan konfirmasi ke WhatsApp.',
  },
];
