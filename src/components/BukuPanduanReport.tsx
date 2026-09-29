import React from 'react';
import { KopSurat } from './KopSurat';
import { SignatureBlock } from './SignatureBlock';
import { useApp } from '../context/AppContext';

export const BukuPanduanReport: React.FC = () => {
  const { settings } = useApp();

  const currentDateStr = new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date());

  return (
    <div className="text-slate-900 text-xs font-sans leading-relaxed space-y-6">
      {/* Official GKE Kop Surat */}
      <KopSurat
        title="BUKU PANDUAN & TUTORIAL RESMI SISTEM INFORMASI GKE"
        subtitle="Pedoman Operasional & Tata Kelola Aplikasi Pelayanan Digital Jemaat GKE"
      />

      {/* Document Meta Header Box */}
      <div className="border border-slate-300 rounded-lg p-3 bg-slate-50 text-[11px] grid grid-cols-2 sm:grid-cols-4 gap-2">
        <div>
          <span className="text-slate-500 font-semibold block text-[10px] uppercase">Nomor Dokumen:</span>
          <span className="font-mono font-bold text-slate-800">GKE/PANDUAN/2026/V3.0</span>
        </div>
        <div>
          <span className="text-slate-500 font-semibold block text-[10px] uppercase">Edisi & Versi:</span>
          <span className="font-bold text-slate-800">Edisi Pembaruan 2026 (v3.0)</span>
        </div>
        <div>
          <span className="text-slate-500 font-semibold block text-[10px] uppercase">Tanggal Terbit:</span>
          <span className="font-bold text-slate-800">{currentDateStr}</span>
        </div>
        <div>
          <span className="text-slate-500 font-semibold block text-[10px] uppercase">Penerbit Resmi:</span>
          <span className="font-bold text-slate-800">MPH {settings?.namaJemaat || 'Jemaat GKE'}</span>
        </div>
      </div>

      {/* Kata Pengantar */}
      <div className="border-l-4 border-indigo-700 pl-4 py-1 text-slate-700 italic space-y-1">
        <p className="font-bold text-slate-900 not-italic">Kata Pengantar Majelis Pekerja Harian (MPH):</p>
        <p>
          "Syalom. Terpujilah Tuhan Yesus Kristus, Kepala Gereja dan Sumber segala hikmat. Buku Panduan ini
          disusun sebagai petunjuk teknis resmi bagi seluruh Majelis Jemaat, Pegawai, Pelayan Khusus, dan
          Warga Jemaat dalam memanfaatkan Sistem Informasi Digital Gereja Kalimantan Evangelis (GKE). Kiranya
          aplikasi ini mewujudkan pelayanan gerejawi yang tertib, transparan, akuntabel, dan memberkati seluruh
          jemaat Tuhan."
        </p>
      </div>

      {/* DAFTAR ISI RESMI */}
      <div className="bg-slate-100/70 p-4 rounded-lg border border-slate-300 space-y-2">
        <h4 className="font-black text-slate-900 text-xs uppercase tracking-wider border-b border-slate-300 pb-1.5">
          DAFTAR ISI BUKU PANDUAN &amp; PEDOMAN OPERASIONAL
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-[11px]">
          <div><strong>BAB I.</strong> Mulai Cepat, Navigasi &amp; Keamanan Sesi</div>
          <div><strong>BAB V.</strong> Administrasi, Persuratan &amp; Pengelolaan Aset</div>
          <div><strong>BAB II.</strong> Panduan Warga Jemaat &amp; Layanan Publik</div>
          <div><strong>BAB VI.</strong> Panitia Pembangunan, Kategorial &amp; E-Voting</div>
          <div><strong>BAB III.</strong> Majelis, Liturgos &amp; Pelayan Ibadah</div>
          <div><strong>BAB VII.</strong> Administrator Sistem, IT &amp; Backup Data</div>
          <div><strong>BAB IV.</strong> Bendahara Kas, Iuran &amp; Verifikasi Resi</div>
          <div><strong>BAB VIII.</strong> Tanya Jawab Umum (FAQ) &amp; Solusi Masalah</div>
        </div>
      </div>

      {/* BAB I */}
      <div className="space-y-3 pt-2">
        <div className="bg-slate-800 text-white px-3 py-1.5 rounded font-black text-xs uppercase tracking-wide">
          BAB I. MULAI CEPAT, NAVIGASI SISTEM &amp; KEAMANAN SESI
        </div>
        <div className="space-y-3 pl-2">
          <div>
            <h5 className="font-bold text-slate-900 text-xs">1.1 Dua Mode Tampilan Terintegrasi (MPH vs Warga Jemaat)</h5>
            <p className="text-slate-700 text-[11px] mt-0.5">
              Sistem memiliki dua antarmuka utama yang dapat dialihkan melalui tombol di pojok kanan atas Header:
              <br />• <strong>Panel MPH (Majelis):</strong> Khusus pendeta, majelis, dan sekretariat untuk tata kelola, buku kas, persuratan, dan penugasan pelayan.
              <br />• <strong>Portal Warga Jemaat:</strong> Halaman publik interaktif bagi jemaat untuk menyimak warta, jadwal ibadah, bacaan nast, dan persembahan digital QRIS.
            </p>
          </div>

          <div>
            <h5 className="font-bold text-slate-900 text-xs">1.2 Navigasi Menu &amp; PWA Mobile (Instal di HP Android &amp; iPhone)</h5>
            <p className="text-slate-700 text-[11px] mt-0.5">
              Aplikasi mendukung standar Progressive Web App (PWA). Jemaat dan pengurus dapat memasang aplikasi langsung ke layar utama ponsel (Home Screen) melalui browser Chrome (klik titik tiga &rarr; <em>Tambahkan ke Layar Utama</em>) atau Safari iOS (klik <em>Share &rarr; Add to Home Screen</em>) tanpa perlu mengunduh berkas besar dari toko aplikasi.
            </p>
          </div>

          <div>
            <h5 className="font-bold text-slate-900 text-xs">1.3 Penyesuaian Tema Terang (Light) &amp; Gelap (Dark Mode)</h5>
            <p className="text-slate-700 text-[11px] mt-0.5">
              Pengguna dapat berganti tema tampilan kapan saja dengan menekan tombol Matahari / Bulan pada Header atas. Pengaturan kontras tinggi dioptimalkan untuk keterbacaan naskah di bawah sinar matahari maupun pencahayaan redup ruang ibadah.
            </p>
          </div>

          <div>
            <h5 className="font-bold text-slate-900 text-xs">1.4 Indikator Koneksi &amp; Sinkronisasi Cloud Firestore</h5>
            <p className="text-slate-700 text-[11px] mt-0.5">
              Status jaringan ditampilkan secara real-time pada bilah atas. Jika jaringan internet mengalami gangguan sesaat, data yang sedang diinput tetap tersimpan aman di cache peramban lokal dan otomatis disinkronkan ke database Cloud saat koneksi kembali aktif.
            </p>
          </div>
        </div>
      </div>

      {/* BAB II */}
      <div className="space-y-3 pt-2">
        <div className="bg-slate-800 text-white px-3 py-1.5 rounded font-black text-xs uppercase tracking-wide">
          BAB II. PANDUAN WARGA JEMAAT &amp; LAYANAN PUBLIK
        </div>
        <div className="space-y-3 pl-2">
          <div>
            <h5 className="font-bold text-slate-900 text-xs">2.1 Pendaftaran Mandiri Anggota Jemaat &amp; Mutasi</h5>
            <p className="text-slate-700 text-[11px] mt-0.5">
              Warga baru atau keluarga yang berpindah domisili dapat mengisi formulir pendaftaran secara online melalui Portal Warga. Setelah diverifikasi oleh sekretariat gereja, sistem otomatis menerbitkan Nomor Induk Anggota (NIA) dan memasukkan data ke Kartu Keluarga Jemaat (KKJ).
            </p>
          </div>

          <div>
            <h5 className="font-bold text-slate-900 text-xs">2.2 Persembahan Digital via QRIS Dinamis &amp; e-Wallet GoPay</h5>
            <p className="text-slate-700 text-[11px] mt-0.5">
              Warga jemaat dapat memberikan persembahan (Kantong I, Kantong II, Perpuluhan, Syukur, Pembangunan, Diakonia) secara non-tunai:
              <br />1. Buka menu <em>Persembahan QRIS</em> di Portal Warga.
              <br />2. Masukkan nominal rupiah &amp; pilih pos tujuan persembahan.
              <br />3. Scan kode QRIS dinamis menggunakan aplikasi m-Banking (BCA, Mandiri, BRI, BNI, Bank Kalteng) atau dompet digital (GoPay, OVO, Dana, LinkAja, ShopeePay).
              <br />4. Unggah bukti transfer jika diperlukan untuk pencatatan nama pengirim.
            </p>
          </div>

          <div>
            <h5 className="font-bold text-slate-900 text-xs">2.3 Pantau Status Resi Persembahan &amp; Notifikasi Real-Time</h5>
            <p className="text-slate-700 text-[11px] mt-0.5">
              Fitur <strong>Notifikasi Resi</strong> memungkinkan warga dan bendahara memantau status validasi secara transparan. Setiap resi memiliki nomor referensi unik, rincian tanggal, pos kas, serta status verifikasi sah oleh Bendahara Majelis Jemaat dengan opsi unduh gambar bukti tanda terima resmi dan kirim konfirmasi WhatsApp.
            </p>
          </div>

          <div>
            <h5 className="font-bold text-slate-900 text-xs">2.4 Akses Alkitab Digital (TB 66 Kitab) &amp; Almanak Nast GKE</h5>
            <p className="text-slate-700 text-[11px] mt-0.5">
              Aplikasi memuat Alkitab Elektronik Terjemahan Baru (Perjanjian Lama &amp; Perjanjian Baru) lengkap dengan pencarian pasal dan ayat, serta kalender Almanak Nast Harian resmi Sinode GKE untuk mendukung saat teduh pribadi dan keluarga.
            </p>
          </div>
        </div>
      </div>

      {/* BAB III */}
      <div className="space-y-3 pt-2">
        <div className="bg-slate-800 text-white px-3 py-1.5 rounded font-black text-xs uppercase tracking-wide">
          BAB III. PANDUAN MAJELIS, LITURGOS &amp; PELAYAN IBADAH
        </div>
        <div className="space-y-3 pl-2">
          <div>
            <h5 className="font-bold text-slate-900 text-xs">3.1 Pengelolaan Jadwal Ibadah Mingguan &amp; Penugasan</h5>
            <p className="text-slate-700 text-[11px] mt-0.5">
              Majelis dapat merancang jadwal ibadah umum hari Minggu, ibadah kategorial (SPB, SPPer, SPPR, SPA), serta ibadah rumah tangga. Sistem menyediakan form penugasan lengkap: Pengkhotbah, Liturgos, Pemandu Pujian, Organis, Multimedia, Kolektan, serta lokasi keluarga tuan rumah.
            </p>
          </div>

          <div>
            <h5 className="font-bold text-slate-900 text-xs">3.2 Penyusunan Rancangan Khotbah &amp; Arsip Renungan</h5>
            <p className="text-slate-700 text-[11px] mt-0.5">
              Pelayan Firman dapat mendokumentasikan nast bacaan, tema teologis, tujuan khotbah, dan butir-butir eksposisi firman. Naskah tersimpan secara terstruktur dalam arsip digital yang dapat ditinjau kembali sewaktu-waktu.
            </p>
          </div>

          <div>
            <h5 className="font-bold text-slate-900 text-xs">3.3 Manajemen Tugas Pelayanan (Task Board / Kanban)</h5>
            <p className="text-slate-700 text-[11px] mt-0.5">
              Membagi koordinasi kepanitiaan hari raya gerejawi (Paskah, Natal, HUT GKE) dalam papan kartu visual: <em>Belum Dikerjakan</em>, <em>Sedang Berjalan</em>, dan <em>Selesai</em> dengan batas waktu (deadline) dan Penanggung Jawab (PIC).
            </p>
          </div>

          <div>
            <h5 className="font-bold text-slate-900 text-xs">3.4 Pencatatan Sakramen &amp; Layanan Duka Cita</h5>
            <p className="text-slate-700 text-[11px] mt-0.5">
              Mencatat administrasi Baptisan Kudus Anak/Dewasa, Katekisasi Sidi, dan Pemberkatan Nikah. Tersedia pula pencatatan warga meninggal dunia beserta penerbitan Surat Keterangan Kematian resmi berkop Majelis Jemaat GKE.
            </p>
          </div>
        </div>
      </div>

      {/* BAB IV */}
      <div className="space-y-3 pt-2">
        <div className="bg-slate-800 text-white px-3 py-1.5 rounded font-black text-xs uppercase tracking-wide">
          BAB IV. PANDUAN BENDAHARA &amp; PENGELOLAAN KAS JEMAAT
        </div>
        <div className="space-y-3 pl-2">
          <div>
            <h5 className="font-bold text-slate-900 text-xs">4.1 Pencatatan Transaksi Pemasukan &amp; Pengeluaran Kas</h5>
            <p className="text-slate-700 text-[11px] mt-0.5">
              Bendahara mencatat setiap aliran dana dengan rincian tanggal, kategori penerimaan/biaya, uraian keterangan, jumlah rupiah, dan nomor rekening/dompet kas. Saldo kas diperbarui seketika dan grafik visualisasi menyajikan tren neraca mingguan hingga tahunan.
            </p>
          </div>

          <div>
            <h5 className="font-bold text-slate-900 text-xs">4.2 Pemisahan Pos Kas &amp; Pengaturan Saldo Awal</h5>
            <p className="text-slate-700 text-[11px] mt-0.5">
              Mendukung pemisahan pos kas independen: <em>Kas Umum</em>, <em>Kas Pembangunan</em>, <em>Kas Diakonia</em>, dan <em>Kas Seksi Kategorial</em>. Bendahara dapat menentukan Saldo Awal per Pos Kas pada awal tahun buku untuk menjamin keakuratan laporan kumulatif.
            </p>
          </div>

          <div>
            <h5 className="font-bold text-slate-900 text-xs">4.3 Matriks Iuran Kewajiban Bulanan Warga Jemaat (Jan - Des)</h5>
            <p className="text-slate-700 text-[11px] mt-0.5">
              Menampilkan matriks kepatuhan iuran 12 bulan per Kepala Keluarga dengan penanda warna hijau (lunas) dan abu-abu (belum). Bendahara dapat mencetak Kwitansi Tanda Terima Iuran Resmi per warga atau per sektor lingkungan.
            </p>
          </div>

          <div>
            <h5 className="font-bold text-slate-900 text-xs">4.4 Verifikasi Resi Persembahan Digital (Live Kas Integration)</h5>
            <p className="text-slate-700 text-[11px] mt-0.5">
              Ketika warga mengirimkan konfirmasi persembahan digital, notifikasi muncul di tombol <strong>Notifikasi Resi</strong>. Bendahara cukup menekan tombol <em>Setujui</em> untuk memvalidasi resi dan otomatis menambahkan nominal ke Buku Kas Jemaat tanpa perlu input ulang manual.
            </p>
          </div>

          <div>
            <h5 className="font-bold text-slate-900 text-xs">4.5 Cetak Rekapitulasi Kas Mingguan, Bulanan &amp; Tahunan</h5>
            <p className="text-slate-700 text-[11px] mt-0.5">
              Menghasilkan lembar laporan keuangan resmi berkop surat GKE, rincian per pos anggaran, saldo awal, mutasi kas, saldo akhir, serta kolom tanda tangan sah Ketua MPH dan Bendahara Jemaat yang siap dibagikan dalam format PDF maupun Microsoft Word (.doc).
            </p>
          </div>
        </div>
      </div>

      {/* BAB V */}
      <div className="space-y-3 pt-2">
        <div className="bg-slate-800 text-white px-3 py-1.5 rounded font-black text-xs uppercase tracking-wide">
          BAB V. ADMINISTRASI, PERSURATAN &amp; PENGELOLAAN ASET
        </div>
        <div className="space-y-3 pl-2">
          <div>
            <h5 className="font-bold text-slate-900 text-xs">5.1 Format Penomoran Surat Resmi Baku Kearsipan Sinode GKE</h5>
            <p className="text-slate-700 text-[11px] mt-0.5">
              Penomoran surat keluar mengikuti tata kelola baku GKE:
              <br /><code className="bg-slate-200 px-1 py-0.5 rounded font-mono text-[10px]">[Nomor Urut]/[Kode Klasifikasi]/MPH-JEMAAT/GKE/[Bulan Romawi]/[Tahun]</code>
              <br />Contoh: <code>042/B-1/MPH-JEMAAT/GKE/IV/2026</code>.
            </p>
          </div>

          <div>
            <h5 className="font-bold text-slate-900 text-xs">5.2 Agenda Surat Masuk, Surat Keluar &amp; Lembar Disposisi</h5>
            <p className="text-slate-700 text-[11px] mt-0.5">
              Merekam surat masuk dari Sinode, Resort, instansi pemerintah, atau jemaat lain, lengkap dengan tanggal terima, perihal, pengirim, berkas digital scan, serta instruksi disposisi dari Ketua Majelis Jemaat kepada seksi terkait.
            </p>
          </div>

          <div>
            <h5 className="font-bold text-slate-900 text-xs">5.3 Inventarisasi Aset Properti &amp; Jadwal Pemeliharaan Alat</h5>
            <p className="text-slate-700 text-[11px] mt-0.5">
              Mencatat seluruh inventaris gedung, tanah, alat musik, sound system, bejana sakramen, dan kendaraan operasional jemaat beserta taksiran nilai aset dan kondisi fisik (Baik, Rusak Ringan, Rusak Berat). Sistem menyediakan pengingat servis AC, genset, dan instrumen secara berkala melalui pesan WhatsApp ke nomor teknisi.
            </p>
          </div>
        </div>
      </div>

      {/* BAB VI */}
      <div className="space-y-3 pt-2">
        <div className="bg-slate-800 text-white px-3 py-1.5 rounded font-black text-xs uppercase tracking-wide">
          BAB VI. PANITIA PEMBANGUNAN, SEKSI KATEGORIAL &amp; E-VOTING
        </div>
        <div className="space-y-3 pl-2">
          <div>
            <h5 className="font-bold text-slate-900 text-xs">6.1 Rencana Anggaran Biaya (RAB) &amp; Progres Fisik Pembangunan</h5>
            <p className="text-slate-700 text-[11px] mt-0.5">
              Mengakomodasi data panitia pembangunan gedung gereja atau pastori, rincian anggaran material/tenaga kerja, realisasi kas keluar, dan persentase capaian fisik proyek untuk pertanggungjawaban di hadapan Sidang Jemaat.
            </p>
          </div>

          <div>
            <h5 className="font-bold text-slate-900 text-xs">6.2 Sistem E-Voting Pemilihan Calon Penatua &amp; Diakon</h5>
            <p className="text-slate-700 text-[11px] mt-0.5">
              Menyelenggarakan pemilihan majelis jemaat periode baru secara elektronik yang transparan:
              <br />• Input daftar calon penatua dan calon diakon per lingkungan/sektor.
              <br />• Perhitungan suara otomatis (Real-Time Quick Count) dengan diagram persentase.
              <br />• Cetak Berita Acara Rapat Pemilihan Majelis Jemaat resmi berkop GKE.
            </p>
          </div>
        </div>
      </div>

      {/* BAB VII */}
      <div className="space-y-3 pt-2">
        <div className="bg-slate-800 text-white px-3 py-1.5 rounded font-black text-xs uppercase tracking-wide">
          BAB VII. ADMINISTRATOR SISTEM, IT &amp; BACKUP DATA
        </div>
        <div className="space-y-3 pl-2">
          <div>
            <h5 className="font-bold text-slate-900 text-xs">7.1 Pengaturan Identitas Jemaat &amp; Penandatangan MPH</h5>
            <p className="text-slate-700 text-[11px] mt-0.5">
              Menyetel nama jemaat resmi, resort, logo resolusi tinggi, nomor kontak, serta pejabat MPH yang bertanda tangan (Ketua, Sekretaris, Bendahara) lengkap dengan Nomor Induk Pegawai/Pendeta.
            </p>
          </div>

          <div>
            <h5 className="font-bold text-slate-900 text-xs">7.2 Pencadangan Mandiri (Backup JSON) &amp; Pemulihan Data</h5>
            <p className="text-slate-700 text-[11px] mt-0.5">
              Di halaman Pengaturan tersedia tombol <strong>Unduh Berkas Cadangan JSON</strong> untuk mengamankan seluruh basis data jemaat ke laptop administrator secara terenkripsi, serta fitur restore cadangan data sewaktu-waktu jika diperlukan.
            </p>
          </div>

          <div>
            <h5 className="font-bold text-slate-900 text-xs">7.3 Hak Akses Berjenjang &amp; Log Audit Keamanan</h5>
            <p className="text-slate-700 text-[11px] mt-0.5">
              Sistem membatasi hak akses berdasarkan peran: Admin (penuh), Bendahara (keuangan), Sekretaris (anggota &amp; persuratan), dan Warga (portal publik). Seluruh aktivitas perubahan data tercatat pada log audit keamanan untuk menjamin integritas data jemaat.
            </p>
          </div>
        </div>
      </div>

      {/* BAB VIII - FAQ */}
      <div className="space-y-3 pt-2">
        <div className="bg-slate-800 text-white px-3 py-1.5 rounded font-black text-xs uppercase tracking-wide">
          BAB VIII. TANYA JAWAB UMUM (FAQ) &amp; SOLUSI PERMASALAHAN TEKNIS
        </div>
        <div className="space-y-2.5 pl-2 text-[11px]">
          <div className="border-b border-slate-200 pb-2">
            <p className="font-bold text-slate-900">Q1: Bagaimana cara mencetak laporan jika gereja tidak memiliki printer fisik?</p>
            <p className="text-slate-700 mt-0.5">
              A: Pilih opsi cetak pada modul, lalu pada dialog print sistem ubah tujuan (Destination) menjadi "Simpan sebagai PDF" (Save as PDF). Berkas PDF dapat disimpan di laptop atau dikirim melalui WhatsApp untuk dicetak di tempat percetakan. Anda juga dapat menekan tombol "Simpan Word (.doc)" untuk mengedit naskah di Microsoft Word.
            </p>
          </div>

          <div className="border-b border-slate-200 pb-2">
            <p className="font-bold text-slate-900">Q2: Mengapa persembahan digital QRIS warga belum bertambah di saldo kas?</p>
            <p className="text-slate-700 mt-0.5">
              A: Transaksi QRIS dengan bukti transfer memerlukan verifikasi satu kali oleh Bendahara di menu "Notifikasi Resi" atau "Monitor Webhook &amp; Callback". Klik tombol "Setujui" agar dana langsung masuk ke Buku Kas Jemaat.
            </p>
          </div>

          <div className="border-b border-slate-200 pb-2">
            <p className="font-bold text-slate-900">Q3: Bagaimana cara menyetel ulang (reset) kata sandi jika pengguna lupa?</p>
            <p className="text-slate-700 mt-0.5">
              A: Akun administrator dapat membuka menu "Kelola Akun &amp; Hak Akses User", mencari nama pengguna, lalu menekan tombol "Ubah / Reset Password" untuk memberikan kata sandi baru.
            </p>
          </div>

          <div>
            <p className="font-bold text-slate-900">Q4: Apakah data jemaat tetap aman jika komputer gereja rusak atau hilang?</p>
            <p className="text-slate-700 mt-0.5">
              A: Seluruh data tersimpan aman secara terenkripsi di Google Cloud Firestore. Anda cukup membuka alamat tautan sistem di komputer baru dan masuk dengan akun majelis, seluruh arsip langsung kembali utuh.
            </p>
          </div>
        </div>
      </div>

      {/* Lembar Pengesahan Resmi */}
      <div className="pt-4 border-t border-slate-300">
        <div className="text-[11px] text-slate-600 mb-2">
          Demikian Buku Panduan &amp; Tutorial Penggunaan Sistem Informasi Gereja Kalimantan Evangelis (GKE) ini ditetapkan dan disahkan untuk menjadi acuan operasional seluruh jajaran majelis dan warga jemaat.
        </div>
        <SignatureBlock signers={['sekretaris', 'ketua']} />
      </div>
    </div>
  );
};
