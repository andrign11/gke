import React from 'react';
import { useApp } from '../context/AppContext';
import defaultGkeLogo from '../assets/images/gke_logo_official_1785341836111.jpg';
import { AppSettings } from '../types';

export const KopSurat: React.FC<{
  title?: string;
  subtitle?: string;
  previewSettings?: Partial<AppSettings>;
}> = ({
  title,
  subtitle,
  previewSettings,
}) => {
  const { settings: globalSettings } = useApp();
  const settings = previewSettings ? { ...globalSettings, ...previewSettings } : globalSettings;

  const activeLogo = settings.logoUrl || settings.logoGkeUrl || defaultGkeLogo;

  return (
    <div
      data-kop-surat="true"
      className="text-center pb-0 mb-3 print:mb-2 kop-surat kop-surat-container print-paper-view font-serif bg-white text-slate-900"
      style={{ backgroundColor: '#ffffff', color: '#0f172a' }}
    >
      <div className="flex items-center justify-center gap-3 sm:gap-5 mb-0.5">
        <div className="flex-shrink-0 flex items-center justify-center self-center">
          <img
            src={activeLogo}
            alt="Logo GKE"
            className="w-20 h-20 sm:w-24 sm:h-24 md:w-24 md:h-24 object-contain"
            referrerPolicy="no-referrer"
            onError={(e) => {
              (e.target as HTMLImageElement).src = defaultGkeLogo;
            }}
          />
        </div>
        <div className="text-center flex-1 max-w-2xl leading-none">
          {/* BARIS HEADER 1 (Underline) */}
          <h2
            className="kop-header-black text-xs sm:text-sm md:text-[15px] font-black uppercase tracking-wider text-slate-900 underline decoration-slate-900 underline-offset-2 leading-tight m-0"
            style={{ color: '#0f172a', textDecorationColor: '#0f172a' }}
          >
            {settings.headerKopLine1 || 'GEREJA KALIMANTAN EVANGELIS (GKE)'}
          </h2>

          {/* BARIS HEADER BARU DI BAWAH HEADER 1 (Ukuran Kurang 2 dari Header 1) */}
          {(settings.headerKopLine1b ?? '(Anggota Persekutuan Gereja-Gereja di Indonesia / PGI)') ? (
            <h3
              className="kop-header-black text-[10.5px] sm:text-[11.5px] md:text-[13px] font-bold uppercase tracking-wider text-slate-900 leading-tight mt-[1px]"
              style={{ color: '#0f172a' }}
            >
              {settings.headerKopLine1b ?? '(Anggota Persekutuan Gereja-Gereja di Indonesia / PGI)'}
            </h3>
          ) : null}

          {/* BARIS HEADER 2 */}
          <h1
            className="kop-header-black text-xs sm:text-sm md:text-[15px] font-black uppercase tracking-wide text-slate-950 leading-tight mt-[2px]"
            style={{ color: '#0f172a' }}
          >
            {(() => {
              if (settings.headerKopLine2 && settings.namaJemaat && !settings.headerKopLine2.toUpperCase().includes(settings.namaJemaat.toUpperCase())) {
                return `${settings.headerKopLine2} ${settings.namaJemaat.toUpperCase()}`;
              }
              if (settings.headerKopLine2 && settings.headerKopLine2.trim() !== 'MAJELIS JEMAAT GKE') {
                return settings.headerKopLine2;
              }
              return settings.namaJemaat
                ? `MAJELIS JEMAAT GKE ${settings.namaJemaat.toUpperCase()}`
                : 'MAJELIS JEMAAT GKE EFATA PALANGKA RAYA';
            })()}
          </h1>

          {/* BARIS HEADER 3 (Badan Hukum - 2 Baris) - Warna Merah */}
          <div
            className="kop-text-red text-[9px] sm:text-[10px] font-sans normal-case text-red-600 print:text-red-600 leading-[1.2] mt-[2px] font-semibold"
            style={{ color: '#dc2626' }}
            data-kop-red="true"
          >
            <p className="m-0 leading-tight kop-text-red" style={{ color: '#dc2626' }}>
              {settings.headerKopLine3a ||
                'Badan Hukum: Keputusan Menteri Agama RI No. 33 Tahun 1970 Tanggal 27 Mei 1970'}
            </p>
            <p className="m-0 leading-tight kop-text-red" style={{ color: '#dc2626' }}>
              {settings.headerKopLine3b ||
                'SK Dirjen Bimas Kristen Depag RI No. 129 Tahun 1989 Tanggal 18 Juli 1989'}
            </p>
          </div>

          {/* BARIS HEADER 4 (Majelis Resort) */}
          <h3
            className="kop-header-black text-[11px] sm:text-xs md:text-[12.5px] font-bold uppercase tracking-wider text-slate-900 leading-tight mt-[2px]"
            style={{ color: '#0f172a' }}
          >
            {(() => {
              if (settings.headerKopLine4 && settings.resortGke && !settings.headerKopLine4.toUpperCase().includes(settings.resortGke.toUpperCase())) {
                return `${settings.headerKopLine4} ${settings.resortGke.toUpperCase()}`;
              }
              if (settings.headerKopLine4 && settings.headerKopLine4.trim() !== 'MAJELIS RESORT GKE') {
                return settings.headerKopLine4;
              }
              return settings.resortGke
                ? `MAJELIS RESORT GKE ${settings.resortGke.toUpperCase()}`
                : 'MAJELIS RESORT GKE PALANGKA RAYA HULU';
            })()}
          </h3>

          {/* BARIS HEADER 5 (Alamat & No. Telp) - Warna Merah */}
          <p
            className="kop-text-red text-[9px] sm:text-[10px] font-sans normal-case text-red-600 print:text-red-600 mt-[2px] font-medium leading-[1.2]"
            style={{ color: '#dc2626' }}
            data-kop-red="true"
          >
            {settings.headerKopLine5 && !settings.headerKopLine5.includes('undefined')
              ? settings.headerKopLine5
              : `${settings.alamatGereja || 'Jl. Gereja No. 1'} | Telp: ${settings.telepon || '-'} | Email: ${settings.email || '-'}`}
          </p>
        </div>
      </div>

      {/* GARIS PENUTUP KOP SURAT GANDA (1 Garis Tebal dan 1 Garis Tipis) */}
      <div className="w-full mt-1.5 space-y-[2px]" aria-hidden="true">
        <div
          className="border-b-[2.5px] border-black w-full kop-divider-thick"
          style={{ borderColor: '#000000', borderBottomWidth: '2.5px', borderBottomStyle: 'solid' }}
        />
        <div
          className="border-b-[0.8px] border-black w-full kop-divider-thin"
          style={{ borderColor: '#000000', borderBottomWidth: '0.8px', borderBottomStyle: 'solid' }}
        />
      </div>

      {(title || subtitle) && (
        <div className="mt-3 pt-1 border-t border-slate-200">
          {title && (
            <h2 className="text-base font-bold text-slate-900 uppercase tracking-wide font-sans">
              {title}
            </h2>
          )}
          {subtitle && (
            <p className="text-xs text-slate-600 italic mt-0.5">{subtitle}</p>
          )}
        </div>
      )}
    </div>
  );
};
