// Dataset Judul Perikop Alkitab Terjemahan Baru (TB - LAI)
// Mendukung pencarian judul perikop berdasarkan referensi nats, kitab, pasal, dan ayat

export interface PerikopItem {
  kitab: string; // e.g. "Mat", "Luk", "Yoh", "Yes", "Mzm"
  pasal: number;
  ayatStart: number;
  ayatEnd: number;
  judul: string;
}

export const PERIKOP_DATABASE: PerikopItem[] = [
  // ==========================================
  // INJIL MATIUS
  // ==========================================
  { kitab: 'Mat', pasal: 1, ayatStart: 1, ayatEnd: 17, judul: 'Silsilah Yesus Kristus' },
  { kitab: 'Mat', pasal: 1, ayatStart: 18, ayatEnd: 25, judul: 'Kelahiran Yesus Kristus' },
  { kitab: 'Mat', pasal: 2, ayatStart: 1, ayatEnd: 12, judul: 'Orang-orang majus dari Timur' },
  { kitab: 'Mat', pasal: 2, ayatStart: 13, ayatEnd: 15, judul: 'Penyingkiran ke Mesir' },
  { kitab: 'Mat', pasal: 2, ayatStart: 16, ayatEnd: 18, judul: 'Pembunuhan anak-anak di Betlehem' },
  { kitab: 'Mat', pasal: 2, ayatStart: 19, ayatEnd: 23, judul: 'Kembali dari Mesir' },
  { kitab: 'Mat', pasal: 3, ayatStart: 1, ayatEnd: 12, judul: 'Yohanes Pembaptis' },
  { kitab: 'Mat', pasal: 3, ayatStart: 13, ayatEnd: 17, judul: 'Yesus dibaptis' },
  { kitab: 'Mat', pasal: 4, ayatStart: 1, ayatEnd: 11, judul: 'Pencobaan di padang gurun' },
  { kitab: 'Mat', pasal: 4, ayatStart: 12, ayatEnd: 17, judul: 'Yesus tampil di Galilea' },
  { kitab: 'Mat', pasal: 4, ayatStart: 18, ayatEnd: 22, judul: 'Yesus memanggil murid-murid yang pertama' },
  { kitab: 'Mat', pasal: 4, ayatStart: 23, ayatEnd: 25, judul: 'Yesus mengajar dan menyembuhkan banyak orang' },
  { kitab: 'Mat', pasal: 5, ayatStart: 1, ayatEnd: 12, judul: 'Khotbah di bukit: Ucapan bahagia' },
  { kitab: 'Mat', pasal: 5, ayatStart: 13, ayatEnd: 16, judul: 'Garam dan terang dunia' },
  { kitab: 'Mat', pasal: 5, ayatStart: 17, ayatEnd: 48, judul: 'Yesus dan hukum Taurat' },
  { kitab: 'Mat', pasal: 6, ayatStart: 1, ayatEnd: 4, judul: 'Hal memberi sedekah' },
  { kitab: 'Mat', pasal: 6, ayatStart: 5, ayatEnd: 15, judul: 'Hal berdoa & Doa Bapa Kami' },
  { kitab: 'Mat', pasal: 6, ayatStart: 16, ayatEnd: 18, judul: 'Hal berpuasa' },
  { kitab: 'Mat', pasal: 6, ayatStart: 19, ayatEnd: 24, judul: 'Harta di sorga' },
  { kitab: 'Mat', pasal: 6, ayatStart: 25, ayatEnd: 34, judul: 'Hal kekuatiran' },
  { kitab: 'Mat', pasal: 7, ayatStart: 1, ayatEnd: 5, judul: 'Hal menghakimi' },
  { kitab: 'Mat', pasal: 7, ayatStart: 7, ayatEnd: 11, judul: 'Hal mengabulkan doa' },
  { kitab: 'Mat', pasal: 7, ayatStart: 12, ayatEnd: 14, judul: 'Jalan yang benar' },
  { kitab: 'Mat', pasal: 7, ayatStart: 24, ayatEnd: 27, judul: 'Dua macam dasar' },
  { kitab: 'Mat', pasal: 8, ayatStart: 1, ayatEnd: 4, judul: 'Yesus menyembuhkan seorang yang sakit kusta' },
  { kitab: 'Mat', pasal: 8, ayatStart: 5, ayatEnd: 13, judul: 'Yesus menyembuhkan hamba seorang perwira' },
  { kitab: 'Mat', pasal: 8, ayatStart: 23, ayatEnd: 27, judul: 'Angin ribut diredakan' },
  { kitab: 'Mat', pasal: 9, ayatStart: 1, ayatEnd: 8, judul: 'Yesus menyembuhkan orang lumpuh' },
  { kitab: 'Mat', pasal: 9, ayatStart: 9, ayatEnd: 13, judul: 'Matius pemungut cukai mengikut Yesus' },
  { kitab: 'Mat', pasal: 9, ayatStart: 35, ayatEnd: 38, judul: 'Belas kasihan Yesus terhadap orang banyak' },
  { kitab: 'Mat', pasal: 10, ayatStart: 1, ayatEnd: 15, judul: 'Yesus memanggil dan mengutus kedua belas rasul' },
  { kitab: 'Mat', pasal: 11, ayatStart: 25, ayatEnd: 30, judul: 'Ajakan Juruselamat: Marilah kepada-Ku' },
  { kitab: 'Mat', pasal: 12, ayatStart: 1, ayatEnd: 8, judul: 'Murid-murid memetik gandum pada hari Sabat' },
  { kitab: 'Mat', pasal: 13, ayatStart: 1, ayatEnd: 23, judul: 'Perumpamaan tentang seorang penabur' },
  { kitab: 'Mat', pasal: 13, ayatStart: 24, ayatEnd: 30, judul: 'Perumpamaan tentang lalang di antara gandum' },
  { kitab: 'Mat', pasal: 13, ayatStart: 31, ayatEnd: 35, judul: 'Perumpamaan tentang biji sesawi dan ragi' },
  { kitab: 'Mat', pasal: 13, ayatStart: 44, ayatEnd: 46, judul: 'Perumpamaan tentang harta terpendam dan mutiara' },
  { kitab: 'Mat', pasal: 14, ayatStart: 13, ayatEnd: 21, judul: 'Yesus memberi makan lima ribu orang' },
  { kitab: 'Mat', pasal: 14, ayatStart: 22, ayatEnd: 33, judul: 'Yesus berjalan di atas air' },
  { kitab: 'Mat', pasal: 16, ayatStart: 13, ayatEnd: 20, judul: 'Pengakuan Petrus' },
  { kitab: 'Mat', pasal: 16, ayatStart: 21, ayatEnd: 28, judul: 'Pemberitahuan pertama tentang penderitaan Yesus' },
  { kitab: 'Mat', pasal: 17, ayatStart: 1, ayatEnd: 13, judul: 'Yesus dimuliakan di atas gunung' },
  { kitab: 'Mat', pasal: 18, ayatStart: 1, ayatEnd: 5, judul: 'Siapa yang terbesar dalam Kerajaan Sorga' },
  { kitab: 'Mat', pasal: 18, ayatStart: 6, ayatEnd: 11, judul: 'Siapa yang menyesatkan orang' },
  { kitab: 'Mat', pasal: 18, ayatStart: 12, ayatEnd: 14, judul: 'Perumpamaan tentang domba yang hilang' },
  { kitab: 'Mat', pasal: 18, ayatStart: 15, ayatEnd: 20, judul: 'Tentang menasihati sesaudara' },
  { kitab: 'Mat', pasal: 18, ayatStart: 21, ayatEnd: 35, judul: 'Perumpamaan tentang pengampunan' },
  { kitab: 'Mat', pasal: 19, ayatStart: 13, ayatEnd: 15, judul: 'Yesus memberkati anak-anak' },
  { kitab: 'Mat', pasal: 19, ayatStart: 16, ayatEnd: 26, judul: 'Orang muda yang kaya' },
  { kitab: 'Mat', pasal: 20, ayatStart: 1, ayatEnd: 16, judul: 'Perumpamaan tentang orang-orang upahan di kebun anggur' },
  { kitab: 'Mat', pasal: 20, ayatStart: 20, ayatEnd: 28, judul: 'Bukan memerintah melainkan melayani' },
  { kitab: 'Mat', pasal: 21, ayatStart: 1, ayatEnd: 11, judul: 'Yesus dielu-elukan di Yerusalem' },
  { kitab: 'Mat', pasal: 21, ayatStart: 12, ayatEnd: 17, judul: 'Yesus menyucikan Bait Allah' },
  { kitab: 'Mat', pasal: 21, ayatStart: 18, ayatEnd: 22, judul: 'Yesus mengutuk pohon ara' },
  { kitab: 'Mat', pasal: 21, ayatStart: 23, ayatEnd: 27, judul: 'Pertanyaan mengenai kuasa Yesus' },
  { kitab: 'Mat', pasal: 21, ayatStart: 28, ayatEnd: 32, judul: 'Perumpamaan tentang dua orang anak' },
  { kitab: 'Mat', pasal: 21, ayatStart: 33, ayatEnd: 46, judul: 'Perumpamaan tentang penggarap-penggarap kebun anggur' },
  { kitab: 'Mat', pasal: 22, ayatStart: 1, ayatEnd: 14, judul: 'Perumpamaan tentang perjamuan kawin' },
  { kitab: 'Mat', pasal: 22, ayatStart: 15, ayatEnd: 22, judul: 'Tentang membayar pajak kepada Kaisar' },
  { kitab: 'Mat', pasal: 22, ayatStart: 34, ayatEnd: 40, judul: 'Hukum yang terutama' },
  { kitab: 'Mat', pasal: 24, ayatStart: 1, ayatEnd: 35, judul: 'Tanda-tanda kesudahan zaman' },
  { kitab: 'Mat', pasal: 25, ayatStart: 1, ayatEnd: 13, judul: 'Gadis-gadis yang bijaksana dan gadis-gadis yang bodoh' },
  { kitab: 'Mat', pasal: 25, ayatStart: 14, ayatEnd: 30, judul: 'Perumpamaan tentang talenta' },
  { kitab: 'Mat', pasal: 25, ayatStart: 31, ayatEnd: 46, judul: 'Penghakiman terakhir' },
  { kitab: 'Mat', pasal: 26, ayatStart: 17, ayatEnd: 25, judul: 'Yesus makan Paskah dengan murid-murid-Nya' },
  { kitab: 'Mat', pasal: 26, ayatStart: 26, ayatEnd: 30, judul: 'Penetapan Perjamuan Malam' },
  { kitab: 'Mat', pasal: 26, ayatStart: 36, ayatEnd: 46, judul: 'Di taman Getsemani' },
  { kitab: 'Mat', pasal: 27, ayatStart: 32, ayatEnd: 44, judul: 'Yesus disalibkan' },
  { kitab: 'Mat', pasal: 27, ayatStart: 45, ayatEnd: 56, judul: 'Yesus mati' },
  { kitab: 'Mat', pasal: 27, ayatStart: 57, ayatEnd: 61, judul: 'Yesus dikuburkan' },
  { kitab: 'Mat', pasal: 28, ayatStart: 1, ayatEnd: 10, judul: 'Kebangkitan Yesus' },
  { kitab: 'Mat', pasal: 28, ayatStart: 16, ayatEnd: 20, judul: 'Amanat Agung' },

  // ==========================================
  // INJIL MARKUS
  // ==========================================
  { kitab: 'Mrk', pasal: 1, ayatStart: 1, ayatEnd: 8, judul: 'Yohanes Pembaptis' },
  { kitab: 'Mrk', pasal: 1, ayatStart: 9, ayatEnd: 11, judul: 'Yesus dibaptis' },
  { kitab: 'Mrk', pasal: 1, ayatStart: 12, ayatEnd: 13, judul: 'Pencobaan di padang gurun' },
  { kitab: 'Mrk', pasal: 1, ayatStart: 14, ayatEnd: 20, judul: 'Yesus memanggil murid-murid pertama' },
  { kitab: 'Mrk', pasal: 2, ayatStart: 1, ayatEnd: 12, judul: 'Orang lumpuh disembuhkan' },
  { kitab: 'Mrk', pasal: 4, ayatStart: 1, ayatEnd: 20, judul: 'Perumpamaan tentang penabur' },
  { kitab: 'Mrk', pasal: 4, ayatStart: 35, ayatEnd: 41, judul: 'Angin ribut diredakan' },
  { kitab: 'Mrk', pasal: 5, ayatStart: 21, ayatEnd: 43, judul: 'Yesus membangkitkan anak Yairus' },
  { kitab: 'Mrk', pasal: 6, ayatStart: 30, ayatEnd: 44, judul: 'Yesus memberi makan lima ribu orang' },
  { kitab: 'Mrk', pasal: 8, ayatStart: 27, ayatEnd: 30, judul: 'Pengakuan Petrus' },
  { kitab: 'Mrk', pasal: 9, ayatStart: 2, ayatEnd: 13, judul: 'Yesus dimuliakan di atas gunung' },
  { kitab: 'Mrk', pasal: 10, ayatStart: 13, ayatEnd: 16, judul: 'Yesus memberkati anak-anak' },
  { kitab: 'Mrk', pasal: 10, ayatStart: 46, ayatEnd: 52, judul: 'Bartimeus disembuhkan' },
  { kitab: 'Mrk', pasal: 11, ayatStart: 1, ayatEnd: 11, judul: 'Yesus dielu-elukan di Yerusalem' },
  { kitab: 'Mrk', pasal: 11, ayatStart: 12, ayatEnd: 14, judul: 'Yesus mengutuk pohon ara' },
  { kitab: 'Mrk', pasal: 11, ayatStart: 15, ayatEnd: 19, judul: 'Yesus menyucikan Bait Allah' },
  { kitab: 'Mrk', pasal: 11, ayatStart: 20, ayatEnd: 26, judul: 'Pohon ara yang sudah kering: Nasihat tentang doa' },
  { kitab: 'Mrk', pasal: 12, ayatStart: 28, ayatEnd: 34, judul: 'Hukum yang terutama' },
  { kitab: 'Mrk', pasal: 12, ayatStart: 41, ayatEnd: 44, judul: 'Persembahan seorang janda miskin' },
  { kitab: 'Mrk', pasal: 14, ayatStart: 12, ayatEnd: 25, judul: 'Perjamuan Malam' },
  { kitab: 'Mrk', pasal: 15, ayatStart: 21, ayatEnd: 32, judul: 'Yesus disalibkan' },
  { kitab: 'Mrk', pasal: 15, ayatStart: 33, ayatEnd: 41, judul: 'Yesus mati' },
  { kitab: 'Mrk', pasal: 15, ayatStart: 42, ayatEnd: 47, judul: 'Yesus dikuburkan' },
  { kitab: 'Mrk', pasal: 16, ayatStart: 1, ayatEnd: 8, judul: 'Kebangkitan Yesus' },
  { kitab: 'Mrk', pasal: 16, ayatStart: 9, ayatEnd: 20, judul: 'Yesus terangkat ke sorga' },

  // ==========================================
  // INJIL LUKAS
  // ==========================================
  { kitab: 'Luk', pasal: 1, ayatStart: 5, ayatEnd: 25, judul: 'Pemberitahuan tentang kelahiran Yohanes Pembaptis' },
  { kitab: 'Luk', pasal: 1, ayatStart: 26, ayatEnd: 38, judul: 'Pemberitahuan tentang kelahiran Yesus' },
  { kitab: 'Luk', pasal: 1, ayatStart: 39, ayatEnd: 56, judul: 'Maria dan Elisabet: Nyanyian Maria' },
  { kitab: 'Luk', pasal: 2, ayatStart: 1, ayatEnd: 7, judul: 'Kelahiran Yesus' },
  { kitab: 'Luk', pasal: 2, ayatStart: 8, ayatEnd: 20, judul: 'Gembala-gembala di padang' },
  { kitab: 'Luk', pasal: 2, ayatStart: 21, ayatEnd: 40, judul: 'Yesus diserahkan di Bait Allah' },
  { kitab: 'Luk', pasal: 2, ayatStart: 41, ayatEnd: 52, judul: 'Yesus pada umur dua belas tahun dalam Bait Allah' },
  { kitab: 'Luk', pasal: 3, ayatStart: 21, ayatEnd: 22, judul: 'Yesus dibaptis' },
  { kitab: 'Luk', pasal: 4, ayatStart: 1, ayatEnd: 13, judul: 'Pencobaan di padang gurun' },
  { kitab: 'Luk', pasal: 4, ayatStart: 14, ayatEnd: 30, judul: 'Yesus ditolak di Nazaret' },
  { kitab: 'Luk', pasal: 5, ayatStart: 1, ayatEnd: 11, judul: 'Penjala manusia' },
  { kitab: 'Luk', pasal: 6, ayatStart: 20, ayatEnd: 26, judul: 'Ucapan bahagia dan peringatan' },
  { kitab: 'Luk', pasal: 6, ayatStart: 27, ayatEnd: 36, judul: 'Kasihilah musuhmu' },
  { kitab: 'Luk', pasal: 7, ayatStart: 11, ayatEnd: 17, judul: 'Yesus membangkitkan anak muda di Nain' },
  { kitab: 'Luk', pasal: 8, ayatStart: 22, ayatEnd: 25, judul: 'Angin ribut diredakan' },
  { kitab: 'Luk', pasal: 9, ayatStart: 28, ayatEnd: 36, judul: 'Yesus dimuliakan di atas gunung' },
  { kitab: 'Luk', pasal: 10, ayatStart: 25, ayatEnd: 37, judul: 'Orang Samaria yang murah hati' },
  { kitab: 'Luk', pasal: 10, ayatStart: 38, ayatEnd: 42, judul: 'Maria dan Marta' },
  { kitab: 'Luk', pasal: 11, ayatStart: 1, ayatEnd: 13, judul: 'Hal berdoa' },
  { kitab: 'Luk', pasal: 12, ayatStart: 13, ayatEnd: 21, judul: 'Orang kaya yang bodoh' },
  { kitab: 'Luk', pasal: 12, ayatStart: 22, ayatEnd: 34, judul: 'Hal kekuatiran' },
  { kitab: 'Luk', pasal: 13, ayatStart: 6, ayatEnd: 9, judul: 'Perumpamaan tentang pohon ara yang tidak berbuah' },
  { kitab: 'Luk', pasal: 14, ayatStart: 15, ayatEnd: 24, judul: 'Perumpamaan tentang orang-orang yang berdalih' },
  { kitab: 'Luk', pasal: 15, ayatStart: 1, ayatEnd: 7, judul: 'Perumpamaan tentang domba yang hilang' },
  { kitab: 'Luk', pasal: 15, ayatStart: 8, ayatEnd: 10, judul: 'Perumpamaan tentang dirham yang hilang' },
  { kitab: 'Luk', pasal: 15, ayatStart: 11, ayatEnd: 32, judul: 'Perumpamaan tentang anak yang hilang' },
  { kitab: 'Luk', pasal: 16, ayatStart: 19, ayatEnd: 31, judul: 'Orang kaya dan Lazarus yang miskin' },
  { kitab: 'Luk', pasal: 17, ayatStart: 11, ayatEnd: 19, judul: 'Sepuluh orang kusta' },
  { kitab: 'Luk', pasal: 18, ayatStart: 1, ayatEnd: 8, judul: 'Perumpamaan tentang hakim yang tak benar' },
  { kitab: 'Luk', pasal: 18, ayatStart: 9, ayatEnd: 14, judul: 'Perumpamaan tentang orang Farisi dan pemungut cukai' },
  { kitab: 'Luk', pasal: 18, ayatStart: 15, ayatEnd: 17, judul: 'Yesus memberkati anak-anak' },
  { kitab: 'Luk', pasal: 19, ayatStart: 1, ayatEnd: 10, judul: 'Zakheus' },
  { kitab: 'Luk', pasal: 19, ayatStart: 28, ayatEnd: 40, judul: 'Yesus dielu-elukan di Yerusalem' },
  { kitab: 'Luk', pasal: 22, ayatStart: 14, ayatEnd: 23, judul: 'Penetapan Perjamuan Malam' },
  { kitab: 'Luk', pasal: 22, ayatStart: 39, ayatEnd: 46, judul: 'Di bukit Zaitun' },
  { kitab: 'Luk', pasal: 23, ayatStart: 1, ayatEnd: 12, judul: 'Yesus di hadapan Pilatus dan Herodes' },
  { kitab: 'Luk', pasal: 23, ayatStart: 13, ayatEnd: 25, judul: 'Yesus dijatuhi hukuman mati' },
  { kitab: 'Luk', pasal: 23, ayatStart: 26, ayatEnd: 32, judul: 'Yesus dibawa untuk disalibkan' },
  { kitab: 'Luk', pasal: 23, ayatStart: 33, ayatEnd: 43, judul: 'Yesus disalibkan' },
  { kitab: 'Luk', pasal: 23, ayatStart: 44, ayatEnd: 49, judul: 'Yesus mati' },
  { kitab: 'Luk', pasal: 23, ayatStart: 50, ayatEnd: 56, judul: 'Yesus dikuburkan' },
  { kitab: 'Luk', pasal: 24, ayatStart: 1, ayatEnd: 12, judul: 'Kebangkitan Yesus' },
  { kitab: 'Luk', pasal: 24, ayatStart: 13, ayatEnd: 35, judul: 'Menuju ke Emaus' },
  { kitab: 'Luk', pasal: 24, ayatStart: 36, ayatEnd: 49, judul: 'Yesus menampakkan diri kepada semua murid' },
  { kitab: 'Luk', pasal: 24, ayatStart: 50, ayatEnd: 53, judul: 'Kenaikan Yesus' },

  // ==========================================
  // ==========================================
  // INJIL YOHANES (LENGKAP SESUAI LAI TERJEMAHAN BARU)
  // ==========================================
  { kitab: 'Yoh', pasal: 1, ayatStart: 1, ayatEnd: 18, judul: 'Firman yang telah menjadi manusia' },
  { kitab: 'Yoh', pasal: 1, ayatStart: 19, ayatEnd: 28, judul: 'Kesaksian Yohanes tentang dirinya sendiri' },
  { kitab: 'Yoh', pasal: 1, ayatStart: 29, ayatEnd: 34, judul: 'Lihatlah Anak domba Allah' },
  { kitab: 'Yoh', pasal: 1, ayatStart: 35, ayatEnd: 42, judul: 'Murid-murid Yesus yang pertama' },
  { kitab: 'Yoh', pasal: 1, ayatStart: 43, ayatEnd: 51, judul: 'Yesus memanggil Filipus dan Natanael' },
  { kitab: 'Yoh', pasal: 2, ayatStart: 1, ayatEnd: 11, judul: 'Perkawinan di Kana' },
  { kitab: 'Yoh', pasal: 2, ayatStart: 12, ayatEnd: 12, judul: 'Yesus di Kapernaum' },
  { kitab: 'Yoh', pasal: 2, ayatStart: 13, ayatEnd: 25, judul: 'Yesus menyucikan Bait Allah' },
  { kitab: 'Yoh', pasal: 3, ayatStart: 1, ayatEnd: 21, judul: 'Percakapan dengan Nikodemus' },
  { kitab: 'Yoh', pasal: 3, ayatStart: 22, ayatEnd: 36, judul: 'Kesaksian Yohanes sekali lagi tentang Yesus' },
  { kitab: 'Yoh', pasal: 4, ayatStart: 1, ayatEnd: 42, judul: 'Percakapan dengan perempuan Samaria' },
  { kitab: 'Yoh', pasal: 4, ayatStart: 43, ayatEnd: 45, judul: 'Kembali ke Galilea' },
  { kitab: 'Yoh', pasal: 4, ayatStart: 46, ayatEnd: 54, judul: 'Yesus menyembuhkan anak pegawai istana' },
  { kitab: 'Yoh', pasal: 5, ayatStart: 1, ayatEnd: 18, judul: 'Penyembuhan pada hari Sabat di Betesda' },
  { kitab: 'Yoh', pasal: 5, ayatStart: 19, ayatEnd: 47, judul: 'Kesaksian Yesus tentang diri-Nya' },
  { kitab: 'Yoh', pasal: 6, ayatStart: 1, ayatEnd: 15, judul: 'Yesus memberi makan lima ribu orang' },
  { kitab: 'Yoh', pasal: 6, ayatStart: 16, ayatEnd: 21, judul: 'Yesus berjalan di atas air' },
  { kitab: 'Yoh', pasal: 6, ayatStart: 22, ayatEnd: 59, judul: 'Roti hidup' },
  { kitab: 'Yoh', pasal: 6, ayatStart: 60, ayatEnd: 71, judul: 'Pengakuan Petrus' },
  { kitab: 'Yoh', pasal: 7, ayatStart: 1, ayatEnd: 13, judul: 'Yesus pergi ke Yerusalem pada hari raya Pondok Daun' },
  { kitab: 'Yoh', pasal: 7, ayatStart: 14, ayatEnd: 36, judul: 'Kesaksian Yesus tentang diri-Nya di Bait Allah' },
  { kitab: 'Yoh', pasal: 7, ayatStart: 37, ayatEnd: 53, judul: 'Air hidup' },
  { kitab: 'Yoh', pasal: 8, ayatStart: 1, ayatEnd: 11, judul: 'Perempuan yang berzina' },
  { kitab: 'Yoh', pasal: 8, ayatStart: 12, ayatEnd: 20, judul: 'Yesus adalah terang dunia' },
  { kitab: 'Yoh', pasal: 8, ayatStart: 21, ayatEnd: 29, judul: 'Peringatan kepada orang-orang Yahudi' },
  { kitab: 'Yoh', pasal: 8, ayatStart: 30, ayatEnd: 59, judul: 'Keturunan Abraham yang benar' },
  { kitab: 'Yoh', pasal: 9, ayatStart: 1, ayatEnd: 41, judul: 'Orang yang buta sejak lahir disembuhkan' },
  { kitab: 'Yoh', pasal: 10, ayatStart: 1, ayatEnd: 21, judul: 'Gembala yang baik' },
  { kitab: 'Yoh', pasal: 10, ayatStart: 22, ayatEnd: 42, judul: 'Hari raya Pentahbisan Bait Allah' },
  { kitab: 'Yoh', pasal: 11, ayatStart: 1, ayatEnd: 44, judul: 'Lazarus dibangkitkan' },
  { kitab: 'Yoh', pasal: 11, ayatStart: 45, ayatEnd: 57, judul: 'Persepakatan untuk membunuh Yesus' },
  { kitab: 'Yoh', pasal: 12, ayatStart: 1, ayatEnd: 8, judul: 'Yesus diurapi di Betania' },
  { kitab: 'Yoh', pasal: 12, ayatStart: 9, ayatEnd: 11, judul: 'Persepakatan untuk membunuh Lazarus' },
  { kitab: 'Yoh', pasal: 12, ayatStart: 12, ayatEnd: 19, judul: 'Yesus dielu-elukan di Yerusalem' },
  { kitab: 'Yoh', pasal: 12, ayatStart: 20, ayatEnd: 36, judul: 'Yesus memberitakan kematian-Nya' },
  { kitab: 'Yoh', pasal: 12, ayatStart: 37, ayatEnd: 50, judul: 'Akibat ketidakpercayaan orang Yahudi' },
  { kitab: 'Yoh', pasal: 13, ayatStart: 1, ayatEnd: 20, judul: 'Yesus membasuh kaki murid-murid-Nya' },
  { kitab: 'Yoh', pasal: 13, ayatStart: 21, ayatEnd: 30, judul: 'Yesus memperingatkan murid-murid bahwa Ia akan dikhianati' },
  { kitab: 'Yoh', pasal: 13, ayatStart: 31, ayatEnd: 35, judul: 'Perintah baru: Saling mengasihi' },
  { kitab: 'Yoh', pasal: 13, ayatStart: 36, ayatEnd: 38, judul: 'Yesus memberitahukan penyangkalan Petrus' },
  { kitab: 'Yoh', pasal: 14, ayatStart: 1, ayatEnd: 14, judul: 'Rumah Bapa: Jalan, Kebenaran, dan Hidup' },
  { kitab: 'Yoh', pasal: 14, ayatStart: 15, ayatEnd: 31, judul: 'Janji tentang Penghibur (Roh Kudus)' },
  { kitab: 'Yoh', pasal: 15, ayatStart: 1, ayatEnd: 8, judul: 'Pokok anggur yang benar' },
  { kitab: 'Yoh', pasal: 15, ayatStart: 9, ayatEnd: 17, judul: 'Perintah untuk saling mengasihi' },
  { kitab: 'Yoh', pasal: 15, ayatStart: 18, ayatEnd: 27, judul: 'Dunia membenci Yesus dan murid-murid-Nya' },
  { kitab: 'Yoh', pasal: 16, ayatStart: 1, ayatEnd: 4, judul: 'Pemberitahuan tentang penganiayaan' },
  { kitab: 'Yoh', pasal: 16, ayatStart: 5, ayatEnd: 15, judul: 'Pekerjaan Roh Kudus' },
  { kitab: 'Yoh', pasal: 16, ayatStart: 16, ayatEnd: 33, judul: 'Dukacita yang mendahului sukacita' },
  { kitab: 'Yoh', pasal: 17, ayatStart: 1, ayatEnd: 26, judul: 'Doa Yesus untuk murid-murid-Nya' },
  { kitab: 'Yoh', pasal: 18, ayatStart: 1, ayatEnd: 11, judul: 'Yesus ditangkap' },
  { kitab: 'Yoh', pasal: 18, ayatStart: 12, ayatEnd: 14, judul: 'Yesus di hadapan Hanas' },
  { kitab: 'Yoh', pasal: 18, ayatStart: 15, ayatEnd: 18, judul: 'Petrus menyangkal Yesus' },
  { kitab: 'Yoh', pasal: 18, ayatStart: 19, ayatEnd: 24, judul: 'Imam Besar menanyai Yesus' },
  { kitab: 'Yoh', pasal: 18, ayatStart: 25, ayatEnd: 27, judul: 'Petrus menyangkal Yesus lagi' },
  { kitab: 'Yoh', pasal: 18, ayatStart: 28, ayatEnd: 38, judul: 'Yesus di hadapan Pilatus' },
  { kitab: 'Yoh', pasal: 18, ayatStart: 39, ayatEnd: 40, judul: 'Yesus atau Barabas' },
  { kitab: 'Yoh', pasal: 19, ayatStart: 1, ayatEnd: 16, judul: 'Yesus dihukum mati' },
  { kitab: 'Yoh', pasal: 19, ayatStart: 17, ayatEnd: 27, judul: 'Yesus disalibkan' },
  { kitab: 'Yoh', pasal: 19, ayatStart: 28, ayatEnd: 30, judul: 'Yesus mati: Sudah selesai' },
  { kitab: 'Yoh', pasal: 19, ayatStart: 31, ayatEnd: 37, judul: 'Lambung Yesus ditikam' },
  { kitab: 'Yoh', pasal: 19, ayatStart: 38, ayatEnd: 42, judul: 'Yesus dikuburkan' },
  { kitab: 'Yoh', pasal: 20, ayatStart: 1, ayatEnd: 10, judul: 'Kebangkitan Yesus: Kubur yang kosong' },
  { kitab: 'Yoh', pasal: 20, ayatStart: 11, ayatEnd: 18, judul: 'Yesus menampakkan diri kepada Maria Magdalena' },
  { kitab: 'Yoh', pasal: 20, ayatStart: 19, ayatEnd: 23, judul: 'Yesus menampakkan diri kepada murid-murid-Nya' },
  { kitab: 'Yoh', pasal: 20, ayatStart: 24, ayatEnd: 29, judul: 'Yesus dan Tomas' },
  { kitab: 'Yoh', pasal: 20, ayatStart: 30, ayatEnd: 31, judul: 'Maksud kitab ini ditulis' },
  { kitab: 'Yoh', pasal: 21, ayatStart: 1, ayatEnd: 14, judul: 'Yesus menampakkan diri di pantai danau Tiberias' },
  { kitab: 'Yoh', pasal: 21, ayatStart: 15, ayatEnd: 19, judul: 'Gembalakanlah domba-domba-Ku' },
  { kitab: 'Yoh', pasal: 21, ayatStart: 20, ayatEnd: 25, judul: 'Murid yang dikasihi Yesus' },

  // ==========================================
  // SURAT-SURAT & KISAH PARA RASUL
  // ==========================================
  { kitab: 'Kis', pasal: 1, ayatStart: 6, ayatEnd: 11, judul: 'Yesus terangkat ke sorga' },
  { kitab: 'Kis', pasal: 2, ayatStart: 1, ayatEnd: 13, judul: 'Pentakosta: Pencurahan Roh Kudus' },
  { kitab: 'Kis', pasal: 2, ayatStart: 41, ayatEnd: 47, judul: 'Cara hidup jemaat yang pertama' },
  { kitab: 'Kis', pasal: 3, ayatStart: 1, ayatEnd: 10, judul: 'Petrus menyembuhkan orang lumpuh di Gerbang Indah' },
  { kitab: 'Kis', pasal: 4, ayatStart: 1, ayatEnd: 22, judul: 'Petrus dan Yohanes di hadapan Mahkamah Agama' },
  { kitab: 'Kis', pasal: 4, ayatStart: 23, ayatEnd: 31, judul: 'Doa jemaat' },
  { kitab: 'Kis', pasal: 4, ayatStart: 32, ayatEnd: 37, judul: 'Cara hidup jemaat: Bersekutu dan berbagi kepunyaan' },
  { kitab: 'Kis', pasal: 6, ayatStart: 1, ayatEnd: 7, judul: 'Tujuh orang dipilih untuk melayani orang miskin' },
  { kitab: 'Kis', pasal: 7, ayatStart: 54, ayatEnd: 60, judul: 'Stefanus mati syahid' },
  { kitab: 'Kis', pasal: 8, ayatStart: 26, ayatEnd: 40, judul: 'Filipus dan sida-sida dari tanah Etiopia' },
  { kitab: 'Kis', pasal: 9, ayatStart: 1, ayatEnd: 19, judul: 'Saulus bertobat di jalan ke Damsyik' },
  { kitab: 'Kis', pasal: 10, ayatStart: 1, ayatEnd: 48, judul: 'Petrus di rumah Kornelius' },
  { kitab: 'Kis', pasal: 16, ayatStart: 19, ayatEnd: 40, judul: 'Kepala penjara di Filipi bertobat' },
  { kitab: 'Rom', pasal: 1, ayatStart: 16, ayatEnd: 17, judul: 'Orang benar akan hidup oleh iman' },
  { kitab: 'Rom', pasal: 3, ayatStart: 21, ayatEnd: 31, judul: 'Manusia dibenarkan karena iman' },
  { kitab: 'Rom', pasal: 5, ayatStart: 1, ayatEnd: 11, judul: 'Hasil pembenaran: Damai dengan Allah' },
  { kitab: 'Rom', pasal: 6, ayatStart: 1, ayatEnd: 14, judul: 'Mati bagi dosa tetapi hidup bagi Allah' },
  { kitab: 'Rom', pasal: 8, ayatStart: 1, ayatEnd: 17, judul: 'Hidup oleh Roh' },
  { kitab: 'Rom', pasal: 8, ayatStart: 18, ayatEnd: 30, judul: 'Pengharapan anak-anak Allah' },
  { kitab: 'Rom', pasal: 8, ayatStart: 31, ayatEnd: 39, judul: 'Keyakinan iman: Kasih Kristus' },
  { kitab: 'Rom', pasal: 12, ayatStart: 1, ayatEnd: 2, judul: 'Persembahan yang benar' },
  { kitab: 'Rom', pasal: 12, ayatStart: 3, ayatEnd: 8, judul: 'Banyak anggota tetapi satu tubuh' },
  { kitab: 'Rom', pasal: 12, ayatStart: 9, ayatEnd: 21, judul: 'Nasihat untuk hidup dalam kasih' },
  { kitab: 'Rom', pasal: 13, ayatStart: 1, ayatEnd: 7, judul: 'Kepatuhan kepada pemerintah' },
  { kitab: '1Ko', pasal: 1, ayatStart: 18, ayatEnd: 25, judul: 'Hikmat Allah dan hikmat manusia' },
  { kitab: '1Ko', pasal: 11, ayatStart: 17, ayatEnd: 22, judul: 'Kebiasaan salah dalam Perjamuan Kudus' },
  { kitab: '1Ko', pasal: 11, ayatStart: 23, ayatEnd: 26, judul: 'Penetapan Perjamuan Malam' },
  { kitab: '1Ko', pasal: 11, ayatStart: 27, ayatEnd: 34, judul: 'Menguji diri dalam Perjamuan' },
  { kitab: '1Ko', pasal: 12, ayatStart: 1, ayatEnd: 11, judul: 'Rupa-rupa karunia tetapi satu Roh' },
  { kitab: '1Ko', pasal: 12, ayatStart: 12, ayatEnd: 31, judul: 'Satu tubuh banyak anggota' },
  { kitab: '1Ko', pasal: 13, ayatStart: 1, ayatEnd: 13, judul: 'Pujian tentang kasih' },
  { kitab: '1Ko', pasal: 15, ayatStart: 1, ayatEnd: 11, judul: 'Kebangkitan Kristus' },
  { kitab: '1Ko', pasal: 15, ayatStart: 12, ayatEnd: 34, judul: 'Kebangkitan kita' },
  { kitab: '1Ko', pasal: 15, ayatStart: 50, ayatEnd: 58, judul: 'Kebangkitan tubuh dan kemenangan' },
  { kitab: '2Ko', pasal: 5, ayatStart: 11, ayatEnd: 21, judul: 'Pelayanan pendamaian: Ciptaan baru' },
  { kitab: '2Ko', pasal: 9, ayatStart: 6, ayatEnd: 15, judul: 'Memberi dengan sukacita' },
  { kitab: 'Gal', pasal: 5, ayatStart: 16, ayatEnd: 26, judul: 'Hidup menurut daging atau Roh: Buah Roh' },
  { kitab: 'Gal', pasal: 6, ayatStart: 1, ayatEnd: 10, judul: 'Saling tolong-menolong menanggung beban' },
  { kitab: '1Ko', pasal: 15, ayatStart: 1, ayatEnd: 11, judul: 'Kebangkitan Kristus' },
  { kitab: '1Ko', pasal: 15, ayatStart: 12, ayatEnd: 34, judul: 'Kebangkitan orang mati' },
  { kitab: '1Ko', pasal: 15, ayatStart: 35, ayatEnd: 58, judul: 'Kebangkitan tubuh' },
  { kitab: '2Ko', pasal: 4, ayatStart: 7, ayatEnd: 18, judul: 'Harta dalam bejana tanah liat' },
  { kitab: '2Ko', pasal: 5, ayatStart: 11, ayatEnd: 21, judul: 'Pelayanan untuk pendamaian: Ciptaan baru' },
  { kitab: '2Ko', pasal: 8, ayatStart: 1, ayatEnd: 15, judul: 'Pelayanan kasih: Memberi dengan kerelaan' },
  { kitab: '2Ko', pasal: 9, ayatStart: 6, ayatEnd: 15, judul: 'Memberi dengan sukacita' },
  { kitab: 'Gal', pasal: 5, ayatStart: 16, ayatEnd: 26, judul: 'Hidup menurut Roh dan Buah Roh' },
  { kitab: 'Gal', pasal: 6, ayatStart: 1, ayatEnd: 10, judul: 'Saling bertolong-tolongan menanggung beban' },
  { kitab: 'Efe', pasal: 1, ayatStart: 3, ayatEnd: 14, judul: 'Kekayaan orang-orang yang terpilih' },
  { kitab: 'Efe', pasal: 2, ayatStart: 1, ayatEnd: 10, judul: 'Semuanya adalah kasih karunia' },
  { kitab: 'Efe', pasal: 4, ayatStart: 1, ayatEnd: 16, judul: 'Kesatuan jemaat dan karunia yang berbeda-beda' },
  { kitab: 'Efe', pasal: 5, ayatStart: 22, ayatEnd: 33, judul: 'Kasih Kristus adalah dasar hidup suami isteri' },
  { kitab: 'Efe', pasal: 6, ayatStart: 10, ayatEnd: 20, judul: 'Perlengkapan senjata Allah' },
  { kitab: 'Flp', pasal: 2, ayatStart: 1, ayatEnd: 11, judul: 'Nasihat untuk bersatu dan merendahkan diri' },
  { kitab: 'Flp', pasal: 4, ayatStart: 4, ayatEnd: 9, judul: 'Bersukacitalah senantiasa: Damai sejahtera Allah' },
  { kitab: 'Kol', pasal: 3, ayatStart: 5, ayatEnd: 11, judul: 'Manusia baru' },
  { kitab: 'Kol', pasal: 3, ayatStart: 12, ayatEnd: 17, judul: 'Kasih dan damai sejahtera Kristus' },
  { kitab: 'Kol', pasal: 3, ayatStart: 18, ayatEnd: 25, judul: 'Hubungan antara anggota-anggota keluarga' },
  { kitab: 'Kol', pasal: 4, ayatStart: 1, ayatEnd: 6, judul: 'Nasihat-nasihat penutup' },
  { kitab: '1Te', pasal: 4, ayatStart: 13, ayatEnd: 18, judul: 'Kedatangan Tuhan' },
  { kitab: '1Te', pasal: 5, ayatStart: 12, ayatEnd: 22, judul: 'Nasihat-nasihat hidup berjemaat' },
  { kitab: '2Ti', pasal: 3, ayatStart: 10, ayatEnd: 17, judul: 'Iman dan firman Allah yang diilhamkan' },
  { kitab: 'Ibr', pasal: 1, ayatStart: 1, ayatEnd: 4, judul: 'Allah berfirman dengan perantaraan Anak-Nya' },
  { kitab: 'Ibr', pasal: 4, ayatStart: 12, ayatEnd: 16, judul: 'Firman Allah yang hidup dan Imam Besar yang mengerti' },
  { kitab: 'Ibr', pasal: 11, ayatStart: 1, ayatEnd: 40, judul: 'Saksi-saksi iman' },
  { kitab: 'Ibr', pasal: 12, ayatStart: 1, ayatEnd: 11, judul: 'Nasihat supaya bertekun' },
  { kitab: 'Yak', pasal: 1, ayatStart: 2, ayatEnd: 8, judul: 'Iman dan hikmat' },
  { kitab: 'Yak', pasal: 1, ayatStart: 19, ayatEnd: 27, judul: 'Mendengar dan melakukan firman' },
  { kitab: 'Yak', pasal: 2, ayatStart: 14, ayatEnd: 26, judul: 'Iman tanpa perbuatan adalah mati' },
  { kitab: 'Yak', pasal: 3, ayatStart: 1, ayatEnd: 12, judul: 'Dosa karena lidah' },
  { kitab: '1Pt', pasal: 1, ayatStart: 3, ayatEnd: 12, judul: 'Pengharapan, iman dan kasih' },
  { kitab: '1Pt', pasal: 2, ayatStart: 1, ayatEnd: 10, judul: 'Batu yang hidup dan bangsa yang terpilih' },
  { kitab: '1Pt', pasal: 5, ayatStart: 1, ayatEnd: 11, judul: 'Gembalakanlah kawanan domba Allah' },
  { kitab: '1Yo', pasal: 1, ayatStart: 1, ayatEnd: 4, judul: 'Firman hidup' },
  { kitab: '1Yo', pasal: 1, ayatStart: 5, ayatEnd: 10, judul: 'Allah adalah terang' },
  { kitab: '1Yo', pasal: 3, ayatStart: 1, ayatEnd: 10, judul: 'Anak-anak Allah' },
  { kitab: '1Yo', pasal: 3, ayatStart: 11, ayatEnd: 24, judul: 'Kasih persaudaraan' },
  { kitab: '1Yo', pasal: 4, ayatStart: 7, ayatEnd: 21, judul: 'Allah adalah kasih' },
  { kitab: 'Why', pasal: 21, ayatStart: 1, ayatEnd: 8, judul: 'Langit yang baru dan bumi yang baru' },
  { kitab: 'Why', pasal: 22, ayatStart: 1, ayatEnd: 5, judul: 'Sungai air kehidupan' },

  // ==========================================
  // PERJANJIAN LAMA (PL) KOMPREHENSIF & ALMANAK GKE
  // ==========================================
  // Kejadian
  { kitab: 'Kej', pasal: 1, ayatStart: 1, ayatEnd: 31, judul: 'Penciptaan langit dan bumi serta isinya' },
  { kitab: 'Kej', pasal: 2, ayatStart: 1, ayatEnd: 7, judul: 'Hari ketujuh: Hari perhentian' },
  { kitab: 'Kej', pasal: 2, ayatStart: 8, ayatEnd: 25, judul: 'Manusia di taman Eden' },
  { kitab: 'Kej', pasal: 3, ayatStart: 1, ayatEnd: 24, judul: 'Manusia jatuh ke dalam dosa' },
  { kitab: 'Kej', pasal: 6, ayatStart: 9, ayatEnd: 22, judul: 'Riwayat Nuh dan bahtera' },
  { kitab: 'Kej', pasal: 9, ayatStart: 1, ayatEnd: 17, judul: 'Perjanjian Allah dengan Nuh' },
  { kitab: 'Kej', pasal: 11, ayatStart: 1, ayatEnd: 9, judul: 'Menara Babel' },
  { kitab: 'Kej', pasal: 12, ayatStart: 1, ayatEnd: 9, judul: 'Panggilan Abram' },
  { kitab: 'Kej', pasal: 15, ayatStart: 1, ayatEnd: 21, judul: 'Perjanjian Allah dengan Abram' },
  { kitab: 'Kej', pasal: 17, ayatStart: 1, ayatEnd: 14, judul: 'Tanda perjanjian sunat' },
  { kitab: 'Kej', pasal: 18, ayatStart: 1, ayatEnd: 15, judul: 'Janji tentang anak laki-laki bagi Abraham' },
  { kitab: 'Kej', pasal: 18, ayatStart: 16, ayatEnd: 33, judul: 'Doa syafaat Abraham untuk Sodom' },
  { kitab: 'Kej', pasal: 22, ayatStart: 1, ayatEnd: 19, judul: 'Kepercayaan Abraham diuji di Moria' },
  { kitab: 'Kej', pasal: 28, ayatStart: 10, ayatEnd: 22, judul: 'Mimpi Yakub di Betel' },
  { kitab: 'Kej', pasal: 32, ayatStart: 22, ayatEnd: 32, judul: 'Pergulatan Yakub di Pniel' },
  { kitab: 'Kej', pasal: 37, ayatStart: 1, ayatEnd: 36, judul: 'Yusuf dan saudara-saudaranya' },
  { kitab: 'Kej', pasal: 45, ayatStart: 1, ayatEnd: 28, judul: 'Yusuf memperkenalkan diri kepada saudara-saudaranya' },
  { kitab: 'Kej', pasal: 50, ayatStart: 15, ayatEnd: 26, judul: 'Yusuf menghiburkan saudara-saudaranya' },

  // Keluaran (Termasuk Kel 16:1-36 Manna & Burung Puyuh)
  { kitab: 'Kel', pasal: 1, ayatStart: 1, ayatEnd: 22, judul: 'Bangsa Israel ditindas di Mesir' },
  { kitab: 'Kel', pasal: 2, ayatStart: 1, ayatEnd: 10, judul: 'Musa lahir dan diselamatkan' },
  { kitab: 'Kel', pasal: 3, ayatStart: 1, ayatEnd: 22, judul: 'Musa diutus TUHAN (Semak Duri yang Menyala)' },
  { kitab: 'Kel', pasal: 4, ayatStart: 1, ayatEnd: 17, judul: 'Tanda-tanda mukjizat bagi Musa' },
  { kitab: 'Kel', pasal: 12, ayatStart: 1, ayatEnd: 28, judul: 'Ketetapan tentang Paskah pertama' },
  { kitab: 'Kel', pasal: 12, ayatStart: 29, ayatEnd: 42, judul: 'Keluarnya orang Israel dari Mesir' },
  { kitab: 'Kel', pasal: 13, ayatStart: 17, ayatEnd: 22, judul: 'Tiang awan dan tiang api' },
  { kitab: 'Kel', pasal: 14, ayatStart: 1, ayatEnd: 31, judul: 'Menyeberangi Laut Teberau' },
  { kitab: 'Kel', pasal: 15, ayatStart: 1, ayatEnd: 21, judul: 'Nyanyian Musa dan orang Israel' },
  { kitab: 'Kel', pasal: 16, ayatStart: 1, ayatEnd: 36, judul: 'Manna dan burung puyuh' },
  { kitab: 'Kel', pasal: 17, ayatStart: 1, ayatEnd: 7, judul: 'Air dari bukit batu di Masa dan Meriba' },
  { kitab: 'Kel', pasal: 17, ayatStart: 8, ayatEnd: 16, judul: 'Kemenangan atas orang Amalek' },
  { kitab: 'Kel', pasal: 18, ayatStart: 1, ayatEnd: 27, judul: 'Yitro mengunjungi Musa' },
  { kitab: 'Kel', pasal: 19, ayatStart: 1, ayatEnd: 25, judul: 'TUHAN di gunung Sinai' },
  { kitab: 'Kel', pasal: 20, ayatStart: 1, ayatEnd: 17, judul: 'Sepuluh Hukum Allah (Dasa Titah)' },
  { kitab: 'Kel', pasal: 24, ayatStart: 1, ayatEnd: 18, judul: 'Pengikatan perjanjian di gunung Sinai' },
  { kitab: 'Kel', pasal: 32, ayatStart: 1, ayatEnd: 35, judul: 'Anak lembu emas' },
  { kitab: 'Kel', pasal: 33, ayatStart: 1, ayatEnd: 23, judul: 'Musa memohon penyertaan TUHAN' },
  { kitab: 'Kel', pasal: 34, ayatStart: 1, ayatEnd: 35, judul: 'Dua loh batu yang baru' },
  { kitab: 'Kel', pasal: 40, ayatStart: 1, ayatEnd: 38, judul: 'Kemuliaan TUHAN memenuhi Kemah Suci' },

  // Imamat
  { kitab: 'Ima', pasal: 19, ayatStart: 1, ayatEnd: 18, judul: 'Kuduslah kamu, sebab Aku kudus' },
  { kitab: 'Ima', pasal: 23, ayatStart: 1, ayatEnd: 44, judul: 'Hari-hari raya TUHAN' },
  { kitab: 'Ima', pasal: 25, ayatStart: 1, ayatEnd: 55, judul: 'Tahun Sabat dan Tahun Yobel' },
  { kitab: 'Ima', pasal: 26, ayatStart: 1, ayatEnd: 13, judul: 'Berkat karena ketaatan' },

  // Bilangan
  { kitab: 'Bil', pasal: 6, ayatStart: 22, ayatEnd: 27, judul: 'Berkat imam bagi umat (TUHAN memberkati engkau)' },
  { kitab: 'Bil', pasal: 11, ayatStart: 1, ayatEnd: 35, judul: 'Tuntutan umat dan burung puyuh di padang gurun' },
  { kitab: 'Bil', pasal: 13, ayatStart: 1, ayatEnd: 33, judul: 'Kedua belas pengintai di Kanaan' },
  { kitab: 'Bil', pasal: 14, ayatStart: 1, ayatEnd: 45, judul: 'Pemberontakan umat Israel' },
  { kitab: 'Bil', pasal: 21, ayatStart: 4, ayatEnd: 9, judul: 'Ular tembaga' },

  // Ulangan
  { kitab: 'Ula', pasal: 6, ayatStart: 4, ayatEnd: 9, judul: 'Kasihilah TUHAN, Allahmu (Shema Yisrael)' },
  { kitab: 'Ula', pasal: 8, ayatStart: 1, ayatEnd: 20, judul: 'Peringatan jangan melupakan TUHAN' },
  { kitab: 'Ula', pasal: 10, ayatStart: 12, ayatEnd: 22, judul: 'Tuntutan TUHAN kepada orang percaya' },
  { kitab: 'Ula', pasal: 11, ayatStart: 18, ayatEnd: 21, judul: 'Ajarkanlah firman itu kepada anak-anakmu' },
  { kitab: 'Ula', pasal: 18, ayatStart: 15, ayatEnd: 22, judul: 'Nabi yang dijanjikan seperti Musa' },
  { kitab: 'Ula', pasal: 28, ayatStart: 1, ayatEnd: 14, judul: 'Berkat atas ketaatan' },
  { kitab: 'Ula', pasal: 30, ayatStart: 11, ayatEnd: 20, judul: 'Pilihlah kehidupan' },
  { kitab: 'Ula', pasal: 31, ayatStart: 1, ayatEnd: 8, judul: 'Yosua menggantikan Musa: Kuatkan dan teguhkanlah hatimu' },
  { kitab: 'Ula', pasal: 34, ayatStart: 1, ayatEnd: 12, judul: 'Musa melihat tanah Kanaan dan wafat' },

  // Yosua, Hakim-hakim, Rut
  { kitab: 'Yos', pasal: 1, ayatStart: 1, ayatEnd: 9, judul: 'Kuatkan dan teguhkanlah hatimu' },
  { kitab: 'Yos', pasal: 3, ayatStart: 1, ayatEnd: 17, judul: 'Menyeberangi sungai Yordan' },
  { kitab: 'Yos', pasal: 6, ayatStart: 1, ayatEnd: 27, judul: 'Runtuhnya tembok Yerikho' },
  { kitab: 'Yos', pasal: 24, ayatStart: 1, ayatEnd: 28, judul: 'Pembaruan perjanjian di Sikhem (Aku dan seisi rumahku)' },
  { kitab: 'Hak', pasal: 4, ayatStart: 1, ayatEnd: 24, judul: 'Debora dan Barak' },
  { kitab: 'Hak', pasal: 6, ayatStart: 1, ayatEnd: 40, judul: 'Panggilan Gideon' },
  { kitab: 'Hak', pasal: 7, ayatStart: 1, ayatEnd: 25, judul: 'Gideon mengalahkan orang Midian' },
  { kitab: 'Hak', pasal: 16, ayatStart: 1, ayatEnd: 31, judul: 'Simson dan Delila' },
  { kitab: 'Rut', pasal: 1, ayatStart: 1, ayatEnd: 22, judul: 'Elimelekh, Naomi, dan kesetiaan Rut' },
  { kitab: 'Rut', pasal: 2, ayatStart: 1, ayatEnd: 23, judul: 'Rut di ladang Boas' },
  { kitab: 'Rut', pasal: 4, ayatStart: 1, ayatEnd: 22, judul: 'Boas menikahi Rut dan silsilah Daud' },

  // 1 & 2 Samuel
  { kitab: '1Sa', pasal: 1, ayatStart: 1, ayatEnd: 28, judul: 'Kelahiran Samuel dan doa Hana' },
  { kitab: '1Sa', pasal: 2, ayatStart: 1, ayatEnd: 10, judul: 'Puji-pujian Hana' },
  { kitab: '1Sa', pasal: 3, ayatStart: 1, ayatEnd: 21, judul: 'TUHAN memanggil Samuel' },
  { kitab: '1Sa', pasal: 16, ayatStart: 1, ayatEnd: 13, judul: 'Daud diurapi menjadi raja' },
  { kitab: '1Sa', pasal: 17, ayatStart: 1, ayatEnd: 58, judul: 'Daud dan Goliat' },
  { kitab: '1Sa', pasal: 18, ayatStart: 1, ayatEnd: 16, judul: 'Persahabatan Daud dan Yonatan' },
  { kitab: '2Sa', pasal: 5, ayatStart: 1, ayatEnd: 12, judul: 'Daud menjadi raja atas seluruh Israel' },
  { kitab: '2Sa', pasal: 6, ayatStart: 1, ayatEnd: 23, judul: 'Tabut perjanjian dipindahkan ke Yerusalem' },
  { kitab: '2Sa', pasal: 7, ayatStart: 1, ayatEnd: 29, judul: 'Perjanjian Allah dengan Daud' },
  { kitab: '2Sa', pasal: 12, ayatStart: 1, ayatEnd: 25, judul: 'Natan menegur Daud dan pengampunan Allah' },

  // 1 & 2 Raja-raja, 1 & 2 Tawarikh, Ezra, Nehemia, Ester
  { kitab: '1Ra', pasal: 3, ayatStart: 1, ayatEnd: 15, judul: 'Doa Salomo memohon hikmat' },
  { kitab: '1Ra', pasal: 8, ayatStart: 1, ayatEnd: 66, judul: 'Pentahbisan Bait Suci di Yerusalem' },
  { kitab: '1Ra', pasal: 17, ayatStart: 1, ayatEnd: 24, judul: 'Elia di sungai Kerit dan janda di Sarfat' },
  { kitab: '1Ra', pasal: 18, ayatStart: 1, ayatEnd: 46, judul: 'Elia di gunung Karmel melawan nabi-nabi Baal' },
  { kitab: '1Ra', pasal: 19, ayatStart: 1, ayatEnd: 18, judul: 'Elia di gunung Horeb mendengar suara hening lembut' },
  { kitab: '2Ra', pasal: 2, ayatStart: 1, ayatEnd: 18, judul: 'Elia diangkat ke sorga dan Elisa menggantikannya' },
  { kitab: '2Ra', pasal: 4, ayatStart: 1, ayatEnd: 44, judul: 'Minyak seorang janda dan anak perempuan Sunem' },
  { kitab: '2Ra', pasal: 5, ayatStart: 1, ayatEnd: 27, judul: 'Naaman disembuhkan dari kusta' },
  { kitab: '1Ta', pasal: 4, ayatStart: 9, ayatEnd: 10, judul: 'Doa Yabes' },
  { kitab: '1Ta', pasal: 16, ayatStart: 7, ayatEnd: 36, judul: 'Nyanyian puji-pujian Daud' },
  { kitab: '1Ta', pasal: 29, ayatStart: 10, ayatEnd: 20, judul: 'Puji-pujian Daud saat penyerahan persembahan' },
  { kitab: '2Ta', pasal: 7, ayatStart: 11, ayatEnd: 22, judul: 'Penampakan TUHAN kepada Salomo (Bila umat-Ku berdoa)' },
  { kitab: '2Ta', pasal: 20, ayatStart: 1, ayatEnd: 30, judul: 'Kemenangan Yosafat dengan puji-pujian' },
  { kitab: 'Ezr', pasal: 1, ayatStart: 1, ayatEnd: 11, judul: 'Koresh mengizinkan orang buangan pulang' },
  { kitab: 'Ezr', pasal: 3, ayatStart: 1, ayatEnd: 13, judul: 'Dasar Bait Suci diletakkan' },
  { kitab: 'Ezr', pasal: 7, ayatStart: 1, ayatEnd: 28, judul: 'Ezra diutus ke Yerusalem' },
  { kitab: 'Neh', pasal: 1, ayatStart: 1, ayatEnd: 11, judul: 'Doa Nehemia bagi Yerusalem' },
  { kitab: 'Neh', pasal: 2, ayatStart: 1, ayatEnd: 20, judul: 'Nehemia diutus membangun tembok Yerusalem' },
  { kitab: 'Neh', pasal: 8, ayatStart: 1, ayatEnd: 19, judul: 'Pembacaan Kitab Taurat oleh Ezra' },
  { kitab: 'Est', pasal: 4, ayatStart: 1, ayatEnd: 17, judul: 'Mordekhai dan Ester: Siapa tahu untuk saat seperti ini' },

  // Ayub
  { kitab: 'Ayb', pasal: 1, ayatStart: 1, ayatEnd: 22, judul: 'Kesalehan dan kesengsaraan Ayub' },
  { kitab: 'Ayb', pasal: 19, ayatStart: 23, ayatEnd: 27, judul: 'Aku tahu: Penebusku hidup' },
  { kitab: 'Ayb', pasal: 38, ayatStart: 1, ayatEnd: 41, judul: 'TUHAN menjawab Ayub dari dalam badai' },
  { kitab: 'Ayb', pasal: 42, ayatStart: 1, ayatEnd: 17, judul: 'Pertobatan Ayub dan pemulihannya oleh TUHAN' },

  // Kitab Mazmur Lengkap & Lectionary
  { kitab: 'Mzm', pasal: 1, ayatStart: 1, ayatEnd: 6, judul: 'Jalan orang benar dan jalan orang fasik' },
  { kitab: 'Mzm', pasal: 8, ayatStart: 1, ayatEnd: 10, judul: 'Kemuliaan TUHAN dan martabat manusia' },
  { kitab: 'Mzm', pasal: 15, ayatStart: 1, ayatEnd: 5, judul: 'Siapa yang boleh datang kepada TUHAN' },
  { kitab: 'Mzm', pasal: 16, ayatStart: 1, ayatEnd: 11, judul: 'Bahagia orang saleh' },
  { kitab: 'Mzm', pasal: 19, ayatStart: 1, ayatEnd: 15, judul: 'Kemuliaan TUHAN dalam ciptaan dan Taurat' },
  { kitab: 'Mzm', pasal: 23, ayatStart: 1, ayatEnd: 6, judul: 'TUHAN, gembalaku yang baik' },
  { kitab: 'Mzm', pasal: 24, ayatStart: 1, ayatEnd: 10, judul: 'Pintu gerbang Sion menyambut Raja Kemuliaan' },
  { kitab: 'Mzm', pasal: 25, ayatStart: 1, ayatEnd: 22, judul: 'Doa memohon ampun dan perlindungan' },
  { kitab: 'Mzm', pasal: 27, ayatStart: 1, ayatEnd: 14, judul: 'Aman dalam naungan Allah' },
  { kitab: 'Mzm', pasal: 32, ayatStart: 1, ayatEnd: 11, judul: 'Kebahagiaan orang yang diampuni dosanya' },
  { kitab: 'Mzm', pasal: 33, ayatStart: 1, ayatEnd: 22, judul: 'Puji-pujian kepada Allah yang Mahakuasa' },
  { kitab: 'Mzm', pasal: 34, ayatStart: 1, ayatEnd: 23, judul: 'Dalam perlindungan TUHAN' },
  { kitab: 'Mzm', pasal: 40, ayatStart: 1, ayatEnd: 18, judul: 'Ucapan syukur dan doa mohon pertolongan' },
  { kitab: 'Mzm', pasal: 42, ayatStart: 1, ayatEnd: 12, judul: 'Rindu kepada Allah seperti rusa merindukan air' },
  { kitab: 'Mzm', pasal: 45, ayatStart: 1, ayatEnd: 18, judul: 'Nyanyian perkawinan raja' },
  { kitab: 'Mzm', pasal: 46, ayatStart: 1, ayatEnd: 12, judul: 'Allah adalah kota benteng kita' },
  { kitab: 'Mzm', pasal: 51, ayatStart: 1, ayatEnd: 21, judul: 'Pengakuan dosa dan doa pembaharuan hati' },
  { kitab: 'Mzm', pasal: 62, ayatStart: 1, ayatEnd: 13, judul: 'Hanya dekat Allah saja aku tenang' },
  { kitab: 'Mzm', pasal: 63, ayatStart: 1, ayatEnd: 12, judul: 'Kepuasan jiwa di dalam Allah' },
  { kitab: 'Mzm', pasal: 66, ayatStart: 1, ayatEnd: 12, judul: 'Nyanyian syukur karena orang Israel terlepas dari bahaya' },
  { kitab: 'Mzm', pasal: 66, ayatStart: 13, ayatEnd: 20, judul: 'Kurban syukur kepada Allah' },
  { kitab: 'Mzm', pasal: 67, ayatStart: 1, ayatEnd: 8, judul: 'Kiranya bangsa-bangsa bersyukur kepada Allah' },
  { kitab: 'Mzm', pasal: 84, ayatStart: 1, ayatEnd: 13, judul: 'Rindu kepada kediaman TUHAN' },
  { kitab: 'Mzm', pasal: 85, ayatStart: 1, ayatEnd: 14, judul: 'Doa memohon pemulihan dan keselamatan' },
  { kitab: 'Mzm', pasal: 90, ayatStart: 1, ayatEnd: 17, judul: 'Kerapuhan manusia dan kekekalan Allah' },
  { kitab: 'Mzm', pasal: 91, ayatStart: 1, ayatEnd: 16, judul: 'Dalam naungan Yang Mahatinggi' },
  { kitab: 'Mzm', pasal: 95, ayatStart: 1, ayatEnd: 11, judul: 'Hormatilah TUHAN dan taatilah Dia' },
  { kitab: 'Mzm', pasal: 96, ayatStart: 1, ayatEnd: 13, judul: 'TUHAN, Raja segenap bumi' },
  { kitab: 'Mzm', pasal: 98, ayatStart: 1, ayatEnd: 9, judul: 'Pujilah TUHAN yang datang menghakimi dunia' },
  { kitab: 'Mzm', pasal: 100, ayatStart: 1, ayatEnd: 5, judul: 'Pujilah Allah dalam bait-Nya (Sorak-sorailah bagi TUHAN)' },
  { kitab: 'Mzm', pasal: 103, ayatStart: 1, ayatEnd: 22, judul: 'Pujilah TUHAN, hai jiwaku' },
  { kitab: 'Mzm', pasal: 104, ayatStart: 1, ayatEnd: 35, judul: 'Puji-pujian atas penciptaan dan pemeliharaan TUHAN' },
  { kitab: 'Mzm', pasal: 116, ayatStart: 1, ayatEnd: 19, judul: 'Pengharapan kepada TUHAN di waktu susah' },
  { kitab: 'Mzm', pasal: 118, ayatStart: 1, ayatEnd: 29, judul: 'Batu yang dibuang telah menjadi batu penjuru' },
  { kitab: 'Mzm', pasal: 119, ayatStart: 105, ayatEnd: 112, judul: 'Firman-Mu itu pelita bagi kakiku dan terang bagi jalanku' },
  { kitab: 'Mzm', pasal: 121, ayatStart: 1, ayatEnd: 8, judul: 'Pertolongan datang dari TUHAN pencipta langit dan bumi' },
  { kitab: 'Mzm', pasal: 122, ayatStart: 1, ayatEnd: 9, judul: 'Doa damai sejahtera untuk Yerusalem' },
  { kitab: 'Mzm', pasal: 126, ayatStart: 1, ayatEnd: 6, judul: 'Pengharapan di tengah air mata (Menuai dengan bersorak-sorai)' },
  { kitab: 'Mzm', pasal: 127, ayatStart: 1, ayatEnd: 5, judul: 'Berkat TUHAN pangkal selamat' },
  { kitab: 'Mzm', pasal: 128, ayatStart: 1, ayatEnd: 6, judul: 'Berkat atas rumah tangga yang takut akan TUHAN' },
  { kitab: 'Mzm', pasal: 130, ayatStart: 1, ayatEnd: 8, judul: 'Seruan dari jurang yang dalam (De Profundis)' },
  { kitab: 'Mzm', pasal: 133, ayatStart: 1, ayatEnd: 3, judul: 'Persaudaraan yang rukun' },
  { kitab: 'Mzm', pasal: 136, ayatStart: 1, ayatEnd: 26, judul: 'Kasih setia TUHAN untuk selama-lamanya' },
  { kitab: 'Mzm', pasal: 139, ayatStart: 1, ayatEnd: 24, judul: 'Doa di hadapan Allah yang Mahatahu' },
  { kitab: 'Mzm', pasal: 145, ayatStart: 1, ayatEnd: 21, judul: 'Puji-pujian karena kemurahan TUHAN' },
  { kitab: 'Mzm', pasal: 146, ayatStart: 1, ayatEnd: 10, judul: 'Hanya TUHAN penolong yang sejati' },
  { kitab: 'Mzm', pasal: 147, ayatStart: 1, ayatEnd: 20, judul: 'Kekuasaan dan kemurahan Allah bagi umat-Nya' },
  { kitab: 'Mzm', pasal: 148, ayatStart: 1, ayatEnd: 14, judul: 'Pujilah TUHAN di sorga dan di bumi' },
  { kitab: 'Mzm', pasal: 149, ayatStart: 1, ayatEnd: 9, judul: 'Pujian kemenangan umat Allah' },
  { kitab: 'Mzm', pasal: 150, ayatStart: 1, ayatEnd: 6, judul: 'Biarlah segala yang bernafas memuji TUHAN' },

  // Amsal, Pengkhotbah, Kidung Agung
  { kitab: 'Ams', pasal: 1, ayatStart: 1, ayatEnd: 7, judul: 'Tujuan amsal-amsal ini' },
  { kitab: 'Ams', pasal: 2, ayatStart: 1, ayatEnd: 22, judul: 'Faedah menuntut hikmat' },
  { kitab: 'Ams', pasal: 3, ayatStart: 1, ayatEnd: 12, judul: 'Percayalah kepada TUHAN dengan segenap hatimu' },
  { kitab: 'Ams', pasal: 3, ayatStart: 13, ayatEnd: 26, judul: 'Kebahagiaan orang yang mendapat hikmat' },
  { kitab: 'Ams', pasal: 4, ayatStart: 1, ayatEnd: 19, judul: 'Nasihat untuk mencari hikmat' },
  { kitab: 'Ams', pasal: 4, ayatStart: 20, ayatEnd: 27, judul: 'Jagalah hatimu dengan segala kewaspadaan' },
  { kitab: 'Ams', pasal: 8, ayatStart: 1, ayatEnd: 36, judul: 'Hikmat berseru-seru' },
  { kitab: 'Ams', pasal: 9, ayatStart: 1, ayatEnd: 18, judul: 'Undangan hikmat dan kebodohan' },
  { kitab: 'Ams', pasal: 16, ayatStart: 1, ayatEnd: 9, judul: 'Rancangan manusia dan ketetapan TUHAN' },
  { kitab: 'Ams', pasal: 31, ayatStart: 10, ayatEnd: 31, judul: 'Puji-pujian untuk isteri yang cakap' },
  { kitab: 'Pkh', pasal: 3, ayatStart: 1, ayatEnd: 15, judul: 'Untuk segala sesuatu ada masanya' },
  { kitab: 'Pkh', pasal: 11, ayatStart: 1, ayatEnd: 10, judul: 'Nasihat-nasihat praktis bagi orang muda' },
  { kitab: 'Pkh', pasal: 12, ayatStart: 1, ayatEnd: 14, judul: 'Ingatlah akan Penciptamu pada masa mudamu' },
  { kitab: 'Kid', pasal: 2, ayatStart: 8, ayatEnd: 17, judul: 'Kekasih datang di musim semi' },
  { kitab: 'Kid', pasal: 8, ayatStart: 5, ayatEnd: 14, judul: 'Kekuatan cinta' },

  // Kitab Nabi-Nabi Besar & Kecil
  { kitab: 'Yes', pasal: 6, ayatStart: 1, ayatEnd: 13, judul: 'Yesaya diutus' },
  { kitab: 'Yes', pasal: 7, ayatStart: 10, ayatEnd: 17, judul: 'Pemberitahuan tentang Imanuel' },
  { kitab: 'Yes', pasal: 9, ayatStart: 1, ayatEnd: 7, judul: 'Kelahiran Raja Damai' },
  { kitab: 'Yes', pasal: 11, ayatStart: 1, ayatEnd: 10, judul: 'Tunas Isai dan Kerajaan Damai' },
  { kitab: 'Yes', pasal: 12, ayatStart: 1, ayatEnd: 6, judul: 'Nyanyian syukur orang yang ditebus' },
  { kitab: 'Yes', pasal: 25, ayatStart: 6, ayatEnd: 12, judul: 'Keselamatan yang disediakan TUHAN di Sion' },
  { kitab: 'Yes', pasal: 26, ayatStart: 1, ayatEnd: 19, judul: 'Nyanyian puji-pujian karena kelepasan' },
  { kitab: 'Yes', pasal: 35, ayatStart: 1, ayatEnd: 10, judul: 'Kemuliaan Sion di masa depan' },
  { kitab: 'Yes', pasal: 40, ayatStart: 1, ayatEnd: 11, judul: 'Kabar keselamatan yang menghiburkan' },
  { kitab: 'Yes', pasal: 40, ayatStart: 27, ayatEnd: 31, judul: 'Mereka yang menanti-nantikan TUHAN beroleh kekuatan baru' },
  { kitab: 'Yes', pasal: 42, ayatStart: 1, ayatEnd: 9, judul: 'Hamba TUHAN yang dipilih' },
  { kitab: 'Yes', pasal: 43, ayatStart: 1, ayatEnd: 7, judul: 'Jangan takut, sebab Aku telah menebus engkau' },
  { kitab: 'Yes', pasal: 49, ayatStart: 1, ayatEnd: 7, judul: 'Hamba TUHAN terang bagi bangsa-bangsa' },
  { kitab: 'Yes', pasal: 52, ayatStart: 13, ayatEnd: 15, judul: 'Hamba TUHAN yang menderita' },
  { kitab: 'Yes', pasal: 53, ayatStart: 1, ayatEnd: 12, judul: 'Hamba TUHAN yang menderita bagi pelanggaran kita' },
  { kitab: 'Yes', pasal: 55, ayatStart: 1, ayatEnd: 13, judul: 'Seruan untuk bertobat dan menerima rahmat' },
  { kitab: 'Yes', pasal: 58, ayatStart: 1, ayatEnd: 14, judul: 'Puasa yang dikehendaki Allah' },
  { kitab: 'Yes', pasal: 60, ayatStart: 1, ayatEnd: 22, judul: 'Kemuliaan Sion yang akan datang' },
  { kitab: 'Yes', pasal: 61, ayatStart: 1, ayatEnd: 11, judul: 'Kabar baik tentang pembebasan diurapi Roh TUHAN' },
  { kitab: 'Yes', pasal: 65, ayatStart: 17, ayatEnd: 25, judul: 'Langit yang baru dan bumi yang baru' },
  { kitab: 'Yer', pasal: 1, ayatStart: 1, ayatEnd: 19, judul: 'Panggilan dan penugasan Yeremia' },
  { kitab: 'Yer', pasal: 17, ayatStart: 5, ayatEnd: 10, judul: 'Orang yang mengandalkan manusia dan orang yang mengandalkan TUHAN' },
  { kitab: 'Yer', pasal: 29, ayatStart: 11, ayatEnd: 14, judul: 'Rancangan damai sejahtera dan hari depan penuh harapan' },
  { kitab: 'Yer', pasal: 31, ayatStart: 31, ayatEnd: 34, judul: 'Perjanjian baru yang dimeteraikan dalam hati' },
  { kitab: 'Yer', pasal: 33, ayatStart: 14, ayatEnd: 26, judul: 'Janji tentang Tunas yang adil' },
  { kitab: 'Rat', pasal: 3, ayatStart: 22, ayatEnd: 26, judul: 'Tak berkesudahan kasih setia TUHAN' },
  { kitab: 'Yeh', pasal: 34, ayatStart: 11, ayatEnd: 31, judul: 'TUHAN, Gembala sejati bagi domba-domba-Nya' },
  { kitab: 'Yeh', pasal: 36, ayatStart: 22, ayatEnd: 38, judul: 'Pembaruan Israel dan hati yang baru' },
  { kitab: 'Yeh', pasal: 37, ayatStart: 1, ayatEnd: 14, judul: 'Lembah tulang-tulang kering dihidupkan' },
  { kitab: 'Yeh', pasal: 47, ayatStart: 1, ayatEnd: 12, judul: 'Sungai air kehidupan dari Bait Suci' },
  { kitab: 'Dan', pasal: 3, ayatStart: 1, ayatEnd: 30, judul: 'Ketiga kawan Daniel di perapian yang menyala-nyala' },
  { kitab: 'Dan', pasal: 6, ayatStart: 1, ayatEnd: 29, judul: 'Daniel di gua singa' },
  { kitab: 'Hos', pasal: 6, ayatStart: 1, ayatEnd: 6, judul: 'Seruan pertobatan yang tulus' },
  { kitab: 'Hos', pasal: 11, ayatStart: 1, ayatEnd: 11, judul: 'Kasih Allah yang tak berkesudahan kepada Israel' },
  { kitab: 'Yoe', pasal: 2, ayatStart: 12, ayatEnd: 17, judul: 'Seruan pertobatan dengan segenap hati' },
  { kitab: 'Yoe', pasal: 2, ayatStart: 28, ayatEnd: 32, judul: 'Hari TUHAN dan pencurahan Roh Kudus' },
  { kitab: 'Amo', pasal: 5, ayatStart: 14, ayatEnd: 24, judul: 'Biarlah keadilan bergulung-gulung seperti air' },
  { kitab: 'Yun', pasal: 1, ayatStart: 1, ayatEnd: 17, judul: 'Yunus melarikan diri dari TUHAN' },
  { kitab: 'Yun', pasal: 2, ayatStart: 1, ayatEnd: 10, judul: 'Doa ucapan syukur Yunus dari perut ikan' },
  { kitab: 'Yun', pasal: 3, ayatStart: 1, ayatEnd: 10, judul: 'Pertobatan orang Niniwe' },
  { kitab: 'Mik', pasal: 5, ayatStart: 1, ayatEnd: 5, judul: 'Raja damai dari Betlehem' },
  { kitab: 'Mik', pasal: 6, ayatStart: 6, ayatEnd: 8, judul: 'Yang dituntut TUHAN: Berlaku adil, setia, dan rendah hati' },
  { kitab: 'Hab', pasal: 3, ayatStart: 17, ayatEnd: 19, judul: 'Doa Habakuk: Sekalipun pohon ara tidak berbunga' },
  { kitab: 'Zef', pasal: 3, ayatStart: 14, ayatEnd: 20, judul: 'Sukacita orang yang diselamatkan' },
  { kitab: 'Hag', pasal: 2, ayatStart: 1, ayatEnd: 10, judul: 'Kemegahan Bait Suci yang baru' },
  { kitab: 'Zak', pasal: 9, ayatStart: 9, ayatEnd: 10, judul: 'Raja Mesias yang lemah lembut masuk ke Sion' },
  { kitab: 'Mal', pasal: 3, ayatStart: 1, ayatEnd: 12, judul: 'Utusan TUHAN dan persembahan persepuluhan' },
  { kitab: 'Mal', pasal: 4, ayatStart: 1, ayatEnd: 6, judul: 'Hari TUHAN dan surya kebenaran' },
];

/**
 * Mencari judul perikop berdasarkan nama kitab, pasal, dan ayat
 */
export function getPerikopTitle(
  bookAbbrOrName: string,
  pasal: number,
  ayatStart?: number,
  ayatEnd?: number
): string | null {
  if (!bookAbbrOrName || !pasal) return null;

  // Normalisasi kode kitab (buang spasi dan titik)
  const cleanBook = bookAbbrOrName.trim().toLowerCase().replace(/\./g, '');
  
  // Cari di database perikop
  const matches = PERIKOP_DATABASE.filter((p) => {
    const pKitab = p.kitab.toLowerCase();
    const bookMatches =
      cleanBook === pKitab ||
      cleanBook.startsWith(pKitab) ||
      pKitab.startsWith(cleanBook);
    return bookMatches && p.pasal === pasal;
  });

  if (matches.length === 0) return null;

  // Jika ada spesifikasi ayat
  if (ayatStart !== undefined) {
    const end = ayatEnd !== undefined ? ayatEnd : ayatStart;

    // 1. Cari exact / subset match (rentang ayat saling tumpang tindih)
    const exactOrOverlap = matches.find((p) => {
      return (
        (ayatStart >= p.ayatStart && ayatStart <= p.ayatEnd) ||
        (end >= p.ayatStart && end <= p.ayatEnd) ||
        (p.ayatStart >= ayatStart && p.ayatEnd <= end)
      );
    });

    if (exactOrOverlap) {
      return exactOrOverlap.judul;
    }
  }

  // Fallback: perikop pertama pada pasal tersebut
  return matches[0].judul;
}

/**
 * Mengambil semua daftar perikop yang ada di dalam suatu pasal kitab tertentu,
 * terurut berdasarkan ayat mulai (ayatStart).
 */
export function getChapterPerikopes(
  bookAbbrOrName: string,
  pasal: number
): PerikopItem[] {
  if (!bookAbbrOrName || !pasal) return [];

  const cleanBook = bookAbbrOrName.trim().toLowerCase().replace(/\./g, '');

  const matches = PERIKOP_DATABASE.filter((p) => {
    const pKitab = p.kitab.toLowerCase();
    const bookMatches =
      cleanBook === pKitab ||
      cleanBook.startsWith(pKitab) ||
      pKitab.startsWith(cleanBook);
    return bookMatches && p.pasal === pasal;
  });

  return [...matches].sort((a, b) => a.ayatStart - b.ayatStart);
}

/**
 * Mengambil perikop yang dimulai tepat pada ayat tertentu di pasal tersebut
 */
export function getPerikopStartingAtVerse(
  bookAbbrOrName: string,
  pasal: number,
  ayat: number
): PerikopItem | null {
  const perikopes = getChapterPerikopes(bookAbbrOrName, pasal);
  return perikopes.find((p) => p.ayatStart === ayat) || null;
}

/**
 * Mengambil perikop yang menaungi ayat tertentu
 */
export function getPerikopForVerse(
  bookAbbrOrName: string,
  pasal: number,
  ayat: number
): PerikopItem | null {
  const perikopes = getChapterPerikopes(bookAbbrOrName, pasal);
  const found = perikopes.find((p) => ayat >= p.ayatStart && ayat <= p.ayatEnd);
  if (found) return found;
  // Jika tidak tepat dalam range, ambil perikop terdekat sebelumnya
  for (let i = perikopes.length - 1; i >= 0; i--) {
    if (ayat >= perikopes[i].ayatStart) {
      return perikopes[i];
    }
  }
  return perikopes[0] || null;
}

/**
 * Mencari judul perikop dari string referensi nats lengkap (e.g. "Kel. 16:1-15", "Matius 21:18-22", "Mzm 23:1-6")
 */
export function findPerikopForReference(rawRef: string): string | null {
  if (!rawRef) return null;

  // Pre-clean
  let clean = rawRef
    .replace(/^(nats|nast|bacaan|khotbah|teks|ayat)\s*[:\-–]?\s*/i, '')
    .replace(/\(tb\)|\(lai\)|\(terjemahan baru\)/gi, '')
    .replace(/\s*:\s*/g, ':')
    .replace(/(\d+)[\:\.](\d+)\s*-\s*(\d+)[;\,](\d+)/g, '$1:$2-$3:$4')
    .replace(/(\d+)[;](\d+)/g, '$1:$2')
    .trim();

  // Handle multi-segment seperti "Mazmur 45:1-3, 7-10" -> ambil segmen pertama untuk perikop
  if (clean.includes(',')) {
    clean = clean.split(',')[0].trim();
  }

  // Pattern: "Kitab Pasal:AyatStart-AyatEnd"
  const match = clean.match(/^([\d\s\w\-\.]+?)\s+(\d+)(?:[\:\.](\d+)(?:[a-z])?(?:\s*-\s*(?:(\d+)[\:\.])?(\d+)(?:[a-z])?)?)?$/i);
  if (!match) return null;

  const [_, rawBook, pasalStr, startVStr, crossChStr, endVStr] = match;
  const pasal = parseInt(pasalStr, 10);
  const startV = startVStr ? parseInt(startVStr, 10) : undefined;
  const endV = endVStr ? parseInt(endVStr, 10) : startV;

  // Khusus lintas pasal seperti Yesaya 52:13-53:12
  if (crossChStr && rawBook.toLowerCase().includes('yes')) {
    return 'Hamba TUHAN yang menderita bagi pelanggaran kita';
  }

  // Mapping singkat nama kitab ke abbr standar LAI
  const ALIAS: Record<string, string> = {
    matius: 'Mat', mat: 'Mat',
    markus: 'Mrk', mrk: 'Mrk', mar: 'Mrk',
    lukas: 'Luk', luk: 'Luk',
    yohanes: 'Yoh', yoh: 'Yoh',
    kisah: 'Kis', kis: 'Kis', 'kisah para rasul': 'Kis',
    roma: 'Rom', rom: 'Rom', rm: 'Rom',
    '1 korintus': '1Ko', '1korintus': '1Ko', '1kor': '1Ko', '1ko': '1Ko',
    '2 korintus': '2Ko', '2korintus': '2Ko', '2kor': '2Ko', '2ko': '2Ko',
    galatia: 'Gal', gal: 'Gal',
    efesus: 'Efe', efe: 'Efe',
    filipi: 'Flp', flp: 'Flp',
    kolose: 'Kol', kol: 'Kol',
    '1 tesalonika': '1Te', '1tesalonika': '1Te', '1tes': '1Te', '1te': '1Te',
    '2 tesalonika': '2Te', '2tesalonika': '2Te', '2tes': '2Te', '2te': '2Te',
    '1 timotius': '1Ti', '1timotius': '1Ti', '1tim': '1Ti', '1ti': '1Ti',
    '2 timotius': '2Ti', '2timotius': '2Ti', '2tim': '2Ti', '2ti': '2Ti',
    titus: 'Tit', tit: 'Tit',
    filemon: 'Flm', flm: 'Flm',
    ibrani: 'Ibr', ibr: 'Ibr',
    yakobus: 'Yak', yak: 'Yak',
    '1 petrus': '1Pt', '1petrus': '1Pt', '1pt': '1Pt',
    '2 petrus': '2Pt', '2petrus': '2Pt', '2pt': '2Pt',
    '1 yohanes': '1Yo', '1yohanes': '1Yo', '1yo': '1Yo', '1yoh': '1Yo', '1 yoh': '1Yo',
    '2 yohanes': '2Yo', '2yohanes': '2Yo', '2yo': '2Yo', '2yoh': '2Yo', '2 yoh': '2Yo',
    '3 yohanes': '3Yo', '3yohanes': '3Yo', '3yo': '3Yo', '3yoh': '3Yo', '3 yoh': '3Yo',
    yudas: 'Yud', yud: 'Yud',
    wahyu: 'Why', why: 'Why',
    kejadian: 'Kej', kej: 'Kej',
    keluaran: 'Kel', kel: 'Kel',
    imamat: 'Ima', ima: 'Ima',
    bilangan: 'Bil', bil: 'Bil',
    ulangan: 'Ula', ula: 'Ula',
    yosua: 'Yos', yos: 'Yos',
    hakim: 'Hak', 'hakim-hakim': 'Hak', hak: 'Hak',
    rut: 'Rut',
    '1 samuel': '1Sa', '1sa': '1Sa',
    '2 samuel': '2Sa', '2sa': '2Sa',
    '1 raja': '1Ra', '1 raja-raja': '1Ra', '1ra': '1Ra',
    '2 raja': '2Ra', '2 raja-raja': '2Ra', '2ra': '2Ra',
    '1 tawarikh': '1Ta', '1ta': '1Ta',
    '2 tawarikh': '2Ta', '2ta': '2Ta',
    ezra: 'Ezr', ezr: 'Ezr',
    nehemia: 'Neh', neh: 'Neh',
    ester: 'Est', est: 'Est',
    ayub: 'Ayb', ayb: 'Ayb',
    mazmur: 'Mzm', mzm: 'Mzm', maz: 'Mzm',
    amsal: 'Ams', ams: 'Ams',
    pengkhotbah: 'Pkh', pkh: 'Pkh',
    'kidung agung': 'Kid', kidung: 'Kid', kid: 'Kid',
    yesaya: 'Yes', yes: 'Yes',
    yeremia: 'Yer', yer: 'Yer',
    ratapan: 'Rat', rat: 'Rat',
    yehezkiel: 'Yeh', yeh: 'Yeh',
    daniel: 'Dan', dan: 'Dan',
    hosea: 'Hos', hos: 'Hos',
    yoel: 'Yoe', yoe: 'Yoe',
    amos: 'Amo', amo: 'Amo',
    obaja: 'Oba', oba: 'Oba',
    yunus: 'Yun', yun: 'Yun',
    mika: 'Mik', mik: 'Mik',
    nahum: 'Nah', nah: 'Nah',
    habakuk: 'Hab', hab: 'Hab',
    zefanya: 'Zef', zef: 'Zef',
    hagai: 'Hag', hag: 'Hag',
    zakharia: 'Zak', zak: 'Zak',
    maleakhi: 'Mal', mal: 'Mal',
  };

  const bookClean = rawBook
    .trim()
    .toLowerCase()
    .replace(/\./g, '')
    .replace(/^(kitab|surat|injil)\s+/i, '')
    .trim();
  const abbr = ALIAS[bookClean] || rawBook.replace(/\./g, '').trim();

  return getPerikopTitle(abbr, pasal, startV, endV);
}
