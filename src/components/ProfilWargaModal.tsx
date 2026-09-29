import React from 'react';
import {
  X,
  FileText,
  HeartCrack,
  Printer,
  Edit2,
  RotateCcw,
  Users,
  Calendar,
  MapPin,
  Phone,
  Church,
  HeartHandshake,
  CheckCircle2,
  AlertCircle,
  User,
  ShieldCheck,
  Award,
} from 'lucide-react';
import { WargaJemaat } from '../types';

interface ProfilWargaModalProps {
  warga: WargaJemaat;
  wargaJemaatList: WargaJemaat[];
  onClose: () => void;
  onSelectWarga: (w: WargaJemaat) => void;
  onOpenWafatModal: (w: WargaJemaat) => void;
  onOpenRevertModal: (w: WargaJemaat) => void;
  onOpenEditModal: (w: WargaJemaat) => void;
  onPrintReport: (config: any) => void;
  canEdit: boolean;
}

const formatIndonesianDate = (dateStr?: string) => {
  if (!dateStr) return '-';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const year = parts[0];
  const monthIdx = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  return `${day} ${months[monthIdx] || ''} ${year}`;
};

const calculateAge = (birthDate?: string, refDate?: string) => {
  if (!birthDate) return '-';
  const b = new Date(birthDate);
  const r = refDate ? new Date(refDate) : new Date();
  let age = r.getFullYear() - b.getFullYear();
  const m = r.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && r.getDate() < b.getDate())) {
    age--;
  }
  return age >= 0 ? `${age} Tahun` : '-';
};

export const ProfilWargaModal: React.FC<ProfilWargaModalProps> = ({
  warga,
  wargaJemaatList,
  onClose,
  onSelectWarga,
  onOpenWafatModal,
  onOpenRevertModal,
  onOpenEditModal,
  onPrintReport,
  canEdit,
}) => {
  const isDeceased = warga.statusKeanggotaan === 'Meninggal' || !!warga.tanggalMeninggal;
  const ageAtDeathOrCurrent = calculateAge(warga.tanggalLahir, warga.tanggalMeninggal);

  // Find all family members with same No. KJJ
  const familyMembers = (warga.noKjj
    ? wargaJemaatList.filter(
        (w) => (w.noKjj || '').trim().toLowerCase() === warga.noKjj.trim().toLowerCase()
      )
    : []
  ).sort((a, b) => {
    const order: Record<string, number> = {
      'Kepala Keluarga': 1,
      'Istri': 2,
      'Anak': 3,
      'Famili Lain': 4,
    };
    return (order[a.hubunganKeluarga] || 5) - (order[b.hubunganKeluarga] || 5);
  });

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-5 overflow-hidden animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden text-slate-100">
        {/* Modal Header */}
        <div
          className={`p-4 sm:p-5 border-b flex items-start justify-between gap-3 shrink-0 ${
            isDeceased
              ? 'bg-gradient-to-r from-purple-950 via-slate-950 to-indigo-950 border-purple-500/30'
              : 'bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 border-slate-800'
          }`}
        >
          <div className="flex items-center gap-3.5 min-w-0">
            {/* Avatar Initials */}
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-base shrink-0 shadow-md ${
                isDeceased
                  ? 'bg-purple-900/60 text-purple-200 border-2 border-purple-400/50'
                  : 'bg-indigo-600/30 text-indigo-300 border-2 border-indigo-400/30'
              }`}
            >
              {isDeceased ? (
                <span className="font-serif text-lg">✝</span>
              ) : (
                warga.namaLengkap.charAt(0).toUpperCase()
              )}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-bold text-slate-100 truncate">
                  {warga.namaLengkap}
                </h2>
                {isDeceased ? (
                  <span className="text-[11px] bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full font-bold border border-purple-500/40 flex items-center gap-1 shadow-xs">
                    <span>✝</span>
                    <span>{warga.jenisKelamin === 'P' ? 'Almarhumah' : 'Almarhum'}</span>
                  </span>
                ) : (
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${
                      warga.statusKeanggotaan === 'Tetap'
                        ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                        : warga.statusKeanggotaan === 'Titipan'
                        ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}
                  >
                    {warga.statusKeanggotaan}
                  </span>
                )}
                <span className="text-[10px] bg-indigo-500/10 text-indigo-300 px-2 py-0.5 rounded-full font-medium border border-indigo-500/20">
                  {warga.hubunganKeluarga}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5 font-mono">
                No. KJJ: <strong className="text-slate-200">{warga.noKjj || '-'}</strong> • Lingkungan: {warga.rayon || '-'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800/80 rounded-xl transition cursor-pointer shrink-0"
            title="Tutup Profil"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs">
          {/* A. Penanda Khusus Profil Warga Wafat (Jika Berpulang) */}
          {isDeceased ? (
            <div className="bg-gradient-to-br from-purple-950/60 via-slate-900 to-indigo-950/60 border border-purple-500/40 rounded-2xl p-4 sm:p-5 space-y-3.5 shadow-md">
              <div className="flex items-center justify-between gap-2 border-b border-purple-500/20 pb-2.5">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    <HeartCrack className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-purple-200">
                      ✝ Telah Berpulang ke Rumah Bapa di Sorga
                    </h3>
                    <p className="text-[10px] text-purple-300/80">
                      Tercatat dalam Buku Induk Registrasi Kematian GKE
                    </p>
                  </div>
                </div>

                <span className="px-2.5 py-1 bg-purple-900/60 border border-purple-400/40 text-purple-200 rounded-lg font-bold text-[11px]">
                  Arsip Warga Wafat
                </span>
              </div>

              {/* Nats Firman Penghiburan */}
              <div className="bg-purple-950/40 border border-purple-500/20 p-3 rounded-xl text-center italic font-serif text-purple-100 text-[11px] leading-relaxed">
                &ldquo;Berbahagialah orang-orang mati yang mati dalam Tuhan, sejak sekarang ini. Sungguh, kata Roh, supaya mereka boleh beristirahat dari jerih lelah mereka, karena segala perbuatan mereka menyertai mereka.&rdquo;
                <span className="block not-italic font-sans font-bold text-[10px] text-purple-300 mt-1">
                  (Wahyu 14:13)
                </span>
              </div>

              {/* Grid Rincian Wafat & Pastoral */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="bg-slate-950/60 p-2.5 rounded-xl border border-purple-500/20">
                  <span className="text-slate-400 text-[10px] block">Hari &amp; Tanggal Berpulang</span>
                  <span className="font-bold text-purple-200 text-xs">
                    ✝ {formatIndonesianDate(warga.tanggalMeninggal)}
                  </span>
                  <span className="text-[10px] text-purple-300 ml-1.5 font-medium">
                    (Usia: {ageAtDeathOrCurrent})
                  </span>
                </div>

                <div className="bg-slate-950/60 p-2.5 rounded-xl border border-purple-500/20">
                  <span className="text-slate-400 text-[10px] block">Tempat Berpulang / RS / Rumah Duka</span>
                  <span className="font-medium text-slate-200 text-xs">
                    {warga.tempatMeninggal || warga.alamat || 'Rumah Duka'}
                  </span>
                </div>

                <div className="bg-slate-950/60 p-2.5 rounded-xl border border-purple-500/20">
                  <span className="text-slate-400 text-[10px] block">Tempat Pemakaman (TPU)</span>
                  <span className="font-medium text-slate-200 text-xs">
                    {warga.tempatPemakaman || 'TPU Kristen'}
                  </span>
                </div>

                <div className="bg-slate-950/60 p-2.5 rounded-xl border border-purple-500/20">
                  <span className="text-slate-400 text-[10px] block">Pelayan Ibadah Pemakaman</span>
                  <span className="font-medium text-slate-200 text-xs">
                    {warga.pelayanPemakaman || 'Pendeta / Majelis Jemaat GKE'}
                  </span>
                </div>

                <div className="bg-slate-950/60 p-2.5 rounded-xl border border-purple-500/20">
                  <span className="text-slate-400 text-[10px] block">Nomor Surat Kematian Resmi</span>
                  <span className="font-mono font-bold text-amber-300 text-xs">
                    {warga.nomorSuratKematian || '-'}
                  </span>
                </div>

                <div className="bg-slate-950/60 p-2.5 rounded-xl border border-purple-500/20">
                  <span className="text-slate-400 text-[10px] block">Keluarga Ditinggalkan (Duka)</span>
                  <span className="font-medium text-slate-200 text-xs truncate block">
                    {warga.keluargaDitinggalkan || `Keluarga ${warga.namaLengkap}`}
                  </span>
                </div>
              </div>

              {warga.keteranganMeninggal && (
                <div className="bg-slate-950/60 p-2.5 rounded-xl border border-purple-500/20 text-xs">
                  <span className="text-slate-400 text-[10px] block font-semibold mb-0.5">
                    Catatan Pastoral &amp; Riwayat Khusus:
                  </span>
                  <p className="text-slate-200 leading-relaxed italic">{warga.keteranganMeninggal}</p>
                </div>
              )}

              {/* Action Buttons for Deceased */}
              <div className="pt-2 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onPrintReport({
                      reportType: 'surat_keterangan_kematian',
                      wargaId: warga.id,
                    });
                  }}
                  className="flex items-center gap-1.5 px-3 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl font-bold text-xs transition shadow-md shadow-amber-600/20 cursor-pointer"
                  title="Cetak Surat Keterangan Kematian Resmi GKE"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Cetak Surat Kematian (Akta)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onPrintReport({
                      reportType: 'surat_duka_cita',
                      wargaId: warga.id,
                    });
                  }}
                  className="flex items-center gap-1.5 px-3 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-bold text-xs transition shadow-md shadow-purple-600/30 cursor-pointer"
                  title="Cetak Surat Pernyataan Duka Cita & Penguatan Iman Majelis Jemaat"
                >
                  <HeartCrack className="w-3.5 h-3.5" />
                  <span>Cetak Surat Duka Cita</span>
                </button>

                {canEdit && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenWafatModal(warga);
                      }}
                      className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-indigo-300 rounded-xl font-semibold text-xs border border-indigo-500/30 transition cursor-pointer"
                      title="Edit rincian tanggal wafat, TPU, atau nomor surat kematian"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Edit Data Wafat</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenRevertModal(warga);
                      }}
                      className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-teal-300 rounded-xl font-semibold text-xs border border-teal-500/30 transition cursor-pointer ml-auto"
                      title="Kembalikan status anggota aktif jika ada kekeliruan pencatatan"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Kembalikan Status Aktif</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          ) : (
            /* B. Quick Actions for Active Member */
            <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-3.5 flex flex-wrap items-center justify-between gap-2.5">
              <div className="flex items-center gap-2 text-xs">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-slate-300 font-semibold">
                  Status Anggota: <strong className="text-emerald-400">Aktif ({warga.statusKeanggotaan})</strong>
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onPrintReport({
                      reportType: 'kartu_keluarga_jemaat',
                      noKjj: warga.noKjj,
                    });
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-300 rounded-xl font-semibold text-xs border border-emerald-500/30 transition cursor-pointer"
                  title="Cetak Kartu Keluarga Jemaat (KKJ)"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Cetak KKJ</span>
                </button>

                {canEdit && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenWafatModal(warga);
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-950/60 hover:bg-purple-900/80 text-purple-300 rounded-xl font-bold text-xs border border-purple-500/40 transition cursor-pointer"
                      title="Pindahkan warga jemaat ini ke Arsip Khusus Warga Wafat"
                    >
                      <HeartCrack className="w-3.5 h-3.5 text-purple-400" />
                      <span>Pindahkan ke Arsip Wafat</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenEditModal(warga);
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold text-xs transition cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Edit Profil</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          )}

          {/* C. Data Identitas Pribadi */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 space-y-3">
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <User className="w-3.5 h-3.5 text-indigo-400" />
              <span>Identitas Kependudukan &amp; Pribadi</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2.5">
              <div>
                <span className="text-slate-400 text-[10px] block">NIK (Nomor Induk Kependudukan)</span>
                <span className="font-mono font-medium text-slate-200">{warga.nik || '-'}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] block">Jenis Kelamin</span>
                <span className="font-medium text-slate-200">
                  {warga.jenisKelamin === 'L' ? 'Laki-Laki' : 'Perempuan'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] block">Tempat, Tanggal Lahir</span>
                <span className="font-medium text-slate-200">
                  {warga.tempatLahir || '-'}, {formatIndonesianDate(warga.tanggalLahir)} ({calculateAge(warga.tanggalLahir)})
                </span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] block">Status Pernikahan</span>
                <span className="font-medium text-slate-200">
                  {warga.statusNikah || 'Belum Menikah'} {warga.tanggalNikah ? `(${formatIndonesianDate(warga.tanggalNikah)})` : ''}
                </span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] block">Pekerjaan</span>
                <span className="font-medium text-slate-200">{warga.pekerjaan || '-'}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] block">Nomor Telepon / WhatsApp</span>
                <span className="font-mono text-slate-200">{warga.noHp || '-'}</span>
              </div>
              <div className="sm:col-span-2">
                <span className="text-slate-400 text-[10px] block">Alamat Tempat Tinggal</span>
                <span className="font-medium text-slate-200">{warga.alamat || 'Belum dicatat'}</span>
              </div>
            </div>
          </div>

          {/* D. Data Sakramen & Keanggotaan Gerejawi */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 space-y-3">
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <Church className="w-3.5 h-3.5 text-indigo-400" />
              <span>Status Pelayanan Sakramen &amp; Gerejawi</span>
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800 text-center">
                <span className="text-slate-400 text-[10px] block mb-1">Sakramen Baptis</span>
                <span
                  className={`inline-block px-2 py-0.5 rounded-md text-[11px] font-bold ${
                    warga.statusBaptis
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {warga.statusBaptis ? '✓ Sudah Baptis' : 'Belum'}
                </span>
              </div>

              <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800 text-center">
                <span className="text-slate-400 text-[10px] block mb-1">Peneguhan SIDI</span>
                <span
                  className={`inline-block px-2 py-0.5 rounded-md text-[11px] font-bold ${
                    warga.statusSidi
                      ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {warga.statusSidi ? '✓ Sudah Sidi' : 'Belum'}
                </span>
              </div>

              <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800 text-center">
                <span className="text-slate-400 text-[10px] block mb-1">Keanggotaan</span>
                <span className="font-bold text-slate-200 text-xs">
                  {warga.statusKeanggotaan}
                </span>
              </div>

              <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800 text-center">
                <span className="text-slate-400 text-[10px] block mb-1">Lingkungan / Sektor</span>
                <span className="font-medium text-slate-300 text-[11px] truncate block">
                  {warga.rayon || '-'}
                </span>
              </div>
            </div>
          </div>

          {/* E. Susunan Anggota Keluarga Serumah (KJJ yang Sama) */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <Users className="w-3.5 h-3.5 text-emerald-400" />
                <span>Anggota Keluarga dalam KKJ {warga.noKjj} ({familyMembers.length} Jiwa)</span>
              </h4>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  onPrintReport({
                    reportType: 'kartu_keluarga_jemaat',
                    noKjj: warga.noKjj,
                  });
                }}
                className="text-[11px] font-bold text-emerald-400 hover:text-emerald-300 transition flex items-center gap-1 cursor-pointer"
              >
                <Printer className="w-3 h-3" />
                <span>Cetak KKJ</span>
              </button>
            </div>

            <div className="divide-y divide-slate-800/60 border border-slate-800 rounded-xl overflow-hidden">
              {familyMembers.length === 0 ? (
                <div className="p-3 text-center text-slate-400 text-xs">
                  Belum ada anggota keluarga lain yang terhubung dengan nomor KJJ ini.
                </div>
              ) : (
                familyMembers.map((member) => {
                  const isCurrent = member.id === warga.id;
                  const memberDeceased = member.statusKeanggotaan === 'Meninggal' || !!member.tanggalMeninggal;

                  return (
                    <div
                      key={member.id}
                      className={`p-2.5 sm:p-3 flex items-center justify-between gap-3 transition ${
                        isCurrent
                          ? 'bg-indigo-950/30 font-bold border-l-2 border-indigo-500'
                          : 'hover:bg-slate-800/40'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                            memberDeceased
                              ? 'bg-purple-900/60 text-purple-300 border border-purple-500/40'
                              : 'bg-slate-800 text-slate-300'
                          }`}
                        >
                          {memberDeceased ? '✝' : member.namaLengkap.charAt(0).toUpperCase()}
                        </span>

                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className={`text-xs truncate ${isCurrent ? 'text-indigo-300' : 'text-slate-200'}`}>
                              {member.namaLengkap}
                            </span>
                            {memberDeceased && (
                              <span className="text-[9px] bg-purple-500/20 text-purple-300 px-1.5 py-0.2 rounded font-bold border border-purple-500/30">
                                {member.jenisKelamin === 'P' ? 'Almh.' : 'Alm.'}
                              </span>
                            )}
                            {isCurrent && (
                              <span className="text-[9px] bg-indigo-500/20 text-indigo-300 px-1.5 py-0.2 rounded font-semibold">
                                Profil Saat Ini
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-400">
                            {member.hubunganKeluarga} • Usia: {calculateAge(member.tanggalLahir, member.tanggalMeninggal)} • Baptis: {member.statusBaptis ? '✓' : '✗'} • Sidi: {member.statusSidi ? '✓' : '✗'}
                          </p>
                        </div>
                      </div>

                      {!isCurrent && (
                        <button
                          type="button"
                          onClick={() => onSelectWarga(member)}
                          className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-[10px] font-medium transition cursor-pointer shrink-0 border border-slate-700"
                        >
                          Lihat Profil
                        </button>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between gap-3 shrink-0">
          <div className="text-[11px] text-slate-400">
            {isDeceased ? (
              <span className="text-purple-300">
                ✝ Warga telah berpulang • Status kekal dalam arsip jemaat
              </span>
            ) : (
              <span>Status Administrasi: Aktif &amp; Terdaftar</span>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-bold text-xs transition cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
