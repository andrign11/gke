import {
  AppSettings,
  MPHMember,
  PengurusKategorial,
  PengurusPembangunan,
} from '../types';

export interface SyncedOfficialInfo {
  nama: string;
  source: string; // e.g. 'MPH Jemaat', 'Seksi SPPer', 'Panitia Pembangunan'
  jabatanAsal: string;
  periode?: string;
  noHp?: string;
}

export interface SyncedOfficialsResult {
  namaKetuaJemaat?: SyncedOfficialInfo;
  namaBendahara?: SyncedOfficialInfo;
  namaSekretaris?: SyncedOfficialInfo;
  namaKetuaPembangunan?: SyncedOfficialInfo;
  namaBendaharaPembangunan?: SyncedOfficialInfo;
  namaKetuaSpper?: SyncedOfficialInfo;
  namaBendaharaSpper?: SyncedOfficialInfo;
  namaKetuaSpb?: SyncedOfficialInfo;
  namaBendaharaSpb?: SyncedOfficialInfo;
  namaKetuaSpprp?: SyncedOfficialInfo;
  namaBendaharaSpprp?: SyncedOfficialInfo;
  namaKetuaSpa?: SyncedOfficialInfo;
  namaBendaharaSpa?: SyncedOfficialInfo;
  namaKetuaBpp?: SyncedOfficialInfo;
  namaSekretarisBpp?: SyncedOfficialInfo;
  namaKetuaMp?: SyncedOfficialInfo;
  namaSekretarisMp?: SyncedOfficialInfo;
}

/**
 * Format nama lengkap dengan gelar bila gelar belum ada di dalam nama
 */
export const formatFullNameWithGelar = (nama: string, gelar?: string): string => {
  const cleanNama = (nama || '').trim();
  const cleanGelar = (gelar || '').trim();
  if (!cleanNama) return '';
  if (!cleanGelar) return cleanNama;
  if (cleanNama.toLowerCase().includes(cleanGelar.toLowerCase())) {
    return cleanNama;
  }
  // If gelar is a church prefix title (Pdt., Pnt., Dkn., Vic., Ev.)
  if (/^(pdt|pnt|dkn|vic|pastor|ev)\.?$/i.test(cleanGelar)) {
    const prefix = cleanGelar.endsWith('.') ? cleanGelar : `${cleanGelar}.`;
    return `${prefix} ${cleanNama}`;
  }
  return `${cleanNama}, ${cleanGelar}`;
};

// Helper to exclude sub-bodies / kategorial / panitia / pertimbangan / BPP / pokja from top-level Majelis Jemaat MPH
const isExcludedFromMainMPH = (jabatan: string): boolean => {
  const clean = (jabatan || '').toLowerCase();
  return /(wakil|seksi|lingkungan|pembangunan|spper|perempuan|wanita|spb|bapak|kaum\s*bapa|spp[\/\-]?r|spprp|pemuda|remaja|spa\b|ashm|anak|sekolah\s*minggu|diakonia|musik|pertimbangan|\bmp\b|\bbpp\b|pemeriksa|perbendaharaan|grarp|pokja|panitia|rayon|sektor)/i.test(
    clean
  );
};

/**
 * Ekstraksi 13 Pejabat Penandatangan Laporan dari data MPH, Seksi Kategorial & Panitia Pembangunan
 */
export const extractOfficialSignatoriesFromOrg = (
  mphList: MPHMember[] = [],
  pengurusKategorialList: PengurusKategorial[] = [],
  pengurusPembangunanList: PengurusPembangunan[] = []
): SyncedOfficialsResult => {
  const result: SyncedOfficialsResult = {};

  // 1. Ketua Majelis Jemaat GKE (Pimpinan Utama MPH / Majelis Jemaat GKE)
  const ketuaJemaat =
    // Prioritas 1: Pencocokan eksplisit jabatan Ketua Majelis Jemaat / Ketua MPH / Ketua BPH
    mphList.find((m) => {
      if (isExcludedFromMainMPH(m.jabatan)) return false;
      const j = (m.jabatan || '').trim().toLowerCase();
      return (
        j === 'ketua majelis jemaat gke' ||
        j === 'ketua majelis jemaat' ||
        j === 'ketua mph' ||
        j === 'ketua majelis pekerja harian' ||
        j === 'ketua bph' ||
        j === 'ketua jemaat' ||
        j === 'ketua jemaat gke' ||
        j === 'ketua umum majelis' ||
        j === 'ketua umum' ||
        /(^|\b)ketua\s*(majelis\s*jemaat|mph|jemaat|umum|bph|harian)($|\b)/i.test(m.jabatan || '')
      );
    }) ||
    // Prioritas 2: Ketua murni di daftar MPH tanpa embel-embel seksi/panitia/kategorial/MP/BPP
    mphList.find((m) => {
      if (isExcludedFromMainMPH(m.jabatan)) return false;
      return /ketua/i.test(m.jabatan || '');
    });

  if (ketuaJemaat) {
    result.namaKetuaJemaat = {
      nama: formatFullNameWithGelar(ketuaJemaat.nama, ketuaJemaat.gelar),
      source: 'MPH Jemaat',
      jabatanAsal: ketuaJemaat.jabatan,
      periode: ketuaJemaat.periode,
      noHp: ketuaJemaat.noHp,
    };
  }

  // 2. Bendahara Jemaat (Bendahara Utama MPH / Majelis Jemaat GKE)
  const bendaharaJemaat =
    // Prioritas 1: Pencocokan eksplisit jabatan Bendahara Majelis Jemaat / Bendahara MPH
    mphList.find((m) => {
      if (isExcludedFromMainMPH(m.jabatan)) return false;
      const j = (m.jabatan || '').trim().toLowerCase();
      return (
        j === 'bendahara majelis jemaat gke' ||
        j === 'bendahara majelis jemaat' ||
        j === 'bendahara mph' ||
        j === 'bendahara majelis pekerja harian' ||
        j === 'bendahara bph' ||
        j === 'bendahara jemaat' ||
        j === 'bendahara jemaat gke' ||
        j === 'bendahara majelis' ||
        j === 'bendahara umum' ||
        /(^|\b)bendahara\s*(majelis\s*jemaat|mph|jemaat|umum|bph|harian)($|\b)/i.test(m.jabatan || '')
      );
    }) ||
    // Prioritas 2: Bendahara murni di daftar MPH tanpa embel-embel seksi/panitia/kategorial/MP/BPP
    mphList.find((m) => {
      if (isExcludedFromMainMPH(m.jabatan)) return false;
      return /bendahara/i.test(m.jabatan || '');
    });

  if (bendaharaJemaat) {
    result.namaBendahara = {
      nama: formatFullNameWithGelar(bendaharaJemaat.nama, bendaharaJemaat.gelar),
      source: 'MPH Jemaat',
      jabatanAsal: bendaharaJemaat.jabatan,
      periode: bendaharaJemaat.periode,
      noHp: bendaharaJemaat.noHp,
    };
  }

  // 3. Sekretaris Majelis (Sekretaris Utama MPH / Majelis Jemaat GKE)
  const sekretarisJemaat =
    // Prioritas 1: Pencocokan eksplisit jabatan Sekretaris Majelis Jemaat / Sekretaris MPH
    mphList.find((m) => {
      if (isExcludedFromMainMPH(m.jabatan)) return false;
      const j = (m.jabatan || '').trim().toLowerCase();
      return (
        j === 'sekretaris majelis jemaat gke' ||
        j === 'sekretaris majelis jemaat' ||
        j === 'sekretaris mph' ||
        j === 'sekretaris majelis pekerja harian' ||
        j === 'sekretaris bph' ||
        j === 'sekretaris jemaat' ||
        j === 'sekretaris jemaat gke' ||
        j === 'sekretaris majelis' ||
        j === 'sekretaris umum' ||
        /(^|\b)sekretaris\s*(majelis\s*jemaat|mph|jemaat|umum|bph|harian)($|\b)/i.test(m.jabatan || '')
      );
    }) ||
    // Prioritas 2: Sekretaris murni di daftar MPH tanpa embel-embel seksi/panitia/kategorial/MP/BPP
    mphList.find((m) => {
      if (isExcludedFromMainMPH(m.jabatan)) return false;
      return /sekretaris/i.test(m.jabatan || '');
    });

  if (sekretarisJemaat) {
    result.namaSekretaris = {
      nama: formatFullNameWithGelar(sekretarisJemaat.nama, sekretarisJemaat.gelar),
      source: 'MPH Jemaat',
      jabatanAsal: sekretarisJemaat.jabatan,
      periode: sekretarisJemaat.periode,
      noHp: sekretarisJemaat.noHp,
    };
  }

  // 4. Ketua Panitia Pembangunan
  const ketuaPembangunan =
    pengurusPembangunanList.find((p) => /ketua/i.test(p.jabatan) && !/wakil/i.test(p.jabatan)) ||
    pengurusPembangunanList.find((p) => /ketua/i.test(p.jabatan)) ||
    mphList.find((m) => /pembangunan/i.test(m.jabatan) && /ketua/i.test(m.jabatan) && !/wakil/i.test(m.jabatan));

  if (ketuaPembangunan) {
    result.namaKetuaPembangunan = {
      nama: formatFullNameWithGelar(ketuaPembangunan.nama, ketuaPembangunan.gelar),
      source: 'Panitia Pembangunan',
      jabatanAsal: ketuaPembangunan.jabatan,
      periode: ketuaPembangunan.periode,
      noHp: ketuaPembangunan.noHp,
    };
  }

  // 5. Bendahara Panitia Pembangunan
  const bendaharaPembangunan =
    pengurusPembangunanList.find((p) => /bendahara/i.test(p.jabatan) && !/wakil/i.test(p.jabatan)) ||
    pengurusPembangunanList.find((p) => /bendahara/i.test(p.jabatan)) ||
    mphList.find((m) => /pembangunan/i.test(m.jabatan) && /bendahara/i.test(m.jabatan) && !/wakil/i.test(m.jabatan));

  if (bendaharaPembangunan) {
    result.namaBendaharaPembangunan = {
      nama: formatFullNameWithGelar(bendaharaPembangunan.nama, bendaharaPembangunan.gelar),
      source: 'Panitia Pembangunan',
      jabatanAsal: bendaharaPembangunan.jabatan,
      periode: bendaharaPembangunan.periode,
      noHp: bendaharaPembangunan.noHp,
    };
  }

  // 6. Ketua Seksi SPPer (Pelayanan Perempuan)
  const isSpper = (str: string) => {
    const clean = (str || '').toLowerCase();
    return clean.includes('spper') || clean.includes('perempuan') || clean.includes('wanita') || clean.includes('kaum ibu');
  };

  const ketuaSpper =
    mphList.find((m) => isSpper(m.jabatan) && /ketua/i.test(m.jabatan) && !/wakil/i.test(m.jabatan)) ||
    pengurusKategorialList.find((k) => isSpper(k.seksi || k.jabatan) && /ketua/i.test(k.jabatan) && !/wakil/i.test(k.jabatan)) ||
    pengurusKategorialList.find((k) => isSpper(k.seksi || k.jabatan) && /ketua/i.test(k.jabatan)) ||
    mphList.find((m) => isSpper(m.jabatan) && !/bendahara|sekretaris|wakil|anggota/i.test(m.jabatan)) ||
    mphList.find((m) => isSpper(m.jabatan) && /ketua/i.test(m.jabatan));

  if (ketuaSpper) {
    const isFromMph = mphList.some((m) => m.id === (ketuaSpper as any).id);
    result.namaKetuaSpper = {
      nama: formatFullNameWithGelar(ketuaSpper.nama, ketuaSpper.gelar),
      source: isFromMph ? 'MPH Jemaat (Seksi SPPer)' : 'Pengurus Seksi SPPer (Perempuan)',
      jabatanAsal: ketuaSpper.jabatan,
      periode: ketuaSpper.periode,
      noHp: ketuaSpper.noHp,
    };
  }

  // 7. Bendahara Seksi SPPer (Pelayanan Perempuan)
  const bendaharaSpper =
    mphList.find((m) => isSpper(m.jabatan) && /bendahara/i.test(m.jabatan) && !/wakil/i.test(m.jabatan)) ||
    pengurusKategorialList.find((k) => isSpper(k.seksi || k.jabatan) && /bendahara/i.test(k.jabatan) && !/wakil/i.test(k.jabatan)) ||
    pengurusKategorialList.find((k) => isSpper(k.seksi || k.jabatan) && /bendahara/i.test(k.jabatan)) ||
    mphList.find((m) => isSpper(m.jabatan) && /bendahara/i.test(m.jabatan));

  if (bendaharaSpper) {
    const isFromMph = mphList.some((m) => m.id === (bendaharaSpper as any).id);
    result.namaBendaharaSpper = {
      nama: formatFullNameWithGelar(bendaharaSpper.nama, bendaharaSpper.gelar),
      source: isFromMph ? 'MPH Jemaat (Seksi SPPer)' : 'Pengurus Seksi SPPer (Perempuan)',
      jabatanAsal: bendaharaSpper.jabatan,
      periode: bendaharaSpper.periode,
      noHp: bendaharaSpper.noHp,
    };
  }

  // 8. Ketua Seksi SPB (Pelayanan Bapak)
  const isSpb = (str: string) => {
    const clean = (str || '').toLowerCase();
    return (
      clean.includes('spb') ||
      clean.includes('bapak') ||
      clean.includes('bapa') ||
      clean.includes('kaum bapa') ||
      clean.includes('pelayanan bapak') ||
      /(^|[^a-zA-Z0-9])(spb|bapak|bapa|kaum\s*bapa|pelayanan\s*bapak|seksi\s*bapak)([^a-zA-Z0-9]|$)/i.test(clean)
    );
  };

  const ketuaSpb =
    mphList.find((m) => isSpb(m.jabatan) && /ketua/i.test(m.jabatan) && !/wakil/i.test(m.jabatan)) ||
    pengurusKategorialList.find((k) => isSpb(k.seksi || k.jabatan) && /ketua/i.test(k.jabatan) && !/wakil/i.test(k.jabatan)) ||
    pengurusKategorialList.find((k) => isSpb(k.seksi || k.jabatan) && /ketua/i.test(k.jabatan)) ||
    mphList.find((m) => isSpb(m.jabatan) && !/bendahara|sekretaris|wakil|anggota/i.test(m.jabatan)) ||
    mphList.find((m) => isSpb(m.jabatan) && /ketua/i.test(m.jabatan));

  if (ketuaSpb) {
    const isFromMph = mphList.some((m) => m.id === (ketuaSpb as any).id);
    result.namaKetuaSpb = {
      nama: formatFullNameWithGelar(ketuaSpb.nama, ketuaSpb.gelar),
      source: isFromMph ? 'MPH Jemaat (Seksi SPB)' : 'Pengurus Seksi SPB (Bapak)',
      jabatanAsal: ketuaSpb.jabatan,
      periode: ketuaSpb.periode,
      noHp: ketuaSpb.noHp,
    };
  }

  // 9. Bendahara Seksi SPB (Pelayanan Bapak)
  const bendaharaSpb =
    mphList.find((m) => isSpb(m.jabatan) && /bendahara/i.test(m.jabatan) && !/wakil/i.test(m.jabatan)) ||
    pengurusKategorialList.find((k) => isSpb(k.seksi || k.jabatan) && /bendahara/i.test(k.jabatan) && !/wakil/i.test(k.jabatan)) ||
    pengurusKategorialList.find((k) => isSpb(k.seksi || k.jabatan) && /bendahara/i.test(k.jabatan)) ||
    mphList.find((m) => isSpb(m.jabatan) && /bendahara/i.test(m.jabatan));

  if (bendaharaSpb) {
    const isFromMph = mphList.some((m) => m.id === (bendaharaSpb as any).id);
    result.namaBendaharaSpb = {
      nama: formatFullNameWithGelar(bendaharaSpb.nama, bendaharaSpb.gelar),
      source: isFromMph ? 'MPH Jemaat (Seksi SPB)' : 'Pengurus Seksi SPB (Bapak)',
      jabatanAsal: bendaharaSpb.jabatan,
      periode: bendaharaSpb.periode,
      noHp: bendaharaSpb.noHp,
    };
  }

  // 10. Ketua Seksi SPPR/P (Pemuda & Remaja)
  const isSppr = (str: string) => {
    const clean = (str || '').toLowerCase();
    return (
      clean.includes('sppr') ||
      clean.includes('spp/r') ||
      clean.includes('spp-r') ||
      clean.includes('spprp') ||
      clean.includes('spp/p') ||
      clean.includes('pemuda') ||
      clean.includes('remaja')
    );
  };

  const ketuaSpprp =
    mphList.find((m) => isSppr(m.jabatan) && /ketua/i.test(m.jabatan) && !/wakil/i.test(m.jabatan)) ||
    pengurusKategorialList.find((k) => isSppr(k.seksi || k.jabatan) && /ketua/i.test(k.jabatan) && !/wakil/i.test(k.jabatan)) ||
    pengurusKategorialList.find((k) => isSppr(k.seksi || k.jabatan) && /ketua/i.test(k.jabatan)) ||
    mphList.find((m) => isSppr(m.jabatan) && !/bendahara|sekretaris|wakil|anggota/i.test(m.jabatan)) ||
    mphList.find((m) => isSppr(m.jabatan) && /ketua/i.test(m.jabatan));

  if (ketuaSpprp) {
    const isFromMph = mphList.some((m) => m.id === (ketuaSpprp as any).id);
    result.namaKetuaSpprp = {
      nama: formatFullNameWithGelar(ketuaSpprp.nama, ketuaSpprp.gelar),
      source: isFromMph ? 'MPH Jemaat (Seksi SPP/R)' : 'Pengurus Seksi SPPR/P',
      jabatanAsal: ketuaSpprp.jabatan,
      periode: ketuaSpprp.periode,
      noHp: ketuaSpprp.noHp,
    };
  }

  // 11. Bendahara Seksi SPPR/P (Pemuda & Remaja)
  const bendaharaSpprp =
    mphList.find((m) => isSppr(m.jabatan) && /bendahara/i.test(m.jabatan) && !/wakil/i.test(m.jabatan)) ||
    pengurusKategorialList.find((k) => isSppr(k.seksi || k.jabatan) && /bendahara/i.test(k.jabatan) && !/wakil/i.test(k.jabatan)) ||
    pengurusKategorialList.find((k) => isSppr(k.seksi || k.jabatan) && /bendahara/i.test(k.jabatan)) ||
    mphList.find((m) => isSppr(m.jabatan) && /bendahara/i.test(m.jabatan));

  if (bendaharaSpprp) {
    const isFromMph = mphList.some((m) => m.id === (bendaharaSpprp as any).id);
    result.namaBendaharaSpprp = {
      nama: formatFullNameWithGelar(bendaharaSpprp.nama, bendaharaSpprp.gelar),
      source: isFromMph ? 'MPH Jemaat (Seksi SPP/R)' : 'Pengurus Seksi SPPR/P',
      jabatanAsal: bendaharaSpprp.jabatan,
      periode: bendaharaSpprp.periode,
      noHp: bendaharaSpprp.noHp,
    };
  }

  // 12. Ketua SPA / Anak Sekolah Minggu (ASHM)
  const isSpa = (str: string) => {
    const clean = (str || '').toLowerCase();
    return (
      clean.includes('spa') ||
      clean.includes('ashm') ||
      clean.includes('anak') ||
      clean.includes('sekolah minggu') ||
      clean.includes('pelayanan anak')
    );
  };

  const ketuaSpa =
    mphList.find((m) => isSpa(m.jabatan) && /ketua/i.test(m.jabatan) && !/wakil/i.test(m.jabatan)) ||
    pengurusKategorialList.find((k) => isSpa(k.seksi || k.jabatan) && /ketua/i.test(k.jabatan) && !/wakil/i.test(k.jabatan)) ||
    pengurusKategorialList.find((k) => isSpa(k.seksi || k.jabatan) && /ketua/i.test(k.jabatan)) ||
    mphList.find((m) => isSpa(m.jabatan) && !/bendahara|sekretaris|wakil|anggota/i.test(m.jabatan)) ||
    mphList.find((m) => isSpa(m.jabatan) && /ketua/i.test(m.jabatan));

  if (ketuaSpa) {
    const isFromMph = mphList.some((m) => m.id === (ketuaSpa as any).id);
    result.namaKetuaSpa = {
      nama: formatFullNameWithGelar(ketuaSpa.nama, ketuaSpa.gelar),
      source: isFromMph ? 'MPH Jemaat (Seksi SPA)' : 'Pengurus Seksi SPA (Sekolah Minggu)',
      jabatanAsal: ketuaSpa.jabatan,
      periode: ketuaSpa.periode,
      noHp: ketuaSpa.noHp,
    };
  }

  // 13. Bendahara SPA / Anak Sekolah Minggu (ASHM)
  const bendaharaSpa =
    mphList.find((m) => isSpa(m.jabatan) && /bendahara/i.test(m.jabatan) && !/wakil/i.test(m.jabatan)) ||
    pengurusKategorialList.find((k) => isSpa(k.seksi || k.jabatan) && /bendahara/i.test(k.jabatan) && !/wakil/i.test(k.jabatan)) ||
    pengurusKategorialList.find((k) => isSpa(k.seksi || k.jabatan) && /bendahara/i.test(k.jabatan)) ||
    mphList.find((m) => isSpa(m.jabatan) && /bendahara/i.test(m.jabatan));

  if (bendaharaSpa) {
    const isFromMph = mphList.some((m) => m.id === (bendaharaSpa as any).id);
    result.namaBendaharaSpa = {
      nama: formatFullNameWithGelar(bendaharaSpa.nama, bendaharaSpa.gelar),
      source: isFromMph ? 'MPH Jemaat (Seksi SPA)' : 'Pengurus Seksi SPA (Sekolah Minggu)',
      jabatanAsal: bendaharaSpa.jabatan,
      periode: bendaharaSpa.periode,
      noHp: bendaharaSpa.noHp,
    };
  }

  // 14. Ketua Badan Pemeriksa Perbendaharaan (BPP)
  const isBpp = (str: string) => {
    const clean = (str || '').toLowerCase();
    return (
      clean.includes('bpp') ||
      clean.includes('pemeriksa perbendaharaan') ||
      clean.includes('badan pemeriksa') ||
      clean.includes('pemeriksa keuangan') ||
      clean.includes('pemeriksa kas')
    );
  };

  const bppMembers = mphList.filter((m) => isBpp(m.jabatan));
  const ketuaBpp =
    bppMembers.find((m) => /ketua|koordinator|pimpinan/i.test(m.jabatan) && !/wakil|anggota/i.test(m.jabatan)) ||
    bppMembers.find((m) => /ketua|koordinator/i.test(m.jabatan)) ||
    bppMembers.find((m) => !/sekretaris|anggota|wakil/i.test(m.jabatan)) ||
    bppMembers[0];

  if (ketuaBpp) {
    result.namaKetuaBpp = {
      nama: formatFullNameWithGelar(ketuaBpp.nama, ketuaBpp.gelar),
      source: 'MPH Jemaat (Badan BPP)',
      jabatanAsal: ketuaBpp.jabatan,
      periode: ketuaBpp.periode,
      noHp: ketuaBpp.noHp,
    };
  }

  // 15. Sekretaris / Anggota Badan Pemeriksa Perbendaharaan (BPP)
  const sekretarisBpp =
    bppMembers.find((m) => m.id !== ketuaBpp?.id && /sekretaris|anggota|wakil/i.test(m.jabatan)) ||
    bppMembers.find((m) => m.id !== ketuaBpp?.id);

  if (sekretarisBpp) {
    result.namaSekretarisBpp = {
      nama: formatFullNameWithGelar(sekretarisBpp.nama, sekretarisBpp.gelar),
      source: 'MPH Jemaat (Badan BPP)',
      jabatanAsal: sekretarisBpp.jabatan,
      periode: sekretarisBpp.periode,
      noHp: sekretarisBpp.noHp,
    };
  }

  // 16. Ketua Majelis Pertimbangan (MP)
  const isMp = (str: string) => {
    const clean = (str || '').toLowerCase();
    return (
      clean.includes('majelis pertimbangan') ||
      clean.includes('pertimbangan jemaat') ||
      /(^|[^a-zA-Z0-9])mp([^a-zA-Z0-9]|$)/i.test(clean) ||
      clean.includes('pertimbangan')
    );
  };

  const mpMembers = mphList.filter((m) => isMp(m.jabatan));
  const ketuaMp =
    mpMembers.find((m) => /ketua|koordinator|pimpinan/i.test(m.jabatan) && !/wakil|anggota/i.test(m.jabatan)) ||
    mpMembers.find((m) => /ketua|koordinator/i.test(m.jabatan)) ||
    mpMembers.find((m) => !/sekretaris|anggota|wakil/i.test(m.jabatan)) ||
    mpMembers[0];

  if (ketuaMp) {
    result.namaKetuaMp = {
      nama: formatFullNameWithGelar(ketuaMp.nama, ketuaMp.gelar),
      source: 'MPH Jemaat (Majelis Pertimbangan)',
      jabatanAsal: ketuaMp.jabatan,
      periode: ketuaMp.periode,
      noHp: ketuaMp.noHp,
    };
  }

  // 17. Sekretaris / Anggota Majelis Pertimbangan (MP)
  const sekretarisMp =
    mpMembers.find((m) => m.id !== ketuaMp?.id && /sekretaris|anggota|wakil/i.test(m.jabatan)) ||
    mpMembers.find((m) => m.id !== ketuaMp?.id);

  if (sekretarisMp) {
    result.namaSekretarisMp = {
      nama: formatFullNameWithGelar(sekretarisMp.nama, sekretarisMp.gelar),
      source: 'MPH Jemaat (Majelis Pertimbangan)',
      jabatanAsal: sekretarisMp.jabatan,
      periode: sekretarisMp.periode,
      noHp: sekretarisMp.noHp,
    };
  }

  return result;
};

/**
 * Buat payload partial AppSettings untuk pembaruan pengaturan
 */
export const buildSettingsPayloadFromSyncedOfficials = (
  synced: SyncedOfficialsResult
): Partial<AppSettings> => {
  const payload: Partial<AppSettings> = {};

  if (synced.namaKetuaJemaat?.nama) payload.namaKetuaJemaat = synced.namaKetuaJemaat.nama;
  if (synced.namaBendahara?.nama) payload.namaBendahara = synced.namaBendahara.nama;
  if (synced.namaSekretaris?.nama) payload.namaSekretaris = synced.namaSekretaris.nama;

  if (synced.namaKetuaPembangunan?.nama) payload.namaKetuaPembangunan = synced.namaKetuaPembangunan.nama;
  if (synced.namaBendaharaPembangunan?.nama) payload.namaBendaharaPembangunan = synced.namaBendaharaPembangunan.nama;

  if (synced.namaKetuaSpper?.nama) payload.namaKetuaSpper = synced.namaKetuaSpper.nama;
  if (synced.namaBendaharaSpper?.nama) payload.namaBendaharaSpper = synced.namaBendaharaSpper.nama;

  if (synced.namaKetuaSpb?.nama) payload.namaKetuaSpb = synced.namaKetuaSpb.nama;
  if (synced.namaBendaharaSpb?.nama) payload.namaBendaharaSpb = synced.namaBendaharaSpb.nama;

  if (synced.namaKetuaSpprp?.nama) payload.namaKetuaSpprp = synced.namaKetuaSpprp.nama;
  if (synced.namaBendaharaSpprp?.nama) payload.namaBendaharaSpprp = synced.namaBendaharaSpprp.nama;

  if (synced.namaKetuaSpa?.nama) payload.namaKetuaSpa = synced.namaKetuaSpa.nama;
  if (synced.namaBendaharaSpa?.nama) payload.namaBendaharaSpa = synced.namaBendaharaSpa.nama;

  if (synced.namaKetuaBpp?.nama) payload.namaKetuaBpp = synced.namaKetuaBpp.nama;
  if (synced.namaSekretarisBpp?.nama) payload.namaSekretarisBpp = synced.namaSekretarisBpp.nama;

  if (synced.namaKetuaMp?.nama) payload.namaKetuaMp = synced.namaKetuaMp.nama;
  if (synced.namaSekretarisMp?.nama) payload.namaSekretarisMp = synced.namaSekretarisMp.nama;

  return payload;
};
