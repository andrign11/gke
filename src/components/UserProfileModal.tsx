import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Camera, Check, KeyRound, Lock, Mail, Phone, Trash2, User, X, Shield, Briefcase, Bell } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenNotifikasiResi?: () => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({ isOpen, onClose, onOpenNotifikasiResi }) => {
  const { currentUser, setCurrentUser, updateUserAccount, keuanganList } = useApp();

  const [formData, setFormData] = useState({
    namaLengkap: currentUser?.namaLengkap || '',
    namaPanggilan: currentUser?.namaPanggilan || '',
    email: currentUser?.email || '',
    noHp: currentUser?.noHp || '',
    jabatanGereja: currentUser?.jabatanGereja || '',
    foto: currentUser?.foto || '',
    newPassword: '',
    confirmPassword: '',
  });

  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen || !currentUser) return null;

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setErrorMsg('Ukuran foto terlalu besar. Maksimal 2MB.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData((prev) => ({ ...prev, foto: reader.result as string }));
      setErrorMsg('');
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setFormData((prev) => ({ ...prev, foto: '' }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (formData.newPassword) {
      if (formData.newPassword.length < 3) {
        setErrorMsg('Password baru minimal 3 karakter');
        return;
      }
      if (formData.newPassword !== formData.confirmPassword) {
        setErrorMsg('Konfirmasi password tidak cocok');
        return;
      }
    }

    const updatedData = {
      namaLengkap: formData.namaLengkap,
      namaPanggilan: formData.namaPanggilan || formData.namaLengkap.split(' ')[0],
      email: formData.email,
      noHp: formData.noHp,
      jabatanGereja: formData.jabatanGereja,
      foto: formData.foto,
      ...(formData.newPassword ? { password: formData.newPassword } : {}),
    };

    updateUserAccount(currentUser.id, updatedData);

    // Update current session user in state
    setCurrentUser({
      ...currentUser,
      ...updatedData,
    });

    setSuccessMsg('Profil berhasil diperbarui!');
    setTimeout(() => {
      setSuccessMsg('');
      onClose();
    }, 1500);
  };

  return createPortal(
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 lg:left-64 z-[9999] flex items-center justify-center bg-slate-950/70 dark:bg-slate-950/80 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200"
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-5 sm:px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">Edit Profil Saya</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Ubah foto profil, nama panggilan, kontak & kata sandi
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 sm:space-y-5 text-xs">
          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-500/15 border border-emerald-200 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-300 font-bold flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              {successMsg}
            </div>
          )}

          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-500/15 border border-rose-200 dark:border-rose-500/30 text-rose-800 dark:text-rose-300 font-bold">
              {errorMsg}
            </div>
          )}

          {/* Photo Avatar Upload */}
          <div className="flex flex-col sm:flex-row items-center gap-4 bg-slate-50 dark:bg-slate-950/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800/80">
            <div className="relative group shrink-0">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-indigo-600 to-sky-500 flex items-center justify-center font-bold text-white text-2xl shadow-md overflow-hidden border-2 border-indigo-200 dark:border-slate-700">
                {formData.foto ? (
                  <img
                    src={formData.foto}
                    alt="Foto Profil"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span>
                    {formData.namaPanggilan
                      ? formData.namaPanggilan.charAt(0).toUpperCase()
                      : (formData.namaLengkap || 'U').charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
            </div>

            <div className="flex-1 text-center sm:text-left space-y-2">
              <label className="block text-slate-800 dark:text-slate-200 font-bold">Foto Profil User</label>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold transition text-xs shadow-sm">
                  <Camera className="w-3.5 h-3.5" />
                  <span>Unggah Foto</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>

                {formData.foto && (
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-500/20 text-slate-700 hover:text-rose-600 dark:text-slate-300 dark:hover:text-rose-300 transition text-xs border border-slate-200 dark:border-slate-700 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                    <span>Hapus Foto</span>
                  </button>
                )}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Format: JPG, PNG, WEBP (Maks 2MB)</p>
            </div>
          </div>

          {/* User Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Nama Lengkap & Gelar <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  required
                  value={formData.namaLengkap || ''}
                  onChange={(e) => setFormData({ ...formData, namaLengkap: e.target.value })}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 font-semibold focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Nama Panggilan / Nickname
              </label>
              <input
                type="text"
                placeholder="Contoh: Pak Hendra / Ibu Sri"
                value={formData.namaPanggilan || ''}
                onChange={(e) => setFormData({ ...formData, namaPanggilan: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 font-semibold focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Email Aktif</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="email"
                  value={formData.email || ''}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">No. WhatsApp / HP</label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={formData.noHp || ''}
                  onChange={(e) => setFormData({ ...formData, noHp: e.target.value })}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Jabatan Pelayanan / Tugas
              </label>
              <div className="relative">
                <Briefcase className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Contoh: Penatua Lingkungan I"
                  value={formData.jabatanGereja || ''}
                  onChange={(e) => setFormData({ ...formData, jabatanGereja: e.target.value })}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Role Akun</label>
              <div className="relative">
                <Shield className="w-4 h-4 text-indigo-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  disabled
                  value={(currentUser?.role || 'User').toUpperCase()}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80 text-indigo-700 dark:text-indigo-300 font-bold uppercase cursor-not-allowed opacity-90"
                />
              </div>
            </div>
          </div>

          {/* Quick Notifikasi Resi Button in Profile Modal */}
          {onOpenNotifikasiResi && (
            <div className="p-3.5 rounded-xl bg-amber-500/10 dark:bg-amber-500/15 border border-amber-300/60 dark:border-amber-500/30 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-amber-500 text-slate-950 flex items-center justify-center shrink-0 shadow-xs">
                  <Bell className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-slate-900 dark:text-slate-100 text-xs truncate">
                    Notifikasi Resi &amp; Status Persembahan
                  </p>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 truncate">
                    Cek status verifikasi resi persembahan &amp; unduh bukti sah
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenNotifikasiResi();
                }}
                className="shrink-0 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs transition shadow-sm cursor-pointer flex items-center gap-1.5 active:scale-95"
              >
                <span>Buka Resi</span>
                <span className="text-xs">→</span>
              </button>
            </div>
          )}

          {/* Change Password */}
          <div className="border-t border-slate-200 dark:border-slate-800/80 pt-3.5 sm:pt-4 space-y-3">
            <h4 className="font-bold text-slate-900 dark:text-slate-200 text-xs flex items-center gap-2">
              <KeyRound className="w-3.5 h-3.5 text-indigo-500" />
              Ganti Kata Sandi (Opsional)
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
              <div>
                <label className="block font-semibold text-slate-600 dark:text-slate-400 mb-1">Password Baru</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="password"
                    placeholder="Kosongkan jika tidak diganti"
                    value={formData.newPassword || ''}
                    onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-600 dark:text-slate-400 mb-1">Konfirmasi Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="password"
                    placeholder="Ketik ulang password"
                    value={formData.confirmPassword || ''}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold transition cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition shadow-lg shadow-indigo-600/30 flex items-center gap-1.5 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              Simpan Perubahan
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
