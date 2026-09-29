import React, { useState } from 'react';
import {
  Edit2,
  Eye,
  EyeOff,
  FolderArchive,
  Key,
  Lock,
  Plus,
  ShieldCheck,
  Trash2,
  UserCheck,
  Users,
  X,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  FileText,
  DollarSign,
  Calendar,
  Layers,
  Sparkles,
  Loader2,
  ShieldAlert,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { UserAccount, UserRole } from '../../types';

interface RolePermissionInfo {
  name: string;
  badgeClass: string;
  description: string;
  permissions: string[];
}

const ROLE_DETAILS: Record<UserRole, RolePermissionInfo> = {
  admin: {
    name: 'Administrator (Akses Penuh)',
    badgeClass: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
    description: 'Memiliki otoritas tertinggi untuk mengelola seluruh sistem informasi jemaat, keamanan, dan data.',
    permissions: [
      'Akses Penuh Seluruh Modul & Fitur Sistem',
      'Manajemen Akun Pengguna & Pengaturan Role Hak Akses',
      'Pengaturan Identitas Gereja, Kop Surat, & Penandatangan Resmi',
      'Ekspor / Impor Backup JSON Database & Audit Log Aktivitas',
      'Pengelolaan Keuangan, Data Warga, Inventaris, & Pelayanan Sakramen',
    ],
  },
  bendahara: {
    name: 'Bendahara (Otoritas Keuangan)',
    badgeClass: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    description: 'Diberikan wewenang khusus dalam pencatatan dan pelaporan keuangan serta kas jemaat.',
    permissions: [
      'Pencatatan Pemasukan & Pengeluaran Kas Jemaat',
      'Pengelolaan Pos Kas (Umum, Pembangunan, Diakonia, Kategorial)',
      'Akses Dasbor Visualisasi Arus Kas & Analisis Anggaran',
      'Cetak Laporan Keuangan Berkala & Rekapitulasi Kas Warta',
      'Akses Pembacaan Warta & Informasi Jemaat',
    ],
  },
  sekretaris: {
    name: 'Sekretaris (Administrasi & Ibadah)',
    badgeClass: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
    description: 'Bertanggung jawab atas administrasi keanggotaan jemaat, surat-menyurat, sakramen, dan jadwal kebaktian.',
    permissions: [
      'Pencatatan & Pembaruan Data Warga Jemaat & Rayon Lingkungan',
      'Pengelolaan Jadwal Ibadah, Petugas Pelayan Firman, & Pelayanan Sakramen (Baptis, Sidi, Nikah)',
      'Penyusunan & Penerbitan Berita Warta Jemaat Mingguan',
      'Pengelolaan Agenda Surat Masuk & Keluar serta Pencatatan Inventaris Aset',
      'Akses Penuh Modul Renungan & Publikasi Warta',
    ],
  },
  warga: {
    name: 'Warga Jemaat (Akses Publik / Informasi)',
    badgeClass: 'bg-slate-800 text-slate-300 border-slate-700',
    description: 'Hak akses terbatas untuk melihat warta jemaat, jadwal kebaktian, dan mengajukan formulir sakramen.',
    permissions: [
      'Melihat & Membaca Warta Jemaat dan Jadwal Ibadah',
      'Membaca Renungan Harian & Informasi Pastoral',
      'Mengajukan Permohonan Pelayanan Sakramen (Baptis, Sidi, Nikah)',
      'Melihat Profil Diri dan Informasi Publik Jemaat',
    ],
  },
};

export const UserManagementModule: React.FC = () => {
  const {
    userAccounts,
    addUserAccount,
    updateUserAccount,
    deleteUserAccount,
    currentUser,
  } = useApp();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserAccount | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<UserAccount | null>(null);
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});
  const [showModalPassword, setShowModalPassword] = useState(false);

  // Confirmation modal states
  const [pendingConfirmSave, setPendingConfirmSave] = useState<{
    mode: 'tambah' | 'edit';
    id?: string;
    data: Omit<UserAccount, 'id'>;
  } | null>(null);
  const [isSavingInProgress, setIsSavingInProgress] = useState(false);
  const [isDeletingInProgress, setIsDeletingInProgress] = useState(false);

  const [formData, setFormData] = useState<Omit<UserAccount, 'id'>>({
    username: '',
    namaLengkap: '',
    email: '',
    role: 'warga',
    status: 'aktif',
    noHp: '',
    password: '',
  });

  if (!currentUser || currentUser.role !== 'admin') {
    return (
      <div className="bg-amber-500/10 border border-amber-500/30 text-amber-300 p-6 rounded-2xl flex items-center gap-3 backdrop-blur-md">
        <FolderArchive className="w-6 h-6 text-amber-400 flex-shrink-0" />
        <div>
          <h3 className="font-bold text-sm text-slate-100">Akses Khusus Admin</h3>
          <p className="text-xs text-amber-300/80 mt-0.5">
            Manajemen Akun dan Pengaturan Role Hak Akses hanya dapat diakses oleh Administrator.
          </p>
        </div>
      </div>
    );
  }

  const togglePasswordVisibility = (userId: string) => {
    setVisiblePasswords((prev) => ({
      ...prev,
      [userId]: !prev[userId],
    }));
  };

  const handleOpenAdd = () => {
    setEditingUser(null);
    setFormData({
      username: '',
      namaLengkap: '',
      email: '',
      role: 'sekretaris',
      status: 'aktif',
      noHp: '',
      password: '123',
    });
    setShowModalPassword(true);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (user: UserAccount) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      namaLengkap: user.namaLengkap,
      email: user.email,
      role: user.role,
      status: user.status,
      noHp: user.noHp || '',
      password: user.password || (user.username === 'admin' ? 'admin' : '123'),
    });
    setShowModalPassword(true);
    setIsModalOpen(true);
  };

  const cleanCurrentUsername = (formData.username || '').trim().toLowerCase().replace(/^@+/, '');
  const isDuplicateUsername = Boolean(
    cleanCurrentUsername &&
    userAccounts.some((u) => {
      if (editingUser && u.id === editingUser.id) return false;
      return (u.username || '').trim().toLowerCase().replace(/^@+/, '') === cleanCurrentUsername;
    })
  );

  // Step 1: When user submits the form, open the confirmation popup
  const handleInitiateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.username.trim() || !formData.namaLengkap.trim()) {
      return;
    }
    if (isDuplicateUsername) {
      alert(`Username "@${cleanCurrentUsername}" sudah terdaftar pada akun lain! Harap gunakan username yang unik agar tidak terjadi kesalahan saat login.`);
      return;
    }
    setPendingConfirmSave({
      mode: editingUser ? 'edit' : 'tambah',
      id: editingUser ? editingUser.id : undefined,
      data: {
        ...formData,
        username: cleanCurrentUsername,
      },
    });
  };

  // Step 2: When admin confirms in the confirmation popup
  const handleExecuteSave = async () => {
    if (!pendingConfirmSave) return;
    try {
      setIsSavingInProgress(true);
      if (pendingConfirmSave.mode === 'edit' && pendingConfirmSave.id) {
        await updateUserAccount(pendingConfirmSave.id, pendingConfirmSave.data);
      } else {
        await addUserAccount(pendingConfirmSave.data);
      }
      await new Promise((res) => setTimeout(res, 250));
      setPendingConfirmSave(null);
      setIsModalOpen(false);
    } catch (err) {
      console.error('Error saving user account:', err);
    } finally {
      setIsSavingInProgress(false);
    }
  };

  // Step 3: When admin confirms delete in confirmation popup
  const handleExecuteDelete = async () => {
    if (!deleteTarget) return;
    try {
      setIsDeletingInProgress(true);
      await deleteUserAccount(deleteTarget.id);
      await new Promise((res) => setTimeout(res, 250));
      setDeleteTarget(null);
    } catch (err) {
      console.error('Error deleting user account:', err);
    } finally {
      setIsDeletingInProgress(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800/80 shadow-lg backdrop-blur-md flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <FolderArchive className="w-5 h-5" />
            </div>
            Manajemen Akun Pengguna &amp; Role Hak Akses
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Pendaftaran Pengguna, Penentuan Role (Admin, Bendahara, Sekretaris, Warga Jemaat) dengan Konfirmasi Akses
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-all shadow-md shadow-indigo-600/30 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Akun Baru</span>
        </button>
      </div>

      {/* User Accounts Table */}
      <div className="bg-slate-900/80 rounded-2xl border border-slate-800/80 overflow-hidden shadow-lg backdrop-blur-md">
        <div className="overflow-x-auto w-full max-w-full">
          <table className="w-full min-w-[800px] text-xs text-left text-slate-300">
            <thead className="bg-slate-950/80 text-slate-200 font-bold border-b border-slate-800 uppercase text-[11px] tracking-wider whitespace-nowrap">
              <tr>
                <th className="p-3.5 w-12 text-center">No</th>
                <th className="p-3.5">Username</th>
                <th className="p-3.5">Password</th>
                <th className="p-3.5">Nama Lengkap</th>
                <th className="p-3.5">Email &amp; Kontak</th>
                <th className="p-3.5">Role Hak Akses</th>
                <th className="p-3.5 text-center">Status</th>
                <th className="p-3.5">Terakhir Login</th>
                <th className="p-3.5 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {userAccounts.map((user, idx) => {
                const isPasswordShown = !!visiblePasswords[user.id];
                const displayPassword = user.password || (user.username === 'admin' ? 'admin' : '123');
                const cleanRowUsername = (user.username || '').trim().toLowerCase().replace(/^@+/, '');
                const isDuplicateInList = userAccounts.filter(
                  (u) => (u.username || '').trim().toLowerCase().replace(/^@+/, '') === cleanRowUsername
                ).length > 1;
                const canDeleteUser =
                  user.id !== currentUser?.id &&
                  !(user.id === 'usr-admin' && !isDuplicateInList);

                return (
                  <tr key={user.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-3.5 text-center font-mono text-slate-500">{idx + 1}</td>
                    <td className="p-3.5 font-mono font-bold text-indigo-400">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span>@{cleanRowUsername}</span>
                        {isDuplicateInList && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
                            Duplikat
                          </span>
                        )}
                        {user.source === 'pendaftaran_mandiri' && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                            Pendaftaran Mandiri
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-3.5 font-mono">
                      <div className="inline-flex items-center gap-1.5 bg-slate-950/80 border border-slate-800 px-2.5 py-1 rounded-lg text-slate-200">
                        <Key className="w-3 h-3 text-amber-400" />
                        <span className="font-semibold text-xs">
                          {isPasswordShown ? displayPassword : '••••••••'}
                        </span>
                        <button
                          onClick={() => togglePasswordVisibility(user.id)}
                          className="text-slate-400 hover:text-slate-200 ml-1 cursor-pointer"
                          title={isPasswordShown ? 'Sembunyikan' : 'Tampilkan'}
                        >
                          {isPasswordShown ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                        </button>
                      </div>
                    </td>
                    <td className="p-3.5 font-bold text-slate-100">{user.namaLengkap}</td>
                    <td className="p-3.5">
                      <div className="text-slate-200">{user.email}</div>
                      <div className="text-[10px] text-slate-500">{user.noHp || '-'}</div>
                    </td>
                    <td className="p-3.5">
                      <span
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold capitalize border ${
                          user.role === 'admin'
                            ? 'bg-purple-500/15 text-purple-300 border-purple-500/30'
                            : user.role === 'bendahara'
                            ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                            : user.role === 'sekretaris'
                            ? 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30'
                            : 'bg-slate-800 text-slate-400 border-slate-700'
                        }`}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td className="p-3.5 text-center">
                      <span
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border ${
                          user.status === 'aktif'
                            ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                            : 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                        }`}
                      >
                        {user.status}
                      </span>
                    </td>
                    <td className="p-3.5 text-slate-400 font-mono text-[11px]">
                      {user.lastLogin || 'Belum Login'}
                    </td>
                    <td className="p-3.5 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(user)}
                          className="p-1.5 text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-colors cursor-pointer"
                          title="Edit Role &amp; Akun"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        {canDeleteUser && (
                          <button
                            onClick={() => setDeleteTarget(user)}
                            className="p-2 sm:p-1.5 text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer min-w-[36px] min-h-[36px] flex items-center justify-center"
                            title="Hapus Akun &amp; Hak Akses"
                          >
                            <Trash2 className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* RBAC ROLE PERMISSIONS REFERENCE MATRIX CARD */}
      <div className="bg-slate-900/80 rounded-2xl border border-slate-800/80 p-5 shadow-lg space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-indigo-400" />
            <h3 className="font-bold text-sm text-slate-100">
              Panduan Otoritas &amp; Hak Akses Role Pengguna Sistem
            </h3>
          </div>
          <span className="text-[11px] text-slate-400">Role-Based Access Control (RBAC)</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          {(Object.keys(ROLE_DETAILS) as UserRole[]).map((roleKey) => {
            const role = ROLE_DETAILS[roleKey];
            return (
              <div
                key={roleKey}
                className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className={`px-2.5 py-0.5 rounded-lg text-[11px] font-bold border ${role.badgeClass}`}>
                      {role.name}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mb-3 leading-relaxed">
                    {role.description}
                  </p>
                  <div className="space-y-1.5 border-t border-slate-800/80 pt-2.5">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                      Cakupan Wewenang:
                    </span>
                    <ul className="space-y-1 text-[11px] text-slate-300">
                      {role.permissions.map((perm, pIdx) => (
                        <li key={pIdx} className="flex items-start gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                          <span>{perm}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* MODAL INPUT / FORM */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4 overflow-hidden animate-in fade-in duration-150">
          <div className="bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md border border-slate-800 text-slate-100 flex flex-col max-h-[92dvh] sm:max-h-[88vh] overflow-hidden my-auto">
            <div className="bg-slate-950 p-4 px-5 border-b border-slate-800 flex items-center justify-between shrink-0">
              <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-400" />
                <span>{editingUser ? 'Edit Akun &amp; Role Pengguna' : 'Tambah Akun Pengguna Baru'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleInitiateSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden text-xs">
              <div className="p-4 sm:p-5 space-y-4 flex-1 overflow-y-auto overscroll-contain">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">Username Login</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center font-mono font-bold text-slate-500">@</span>
                      <input
                        type="text"
                        required
                        placeholder="e.g. jemaat_admin"
                        value={formData.username ? formData.username.replace(/^@+/, '') : ''}
                        onChange={(e) => setFormData({ ...formData, username: e.target.value.toLowerCase().replace(/[@\s]+/g, '') })}
                        className={`w-full p-2.5 pl-7 rounded-xl bg-slate-950 border font-mono font-bold focus:outline-none focus:ring-1 ${
                          isDuplicateUsername
                            ? 'border-rose-500 text-rose-300 focus:border-rose-500 focus:ring-rose-500'
                            : 'border-slate-800 text-indigo-300 focus:border-indigo-500 focus:ring-indigo-500'
                        }`}
                      />
                    </div>
                    {isDuplicateUsername && (
                      <div className="mt-1.5 p-2 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-[11px] flex items-start gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-rose-400" />
                        <span>Username <strong>@{cleanCurrentUsername}</strong> sudah terdaftar! Gunakan username unik agar tidak terjadi kesalahan saat login.</span>
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">Kata Sandi / Password</label>
                    <div className="relative">
                      <input
                        type={showModalPassword ? 'text' : 'password'}
                        required
                        value={formData.password || ''}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className="w-full p-2.5 pr-9 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 font-mono font-bold focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowModalPassword(!showModalPassword)}
                        className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-200 cursor-pointer"
                      >
                        {showModalPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Nama Lengkap Pengguna</label>
                  <input
                    type="text"
                    required
                    placeholder="Nama lengkap beserta gelar jika ada"
                    value={formData.namaLengkap || ''}
                    onChange={(e) => setFormData({ ...formData, namaLengkap: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">Email</label>
                    <input
                      type="email"
                      required
                      placeholder="user@gereja.id"
                      value={formData.email || ''}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">No. HP / WA</label>
                    <input
                      type="text"
                      placeholder="0812-xxxx-xxxx"
                      value={formData.noHp || ''}
                      onChange={(e) => setFormData({ ...formData, noHp: e.target.value })}
                      className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">Role Hak Akses</label>
                    <select
                      value={formData.role || 'sekretaris'}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          role: e.target.value as UserRole,
                        })
                      }
                      className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 font-bold capitalize focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    >
                      <option value="admin" className="bg-slate-900">Admin (Full System)</option>
                      <option value="bendahara" className="bg-slate-900">Bendahara (Keuangan)</option>
                      <option value="sekretaris" className="bg-slate-900">Sekretaris (Warga &amp; Schedule)</option>
                      <option value="warga" className="bg-slate-900">Warga Jemaat (Public)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">Status Akun</label>
                    <select
                      value={formData.status || 'aktif'}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          status: e.target.value as 'aktif' | 'nonaktif',
                        })
                      }
                      className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    >
                      <option value="aktif" className="bg-slate-900">Aktif (Dapat Login)</option>
                      <option value="nonaktif" className="bg-slate-900">Nonaktif (Dibekukan)</option>
                    </select>
                  </div>
                </div>

                {/* Preview Role Scope */}
                <div className="p-3 bg-indigo-950/40 border border-indigo-500/20 rounded-xl space-y-1.5">
                  <div className="flex items-center gap-1.5 text-indigo-300 font-bold text-[11px]">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Wewenang Role: {ROLE_DETAILS[formData.role || 'sekretaris']?.name}</span>
                  </div>
                  <p className="text-[10px] text-slate-300">
                    {ROLE_DETAILS[formData.role || 'sekretaris']?.description}
                  </p>
                </div>
              </div>

              <div className="p-3.5 sm:p-4 flex justify-end gap-2 border-t border-slate-800 bg-slate-950/90 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-700 rounded-xl hover:bg-slate-800 font-semibold text-slate-300 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isDuplicateUsername}
                  className={`px-4 py-2 rounded-xl font-bold flex items-center gap-1.5 transition-colors ${
                    isDuplicateUsername
                      ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                      : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30 cursor-pointer'
                  }`}
                >
                  <span>Lanjutkan Konfirmasi</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* POPUP KONFIRMASI: TAMBAH & EDIT AKUN PENGGUNA + ROLE HAK AKSES */}
      {pendingConfirmSave && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-[60] flex items-center justify-center p-3 sm:p-4 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl w-full max-w-lg flex flex-col max-h-[92dvh] overflow-hidden text-slate-100">
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-400">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-slate-100">
                    {pendingConfirmSave.mode === 'tambah'
                      ? 'Konfirmasi Tambah Akun & Penetapan Hak Akses'
                      : 'Konfirmasi Perubahan Akun & Role Hak Akses'}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Verifikasi kredensial login dan wewenang pengguna sebelum disimpan
                  </p>
                </div>
              </div>
              <button
                onClick={() => setPendingConfirmSave(null)}
                disabled={isSavingInProgress}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer disabled:opacity-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body Summary */}
            <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1 text-xs">
              {/* Target User Info */}
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                      Identitas Pengguna
                    </span>
                    <h4 className="font-extrabold text-sm text-slate-100 mt-0.5">
                      {pendingConfirmSave.data.namaLengkap}
                    </h4>
                  </div>
                  <span className="font-mono font-bold text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-lg border border-indigo-500/20 text-xs">
                    @{pendingConfirmSave.data.username}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-300 pt-1.5 border-t border-slate-800/60">
                  <div>
                    <span className="text-slate-500">Email:</span>{' '}
                    <span className="font-medium text-slate-200">{pendingConfirmSave.data.email}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">No. Kontak:</span>{' '}
                    <span className="font-medium text-slate-200">{pendingConfirmSave.data.noHp || '-'}</span>
                  </div>
                </div>
              </div>

              {/* Assigned Role & Capabilities Box */}
              <div className="bg-indigo-950/30 border border-indigo-500/30 p-4 rounded-xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-indigo-300 tracking-wider">
                    Role Hak Akses yang Ditetapkan:
                  </span>
                  <span
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold border capitalize ${
                      ROLE_DETAILS[pendingConfirmSave.data.role]?.badgeClass
                    }`}
                  >
                    {ROLE_DETAILS[pendingConfirmSave.data.role]?.name}
                  </span>
                </div>

                <p className="text-[11px] text-slate-300 leading-relaxed">
                  {ROLE_DETAILS[pendingConfirmSave.data.role]?.description}
                </p>

                <div className="border-t border-indigo-500/20 pt-2 space-y-1">
                  <span className="text-[10px] font-bold text-indigo-300 uppercase">
                    Kewenangan Modul Sistem:
                  </span>
                  <ul className="space-y-1 text-[11px] text-slate-200">
                    {ROLE_DETAILS[pendingConfirmSave.data.role]?.permissions.map((perm, idx) => (
                      <li key={idx} className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>{perm}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Account Status Card */}
              <div className="flex items-center justify-between p-3 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-slate-300 font-medium">Status Keaktifan Akun:</span>
                <span
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${
                    pendingConfirmSave.data.status === 'aktif'
                      ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                      : 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                  }`}
                >
                  {pendingConfirmSave.data.status === 'aktif' ? 'Aktif (Dapat Login)' : 'Nonaktif (Dibekukan)'}
                </span>
              </div>

              {/* Security Warning Notice */}
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-300 text-[11px] flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
                <span>
                  Pastikan penetapan role hak akses sesuai dengan surat keputusan dan wewenang pelayanan gereja.
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="p-3.5 sm:p-4 flex items-center justify-end gap-2.5 border-t border-slate-800 bg-slate-950/80 shrink-0">
              <button
                type="button"
                onClick={() => setPendingConfirmSave(null)}
                disabled={isSavingInProgress}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition cursor-pointer disabled:opacity-50 text-xs"
              >
                Periksa / Edit Kembali
              </button>
              <button
                type="button"
                onClick={handleExecuteSave}
                disabled={isSavingInProgress}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition shadow-lg shadow-indigo-600/30 cursor-pointer disabled:opacity-50 flex items-center gap-2 text-xs"
              >
                {isSavingInProgress ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Menyimpan Akun...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Ya, Konfirmasi &amp; Simpan Akun</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* POPUP KONFIRMASI: HAPUS AKUN PENGGUNA & CABUT ROLE HAK AKSES */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-[60] flex items-center justify-center p-3 sm:p-4 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          <div className="bg-slate-900 border border-rose-500/30 rounded-2xl shadow-2xl w-full max-w-md flex flex-col max-h-[92dvh] overflow-hidden text-slate-100">
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5 text-rose-400 font-bold text-sm sm:text-base">
                <div className="p-2 rounded-xl bg-rose-500/15 border border-rose-500/30">
                  <ShieldAlert className="w-5 h-5 text-rose-400" />
                </div>
                <span>Konfirmasi Hapus Akun &amp; Cabut Akses</span>
              </div>
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={isDeletingInProgress}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer disabled:opacity-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-4 sm:p-5 space-y-4 overflow-y-auto text-xs">
              <div className="p-3.5 bg-rose-950/30 border border-rose-500/30 rounded-xl space-y-1.5">
                <p className="text-[10px] text-rose-300 uppercase font-bold tracking-wider">
                  Target Akun yang Akan Dihapus:
                </p>
                <p className="text-sm font-black text-white leading-snug break-words">
                  {deleteTarget.namaLengkap}
                </p>
                <div className="flex items-center gap-2 pt-1 font-mono text-[11px]">
                  <span className="text-indigo-300 font-bold">@{deleteTarget.username}</span>
                  <span className="text-slate-500">•</span>
                  <span className="text-rose-300 font-bold uppercase">Role: {deleteTarget.role}</span>
                </div>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-slate-300 leading-relaxed text-[11px] space-y-1">
                <p className="font-semibold text-rose-400">Peringatan Keamanan:</p>
                <p>
                  Tindakan ini akan <strong>menghapus akun login secara permanen</strong> dan <strong>mencabut seluruh kewenangan role hak akses ({deleteTarget.role})</strong> pengguna tersebut ke sistem informasi jemaat.
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="p-3.5 sm:p-4 flex items-center justify-end gap-2 border-t border-slate-800 bg-slate-950/80 shrink-0">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                disabled={isDeletingInProgress}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition cursor-pointer disabled:opacity-50 text-xs"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleExecuteDelete}
                disabled={isDeletingInProgress}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold transition shadow-lg shadow-rose-600/30 cursor-pointer disabled:opacity-50 flex items-center gap-2 text-xs"
              >
                {isDeletingInProgress ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Menghapus &amp; Mencabut Akses...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>Ya, Hapus Akun &amp; Cabut Akses</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
