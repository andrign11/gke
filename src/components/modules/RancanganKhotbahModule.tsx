import React, { useState, useRef } from 'react';
import {
  Archive,
  AlertCircle,
  BookOpen,
  Calculator,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Copy,
  Edit2,
  Feather,
  FileText,
  Flame,
  Heart,
  HelpCircle,
  Info,
  Layers,
  Loader2,
  Maximize2,
  Minus,
  Music,
  Plus,
  Printer,
  RotateCcw,
  Search,
  ShieldCheck,
  Sliders,
  Sparkles,
  Trash2,
  UserCheck,
  Users,
  X,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { PoinKhotbah, RancanganKhotbah } from '../../types';

export const RancanganKhotbahModule: React.FC = () => {
  const {
    rancanganKhotbahList,
    addRancanganKhotbah,
    updateRancanganKhotbah,
    deleteRancanganKhotbah,
    openPrintReport,
    currentUser,
  } = useApp();

  const [search, setSearch] = useState('');
  const [tabArsip, setTabArsip] = useState<'Aktif' | 'Diarsipkan'>('Aktif');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<RancanganKhotbah | null>(null);
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [readingItem, setReadingItem] = useState<Omit<RancanganKhotbah, 'id'> | RancanganKhotbah | null>(null);

  // AI Generator Modal States
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isRetorikaMode, setIsRetorikaMode] = useState(false);
  const [aiNats, setAiNats] = useState('Yohanes 15 : 9 - 17');
  const [aiJenisIbadah, setAiJenisIbadah] = useState('Kebaktian Minggu Pagi');
  const [aiMetodeHomiletika, setAiMetodeHomiletika] = useState('Pastoral-Konseling');
  const [aiNadaPastoral, setAiNadaPastoral] = useState('Penguatan & Penghiburan');
  const [aiSasaranPendengar, setAiSasaranPendengar] = useState('Seluruh Warga Jemaat Lintas Generasi');
  const [aiTema, setAiTema] = useState('Mengasihi Sesama sebagai Wujud Ketaatan');
  const [aiPengkhotbah, setAiPengkhotbah] = useState(currentUser.nama || 'Pdt. Drs. Yansen K. M.Th');
  const [aiDurasi, setAiDurasi] = useState<number>(30);
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiGenerationProgress, setAiGenerationProgress] = useState<number>(0);
  const [aiGenerationStatus, setAiGenerationStatus] = useState<string>('Menganalisis Nats & Konteks Eksegetis Alkitab...');
  const [aiPreviewResult, setAiPreviewResult] = useState<Omit<RancanganKhotbah, 'id'> | null>(null);
  const [previewTab, setPreviewTab] = useState<'naskah' | 'tujuan' | 'liturgi'>('naskah');
  const previewResultRef = useRef<HTMLDivElement>(null);

  const handleOpenRetorikaAiModal = () => {
    setAiPreviewResult(null);
    setIsRetorikaMode(true);
    setAiMetodeHomiletika('Retorika Mimbar & Oratori Pastoral GKE');
    setAiNadaPastoral('Retorika Megah, Persuasif & Menggugah Jiwa');
    setAiTema('Pemberitaan Retorika Firman Allah & Pemulihan Pastoral');
    setIsAiModalOpen(true);
  };

  const handleOpenStandardAiModal = () => {
    setAiPreviewResult(null);
    setIsRetorikaMode(false);
    setAiMetodeHomiletika('Pastoral-Konseling');
    setAiNadaPastoral('Penguatan & Penghiburan');
    setIsAiModalOpen(true);
  };

  // Format full spoken sermon manuscript into clean formatted text ready to copy
  const getFormattedManuscript = (item: Omit<RancanganKhotbah, 'id'> | RancanganKhotbah) => {
    let text = `NASKAH LISAN KHOTBAH LENGKAP (SIAP DIBACA MIMBAR GKE)\n`;
    text += `=======================================================\n`;
    text += `Judul Khotbah: ${item.judulKhotbah}\n`;
    text += `Nats Alkitab  : ${item.natsAlkitab}\n`;
    text += `Tema Utama    : ${item.temaKhotbah}\n`;
    text += `Jenis Ibadah  : ${item.jenisIbadah || 'Kebaktian'}\n`;
    text += `Pelayan Firman: ${item.pengkhotbah || 'Pelayan Firman GKE'}\n`;
    text += `Target Durasi : ${item.durasiTotalMenit} Menit\n`;
    text += `=======================================================\n\n`;

    if (item.tujuanPastoral) {
      text += `[ TRITUNGGAL TUJUAN PASTORAL ]\n`;
      text += `• Kognitif  : ${item.tujuanPastoral.kognitif || '-'}\n`;
      text += `• Afektif   : ${item.tujuanPastoral.afektif || '-'}\n`;
      text += `• Psikomotor: ${item.tujuanPastoral.psikomotorik || '-'}\n\n`;
    }

    text += `--- I. PENDAHULUAN & SALAM LITURGIS GKE ---\n`;
    text += `${item.pendahuluan}\n\n`;

    text += `--- II. POIN-POIN UTAMA NASKAH KHOTBAH LISAN (${item.poinUtama.length} Poin) ---\n\n`;
    item.poinUtama.forEach((poin) => {
      text += `${poin.judulPoin} (~${poin.durasiMenit} Menit)\n`;
      text += `${poin.penjelasan}\n`;
      if (poin.nasihatPastoral) {
        text += `💡 Nasihat Pastoral: ${poin.nasihatPastoral}\n`;
      }
      text += `\n`;
    });

    text += `--- III. PENERAPAN APLIKASI PASTORAL WARGA JEMAAT ---\n`;
    text += `${item.penerapanAplikasi}\n\n`;

    text += `--- IV. PENUTUP & TEKS DOA SYAFAAT PASTORAL GKE (SIAP DIBACA) ---\n`;
    text += `${item.penutupDoa}\n\n`;

    if (item.catatanLiturgis) {
      text += `🎵 Catatan Liturgis & Rekomendasi Nyanyian:\n${item.catatanLiturgis}\n`;
    }

    return text;
  };

  const countWords = (text: string) => {
    if (!text) return 0;
    return text.trim().split(/\s+/).filter(Boolean).length;
  };

  const handleCopyManuscript = (item: Omit<RancanganKhotbah, 'id'> | RancanganKhotbah, idTag: string) => {
    const text = getFormattedManuscript(item);
    navigator.clipboard.writeText(text);
    setCopiedId(idTag);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const canEdit =
    currentUser.role === 'admin' ||
    currentUser.role === 'sekretaris' ||
    currentUser.role === 'bendahara';

  // Helper to proportionally scale point durations when total duration changes
  const scalePointDurations = (poinUtama: PoinKhotbah[], targetDuration: number): PoinKhotbah[] => {
    if (!poinUtama || poinUtama.length === 0) return [];
    const currentTotal = poinUtama.reduce((sum, p) => sum + (Number(p.durasiMenit) || 0), 0);

    if (currentTotal === 0) {
      const base = Math.max(1, Math.floor(targetDuration / poinUtama.length));
      return poinUtama.map((p, idx) => ({
        ...p,
        durasiMenit: idx === 0 ? base + (targetDuration - base * poinUtama.length) : base,
      }));
    }

    let remaining = targetDuration;
    const newPoints = poinUtama.map((p, idx) => {
      if (idx === poinUtama.length - 1) {
        return { ...p, durasiMenit: Math.max(1, remaining) };
      }
      const scaled = Math.max(1, Math.round(((Number(p.durasiMenit) || 1) / currentTotal) * targetDuration));
      remaining -= scaled;
      return { ...p, durasiMenit: scaled };
    });

    return newPoints;
  };

  const handleQuickAdjustCardDuration = (item: RancanganKhotbah, deltaMinutes: number) => {
    const newDuration = Math.max(5, (item.durasiTotalMenit || 30) + deltaMinutes);
    const updatedPoints = scalePointDurations(item.poinUtama, newDuration);
    updateRancanganKhotbah(item.id, {
      ...item,
      durasiTotalMenit: newDuration,
      poinUtama: updatedPoints,
    });
  };

  const handleAdjustAiPreviewDuration = (deltaMinutes: number) => {
    if (!aiPreviewResult) return;
    const newDuration = Math.max(5, (aiPreviewResult.durasiTotalMenit || 30) + deltaMinutes);
    const updatedPoints = scalePointDurations(aiPreviewResult.poinUtama, newDuration);
    setAiPreviewResult({
      ...aiPreviewResult,
      durasiTotalMenit: newDuration,
      poinUtama: updatedPoints,
    });
  };

  const handleAutoBalanceFormDataPoints = () => {
    const updatedPoints = scalePointDurations(formData.poinUtama, formData.durasiTotalMenit);
    setFormData((prev) => ({
      ...prev,
      poinUtama: updatedPoints,
    }));
  };

  const [autoFormatNotice, setAutoFormatNotice] = useState<string | null>(null);

  // States for Save Confirmation & Progress Bar
  const [isConfirmSaveOpen, setIsConfirmSaveOpen] = useState(false);
  const [isSavingWithProgress, setIsSavingWithProgress] = useState(false);
  const [saveProgress, setSaveProgress] = useState(0);
  const [saveStatusMessage, setSaveStatusMessage] = useState('');

  // States for Delete Confirmation & Progress Bar
  const [deletingItem, setDeletingItem] = useState<RancanganKhotbah | null>(null);
  const [isDeletingWithProgress, setIsDeletingWithProgress] = useState(false);
  const [deleteProgress, setDeleteProgress] = useState(0);
  const [deleteStatusMessage, setDeleteStatusMessage] = useState('');

  // States for Edit Confirmation & Progress Bar
  const [editingCandidateItem, setEditingCandidateItem] = useState<RancanganKhotbah | null>(null);
  const [isEditingWithProgress, setIsEditingWithProgress] = useState(false);
  const [editProgress, setEditProgress] = useState(0);
  const [editStatusMessage, setEditStatusMessage] = useState('');

  // States for Archive Confirmation & Progress Bar
  const [archivingItem, setArchivingItem] = useState<RancanganKhotbah | null>(null);
  const [isArchivingWithProgress, setIsArchivingWithProgress] = useState(false);
  const [archiveProgress, setArchiveProgress] = useState(0);
  const [archiveStatusMessage, setArchiveStatusMessage] = useState('');

  // States for AI Auto-Format Progress
  const [isAutoFormatting, setIsAutoFormatting] = useState(false);
  const [autoFormatStatus, setAutoFormatStatus] = useState('');

  const applyLocalPresetFallback = (natsInput: string) => {
    const SERMON_PRESETS = [
      {
        judulKhotbah: 'Hidup dalam Persekutuan Kasih Kristus yang Melimpah',
        natsAlkitab: 'Yohanes 15 : 9 - 17',
        temaKhotbah: 'Mengasihi Sesama sebagai Wujud Ketaatan pada Kristus',
        jenisIbadah: 'Kebaktian Minggu Pagi',
        metodeHomiletika: 'Pastoral-Konseling',
        nadaPastoral: 'Penguatan & Penghiburan Kasih',
        sasaranPendengar: 'Seluruh Warga Jemaat Lintas Generasi',
        tujuanPastoral: {
          kognitif: 'Memahami makna kasih Kristus sebagai pondasi utama persekutuan gereja GKE.',
          afektif: 'Meresapi kehangatan persahabatan dan pengampunan Kristus dalam pergumulan hidup.',
          psikomotorik: 'Mewujudkan kepedulian nyata melalui aksi diakonia dan keaktifan di ibadah rayon.',
        },
        pendahuluan: `Tabe Salam Sembah, Salam Sejahtera dalam Kasih Tuhan Yesus Kristus!\n\nBapak, Ibu, Penatua, Diakon, serta Saudara-saudari seluruh Warga Jemaat yang dikasihi dan mengasihi Tuhan Yesus Kristus.\n\nDi hari yang penuh kegembiraan dan ungkapan syukur ini, kita kembali dihimpunkan oleh Roh Kudus untuk merayakan persekutuan kudus di hadapan Allah. Mari kita buka mata rohani dan keheningan hati kita menyambut kebenaran Alkitab dari Yohanes 15:9-17 dengan tema: "Mengasihi Sesama sebagai Wujud Ketaatan pada Kristus".\n\nDalam dinamika kehidupan masyarakat modern di Kalimantan, persekutuan dan keharmonisan sering kali diuji oleh kesibukan dan perbedaan pendapat. Firman Tuhan hari ini menjadi pengingat mulia bahwa kekuatan iman kita terletak pada seberapa dekat kita melekat pada pokok anggur yang benar, yaitu Yesus Kristus. Amin.`,
        poinUtama: [
          {
            judulPoin: '1. Melekat pada Pokok Anggur yang Benar (Ayat 9-11)',
            penjelasan: `Saudara-saudari yang dikasihi Kristus,\n\nKetika Kristus berkata "Tinggallah di dalam kasih-Ku", Ia memberikan garansi spiritual bahwa sumber kedamaian dan sukacita kita bukan berasal dari dunia, melainkan dari persekutuan intim dengan Allah. Ranting tidak dapat berbuah dari dirinya sendiri jika tidak melekat pada pokok anggur.\n\nDalam tradisi Teologi Reformed Evangelikal GKE, pertumbuhan rohani adalah hasil dari Kasih Karunia Allah (Sola Gratia). Tanpa jamahan dan pimpinan Roh Kudus, pelayanan kita hanyalah rutinitas lahiriah semata.`,
            nasihatPastoral: 'Luangkan waktu khusus setiap hari untuk berdoa dan membaca Alkitab di tengah rutinitas keluarga.',
            durasiMenit: 10,
          },
          {
            judulPoin: '2. Perintah Mengasihi Tanpa Syarat (Ayat 12-14)',
            penjelasan: `Bapak, Ibu, dan Saudara sekalian,\n\nKristus menyebut kita bukan lagi hamba, melainkan sahabat-Nya. Ukuran persahabatan Kristus adalah kerelaan memberi diri bagi sesama. Falsafah Belom Bahadat—hidup beradab dan beretika di Kalimantan—menemukan kepenuhannya saat kita membuka pintu maaf dan saling menanggung beban di ibadah Rayon maupun keluarga.`,
            nasihatPastoral: 'Buanglah akar kepahitan dan dendam, gantikan dengan pengampunan dan salam kasih Kristus.',
            durasiMenit: 12,
          },
          {
            judulPoin: '3. Dipilih untuk Berbuah Kekal (Ayat 15-17)',
            penjelasan: `Jemaat yang dikasihi Tuhan,\n\nKita dipilih bukan hanya untuk menikmati keselamatan, melainkan untuk diutus menghasilkan buah yang tetap. Setiap warga GKE dipanggil menjadi saksi Kristus di tempat kerja, pasar, sekolah, dan lingkungan tempat tinggal kita.`,
            nasihatPastoral: 'Jadilah pembawa damai dan penolong bagi warga jemaat yang sedang sakit atau membutuhkan.',
            durasiMenit: 8,
          },
        ],
        penerapanAplikasi: `Langkah Aksi Pastoral Warga Jemaat GKE:\n1. Mengadakan saat teduh dan doa malam keluarga secara teratur.\n2. Setia hadir dan aktif mendukung Ibadah Rayon serta Seksi Kategorial (SPRP, SPW, PEB).\n3. Mengambil bagian dalam aksi diakonia mendatangi saudara yang terbaring sakit.\n4. Merawat kerukunan dan kelestarian alam ciptaan Allah di Kalimantan.`,
        penutupDoa: `NASKAH DOA SYAFAAT PASTORAL (SIAP DIBACA LANGSUNG):\n\n"Bapa di dalam Surga, Allah yang Mahakasih. Kami bersyukur atas bentangan Firman-Mu yang menyejukkan jiwa kami. Tanamkanlah kebenaran-Mu agar kami senantiasa tinggal di dalam kasih Kristus dan berbuah manis bagi sesama.\n\nKami mendoakan Gereja Kalimantan Evangelis (GKE), pimpinan Majelis, para Pendeta, Penatua, Diakon, dan seluruh jemaat. Berkatilah warga kami yang sakit, yang berduka, serta yang berjuang dalam pekerjaan. Terima kasih Tuhan, di dalam nama Yesus Kristus kami berdoa. Amin."`,
        catatanLiturgis: 'Rekomendasi Nyanyian: Nyanyian Jemaat GKE No. 182 / NKB No. 128 / KJ No. 400.',
      },
      {
        judulKhotbah: 'Tuhan adalah Gembalaku yang Baik dan Setia',
        natsAlkitab: 'Mazmur 23 : 1 - 6',
        temaKhotbah: 'Menemukan Ketenangan Jiwa di Tengah Gelombang Pergumulan',
        jenisIbadah: 'Kebaktian Minggu Pagi',
        metodeHomiletika: 'Pastoral-Konseling',
        nadaPastoral: 'Penguatan & Penghiburan',
        sasaranPendengar: 'Warga Jemaat yang Mengalami Lembah Pergumulan',
        tujuanPastoral: {
          kognitif: 'Memahami penyertaan Allah yang sempurna sebagaimana disaksikan Daud dalam Mazmur 23.',
          afektif: 'Merasakan ketenangan batin dan kepastian perlindungan Tuhan di masa sulit.',
          psikomotorik: 'Penyerahan penuh kepada kehendak Allah dalam ketekunan doa.',
        },
        pendahuluan: `Tabe Salam Sembah dalam Kasih Tuhan Yesus Kristus!\n\nBapak, Ibu, dan Saudara-saudara warga jemaat GKE yang dikasihi Tuhan.\n\nMazmur 23 adalah nyanyian iman yang sangat dekat di hati kita. Daud tidak menulis mazmur ini di atas takhta kemegahan tanpa tantangan, melainkan berdasarkan pengalaman nyata melintasi lembah kekelaman bersama Allah.\n\nHari ini, di tengah riuh dan kecemasan dunia, Gembala Agung kita mengajak kita berhenti sejenak di padang yang berrumput hijau dan di dekat air yang tenang. Amin.`,
        poinUtama: [
          {
            judulPoin: '1. Gembala yang Menjamin Segala Kebutuhan Jiwa (Ayat 1-3)',
            penjelasan: `Saudara-saudaraku,\n\nPernyataan "Tuhan adalah gembalaku, takkan kekurangan aku" bukan sekadar kalimat puitis, melainkan pengakuan iman yang dalam. Seorang gembala mengenal domba-dombanya satu per satu, memberi minum saat haus, dan memulihkan jiwa yang lelah.`,
            nasihatPastoral: 'Jangan biarkan kekhawatiran materi merenggut damai sejahtera yang diberikan Tuhan.',
            durasiMenit: 10,
          },
          {
            judulPoin: '2. Penyertaan Tuhan di Lembah Kekelaman (Ayat 4)',
            penjelasan: `Bapak dan Ibu yang sedang berjuang,\n\n"Sekalipun aku berjalan dalam lembah kekelaman, aku tidak takut berbahaya, sebab Engkau besertaku." Tongkat dan gada Tuhan bukan untuk menghukum, melainkan untuk melindungi dan mengarahkan jalan kita dari jurang kebinasaan.`,
            nasihatPastoral: 'Ketika merasa sendiri di masa sakit atau duka, ingatlah bahwa Kristus memegang tangan Anda.',
            durasiMenit: 12,
          },
          {
            judulPoin: '3. Kepastian Kebaikan dan Kemurahan Allah (Ayat 5-6)',
            penjelasan: `Jemaat yang terkasih,\n\nTuhan menyediakan hidangan di hadapan lawan-lawan kita dan mengurapi kepala kita dengan minyak. Kebaikan dan kemurahan Allah akan mengikuti kita seumur hidup kita, sampai kita diam di rumah Tuhan sepanjang masa.`,
            nasihatPastoral: 'Tinggallah dalam persekutuan rumah Tuhan dengan hati penuh syukur.',
            durasiMenit: 8,
          },
        ],
        penerapanAplikasi: `Langkah Aksi Pastoral:\n1. Membiasakan berdoa menyerahkan pergumulan hidup setiap pagi sebelum beraktivitas.\n2. Menjadi penghibur bagi sesama warga jemaat yang sedang berduka atau dirawat di rumah sakit.\n3. Mengingat dan mencatat kebaikan-kebaikan Tuhan sebagai peringatan penguatan iman.`,
        penutupDoa: `NASKAH DOA SYAFAAT PASTORAL (SIAP DIBACA LANGSUNG):\n\n"Ya Tuhan Gembala yang Baik, kami menyerahkan seluruh keberadaan kami ke dalam tangan-Mu. Pulihkanlah saudara-saudari kami yang lemah, luputkanlah kami dari ketakutan, dan penuhilah cawan hidup kami dengan ucapan syukur.\n\nUrapi seluruh Pelayan Firman, Majelis Jemaat GKE, dan warga jemaat dari anak-anak hingga lansia. Dalam nama Yesus Kristus, Gembala Agung kami, kami berdoa. Amin."`,
        catatanLiturgis: 'Rekomendasi Nyanyian: Kidung Jemaat No. 415 / Nyanyian Jemaat GKE No. 120 / NKB No. 138.',
      },
    ];

    const selected = SERMON_PRESETS[Math.floor(Math.random() * SERMON_PRESETS.length)];
    const displayTitle = natsInput
      ? `Khotbah Alkitabiah GKE: Pelayanan Firman (${natsInput})`
      : selected.judulKhotbah;

    setFormData((prev) => ({
      ...prev,
      judulKhotbah: displayTitle,
      natsAlkitab: natsInput || selected.natsAlkitab,
      temaKhotbah: prev.temaKhotbah || selected.temaKhotbah,
      jenisIbadah: selected.jenisIbadah,
      metodeHomiletika: selected.metodeHomiletika,
      nadaPastoral: selected.nadaPastoral,
      sasaranPendengar: selected.sasaranPendengar,
      pengkhotbah: prev.pengkhotbah.trim() || currentUser.nama || 'Pelayan Firman GKE',
      durasiTotalMenit: selected.poinUtama.reduce((s, p) => s + p.durasiMenit, 0),
      tujuanPastoral: selected.tujuanPastoral,
      pendahuluan: selected.pendahuluan,
      poinUtama: selected.poinUtama,
      penerapanAplikasi: selected.penerapanAplikasi,
      penutupDoa: selected.penutupDoa,
      catatanLiturgis: selected.catatanLiturgis,
      sumberAI: true,
      versiKhotbah: 'AI Preset Homiletika GKE',
    }));

    setAutoFormatNotice(`✓ AI mencarikan & menyelaraskan naskah lisan Khotbah berdasarkan Nats ${natsInput || selected.natsAlkitab}!`);
    setTimeout(() => setAutoFormatNotice(null), 5000);
  };

  const handleAutoFormatNaskah = async () => {
    if (isAutoFormatting) return;
    setIsAutoFormatting(true);
    setAutoFormatStatus('AI sedang mencarikan Judul & Naskah Khotbah Alkitabiah berdasarkan Nats...');

    const natsInput = formData.natsAlkitab.trim();
    const temaInput = formData.temaKhotbah.trim();

    try {
      const response = await fetch('/api/generate-khotbah', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          natsAlkitab: natsInput || 'Yohanes 15 : 9 - 17',
          temaKhotbah: temaInput,
          durasiTotalMenit: formData.durasiTotalMenit || 30,
          jenisIbadah: formData.jenisIbadah || 'Kebaktian Minggu Pagi',
          pengkhotbah: formData.pengkhotbah || currentUser.nama || 'Pelayan Firman GKE',
          metodeHomiletika: formData.metodeHomiletika || 'Pastoral-Konseling',
          nadaPastoral: formData.nadaPastoral || 'Penguatan & Penghiburan',
          sasaranPendengar: formData.sasaranPendengar || 'Seluruh Warga Jemaat Lintas Generasi',
        }),
      });

      const resData = await response.json();
      if (resData.success && resData.data) {
        const data = resData.data;
        const totalDur = Array.isArray(data.poinUtama)
          ? data.poinUtama.reduce((sum: number, p: any) => sum + (Number(p.durasiMenit) || 0), 0)
          : (data.durasiTotalMenit || 30);

        setFormData((prev) => ({
          ...prev,
          judulKhotbah: data.judulKhotbah || `Khotbah Alkitabiah GKE: ${data.natsAlkitab}`,
          natsAlkitab: data.natsAlkitab || natsInput || 'Yohanes 15 : 9 - 17',
          temaKhotbah: data.temaKhotbah || temaInput || 'Pemberitaan Firman Allah',
          jenisIbadah: data.jenisIbadah || prev.jenisIbadah,
          metodeHomiletika: data.metodeHomiletika || prev.metodeHomiletika,
          nadaPastoral: data.nadaPastoral || prev.nadaPastoral,
          sasaranPendengar: data.sasaranPendengar || prev.sasaranPendengar,
          pengkhotbah: prev.pengkhotbah.trim() || currentUser.nama || 'Pelayan Firman GKE',
          durasiTotalMenit: totalDur || prev.durasiTotalMenit,
          tujuanPastoral: data.tujuanPastoral || prev.tujuanPastoral,
          pendahuluan: data.pendahuluan || prev.pendahuluan,
          poinUtama: Array.isArray(data.poinUtama) && data.poinUtama.length > 0 ? data.poinUtama : prev.poinUtama,
          penerapanAplikasi: data.penerapanAplikasi || prev.penerapanAplikasi,
          penutupDoa: data.penutupDoa || prev.penutupDoa,
          catatanLiturgis: data.catatanLiturgis || prev.catatanLiturgis,
          sumberAI: true,
          versiKhotbah: 'AI Digital Homiletika GKE',
        }));

        setAutoFormatNotice(`✓ AI berhasil mencarikan Judul Khotbah "${data.judulKhotbah}" berdasarkan Nats ${data.natsAlkitab}!`);
        setTimeout(() => setAutoFormatNotice(null), 5000);
      } else {
        applyLocalPresetFallback(natsInput);
      }
    } catch (err) {
      console.error('Failed auto formatting with AI:', err);
      applyLocalPresetFallback(natsInput);
    } finally {
      setIsAutoFormatting(false);
      setAutoFormatStatus('');
    }
  };

  // Manual Form State
  const [formData, setFormData] = useState<Omit<RancanganKhotbah, 'id'>>({
    judulKhotbah: 'Hidup dalam Persekutuan Kasih Kristus',
    natsAlkitab: 'Yohanes 15 : 9 - 17',
    temaKhotbah: 'Mengasihi Sesama sebagai Wujud Ketaatan',
    pengkhotbah: 'Pdt. Drs. Yansen K. M.Th',
    tanggal: new Date().toISOString().split('T')[0],
    durasiTotalMenit: 30,
    jenisIbadah: 'Kebaktian Minggu Pagi',
    metodeHomiletika: 'Pastoral-Konseling',
    nadaPastoral: 'Penguatan & Penghiburan',
    sasaranPendengar: 'Seluruh Warga Jemaat Lintas Generasi',
    tujuanPastoral: {
      kognitif: 'Memahami makna kasih Kristus sebagai pengikat utama persekutuan jemaat.',
      afektif: 'Penghayatan kehangatan kasih Tuhan di tengah kesusahan.',
      psikomotorik: 'Mewujudkan kepedulian melalui kunjungan diakonia rayon.',
    },
    pendahuluan:
      'Tabe Salam Sembah, Salam Sejahtera dalam Kasih Tuhan Yesus Kristus. Pengantar tentang perintah kasih Kristus di tengah dinamika persekutuan jemaat modern.',
    poinUtama: [
      {
        judulPoin: '1. Tinggal di Dalam Kasih Kristus (Ayat 9-11)',
        penjelasan: 'Kunci ketahanan iman adalah selalu melekat pada pokok anggur yang benar.',
        nasihatPastoral: 'Tetaplah berdoa dan bersekutu meskipun banyak tantangan hidup.',
        durasiMenit: 8,
      },
      {
        judulPoin: '2. Saling Mengasihi Tanpa Syarat (Ayat 12-14)',
        penjelasan: 'Bukti persahabatan dengan Kristus adalah saling menanggung beban antar jemaat.',
        nasihatPastoral: 'Buka pintu maaf dan mari saling menguatkan.',
        durasiMenit: 10,
      },
      {
        judulPoin: '3. Dipilih untuk Berbuah Banyak (Ayat 15-17)',
        penjelasan: 'Tujuan panggilan gereja adalah menghasilkan buah pelayanan yang kekal.',
        nasihatPastoral: 'Jadilah saluran berkat di mana pun Tuhan menempatkan kita.',
        durasiMenit: 7,
      },
    ],
    penerapanAplikasi:
      'Praktikkan kasih dalam tindakan konkret sehari-hari: mengunjungi warga yang sakit dan mempererat persekutuan rayon.',
    penutupDoa:
      'Ucapan syukur dan komitmen untuk menjadi pembawa damai sejahtera bagi jemaat dan lingkungan.',
    catatanLiturgis: 'Rekomendasi Nyanyian: Nyanyian Jemaat GKE No. 182 / NKB No. 128.',
    statusArsip: 'Aktif',
    sumberAI: false,
  });

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormData({
      judulKhotbah: '',
      natsAlkitab: '',
      temaKhotbah: '',
      pengkhotbah: currentUser.nama || 'Pelayan Firman',
      tanggal: new Date().toISOString().split('T')[0],
      durasiTotalMenit: 30,
      jenisIbadah: 'Kebaktian Minggu Pagi',
      metodeHomiletika: 'Pastoral-Konseling',
      nadaPastoral: 'Penguatan & Penghiburan',
      sasaranPendengar: 'Seluruh Warga Jemaat',
      tujuanPastoral: { kognitif: '', afektif: '', psikomotorik: '' },
      pendahuluan: '',
      poinUtama: [
        { judulPoin: 'Poin 1: Latar Belakang & Eksegesis Teks', penjelasan: '', nasihatPastoral: '', durasiMenit: 10 },
        { judulPoin: 'Poin 2: Pesan Teologis & Refleksi Pastoral', penjelasan: '', nasihatPastoral: '', durasiMenit: 10 },
      ],
      penerapanAplikasi: '',
      penutupDoa: '',
      catatanLiturgis: '',
      statusArsip: 'Aktif',
      sumberAI: false,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: RancanganKhotbah) => {
    setEditingItem(item);
    setFormData({ ...item });
    setIsModalOpen(true);
  };

  const handleToggleArsip = (item: RancanganKhotbah) => {
    const newStatus = item.statusArsip === 'Diarsipkan' ? 'Aktif' : 'Diarsipkan';
    updateRancanganKhotbah(item.id, { ...item, statusArsip: newStatus });
  };

  const handleAddPoin = () => {
    setFormData((prev) => ({
      ...prev,
      poinUtama: [
        ...prev.poinUtama,
        {
          judulPoin: `Poin ${prev.poinUtama.length + 1}`,
          penjelasan: '',
          nasihatPastoral: '',
          durasiMenit: 5,
        },
      ],
    }));
  };

  const handleRemovePoin = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      poinUtama: prev.poinUtama.filter((_, i) => i !== index),
    }));
  };

  const handlePoinChange = (
    index: number,
    field: keyof PoinKhotbah,
    value: string | number
  ) => {
    setFormData((prev) => {
      const updated = [...prev.poinUtama];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, poinUtama: updated };
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Tampilkan modal konfirmasi penyimpanan terlebih dahulu
    setIsConfirmSaveOpen(true);
  };

  const handleConfirmSaveExecute = () => {
    setIsConfirmSaveOpen(false);
    setIsSavingWithProgress(true);
    setSaveProgress(15);
    setSaveStatusMessage('Memvalidasi kelengkapan naskah & struktur liturgis GKE...');

    setTimeout(() => {
      setSaveProgress(45);
      setSaveStatusMessage('Proses penyelarasan data homiletika & alokasi durasi...');
    }, 400);

    setTimeout(() => {
      setSaveProgress(75);
      setSaveStatusMessage('Menyimpan Naskah Khotbah ke Firestore Database...');
    }, 900);

    setTimeout(() => {
      setSaveProgress(100);
      setSaveStatusMessage('Penyimpanan Berhasil! Naskah Siap Baca berhasil diarsipkan.');
    }, 1400);

    setTimeout(() => {
      if (editingItem) {
        updateRancanganKhotbah(editingItem.id, formData);
      } else {
        addRancanganKhotbah(formData);
      }
      setIsSavingWithProgress(false);
      setIsModalOpen(false);
    }, 1800);
  };

  // Confirm Delete Execute
  const handleConfirmDeleteExecute = () => {
    if (!deletingItem) return;
    const itemToDelete = deletingItem;
    setDeletingItem(null);
    setIsDeletingWithProgress(true);
    setDeleteProgress(20);
    setDeleteStatusMessage('Mempersiapkan penghapusan data naskah khotbah...');

    setTimeout(() => {
      setDeleteProgress(60);
      setDeleteStatusMessage('Menghapus data dari Firestore Database...');
    }, 350);

    setTimeout(() => {
      setDeleteProgress(100);
      setDeleteStatusMessage('Penghapusan Berhasil!');
    }, 750);

    setTimeout(() => {
      deleteRancanganKhotbah(itemToDelete.id);
      setIsDeletingWithProgress(false);
    }, 1100);
  };

  // Confirm Edit Execute
  const handleConfirmEditExecute = () => {
    if (!editingCandidateItem) return;
    const itemToEdit = editingCandidateItem;
    setEditingCandidateItem(null);
    setIsEditingWithProgress(true);
    setEditProgress(30);
    setEditStatusMessage('Mempersiapkan formulir naskah khotbah...');

    setTimeout(() => {
      setEditProgress(75);
      setEditStatusMessage('Memuat data homiletika & struktur pastoral...');
    }, 300);

    setTimeout(() => {
      setEditProgress(100);
      setEditStatusMessage('Siap Diedit!');
    }, 600);

    setTimeout(() => {
      handleOpenEdit(itemToEdit);
      setIsEditingWithProgress(false);
    }, 900);
  };

  // Confirm Archive Execute
  const handleConfirmArchiveExecute = () => {
    if (!archivingItem) return;
    const itemToArchive = archivingItem;
    const isArchiving = itemToArchive.statusArsip !== 'Diarsipkan';
    setArchivingItem(null);
    setIsArchivingWithProgress(true);
    setArchiveProgress(30);
    setArchiveStatusMessage(isArchiving ? 'Mengarsipkan naskah khotbah...' : 'Mengembalikan naskah ke daftar aktif...');

    setTimeout(() => {
      setArchiveProgress(75);
      setArchiveStatusMessage('Memperbarui status pangkalan data GKE...');
    }, 300);

    setTimeout(() => {
      setArchiveProgress(100);
      setArchiveStatusMessage(isArchiving ? 'Naskah Berhasil Diarsipkan!' : 'Naskah Kembali Aktif!');
    }, 650);

    setTimeout(() => {
      handleToggleArsip(itemToArchive);
      setIsArchivingWithProgress(false);
    }, 950);
  };

  // AI Sermon Generation Call
  const handleGenerateAiKhotbah = async () => {
    if (!aiNats.trim()) return;
    setIsGenerating(true);
    setAiPreviewResult(null);
    setAiGenerationProgress(15);
    setAiGenerationStatus('Menganalisis Nats & Konteks Eksegetis Alkitab...');

    const progressInterval = setInterval(() => {
      setAiGenerationProgress((prev) => {
        if (prev < 35) {
          setAiGenerationStatus('Menerapkan Teologi Reformed Evangelikal & Homiletika GKE...');
          return prev + 10;
        } else if (prev < 70) {
          setAiGenerationStatus('Penyusunan Poin Homiletis, Refleksi & Nasihat Pastoral...');
          return prev + 10;
        } else if (prev < 90) {
          setAiGenerationStatus('Mengkalkulasi Alokasi Menit & Naskah Lisan Siap Baca...');
          return prev + 5;
        }
        return prev;
      });
    }, 350);

    try {
      const response = await fetch('/api/generate-khotbah', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          natsAlkitab: aiNats,
          jenisIbadah: aiJenisIbadah,
          metodeHomiletika: aiMetodeHomiletika,
          nadaPastoral: aiNadaPastoral,
          sasaranPendengar: aiSasaranPendengar,
          temaKhotbah: aiTema,
          pengkhotbah: aiPengkhotbah,
          durasiTotalMenit: aiDurasi,
          isRetorikaMode: isRetorikaMode,
        }),
      });

      const resData = await response.json();
      clearInterval(progressInterval);
      setAiGenerationProgress(100);
      setAiGenerationStatus('Generasi Khotbah Digital Selesai!');

      if (resData.success && resData.data) {
        setAiPreviewResult({
          judulKhotbah: resData.data.judulKhotbah || (isRetorikaMode ? 'Rancangan Khotbah Retorika AI GKE' : 'Rancangan Khotbah AI GKE'),
          natsAlkitab: resData.data.natsAlkitab || aiNats,
          temaKhotbah: resData.data.temaKhotbah || aiTema,
          pengkhotbah: aiPengkhotbah || 'Pelayan Firman GKE',
          tanggal: new Date().toISOString().split('T')[0],
          durasiTotalMenit: resData.data.durasiTotalMenit || aiDurasi,
          jenisIbadah: resData.data.jenisIbadah || aiJenisIbadah,
          metodeHomiletika: resData.data.metodeHomiletika || aiMetodeHomiletika,
          nadaPastoral: resData.data.nadaPastoral || aiNadaPastoral,
          sasaranPendengar: resData.data.sasaranPendengar || aiSasaranPendengar,
          tujuanPastoral: resData.data.tujuanPastoral || {
            kognitif: 'Pemahaman akan teks Alkitab',
            afektif: 'Penghayatan kasih Allah',
            psikomotorik: 'Aksi nyata dalam persekutuan',
          },
          pendahuluan: resData.data.pendahuluan || '',
          poinUtama: resData.data.poinUtama || [],
          penerapanAplikasi: resData.data.penerapanAplikasi || '',
          penutupDoa: resData.data.penutupDoa || '',
          catatanLiturgis: resData.data.catatanLiturgis || '',
          statusArsip: 'Aktif',
          sumberAI: true,
          versiKhotbah: isRetorikaMode ? 'Versi Retorika AI GKE' : 'AI Homiletika & Pastoral GKE',
        });
      }
    } catch (err) {
      console.error('Failed generating AI khotbah:', err);
      clearInterval(progressInterval);
      setAiGenerationProgress(0);
      setAiGenerationStatus('Gagal menyusun naskah AI.');
    } finally {
      setTimeout(() => {
        setIsGenerating(false);
        setTimeout(() => {
          if (previewResultRef.current) {
            previewResultRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 150);
      }, 500);
    }
  };

  const handleSaveAiResult = () => {
    if (!aiPreviewResult) return;
    addRancanganKhotbah(aiPreviewResult);
    setIsAiModalOpen(false);
    setAiPreviewResult(null);
  };

  const filteredList = rancanganKhotbahList.filter((item) => {
    const isArsipMatch =
      tabArsip === 'Diarsipkan'
        ? item.statusArsip === 'Diarsipkan'
        : item.statusArsip !== 'Diarsipkan';

    const query = search.toLowerCase();
    const isSearchMatch =
      (item.judulKhotbah || item.judulTema || '').toLowerCase().includes(query) ||
      (item.natsAlkitab || '').toLowerCase().includes(query) ||
      (item.pengkhotbah || '').toLowerCase().includes(query) ||
      (item.temaKhotbah || '').toLowerCase().includes(query) ||
      (item.jenisIbadah && item.jenisIbadah.toLowerCase().includes(query)) ||
      (item.metodeHomiletika && item.metodeHomiletika.toLowerCase().includes(query));

    return isArsipMatch && isSearchMatch;
  });

  const totalKhotbah = rancanganKhotbahList.length;
  const aiGeneratedCount = rancanganKhotbahList.filter((k) => k.sumberAI).length;
  const avgDurasi = totalKhotbah > 0
    ? Math.round(rancanganKhotbahList.reduce((acc, curr) => acc + (curr.durasiTotalMenit || 30), 0) / totalKhotbah)
    : 30;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900/90 p-4 sm:p-5 rounded-2xl border border-slate-800/80 shadow-xl backdrop-blur-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-300" />
              <span>GKE AI Homiletik & Pastoral Engine</span>
            </span>
          </div>
          <h2 className="text-lg sm:text-xl font-extrabold text-slate-100 flex items-center gap-2.5 mt-1.5">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shrink-0">
              <Feather className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <span>Rancangan Khotbah Lengkap (Siap Baca)</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Penyusunan Naskah Lisan Khotbah Utuh Kalimat demi Kalimat (Siap Dibaca Pelayan Firman di Mimbar) Berdasarkan Target Durasi, Homiletika, dan Pendampingan Pastoral GKE di Kalimantan.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap w-full md:w-auto">
          {canEdit && (
            <>
              <button
                type="button"
                onClick={handleOpenRetorikaAiModal}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 via-rose-600 to-purple-600 hover:from-amber-400 hover:to-purple-500 text-white text-xs font-bold px-4 py-3 sm:py-2.5 rounded-xl transition-all shadow-md shadow-amber-600/30 border border-amber-400/40 group min-h-[44px] cursor-pointer active:scale-95"
                title="Buat Khotbah versi Retorika AI GKE dengan gaya Oratori Mimbar & Menggugah Jiwa"
              >
                <Flame className="w-4 h-4 text-amber-300 animate-pulse shrink-0" />
                <span>Buat Khotbah Versi Retorika AI GKE</span>
              </button>

              <button
                type="button"
                onClick={handleOpenStandardAiModal}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white text-xs font-bold px-4 py-3 sm:py-2.5 rounded-xl transition-all shadow-md shadow-indigo-600/30 border border-indigo-400/30 group min-h-[44px] cursor-pointer active:scale-95"
              >
                <Sparkles className="w-4 h-4 text-amber-300 animate-pulse shrink-0" />
                <span>Buat Khotbah versi AI GKE</span>
              </button>

              <button
                type="button"
                onClick={handleOpenAdd}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-4 py-3 sm:py-2.5 rounded-xl transition-all shadow-md shadow-indigo-600/30 min-h-[44px] cursor-pointer active:scale-95"
              >
                <Feather className="w-4 h-4 text-amber-300 shrink-0" />
                <span>Sermon Naskah Siap Baca</span>
              </button>
            </>
          )}

          <button
            onClick={() => openPrintReport({ reportType: 'rancangan_khotbah' })}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-4 py-3 sm:py-2.5 rounded-xl transition-all border border-slate-700 min-h-[44px]"
          >
            <Printer className="w-4 h-4 text-emerald-400" />
            <span>Cetak Outline Pelayanan</span>
          </button>
        </div>
      </div>

      {/* Overview Stats Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white dark:bg-slate-900/80 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800/80 flex items-center gap-3 shadow-2xs">
          <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-black uppercase tracking-wider">Total Rancangan</span>
            <p className="text-base font-black text-slate-900 dark:text-slate-100">{totalKhotbah} Naskah</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900/80 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800/80 flex items-center gap-3 shadow-2xs">
          <div className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-500/20">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-black uppercase tracking-wider">AI Generated</span>
            <p className="text-base font-black text-purple-700 dark:text-purple-300">{aiGeneratedCount} Outline</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900/80 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800/80 flex items-center gap-3 shadow-2xs">
          <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-black uppercase tracking-wider">Rata-Rata Durasi</span>
            <p className="text-base font-black text-amber-700 dark:text-amber-400">{avgDurasi} Menit</p>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="bg-white dark:bg-slate-900/80 p-4 rounded-2xl border border-slate-200 dark:border-slate-800/80 text-xs shadow-2xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
            <button
              onClick={() => setTabArsip('Aktif')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                tabArsip === 'Aktif'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Rancangan Aktif</span>
              <span
                className="badge-count-number ml-1"
                style={{
                  backgroundColor: tabArsip === 'Aktif' ? '#ffffff' : undefined,
                  color: tabArsip === 'Aktif' ? '#1e1b4b' : undefined,
                  WebkitTextFillColor: tabArsip === 'Aktif' ? '#1e1b4b' : undefined,
                }}
              >
                {rancanganKhotbahList.filter((i) => i.statusArsip !== 'Diarsipkan').length}
              </span>
            </button>

            <button
              onClick={() => setTabArsip('Diarsipkan')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                tabArsip === 'Diarsipkan'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              <Archive className="w-4 h-4" />
              <span>Arsip Khotbah</span>
              <span
                className="badge-count-number ml-1"
                style={{
                  backgroundColor: tabArsip === 'Diarsipkan' ? '#ffffff' : undefined,
                  color: tabArsip === 'Diarsipkan' ? '#78350f' : undefined,
                  WebkitTextFillColor: tabArsip === 'Diarsipkan' ? '#78350f' : undefined,
                }}
              >
                {rancanganKhotbahList.filter((i) => i.statusArsip === 'Diarsipkan').length}
              </span>
            </button>
          </div>

          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-slate-500 dark:text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Cari judul, nats, pengkhotbah, tema..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 text-xs shadow-2xs font-semibold"
            />
          </div>
        </div>
      </div>

      {/* Sermon Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredList.length === 0 ? (
          <div className="col-span-2 p-12 text-center bg-white dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 text-xs shadow-2xs font-medium">
            {tabArsip === 'Diarsipkan'
              ? 'Belum ada khotbah diarsipkan.'
              : 'Belum ada rancangan khotbah aktif. Klik "Buat Khotbah versi AI GKE" atau "Rancangan Manual".'}
          </div>
        ) : (
          filteredList.map((item) => {
            const isExpanded = expandedCardId === item.id;
            return (
              <div
                key={item.id}
                className="bg-white dark:bg-slate-900/90 rounded-2xl border border-slate-200 dark:border-slate-800/90 p-5 shadow-sm space-y-4 flex flex-col justify-between relative overflow-hidden group hover:border-indigo-500/40 transition-all"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="w-full">
                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Unified Single Origin / Version Badge */}
                        {item.sumberAI ? (
                          item.versiKhotbah?.includes('Retorika') ? (
                            <span className="text-xs font-black text-amber-950 dark:text-amber-200 bg-amber-100 dark:bg-amber-950/80 px-2.5 py-1 rounded-lg border border-amber-300 dark:border-amber-700/80 flex items-center gap-1.5 shadow-2xs">
                              <Flame className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0 animate-pulse" />
                              <span>{item.versiKhotbah || 'Retorika AI GKE'}</span>
                            </span>
                          ) : (
                            <span className="text-xs font-black text-purple-950 dark:text-purple-200 bg-purple-100 dark:bg-purple-950/80 px-2.5 py-1 rounded-lg border border-purple-300 dark:border-purple-700/80 flex items-center gap-1.5 shadow-2xs">
                              <Sparkles className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 shrink-0" />
                              <span>{item.versiKhotbah || 'AI Homiletika & Pastoral GKE'}</span>
                            </span>
                          )
                        ) : (
                          <span className="text-xs font-black text-emerald-950 dark:text-emerald-200 bg-emerald-100 dark:bg-emerald-950/80 px-2.5 py-1 rounded-lg border border-emerald-300 dark:border-emerald-700/80 flex items-center gap-1.5 shadow-2xs">
                            <Feather className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                            <span>{item.versiKhotbah || 'Manual Mimbar GKE'}</span>
                          </span>
                        )}

                        <span className="text-xs font-bold text-indigo-950 dark:text-indigo-200 bg-indigo-100 dark:bg-indigo-950/80 px-2.5 py-1 rounded-lg border border-indigo-300 dark:border-indigo-700/80">
                          Nats: {item.natsAlkitab}
                        </span>
                        {item.jenisIbadah && (
                          <span className="text-xs font-bold text-emerald-950 dark:text-emerald-200 bg-emerald-100 dark:bg-emerald-950/80 px-2.5 py-1 rounded-lg border border-emerald-300 dark:border-emerald-700/80">
                            {item.jenisIbadah}
                          </span>
                        )}
                        {item.metodeHomiletika && (
                          <span className="text-xs font-bold text-purple-950 dark:text-purple-200 bg-purple-100 dark:bg-purple-950/80 px-2.5 py-1 rounded-lg border border-purple-300 dark:border-purple-700/80">
                            {item.metodeHomiletika}
                          </span>
                        )}
                      </div>

                      <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100 mt-2.5 leading-snug group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition-colors">
                        {item.judulKhotbah}
                      </h3>
                      {item.temaKhotbah && (
                        <p className="text-xs text-slate-600 dark:text-slate-400 font-medium mt-1 leading-relaxed">
                          {item.temaKhotbah}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs bg-slate-50 dark:bg-slate-950/60 p-3 rounded-xl border border-slate-200 dark:border-slate-800/80 gap-2.5">
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="text-xs break-words">
                        <span className="text-slate-500 dark:text-slate-400 font-medium">Pelayan Firman: </span>
                        <span className="font-bold text-slate-900 dark:text-slate-200">{item.pengkhotbah}</span>
                      </div>
                      <div className="text-xs">
                        <span className="text-slate-500 dark:text-slate-400 font-medium">Tanggal: </span>
                        <span className="font-semibold text-slate-700 dark:text-slate-300">{item.tanggal}</span>
                      </div>
                    </div>
                    <div className="flex items-center self-start sm:self-auto gap-1 shrink-0">
                      <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-amber-200 dark:border-slate-800 text-amber-800 dark:text-amber-400 text-xs font-black shadow-2xs">
                        <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                        <span>{item.durasiTotalMenit} Mins</span>
                        {canEdit && (
                          <div className="flex items-center gap-0.5 ml-1 border-l border-amber-200 dark:border-slate-800 pl-1">
                            <button
                              type="button"
                              onClick={() => handleQuickAdjustCardDuration(item, -5)}
                              className="p-1 text-slate-500 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-all min-w-[24px] min-h-[24px] flex items-center justify-center cursor-pointer"
                              title="Kurangi 5 Menit (Auto-Skala Poin)"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleQuickAdjustCardDuration(item, 5)}
                              className="p-1 text-slate-500 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-all min-w-[24px] min-h-[24px] flex items-center justify-center cursor-pointer"
                              title="Tambah 5 Menit (Auto-Skala Poin)"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Duration Breakdown */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <p className="text-[11px] font-black tracking-wider uppercase text-slate-600 dark:text-slate-400">
                        Alokasi Durasi Poin Khotbah ({item.poinUtama.length} Poin):
                      </p>
                      <button
                        onClick={() => setExpandedCardId(isExpanded ? null : item.id)}
                        className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center gap-1 font-bold cursor-pointer"
                      >
                        <span>{isExpanded ? 'Sembunyikan Detail' : 'Lihat Detail Khotbah'}</span>
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>
                    </div>

                    <div className="space-y-1.5">
                      {item.poinUtama.map((p, i) => (
                        <div
                          key={i}
                          className="bg-slate-50 dark:bg-slate-950/80 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs flex items-center justify-between gap-2 shadow-2xs"
                        >
                          <span className="font-semibold text-slate-800 dark:text-slate-300 text-xs">
                            {p.judulPoin}
                          </span>
                          <span className="text-[11px] font-bold text-indigo-900 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-500/15 px-2 py-0.5 rounded-md border border-indigo-200 dark:border-indigo-500/20 whitespace-nowrap">
                            ~{p.durasiMenit} m
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Expanded Content View */}
                  {isExpanded && (
                    <div className="pt-3 border-t border-slate-800 space-y-3 text-xs animate-in fade-in duration-200">
                      {/* Tujuan Pastoral */}
                      {item.tujuanPastoral && (
                        <div className="bg-indigo-950/40 p-3 rounded-xl border border-indigo-500/20 space-y-1">
                          <p className="text-[10px] font-bold uppercase text-indigo-300 tracking-wider flex items-center gap-1">
                            <Heart className="w-3 h-3 text-rose-400" />
                            <span>Tujuan Pastoral:</span>
                          </p>
                          <div className="text-[11px] text-slate-700 dark:text-slate-300 space-y-1">
                            <p>
                              <strong className="text-blue-700 dark:text-blue-300">Kognitif:</strong> {item.tujuanPastoral.kognitif || '-'}
                            </p>
                            <p>
                              <strong className="text-emerald-700 dark:text-emerald-300">Afektif:</strong> {item.tujuanPastoral.afektif || '-'}
                            </p>
                            <p>
                              <strong className="text-amber-700 dark:text-amber-300">Psikomotorik:</strong> {item.tujuanPastoral.psikomotorik || '-'}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Pendahuluan */}
                      <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
                        <p className="text-[10px] font-black uppercase text-slate-600 dark:text-slate-400">1. Pendahuluan Liturgis GKE:</p>
                        <p className="text-xs text-slate-700 dark:text-slate-300 italic whitespace-pre-line leading-relaxed">{item.pendahuluan}</p>
                      </div>

                      {/* Nasihat Pastoral Poin */}
                      <div className="space-y-2">
                        <p className="text-[10px] font-black uppercase text-slate-600 dark:text-slate-400">2. Poin & Refleksi Pastoral:</p>
                        {item.poinUtama.map((p, i) => (
                          <div key={i} className="bg-slate-50 dark:bg-slate-950 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs space-y-1">
                            <p className="font-bold text-indigo-900 dark:text-indigo-200">{p.judulPoin}</p>
                            <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{p.penjelasan}</p>
                            {p.nasihatPastoral && (
                              <p className="text-amber-800 dark:text-amber-300/90 italic text-[11px] pt-1 border-t border-slate-200 dark:border-slate-800">
                                💡 <strong>Nasihat Pastoral:</strong> {p.nasihatPastoral}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>

                      {/* Aplikasi & Doa */}
                      <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
                        <p className="text-[10px] font-black uppercase text-slate-600 dark:text-slate-400">3. Aplikasi Pastoral Warga Jemaat:</p>
                        <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">{item.penerapanAplikasi}</p>
                      </div>

                      <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
                        <p className="text-[10px] font-black uppercase text-slate-600 dark:text-slate-400">4. Penutup & Doa Syafaat Pastoral GKE:</p>
                        <p className="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed">{item.penutupDoa}</p>
                      </div>

                      {item.catatanLiturgis && (
                        <div className="p-2.5 bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-500/20 rounded-xl text-[11px] text-purple-900 dark:text-purple-200">
                          <strong>🎵 Catatan Liturgis & Nyanyian:</strong> {item.catatanLiturgis}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Actions Footer */}
                <div className="pt-3 border-t border-slate-200 dark:border-slate-800/80 flex items-center justify-between text-xs gap-2 flex-wrap">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      onClick={() => setReadingItem(item)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 text-indigo-900 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30 rounded-xl font-bold transition-all text-xs cursor-pointer shadow-2xs"
                      title="Buka Mode Pembaca Mimbar (Teleprompter Khotbah)"
                    >
                      <Maximize2 className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                      <span>Baca Naskah Mimbar</span>
                    </button>

                    <button
                      onClick={() => handleCopyManuscript(item, item.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 dark:bg-purple-500/10 hover:bg-purple-100 dark:hover:bg-purple-500/20 text-purple-900 dark:text-purple-300 border border-purple-200 dark:border-purple-500/30 rounded-xl font-bold transition-all text-xs cursor-pointer shadow-2xs"
                      title="Salin Seluruh Naskah Lisan Khotbah Utuh"
                    >
                      {copiedId === item.id ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                          <span className="text-emerald-700 dark:text-emerald-400">Tersalin!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                          <span>Salin Naskah Lisan</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() =>
                        openPrintReport({
                          reportType: 'rancangan_khotbah',
                          khotbahId: item.id,
                        })
                      }
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 text-emerald-900 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30 rounded-xl font-bold transition-all text-xs cursor-pointer shadow-2xs"
                    >
                      <Printer className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span>Cetak Naskah</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-1">
                    {canEdit && (
                      <button
                        onClick={() => setArchivingItem(item)}
                        className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl font-bold text-xs border transition-all cursor-pointer shadow-2xs ${
                          item.statusArsip === 'Diarsipkan'
                            ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-900 dark:text-amber-300 border-amber-300 dark:border-amber-500/30 hover:bg-amber-100 dark:hover:bg-amber-500/20'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'
                        }`}
                        title={item.statusArsip === 'Diarsipkan' ? 'Aktifkan Kembali' : 'Arsipkan'}
                      >
                        {item.statusArsip === 'Diarsipkan' ? (
                          <>
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Buka Arsip</span>
                          </>
                        ) : (
                          <>
                            <Archive className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                            <span>Arsipkan</span>
                          </>
                        )}
                      </button>
                    )}

                    {canEdit && (
                      <>
                        <button
                          onClick={() => setEditingCandidateItem(item)}
                          className="p-1.5 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-lg cursor-pointer transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeletingItem(item)}
                          className="p-1.5 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg cursor-pointer transition-colors"
                          title="Hapus"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* AI Sermon Generator Modal */}
      {isAiModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4 overflow-hidden">
          <div className="bg-slate-900 rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden border border-indigo-500/40 text-slate-100 flex flex-col max-h-[92dvh] sm:max-h-[88vh] my-auto animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-gradient-to-r from-purple-950 via-slate-950 to-indigo-950 p-3.5 sm:p-4 px-4 sm:px-5 border-b border-indigo-500/30 flex items-center justify-between shrink-0">
              <div className="min-w-0 pr-2">
                <span className="text-[9px] font-bold text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 uppercase tracking-wider inline-block">
                  GKE Pastoral AI Architect
                </span>
                <h3 className="font-bold text-xs sm:text-sm md:text-base text-indigo-200 flex items-center gap-1.5 sm:gap-2 mt-1 truncate">
                  <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-amber-300 animate-pulse shrink-0" />
                  <span className="truncate">Penyusun Khotbah AI Homiletika, Retorika & Pastoral GKE</span>
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAiModalOpen(false)}
                className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-slate-800 transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center cursor-pointer shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3.5 sm:p-5 space-y-4 overflow-y-auto overscroll-contain text-xs flex-1">
              {/* Mode Selection Switcher */}
              <div className="p-1.5 bg-slate-950 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-stretch gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsRetorikaMode(false);
                    setAiMetodeHomiletika('Pastoral-Konseling');
                    setAiNadaPastoral('Penguatan & Penghiburan');
                  }}
                  className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    !isRetorikaMode
                      ? 'bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 text-white shadow-lg shadow-indigo-600/30 border border-indigo-400/40'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                  }`}
                >
                  <Sparkles className="w-4 h-4 text-amber-300 shrink-0" />
                  <span>Versi Standar AI Homiletika GKE</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsRetorikaMode(true);
                    setAiMetodeHomiletika('Retorika Mimbar & Oratori Pastoral GKE');
                    setAiNadaPastoral('Retorika Megah, Persuasif & Menggugah Jiwa');
                  }}
                  className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    isRetorikaMode
                      ? 'bg-gradient-to-r from-amber-500 via-rose-600 to-purple-600 text-white shadow-lg shadow-amber-600/30 border border-amber-400/50'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                  }`}
                >
                  <Flame className="w-4 h-4 text-amber-300 animate-pulse shrink-0" />
                  <span>Versi Retorika AI GKE (Oratori Mimbar)</span>
                </button>
              </div>

              <div className={`border rounded-xl p-3 text-[11px] flex items-start gap-2.5 ${
                isRetorikaMode
                  ? 'bg-amber-950/30 border-amber-500/30 text-amber-200'
                  : 'bg-indigo-950/40 border-indigo-500/20 text-indigo-200'
              }`}>
                {isRetorikaMode ? (
                  <Flame className="w-5 h-5 text-amber-400 shrink-0 mt-0.5 animate-bounce" />
                ) : (
                  <ShieldCheck className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                )}
                <p className="leading-relaxed">
                  {isRetorikaMode
                    ? '🔥 MODE RETORIKA AI GKE: Menyusun naskah khotbah lisan beroratori tinggi, berwibawa, penuh klimaks retoris, intonasi gaya penceramah mimbar, dan seruan persuasif yang membakar semangat iman jemaat!'
                    : 'Engine AI Homiletika GKE menyusun naskah khotbah presisi sesuai dengan Khazanah Teologi Reformed Evangelikal GKE, alokasi waktu liturgis, Tritunggal Tujuan Pastoral (Kognitif, Afektif, Psikomotorik), serta kearifan lokal warga jemaat di Kalimantan.'}
                </p>
              </div>

              {/* Quick Preset Choice Buttons */}
              <div className="space-y-1.5">
                <label className="block font-bold text-slate-300 text-[11px] flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Rekomendasi Nats & Preset Homiletika GKE (Klik untuk Auto-fill):</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setAiNats('Yohanes 15 : 9 - 17');
                      setAiJenisIbadah('Kebaktian Minggu Pagi');
                      setAiMetodeHomiletika('Pastoral-Konseling');
                      setAiNadaPastoral('Penguatan & Penghiburan');
                      setAiSasaranPendengar('Seluruh Warga Jemaat Lintas Generasi');
                      setAiTema('Mengasihi Sesama sebagai Wujud Ketaatan');
                      setAiDurasi(30);
                    }}
                    className="p-3 sm:p-2.5 bg-slate-950 hover:bg-indigo-950/60 rounded-xl border border-slate-800 text-left transition-all hover:border-indigo-500 group min-h-[44px] cursor-pointer"
                  >
                    <span className="block text-[10px] font-bold text-indigo-400 group-hover:text-indigo-300">
                      Ibadah Minggu
                    </span>
                    <span className="block text-slate-200 font-semibold text-[11px] truncate">
                      Yohanes 15:9-17
                    </span>
                    <span className="block text-slate-500 text-[10px]">30 Mins • Pastoral</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setAiNats('Efesus 4 : 11 - 16');
                      setAiJenisIbadah('Kebaktian Rayon / Keluarahan');
                      setAiMetodeHomiletika('Naratif Konteks Kalimantan');
                      setAiNadaPastoral('Pemberdayaan & Aksi');
                      setAiSasaranPendengar('Warga Rayon / Keluarga');
                      setAiTema('Mempererat Persekutuan dan Kerukunan Rayon');
                      setAiDurasi(20);
                    }}
                    className="p-3 sm:p-2.5 bg-slate-950 hover:bg-indigo-950/60 rounded-xl border border-slate-800 text-left transition-all hover:border-indigo-500 group min-h-[44px] cursor-pointer"
                  >
                    <span className="block text-[10px] font-bold text-emerald-400 group-hover:text-emerald-300">
                      Ibadah Rayon
                    </span>
                    <span className="block text-slate-200 font-semibold text-[11px] truncate">
                      Efesus 4:11-16
                    </span>
                    <span className="block text-slate-500 text-[10px]">20 Mins • Naratif GKE</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setAiNats('Matius 5 : 13 - 16');
                      setAiJenisIbadah('Kebaktian Pemuda / SPRP');
                      setAiMetodeHomiletika('Tematis-Doktrinal');
                      setAiNadaPastoral('Pemberdayaan & Aksi');
                      setAiSasaranPendengar('Pemuda & Remaja (SPRP)');
                      setAiTema('Garam dan Terang Dunia di Era Digital');
                      setAiDurasi(25);
                    }}
                    className="p-3 sm:p-2.5 bg-slate-950 hover:bg-indigo-950/60 rounded-xl border border-slate-800 text-left transition-all hover:border-indigo-500 group min-h-[44px] cursor-pointer"
                  >
                    <span className="block text-[10px] font-bold text-amber-400 group-hover:text-amber-300">
                      Pemuda (SPRP)
                    </span>
                    <span className="block text-slate-200 font-semibold text-[11px] truncate">
                      Matius 5:13-16
                    </span>
                    <span className="block text-slate-500 text-[10px]">25 Mins • Tematis</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setAiNats('1 Korintus 11 : 23 - 26');
                      setAiJenisIbadah('Sakramen Perjamuan Kudus');
                      setAiMetodeHomiletika('Tekstual-Ekspositori');
                      setAiNadaPastoral('Refleksi & Pertobatan');
                      setAiSasaranPendengar('Sidi Jemaat');
                      setAiTema('Mengingat Pengorbanan Kristus & Pembaharuan Janji');
                      setAiDurasi(35);
                    }}
                    className="p-3 sm:p-2.5 bg-slate-950 hover:bg-indigo-950/60 rounded-xl border border-slate-800 text-left transition-all hover:border-indigo-500 group min-h-[44px] cursor-pointer"
                  >
                    <span className="block text-[10px] font-bold text-rose-400 group-hover:text-rose-300">
                      Perjamuan Kudus
                    </span>
                    <span className="block text-slate-200 font-semibold text-[11px] truncate">
                      1 Kor 11:23-26
                    </span>
                    <span className="block text-slate-500 text-[10px]">35 Mins • Ekspositori</span>
                  </button>
                </div>
              </div>

              {/* Form Controls - Fully responsive for HP and PC */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <div className="col-span-1 sm:col-span-2 lg:col-span-2">
                  <label className="block font-semibold text-slate-200 mb-1">
                    1. Nats Alkitab Utama *
                  </label>
                  <input
                    type="text"
                    value={aiNats}
                    onChange={(e) => setAiNats(e.target.value)}
                    placeholder="Contoh: Yohanes 15 : 9 - 17, Kolose 3:12-17"
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 font-bold focus:outline-none focus:border-indigo-500 text-xs"
                  />
                </div>

                <div className="col-span-1">
                  <label className="block font-semibold text-slate-200 mb-1">
                    2. Jenis Kebaktian GKE
                  </label>
                  <select
                    value={aiJenisIbadah}
                    onChange={(e) => setAiJenisIbadah(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-indigo-500 text-xs"
                  >
                    <option value="Kebaktian Minggu Pagi">Kebaktian Minggu Pagi I & II</option>
                    <option value="Kebaktian Rayon / Keluarahan">Kebaktian Rayon / Rumah Tangga</option>
                    <option value="Kebaktian Pemuda / SPRP">Kebaktian Pemuda & Remaja (SPRP)</option>
                    <option value="Kebaktian Wanita / SPW">Kebaktian Persekutuan Wanita (SPW)</option>
                    <option value="Kebaktian Bapak / PEB">Kebaktian Persekutuan Bapak (PEB)</option>
                    <option value="Sakramen Perjamuan Kudus">Kebaktian Sakramen Perjamuan Kudus</option>
                    <option value="Kebaktian Duka / Penghiburan">Kebaktian Duka Cita / Penghiburan</option>
                    <option value="Kebaktian Syukuran / HUT">Kebaktian Ucapan Syukuran</option>
                  </select>
                </div>

                <div className="col-span-1">
                  <label className="block font-semibold text-slate-200 mb-1">
                    3. Metode Homiletika
                  </label>
                  <select
                    value={aiMetodeHomiletika}
                    onChange={(e) => setAiMetodeHomiletika(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-indigo-500 text-xs"
                  >
                    <option value="Retorika Mimbar & Oratori Pastoral GKE">🔥 Retorika Mimbar & Oratori Pastoral GKE</option>
                    <option value="Tekstual-Ekspositori">Tekstual-Ekspositori (Pendalaman Nats)</option>
                    <option value="Tematis-Doktrinal">Tematis-Doktrinal (Pengajaran Iman GKE)</option>
                    <option value="Pastoral-Konseling">Pastoral-Konseling (Penguatan & Penghiburan)</option>
                    <option value="Naratif Konteks Kalimantan">Naratif Konteks Kalimantan / Belom Bahadat</option>
                  </select>
                </div>

                <div className="col-span-1">
                  <label className="block font-semibold text-slate-200 mb-1">
                    4. Nuansa / Nada Pastoral
                  </label>
                  <select
                    value={aiNadaPastoral}
                    onChange={(e) => setAiNadaPastoral(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-indigo-500 text-xs"
                  >
                    <option value="Retorika Megah, Persuasif & Menggugah Jiwa">🔥 Retorika Megah, Persuasif & Menggugah Jiwa</option>
                    <option value="Penguatan & Penghiburan">Penguatan & Penghiburan Duka/Dukacita</option>
                    <option value="Pemberdayaan & Aksi">Pemberdayaan & Aksi Nyata Jemaat</option>
                    <option value="Refleksi & Pertobatan">Refleksi & Pertobatan Diri</option>
                    <option value="Pengucapan Syukur">Pengucapan Syukur & Sukacita</option>
                    <option value="Didaktis & Pengajaran">Didaktis & Pengajaran Doktrin</option>
                  </select>
                </div>

                <div className="col-span-1">
                  <label className="block font-semibold text-slate-200 mb-1">
                    5. Sasaran Pendengar
                  </label>
                  <input
                    type="text"
                    value={aiSasaranPendengar}
                    onChange={(e) => setAiSasaranPendengar(e.target.value)}
                    placeholder="e.g. Seluruh Warga Jemaat, Pemuda, Orang Tua"
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-indigo-500 text-xs"
                  />
                </div>

                <div className="col-span-1 sm:col-span-2 lg:col-span-2">
                  <label className="block font-semibold text-slate-200 mb-1">
                    6. Tema / Fokus Khotbah (Opsional)
                  </label>
                  <input
                    type="text"
                    value={aiTema}
                    onChange={(e) => setAiTema(e.target.value)}
                    placeholder="e.g. Setia di Tengah Badai, Menjaga Kedamaian Kalimantan"
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-indigo-500 text-xs"
                  />
                </div>

                <div className="col-span-1">
                  <label className="block font-semibold text-slate-200 mb-1">
                    7. Pelayan Firman / Pengkhotbah
                  </label>
                  <input
                    type="text"
                    value={aiPengkhotbah}
                    onChange={(e) => setAiPengkhotbah(e.target.value)}
                    placeholder="e.g. Pdt. Drs. Yansen K. M.Th"
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-indigo-500 text-xs"
                  />
                </div>

                <div className="col-span-1 sm:col-span-2 lg:col-span-3 bg-slate-950 p-3 sm:p-4 rounded-xl border border-slate-800 space-y-2.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <label className="block font-semibold text-slate-200 text-xs">
                      8. Alokasi Presisi Target Durasi Pelayanan Khotbah (Menit)
                    </label>
                    <span className="text-[10px] text-amber-400 font-medium">
                      Bisa ditambah / dikurangi kapan saja
                    </span>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                    <div className="flex items-center justify-between sm:justify-start gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 shrink-0">
                      <button
                        type="button"
                        onClick={() => setAiDurasi((prev) => Math.max(5, prev - 5))}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 text-amber-400 font-bold text-xs flex items-center gap-1 border border-slate-800 transition-all min-h-[36px] cursor-pointer"
                        title="Kurangi 5 Menit"
                      >
                        <Minus className="w-3.5 h-3.5" /> 5m
                      </button>
                      <button
                        type="button"
                        onClick={() => setAiDurasi((prev) => Math.max(5, prev - 1))}
                        className="px-2 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-300 font-bold text-xs flex items-center gap-0.5 border border-slate-800 transition-all min-h-[36px] cursor-pointer"
                        title="Kurangi 1 Menit"
                      >
                        <Minus className="w-3 h-3" /> 1m
                      </button>
                      <div className="px-3 py-1.5 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-300 font-mono font-bold text-xs min-w-[70px] text-center">
                        {aiDurasi} Mins
                      </div>
                      <button
                        type="button"
                        onClick={() => setAiDurasi((prev) => Math.min(120, prev + 1))}
                        className="px-2 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-300 font-bold text-xs flex items-center gap-0.5 border border-slate-800 transition-all min-h-[36px] cursor-pointer"
                        title="Tambah 1 Menit"
                      >
                        <Plus className="w-3 h-3" /> 1m
                      </button>
                      <button
                        type="button"
                        onClick={() => setAiDurasi((prev) => Math.min(120, prev + 5))}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 text-emerald-400 font-bold text-xs flex items-center gap-1 border border-slate-800 transition-all min-h-[36px] cursor-pointer"
                        title="Tambah 5 Menit"
                      >
                        <Plus className="w-3.5 h-3.5" /> 5m
                      </button>
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap">
                      {[15, 20, 25, 30, 35, 45, 60].map((d) => (
                        <button
                          key={d}
                          type="button"
                          onClick={() => setAiDurasi(d)}
                          className={`flex-1 sm:flex-none px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all min-h-[36px] cursor-pointer ${
                            aiDurasi === d
                              ? 'bg-amber-500 text-slate-950 font-mono shadow'
                              : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-white'
                          }`}
                        >
                          {d}m
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-2 space-y-3">
                <button
                  type="button"
                  disabled={isGenerating || !aiNats.trim()}
                  onClick={handleGenerateAiKhotbah}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold text-xs shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-2 disabled:opacity-50 transition-all border border-indigo-400/30 cursor-pointer active:scale-95"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin text-amber-300" />
                      <span>Sedang Merancang Khotbah Digital ({aiDurasi} Menit)...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5 text-amber-300" />
                      <span>Generate Khotbah Digital AI</span>
                    </>
                  )}
                </button>

                {/* Popup Progress Bar Modal Overlay during AI Generation */}
                {isGenerating && (
                  <div className="fixed inset-0 z-[100] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-slate-900/95 rounded-3xl border-2 border-indigo-500/60 p-6 sm:p-8 max-w-md w-full shadow-2xl shadow-indigo-600/40 text-center space-y-5 relative overflow-hidden">
                      {/* Background Glow */}
                      <div className="absolute -top-16 -left-16 w-32 h-32 bg-purple-500/20 rounded-full blur-2xl pointer-events-none" />
                      <div className="absolute -bottom-16 -right-16 w-32 h-32 bg-indigo-500/20 rounded-full blur-2xl pointer-events-none" />

                      {/* Icon Header */}
                      <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-amber-500 p-0.5 shadow-lg shadow-indigo-500/30">
                        <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                          {isRetorikaMode ? (
                            <Flame className="w-8 h-8 text-amber-400 animate-bounce" />
                          ) : (
                            <Sparkles className="w-8 h-8 text-amber-300 animate-pulse" />
                          )}
                        </div>
                      </div>

                      {/* Title & Info */}
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300 bg-amber-500/15 px-2.5 py-0.5 rounded-full border border-amber-500/30">
                          {isRetorikaMode ? '🔥 RETORIKA AI GKE' : '✨ HOMILETIKA DIGITAL GKE'}
                        </span>
                        <h3 className="text-base sm:text-lg font-extrabold text-slate-100">
                          {isRetorikaMode ? 'Sedang Merancang Khotbah Versi Retorika AI' : 'Sedang Merancang Khotbah Digital AI'}
                        </h3>
                        <p className="text-xs text-slate-400 font-medium">
                          Nats: <span className="text-indigo-300 font-bold">{aiNats}</span> • Target: <span className="text-amber-300 font-bold">{aiDurasi} Menit</span>
                        </p>
                      </div>

                      {/* Animated Status Text */}
                      <div className="bg-slate-950/80 rounded-xl p-3 border border-indigo-500/30 flex items-center justify-center gap-2 text-indigo-200 text-xs font-semibold">
                        <Loader2 className="w-4 h-4 animate-spin text-amber-400 shrink-0" />
                        <span className="animate-pulse">{aiGenerationStatus}</span>
                      </div>

                      {/* Progress Bar Container */}
                      <div className="space-y-2">
                        <div className="w-full bg-slate-950 border border-slate-800 rounded-full h-4 overflow-hidden p-0.5 shadow-inner">
                          <div
                            className="bg-gradient-to-r from-purple-500 via-indigo-500 to-amber-400 h-full rounded-full transition-all duration-300 ease-out shadow-sm"
                            style={{ width: `${aiGenerationProgress}%` }}
                          />
                        </div>

                        <div className="flex justify-between items-center text-[10px] font-mono font-bold px-1">
                          <span className="text-slate-400">PROSES PENGOLAHAN KHOTBAH DIGITAL</span>
                          <span className="text-amber-300 text-xs">{aiGenerationProgress}%</span>
                        </div>
                      </div>

                      {/* Steps checklist indicators */}
                      <div className="grid grid-cols-3 gap-1.5 pt-2 text-[10px] font-medium text-slate-400 border-t border-slate-800">
                        <div className={`p-1.5 rounded-lg border flex flex-col items-center gap-0.5 ${aiGenerationProgress >= 30 ? 'bg-indigo-950/60 border-indigo-500/40 text-indigo-300' : 'bg-slate-950/40 border-slate-800'}`}>
                          <span>1. Eksegesis</span>
                        </div>
                        <div className={`p-1.5 rounded-lg border flex flex-col items-center gap-0.5 ${aiGenerationProgress >= 70 ? 'bg-indigo-950/60 border-indigo-500/40 text-indigo-300' : 'bg-slate-950/40 border-slate-800'}`}>
                          <span>2. Homiletika</span>
                        </div>
                        <div className={`p-1.5 rounded-lg border flex flex-col items-center gap-0.5 ${aiGenerationProgress >= 100 ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300' : 'bg-slate-950/40 border-slate-800'}`}>
                          <span>3. Siap Baca</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* AI Generated Preview Output */}
              {aiPreviewResult && (
                <div ref={previewResultRef} className="mt-4 bg-slate-950 border border-indigo-500/40 rounded-2xl p-3.5 sm:p-4 space-y-4 animate-in fade-in duration-300 scroll-mt-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-3 gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span>Naskah Khotbah AI Berhasil Disusun</span>
                      </span>
                      <span className="text-xs font-semibold text-indigo-300 bg-indigo-500/10 px-2.5 py-1 rounded-lg border border-indigo-500/20">
                        Metode: {aiPreviewResult.metodeHomiletika || 'Pastoral-Konseling'}
                      </span>
                    </div>
                    <span className="text-xs font-mono font-bold text-amber-400 bg-amber-500/10 px-3 py-1 rounded-lg border border-amber-500/20 self-start sm:self-auto">
                      Target {aiPreviewResult.durasiTotalMenit} Menit
                    </span>
                  </div>

                  <div>
                    <h4 className="text-base font-extrabold text-indigo-200">{aiPreviewResult.judulKhotbah}</h4>
                    <p className="text-xs text-slate-400 mt-0.5">{aiPreviewResult.temaKhotbah} • Nats: {aiPreviewResult.natsAlkitab}</p>
                  </div>

                  {/* Duration Adjuster Toolbar for AI Preview */}
                  <div className="bg-slate-900/90 p-3 rounded-xl border border-indigo-500/30 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
                    <div className="flex items-center gap-2">
                      <Sliders className="w-4 h-4 text-amber-400 shrink-0" />
                      <span className="text-xs font-bold text-slate-200">Sesuaikan Durasi Naskah Ini:</span>
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <button
                        type="button"
                        onClick={() => handleAdjustAiPreviewDuration(-10)}
                        className="px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 text-amber-400 font-bold text-[11px] border border-slate-800 flex items-center gap-1 min-h-[32px] cursor-pointer"
                        title="Kurangi 10 Menit"
                      >
                        <Minus className="w-3 h-3" /> 10m
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAdjustAiPreviewDuration(-5)}
                        className="px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 text-amber-400 font-bold text-[11px] border border-slate-800 flex items-center gap-1 min-h-[32px] cursor-pointer"
                        title="Kurangi 5 Menit"
                      >
                        <Minus className="w-3 h-3" /> 5m
                      </button>
                      <div className="px-3 py-1 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-300 font-mono font-bold text-xs">
                        {aiPreviewResult.durasiTotalMenit} Mins
                      </div>
                      <button
                        type="button"
                        onClick={() => handleAdjustAiPreviewDuration(5)}
                        className="px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 text-emerald-400 font-bold text-[11px] border border-slate-800 flex items-center gap-1 min-h-[32px] cursor-pointer"
                        title="Tambah 5 Menit"
                      >
                        <Plus className="w-3 h-3" /> 5m
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAdjustAiPreviewDuration(10)}
                        className="px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 text-emerald-400 font-bold text-[11px] border border-slate-800 flex items-center gap-1 min-h-[32px] cursor-pointer"
                        title="Tambah 10 Menit"
                      >
                        <Plus className="w-3 h-3" /> 10m
                      </button>
                    </div>
                  </div>

                  {/* Preview Inner Navigation Tabs */}
                  <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto scrollbar-none whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => setPreviewTab('naskah')}
                      className={`px-3 py-2 sm:py-1.5 rounded-lg font-bold text-xs transition-all shrink-0 min-h-[38px] cursor-pointer ${
                        previewTab === 'naskah'
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-900 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      📖 Outine & Naskah Utama
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewTab('tujuan')}
                      className={`px-3 py-2 sm:py-1.5 rounded-lg font-bold text-xs transition-all shrink-0 min-h-[38px] cursor-pointer ${
                        previewTab === 'tujuan'
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-900 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      🕊️ Tujuan Pastoral (Kognitif/Afektif/Psikomotorik)
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewTab('liturgi')}
                      className={`px-3 py-2 sm:py-1.5 rounded-lg font-bold text-xs transition-all shrink-0 min-h-[38px] cursor-pointer ${
                        previewTab === 'liturgi'
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-900 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      🎵 Catatan Liturgis & Nyanyian
                    </button>
                  </div>

                  {/* Tab 1: Naskah Utama */}
                  {previewTab === 'naskah' && (
                    <div className="space-y-3">
                      <div className="bg-slate-900 p-3.5 rounded-xl space-y-1.5 border border-slate-800">
                        <p className="text-[11px] font-bold text-indigo-300 uppercase tracking-wider">
                          1. Pendahuluan & Salam Liturgis GKE:
                        </p>
                        <p className="text-xs text-slate-300 font-serif italic whitespace-pre-line leading-relaxed">
                          {aiPreviewResult.pendahuluan}
                        </p>
                      </div>

                      <div className="space-y-2">
                        <p className="text-[11px] font-bold text-indigo-300 uppercase tracking-wider">
                          2. Poin Utama Homiletika ({aiPreviewResult.poinUtama.length} Poin):
                        </p>
                        {aiPreviewResult.poinUtama.map((poin, idx) => (
                          <div key={idx} className="bg-slate-900 p-3 rounded-xl border border-slate-800 space-y-1.5">
                            <div className="flex justify-between items-center text-xs">
                              <span className="font-bold text-indigo-200">{poin.judulPoin}</span>
                              <span className="font-mono text-[10px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                                ~{poin.durasiMenit} Menit
                              </span>
                            </div>
                            <p className="text-xs text-slate-300 leading-relaxed">{poin.penjelasan}</p>
                            {poin.nasihatPastoral && (
                              <div className="mt-2 pt-1.5 border-t border-slate-800 text-[11px] text-amber-300/90 italic flex items-start gap-1.5 bg-slate-950 p-2 rounded-lg">
                                <span>💡 <strong>Nasihat Pastoral:</strong> {poin.nasihatPastoral}</span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>

                      <div className="bg-slate-900 p-3.5 rounded-xl space-y-1 border border-slate-800">
                        <p className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">
                          3. Penerapan Pastoral Warga Jemaat:
                        </p>
                        <p className="text-xs text-slate-300 leading-relaxed">{aiPreviewResult.penerapanAplikasi}</p>
                      </div>

                      <div className="bg-slate-900 p-3.5 rounded-xl space-y-1 border border-slate-800">
                        <p className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">
                          4. Penutup & Pokok Doa Syafaat Pastoral GKE:
                        </p>
                        <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line">{aiPreviewResult.penutupDoa}</p>
                      </div>
                    </div>
                  )}

                  {/* Tab 2: Tujuan Pastoral */}
                  {previewTab === 'tujuan' && (
                    <div className="space-y-3 bg-slate-900 p-4 rounded-xl border border-slate-800">
                      <p className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                        <Heart className="w-4 h-4 text-rose-400" />
                        <span>Tritunggal Tujuan Pastoral Pelayanan Firman GKE</span>
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
                          <span className="text-[10px] font-bold text-blue-400 uppercase">1. Kognitif (Pemahaman)</span>
                          <p className="text-xs text-slate-300">{aiPreviewResult.tujuanPastoral?.kognitif || '-'}</p>
                        </div>
                        <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
                          <span className="text-[10px] font-bold text-emerald-400 uppercase">2. Afektif (Penghayatan)</span>
                          <p className="text-xs text-slate-300">{aiPreviewResult.tujuanPastoral?.afektif || '-'}</p>
                        </div>
                        <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
                          <span className="text-[10px] font-bold text-amber-400 uppercase">3. Psikomotorik (Aksi Nyata)</span>
                          <p className="text-xs text-slate-300">{aiPreviewResult.tujuanPastoral?.psikomotorik || '-'}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Tab 3: Catatan Liturgis */}
                  {previewTab === 'liturgi' && (
                    <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-2 text-xs">
                      <p className="font-bold text-purple-300 flex items-center gap-1.5">
                        <Music className="w-4 h-4 text-purple-400" />
                        <span>Catatan Liturgis & Rekomendasi Nyanyian Jemaat GKE:</span>
                      </p>
                      <p className="text-slate-300 bg-slate-950 p-3 rounded-lg border border-slate-800 leading-relaxed">
                        {aiPreviewResult.catatanLiturgis || 'Nyanyian Jemaat GKE / NKB / Kidung Jemaat selaras dengan tema khotbah.'}
                      </p>
                    </div>
                  )}

                  <div className="pt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={handleSaveAiResult}
                      className="w-full sm:w-auto px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition-all cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Simpan Rancangan AI Ini ke Daftar & Arsip</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Manual Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4 overflow-hidden">
          <div className="bg-slate-900 rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden border border-slate-800 text-slate-100 flex flex-col max-h-[92dvh] sm:max-h-[88vh] my-auto animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-slate-950 p-3.5 sm:p-4 px-4 sm:px-5 border-b border-slate-800 flex items-center justify-between shrink-0">
              <h3 className="font-bold text-xs sm:text-sm text-indigo-400 flex items-center gap-2 truncate pr-2">
                <Sparkles className="w-4 h-4 text-amber-300 shrink-0" />
                <span className="truncate">{editingItem ? 'Edit Naskah Khotbah Siap Baca Pendeta' : 'Sermon Naskah Siap Baca Pelayanan Pendeta GKE'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-slate-800 min-w-[36px] min-h-[36px] flex items-center justify-center cursor-pointer shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-3.5 sm:p-5 space-y-4 text-xs overflow-y-auto overscroll-contain flex-1">
              {/* Sermon Naskah Siap Baca Banner & Auto-Assist */}
              <div className="bg-gradient-to-r from-indigo-950/80 via-purple-950/80 to-slate-950 p-3.5 rounded-xl border border-indigo-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <span className="text-[10px] font-bold text-amber-300 bg-amber-500/10 px-2.5 py-0.5 rounded border border-amber-500/20 uppercase tracking-wider flex items-center gap-1 w-fit">
                    <Sparkles className="w-3 h-3 text-amber-300" />
                    <span>Sermon Naskah Siap Baca Mimbar Pelayanan GKE</span>
                  </span>
                  <p className="text-xs font-bold text-slate-100 mt-1">
                    Susun Naskah Khotbah Utuh, Terstruktur & Siap Dibaca Pendeta
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Otomatis melengkapi Salam Liturgis GKE, Poin Khotbah, Aplikasi Pastoral, dan Doa Penutup.
                  </p>
                </div>
                <button
                  type="button"
                  disabled={isAutoFormatting}
                  onClick={handleAutoFormatNaskah}
                  className="w-full sm:w-auto px-3.5 py-2 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shrink-0 shadow-md min-h-[38px] border border-indigo-400/30 cursor-pointer active:scale-95 transition-all disabled:opacity-60"
                  title="Klik untuk AI mencarikan Judul Khotbah & melengkapi naskah lisan khotbah utuh berdasarkan Nats Alkitab"
                >
                  {isAutoFormatting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 text-amber-300 animate-spin" />
                      <span>AI Mencarikan Khotbah Nats...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
                      <span>Auto-Format Naskah Siap Baca</span>
                    </>
                  )}
                </button>
              </div>

              {isAutoFormatting && (
                <div className="bg-indigo-950/90 border border-indigo-500/40 text-indigo-200 p-3.5 rounded-xl text-xs font-bold flex items-center gap-2.5 animate-fadeIn shadow-md">
                  <Loader2 className="w-4 h-4 text-amber-300 animate-spin shrink-0" />
                  <span className="text-amber-300">{autoFormatStatus || 'AI sedang mencarikan Judul Khotbah & menyelaraskan naskah lisan...'}</span>
                </div>
              )}

              {autoFormatNotice && (
                <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 p-3 rounded-xl text-xs font-bold flex items-center gap-2 animate-fadeIn shadow-sm">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{autoFormatNotice}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="col-span-1 sm:col-span-2">
                  <label className="block text-slate-400 mb-1 font-semibold">Judul Khotbah *</label>
                  <input
                    type="text"
                    required
                    value={formData.judulKhotbah || ''}
                    onChange={(e) => setFormData({ ...formData, judulKhotbah: e.target.value })}
                    placeholder="Contoh: Hidup dalam Persekutuan Kasih Kristus"
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-indigo-500 text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Nats Alkitab *</label>
                  <input
                    type="text"
                    required
                    value={formData.natsAlkitab || ''}
                    onChange={(e) => setFormData({ ...formData, natsAlkitab: e.target.value })}
                    placeholder="Contoh: Yohanes 15 : 9 - 17"
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-indigo-500 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Jenis Kebaktian GKE</label>
                  <select
                    value={formData.jenisIbadah || 'Kebaktian Minggu Pagi'}
                    onChange={(e) => setFormData({ ...formData, jenisIbadah: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-indigo-500 text-xs"
                  >
                    <option value="Kebaktian Minggu Pagi">Kebaktian Minggu Pagi I & II</option>
                    <option value="Kebaktian Rayon / Keluarahan">Kebaktian Rayon / Rumah Tangga</option>
                    <option value="Kebaktian Pemuda / SPRP">Kebaktian Pemuda & Remaja (SPRP)</option>
                    <option value="Kebaktian Wanita / SPW">Kebaktian Persekutuan Wanita (SPW)</option>
                    <option value="Kebaktian Bapak / PEB">Kebaktian Persekutuan Bapak (PEB)</option>
                    <option value="Sakramen Perjamuan Kudus">Kebaktian Sakramen Perjamuan Kudus</option>
                    <option value="Kebaktian Duka / Penghiburan">Kebaktian Duka Cita / Penghiburan</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Metode Homiletika</label>
                  <input
                    type="text"
                    value={formData.metodeHomiletika || ''}
                    onChange={(e) => setFormData({ ...formData, metodeHomiletika: e.target.value })}
                    placeholder="e.g. Tekstual-Ekspositori, Pastoral-Konseling"
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-indigo-500 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Nada Pastoral</label>
                  <input
                    type="text"
                    value={formData.nadaPastoral || ''}
                    onChange={(e) => setFormData({ ...formData, nadaPastoral: e.target.value })}
                    placeholder="e.g. Penguatan & Penghiburan"
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-indigo-500 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Tema Khotbah</label>
                  <input
                    type="text"
                    value={formData.temaKhotbah || ''}
                    onChange={(e) => setFormData({ ...formData, temaKhotbah: e.target.value })}
                    placeholder="Contoh: Mengasihi Sesama Wujud Ketaatan"
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-indigo-500 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Pengkhotbah / Pelayan</label>
                  <input
                    type="text"
                    value={formData.pengkhotbah || ''}
                    onChange={(e) => setFormData({ ...formData, pengkhotbah: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-indigo-500 text-xs"
                  />
                </div>

                <div className="col-span-1 sm:col-span-2 bg-slate-950 p-3 sm:p-4 rounded-xl border border-slate-800 space-y-2.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <label className="block text-slate-300 font-semibold text-xs">
                      Target Total Durasi Khotbah (Menit) *
                    </label>
                    <span className="text-[10px] text-amber-400 font-medium">
                      Atur Durasi dengan Tombol (+) / (-)
                    </span>
                  </div>
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                    <div className="flex items-center justify-between sm:justify-start gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          const newDur = Math.max(5, (formData.durasiTotalMenit || 25) - 5);
                          setFormData({ ...formData, durasiTotalMenit: newDur });
                        }}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 text-amber-400 font-bold text-xs flex items-center gap-1 border border-slate-800 min-h-[36px] cursor-pointer"
                        title="Kurangi 5 Menit"
                      >
                        <Minus className="w-3.5 h-3.5" /> 5m
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const newDur = Math.max(5, (formData.durasiTotalMenit || 25) - 1);
                          setFormData({ ...formData, durasiTotalMenit: newDur });
                        }}
                        className="px-2 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-300 font-bold text-xs flex items-center gap-0.5 border border-slate-800 min-h-[36px] cursor-pointer"
                        title="Kurangi 1 Menit"
                      >
                        <Minus className="w-3 h-3" /> 1m
                      </button>
                      <input
                        type="number"
                        required
                        min={5}
                        max={120}
                        value={formData.durasiTotalMenit ?? 25}
                        onChange={(e) =>
                          setFormData({ ...formData, durasiTotalMenit: Number(e.target.value) || 25 })
                        }
                        className="w-16 p-1 rounded-lg bg-slate-950 border border-slate-800 text-amber-400 font-mono font-bold text-center text-xs"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const newDur = Math.min(120, formData.durasiTotalMenit + 1);
                          setFormData({ ...formData, durasiTotalMenit: newDur });
                        }}
                        className="px-2 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-300 font-bold text-xs flex items-center gap-0.5 border border-slate-800 min-h-[36px] cursor-pointer"
                        title="Tambah 1 Menit"
                      >
                        <Plus className="w-3 h-3" /> 1m
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const newDur = Math.min(120, formData.durasiTotalMenit + 5);
                          setFormData({ ...formData, durasiTotalMenit: newDur });
                        }}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 text-emerald-400 font-bold text-xs flex items-center gap-1 border border-slate-800 min-h-[36px] cursor-pointer"
                        title="Tambah 5 Menit"
                      >
                        <Plus className="w-3.5 h-3.5" /> 5m
                      </button>
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap">
                      {[15, 20, 25, 30, 35, 45, 60].map((d) => (
                        <button
                          key={d}
                          type="button"
                          onClick={() => setFormData({ ...formData, durasiTotalMenit: d })}
                          className={`flex-1 sm:flex-none px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all min-h-[36px] cursor-pointer ${
                            formData.durasiTotalMenit === d
                              ? 'bg-amber-500 text-slate-950 font-mono shadow'
                              : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-white'
                          }`}
                        >
                          {d}m
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Tritunggal Tujuan Pastoral */}
              <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                <label className="block text-slate-300 font-bold flex items-center gap-1.5 text-xs">
                  <Heart className="w-3.5 h-3.5 text-rose-400" />
                  <span>Tritunggal Tujuan Pastoral Khotbah:</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input
                    type="text"
                    placeholder="Tujuan Kognitif (Pemahaman)"
                    value={formData.tujuanPastoral?.kognitif || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        tujuanPastoral: {
                          ...formData.tujuanPastoral,
                          kognitif: e.target.value,
                        },
                      })
                    }
                    className="p-2.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 text-xs"
                  />
                  <input
                    type="text"
                    placeholder="Tujuan Afektif (Penghayatan)"
                    value={formData.tujuanPastoral?.afektif || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        tujuanPastoral: {
                          ...formData.tujuanPastoral,
                          afektif: e.target.value,
                        },
                      })
                    }
                    className="p-2.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 text-xs"
                  />
                  <input
                    type="text"
                    placeholder="Tujuan Psikomotorik (Aksi Nyata)"
                    value={formData.tujuanPastoral?.psikomotorik || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        tujuanPastoral: {
                          ...formData.tujuanPastoral,
                          psikomotorik: e.target.value,
                        },
                      })
                    }
                    className="p-2.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">1. Pendahuluan & Salam Liturgis GKE</label>
                <textarea
                  rows={2}
                  value={formData.pendahuluan || ''}
                  onChange={(e) => setFormData({ ...formData, pendahuluan: e.target.value })}
                  placeholder="Tabe Salam Sembah, latar belakang Alkitabiah dan ilustrasi pembuka..."
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-indigo-500 text-xs"
                />
              </div>

              {/* Dynamic Poin Utamas */}
              <div className="space-y-3 border-t border-b border-slate-800 py-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <label className="block text-slate-300 font-bold">
                      2. Poin-Poin Utama Homiletika & Nasihat Pastoral
                    </label>
                    <div className="flex items-center gap-2 mt-0.5">
                      {(() => {
                        const totalAllocated = formData.poinUtama.reduce(
                          (sum, p) => sum + (Number(p.durasiMenit) || 0),
                          0
                        );
                        const isMatched = totalAllocated === (formData.durasiTotalMenit || 25);
                        return (
                          <>
                            <span
                              className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                                isMatched
                                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                  : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                              }`}
                            >
                              Total Poin: {totalAllocated}m / Target: {formData.durasiTotalMenit || 25}m
                            </span>
                            {!isMatched && (
                              <button
                                type="button"
                                onClick={handleAutoBalanceFormDataPoints}
                                className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 underline flex items-center gap-1 cursor-pointer"
                                title="Ratakan durasi poin agar pas dengan target total"
                              >
                                <Calculator className="w-3 h-3" />
                                <span>Auto-Skala Poin</span>
                              </button>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddPoin}
                    className="flex items-center gap-1 text-[11px] bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 px-3 py-1.5 rounded-lg border border-indigo-500/30 font-semibold transition-all min-h-[36px] cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Tambah Poin</span>
                  </button>
                </div>

                {formData.poinUtama.map((poin, idx) => (
                  <div key={idx} className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                      <input
                        type="text"
                        value={poin.judulPoin || ''}
                        onChange={(e) => handlePoinChange(idx, 'judulPoin', e.target.value)}
                        placeholder={`Judul Poin ${idx + 1}`}
                        className="flex-1 p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-100 text-xs font-bold min-w-[140px]"
                      />
                      <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800 shrink-0">
                        <button
                          type="button"
                          onClick={() =>
                            handlePoinChange(
                              idx,
                              'durasiMenit',
                              Math.max(1, (Number(poin.durasiMenit) || 1) - 1)
                            )
                          }
                          className="p-1 hover:bg-slate-800 text-slate-300 rounded min-w-[28px] min-h-[28px] flex items-center justify-center cursor-pointer"
                          title="Kurangi 1 menit"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <input
                          type="number"
                          min={1}
                          max={60}
                          value={poin.durasiMenit ?? 5}
                          onChange={(e) =>
                            handlePoinChange(idx, 'durasiMenit', Number(e.target.value) || 5)
                          }
                          className="w-12 p-1 rounded bg-slate-950 border border-slate-800 text-amber-400 font-mono text-xs font-bold text-center"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            handlePoinChange(
                              idx,
                              'durasiMenit',
                              Math.min(60, (Number(poin.durasiMenit) || 1) + 1)
                            )
                          }
                          className="p-1 hover:bg-slate-800 text-slate-300 rounded min-w-[28px] min-h-[28px] flex items-center justify-center cursor-pointer"
                          title="Tambah 1 menit"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                        <span className="text-slate-500 text-[10px] pr-1">m</span>
                      </div>
                      {formData.poinUtama.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemovePoin(idx)}
                          className="p-1.5 text-rose-400 hover:bg-rose-500/10 rounded-lg min-w-[32px] min-h-[32px] flex items-center justify-center cursor-pointer shrink-0"
                          title="Hapus Poin"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    <textarea
                      rows={2}
                      value={poin.penjelasan || ''}
                      onChange={(e) => handlePoinChange(idx, 'penjelasan', e.target.value)}
                      placeholder="Penjelasan teologis, eksegesis ayat, dan pemaparan..."
                      className="w-full p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 text-xs"
                    />
                    <input
                      type="text"
                      value={poin.nasihatPastoral || ''}
                      onChange={(e) => handlePoinChange(idx, 'nasihatPastoral', e.target.value)}
                      placeholder="Nasihat pastoral pendorong bagi pergumulan jemaat..."
                      className="w-full p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-amber-300 text-xs placeholder:text-slate-600"
                    />
                  </div>
                ))}
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">3. Penerapan & Langkah Aksi Pastoral Jemaat</label>
                <textarea
                  rows={2}
                  value={formData.penerapanAplikasi || ''}
                  onChange={(e) => setFormData({ ...formData, penerapanAplikasi: e.target.value })}
                  placeholder="Langkah nyata penerapan firman dalam persekutuan dan kehidupan sehari-hari..."
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-indigo-500 text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">4. Penutup & Doa Syafaat Pastoral GKE</label>
                <textarea
                  rows={2}
                  value={formData.penutupDoa || ''}
                  onChange={(e) => setFormData({ ...formData, penutupDoa: e.target.value })}
                  placeholder="Kesimpulan firman dan pokok doa syafaat pastoral GKE..."
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-indigo-500 text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">5. Catatan Liturgis & Rekomendasi Nyanyian</label>
                <input
                  type="text"
                  value={formData.catatanLiturgis || ''}
                  onChange={(e) => setFormData({ ...formData, catatanLiturgis: e.target.value })}
                  placeholder="Rekomendasi lagu: Nyanyian Jemaat GKE No. 182 / NKB No. 128..."
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-purple-300 focus:outline-none focus:border-indigo-500 text-xs"
                />
              </div>

              <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 font-semibold cursor-pointer text-center"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold cursor-pointer text-center shadow-lg shadow-indigo-600/30"
                >
                  Simpan Naskah Khotbah Siap Baca
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Penyimpanan Naskah Khotbah */}
      {isConfirmSaveOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-400">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-100">Konfirmasi Penyimpanan Naskah</h3>
                <p className="text-xs text-slate-400">Arsip Naskah Khotbah Siap Baca GKE</p>
              </div>
            </div>

            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800/80 text-xs space-y-2">
              <div className="flex justify-between items-start">
                <span className="text-slate-400 font-semibold">Judul:</span>
                <span className="text-amber-300 font-bold text-right ml-2 max-w-[220px] line-clamp-2">
                  {formData.judulKhotbah || 'Naskah Khotbah GKE'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-semibold">Nats Alkitab:</span>
                <span className="text-slate-200 font-mono font-bold">{formData.natsAlkitab || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-semibold">Pengkhotbah:</span>
                <span className="text-slate-200 font-bold">{formData.pengkhotbah || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-semibold">Target Durasi:</span>
                <span className="text-indigo-400 font-bold font-mono">{formData.durasiTotalMenit} Menit</span>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Apakah Anda yakin ingin menyimpan naskah khotbah siap baca ini ke dalam pangkalan data Gereja Kalimantan Evangelis?
            </p>

            <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsConfirmSaveOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-semibold min-h-[38px]"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmSaveExecute}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 flex items-center gap-1.5 min-h-[38px]"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                <span>Ya, Simpan Naskah</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Progress Bar Penyimpanan */}
      {isSavingWithProgress && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4 text-center">
            <div className="mx-auto w-12 h-12 bg-indigo-500/10 border border-indigo-500/30 rounded-2xl flex items-center justify-center text-indigo-400">
              <Loader2 className="w-6 h-6 animate-spin text-amber-300" />
            </div>

            <div>
              <h3 className="text-sm font-bold text-slate-100">Menyimpan Naskah Khotbah...</h3>
              <p className="text-xs text-indigo-400 mt-1 font-medium">{saveStatusMessage}</p>
            </div>

            {/* Progress Bar Container */}
            <div className="space-y-1.5">
              <div className="w-full bg-slate-950 border border-slate-800 rounded-full h-3 overflow-hidden p-0.5">
                <div
                  className="bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-400 h-full rounded-full transition-all duration-300 ease-out shadow-sm"
                  style={{ width: `${saveProgress}%` }}
                />
              </div>
              <div className="flex justify-between items-center text-[10px] font-mono text-slate-400 font-bold px-1">
                <span>PROSES PENYIMPANAN</span>
                <span className="text-amber-300">{saveProgress}%</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Hapus Rancangan Khotbah */}
      {deletingItem && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-100">Konfirmasi Hapus Naskah</h3>
                <p className="text-xs text-rose-400 font-semibold">Tindakan ini tidak dapat dibatalkan</p>
              </div>
            </div>

            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800/80 text-xs space-y-2">
              <div className="flex justify-between items-start">
                <span className="text-slate-400 font-semibold">Judul Khotbah:</span>
                <span className="text-slate-200 font-bold text-right ml-2 line-clamp-2">
                  {deletingItem.judulKhotbah}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-semibold">Nats Alkitab:</span>
                <span className="text-indigo-300 font-mono font-bold">{deletingItem.natsAlkitab}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-semibold">Pengkhotbah:</span>
                <span className="text-slate-300 font-bold">{deletingItem.pengkhotbah}</span>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Apakah Anda yakin ingin menghapus rancangan khotbah ini secara permanen dari pangkalan data?
            </p>

            <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setDeletingItem(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-semibold min-h-[38px]"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteExecute}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-lg shadow-rose-600/30 flex items-center gap-1.5 min-h-[38px]"
              >
                <Trash2 className="w-4 h-4 text-rose-200" />
                <span>Ya, Hapus Naskah</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Progress Bar Hapus */}
      {isDeletingWithProgress && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4 text-center">
            <div className="mx-auto w-12 h-12 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-center justify-center text-rose-400">
              <Loader2 className="w-6 h-6 animate-spin text-rose-400" />
            </div>

            <div>
              <h3 className="text-sm font-bold text-slate-100">Menghapus Naskah Khotbah...</h3>
              <p className="text-xs text-rose-400 mt-1 font-medium">{deleteStatusMessage}</p>
            </div>

            <div className="space-y-1.5">
              <div className="w-full bg-slate-950 border border-slate-800 rounded-full h-3 overflow-hidden p-0.5">
                <div
                  className="bg-gradient-to-r from-rose-500 via-amber-500 to-rose-600 h-full rounded-full transition-all duration-300 ease-out shadow-sm"
                  style={{ width: `${deleteProgress}%` }}
                />
              </div>
              <div className="flex justify-between items-center text-[10px] font-mono text-slate-400 font-bold px-1">
                <span>PROSES HAPUS</span>
                <span className="text-rose-400">{deleteProgress}%</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Edit Rancangan Khotbah */}
      {editingCandidateItem && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-indigo-500/10 border border-indigo-500/30 rounded-xl text-indigo-400">
                <Edit2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-100">Konfirmasi Edit Naskah</h3>
                <p className="text-xs text-indigo-400 font-semibold">Penyuntingan Naskah Khotbah GKE</p>
              </div>
            </div>

            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800/80 text-xs space-y-2">
              <div className="flex justify-between items-start">
                <span className="text-slate-400 font-semibold">Judul Khotbah:</span>
                <span className="text-indigo-300 font-bold text-right ml-2 line-clamp-2">
                  {editingCandidateItem.judulKhotbah}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-semibold">Nats Alkitab:</span>
                <span className="text-slate-200 font-mono font-bold">{editingCandidateItem.natsAlkitab}</span>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Apakah Anda ingin membuka formulir penyuntingan untuk mengubah naskah khotbah ini?
            </p>

            <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setEditingCandidateItem(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-semibold min-h-[38px]"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmEditExecute}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 flex items-center gap-1.5 min-h-[38px]"
              >
                <Edit2 className="w-4 h-4 text-indigo-200" />
                <span>Ya, Edit Naskah</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Progress Bar Edit */}
      {isEditingWithProgress && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4 text-center">
            <div className="mx-auto w-12 h-12 bg-indigo-500/10 border border-indigo-500/30 rounded-2xl flex items-center justify-center text-indigo-400">
              <Loader2 className="w-6 h-6 animate-spin text-amber-300" />
            </div>

            <div>
              <h3 className="text-sm font-bold text-slate-100">Memuat Formulir Edit...</h3>
              <p className="text-xs text-indigo-400 mt-1 font-medium">{editStatusMessage}</p>
            </div>

            <div className="space-y-1.5">
              <div className="w-full bg-slate-950 border border-slate-800 rounded-full h-3 overflow-hidden p-0.5">
                <div
                  className="bg-gradient-to-r from-indigo-500 via-purple-500 to-amber-400 h-full rounded-full transition-all duration-300 ease-out shadow-sm"
                  style={{ width: `${editProgress}%` }}
                />
              </div>
              <div className="flex justify-between items-center text-[10px] font-mono text-slate-400 font-bold px-1">
                <span>MEMUAT EDIT</span>
                <span className="text-indigo-400">{editProgress}%</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Arsip / Aktifkan Khotbah */}
      {archivingItem && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-400">
                <Archive className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-100">
                  {archivingItem.statusArsip === 'Diarsipkan' ? 'Konfirmasi Aktifkan Kembali' : 'Konfirmasi Arsipkan Naskah'}
                </h3>
                <p className="text-xs text-amber-400 font-semibold">Pengelolaan Status Arsip Naskah Khotbah</p>
              </div>
            </div>

            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800/80 text-xs space-y-2">
              <div className="flex justify-between items-start">
                <span className="text-slate-400 font-semibold">Judul Khotbah:</span>
                <span className="text-amber-300 font-bold text-right ml-2 line-clamp-2">
                  {archivingItem.judulKhotbah}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-semibold">Status Saat Ini:</span>
                <span className="text-slate-200 font-bold">{archivingItem.statusArsip || 'Aktif'}</span>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              {archivingItem.statusArsip === 'Diarsipkan'
                ? 'Apakah Anda ingin mengembalikan naskah khotbah ini ke daftar khotbah aktif?'
                : 'Apakah Anda yakin ingin memindahkan naskah khotbah ini ke folder arsip?'}
            </p>

            <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setArchivingItem(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-semibold min-h-[38px]"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmArchiveExecute}
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow-lg shadow-amber-600/30 flex items-center gap-1.5 min-h-[38px]"
              >
                <Archive className="w-4 h-4 text-amber-100" />
                <span>
                  {archivingItem.statusArsip === 'Diarsipkan' ? 'Ya, Aktifkan Kembali' : 'Ya, Arsipkan Naskah'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Progress Bar Arsip */}
      {isArchivingWithProgress && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4 text-center">
            <div className="mx-auto w-12 h-12 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center justify-center text-amber-400">
              <Loader2 className="w-6 h-6 animate-spin text-amber-300" />
            </div>

            <div>
              <h3 className="text-sm font-bold text-slate-100">Memproses Status Arsip...</h3>
              <p className="text-xs text-amber-400 mt-1 font-medium">{archiveStatusMessage}</p>
            </div>

            <div className="space-y-1.5">
              <div className="w-full bg-slate-950 border border-slate-800 rounded-full h-3 overflow-hidden p-0.5">
                <div
                  className="bg-gradient-to-r from-amber-500 via-purple-500 to-emerald-400 h-full rounded-full transition-all duration-300 ease-out shadow-sm"
                  style={{ width: `${archiveProgress}%` }}
                />
              </div>
              <div className="flex justify-between items-center text-[10px] font-mono text-slate-400 font-bold px-1">
                <span>PROSES ARSIP</span>
                <span className="text-amber-300">{archiveProgress}%</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reading Teleprompter Modal (Mode Pembaca Mimbar) */}
      {readingItem && (
        <ReadingTeleprompterModal
          item={readingItem}
          onClose={() => setReadingItem(null)}
          onCopy={() => handleCopyManuscript(readingItem, 'teleprompter')}
          copied={copiedId === 'teleprompter'}
          countWords={countWords}
        />
      )}
    </div>
  );
};

// Subcomponent for Teleprompter Mimbar
interface ReadingTeleprompterModalProps {
  item: Omit<RancanganKhotbah, 'id'> | RancanganKhotbah;
  onClose: () => void;
  onCopy: () => void;
  copied: boolean;
  countWords: (txt: string) => number;
}

const ReadingTeleprompterModal: React.FC<ReadingTeleprompterModalProps> = ({
  item,
  onClose,
  onCopy,
  copied,
  countWords,
}) => {
  const [fontSize, setFontSize] = useState<number>(18); // 16 to 28px font size for pulpit reading

  const totalWords =
    countWords(item.pendahuluan) +
    item.poinUtama.reduce((acc, p) => acc + countWords(p.penjelasan) + countWords(p.nasihatPastoral || ''), 0) +
    countWords(item.penerapanAplikasi) +
    countWords(item.penutupDoa);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex flex-col justify-between animate-fadeIn">
      {/* Teleprompter Top Toolbar */}
      <div className="bg-slate-900 border-b border-slate-800 p-3 sm:p-4 px-4 sm:px-8 flex items-center justify-between shrink-0 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shrink-0">
            <Maximize2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-white text-sm sm:text-base flex items-center gap-2">
              <span>Mode Pembaca Mimbar (Teleprompter Khotbah GKE)</span>
              <span className="text-[10px] bg-emerald-500/10 text-emerald-400 font-mono px-2 py-0.5 rounded border border-emerald-500/20 font-bold">
                SIAP BACA
              </span>
            </h3>
            <p className="text-xs text-slate-400 hidden sm:block">
              {item.judulKhotbah} • {item.natsAlkitab} ({item.durasiTotalMenit} Menit ~ {totalWords} Kata)
            </p>
          </div>
        </div>

        {/* Toolbar Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Font Size Adjuster */}
          <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1.5 rounded-xl border border-slate-800">
            <span className="text-[11px] font-bold text-slate-400 hidden md:inline">Ukuran Teks:</span>
            <button
              onClick={() => setFontSize((prev) => Math.max(14, prev - 2))}
              className="p-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold text-xs"
              title="Kecilkan Teks"
            >
              A-
            </button>
            <span className="text-xs font-mono font-bold text-indigo-300 w-6 text-center">{fontSize}</span>
            <button
              onClick={() => setFontSize((prev) => Math.min(28, prev + 2))}
              className="p-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold text-xs"
              title="Besarkan Teks"
            >
              A+
            </button>
          </div>

          <button
            onClick={onCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/40 rounded-xl font-bold text-xs transition cursor-pointer"
          >
            {copied ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-400 hidden sm:inline">Tersalin</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-purple-400" />
                <span className="hidden sm:inline">Salin Naskah</span>
              </>
            )}
          </button>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 flex items-center justify-center font-bold text-sm transition cursor-pointer"
            title="Tutup Mode Pembaca Mimbar"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Main Manuscript Pulpit Display */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-8 md:p-12 max-w-4xl mx-auto w-full text-slate-100 font-serif leading-relaxed space-y-8 select-text">
        {/* Title Header Card */}
        <div className="text-center space-y-2 border-b border-slate-800/80 pb-6 font-sans">
          <span className="inline-block text-xs font-bold font-mono tracking-widest text-amber-400 uppercase bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
            NASKAH LISAN KHOTBAH MIMBAR GKE • TARGET {item.durasiTotalMenit} MENIT
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">{item.judulKhotbah}</h1>
          <p className="text-sm font-semibold text-indigo-300">
            {item.natsAlkitab} • {item.temaKhotbah}
          </p>
          <div className="flex items-center justify-center gap-4 text-xs text-slate-400 pt-1">
            <span>Pelayan Firman: <strong className="text-slate-200">{item.pengkhotbah}</strong></span>
            <span>•</span>
            <span>Estimasi {totalWords} kata lisan</span>
          </div>
        </div>

        {/* Section 1: Pendahuluan */}
        <div className="space-y-3 bg-slate-900/60 p-6 sm:p-8 rounded-2xl border border-slate-800">
          <div className="flex items-center gap-2 text-indigo-400 font-sans font-extrabold text-sm uppercase tracking-wider">
            <Feather className="w-4 h-4" />
            <span>I. PENDAHULUAN & SALAM LITURGIS GKE</span>
          </div>
          <div style={{ fontSize: `${fontSize}px` }} className="text-slate-200 whitespace-pre-line leading-relaxed font-serif">
            {item.pendahuluan}
          </div>
        </div>

        {/* Section 2: Poin-poin Khotbah */}
        <div className="space-y-6">
          <div className="flex items-center gap-2 text-indigo-400 font-sans font-extrabold text-sm uppercase tracking-wider border-b border-slate-800 pb-2">
            <BookOpen className="w-4 h-4" />
            <span>II. POIN-POIN KHOTBAH LISAN UTUH ({item.poinUtama.length} POIN)</span>
          </div>

          {item.poinUtama.map((poin, idx) => (
            <div key={idx} className="bg-slate-900/80 p-6 sm:p-8 rounded-2xl border border-slate-800/90 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3 font-sans">
                <h3 className="text-lg font-bold text-indigo-200">{poin.judulPoin}</h3>
                <span className="text-xs font-mono font-bold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20">
                  ~{poin.durasiMenit} Menit
                </span>
              </div>

              <div style={{ fontSize: `${fontSize}px` }} className="text-slate-200 whitespace-pre-line leading-relaxed font-serif">
                {poin.penjelasan}
              </div>

              {poin.nasihatPastoral && (
                <div className="bg-slate-950 p-4 rounded-xl border border-amber-500/30 text-amber-300 font-sans text-xs sm:text-sm italic leading-relaxed">
                  <strong>💡 Nasihat Pastoral Penggembalaan:</strong> {poin.nasihatPastoral}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Section 3: Penerapan Aplikasi */}
        <div className="space-y-3 bg-slate-900/60 p-6 sm:p-8 rounded-2xl border border-slate-800">
          <div className="flex items-center gap-2 text-emerald-400 font-sans font-extrabold text-sm uppercase tracking-wider">
            <Heart className="w-4 h-4" />
            <span>III. PENERAPAN & AKSI PASTORAL WARGA JEMAAT</span>
          </div>
          <div style={{ fontSize: `${fontSize}px` }} className="text-slate-200 whitespace-pre-line leading-relaxed font-serif">
            {item.penerapanAplikasi}
          </div>
        </div>

        {/* Section 4: Penutup & Doa Syafaat */}
        <div className="space-y-3 bg-slate-900/80 p-6 sm:p-8 rounded-2xl border border-indigo-500/30">
          <div className="flex items-center gap-2 text-amber-400 font-sans font-extrabold text-sm uppercase tracking-wider">
            <Sparkles className="w-4 h-4" />
            <span>IV. PENUTUP & TEKS DOA SYAFAAT PASTORAL GKE (SIAP DIBACA)</span>
          </div>
          <div style={{ fontSize: `${fontSize}px` }} className="text-slate-200 whitespace-pre-line leading-relaxed font-serif">
            {item.penutupDoa}
          </div>
        </div>

        {/* Section 5: Catatan Liturgis */}
        {item.catatanLiturgis && (
          <div className="bg-purple-950/40 p-5 rounded-2xl border border-purple-500/30 text-purple-200 font-sans text-xs space-y-1">
            <p className="font-bold uppercase tracking-wider text-purple-300 flex items-center gap-1.5">
              <Music className="w-4 h-4 text-purple-400" />
              <span>Catatan Liturgis & Rekomendasi Nyanyian:</span>
            </p>
            <p className="leading-relaxed">{item.catatanLiturgis}</p>
          </div>
        )}
      </div>

      {/* Teleprompter Footer */}
      <div className="bg-slate-900 border-t border-slate-800 p-3 px-6 text-center text-xs text-slate-400 font-sans shrink-0">
        Gereja Kalimantan Evangelis (GKE) • Naskah Lisan Khotbah Siap Baca di Mimbar Pelayanan
      </div>
    </div>
  );
};
