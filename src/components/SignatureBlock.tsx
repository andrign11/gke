import React from 'react';
import { useApp } from '../context/AppContext';

interface SignatureBlockProps {
  signers?: ('ketua' | 'bendahara' | 'sekretaris' | 'bpp')[];
  locationDate?: string;
  posKas?: string;
  includeBpp?: boolean;
  hideDate?: boolean;
}

export const SignatureBlock: React.FC<SignatureBlockProps> = ({
  signers = ['ketua', 'sekretaris'],
  locationDate,
  posKas,
  includeBpp = true,
  hideDate = false,
}) => {
  const { settings, mphList } = useApp();

  const tempatTerbit = settings.tempatDiterbitkan || 'Palangka Raya';
  const formattedDate =
    locationDate ||
    `${tempatTerbit}, ${new Date().toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })}`;

  // Ambil data Ketua BPP dari settings, jika belum ada cari otomatis dari pengurus MPH Jemaat
  const detectedBppFromMph = React.useMemo(() => {
    if (!mphList || mphList.length === 0) return null;
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
    const ketua =
      bppMembers.find((m) => /ketua|koordinator|pimpinan/i.test(m.jabatan) && !/wakil|anggota/i.test(m.jabatan)) ||
      bppMembers.find((m) => /ketua|koordinator/i.test(m.jabatan)) ||
      bppMembers.find((m) => !/sekretaris|anggota|wakil/i.test(m.jabatan)) ||
      bppMembers[0];

    if (!ketua) return null;
    let namaGelar = (ketua.nama || '').trim();
    const gelar = (ketua.gelar || '').trim();
    if (gelar && !namaGelar.toLowerCase().includes(gelar.toLowerCase())) {
      if (/^(pdt|pnt|dkn|vic|pastor|ev)\.?$/i.test(gelar)) {
        namaGelar = `${gelar.endsWith('.') ? gelar : `${gelar}.`} ${namaGelar}`;
      } else {
        namaGelar = `${namaGelar}, ${gelar}`;
      }
    }
    return {
      nama: namaGelar,
      nip: (ketua as any).nip || '',
      jabatan: ketua.jabatan,
    };
  }, [mphList]);

  const bppNama = settings.namaKetuaBpp || detectedBppFromMph?.nama || 'Ketua BPP Jemaat GKE';
  const bppNip = settings.nipKetuaBpp || detectedBppFromMph?.nip || '';

  let specialSigners = null;

  if (posKas === 'Kas Pembangunan' || posKas === 'Kas Iuran Pembangunan') {
    specialSigners = {
      bendahara: {
        label: 'Dibuat oleh,',
        title: 'Bendahara Panitia Pembangunan',
        nama: settings.namaBendaharaPembangunan || settings.namaBendahara,
        nip: settings.nipBendaharaPembangunan || '',
      },
      ketua: {
        label: 'Disetujui oleh,',
        title: 'Ketua Panitia Pembangunan',
        nama: settings.namaKetuaPembangunan || 'Pnt. Ir. Bambang Sugianto',
        nip: settings.nipKetuaPembangunan || '',
      },
      mengetahui: {
        label: 'Diketahui oleh,',
        title: 'Ketua Majelis Jemaat GKE',
        nama: settings.namaKetuaJemaat,
        nip: settings.nipKetuaJemaat,
      },
    };
  } else if (posKas === 'Kas SPPer') {
    specialSigners = {
      bendahara: {
        label: 'Dibuat oleh,',
        title: 'Bendahara Seksi SPPer',
        nama: settings.namaBendaharaSpper || settings.namaBendahara,
        nip: settings.nipBendaharaSpper || '',
      },
      ketua: {
        label: 'Disetujui oleh,',
        title: 'Ketua Seksi SPPer',
        nama: settings.namaKetuaSpper || 'Pnt. Ny. Christine M.A., S.Pd.',
        nip: settings.nipKetuaSpper || '',
      },
      mengetahui: {
        label: 'Diketahui oleh,',
        title: 'Ketua Majelis Jemaat GKE',
        nama: settings.namaKetuaJemaat,
        nip: settings.nipKetuaJemaat,
      },
    };
  } else if (posKas === 'Kas SPB') {
    specialSigners = {
      bendahara: {
        label: 'Dibuat oleh,',
        title: 'Bendahara Seksi SPB',
        nama: settings.namaBendaharaSpb || settings.namaBendahara,
        nip: settings.nipBendaharaSpb || '',
      },
      ketua: {
        label: 'Disetujui oleh,',
        title: 'Ketua Seksi SPB',
        nama: settings.namaKetuaSpb || 'Pnt. Drs. Markus Budi',
        nip: settings.nipKetuaSpb || '',
      },
      mengetahui: {
        label: 'Diketahui oleh,',
        title: 'Ketua Majelis Jemaat GKE',
        nama: settings.namaKetuaJemaat,
        nip: settings.nipKetuaJemaat,
      },
    };
  } else if (posKas === 'Kas SPPR/P') {
    specialSigners = {
      bendahara: {
        label: 'Dibuat oleh,',
        title: 'Bendahara Seksi SPPR/P',
        nama: settings.namaBendaharaSpprp || settings.namaBendahara,
        nip: settings.nipBendaharaSpprp || '',
      },
      ketua: {
        label: 'Disetujui oleh,',
        title: 'Ketua Seksi SPPR/P',
        nama: settings.namaKetuaSpprp || 'Sdr. Kevin Rantau, S.Kom.',
        nip: settings.nipKetuaSpprp || '',
      },
      mengetahui: {
        label: 'Diketahui oleh,',
        title: 'Ketua Majelis Jemaat GKE',
        nama: settings.namaKetuaJemaat,
        nip: settings.nipKetuaJemaat,
      },
    };
  } else if (posKas === 'Kas Anak Sekolah Hari Minggu' || posKas === 'Kas SPA') {
    specialSigners = {
      bendahara: {
        label: 'Dibuat oleh,',
        title: 'Bendahara Seksi SPA (Sekolah Minggu)',
        nama: settings.namaBendaharaSpa || settings.namaBendahara,
        nip: settings.nipBendaharaSpa || '',
      },
      ketua: {
        label: 'Disetujui oleh,',
        title: 'Ketua Seksi SPA (Sekolah Minggu)',
        nama: settings.namaKetuaSpa || 'Pnt. Ny. Grace Natalia, S.Th.',
        nip: settings.nipKetuaSpa || '',
      },
      mengetahui: {
        label: 'Diketahui oleh,',
        title: 'Ketua Majelis Jemaat GKE',
        nama: settings.namaKetuaJemaat,
        nip: settings.nipKetuaJemaat,
      },
    };
  }

  if (specialSigners) {
    return (
      <div className={`${hideDate ? 'mt-3 pt-1' : 'mt-8 pt-4'} break-inside-avoid print:break-inside-avoid`}>
        {!hideDate && (
          <p className="text-right text-xs text-slate-700 font-medium mb-6 font-sans">
            {formattedDate}
          </p>
        )}

        {/* Baris Atas: Kiri (Ketua Seksi - Disetujui oleh,) & Kanan (Bendahara - Dibuat oleh,) */}
        <div className="grid grid-cols-2 gap-8 text-center">
          <div className="flex flex-col items-center">
            <p className="text-xs font-semibold text-slate-800">{specialSigners.ketua.label}</p>
            <p className="text-xs font-bold text-slate-900">{specialSigners.ketua.title}</p>
            <div className="h-16" />
            <p className="text-xs font-bold text-slate-900 underline mt-2">
              {specialSigners.ketua.nama}
            </p>
            {specialSigners.ketua.nip && (
              <p className="text-[10px] text-slate-600">{specialSigners.ketua.nip}</p>
            )}
          </div>

          <div className="flex flex-col items-center">
            <p className="text-xs font-semibold text-slate-800">{specialSigners.bendahara.label}</p>
            <p className="text-xs font-bold text-slate-900">{specialSigners.bendahara.title}</p>
            <div className="h-16" />
            <p className="text-xs font-bold text-slate-900 underline mt-2">
              {specialSigners.bendahara.nama}
            </p>
            {specialSigners.bendahara.nip && (
              <p className="text-[10px] text-slate-600">{specialSigners.bendahara.nip}</p>
            )}
          </div>
        </div>

        {/* Baris Bawah: Diposisi tengah bawah antara Bendahara dan Ketua Seksi (Diketahui oleh, Ketua Majelis Jemaat) */}
        <div className="mt-8 flex justify-center text-center">
          <div className="flex flex-col items-center min-w-[220px]">
            <p className="text-xs font-semibold text-slate-800">{specialSigners.mengetahui.label}</p>
            <p className="text-xs font-bold text-slate-900">{specialSigners.mengetahui.title}</p>
            <div className="h-16" />
            <p className="text-xs font-bold text-slate-900 underline mt-2">
              {specialSigners.mengetahui.nama}
            </p>
            {specialSigners.mengetahui.nip && (
              <p className="text-[10px] text-slate-600">{specialSigners.mengetahui.nip}</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Khusus laporan Kas Umum, Kas Kupon, Kas Diakonia, Kas Iuran Kewajiban, dan Semua Pos Gabungan (Bendahara Kanan - Dibuat oleh, Ketua Majelis Jemaat Kiri - Diketahui oleh, Bawah Tengah - Diperiksa oleh Ketua BPP)
  if (
    signers.length === 2 &&
    signers.includes('bendahara') &&
    signers.includes('ketua')
  ) {
    return (
      <div className={`${hideDate ? 'mt-3 pt-1' : 'mt-8 pt-4'} break-inside-avoid print:break-inside-avoid`}>
        {!hideDate && (
          <p className="text-right text-xs text-slate-700 font-medium mb-6 font-sans">
            {formattedDate}
          </p>
        )}

        {/* Baris Atas: Kiri (Ketua Majelis Jemaat - Diketahui oleh,) & Kanan (Bendahara - Dibuat oleh,) */}
        <div className="grid grid-cols-2 gap-8 text-center">
          <div className="flex flex-col items-center">
            <p className="text-xs font-semibold text-slate-800">Diketahui oleh,</p>
            <p className="text-xs font-bold text-slate-900">
              Ketua Majelis Jemaat GKE
            </p>
            <div className="h-16" />
            <p className="text-xs font-bold text-slate-900 underline mt-2">
              {settings.namaKetuaJemaat}
            </p>
            {settings.nipKetuaJemaat && (
              <p className="text-[10px] text-slate-600">{settings.nipKetuaJemaat}</p>
            )}
          </div>

          <div className="flex flex-col items-center">
            <p className="text-xs font-semibold text-slate-800">Dibuat oleh,</p>
            <p className="text-xs font-bold text-slate-900">
              Bendahara Majelis Jemaat
            </p>
            <div className="h-16" />
            <p className="text-xs font-bold text-slate-900 underline mt-2">
              {settings.namaBendahara}
            </p>
            {settings.nipBendahara && (
              <p className="text-[10px] text-slate-600">{settings.nipBendahara}</p>
            )}
          </div>
        </div>

        {/* Baris Bawah Tengah: Tanda Tangan KETUA BADAN PEMERIKSA PERBENDAHARAAN (BPP) */}
        {includeBpp && (
          <div className="mt-8 flex justify-center text-center">
            <div className="flex flex-col items-center min-w-[260px]">
              <p className="text-xs font-semibold text-slate-800">Diperiksa / Diverifikasi oleh,</p>
              <p className="text-xs font-bold text-slate-900">
                Ketua Badan Pemeriksa Perbendaharaan (BPP)
              </p>
              <div className="h-16" />
              <p className="text-xs font-bold text-slate-900 underline mt-2">
                {bppNama}
              </p>
              {bppNip ? (
                <p className="text-[10px] text-slate-600">{bppNip}</p>
              ) : (
                <p className="text-[10px] text-slate-500">BPP Majelis Jemaat GKE</p>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Khusus laporan Sekretaris & Ketua Majelis Jemaat (Inventaris & Valuasi Aset, Data Warga Jemaat, Sektor/Lingkungan, Jadwal Ibadah, dll.)
  // Kiri: Ketua Majelis Jemaat (Diketahui oleh,), Kanan: Sekretaris Majelis Jemaat (Dibuat oleh,)
  if (
    signers.length === 2 &&
    signers.includes('sekretaris') &&
    signers.includes('ketua')
  ) {
    return (
      <div className={`${hideDate ? 'mt-3 pt-1' : 'mt-8 pt-4'} break-inside-avoid print:break-inside-avoid`}>
        {!hideDate && (
          <p className="text-right text-xs text-slate-700 font-medium mb-6 font-sans">
            {formattedDate}
          </p>
        )}

        <div className="grid grid-cols-2 gap-8 text-center">
          <div className="flex flex-col items-center">
            <p className="text-xs font-semibold text-slate-800">Diketahui oleh,</p>
            <p className="text-xs font-bold text-slate-900">
              Ketua Majelis Jemaat GKE
            </p>
            <div className="h-16" />
            <p className="text-xs font-bold text-slate-900 underline mt-2">
              {settings.namaKetuaJemaat}
            </p>
            {settings.nipKetuaJemaat && (
              <p className="text-[10px] text-slate-600">{settings.nipKetuaJemaat}</p>
            )}
          </div>

          <div className="flex flex-col items-center">
            <p className="text-xs font-semibold text-slate-800">Dibuat oleh,</p>
            <p className="text-xs font-bold text-slate-900">
              Sekretaris Majelis Jemaat
            </p>
            <div className="h-16" />
            <p className="text-xs font-bold text-slate-900 underline mt-2">
              {settings.namaSekretaris}
            </p>
            {settings.nipSekretaris && (
              <p className="text-[10px] text-slate-600">{settings.nipSekretaris}</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${hideDate ? 'mt-3 pt-1' : 'mt-8 pt-4'} break-inside-avoid print:break-inside-avoid`}>
      {!hideDate && (
        <p className="text-right text-xs text-slate-700 font-medium mb-6 font-sans">
          {formattedDate}
        </p>
      )}

      <div
        className={`grid gap-8 ${
          signers.length === 1
            ? 'grid-cols-1 justify-items-end'
            : signers.length === 2
            ? 'grid-cols-2 text-center'
            : 'grid-cols-3 text-center'
        }`}
      >
        {signers.map((role) => {
          if (role === 'ketua') {
            return (
              <div key="ketua" className="flex flex-col items-center">
                <p className="text-xs font-semibold text-slate-800">Mengetahui,</p>
                <p className="text-xs font-bold text-slate-900">
                  Ketua Majelis Jemaat GKE
                </p>
                <div className="h-16" />
                <p className="text-xs font-bold text-slate-900 underline mt-2">
                  {settings.namaKetuaJemaat}
                </p>
                <p className="text-[10px] text-slate-600">{settings.nipKetuaJemaat}</p>
              </div>
            );
          }
          if (role === 'sekretaris') {
            return (
              <div key="sekretaris" className="flex flex-col items-center">
                <p className="text-xs font-semibold text-slate-800">Menyetujui,</p>
                <p className="text-xs font-bold text-slate-900">
                  Sekretaris Majelis Jemaat
                </p>
                <div className="h-16" />
                <p className="text-xs font-bold text-slate-900 underline mt-2">
                  {settings.namaSekretaris}
                </p>
                <p className="text-[10px] text-slate-600">{settings.nipSekretaris}</p>
              </div>
            );
          }
          if (role === 'bendahara') {
            return (
              <div key="bendahara" className="flex flex-col items-center">
                <p className="text-xs font-semibold text-slate-800">Pengelola,</p>
                <p className="text-xs font-bold text-slate-900">
                  Bendahara Majelis Jemaat
                </p>
                <div className="h-16" />
                <p className="text-xs font-bold text-slate-900 underline mt-2">
                  {settings.namaBendahara}
                </p>
                <p className="text-[10px] text-slate-600">{settings.nipBendahara}</p>
              </div>
            );
          }
          return null;
        })}
      </div>
    </div>
  );
};
