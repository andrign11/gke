import React, { useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  FileText,
  Key,
  Plus,
  Printer,
  RefreshCw,
  Search,
  ShieldCheck,
  Trash2,
  UserCheck,
  UserPlus,
  X,
  XCircle,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { PendaftaranAnggota } from '../../types';
import { generateUsername, generateRandomPassword } from '../../utils/credentialUtils';
import { DeleteConfirmModal } from '../DeleteConfirmModal';

export const PendaftaranAnggotaModule: React.FC = () => {
  const {
    pendaftaranList,
    addPendaftaran,
    approvePendaftaran,
    rejectPendaftaran,
    deletePendaftaran,
    openPrintReport,
    currentUser,
    lingkunganList,
  } = useApp();

  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('semua');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [confirmModalItem, setConfirmModalItem] = useState<PendaftaranAnggota | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PendaftaranAnggota | null>(null);
  const [catatanMPHInput, setCatatanMPHInput] = useState('');

  const defaultRayon =
    lingkunganList && lingkunganList.find((l) => l.status === 'Aktif')?.nama
      ? lingkunganList.find((l) => l.status === 'Aktif')!.nama
      : 'Lingkungan I - Ebenezer';

  // Form State
  const [formData, setFormData] = useState({
    namaLengkap: '',
    nik: '',
    noKjj: '',
    jenisKelamin: 'L' as 'L' | 'P',
    tempatLahir: 'Palangka Raya',
    tanggalLahir: '1995-05-15',
    rayon: defaultRayon,
    statusKeanggotaan: 'Tetap' as 'Tetap' | 'Titipan' | 'Calon Warga',
    statusBaptis: true,
    statusSidi: true,
    statusNikah: 'Menikah' as 'Belum Menikah' | 'Menikah' | 'Janda/Duda',
    pekerjaan: 'Pegawai Negeri Sipil (PNS)',
    alamat: 'Jl. RTA Milono Km 2.5, Palangka Raya',
    noHp: '081234567890',
    hubunganKeluarga: 'Kepala Keluarga' as 'Kepala Keluarga' | 'Istri' | 'Anak' | 'Lainnya',
    catatanTambahan: 'Surat Atestasi dari Jemaat Asal Lampiran Terlampir',
    username: '',
    password: '',
  });

  const isMPHOrAdmin =
    currentUser.role === 'admin' ||
    currentUser.role === 'sekretaris' ||
    currentUser.role === 'bendahara';

  const handleOpenAdd = () => {
    const initialName = '';
    const initialNik = '';
    setFormData({
      namaLengkap: initialName,
      nik: initialNik,
      noKjj: `KJJ-GKE-${Math.floor(100 + Math.random() * 900)}`,
      jenisKelamin: 'L',
      tempatLahir: 'Palangka Raya',
      tanggalLahir: '1995-05-15',
      rayon: defaultRayon,
      statusKeanggotaan: 'Tetap',
      statusBaptis: true,
      statusSidi: true,
      statusNikah: 'Belum Menikah',
      pekerjaan: 'Swasta / Wiraswasta',
      alamat: '',
      noHp: '',
      hubunganKeluarga: 'Kepala Keluarga',
      catatanTambahan: '',
      username: generateUsername('warga', ''),
      password: generateRandomPassword(),
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.namaLengkap || !formData.alamat) {
      alert('Mohon isi nama lengkap dan alamat!');
      return;
    }
    addPendaftaran(formData);
    setIsModalOpen(false);
  };

  const handleApproveAction = (item: PendaftaranAnggota) => {
    approvePendaftaran(
      item.id,
      catatanMPHInput || 'Disetujui dan dikonfirmasi resmi oleh Kepengurusan MPH Majelis Jemaat GKE'
    );
    setConfirmModalItem(null);
    setCatatanMPHInput('');
  };

  const handleRejectAction = (item: PendaftaranAnggota) => {
    rejectPendaftaran(
      item.id,
      catatanMPHInput || 'Berkas/Dokumen belum memenuhi syarat atestasi jemaat'
    );
    setConfirmModalItem(null);
    setCatatanMPHInput('');
  };

  const filteredList = pendaftaranList.filter((item) => {
    const matchesSearch =
      item.namaLengkap.toLowerCase().includes(search.toLowerCase()) ||
      item.noKjj.toLowerCase().includes(search.toLowerCase()) ||
      item.nik.includes(search) ||
      item.rayon.toLowerCase().includes(search.toLowerCase());

    const matchesStatus =
      filterStatus === 'semua' || item.statusKonfirmasiMPH === filterStatus;

    return matchesSearch && matchesStatus;
  });

  const pendingCount = pendaftaranList.filter(
    (p) => p.statusKonfirmasiMPH === 'Menunggu Konfirmasi'
  ).length;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800/80 shadow-lg backdrop-blur-md flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <UserPlus className="w-5 h-5" />
            </div>
            Pendaftaran Anggota Jemaat Baru
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Modul Layanan Pendaftaran Warga Jemaat Baru & Alur Konfirmasi Resmi MPH (Majelis Pekerja Harian) Jemaat GKE
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-all shadow-md shadow-amber-600/25"
          >
            <Plus className="w-4 h-4" />
            <span>Form Pendaftaran Baru</span>
          </button>

          <button
            onClick={() => openPrintReport({ reportType: 'pendaftaran_warga' })}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-4 py-2.5 rounded-xl transition-all border border-slate-700"
          >
            <Printer className="w-4 h-4 text-emerald-400" />
            <span>Cetak Rekap MPH</span>
          </button>
        </div>
      </div>

      {/* Info Notice Banner */}
      <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 flex items-start gap-3 text-amber-200 text-xs">
        <ShieldCheck className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div>
          <p className="font-bold text-amber-300">
            Alur Konfirmasi Majelis Pekerja Harian (MPH):
          </p>
          <p className="mt-0.5 text-amber-200/80">
            Pendaftaran baru yang masuk berstatus <span className="font-semibold text-amber-300">Menunggu Konfirmasi</span>.
            Setelah pengurus MPH memverifikasi dan menekan tombol <span className="font-semibold text-emerald-400">"Setujui Konfirmasi"</span>,
            data anggota akan secara otomatis terdaftar langsung ke dalam Database Utama Warga Jemaat.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-900/80 p-4 rounded-2xl border border-slate-800/80 text-xs backdrop-blur-md">
        <div className="relative col-span-2">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Cari nama lengkap / KJJ / NIK / Rayon..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-xs"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-slate-400 font-medium text-[11px] whitespace-nowrap">Status MPH:</span>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full py-2.5 px-3 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-200 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-xs"
          >
            <option value="semua">Semua Status Pendaftaran</option>
            <option value="Menunggu Konfirmasi">Menunggu Konfirmasi ({pendingCount})</option>
            <option value="Disetujui">Disetujui MPH</option>
            <option value="Ditolak">Ditolak</option>
          </select>
        </div>
      </div>

      {/* Table List */}
      <div className="bg-slate-900/80 rounded-2xl border border-slate-800/80 overflow-hidden shadow-lg backdrop-blur-md">
        <div className="overflow-x-auto w-full max-w-full">
          <table className="w-full min-w-[850px] text-xs text-left text-slate-300">
            <thead className="bg-slate-950/80 text-slate-200 font-bold border-b border-slate-800 uppercase text-[11px] tracking-wider whitespace-nowrap">
              <tr>
                <th className="p-3.5 w-12 text-center">No</th>
                <th className="p-3.5">Tgl Daftar</th>
                <th className="p-3.5">No. KJJ & NIK</th>
                <th className="p-3.5">Nama & Alamat</th>
                <th className="p-3.5">Akun Warga (User / Password)</th>
                <th className="p-3.5">Rayon & Sakramen</th>
                <th className="p-3.5 text-center">Status Konfirmasi MPH</th>
                <th className="p-3.5 text-center">Aksi / Verifikasi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-500">
                    Tidak ada pendaftaran anggota jemaat ditemukan.
                  </td>
                </tr>
              ) : (
                filteredList.map((item, idx) => (
                  <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-3.5 text-center font-mono text-slate-500">{idx + 1}</td>
                    <td className="p-3.5 whitespace-nowrap text-slate-400 font-mono">
                      {item.tanggalDaftar}
                    </td>
                    <td className="p-3.5 whitespace-nowrap">
                      <div className="font-bold text-amber-400 font-mono">{item.noKjj}</div>
                      <div className="text-[10px] text-slate-500 font-mono">NIK: {item.nik}</div>
                    </td>
                    <td className="p-3.5">
                      <div className="font-bold text-slate-100 text-sm">{item.namaLengkap}</div>
                      <div className="text-[11px] text-slate-400">{item.alamat}</div>
                      <div className="text-[10px] text-slate-500 italic mt-0.5">
                        No. HP: {item.noHp || '-'}
                      </div>
                    </td>
                    <td className="p-3.5">
                      <div className="bg-slate-950/90 border border-slate-800 p-2 rounded-xl text-xs space-y-1">
                        <div className="flex items-center gap-1.5 text-emerald-400 font-mono font-bold">
                          <Key className="w-3 h-3 text-emerald-500 shrink-0" />
                          <span>{item.username || generateUsername(item.namaLengkap, item.nik)}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-amber-300 font-mono text-[11px]">
                          <span className="text-slate-500 text-[10px] font-sans">Pass:</span>
                          <span className="bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20 font-bold">
                            {item.password || 'GKE8x39A'}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="p-3.5">
                      <div className="font-semibold text-slate-200">{item.rayon}</div>
                      <div className="text-[10px] text-slate-400 mb-1">
                        {item.statusKeanggotaan} ({item.hubunganKeluarga})
                      </div>
                      <div className="flex gap-1">
                        <span
                          className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${
                            item.statusBaptis
                              ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
                              : 'bg-slate-800 text-slate-500'
                          }`}
                        >
                          {item.statusBaptis ? 'Baptis' : 'Belum Baptis'}
                        </span>
                        <span
                          className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${
                            item.statusSidi
                              ? 'bg-purple-500/15 text-purple-400 border border-purple-500/30'
                              : 'bg-slate-800 text-slate-500'
                          }`}
                        >
                          {item.statusSidi ? 'Sidi' : 'Belum Sidi'}
                        </span>
                      </div>
                    </td>
                    <td className="p-3.5 text-center">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                          item.statusKonfirmasiMPH === 'Disetujui'
                            ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                            : item.statusKonfirmasiMPH === 'Ditolak'
                            ? 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                            : 'bg-amber-500/15 text-amber-400 border-amber-500/30 animate-pulse'
                        }`}
                      >
                        {item.statusKonfirmasiMPH === 'Disetujui' && (
                          <CheckCircle2 className="w-3 h-3" />
                        )}
                        {item.statusKonfirmasiMPH === 'Ditolak' && <XCircle className="w-3 h-3" />}
                        {item.statusKonfirmasiMPH === 'Menunggu Konfirmasi' && (
                          <Clock className="w-3 h-3" />
                        )}
                        <span>{item.statusKonfirmasiMPH}</span>
                      </span>
                      {item.catatanMPH && (
                        <div className="text-[10px] text-slate-400 italic mt-1 max-w-xs mx-auto">
                          "{item.catatanMPH}"
                        </div>
                      )}
                    </td>
                    <td className="p-3.5 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {isMPHOrAdmin && item.statusKonfirmasiMPH === 'Menunggu Konfirmasi' && (
                          <button
                            onClick={() => {
                              setConfirmModalItem(item);
                              setCatatanMPHInput('');
                            }}
                            className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-[11px] shadow-sm transition-all"
                          >
                            Verifikasi MPH
                          </button>
                        )}
                        {item.statusKonfirmasiMPH !== 'Menunggu Konfirmasi' && (
                          <span className="text-[10px] text-slate-500 font-mono">
                            {item.tanggalKonfirmasi || '-'}
                          </span>
                        )}
                        {isMPHOrAdmin && (
                          <button
                            onClick={() => setDeleteTarget(item)}
                            className="p-1.5 text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer min-w-[32px] min-h-[32px] flex items-center justify-center"
                            title="Hapus Data Pendaftaran & Akun Connected"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Verification Dialog Modal for MPH */}
      {confirmModalItem && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-800 text-slate-100 p-5 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="font-bold text-sm text-amber-400 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5" />
                Konfirmasi MPH Majelis Jemaat
              </h3>
              <button
                onClick={() => setConfirmModalItem(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs space-y-1.5">
              <p className="font-bold text-slate-200">{confirmModalItem.namaLengkap}</p>
              <p className="text-slate-400">KJJ: {confirmModalItem.noKjj} | Rayon: {confirmModalItem.rayon}</p>
              <p className="text-slate-400">Alamat: {confirmModalItem.alamat}</p>
              
              <div className="mt-2 pt-2 border-t border-slate-800/80 bg-emerald-950/30 p-2 rounded-lg border border-emerald-500/20 text-emerald-300 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-emerald-400/70 block uppercase font-bold">Akun Portal Yang Akan Diaktifkan:</span>
                  <span className="font-mono font-bold text-emerald-300">User: {confirmModalItem.username || generateUsername(confirmModalItem.namaLengkap, confirmModalItem.nik)}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-amber-400/70 block uppercase font-bold">Password Random:</span>
                  <span className="font-mono font-bold text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded border border-amber-500/30">
                    {confirmModalItem.password || 'GKE8x39A'}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Catatan Kepengurusan MPH:
              </label>
              <textarea
                rows={3}
                value={catatanMPHInput || ''}
                onChange={(e) => setCatatanMPHInput(e.target.value)}
                placeholder="Tuliskan catatan verifikasi atau alasan persetujuan/penolakan..."
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => handleApproveAction(confirmModalItem)}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Setujui Konfirmasi</span>
              </button>
              <button
                onClick={() => handleRejectAction(confirmModalItem)}
                className="py-2.5 px-4 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5"
              >
                <XCircle className="w-4 h-4" />
                <span>Tolak</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Input Registration Form Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-800 text-slate-100">
            <div className="bg-slate-950 p-4 px-5 border-b border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-sm text-amber-400 flex items-center gap-2">
                <UserPlus className="w-4 h-4" />
                Form Pendaftaran Anggota Jemaat Baru
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Nama Lengkap & Gelar *</label>
                  <input
                    type="text"
                    required
                    value={formData.namaLengkap || ''}
                    onChange={(e) => setFormData({ ...formData, namaLengkap: e.target.value })}
                    placeholder="Contoh: Bpk. Markus S.Pd"
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Nomor KJJ (Otomatis)</label>
                  <input
                    type="text"
                    required
                    value={formData.noKjj || ''}
                    onChange={(e) => setFormData({ ...formData, noKjj: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-amber-400 font-mono focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">NIK (No. KTP)</label>
                  <input
                    type="text"
                    required
                    value={formData.nik || ''}
                    onChange={(e) => setFormData({ ...formData, nik: e.target.value })}
                    placeholder="627101xxxxxx"
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Jenis Kelamin</label>
                  <select
                    value={formData.jenisKelamin || 'L'}
                    onChange={(e) =>
                      setFormData({ ...formData, jenisKelamin: e.target.value as 'L' | 'P' })
                    }
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-amber-500"
                  >
                    <option value="L">Laki-Laki</option>
                    <option value="P">Perempuan</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Tempat Lahir</label>
                  <input
                    type="text"
                    value={formData.tempatLahir || ''}
                    onChange={(e) => setFormData({ ...formData, tempatLahir: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Tanggal Lahir</label>
                  <input
                    type="date"
                    value={formData.tanggalLahir || ''}
                    onChange={(e) => setFormData({ ...formData, tanggalLahir: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Lingkungan / Sektor</label>
                  <select
                    value={
                      formData.rayon ||
                      (lingkunganList && lingkunganList.length > 0
                        ? lingkunganList.filter((l) => l.status === 'Aktif')[0]?.nama || 'Lingkungan I - Ebenezer'
                        : 'Lingkungan I - Ebenezer')
                    }
                    onChange={(e) => setFormData({ ...formData, rayon: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-amber-500"
                  >
                    {lingkunganList && lingkunganList.length > 0 ? (
                      lingkunganList
                        .filter((l) => l.status === 'Aktif')
                        .map((l) => (
                          <option key={l.id} value={l.nama}>
                            {l.nama} {l.wilayahSektor ? `(${l.wilayahSektor})` : ''}
                          </option>
                        ))
                    ) : (
                      <>
                        <option value="Lingkungan I - Ebenezer">Lingkungan I - Ebenezer</option>
                        <option value="Lingkungan II - Yerusalem">Lingkungan II - Yerusalem</option>
                        <option value="Lingkungan III - Bethel">Lingkungan III - Bethel</option>
                        <option value="Lingkungan IV - Sion">Lingkungan IV - Sion</option>
                        <option value="Lingkungan V - Filadelfia">Lingkungan V - Filadelfia</option>
                      </>
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Hubungan Keluarga</label>
                  <select
                    value={formData.hubunganKeluarga || 'Kepala Keluarga'}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        hubunganKeluarga: e.target.value as 'Kepala Keluarga' | 'Istri' | 'Anak' | 'Lainnya',
                      })
                    }
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-amber-500"
                  >
                    <option value="Kepala Keluarga">Kepala Keluarga</option>
                    <option value="Istri">Istri</option>
                    <option value="Anak">Anak</option>
                    <option value="Lainnya">Lainnya</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">No. Telepon / WhatsApp</label>
                  <input
                    type="text"
                    value={formData.noHp || ''}
                    onChange={(e) => setFormData({ ...formData, noHp: e.target.value })}
                    placeholder="0812xxxxxxxx"
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Pekerjaan</label>
                  <input
                    type="text"
                    value={formData.pekerjaan || ''}
                    onChange={(e) => setFormData({ ...formData, pekerjaan: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Auto Generated User Credentials Card */}
              <div className="p-3.5 bg-slate-950/90 rounded-2xl border border-amber-500/20 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-2">
                    <Key className="w-4 h-4 text-amber-400" />
                    <span className="font-bold text-amber-300 text-xs">Akun Akses Portal Warga (Otomatis & Random)</span>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setFormData((prev) => ({
                        ...prev,
                        password: generateRandomPassword(),
                      }))
                    }
                    className="text-[11px] flex items-center gap-1 text-slate-400 hover:text-amber-300 transition-colors"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Acak Password Lagi</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1 text-[11px] font-semibold">
                      Username / User (Diambil Otomatis)
                    </label>
                    <input
                      type="text"
                      required
                      value={
                        formData.username ||
                        generateUsername(formData.namaLengkap, formData.nik) ||
                        ''
                      }
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      placeholder="Username warga..."
                      className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-emerald-400 font-mono font-bold focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1 text-[11px] font-semibold">
                      Password / Kata Sandi (Acak System)
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.password || ''}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-amber-300 font-mono font-bold focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
                <p className="text-[10px] text-slate-500 italic">
                  * Akun dan password acak di atas akan otomatis diaktifkan untuk portal login warga setelah dikonfirmasi oleh MPH.
                </p>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Alamat Rumah Lengkap *</label>
                <textarea
                  rows={2}
                  required
                  value={formData.alamat || ''}
                  onChange={(e) => setFormData({ ...formData, alamat: e.target.value })}
                  placeholder="Jl. RTA Milono, Palangka Raya..."
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex gap-4 border-t border-slate-800 pt-3">
                <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                  <input
                    type="checkbox"
                    checked={formData.statusBaptis}
                    onChange={(e) => setFormData({ ...formData, statusBaptis: e.target.checked })}
                    className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 bg-slate-950 border-slate-800"
                  />
                  <span>Sudah Dibaptis Kudus</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                  <input
                    type="checkbox"
                    checked={formData.statusSidi}
                    onChange={(e) => setFormData({ ...formData, statusSidi: e.target.checked })}
                    className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 bg-slate-950 border-slate-800"
                  />
                  <span>Sudah Mengaku Percaya (Sidi)</span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold"
                >
                  Kirim Pendaftaran
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Confirm Delete */}
      <DeleteConfirmModal
        isOpen={!!deleteTarget}
        title="Konfirmasi Hapus Data Pendaftaran Anggota"
        itemName={deleteTarget ? `${deleteTarget.namaLengkap} (No. KJJ: ${deleteTarget.noKjj})` : ''}
        description="Apakah Anda yakin ingin menghapus data pendaftaran anggota jemaat baru ini? Akun pengguna dan role hak akses user yang terhubung akan secara otomatis terhapus dari sistem."
        onConfirm={async () => {
          if (deleteTarget) {
            await deletePendaftaran(deleteTarget.id);
          }
        }}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
};
