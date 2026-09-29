import React, { useState, useEffect } from 'react';
import {
  QrCode,
  Smartphone,
  Save,
  CloudCheck,
  ShieldAlert,
  Zap,
  Eye,
  CheckCircle2,
  Upload,
  Phone,
  Building2,
  DollarSign,
  FileText,
  Check,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { getQrisImageSource, validateQrisPayload } from '../../utils/qrisUtils';

export const PengaturanQrisModule: React.FC = () => {
  const { settings, updateSettings, currentUser } = useApp();

  const [form, setForm] = useState({ ...settings });
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    setForm({ ...settings });
  }, [settings]);

  // Check access: Admin or Bendahara allowed
  const isAuthorized = currentUser && ['admin', 'bendahara'].includes(currentUser.role);

  if (!isAuthorized) {
    return (
      <div className="bg-amber-500/10 border border-amber-500/30 text-amber-300 p-6 rounded-2xl flex items-center gap-3 backdrop-blur-md">
        <ShieldAlert className="w-6 h-6 text-amber-400 flex-shrink-0" />
        <div>
          <h3 className="font-bold text-sm text-slate-100">Akses Terbatas</h3>
          <p className="text-xs text-amber-300/80 mt-0.5">
            Hanya akun dengan role <strong className="text-amber-200">Admin</strong> atau <strong className="text-amber-200">Bendahara</strong> yang berhak mengubah Pengaturan Persembahan Digital QRIS &amp; GoPay.
          </p>
        </div>
      </div>
    );
  }

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    updateSettings(form);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3500);
  };

  return (
    <div className="space-y-6 w-full pb-10">
      {/* Header Banner */}
      <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800/80 shadow-lg backdrop-blur-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <QrCode className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <span>Pengaturan Persembahan Digital QRIS &amp; GoPay</span>
                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase">
                  GoPay Integrated
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Konfigurasi merchant QRIS, nomor akun GoPay, rekening bank, string EMVCo, saklar auto-polling, dan WA konfirmasi resi.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto justify-end">
          {saveSuccess && (
            <div className="bg-emerald-500/20 text-emerald-300 text-xs font-bold px-3.5 py-2 rounded-xl border border-emerald-500/40 shadow-md flex items-center gap-1.5 animate-bounce">
              <Check className="w-4 h-4 text-emerald-400" />
              <span>Berhasil Disimpan!</span>
            </div>
          )}

          <button
            type="button"
            onClick={() => handleSubmit()}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/20 transition-all flex items-center gap-2 cursor-pointer active:scale-95"
          >
            <Save className="w-4 h-4" />
            <span>Simpan Pengaturan</span>
          </button>

          <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-3 py-2 rounded-xl border border-emerald-500/20 hidden md:flex items-center gap-1.5">
            <CloudCheck className="w-4 h-4 text-emerald-400" />
            <span>Cloud Sync Active</span>
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Merchant & E-Wallet / GoPay Details */}
        <div className="bg-slate-900/80 rounded-2xl p-6 border border-slate-800/80 shadow-lg backdrop-blur-md space-y-4 text-xs">
          <h3 className="font-bold text-slate-100 border-b border-slate-800 pb-3 flex items-center justify-between text-sm">
            <span className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-emerald-400" />
              <span>Identitas Merchant QRIS &amp; Akun GoPay</span>
            </span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">
                Nama Merchant QRIS (Tampil di Scan QR)
              </label>
              <input
                type="text"
                value={form.qrisMerchantName || ''}
                onChange={(e) => setForm({ ...form, qrisMerchantName: e.target.value })}
                placeholder="Contoh: GKE JEMAAT - PERSEMBAHAN DIGITAL"
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 font-bold focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">
                NMID QRIS (National Merchant ID)
              </label>
              <input
                type="text"
                value={form.qrisNmid || ''}
                onChange={(e) => setForm({ ...form, qrisNmid: e.target.value })}
                placeholder="Contoh: ID1020038491029"
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                <Smartphone className="w-3.5 h-3.5 text-sky-400" />
                <span>Nomor Akun GoPay Resmi Jemaat</span>
              </label>
              <input
                type="text"
                value={form.gopayAccountNumber || ''}
                onChange={(e) => setForm({ ...form, gopayAccountNumber: e.target.value })}
                placeholder="Contoh: 0812-5566-7788"
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 font-mono font-bold focus:outline-none focus:border-sky-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">
                Nama Pemilik Akun GoPay
              </label>
              <input
                type="text"
                value={form.gopayAccountName || ''}
                onChange={(e) => setForm({ ...form, gopayAccountName: e.target.value })}
                placeholder="Contoh: BENDAHARA MAJELIS JEMAAT GKE"
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">
                No. Rekening Bank BCA Jemaat
              </label>
              <input
                type="text"
                value={form.bankAccountBca || ''}
                onChange={(e) => setForm({ ...form, bankAccountBca: e.target.value })}
                placeholder="Contoh: 782-0192-331 (a.n. MAJELIS JEMAAT GKE)"
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">
                No. Rekening Bank Mandiri Jemaat
              </label>
              <input
                type="text"
                value={form.bankAccountMandiri || ''}
                onChange={(e) => setForm({ ...form, bankAccountMandiri: e.target.value })}
                placeholder="Contoh: 159-00-0887-2231 (a.n. MAJELIS JEMAAT GKE)"
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Payload EMVCo & Barcode Upload */}
        <div className="bg-slate-900/80 rounded-2xl p-6 border border-slate-800/80 shadow-lg backdrop-blur-md space-y-4 text-xs">
          <h3 className="font-bold text-slate-100 border-b border-slate-800 pb-3 flex items-center gap-2 text-sm">
            <QrCode className="w-4 h-4 text-emerald-400" />
            <span>String QRIS Baku &amp; Upload Gambar Barcode</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">
                Teks Payload String QRIS Baku (EMVCo 000201...)
              </label>
              <textarea
                rows={3}
                value={form.qrisPayload || ''}
                onChange={(e) => setForm({ ...form, qrisPayload: e.target.value })}
                placeholder="Salin/Paste string QRIS baku dari PDF/Aplikasi Bank (e.g. 00020101021126580014ID.GO.QRIS.WWW...)"
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 font-mono text-[11px] focus:outline-none focus:border-emerald-500"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                *Jika diisi, barcode QRIS di Berita Jemaat &amp; Modal Persembahan akan dibuat 100% presisi dari teks string ini.
              </p>
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">
                Upload File Gambar Barcode / Banner QRIS Jemaat
              </label>
              <div className="space-y-2">
                <input
                  type="text"
                  value={form.qrisImageUrl || ''}
                  onChange={(e) => setForm({ ...form, qrisImageUrl: e.target.value })}
                  placeholder="Atau tempel URL gambar: https://domain.com/qris.jpg"
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 font-mono text-[11px] focus:outline-none focus:border-emerald-500"
                />
                <label className="cursor-pointer inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition shadow-sm">
                  <Upload className="w-4 h-4 text-emerald-400" />
                  <span>Pilih File Gambar (PNG/JPG/Data URL)</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (uploadEvent) => {
                          const base64 = uploadEvent.target?.result as string;
                          if (base64) {
                            setForm({ ...form, qrisImageUrl: base64 });
                          }
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Gateway Auto-Polling Active & WA Notification Config */}
        <div className="bg-slate-900/80 rounded-2xl p-6 border border-slate-800/80 shadow-lg backdrop-blur-md space-y-4 text-xs">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <span className="font-bold text-slate-100 text-sm flex items-center gap-2">
              <Zap className="w-4 h-4 text-indigo-400" />
              <span>Konfigurasi Status &amp; Durasi Gateway Auto-Polling Active</span>
            </span>
            <span
              className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                form.qrisAutoPollingEnabled !== false
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}
            >
              {form.qrisAutoPollingEnabled !== false ? '⚡ AUTO-POLLING AKTIF' : '⏸️ AUTO-POLLING NONAKTIF'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">
                Status Saklar Gateway Auto-Polling
              </label>
              <div className="flex items-center gap-3 bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() =>
                    setForm({
                      ...form,
                      qrisAutoPollingEnabled: form.qrisAutoPollingEnabled === false ? true : false,
                    })
                  }
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    form.qrisAutoPollingEnabled !== false ? 'bg-indigo-600' : 'bg-slate-700'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      form.qrisAutoPollingEnabled !== false ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
                <span className="text-xs font-bold text-slate-200">
                  {form.qrisAutoPollingEnabled !== false
                    ? 'Aktif (Auto-Check Webhook & Mutasi)'
                    : 'Nonaktif (Verifikasi Manual Only)'}
                </span>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">
                Durasi Hitungan Mundur Gateway Active (Detik)
              </label>
              <select
                value={form.qrisAutoPollingDurationSeconds ?? 60}
                onChange={(e) =>
                  setForm({ ...form, qrisAutoPollingDurationSeconds: parseInt(e.target.value, 10) })
                }
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 font-bold focus:outline-none focus:border-indigo-500"
              >
                <option value={15}>15 Detik (Cepat / Pengujian)</option>
                <option value={20}>20 Detik</option>
                <option value={30}>30 Detik</option>
                <option value={60}>60 Detik (1 Menit — Standar Rekomendasi)</option>
                <option value={120}>120 Detik (2 Menit)</option>
                <option value={180}>180 Detik (3 Menit)</option>
                <option value={300}>300 Detik (5 Menit)</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-emerald-400" />
                <span>Nomor WhatsApp Admin / Bendahara (Penerima Konfirmasi Resi)</span>
              </label>
              <input
                type="text"
                value={form.noWhatsappAdmin ?? ''}
                onChange={(e) => setForm({ ...form, noWhatsappAdmin: e.target.value })}
                placeholder="Contoh: 081255667788 atau 6281255667788"
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 font-bold focus:outline-none focus:border-emerald-500 text-xs"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                Nomor ini digunakan untuk penerimaan bukti/resi persembahan digital dari warga jemaat via WhatsApp.
              </p>
            </div>
          </div>
        </div>

        {/* Live Scan Preview Tester Card */}
        <div className="bg-slate-950 p-5 rounded-2xl border border-emerald-500/30 space-y-3 shadow-lg">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="font-bold text-slate-200 text-xs flex items-center gap-1.5">
              <Eye className="w-4 h-4 text-emerald-400" />
              <span>Pratinjau &amp; Hasil Tes Scan Barcode QRIS Warta Jemaat</span>
            </span>
            <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Siap Di-Scan Kamera HP / GoPay
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-5">
            <div className="bg-white p-3 rounded-2xl border-2 border-slate-800 shadow-md flex-shrink-0 text-center">
              <img
                src={getQrisImageSource(form)}
                alt="Test QR Barcode"
                className="w-36 h-36 object-contain mx-auto"
              />
              <span className="block text-[9px] font-black text-slate-900 mt-1.5 tracking-tighter">
                PREVIEW BARCODE SCAN SIAP CETAK
              </span>
            </div>

            <div className="space-y-2 text-[11px] text-slate-300 flex-1">
              <p className="font-bold text-emerald-300 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Status Validasi System: {validateQrisPayload(form.qrisPayload || form.qrisImageUrl || '').message}</span>
              </p>
              <p className="text-slate-400 leading-relaxed">
                Barcode di atas adalah gambar presisi tinggi (High Contrast) yang akan otomatis muncul dan dapat discan warga jemaat di <strong>Warta Jemaat, Modal QRIS, &amp; Cetak PDF</strong>.
              </p>
              <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 space-y-1 font-mono text-[11px]">
                <p className="text-slate-400">• Merchant Name: <span className="text-slate-200 font-bold">{form.qrisMerchantName || 'MAJELIS JEMAAT GKE'}</span></p>
                <p className="text-slate-400">• NMID ID: <span className="text-slate-200">{form.qrisNmid || 'ID1020038491029'}</span></p>
                <p className="text-slate-400">• GoPay Account: <span className="text-slate-200">{form.gopayAccountNumber || '0812-5566-7788'}</span></p>
              </div>
            </div>
          </div>
        </div>

        {/* Save Footer Button */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs shadow-xl shadow-emerald-600/30 transition-all flex items-center gap-2 cursor-pointer active:scale-95"
          >
            <Save className="w-4 h-4" />
            <span>Simpan Semua Pengaturan Persembahan Digital</span>
          </button>
        </div>
      </form>
    </div>
  );
};
