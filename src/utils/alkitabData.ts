import { AlkitabBook, AlkitabVerse, AlkitabBookmark } from '../types';

export const ALKITAB_BOOKS: AlkitabBook[] = [
  // PERJANJIAN LAMA (39 KITAB)
  // Taurat (5)
  { abbr: 'Kej', name: 'Kejadian', fullName: 'Kitab Kejadian', testament: 'PL', totalChapters: 50, totalVerses: 1533, group: 'Taurat Musa' },
  { abbr: 'Kel', name: 'Keluaran', fullName: 'Kitab Keluaran', testament: 'PL', totalChapters: 40, totalVerses: 1213, group: 'Taurat Musa' },
  { abbr: 'Ima', name: 'Imamat', fullName: 'Kitab Imamat', testament: 'PL', totalChapters: 27, totalVerses: 859, group: 'Taurat Musa' },
  { abbr: 'Bil', name: 'Bilangan', fullName: 'Kitab Bilangan', testament: 'PL', totalChapters: 36, totalVerses: 1288, group: 'Taurat Musa' },
  { abbr: 'Ula', name: 'Ulangan', fullName: 'Kitab Ulangan', testament: 'PL', totalChapters: 34, totalVerses: 959, group: 'Taurat Musa' },

  // Sejarah (12)
  { abbr: 'Yos', name: 'Yosua', fullName: 'Kitab Yosua', testament: 'PL', totalChapters: 24, totalVerses: 658, group: 'Sejarah Perjanjian Lama' },
  { abbr: 'Hak', name: 'Hakim-hakim', fullName: 'Kitab Hakim-hakim', testament: 'PL', totalChapters: 21, totalVerses: 618, group: 'Sejarah Perjanjian Lama' },
  { abbr: 'Rut', name: 'Rut', fullName: 'Kitab Rut', testament: 'PL', totalChapters: 4, totalVerses: 85, group: 'Sejarah Perjanjian Lama' },
  { abbr: '1Sa', name: '1 Samuel', fullName: 'Kitab 1 Samuel', testament: 'PL', totalChapters: 31, totalVerses: 810, group: 'Sejarah Perjanjian Lama' },
  { abbr: '2Sa', name: '2 Samuel', fullName: 'Kitab 2 Samuel', testament: 'PL', totalChapters: 24, totalVerses: 695, group: 'Sejarah Perjanjian Lama' },
  { abbr: '1Ra', name: '1 Raja-raja', fullName: 'Kitab 1 Raja-raja', testament: 'PL', totalChapters: 22, totalVerses: 816, group: 'Sejarah Perjanjian Lama' },
  { abbr: '2Ra', name: '2 Raja-raja', fullName: 'Kitab 2 Raja-raja', testament: 'PL', totalChapters: 25, totalVerses: 719, group: 'Sejarah Perjanjian Lama' },
  { abbr: '1Ta', name: '1 Tawarikh', fullName: 'Kitab 1 Tawarikh', testament: 'PL', totalChapters: 29, totalVerses: 942, group: 'Sejarah Perjanjian Lama' },
  { abbr: '2Ta', name: '2 Tawarikh', fullName: 'Kitab 2 Tawarikh', testament: 'PL', totalChapters: 36, totalVerses: 822, group: 'Sejarah Perjanjian Lama' },
  { abbr: 'Ezr', name: 'Ezra', fullName: 'Kitab Ezra', testament: 'PL', totalChapters: 10, totalVerses: 280, group: 'Sejarah Perjanjian Lama' },
  { abbr: 'Neh', name: 'Nehemia', fullName: 'Kitab Nehemia', testament: 'PL', totalChapters: 13, totalVerses: 406, group: 'Sejarah Perjanjian Lama' },
  { abbr: 'Est', name: 'Ester', fullName: 'Kitab Ester', testament: 'PL', totalChapters: 10, totalVerses: 167, group: 'Sejarah Perjanjian Lama' },

  // Puisi & Hikmat (5)
  { abbr: 'Ayb', name: 'Ayub', fullName: 'Kitab Ayub', testament: 'PL', totalChapters: 42, totalVerses: 1070, group: 'Puisi & Hikmat' },
  { abbr: 'Mzm', name: 'Mazmur', fullName: 'Kitab Mazmur', testament: 'PL', totalChapters: 150, totalVerses: 2461, group: 'Puisi & Hikmat' },
  { abbr: 'Ams', name: 'Amsal', fullName: 'Kitab Amsal', testament: 'PL', totalChapters: 31, totalVerses: 915, group: 'Puisi & Hikmat' },
  { abbr: 'Pkh', name: 'Pengkhotbah', fullName: 'Kitab Pengkhotbah', testament: 'PL', totalChapters: 12, totalVerses: 222, group: 'Puisi & Hikmat' },
  { abbr: 'Kid', name: 'Kidung Agung', fullName: 'Kitab Kidung Agung', testament: 'PL', totalChapters: 8, totalVerses: 117, group: 'Puisi & Hikmat' },

  // Nabi-nabi Besar (5)
  { abbr: 'Yes', name: 'Yesaya', fullName: 'Kitab Yesaya', testament: 'PL', totalChapters: 66, totalVerses: 1292, group: 'Nabi-nabi Besar' },
  { abbr: 'Yer', name: 'Yeremia', fullName: 'Kitab Yeremia', testament: 'PL', totalChapters: 52, totalVerses: 1364, group: 'Nabi-nabi Besar' },
  { abbr: 'Rat', name: 'Ratapan', fullName: 'Kitab Ratapan', testament: 'PL', totalChapters: 5, totalVerses: 154, group: 'Nabi-nabi Besar' },
  { abbr: 'Yeh', name: 'Yehezkiel', fullName: 'Kitab Yehezkiel', testament: 'PL', totalChapters: 48, totalVerses: 1273, group: 'Nabi-nabi Besar' },
  { abbr: 'Dan', name: 'Daniel', fullName: 'Kitab Daniel', testament: 'PL', totalChapters: 12, totalVerses: 357, group: 'Nabi-nabi Besar' },

  // Nabi-nabi Kecil (12)
  { abbr: 'Hos', name: 'Hosea', fullName: 'Kitab Hosea', testament: 'PL', totalChapters: 14, totalVerses: 197, group: 'Nabi-nabi Kecil' },
  { abbr: 'Yoe', name: 'Yoel', fullName: 'Kitab Yoel', testament: 'PL', totalChapters: 3, totalVerses: 73, group: 'Nabi-nabi Kecil' },
  { abbr: 'Amo', name: 'Amos', fullName: 'Kitab Amos', testament: 'PL', totalChapters: 9, totalVerses: 146, group: 'Nabi-nabi Kecil' },
  { abbr: 'Oba', name: 'Obaja', fullName: 'Kitab Obaja', testament: 'PL', totalChapters: 1, totalVerses: 21, group: 'Nabi-nabi Kecil' },
  { abbr: 'Yun', name: 'Yunus', fullName: 'Kitab Yunus', testament: 'PL', totalChapters: 4, totalVerses: 48, group: 'Nabi-nabi Kecil' },
  { abbr: 'Mik', name: 'Mika', fullName: 'Kitab Mika', testament: 'PL', totalChapters: 7, totalVerses: 105, group: 'Nabi-nabi Kecil' },
  { abbr: 'Nah', name: 'Nahum', fullName: 'Kitab Nahum', testament: 'PL', totalChapters: 3, totalVerses: 47, group: 'Nabi-nabi Kecil' },
  { abbr: 'Hab', name: 'Habakuk', fullName: 'Kitab Habakuk', testament: 'PL', totalChapters: 3, totalVerses: 56, group: 'Nabi-nabi Kecil' },
  { abbr: 'Zef', name: 'Zefanya', fullName: 'Kitab Zefanya', testament: 'PL', totalChapters: 3, totalVerses: 53, group: 'Nabi-nabi Kecil' },
  { abbr: 'Hag', name: 'Hagai', fullName: 'Kitab Hagai', testament: 'PL', totalChapters: 2, totalVerses: 38, group: 'Nabi-nabi Kecil' },
  { abbr: 'Zak', name: 'Zakharia', fullName: 'Kitab Zakharia', testament: 'PL', totalChapters: 14, totalVerses: 211, group: 'Nabi-nabi Kecil' },
  { abbr: 'Mal', name: 'Maleakhi', fullName: 'Kitab Maleakhi', testament: 'PL', totalChapters: 4, totalVerses: 55, group: 'Nabi-nabi Kecil' },

  // PERJANJIAN BARU (27 KITAB)
  // Injil (4)
  { abbr: 'Mat', name: 'Matius', fullName: 'Injil Matius', testament: 'PB', totalChapters: 28, totalVerses: 1071, group: 'Injil' },
  { abbr: 'Mrk', name: 'Markus', fullName: 'Injil Markus', testament: 'PB', totalChapters: 16, totalVerses: 678, group: 'Injil' },
  { abbr: 'Luk', name: 'Lukas', fullName: 'Injil Lukas', testament: 'PB', totalChapters: 24, totalVerses: 1151, group: 'Injil' },
  { abbr: 'Yoh', name: 'Yohanes', fullName: 'Injil Yohanes', testament: 'PB', totalChapters: 21, totalVerses: 879, group: 'Injil' },

  // Sejarah Gereja (1)
  { abbr: 'Kis', name: 'Kisah Para Rasul', fullName: 'Kisah Para Rasul', testament: 'PB', totalChapters: 28, totalVerses: 1007, group: 'Sejarah Para Rasul' },

  // Surat-surat Paulus (14)
  { abbr: 'Rom', name: 'Roma', fullName: 'Surat Roma', testament: 'PB', totalChapters: 16, totalVerses: 433, group: 'Surat-surat Paulus' },
  { abbr: '1Ko', name: '1 Korintus', fullName: 'Surat 1 Korintus', testament: 'PB', totalChapters: 16, totalVerses: 437, group: 'Surat-surat Paulus' },
  { abbr: '2Ko', name: '2 Korintus', fullName: 'Surat 2 Korintus', testament: 'PB', totalChapters: 13, totalVerses: 257, group: 'Surat-surat Paulus' },
  { abbr: 'Gal', name: 'Galatia', fullName: 'Surat Galatia', testament: 'PB', totalChapters: 6, totalVerses: 149, group: 'Surat-surat Paulus' },
  { abbr: 'Efe', name: 'Efesus', fullName: 'Surat Efesus', testament: 'PB', totalChapters: 6, totalVerses: 155, group: 'Surat-surat Paulus' },
  { abbr: 'Flp', name: 'Filipi', fullName: 'Surat Filipi', testament: 'PB', totalChapters: 4, totalVerses: 104, group: 'Surat-surat Paulus' },
  { abbr: 'Kol', name: 'Kolose', fullName: 'Surat Kolose', testament: 'PB', totalChapters: 4, totalVerses: 95, group: 'Surat-surat Paulus' },
  { abbr: '1Te', name: '1 Tesalonika', fullName: 'Surat 1 Tesalonika', testament: 'PB', totalChapters: 5, totalVerses: 89, group: 'Surat-surat Paulus' },
  { abbr: '2Te', name: '2 Tesalonika', fullName: 'Surat 2 Tesalonika', testament: 'PB', totalChapters: 3, totalVerses: 47, group: 'Surat-surat Paulus' },
  { abbr: '1Ti', name: '1 Timotius', fullName: 'Surat 1 Timotius', testament: 'PB', totalChapters: 6, totalVerses: 113, group: 'Surat-surat Penggembalaan' },
  { abbr: '2Ti', name: '2 Timotius', fullName: 'Surat 2 Timotius', testament: 'PB', totalChapters: 4, totalVerses: 83, group: 'Surat-surat Penggembalaan' },
  { abbr: 'Tit', name: 'Titus', fullName: 'Surat Titus', testament: 'PB', totalChapters: 3, totalVerses: 46, group: 'Surat-surat Penggembalaan' },
  { abbr: 'Flm', name: 'Filemon', fullName: 'Surat Filemon', testament: 'PB', totalChapters: 1, totalVerses: 25, group: 'Surat-surat Paulus' },
  { abbr: 'Ibr', name: 'Ibrani', fullName: 'Surat Ibrani', testament: 'PB', totalChapters: 13, totalVerses: 303, group: 'Surat Am / Umum' },

  // Surat-surat Umum (7)
  { abbr: 'Yak', name: 'Yakobus', fullName: 'Surat Yakobus', testament: 'PB', totalChapters: 5, totalVerses: 108, group: 'Surat Am / Umum' },
  { abbr: '1Pt', name: '1 Petrus', fullName: 'Surat 1 Petrus', testament: 'PB', totalChapters: 5, totalVerses: 105, group: 'Surat Am / Umum' },
  { abbr: '2Pt', name: '2 Petrus', fullName: 'Surat 2 Petrus', testament: 'PB', totalChapters: 3, totalVerses: 61, group: 'Surat Am / Umum' },
  { abbr: '1Yo', name: '1 Yohanes', fullName: 'Surat 1 Yohanes', testament: 'PB', totalChapters: 5, totalVerses: 105, group: 'Surat Am / Umum' },
  { abbr: '2Yo', name: '2 Yohanes', fullName: 'Surat 2 Yohanes', testament: 'PB', totalChapters: 1, totalVerses: 13, group: 'Surat Am / Umum' },
  { abbr: '3Yo', name: '3 Yohanes', fullName: 'Surat 3 Yohanes', testament: 'PB', totalChapters: 1, totalVerses: 14, group: 'Surat Am / Umum' },
  { abbr: 'Yud', name: 'Yudas', fullName: 'Surat Yudas', testament: 'PB', totalChapters: 1, totalVerses: 25, group: 'Surat Am / Umum' },

  // Nubuat / Eskatologi (1)
  { abbr: 'Why', name: 'Wahyu', fullName: 'Kitab Wahyu', testament: 'PB', totalChapters: 22, totalVerses: 404, group: 'Nubuat & Eskatologi' },
];

export const PL_BOOKS = ALKITAB_BOOKS.filter((b) => b.testament === 'PL');
export const PB_BOOKS = ALKITAB_BOOKS.filter((b) => b.testament === 'PB');

export function findBook(query: string): AlkitabBook | undefined {
  if (!query) return undefined;
  const q = query.trim().toLowerCase();
  return ALKITAB_BOOKS.find(
    (b) =>
      b.abbr.toLowerCase() === q ||
      b.name.toLowerCase() === q ||
      b.fullName.toLowerCase() === q ||
      b.name.toLowerCase().startsWith(q)
  );
}

export interface ParsedNats {
  book: AlkitabBook;
  pasal: number;
  ayatStart?: number;
  ayatEnd?: number;
}

export function parseNats(text: string): ParsedNats | null {
  if (!text) return null;
  const cleaned = text.trim();
  
  // Format regex: "1 Korintus 13:4-8", "Yohanes 3:16", "Mzm 23", "Kej 1:1"
  const match = cleaned.match(/^([\d\s\w\-\.]+?)\s+(\d+)(?:[\:\.](\d+)(?:-(\d+))?)?$/);
  if (!match) return null;

  const [_, bookName, pasalStr, ayatStartStr, ayatEndStr] = match;
  const book = findBook(bookName);
  if (!book) return null;

  const pasal = Math.min(Math.max(1, parseInt(pasalStr, 10)), book.totalChapters);
  const ayatStart = ayatStartStr ? parseInt(ayatStartStr, 10) : undefined;
  const ayatEnd = ayatEndStr ? parseInt(ayatEndStr, 10) : ayatStart;

  return {
    book,
    pasal,
    ayatStart,
    ayatEnd,
  };
}

export function formatVerseText(
  verses: { ayat: number; firman: string }[],
  bookName: string,
  pasal: number
): string {
  if (!verses || verses.length === 0) return '';
  
  if (verses.length === 1) {
    const v = verses[0];
    return `"${v.firman}"\n\n📖 ${bookName} ${pasal}:${v.ayat} (TB - Terjemahan Baru)`;
  }

  const rangeStr = `${verses[0].ayat}-${verses[verses.length - 1].ayat}`;
  const textBody = verses.map((v) => `[${v.ayat}] ${v.firman}`).join('\n');
  return `📖 ${bookName} ${pasal}:${rangeStr} (TB)\n\n${textBody}\n\n— Terjemahan Baru (TB) Lembaga Alkitab Indonesia`;
}

export function generateWhatsAppBibleUrl(
  verses: { ayat: number; firman: string }[],
  bookName: string,
  pasal: number,
  namaJemaat?: string
): string {
  const content = formatVerseText(verses, bookName, pasal);
  const churchSig = namaJemaat ? `\n\n🏛️ *${namaJemaat}*` : '';
  const message = `✝️ *FIRMAN TUHAN HARI INI*\n----------------------------------------\n${content}${churchSig}\n\n_Semoga menjadi berkat dan pelita bagi kehidupan kita. Amin!_ 🙏`;
  return `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
}
