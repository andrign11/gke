import React, { useState, useRef } from 'react';
import {
  Church,
  Image as ImageIcon,
  Upload,
  Save,
  CheckCircle2,
  Sparkles,
  RefreshCw,
  Eye,
  Sliders,
  Layers,
  Lock,
  ExternalLink,
  ShieldCheck,
  Check,
  AlertCircle,
  X,
  LogIn,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

// Koleksi preset gambar gereja berkualitas tinggi untuk background login
export const CHURCH_BACKGROUND_PRESETS = [
  {
    id: 'preset-altar-salib',
    name: 'Altar & Salib Kudus',
    description: 'Interior ruang ibadah utama dengan salib bercahaya hangat dan mimbar suci.',
    url: 'https://images.unsplash.com/photo-1543731068-7e0f5beff43a?auto=format&fit=crop&w=1920&q=80',
    tag: 'Rekomendasi Utama',
  },
  {
    id: 'preset-arsitektur-katedral',
    name: 'Kemegahan Gedung Gereja',
    description: 'Tampak luar arsitektur gereja bersejarah dengan menara salib menjulang.',
    url: 'https://images.unsplash.com/photo-1544427920-c49ccfb85579?auto=format&fit=crop&w=1920&q=80',
    tag: 'Eksterior Megah',
  },
  {
    id: 'preset-kaca-patri',
    name: 'Jendela Kaca Patri & Cahaya',
    description: 'Sinar matahari menembus kaca patri warna-warni yang anggun dan sakral.',
    url: 'https://images.unsplash.com/photo-1519817650390-64a93db51149?auto=format&fit=crop&w=1920&q=80',
    tag: 'Artistik Sakral',
  },
  {
    id: 'preset-modern-sanctuary',
    name: 'Ruang Ibadah Modern Terang',
    description: 'Suasana kapel kontemporer minimalis dengan pencahayaan alami nan sejuk.',
    url: 'https://images.unsplash.com/photo-1438032005730-c779502df39b?auto=format&fit=crop&w=1920&q=80',
    tag: 'Modern & Bersih',
  },
  {
    id: 'preset-ruang-kayu-jemaat',
    name: 'Bangku Ibadah Kayu Klasik',
    description: 'Deretan bangku kayu jemaat menghadap altar dengan suasana teduh penuh damai.',
    url: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=1920&q=80',
    tag: 'Teduh & Klasik',
  },
  {
    id: 'preset-langit-salib',
    name: 'Puncak Menara Salib & Langit',
    description: 'Menara gereja berlatar langit cerah lambang pengharapan iman jemaat.',
    url: 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=1920&q=80',
    tag: 'Harapan Baru',
  },
];

export const PengaturanBackgroundModule: React.FC = () => {
  const { settings, updateSettings, currentUser, addAuditLog } = useApp();

  const getInitialBgUrl = () => {
    const savedUrl = settings?.loginBackgroundUrl;
    if (!savedUrl || savedUrl.includes('1548625361')) {
      return CHURCH_BACKGROUND_PRESETS[0].url;
    }
    return savedUrl;
  };

  const [bgUrl, setBgUrl] = useState<string>(getInitialBgUrl);
  const [overlayOpacity, setOverlayOpacity] = useState<number>(
    typeof settings?.loginBackgroundOverlayOpacity === 'number'
      ? settings.loginBackgroundOverlayOpacity
      : 0.35
  );
  const [blurSetting, setBlurSetting] = useState<'none' | 'sm' | 'md' | 'lg'>(
    settings?.loginBackgroundBlur || 'none'
  );

  const [customInputUrl, setCustomInputUrl] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isFullPreviewOpen, setIsFullPreviewOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Helper kompresi gambar upload agar ringan dan muat di Firestore
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setUploadError('File yang diunggah harus berupa gambar (JPG, PNG, WebP).');
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      setUploadError('Ukuran file maksimal 8MB.');
      return;
    }

    setUploadError(null);
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1920;
        const MAX_HEIGHT = 1080;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height = Math.round((height * MAX_WIDTH) / width);
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width = Math.round((width * MAX_HEIGHT) / height);
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
          setBgUrl(compressedDataUrl);
          setCustomInputUrl('');
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleApplyCustomUrl = () => {
    if (!customInputUrl.trim()) return;
    setBgUrl(customInputUrl.trim());
  };

  const handleSaveSettings = async () => {
    try {
      setIsSaving(true);
      await updateSettings({
        loginBackgroundUrl: bgUrl,
        loginBackgroundOverlayOpacity: overlayOpacity,
        loginBackgroundBlur: blurSetting,
      });

      addAuditLog?.({
        userId: currentUser?.id || 'admin',
        userName: currentUser?.namaLengkap || 'Administrator',
        action: 'UPDATE_SETTINGS',
        details: 'Memperbarui background gambar gereja & tampilan halaman login sistem.',
      });

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err) {
      console.error('Gagal menyimpan background settings:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetDefault = () => {
    const defaultPreset = CHURCH_BACKGROUND_PRESETS[0];
    setBgUrl(defaultPreset.url);
    setOverlayOpacity(0.35);
    setBlurSetting('none');
    setCustomInputUrl('');
  };

  const blurClass =
    blurSetting === 'lg'
      ? 'blur-md'
      : blurSetting === 'md'
      ? 'blur-sm'
      : blurSetting === 'sm'
      ? 'blur-[2px]'
      : '';

  return (
    <div className="space-y-6 pb-12 font-sans text-slate-800">
      {/* 1. Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 rounded-3xl border border-indigo-500/30 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-white">
        <div className="flex items-center gap-4">
          <div className="p-3.5 bg-indigo-500/20 text-indigo-300 rounded-2xl border border-indigo-500/30 shadow-inner">
            <ImageIcon className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-black tracking-tight text-white">
                Pengaturan Background Gereja & Halaman Login
              </h2>
              <span className="px-3 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                Administrator
              </span>
            </div>
            <p className="text-xs text-indigo-200/80 max-w-2xl leading-relaxed">
              Atur dan sesuaikan gambar latar belakang gereja pada halaman login. Lengkap dengan pilihan foto gereja berkualitas tinggi, unggah foto gereja sendiri, serta pengaturan opasitas & kelembutan visual.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto justify-end">
          <button
            type="button"
            onClick={() => setIsFullPreviewOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition-all shadow-sm active:scale-95 cursor-pointer"
          >
            <Eye className="w-4 h-4 text-slate-400" />
            <span>Tinjau Penuh (Full Preview)</span>
          </button>

          <button
            type="button"
            onClick={handleSaveSettings}
            disabled={isSaving}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white text-xs font-extrabold transition-all shadow-lg shadow-indigo-600/30 active:scale-95 cursor-pointer disabled:opacity-50"
          >
            {isSaving ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>{isSaving ? 'Menyimpan...' : 'Simpan Background'}</span>
          </button>
        </div>
      </div>

      {saveSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold flex items-center justify-between shadow-sm animate-fade-in">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>
              Background halaman login gereja berhasil diperbarui dan disimpan ke sistem! Halaman login kini menampilkan gambar gereja baru.
            </span>
          </div>
          <button
            type="button"
            onClick={() => setSaveSuccess(false)}
            className="text-emerald-700 hover:text-emerald-900 font-black text-sm"
          >
            ✕
          </button>
        </div>
      )}

      {/* 2. Grid Layout: Left Control Panel & Right Live Miniature Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: Controls & Presets (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* A. Curated Presets */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <Church className="w-5 h-5 text-indigo-600" />
                <h3 className="font-black text-sm text-slate-900">
                  Koleksi Gambar Foto Gereja (Pilihan Cepat)
                </h3>
              </div>
              <span className="text-[11px] font-semibold text-slate-500">
                Pilih salah satu gambar di bawah
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {CHURCH_BACKGROUND_PRESETS.map((preset) => {
                const isSelected = bgUrl === preset.url;
                return (
                  <div
                    key={preset.id}
                    onClick={() => {
                      setBgUrl(preset.url);
                      setCustomInputUrl('');
                    }}
                    className={`group relative rounded-2xl overflow-hidden border-2 cursor-pointer transition-all duration-200 ${
                      isSelected
                        ? 'border-indigo-600 shadow-md ring-2 ring-indigo-500/20'
                        : 'border-slate-200 hover:border-slate-400 hover:shadow-xs'
                    }`}
                  >
                    {/* Thumbnail Image */}
                    <div className="h-32 w-full overflow-hidden relative bg-slate-100">
                      <img
                        src={preset.url}
                        alt={preset.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            'https://images.unsplash.com/photo-1543731068-7e0f5beff43a?auto=format&fit=crop&w=1920&q=80';
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                      
                      {/* Badge Tag */}
                      <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-white/90 text-slate-800 shadow-xs backdrop-blur-xs">
                        {preset.tag}
                      </span>

                      {/* Check indicator if selected */}
                      {isSelected && (
                        <span className="absolute top-2 right-2 w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-md">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </span>
                      )}

                      <div className="absolute bottom-2 left-3 right-3 text-white">
                        <p className="font-extrabold text-xs leading-tight drop-shadow-xs">
                          {preset.name}
                        </p>
                      </div>
                    </div>

                    <div className="p-2.5 bg-slate-50/80 text-[11px] text-slate-600 border-t border-slate-100 line-clamp-2">
                      {preset.description}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* B. Custom Upload & Direct URL */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-5">
            <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
              <Upload className="w-5 h-5 text-indigo-600" />
              <h3 className="font-black text-sm text-slate-900">
                Unggah Foto Gereja Sendiri / Input URL
              </h3>
            </div>

            {uploadError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{uploadError}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Upload Box */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-indigo-300 hover:border-indigo-600 rounded-2xl p-5 text-center flex flex-col items-center justify-center gap-2.5 cursor-pointer transition-all bg-indigo-50/40 hover:bg-indigo-50/80 group shadow-2xs"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <div className="w-11 h-11 rounded-2xl bg-indigo-600 text-white flex items-center justify-center group-hover:scale-110 transition-transform shadow-xs">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-black text-indigo-950 group-hover:text-indigo-700">
                    Pilih Berkas Foto Gereja
                  </p>
                  <p className="text-[10px] text-slate-600 font-medium mt-0.5">
                    JPG, PNG, atau WebP dari HP / Laptop Anda
                  </p>
                </div>
              </div>

              {/* Direct URL Input */}
              <div className="flex flex-col justify-between space-y-2">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5">
                    Atau Masukkan URL Gambar:
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      placeholder="https://example.com/foto-gereja.jpg"
                      value={customInputUrl}
                      onChange={(e) => setCustomInputUrl(e.target.value)}
                      className="flex-1 px-3 py-2.5 text-xs rounded-xl bg-slate-50 border border-slate-300 focus:bg-white focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 text-slate-900 font-medium shadow-2xs"
                    />
                    <button
                      type="button"
                      onClick={handleApplyCustomUrl}
                      className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white border border-indigo-700 text-xs font-bold rounded-xl transition-all cursor-pointer shrink-0 shadow-xs"
                    >
                      Terapkan
                    </button>
                  </div>
                </div>
                <p className="text-[10px] text-slate-500 leading-tight">
                  Pastikan tautan dapat diakses publik dengan format gambar yang valid.
                </p>
              </div>
            </div>
          </div>

          {/* C. Visual Fine-Tuning Controls */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <Sliders className="w-5 h-5 text-indigo-600" />
                <div>
                  <h3 className="font-black text-sm text-slate-900">
                    Penyesuaian Visual & Keterbacaan Teks
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Atur intensitas cahaya dan kelembutan latar agar foto gereja dan tulisan terlihat jelas seimbang
                  </p>
                </div>
              </div>
              <span className="hidden sm:inline-flex px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-200">
                Live Realtime
              </span>
            </div>

            {/* LIVE PREVIEW OF CHURCH IMAGE & TEXT LEGIBILITY DIRECTLY IN THIS SECTION */}
            <div className="rounded-2xl border-2 border-indigo-200/90 overflow-hidden shadow-sm bg-slate-900 relative">
              <div className="px-3.5 py-2 bg-slate-900/90 border-b border-slate-800 text-white flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 font-bold">
                  <ImageIcon className="w-4 h-4 text-indigo-400" />
                  <span>Pratinjau Foto Gereja & Keterbacaan Tulisan</span>
                </div>
                <span className="text-[10px] font-mono text-emerald-300 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800">
                  Overlay: {Math.round(overlayOpacity * 100)}% • Blur: {blurSetting === 'none' ? 'Tajam' : blurSetting}
                </span>
              </div>

              {/* Stage with Background Image + Overlay + Blur + Test Typography */}
              <div className="relative h-56 sm:h-64 w-full overflow-hidden flex items-center justify-center p-4">
                {/* Background Image */}
                <img
                  src={bgUrl}
                  alt="Latar Belakang Gereja"
                  className={`absolute inset-0 w-full h-full object-cover transition-all duration-300 ${blurClass}`}
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      'https://images.unsplash.com/photo-1543731068-7e0f5beff43a?auto=format&fit=crop&w=1920&q=80';
                  }}
                />

                {/* Light Overlay */}
                <div
                  className="absolute inset-0 bg-gradient-to-b from-white/80 via-white/85 to-slate-100/90 transition-opacity pointer-events-none"
                  style={{ opacity: Math.max(0.15, Math.min(0.95, overlayOpacity + 0.45)) }}
                />

                {/* Sample Typography Card with Absolute Clarity */}
                <div className="relative z-10 max-w-sm w-full bg-white/95 backdrop-blur-md rounded-2xl p-4 border border-slate-200/90 shadow-xl space-y-2 text-center">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-800 text-[10px] font-extrabold border border-indigo-200">
                    <Church className="w-3 h-3 text-indigo-600" />
                    <span>{settings?.namaJemaat || 'Majelis Jemaat GKE'}</span>
                  </div>
                  <h4 className="text-sm sm:text-base font-black text-slate-900 leading-tight">
                    Sistem Informasi Manajemen Jemaat
                  </h4>
                  <p className="text-[11px] text-slate-600 font-medium line-clamp-1">
                    Keterbacaan teks dan ketajaman foto tampak seimbang
                  </p>
                  <div className="pt-1 flex items-center justify-center gap-2">
                    <span className="px-3 py-1.5 bg-indigo-600 text-white font-extrabold text-[11px] rounded-xl shadow-xs">
                      Tombol Terlihat Jelas
                    </span>
                    <span className="px-2.5 py-1.5 bg-white text-slate-800 font-bold text-[11px] rounded-xl border border-slate-300 shadow-2xs">
                      Kontras Tajam
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4 pt-1">
              {/* Overlay Opacity Slider */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-900">
                    Kekuatan Lapisan Cahaya Terang (Light Overlay)
                  </span>
                  <span className="font-mono font-extrabold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-lg border border-indigo-200 shadow-2xs">
                    {Math.round(overlayOpacity * 100)}%
                  </span>
                </div>

                {/* Custom styled slider with solid visible track */}
                <div className="relative py-1">
                  <input
                    type="range"
                    min="0.1"
                    max="0.8"
                    step="0.05"
                    value={overlayOpacity}
                    onChange={(e) => setOverlayOpacity(parseFloat(e.target.value))}
                    style={{
                      background: `linear-gradient(to right, #4f46e5 0%, #4f46e5 ${((overlayOpacity - 0.1) / (0.8 - 0.1)) * 100}%, #cbd5e1 ${((overlayOpacity - 0.1) / (0.8 - 0.1)) * 100}%, #cbd5e1 100%)`,
                    }}
                    className="w-full h-3 rounded-full cursor-pointer appearance-none border border-slate-300 shadow-inner accent-indigo-600"
                  />
                </div>

                <div className="flex justify-between text-[11px] font-medium text-slate-600 px-0.5">
                  <span>Transparan (Foto Terang Jelas)</span>
                  <span className="font-bold text-indigo-700">Seimbang (35%)</span>
                  <span>Putih Pekat (Kontras Maksimal)</span>
                </div>

                {/* Quick preset buttons for light overlay */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {[
                    { val: 0.2, label: '20% Terang' },
                    { val: 0.35, label: '35% Rekomendasi' },
                    { val: 0.5, label: '50% Kontras Tinggi' },
                    { val: 0.65, label: '65% Pekat' },
                  ].map((preset) => (
                    <button
                      key={preset.val}
                      type="button"
                      onClick={() => setOverlayOpacity(preset.val)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer border ${
                        Math.abs(overlayOpacity - preset.val) < 0.03
                          ? 'bg-indigo-600 text-white border-indigo-700 shadow-xs'
                          : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300 shadow-2xs'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Blur Control */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <label className="block text-xs font-bold text-slate-900">
                  Efek Kelembutan / Blur Latar Belakang:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'none', label: 'Tanpa Blur (Tajam)' },
                    { id: 'sm', label: 'Lembut (2px)' },
                    { id: 'md', label: 'Sedang (4px)' },
                    { id: 'lg', label: 'Artistik (8px)' },
                  ].map((b) => (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => setBlurSetting(b.id as any)}
                      className={`py-2 px-2.5 rounded-xl text-xs font-bold transition-all text-center border cursor-pointer ${
                        blurSetting === b.id
                          ? 'bg-indigo-600 text-white border-indigo-700 shadow-sm ring-2 ring-indigo-500/20'
                          : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300 shadow-2xs'
                      }`}
                    >
                      {b.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Reset to Default */}
              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={handleResetDefault}
                  className="px-3 py-1.5 rounded-xl border border-slate-300 bg-white hover:bg-rose-50 text-slate-700 hover:text-rose-600 font-bold text-xs shadow-2xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Kembalikan ke Preset Awal</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Live Interactive Mini Preview (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="sticky top-20 space-y-4">
            <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-indigo-600" />
                  <h4 className="font-black text-xs text-slate-900 uppercase tracking-wider">
                    Pratinjau Langsung (Live Preview)
                  </h4>
                </div>
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                  Realtime
                </span>
              </div>

              {/* Miniature Login Screen Simulation */}
              <div className="w-full aspect-[4/5] rounded-2xl overflow-hidden relative shadow-inner border border-slate-300 flex flex-col justify-between p-3 select-none">
                {/* Simulated Church Background Image */}
                <img
                  src={bgUrl}
                  alt="Simulasi Latar Gereja"
                  className={`absolute inset-0 w-full h-full object-cover transition-all duration-300 ${blurClass}`}
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      'https://images.unsplash.com/photo-1543731068-7e0f5beff43a?auto=format&fit=crop&w=1920&q=80';
                  }}
                />

                {/* Simulated Overlay */}
                <div
                  className="absolute inset-0 bg-gradient-to-b from-white/80 via-white/85 to-slate-100/90 transition-opacity"
                  style={{ opacity: Math.max(0.2, Math.min(0.95, overlayOpacity + 0.45)) }}
                />

                {/* Simulated Mini Header */}
                <div className="relative z-10 flex items-center justify-between text-[9px] font-bold text-slate-700 pb-1">
                  <span className="truncate">{settings?.namaAplikasi || 'SIKA GKE'}</span>
                  <span className="px-1.5 py-0.5 bg-white/80 rounded text-[8px] text-slate-800 border border-slate-200">
                    Resmi
                  </span>
                </div>

                {/* Simulated Mini Login Card */}
                <div className="relative z-10 my-auto bg-white/95 backdrop-blur-md rounded-2xl p-4 border border-slate-200 shadow-xl space-y-2.5 max-w-[280px] mx-auto w-full">
                  <div className="text-center space-y-1">
                    <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 p-1 mx-auto flex items-center justify-center">
                      <Church className="w-5 h-5 text-indigo-600" />
                    </div>
                    <p className="text-[10px] font-extrabold text-indigo-700 uppercase tracking-wider">
                      {settings?.namaJemaat || 'Majelis Jemaat GKE'}
                    </p>
                    <p className="text-xs font-black text-slate-900 leading-tight">
                      Selamat Datang
                    </p>
                    <p className="text-[8px] text-slate-500">
                      Silakan masuk dengan akun Anda
                    </p>
                  </div>

                  <div className="space-y-1.5 text-[9px]">
                    <div>
                      <span className="text-slate-700 font-bold block mb-0.5">Username</span>
                      <div className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-400 font-medium">
                        admin
                      </div>
                    </div>
                    <div>
                      <span className="text-slate-700 font-bold block mb-0.5">Kata Sandi</span>
                      <div className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-400 font-medium">
                        ••••••••
                      </div>
                    </div>
                  </div>

                  <div
                    id="mini-preview-btn-masuk"
                    className="btn-masuk-sistem w-full py-2.5 px-3 bg-indigo-600 rounded-xl text-center flex items-center justify-center gap-1.5 shadow-md shadow-indigo-600/30"
                    style={{ color: '#ffffff', backgroundColor: '#4f46e5' }}
                  >
                    <LogIn className="w-3.5 h-3.5 shrink-0" style={{ color: '#ffffff' }} />
                    <span
                      className="font-black text-[11px] tracking-wide"
                      style={{ color: '#ffffff', textShadow: '0 1px 2px rgba(0,0,0,0.35)' }}
                    >
                      Masuk ke Sistem
                    </span>
                  </div>
                </div>

                {/* Simulated Mini Footer */}
                <div className="relative z-10 text-center text-[8px] font-medium text-slate-600 pt-1">
                  © {new Date().getFullYear()} {settings?.namaJemaat || 'Jemaat GKE'}
                </div>
              </div>

              {/* Quick Save Call to Action */}
              <button
                type="button"
                onClick={handleSaveSettings}
                disabled={isSaving}
                className="w-full py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs font-black shadow-md shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSaving ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                <span>Simpan Gambar Sebagai Background Login</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Full Screen Preview Modal */}
      {isFullPreviewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
          <div className="relative w-full max-w-5xl h-[90vh] bg-white rounded-3xl overflow-hidden shadow-2xl flex flex-col">
            {/* Modal Bar */}
            <div className="bg-slate-900 text-white py-3 px-6 flex items-center justify-between shrink-0 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-indigo-400" />
                <span className="text-xs font-bold">
                  Pratinjau Penuh Tampilan Halaman Login (Gaya Terang & Latar Gereja)
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsFullPreviewOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Simulated Full Login Screen */}
            <div className="relative flex-1 overflow-hidden flex flex-col justify-between p-6">
              <img
                src={bgUrl}
                alt="Background Gereja"
                className={`absolute inset-0 w-full h-full object-cover ${blurClass}`}
                referrerPolicy="no-referrer"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    'https://images.unsplash.com/photo-1543731068-7e0f5beff43a?auto=format&fit=crop&w=1920&q=80';
                }}
              />
              <div
                className="absolute inset-0 bg-gradient-to-b from-white/80 via-white/85 to-slate-100/90"
                style={{ opacity: Math.max(0.2, Math.min(0.95, overlayOpacity + 0.45)) }}
              />

              {/* Top Header */}
              <div className="relative z-10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 flex items-center justify-center shrink-0">
                    {settings?.logoUrl ? (
                      <img
                        src={settings.logoUrl}
                        alt="Logo"
                        className="w-full h-full object-contain"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <Church className="w-6 h-6 text-indigo-600" />
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-black text-slate-900">{settings?.namaAplikasi || 'SIKA GKE'}</p>
                    <p className="text-[10px] text-slate-500 font-semibold">{settings?.resortGke || 'GKE Resort'}</p>
                  </div>
                </div>
              </div>

              {/* Login Card */}
              <div className="relative z-10 my-auto bg-white/95 backdrop-blur-xl border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-2xl max-w-sm mx-auto w-full text-center space-y-4">
                <div className="w-16 h-16 flex items-center justify-center mx-auto">
                  {settings?.logoUrl ? (
                    <img
                      src={settings.logoUrl}
                      alt="Logo Gereja"
                      className="w-full h-full object-contain"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <Church className="w-10 h-10 text-indigo-600" />
                  )}
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900">Selamat Datang</h3>
                  <p className="text-xs text-slate-600 mt-1">
                    Silakan masuk dengan akun Anda untuk mengakses sistem informasi gereja.
                  </p>
                </div>
                <div className="space-y-3 text-left text-xs">
                  <div>
                    <label className="block text-slate-800 font-bold mb-1">Username</label>
                    <div className="px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-700 font-semibold">
                      admin
                    </div>
                  </div>
                  <div>
                    <label className="block text-slate-800 font-bold mb-1">Kata Sandi</label>
                    <div className="px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-700 font-semibold">
                      ••••••••
                    </div>
                  </div>
                  <button
                    type="button"
                    id="full-preview-btn-masuk"
                    className="btn-masuk-sistem w-full py-3.5 px-4 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-600/30 text-xs flex items-center justify-center gap-2 cursor-default border border-indigo-500/50"
                    style={{ color: '#ffffff', backgroundColor: '#4f46e5' }}
                  >
                    <LogIn className="w-4 h-4 text-white !text-white shrink-0" style={{ color: '#ffffff' }} />
                    <span
                      className="font-black text-sm tracking-wide"
                      style={{ color: '#ffffff', textShadow: '0 1px 2px rgba(0,0,0,0.35)' }}
                    >
                      Masuk ke Sistem
                    </span>
                  </button>
                </div>
              </div>

              {/* Footer */}
              <div className="relative z-10 text-center text-xs font-semibold text-slate-600">
                &copy; {new Date().getFullYear()} {settings?.namaJemaat || 'Majelis Jemaat GKE'}. Hak Cipta Dilindungi.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
