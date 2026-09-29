import React, { useState, useEffect } from 'react';
import {
  Vote,
  Users,
  CheckCircle2,
  AlertCircle,
  Plus,
  Search,
  Printer,
  Edit2,
  Trash2,
  X,
  Award,
  BarChart3,
  FileCheck,
  ShieldCheck,
  Sparkles,
  Lock,
  Eye,
  Send,
  UserCheck,
  Clock,
  CheckSquare,
  Square,
  HelpCircle,
  ChevronRight,
  UserPlus,
  RotateCcw,
  Check,
  FileText,
  Filter,
  Layers,
  Settings2,
  Sliders,
  BookOpen,
  Copy,
  AlertTriangle,
  Calendar,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { SesiPemilihan, KandidatPemilihan, SuaraVoting, NominasiAspirasi } from '../../types';
import { DeleteConfirmModal } from '../DeleteConfirmModal';

export const PemilihanModule: React.FC = () => {
  const {
    sesiPemilihanList,
    addSesiPemilihan,
    updateSesiPemilihan,
    deleteSesiPemilihan,
    kandidatPemilihanList,
    addKandidatPemilihan,
    updateKandidatPemilihan,
    deleteKandidatPemilihan,
    suaraVotingList,
    submitSuaraVoting,
    resetSuaraVotingSesi,
    nominasiAspirasiList,
    submitNominasiAspirasi,
    updateNominasiAspirasi,
    deleteNominasiAspirasi,
    currentUser,
    wargaJemaatList,
    openPrintReport,
  } = useApp();

  const [activeSubTab, setActiveSubTab] = useState<'bilik' | 'nominasi' | 'admin'>('bilik');
  const [selectedSesiId, setSelectedSesiId] = useState<string>(
    sesiPemilihanList.find((s) => s.status === 'Aktif')?.id || sesiPemilihanList[0]?.id || ''
  );

  // Modal Kelola Sesi Pemilihan
  const [isManageSesiModalOpen, setIsManageSesiModalOpen] = useState(false);

  // Voting Selection State
  const [selectedCandidateIds, setSelectedCandidateIds] = useState<string[]>([]);
  const [voterNameInput, setVoterNameInput] = useState<string>(
    currentUser?.namaLengkap && currentUser?.role !== 'guest' ? currentUser.namaLengkap : ''
  );
  const [voterRayonInput, setVoterRayonInput] = useState<string>('Rayon 1');
  const [voterKjjInput, setVoterKjjInput] = useState<string>('');
  const [voteReceipt, setVoteReceipt] = useState<{ code: string; time: string; sessionTitle: string } | null>(null);
  const [votingError, setVotingError] = useState<string | null>(null);
  const [isSubmittingVote, setIsSubmittingVote] = useState(false);
  const [isVoteConfirmModalOpen, setIsVoteConfirmModalOpen] = useState(false);

  // Candidate Profile Modal
  const [previewKandidat, setPreviewKandidat] = useState<KandidatPemilihan | null>(null);

  // Nominasi Form State & Filters
  const [nomForm, setNomForm] = useState<Omit<NominasiAspirasi, 'id' | 'waktuUsulan'>>({
    sesiId: selectedSesiId,
    namaCalonDiusulkan: '',
    jabatanDiusulkan: 'Penatua',
    alasanUsulan: '',
    pengusulNama: currentUser?.namaLengkap || '',
    pengusulRayon: 'Rayon 1',
    statusVerifikasi: 'Menunggu Verifikasi',
  });
  const [nomSuccessMsg, setNomSuccessMsg] = useState<string | null>(null);
  const [aspirasiFilterStatus, setAspirasiFilterStatus] = useState<string>('Semua');
  const [aspirasiSearch, setAspirasiSearch] = useState<string>('');
  const [promotedNomId, setPromotedNomId] = useState<string | null>(null);
  const [isAyatModalOpen, setIsAyatModalOpen] = useState(false);
  const [copiedAyat, setCopiedAyat] = useState(false);

  // Sesi Expired / Closed Voting Dialog State
  const [isSesiExpiredModalOpen, setIsSesiExpiredModalOpen] = useState(false);
  const [hasAutoOpenedExpiredModal, setHasAutoOpenedExpiredModal] = useState<string | null>(null);

  // Admin Modals & Delete Confirmation Targets
  const [isSesiModalOpen, setIsSesiModalOpen] = useState(false);
  const [editingSesi, setEditingSesi] = useState<SesiPemilihan | null>(null);
  const [deleteSesiTarget, setDeleteSesiTarget] = useState<SesiPemilihan | null>(null);

  const [isKandidatModalOpen, setIsKandidatModalOpen] = useState(false);
  const [editingKandidat, setEditingKandidat] = useState<KandidatPemilihan | null>(null);
  const [deleteKandidatTarget, setDeleteKandidatTarget] = useState<KandidatPemilihan | null>(null);

  const [deleteNominasiTarget, setDeleteNominasiTarget] = useState<NominasiAspirasi | null>(null);
  const [resetSuaraTarget, setResetSuaraTarget] = useState<SesiPemilihan | null>(null);

  const canManage =
    currentUser.role === 'admin' ||
    currentUser.role === 'pendeta' ||
    currentUser.role === 'sekretaris' ||
    currentUser.role === 'majelis';

  // Sesi Form State
  const [sesiForm, setSesiForm] = useState<Omit<SesiPemilihan, 'id'>>({
    judulPemilihan: '',
    periode: '2026-2031',
    jenisSesi: 'Majelis Jemaat (Penatua & Diakon)',
    tanggalMulai: new Date().toISOString().split('T')[0],
    tanggalSelesai: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: 'Aktif',
    maksimalPilihan: 3,
    deskripsiTataTertib: '',
  });

  // Kandidat Form State
  const [kandidatForm, setKandidatForm] = useState<Omit<KandidatPemilihan, 'id' | 'jumlahSuara'>>({
    sesiId: selectedSesiId,
    nomorUrut: 1,
    namaLengkap: '',
    gelar: '',
    jabatanDicalonkan: 'Penatua',
    lingkungan: 'Rayon 1',
    fotoUrl: '',
    latarBelakang: '',
    visiMisi: '',
    riwayatPelayanan: '',
  });

  // Current active session
  const currentSesi = sesiPemilihanList.find((s) => s.id === selectedSesiId) || sesiPemilihanList[0];
  const sessionCandidates = kandidatPemilihanList.filter((k) => k.sesiId === currentSesi?.id);
  const sessionVotes = suaraVotingList.filter((v) => v.sesiId === currentSesi?.id);
  const sessionNominations = nominasiAspirasiList.filter((n) => !n.sesiId || n.sesiId === currentSesi?.id);

  // Helper evaluasi status aktif/selesai sesi pemilihan
  const getSesiVotingStatus = (sesi?: SesiPemilihan | null) => {
    if (!sesi) {
      return {
        isEnded: false,
        isExpired: false,
        isClosed: false,
        isPersiapan: false,
        reason: '',
        statusLabel: 'Draft',
      };
    }

    const isExplicitlyClosed = sesi.status === 'Ditutup' || sesi.status === 'Selesai';
    const isPersiapan = sesi.status === 'Persiapan';
    let isDateExpired = false;

    if (sesi.tanggalSelesai) {
      const now = new Date();
      let endTimestamp: number;
      if (sesi.tanggalSelesai.includes('T')) {
        endTimestamp = new Date(sesi.tanggalSelesai).getTime();
      } else {
        const parts = sesi.tanggalSelesai.split('-');
        if (parts.length === 3) {
          const y = parseInt(parts[0], 10);
          const m = parseInt(parts[1], 10) - 1;
          const d = parseInt(parts[2], 10);
          endTimestamp = new Date(y, m, d, 23, 59, 59, 999).getTime();
        } else {
          endTimestamp = new Date(sesi.tanggalSelesai).getTime();
        }
      }

      if (!isNaN(endTimestamp) && now.getTime() > endTimestamp) {
        isDateExpired = true;
      }
    }

    const isEnded = isExplicitlyClosed || isDateExpired;
    let reason = '';
    if (isExplicitlyClosed) {
      reason = `Status sesi pemilihan telah diatur menjadi "${sesi.status}". Bilik suara telah resmi ditutup.`;
    } else if (isDateExpired) {
      reason = `Batas akhir jadwal pemilihan (${sesi.tanggalSelesai}) telah berakhir. Sistem telah menutup pengumpulan suara secara otomatis.`;
    }

    return {
      isEnded,
      isExpired: isDateExpired,
      isClosed: isExplicitlyClosed,
      isPersiapan,
      reason,
      statusLabel: isExplicitlyClosed
        ? sesi.status
        : isDateExpired
        ? 'Selesai (Batas Waktu Berakhir)'
        : (sesi.status || 'Aktif'),
    };
  };

  const currentSesiStatus = getSesiVotingStatus(currentSesi);

  // Auto show modal penutupan jika user membuka bilik suara pada sesi yang sudah berakhir
  useEffect(() => {
    if (currentSesi && currentSesiStatus.isEnded && activeSubTab === 'bilik') {
      if (hasAutoOpenedExpiredModal !== currentSesi.id) {
        setIsSesiExpiredModalOpen(true);
        setHasAutoOpenedExpiredModal(currentSesi.id);
      }
    }
  }, [currentSesi?.id, currentSesiStatus.isEnded, activeSubTab, hasAutoOpenedExpiredModal]);

  // Filter and search for Nominasi Aspirasi
  const filteredNominations = sessionNominations.filter((nom) => {
    const statusVal = nom.statusVerifikasi || 'Menunggu Verifikasi';
    const matchesStatus = aspirasiFilterStatus === 'Semua' || statusVal === aspirasiFilterStatus;
    const q = aspirasiSearch.toLowerCase().trim();
    const matchesSearch =
      !q ||
      nom.namaCalonDiusulkan.toLowerCase().includes(q) ||
      nom.jabatanDiusulkan.toLowerCase().includes(q) ||
      nom.pengusulNama.toLowerCase().includes(q) ||
      (nom.pengusulRayon && nom.pengusulRayon.toLowerCase().includes(q)) ||
      (nom.alasanUsulan && nom.alasanUsulan.toLowerCase().includes(q));
    return matchesStatus && matchesSearch;
  });

  // Check if current user already voted
  const voterIdentifier = currentUser?.id || voterNameInput;
  const hasAlreadyVoted = sessionVotes.some(
    (v) => (currentUser?.id && v.voterId === currentUser.id) || (voterNameInput && v.voterNama.toLowerCase() === voterNameInput.toLowerCase())
  );

  // Total votes cast across candidates
  const totalVotesAccumulated = sessionCandidates.reduce((acc, curr) => acc + (curr.jumlahSuara || 0), 0);

  // Toggle selection for candidate in voting
  const handleToggleCandidate = (kandidatId: string) => {
    if (currentSesiStatus.isEnded) {
      setIsSesiExpiredModalOpen(true);
      return;
    }

    if (selectedCandidateIds.includes(kandidatId)) {
      setSelectedCandidateIds(selectedCandidateIds.filter((id) => id !== kandidatId));
    } else {
      const maxAllowed = currentSesi?.maksimalPilihan || 1;
      if (selectedCandidateIds.length >= maxAllowed) {
        // If max is 1, replace selection. If > 1, prevent or alert
        if (maxAllowed === 1) {
          setSelectedCandidateIds([kandidatId]);
        } else {
          setVotingError(`Anda hanya dapat memilih maksimal ${maxAllowed} calon pada sesi ini.`);
          setTimeout(() => setVotingError(null), 3000);
        }
      } else {
        setSelectedCandidateIds([...selectedCandidateIds, kandidatId]);
      }
    }
  };

  // Open modal konfirmasi sebelum submit suara
  const handleInitiateVote = () => {
    if (!currentSesi) return;

    if (currentSesiStatus.isEnded) {
      setIsSesiExpiredModalOpen(true);
      return;
    }

    if (selectedCandidateIds.length === 0) {
      setVotingError('Silakan pilih minimal 1 calon pilihan Anda sebelum mengirimkan suara.');
      return;
    }
    if (!voterNameInput.trim()) {
      setVotingError('Mohon isi nama lengkap Anda sebagai pemilih sah.');
      return;
    }
    if (hasAlreadyVoted) {
      setVotingError('Identitas Anda telah tercatat memberikan suara pada sesi pemilihan ini.');
      return;
    }
    setVotingError(null);
    setIsVoteConfirmModalOpen(true);
  };

  // Submit E-Vote setelah dikonfirmasi
  const handleConfirmCastVote = async () => {
    if (!currentSesi) return;

    if (currentSesiStatus.isEnded) {
      setIsVoteConfirmModalOpen(false);
      setIsSesiExpiredModalOpen(true);
      return;
    }

    setIsSubmittingVote(true);
    setVotingError(null);

    const voterId = currentUser?.id || `voter-${Date.now()}`;
    const result = await submitSuaraVoting(currentSesi.id, selectedCandidateIds, {
      id: voterId,
      nama: voterNameInput.trim(),
      rayon: voterRayonInput,
      noKjj: voterKjjInput,
    });

    setIsSubmittingVote(false);
    setIsVoteConfirmModalOpen(false);

    if (result.success && result.kodeVerifikasi) {
      setVoteReceipt({
        code: result.kodeVerifikasi,
        time: new Date().toLocaleString('id-ID'),
        sessionTitle: currentSesi.judulPemilihan,
      });
      setSelectedCandidateIds([]);
    } else {
      setVotingError(result.message || 'Gagal mengirimkan suara pemilihan.');
    }
  };

  // Submit Nominasi Aspirasi
  const handleSubmitNominasi = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nomForm.namaCalonDiusulkan.trim()) return;

    const res = await submitNominasiAspirasi({
      ...nomForm,
      sesiId: currentSesi?.id || '',
    });

    if (res.success) {
      setNomSuccessMsg(res.message || 'Aspirasi Anda berhasil dikirimkan!');
      setNomForm({
        sesiId: currentSesi?.id || '',
        namaCalonDiusulkan: '',
        jabatanDiusulkan: 'Penatua',
        alasanUsulan: '',
        pengusulNama: currentUser?.namaLengkap || '',
        pengusulRayon: 'Rayon 1',
        statusVerifikasi: 'Menunggu Verifikasi',
      });
      setTimeout(() => setNomSuccessMsg(null), 4000);
    }
  };

  // Promosikan Aspirasi Menjadi Calon Tetap di Bilik Suara
  const handlePromoteToCandidate = (nom: NominasiAspirasi) => {
    setPromotedNomId(nom.id);
    setEditingKandidat(null);
    const nextNum = sessionCandidates.length + 1;
    setKandidatForm({
      sesiId: currentSesi?.id || selectedSesiId,
      nomorUrut: nextNum,
      namaLengkap: nom.namaCalonDiusulkan,
      gelar: '',
      jabatanDicalonkan: nom.jabatanDiusulkan || 'Penatua',
      lingkungan: nom.pengusulRayon || 'Rayon 1',
      fotoUrl: '',
      latarBelakang: `Diusulkan oleh jemaat (${nom.pengusulNama} - ${nom.pengusulRayon || 'Rayon Jemaat'})`,
      visiMisi: nom.alasanUsulan || 'Siap melayani jemaat dengan keteladanan dan kerendahan hati.',
      riwayatPelayanan: `Usulan aspirasi jemaat: "${nom.alasanUsulan}"`,
    });
    setIsKandidatModalOpen(true);
  };

  // Sesi modal helpers
  const handleOpenAddSesi = () => {
    setEditingSesi(null);
    setSesiForm({
      judulPemilihan: '',
      periode: '2026-2031',
      jenisSesi: 'Majelis Jemaat (Penatua & Diakon)',
      tanggalMulai: new Date().toISOString().split('T')[0],
      tanggalSelesai: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'Aktif',
      maksimalPilihan: 3,
      deskripsiTataTertib: 'Setiap pemilih yang sah memiliki hak memilih maksimal 3 calon.',
    });
    setIsSesiModalOpen(true);
  };

  const handleOpenEditSesi = (sesi: SesiPemilihan) => {
    setEditingSesi(sesi);
    setSesiForm({
      judulPemilihan: sesi.judulPemilihan,
      periode: sesi.periode,
      jenisSesi: sesi.jenisSesi,
      tanggalMulai: sesi.tanggalMulai,
      tanggalSelesai: sesi.tanggalSelesai,
      status: sesi.status,
      maksimalPilihan: sesi.maksimalPilihan,
      deskripsiTataTertib: sesi.deskripsiTataTertib || '',
    });
    setIsSesiModalOpen(true);
  };

  const handleSaveSesi = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sesiForm.judulPemilihan.trim()) return;

    if (editingSesi) {
      await updateSesiPemilihan(editingSesi.id, sesiForm);
    } else {
      const newId = await addSesiPemilihan(sesiForm);
      setSelectedSesiId(newId);
    }
    setIsSesiModalOpen(false);
  };

  // Kandidat modal helpers
  const handleOpenAddKandidat = () => {
    setEditingKandidat(null);
    const nextNum = sessionCandidates.length + 1;
    setKandidatForm({
      sesiId: currentSesi?.id || '',
      nomorUrut: nextNum,
      namaLengkap: '',
      gelar: '',
      jabatanDicalonkan: 'Penatua',
      lingkungan: 'Rayon 1',
      fotoUrl: '',
      latarBelakang: '',
      visiMisi: '',
      riwayatPelayanan: '',
    });
    setIsKandidatModalOpen(true);
  };

  const handleOpenEditKandidat = (kand: KandidatPemilihan) => {
    setEditingKandidat(kand);
    setKandidatForm({
      sesiId: kand.sesiId,
      nomorUrut: kand.nomorUrut,
      namaLengkap: kand.namaLengkap,
      gelar: kand.gelar || '',
      jabatanDicalonkan: kand.jabatanDicalonkan,
      lingkungan: kand.lingkungan || 'Rayon 1',
      fotoUrl: kand.fotoUrl || '',
      latarBelakang: kand.latarBelakang || '',
      visiMisi: kand.visiMisi || '',
      riwayatPelayanan: kand.riwayatPelayanan || '',
    });
    setIsKandidatModalOpen(true);
  };

  const handleSaveKandidat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!kandidatForm.namaLengkap.trim()) return;

    if (editingKandidat) {
      await updateKandidatPemilihan(editingKandidat.id, kandidatForm);
    } else {
      await addKandidatPemilihan({
        ...kandidatForm,
        sesiId: currentSesi?.id || selectedSesiId,
      });

      if (promotedNomId) {
        await updateNominasiAspirasi(promotedNomId, { statusVerifikasi: 'Disetujui' });
        setPromotedNomId(null);
      }
    }
    setIsKandidatModalOpen(false);
  };

  const handleCopyAyat = () => {
    const fullText = `1 TIMOTIUS 3:1-16 (Alkitab Terjemahan Baru LAI)
SYARAT-SYARAT ALKITABIAH PELAYAN JEMAAT (PENATUA, DIAKON & PANITIA PELAYANAN)

--- SYARAT-SYARAT PENILIK JEMAAT (1 Timotius 3:1-7) ---
1. Benarlah perkataan ini: "Jikalau seorang menghendaki jabatan penilik jemaat, ia menginginkan pekerjaan yang indah."
2. Karena itu penilik jemaat haruslah seorang yang tak bercela, suami dari satu isteri, dapat menahan diri, bijaksana, sopan, suka memberi tumpangan, cakap mengajar orang,
3. bukan peminum, bukan pemarah melainkan peramah, pendamai, bukan hamba uang,
4. seorang kepala keluarga yang baik, disegani dan dihormati oleh anak-anaknya.
5. Jikalau seorang tidak tahu mengepalai keluarganya sendiri, bagaimanakah ia dapat mengurus Jemaat Allah?
6. Janganlah ia seorang yang baru bertobat, agar jangan ia menjadi sombong dan kena hukuman Iblis.
7. Hendaklah ia juga mempunyai nama baik di luar jemaat, agar jangan ia digugat orang dan jatuh ke dalam jerat Iblis.

--- SYARAT-SYARAT DIAKON (1 Timotius 3:8-13) ---
8. Demikian juga diakon-diakon haruslah orang terhormat, jangan bercabang lidah, jangan penggemar anggur, jangan serakah,
9. melainkan orang yang memelihara rahasia iman dalam hati nurani yang murni.
10. Mereka juga harus diuji dahulu, baru ditetapkan dalam pelayanan itu setelah ternyata mereka tak bercela.
11. Demikian pula isteri-isteri hendaklah orang terhormat, jangan pemfitnah, hendaklah dapat menahan diri dan dapat dipercaya dalam segala hal.
12. Diakon haruslah suami dari satu isteri dan mengurus anak-anaknya dan keluarganya dengan baik.
13. Karena mereka yang melayani dengan baik beroleh kedudukan yang baik sehingga dalam iman kepada Kristus Yesus mereka dapat bersaksi dengan leluasa.

--- DASAR JEMAAT & RAHASIA IBADAH (1 Timotius 3:14-16) ---
14. Semuanya itu kutuliskan kepadamu, walaupun kuharap segera dapat mengunjungi engkau.
15. Jadi jika aku terlambat, sudahlah engkau tahu bagaimana orang harus hidup sebagai keluarga Allah, yakni jemaat dari Allah yang hidup, tiang penopang dan dasar kebenaran.
16. Dan sesungguhnya agunglah rahasia ibadah kita: "Dia, yang telah menyatakan diri-Nya dalam rupa manusia, dibenarkan dalam Roh; yang menampakkan diri-Nya kepada malaikat-malaikat, diberitakan di antara bangsa-bangsa yang tidak mengenal Allah; yang dipercayai di dalam dunia, diangkat dalam kemuliaan."`;

    navigator.clipboard.writeText(fullText);
    setCopiedAyat(true);
    setTimeout(() => setCopiedAyat(false), 2500);
  };

  return (
    <div id="pemilihan-module" className="space-y-6">
      {/* Header Banner */}
      <div
        id="pemilihan-header"
        className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4"
      >
        <div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
              <Vote className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                Pemilihan Majelis & Panitia (E-Voting & Nominasi)
              </h1>
              <p className="text-sm text-slate-500 mt-0.5">
                Sistem aspirasi nominasi calon dan bilik suara e-voting jemaat yang aman, tertib, dan transparan.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            id="btn-print-pemilihan"
            onClick={() => openPrintReport({ reportType: 'pemilihan_rekap', sesiId: currentSesi?.id })}
            className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-sm rounded-xl transition-colors flex items-center gap-2 cursor-pointer"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            <span>Cetak Rekap</span>
          </button>

          {canManage && (
            <>
              <button
                id="btn-manage-sesi-modal"
                onClick={() => setIsManageSesiModalOpen(true)}
                className="px-3.5 py-2.5 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 font-semibold text-sm rounded-xl transition-colors flex items-center gap-2 cursor-pointer shadow-2xs"
                title="Buka daftar lengkap dan kelola seluruh sesi pemilihan"
              >
                <Layers className="w-4 h-4 text-purple-600" />
                <span>Kelola Sesi ({sesiPemilihanList.length})</span>
              </button>

              <button
                id="btn-add-sesi-pemilihan"
                onClick={handleOpenAddSesi}
                className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-medium text-sm rounded-xl transition-colors shadow-xs flex items-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Buka Sesi Baru</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Sesi Pemilihan Active Selector */}
      {sesiPemilihanList.length > 0 ? (
        <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-3 overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 min-w-0 flex-1">
            <div className="flex items-center gap-2 shrink-0">
              <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <span className="text-xs sm:text-sm font-bold text-slate-800 whitespace-nowrap">
                Sesi Terpilih:
              </span>
            </div>
            <div className="min-w-0 flex-1 w-full flex items-center gap-2">
              <select
                id="select-sesi-pemilihan-active"
                value={selectedSesiId || ''}
                onChange={(e) => setSelectedSesiId(e.target.value)}
                className="w-full max-w-full truncate px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 cursor-pointer"
              >
                {sesiPemilihanList.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.judulPemilihan} ({s.status}) - Periode {s.periode}
                  </option>
                ))}
              </select>

              {/* Quick Actions on Active Session */}
              {canManage && currentSesi && (
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleOpenEditSesi(currentSesi)}
                    className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors cursor-pointer border border-slate-200"
                    title="Edit Sesi Pemilihan Ini"
                  >
                    <Edit2 className="w-4 h-4 text-slate-700" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteSesiTarget(currentSesi)}
                    className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl transition-colors cursor-pointer border border-rose-200"
                    title="Hapus Sesi Pemilihan Ini Beserta Seluruh Datanya"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsManageSesiModalOpen(true)}
                    className="p-2 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-xl transition-colors cursor-pointer border border-purple-200"
                    title="Kelola Semua Sesi Pemilihan"
                  >
                    <Sliders className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs text-slate-500 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100 shrink-0">
            {canManage && currentSesi && (
              <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200/60">
                <span className="text-slate-500 font-medium">Status:</span>
                <select
                  value={currentSesi.status || 'Aktif'}
                  onChange={(e) => updateSesiPemilihan(currentSesi.id, { status: e.target.value as any })}
                  className={`font-bold text-xs bg-transparent border-0 cursor-pointer focus:ring-0 ${
                    currentSesi.status === 'Aktif'
                      ? 'text-emerald-700'
                      : currentSesi.status === 'Persiapan'
                      ? 'text-amber-700'
                      : currentSesi.status === 'Ditutup'
                      ? 'text-rose-700'
                      : 'text-slate-600'
                  }`}
                  title="Ubah Status Sesi Secara Cepat"
                >
                  <option value="Aktif">Aktif</option>
                  <option value="Persiapan">Persiapan</option>
                  <option value="Selesai">Selesai</option>
                  <option value="Ditutup">Ditutup</option>
                </select>
              </div>
            )}
            <span className="bg-purple-50 text-purple-700 font-semibold px-2.5 py-1 rounded-lg">
              Maks. Pilihan: <strong className="font-bold">{currentSesi?.maksimalPilihan || 1} Calon</strong>
            </span>
            <span className="flex items-center gap-1 bg-slate-50 text-slate-600 px-2.5 py-1 rounded-lg border border-slate-200/60">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>Batas: {currentSesi?.tanggalSelesai || '-'}</span>
            </span>
          </div>
        </div>
      ) : (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 sm:p-5 text-amber-900 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-6 h-6 text-amber-600 shrink-0" />
            <div>
              <h4 className="font-bold text-sm">Belum Ada Sesi Pemilihan E-Voting</h4>
              <p className="text-xs text-amber-800 mt-0.5">
                Silakan buka sesi pemilihan baru agar warga jemaat dapat memberikan aspirasi nominasi dan hak suara.
              </p>
            </div>
          </div>
          {canManage && (
            <button
              type="button"
              onClick={handleOpenAddSesi}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-xs shrink-0 cursor-pointer"
            >
              + Buka Sesi Pemilihan Pertama
            </button>
          )}
        </div>
      )}

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <Vote className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Total Suara Masuk</p>
              <h3 className="text-xl font-bold text-slate-900 mt-0.5">{sessionVotes.length} Pemilih</h3>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Jumlah Calon Kandidat</p>
              <h3 className="text-xl font-bold text-slate-900 mt-0.5">{sessionCandidates.length} Orang</h3>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <FileCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Aspirasi Nominasi Masuk</p>
              <h3 className="text-xl font-bold text-slate-900 mt-0.5">{sessionNominations.length} Usulan</h3>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Status Sesi</p>
              <h3 className="text-xl font-bold text-slate-900 mt-0.5">{currentSesi?.status || 'Draft'}</h3>
            </div>
          </div>
        </div>
      </div>

      {/* Sub Tabs Switcher */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-2 overflow-x-auto">
          <button
            id="subtab-bilik"
            onClick={() => setActiveSubTab('bilik')}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all whitespace-nowrap flex items-center gap-2 ${
              activeSubTab === 'bilik'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Vote className="w-4 h-4" />
            <span>Bilik Suara E-Voting ({sessionCandidates.length} Calon)</span>
          </button>

          <button
            id="subtab-nominasi"
            onClick={() => setActiveSubTab('nominasi')}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all whitespace-nowrap flex items-center gap-2 ${
              activeSubTab === 'nominasi'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>Penjaringan Aspirasi Nominasi ({sessionNominations.length})</span>
          </button>

          {canManage && (
            <button
              id="subtab-admin-pemilihan"
              onClick={() => setActiveSubTab('admin')}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all whitespace-nowrap flex items-center gap-2 ${
                activeSubTab === 'admin'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Rekapitulasi & Panel Panitia</span>
            </button>
          )}
        </div>
      </div>

      {/* SUBTAB 1: BILIK SUARA E-VOTING */}
      {activeSubTab === 'bilik' && (
        <div className="space-y-6">
          {/* Sesi Header Notice */}
          <div className="bg-linear-to-r from-purple-900 to-indigo-900 text-white p-6 rounded-2xl shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-semibold tracking-wide text-purple-200 mb-2">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>E-Voting Resmi Majelis Jemaat</span>
              </div>
              <h2 className="text-2xl font-bold text-white tracking-tight">
                {currentSesi?.judulPemilihan || 'Pemilihan Calon Majelis Jemaat'}
              </h2>
              <p className="text-sm text-purple-200 mt-1 max-w-2xl">
                {currentSesi?.deskripsiTataTertib ||
                  'Silakan pelajari visi-misi calon kandidat di bawah dan berikan suara pilihan Anda secara bijak dan bertanggung jawab di hadapan Tuhan.'}
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-md p-4 rounded-xl text-right shrink-0 border border-white/10">
              <p className="text-xs text-purple-200 uppercase font-semibold tracking-wider">Maksimal Pilihan</p>
              <h3 className="text-2xl font-black text-amber-300 mt-0.5">
                {selectedCandidateIds.length} / {currentSesi?.maksimalPilihan || 1} Calon
              </h3>
              <p className="text-[11px] text-purple-300 mt-1">Pilihan Tercentang</p>
            </div>
          </div>

          {/* Closed / Expired Session Alert Banner */}
          {currentSesiStatus.isEnded && (
            <div className="bg-linear-to-r from-rose-50 via-amber-50/70 to-rose-50 border-2 border-rose-300 p-5 rounded-2xl shadow-xs text-rose-950 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-start sm:items-center gap-3.5">
                <div className="w-12 h-12 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Lock className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-600 text-white shadow-2xs">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      SESI VOTING TELAH SELESAI
                    </span>
                    <span className="text-xs font-semibold text-rose-800 bg-rose-100/80 px-2.5 py-0.5 rounded-full">
                      Batas Akhir: {currentSesi?.tanggalSelesai || '-'}
                    </span>
                  </div>
                  <h3 className="font-bold text-base text-rose-950 mt-1.5">
                    Pengumpulan Suara E-Voting Telah Ditutup
                  </h3>
                  <p className="text-xs text-rose-800/90 mt-0.5 leading-relaxed">
                    Sesi pemilihan ini telah melewati batas akhir jadwal atau telah ditutup resmi oleh panitia. Bilik suara dikunci dan sistem tidak menerima pengumpulan suara baru.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
                <button
                  type="button"
                  id="btn-open-expired-dialog-banner"
                  onClick={() => setIsSesiExpiredModalOpen(true)}
                  className="w-full sm:w-auto px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Eye className="w-4 h-4" />
                  <span>Buka Dialog Pengumuman</span>
                </button>
                {canManage && (
                  <button
                    type="button"
                    onClick={() => handleOpenEditSesi(currentSesi)}
                    className="px-3.5 py-2.5 bg-white border border-rose-200 hover:bg-rose-100/60 text-rose-800 text-xs font-bold rounded-xl transition-colors shrink-0 cursor-pointer"
                    title="Perpanjang batas waktu sesi"
                  >
                    Perpanjang Waktu
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Voting Receipt (If Just Voted) */}
          {voteReceipt && (
            <div className="bg-emerald-50 border border-emerald-200 p-6 rounded-2xl shadow-xs text-emerald-900 flex flex-col sm:flex-row items-center justify-between gap-4 animate-in fade-in zoom-in-95">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-600 text-white rounded-full flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-emerald-900">Suara Anda Berhasil Dicatat!</h3>
                  <p className="text-xs text-emerald-700 mt-0.5">
                    Terima kasih telah berpartisipasi dalam {voteReceipt.sessionTitle}. Suara Anda telah diamankan secara rahasia.
                  </p>
                  <p className="text-xs font-mono font-bold text-emerald-800 mt-2 bg-emerald-100/80 px-2.5 py-1 rounded inline-block">
                    Kode Bukti Suara: {voteReceipt.code} • Waktu: {voteReceipt.time}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setVoteReceipt(null)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl transition-colors shrink-0"
              >
                Selesai / Tutup
              </button>
            </div>
          )}

          {/* Candidates Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {sessionCandidates.length === 0 ? (
              <div className="col-span-full py-16 bg-white rounded-2xl border border-slate-200 text-center">
                <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="text-base font-semibold text-slate-800">Belum Ada Calon Kandidat Terdaftar</h3>
                <p className="text-sm text-slate-500 mt-1">
                  Panitia pemilihan belum mendaftarkan kandidat untuk sesi ini.
                </p>
                {canManage && (
                  <button
                    onClick={handleOpenAddKandidat}
                    className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-xl text-xs font-semibold hover:bg-purple-700"
                  >
                    Tambah Kandidat Pertama
                  </button>
                )}
              </div>
            ) : (
              sessionCandidates.map((kandidat) => {
                const isSelected = selectedCandidateIds.includes(kandidat.id);

                return (
                  <div
                    key={kandidat.id}
                    className={`bg-white rounded-2xl border transition-all relative overflow-hidden flex flex-col justify-between ${
                      isSelected
                        ? 'border-purple-600 shadow-md ring-2 ring-purple-600/20'
                        : 'border-slate-200/80 hover:border-slate-300 shadow-xs'
                    }`}
                  >
                    {/* Number Badge */}
                    <div className="p-5">
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-center gap-2">
                          <span className="w-8 h-8 rounded-lg bg-purple-600 text-white font-black text-sm flex items-center justify-center shadow-xs">
                            #{kandidat.nomorUrut}
                          </span>
                          <span className="px-2 py-0.5 rounded text-xs font-semibold bg-purple-50 text-purple-700">
                            {kandidat.jabatanDicalonkan}
                          </span>
                        </div>

                        <span className="text-xs font-medium text-slate-400">
                          {kandidat.lingkungan || 'Rayon Jemaat'}
                        </span>
                      </div>

                      {/* Photo & Name */}
                      <div className="flex items-center gap-3.5 my-3">
                        <div className="w-16 h-16 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center text-slate-400">
                          {kandidat.fotoUrl ? (
                            <img
                              src={kandidat.fotoUrl}
                              alt={kandidat.namaLengkap}
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <Users className="w-8 h-8 text-slate-300" />
                          )}
                        </div>

                        <div>
                          <h3 className="font-bold text-slate-900 text-base leading-snug">
                            {kandidat.namaLengkap}
                            {kandidat.gelar && <span className="text-xs text-slate-500 font-normal">, {kandidat.gelar}</span>}
                          </h3>
                          <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                            {kandidat.latarBelakang || 'Warga Jemaat GKE'}
                          </p>
                        </div>
                      </div>

                      {/* Visi Misi Snippet */}
                      {kandidat.visiMisi && (
                        <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-600">
                          <p className="font-semibold text-slate-700 text-[11px] mb-0.5 uppercase tracking-wider">
                            Visi & Komitmen:
                          </p>
                          <p className="line-clamp-2 leading-relaxed italic">
                            "{kandidat.visiMisi}"
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Action Select Footer */}
                    <div className="p-4 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between gap-2">
                      <button
                        onClick={() => setPreviewKandidat(kandidat)}
                        className="px-3 py-2 text-xs font-semibold text-slate-600 hover:text-purple-700 hover:bg-purple-50 rounded-xl transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Profil Lengkap</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          if (currentSesiStatus.isEnded) {
                            setIsSesiExpiredModalOpen(true);
                            return;
                          }
                          handleToggleCandidate(kandidat.id);
                        }}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer ${
                          currentSesiStatus.isEnded
                            ? 'bg-slate-100 border border-slate-200 text-slate-400'
                            : isSelected
                            ? 'bg-purple-600 text-white'
                            : 'bg-white border border-slate-200 text-slate-700 hover:bg-purple-50 hover:text-purple-700 hover:border-purple-200'
                        }`}
                        title={currentSesiStatus.isEnded ? 'Sesi pemilihan telah ditutup' : undefined}
                      >
                        {currentSesiStatus.isEnded ? (
                          <>
                            <Lock className="w-4 h-4 text-slate-400" />
                            <span>Voting Ditutup</span>
                          </>
                        ) : isSelected ? (
                          <>
                            <CheckSquare className="w-4 h-4 text-white" />
                            <span>Terpilih</span>
                          </>
                        ) : (
                          <>
                            <Square className="w-4 h-4 text-slate-400" />
                            <span>Pilih Calon</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Voting Submission Panel */}
          {sessionCandidates.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
              <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Konfirmasi Pengiriman Suara E-Voting</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Pastikan identitas pemilih terisi sesuai dengan data jemaat yang sah.
                  </p>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-purple-700 bg-purple-50 px-3 py-1.5 rounded-xl font-semibold">
                  <Lock className="w-3.5 h-3.5" />
                  <span>Enkripsi Suara Dijamin Rahasia</span>
                </div>
              </div>

              {currentSesiStatus.isEnded && (
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-rose-900">
                  <div className="flex items-center gap-2.5">
                    <Lock className="w-5 h-5 text-rose-600 shrink-0" />
                    <div>
                      <h4 className="font-bold text-xs">Bilik Suara Ditutup (Sesi Selesai)</h4>
                      <p className="text-[11px] text-rose-700 mt-0.5">
                        Batas akhir sesi voting ({currentSesi?.tanggalSelesai}) telah berakhir. Sistem mengunci pengumpulan suara.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsSesiExpiredModalOpen(true)}
                    className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shrink-0 cursor-pointer shadow-2xs"
                  >
                    Buka Dialog Status
                  </button>
                </div>
              )}

              {votingError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{votingError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-900 mb-1.5">
                    Nama Lengkap Pemilih <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    disabled={currentSesiStatus.isEnded}
                    list="warga-list-voter"
                    value={voterNameInput || ''}
                    onChange={(e) => setVoterNameInput(e.target.value)}
                    placeholder={currentSesiStatus.isEnded ? 'Sesi telah ditutup...' : 'Ketik nama Anda...'}
                    className="w-full px-3.5 py-2.5 bg-white disabled:bg-slate-100 disabled:text-slate-400 border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 shadow-2xs"
                  />
                  <datalist id="warga-list-voter">
                    {wargaJemaatList.map((w) => (
                      <option key={w.id} value={w.namaLengkap} />
                    ))}
                  </datalist>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-900 mb-1.5">
                    Lingkungan / Rayon
                  </label>
                  <input
                    type="text"
                    disabled={currentSesiStatus.isEnded}
                    value={voterRayonInput || ''}
                    onChange={(e) => setVoterRayonInput(e.target.value)}
                    placeholder="Rayon 1"
                    className="w-full px-3.5 py-2.5 bg-white disabled:bg-slate-100 disabled:text-slate-400 border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 shadow-2xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-900 mb-1.5">
                    No. KJJ / Kartu Jemaat (Opsional)
                  </label>
                  <input
                    type="text"
                    disabled={currentSesiStatus.isEnded}
                    value={voterKjjInput || ''}
                    onChange={(e) => setVoterKjjInput(e.target.value)}
                    placeholder="KJJ-2024-xxx"
                    className="w-full px-3.5 py-2.5 bg-white disabled:bg-slate-100 disabled:text-slate-400 border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 shadow-2xs"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="text-xs text-slate-600">
                  {currentSesiStatus.isEnded ? (
                    <span className="text-rose-600 font-semibold flex items-center gap-1">
                      <Lock className="w-3.5 h-3.5" />
                      Sesi telah selesai pada {currentSesi?.tanggalSelesai}. Tidak dapat mengirim suara voting.
                    </span>
                  ) : selectedCandidateIds.length === 0 ? (
                    <span className="text-amber-600 font-medium">Belum ada kandidat yang dicentang.</span>
                  ) : (
                    <span>
                      Anda telah memilih{' '}
                      <strong className="text-purple-700 font-bold">{selectedCandidateIds.length}</strong> dari{' '}
                      <strong>{currentSesi?.maksimalPilihan || 1}</strong> calon yang diperbolehkan.
                    </span>
                  )}
                </div>

                <button
                  id="btn-submit-vote"
                  onClick={() => {
                    if (currentSesiStatus.isEnded) {
                      setIsSesiExpiredModalOpen(true);
                      return;
                    }
                    handleInitiateVote();
                  }}
                  disabled={isSubmittingVote || (!currentSesiStatus.isEnded && selectedCandidateIds.length === 0)}
                  className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 shadow-xs cursor-pointer ${
                    currentSesiStatus.isEnded
                      ? 'bg-rose-100 text-rose-700 border border-rose-300 hover:bg-rose-200'
                      : selectedCandidateIds.length === 0 || isSubmittingVote
                      ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                      : 'bg-purple-600 hover:bg-purple-700 text-white shadow-purple-600/20'
                  }`}
                >
                  {currentSesiStatus.isEnded ? (
                    <>
                      <Lock className="w-4 h-4 text-rose-700" />
                      <span>Sesi Selesai (Voting Ditutup)</span>
                    </>
                  ) : (
                    <>
                      <Vote className="w-4 h-4" />
                      <span>{isSubmittingVote ? 'Memproses Konfirmasi...' : 'Kirim Suara Pemilihan Sah'}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SUBTAB 2: PENJARINGAN ASPIRASI NOMINASI */}
      {activeSubTab === 'nominasi' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Formulir Usulan Aspirasi */}
          <div className="lg:col-span-1 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs h-fit space-y-4">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                  <UserCheck className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-slate-900 text-base">Usulkan Calon Majelis & Pelayan</h3>
              </div>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Warga jemaat berhak mengusulkan nama calon pelayan yang dipandang memenuhi{' '}
                <button
                  type="button"
                  id="btn-open-syarat-alkitabiah"
                  onClick={() => setIsAyatModalOpen(true)}
                  className="inline-flex items-center gap-1 font-bold text-purple-700 hover:text-purple-900 underline decoration-purple-400 hover:decoration-purple-700 underline-offset-2 transition-colors cursor-pointer"
                  title="Klik untuk membuka isi ayat Alkitab 1 Timotius 3"
                >
                  <BookOpen className="w-3.5 h-3.5 inline text-purple-600 shrink-0" />
                  <span>syarat Alkitabiah (1 Timotius 3)</span>
                </button>
                .
              </p>
            </div>

            {nomSuccessMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>{nomSuccessMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmitNominasi} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-900 mb-1">
                  Nama Tokoh / Calon Yang Diusulkan <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  list="warga-list-nom"
                  value={nomForm.namaCalonDiusulkan || ''}
                  onChange={(e) => setNomForm({ ...nomForm, namaCalonDiusulkan: e.target.value })}
                  placeholder="Ketik nama warga jemaat..."
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 shadow-2xs"
                />
                <datalist id="warga-list-nom">
                  {wargaJemaatList.map((w) => (
                    <option key={w.id} value={w.namaLengkap} />
                  ))}
                </datalist>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-900 mb-1">
                  Jabatan Pelayanan Yang Diusulkan
                </label>
                <select
                  value={nomForm.jabatanDiusulkan || 'Penatua'}
                  onChange={(e) => setNomForm({ ...nomForm, jabatanDiusulkan: e.target.value as any })}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 shadow-2xs cursor-pointer"
                >
                  <option value="Penatua" className="text-slate-900 bg-white">Penatua (Penatua Lingkungan / Jemaat)</option>
                  <option value="Diakon" className="text-slate-900 bg-white">Diakon (Diakon Pelayanan / Kasih)</option>
                  <option value="Ketua Seksi Pelayanan" className="text-slate-900 bg-white">Ketua Seksi Pelayanan Kategorial</option>
                  <option value="Panitia Pembangunan" className="text-slate-900 bg-white">Panitia Pembangunan</option>
                  <option value="Panitia Natal Jemaat/Kategorial" className="text-slate-900 bg-white">Panitia Natal Jemaat/Kategorial</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-900 mb-1">
                  Alasan / Pertimbangan Pengusulan
                </label>
                <textarea
                  rows={3}
                  value={nomForm.alasanUsulan || ''}
                  onChange={(e) => setNomForm({ ...nomForm, alasanUsulan: e.target.value })}
                  placeholder="Ceritakan keteladanan, keaktifan beribadah, atau rekam jejak pelayanannya..."
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 shadow-2xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-900 mb-1">
                    Nama Pengusul
                  </label>
                  <input
                    type="text"
                    required
                    value={nomForm.pengusulNama || ''}
                    onChange={(e) => setNomForm({ ...nomForm, pengusulNama: e.target.value })}
                    placeholder="Nama Anda"
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 shadow-2xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-900 mb-1">
                    Rayon Anda
                  </label>
                  <input
                    type="text"
                    value={nomForm.pengusulRayon || ''}
                    onChange={(e) => setNomForm({ ...nomForm, pengusulRayon: e.target.value })}
                    placeholder="Rayon 1"
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 shadow-2xs"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl transition-colors shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Kirim Aspirasi Nominasi</span>
              </button>
            </form>
          </div>

          {/* Daftar Aspirasi Terkumpul */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden flex flex-col justify-between">
            <div>
              <div className="p-4 border-b border-slate-100 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">
                      Daftar Aspirasi Nominasi Terkumpul ({filteredNominations.length}/{sessionNominations.length})
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Tindak lanjuti usulan jemaat: ubah status verifikasi dan promosikan menjadi Calon Tetap.
                    </p>
                  </div>
                  {canManage && (
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Mode Panitia: Kelola Status & Jadikan Calon</span>
                    </div>
                  )}
                </div>

                {/* Filter and Search Bar */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={aspirasiSearch || ''}
                      onChange={(e) => setAspirasiSearch(e.target.value)}
                      placeholder="Cari nama calon, pengusul, rayon, jabatan..."
                      className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                    />
                    {aspirasiSearch && (
                      <button
                        onClick={() => setAspirasiSearch('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  {/* Status Pills */}
                  <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
                    {(['Semua', 'Menunggu Verifikasi', 'Diproses', 'Disetujui', 'Ditolak'] as const).map((st) => (
                      <button
                        key={st}
                        onClick={() => setAspirasiFilterStatus(st)}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                          aspirasiFilterStatus === st
                            ? 'bg-purple-600 text-white shadow-2xs'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold text-xs">
                      <th className="py-3 px-4">Calon Diusulkan</th>
                      <th className="py-3 px-4">Jabatan</th>
                      <th className="py-3 px-4">Alasan & Rekomendasi</th>
                      <th className="py-3 px-4">Pengusul</th>
                      <th className="py-3 px-4 text-center">Status Verifikasi</th>
                      {canManage && <th className="py-3 px-4 text-right">Aksi Panitia</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {filteredNominations.length === 0 ? (
                      <tr>
                        <td colSpan={canManage ? 6 : 5} className="py-12 text-center text-slate-400">
                          {aspirasiSearch || aspirasiFilterStatus !== 'Semua'
                            ? 'Tidak ada aspirasi nominasi yang cocok dengan filter pencarian.'
                            : 'Belum ada aspirasi nominasi calon yang diajukan pada sesi ini.'}
                        </td>
                      </tr>
                    ) : (
                      filteredNominations.map((nom) => (
                        <tr key={nom.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-3 px-4">
                            <h4 className="font-bold text-slate-900 text-sm">{nom.namaCalonDiusulkan}</h4>
                            <span className="text-[11px] text-slate-400">{nom.waktuUsulan}</span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700">
                              {nom.jabatanDiusulkan}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-xs text-slate-600 max-w-xs">
                            <p className="line-clamp-2">{nom.alasanUsulan || '-'}</p>
                          </td>
                          <td className="py-3 px-4 text-xs text-slate-600">
                            <p className="font-medium text-slate-800">{nom.pengusulNama}</p>
                            <p className="text-slate-400">{nom.pengusulRayon || '-'}</p>
                          </td>
                          <td className="py-3 px-4 text-center">
                            {canManage ? (
                              <select
                                value={nom.statusVerifikasi || 'Menunggu Verifikasi'}
                                onChange={(e) => updateNominasiAspirasi(nom.id, { statusVerifikasi: e.target.value as any })}
                                className={`text-xs font-semibold px-2.5 py-1 rounded-full border cursor-pointer focus:outline-hidden ${
                                  nom.statusVerifikasi === 'Disetujui'
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                                    : nom.statusVerifikasi === 'Diproses'
                                    ? 'bg-sky-50 text-sky-700 border-sky-300'
                                    : nom.statusVerifikasi === 'Ditolak'
                                    ? 'bg-rose-50 text-rose-700 border-rose-300'
                                    : 'bg-amber-50 text-amber-700 border-amber-300'
                                }`}
                                title="Klik untuk mengubah status verifikasi usulan"
                              >
                                <option value="Menunggu Verifikasi" className="bg-white text-slate-800">Menunggu Verifikasi</option>
                                <option value="Diproses" className="bg-white text-slate-800">Diproses</option>
                                <option value="Disetujui" className="bg-white text-slate-800">Disetujui</option>
                                <option value="Ditolak" className="bg-white text-slate-800">Ditolak</option>
                              </select>
                            ) : (
                              <span
                                className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${
                                  nom.statusVerifikasi === 'Disetujui'
                                    ? 'bg-emerald-50 text-emerald-700'
                                    : nom.statusVerifikasi === 'Diproses'
                                    ? 'bg-sky-50 text-sky-700'
                                    : nom.statusVerifikasi === 'Ditolak'
                                    ? 'bg-rose-50 text-rose-700'
                                    : 'bg-amber-50 text-amber-700'
                                }`}
                              >
                                {nom.statusVerifikasi || 'Menunggu Verifikasi'}
                              </span>
                            )}
                          </td>
                          {canManage && (
                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => handlePromoteToCandidate(nom)}
                                  className="px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                                  title="Promosikan usulan ini menjadi Calon Tetap di Bilik Suara"
                                >
                                  <UserPlus className="w-3.5 h-3.5 text-purple-600" />
                                  <span className="hidden sm:inline">Jadikan Calon</span>
                                </button>
                                <button
                                  onClick={() => setDeleteNominasiTarget(nom)}
                                  className="p-1.5 hover:bg-red-50 text-red-600 rounded-lg transition-colors cursor-pointer"
                                  title="Hapus Aspirasi Usulan"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          )}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 3: ADMIN & REKAPITULASI HASIL SUARA */}
      {activeSubTab === 'admin' && canManage && (
        <div className="space-y-6">
          {/* Result Statistics Bar Chart */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h3 className="font-bold text-slate-900 text-lg">
                  Hasil Perhitungan & Rekapitulasi Suara Real-Time
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Sesi Aktif: <strong className="text-slate-800">{currentSesi?.judulPemilihan || 'Pemilihan'}</strong> | Total Suara Terkumpul: <strong className="text-purple-700 font-bold">{totalVotesAccumulated} Suara</strong> ({sessionVotes.length} Pemilih Masuk)
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => openPrintReport({ reportType: 'pemilihan_rekap', sesiId: currentSesi?.id })}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Cetak Laporan Berita Acara Pemilihan"
                >
                  <Printer className="w-3.5 h-3.5 text-slate-600" />
                  <span>Cetak Berita Acara</span>
                </button>

                {currentSesi && (
                  <button
                    onClick={() => setResetSuaraTarget(currentSesi)}
                    className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                    title="Reset seluruh perolehan suara pada sesi ini (bersihkan uji coba)"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-rose-600" />
                    <span>Reset Suara Sesi</span>
                  </button>
                )}

                <button
                  onClick={handleOpenAddKandidat}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah Calon Kandidat</span>
                </button>
              </div>
            </div>

            {/* Candidate Vote Bar Charts */}
            <div className="space-y-4">
              {sessionCandidates.length === 0 ? (
                <p className="text-center py-6 text-xs text-slate-400">
                  Belum ada calon kandidat yang didaftarkan pada sesi ini.
                </p>
              ) : (
                sessionCandidates.map((cand) => {
                  const votes = cand.jumlahSuara || 0;
                  const percentage =
                    totalVotesAccumulated > 0
                      ? Math.round((votes / totalVotesAccumulated) * 100)
                      : 0;

                  return (
                    <div key={cand.id} className="space-y-1.5">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded bg-purple-100 text-purple-700 font-bold text-xs flex items-center justify-center">
                            #{cand.nomorUrut}
                          </span>
                          <strong className="text-slate-800 font-semibold">{cand.namaLengkap}</strong>
                          <span className="text-xs text-slate-400">({cand.jabatanDicalonkan})</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <strong className="text-purple-700 font-bold">{votes} Suara</strong>
                          <span className="text-xs text-slate-500 font-mono">({percentage}%)</span>
                        </div>
                      </div>

                      <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                        <div
                          className="bg-linear-to-r from-purple-600 to-indigo-600 h-full rounded-full transition-all duration-500"
                          style={{ width: `${Math.max(percentage, percentage > 0 ? 3 : 0)}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Manage Candidates Table */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  Daftar Kandidat Terdaftar Sesi Ini ({sessionCandidates.length})
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Daftar calon yang akan tampil di bilik suara warga jemaat.
                </p>
              </div>
              <button
                onClick={handleOpenAddKandidat}
                className="px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-xl text-xs font-semibold flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Calon</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold text-xs">
                    <th className="py-3 px-4">No. & Nama Calon</th>
                    <th className="py-3 px-4">Jabatan & Rayon</th>
                    <th className="py-3 px-4">Latar Belakang & Riwayat</th>
                    <th className="py-3 px-4 text-center">Perolehan Suara</th>
                    <th className="py-3 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {sessionCandidates.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400 text-xs">
                        Belum ada kandidat terdaftar untuk sesi ini.
                      </td>
                    </tr>
                  ) : (
                    sessionCandidates.map((c) => (
                      <tr key={c.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <span className="w-7 h-7 bg-purple-600 text-white rounded font-bold text-xs flex items-center justify-center shrink-0">
                              #{c.nomorUrut}
                            </span>
                            <div>
                              <h4 className="font-bold text-slate-900">{c.namaLengkap}</h4>
                              {c.gelar && <p className="text-xs text-slate-400">{c.gelar}</p>}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <p className="font-medium text-slate-800">{c.jabatanDicalonkan}</p>
                          <p className="text-xs text-slate-500">{c.lingkungan || '-'}</p>
                        </td>
                        <td className="py-3 px-4 text-xs text-slate-600 max-w-sm">
                          <p className="line-clamp-1">{c.latarBelakang || '-'}</p>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="font-bold text-purple-700 text-base">{c.jumlahSuara || 0}</span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleOpenEditKandidat(c)}
                              className="p-1.5 hover:bg-slate-100 text-slate-600 rounded-lg transition-colors cursor-pointer"
                              title="Edit Kandidat"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setDeleteKandidatTarget(c)}
                              className="p-1.5 hover:bg-red-50 text-red-600 rounded-lg transition-colors cursor-pointer"
                              title="Hapus Kandidat"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Sesi Pemilihan Management Section */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  Kelola Master Sesi Pemilihan ({sesiPemilihanList.length})
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Buka sesi baru, ubah status pelaksanaan, reset simulasi suara, atau hapus sesi yang tidak digunakan.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsManageSesiModalOpen(true)}
                  className="px-3.5 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 border border-purple-200 cursor-pointer shadow-2xs"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Tampilan Panel Sesi</span>
                </button>
                <button
                  onClick={handleOpenAddSesi}
                  className="px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Buka Sesi Baru</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold text-xs">
                    <th className="py-3 px-4">Nama Sesi & Periode</th>
                    <th className="py-3 px-4">Jadwal & Batas</th>
                    <th className="py-3 px-4 text-center">Statistik Sesi</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Aksi & Pengelolaan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {sesiPemilihanList.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400 text-xs">
                        Belum ada sesi pemilihan yang terdaftar.
                      </td>
                    </tr>
                  ) : (
                    sesiPemilihanList.map((sesi) => {
                      const countCalon = kandidatPemilihanList.filter((k) => k.sesiId === sesi.id).length;
                      const countSuara = suaraVotingList.filter((v) => v.sesiId === sesi.id).length;
                      const countAspirasi = nominasiAspirasiList.filter((n) => n.sesiId === sesi.id).length;
                      const isCurrent = sesi.id === currentSesi?.id;

                      return (
                        <tr
                          key={sesi.id}
                          className={`hover:bg-slate-50/60 transition-colors ${
                            isCurrent ? 'bg-purple-50/30' : ''
                          }`}
                        >
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-slate-900 text-sm">{sesi.judulPemilihan}</h4>
                              {isCurrent && (
                                <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-purple-600 text-white shrink-0">
                                  Aktif Dipilih
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                              <span>Periode: <strong className="text-slate-700">{sesi.periode}</strong></span>
                              <span>•</span>
                              <span>Maks: <strong className="text-slate-700">{sesi.maksimalPilihan} Calon</strong></span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-xs text-slate-600">
                            <p className="font-medium text-slate-800">{sesi.tanggalMulai} s/d {sesi.tanggalSelesai}</p>
                            <p className="text-[11px] text-slate-400 mt-0.5">{sesi.jenisSesi}</p>
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <div className="inline-flex items-center gap-2 text-xs">
                              <span className="bg-purple-50 text-purple-700 font-bold px-2 py-0.5 rounded-md border border-purple-100" title="Jumlah Calon Kandidat">
                                {countCalon} Calon
                              </span>
                              <span className="bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded-md border border-emerald-100" title="Jumlah Pemilih Memberikan Suara">
                                {countSuara} Suara
                              </span>
                              <span className="bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded-md border border-slate-200" title="Jumlah Usulan Aspirasi">
                                {countAspirasi} Usulan
                              </span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <select
                              value={sesi.status || 'Aktif'}
                              onChange={(e) => updateSesiPemilihan(sesi.id, { status: e.target.value as any })}
                              className={`text-xs font-bold px-2.5 py-1 rounded-full border border-slate-200 bg-white cursor-pointer focus:ring-2 focus:ring-purple-500/20 ${
                                sesi.status === 'Aktif'
                                  ? 'text-emerald-700 border-emerald-200 bg-emerald-50/50'
                                  : sesi.status === 'Persiapan'
                                  ? 'text-amber-700 border-amber-200 bg-amber-50/50'
                                  : sesi.status === 'Ditutup'
                                  ? 'text-rose-700 border-rose-200 bg-rose-50/50'
                                  : 'text-slate-600 border-slate-200 bg-slate-50'
                              }`}
                            >
                              <option value="Aktif">Aktif</option>
                              <option value="Persiapan">Persiapan</option>
                              <option value="Selesai">Selesai</option>
                              <option value="Ditutup">Ditutup</option>
                            </select>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1 flex-wrap">
                              {!isCurrent && (
                                <button
                                  onClick={() => setSelectedSesiId(sesi.id)}
                                  className="px-2.5 py-1 text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors cursor-pointer border border-purple-200"
                                >
                                  Pilih Sesi
                                </button>
                              )}
                              <button
                                onClick={() => openPrintReport({ reportType: 'pemilihan_rekap', sesiId: sesi.id })}
                                className="p-1.5 hover:bg-slate-100 text-slate-600 rounded-lg transition-colors cursor-pointer border border-slate-200"
                                title="Cetak Rekapitulasi Sesi Ini"
                              >
                                <Printer className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleOpenEditSesi(sesi)}
                                className="p-1.5 hover:bg-slate-100 text-slate-600 rounded-lg transition-colors cursor-pointer border border-slate-200"
                                title="Edit Data Sesi"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setResetSuaraTarget(sesi)}
                                className="p-1.5 hover:bg-amber-50 text-amber-600 rounded-lg transition-colors cursor-pointer border border-amber-200"
                                title="Reset Suara Sesi (Uji Coba)"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setDeleteSesiTarget(sesi)}
                                className="p-1.5 hover:bg-rose-50 text-rose-600 rounded-lg transition-colors cursor-pointer border border-rose-200"
                                title="Hapus Sesi & Seluruh Data Terkait"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: PREVIEW KANDIDAT DETAIL */}
      {previewKandidat && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded bg-purple-600 text-white font-black text-xs flex items-center justify-center">
                  #{previewKandidat.nomorUrut}
                </span>
                <span className="text-xs font-bold text-purple-700 bg-purple-50 px-2.5 py-1 rounded">
                  {previewKandidat.jabatanDicalonkan}
                </span>
              </div>
              <button
                onClick={() => setPreviewKandidat(null)}
                className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-2xl bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center text-slate-400">
                  {previewKandidat.fotoUrl ? (
                    <img
                      src={previewKandidat.fotoUrl}
                      alt={previewKandidat.namaLengkap}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <Users className="w-10 h-10 text-slate-300" />
                  )}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">
                    {previewKandidat.namaLengkap}
                    {previewKandidat.gelar && <span className="text-sm font-normal text-slate-500">, {previewKandidat.gelar}</span>}
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Lingkungan: <strong>{previewKandidat.lingkungan || 'Rayon Jemaat'}</strong>
                  </p>
                </div>
              </div>

              {previewKandidat.latarBelakang && (
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Latar Belakang & Profesi
                  </h4>
                  <p className="text-sm text-slate-700 leading-relaxed">
                    {previewKandidat.latarBelakang}
                  </p>
                </div>
              )}

              {previewKandidat.visiMisi && (
                <div className="p-4 bg-purple-50/50 rounded-xl border border-purple-100">
                  <h4 className="text-xs font-bold text-purple-700 uppercase tracking-wider mb-1">
                    Visi, Misi & Komitmen Pelayanan
                  </h4>
                  <p className="text-sm text-slate-800 leading-relaxed italic">
                    "{previewKandidat.visiMisi}"
                  </p>
                </div>
              )}

              {previewKandidat.riwayatPelayanan && (
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Pengalaman & Riwayat Pelayanan di Gereja
                  </h4>
                  <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                    {previewKandidat.riwayatPelayanan}
                  </p>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-end">
              <button
                onClick={() => setPreviewKandidat(null)}
                className="px-5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-medium rounded-xl"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: TAMBAH / EDIT SESI PEMILIHAN */}
      {isSesiModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-lg">
                {editingSesi ? 'Edit Sesi Pemilihan' : 'Buka Sesi Pemilihan Baru'}
              </h3>
              <button
                onClick={() => setIsSesiModalOpen(false)}
                className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSesi} className="p-6 overflow-y-auto space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-900 mb-1.5">
                  Judul Sesi Pemilihan <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={sesiForm.judulPemilihan || ''}
                  onChange={(e) => setSesiForm({ ...sesiForm, judulPemilihan: e.target.value })}
                  placeholder="Contoh: Pemilihan Calon Penatua & Diakon"
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 shadow-2xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-900 mb-1.5">
                    Periode Pelayanan
                  </label>
                  <input
                    type="text"
                    value={sesiForm.periode || ''}
                    onChange={(e) => setSesiForm({ ...sesiForm, periode: e.target.value })}
                    placeholder="2026-2031"
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 shadow-2xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-900 mb-1.5">
                    Maksimal Pilihan / Suara
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={sesiForm.maksimalPilihan ?? 1}
                    onChange={(e) => setSesiForm({ ...sesiForm, maksimalPilihan: parseInt(e.target.value) || 1 })}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 shadow-2xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-900 mb-1.5">
                    Tanggal Mulai
                  </label>
                  <input
                    type="date"
                    required
                    value={sesiForm.tanggalMulai || ''}
                    onChange={(e) => setSesiForm({ ...sesiForm, tanggalMulai: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 shadow-2xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-900 mb-1.5">
                    Tanggal Selesai
                  </label>
                  <input
                    type="date"
                    required
                    value={sesiForm.tanggalSelesai || ''}
                    onChange={(e) => setSesiForm({ ...sesiForm, tanggalSelesai: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 shadow-2xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-900 mb-1.5">
                  Status Sesi
                </label>
                <select
                  value={sesiForm.status || 'Aktif'}
                  onChange={(e) => setSesiForm({ ...sesiForm, status: e.target.value as any })}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 shadow-2xs"
                >
                  <option value="Aktif" className="text-slate-900 bg-white">Aktif (Sedang Berjalan)</option>
                  <option value="Draft" className="text-slate-900 bg-white">Draft (Persiapan)</option>
                  <option value="Selesai" className="text-slate-900 bg-white">Selesai (Ditutup)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-900 mb-1.5">
                  Petunjuk & Tata Tertib Pemilihan
                </label>
                <textarea
                  rows={3}
                  value={sesiForm.deskripsiTataTertib || ''}
                  onChange={(e) => setSesiForm({ ...sesiForm, deskripsiTataTertib: e.target.value })}
                  placeholder="Keterangan tata tertib pemilihan bagi jemaat..."
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 shadow-2xs"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsSesiModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-xl transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-xs cursor-pointer"
                >
                  {editingSesi ? 'Simpan Perubahan' : 'Buat Sesi Pemilihan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: TAMBAH / EDIT KANDIDAT */}
      {isKandidatModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-lg">
                {editingKandidat ? 'Edit Data Calon Kandidat' : 'Tambah Calon Kandidat Baru'}
              </h3>
              <button
                onClick={() => setIsKandidatModalOpen(false)}
                className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveKandidat} className="p-6 overflow-y-auto space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-900 mb-1.5">
                    Nomor Urut <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={kandidatForm.nomorUrut ?? 1}
                    onChange={(e) => setKandidatForm({ ...kandidatForm, nomorUrut: parseInt(e.target.value) || 1 })}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 shadow-2xs"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-900 mb-1.5">
                    Nama Lengkap Calon <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={kandidatForm.namaLengkap || ''}
                    onChange={(e) => setKandidatForm({ ...kandidatForm, namaLengkap: e.target.value })}
                    placeholder="Nama Calon"
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 shadow-2xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-900 mb-1.5">
                    Gelar Akademik (Opsional)
                  </label>
                  <input
                    type="text"
                    value={kandidatForm.gelar || ''}
                    onChange={(e) => setKandidatForm({ ...kandidatForm, gelar: e.target.value })}
                    placeholder="S.E., M.M."
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 shadow-2xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-900 mb-1.5">
                    Jabatan Yang Dicalonkan
                  </label>
                  <input
                    type="text"
                    list="jabatan-dicalonkan-options"
                    value={kandidatForm.jabatanDicalonkan || 'Penatua'}
                    onChange={(e) => setKandidatForm({ ...kandidatForm, jabatanDicalonkan: e.target.value })}
                    placeholder="Pilih atau ketik jabatan..."
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 shadow-2xs"
                  />
                  <datalist id="jabatan-dicalonkan-options">
                    <option value="Penatua" />
                    <option value="Diakon" />
                    <option value="Ketua Seksi Pelayanan" />
                    <option value="Panitia Pembangunan" />
                    <option value="Panitia Natal Jemaat/Kategorial" />
                  </datalist>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-900 mb-1.5">
                    Lingkungan / Rayon
                  </label>
                  <input
                    type="text"
                    value={kandidatForm.lingkungan || ''}
                    onChange={(e) => setKandidatForm({ ...kandidatForm, lingkungan: e.target.value })}
                    placeholder="Rayon 1"
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 shadow-2xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-900 mb-1.5">
                    URL Foto Calon (Opsional)
                  </label>
                  <input
                    type="url"
                    value={kandidatForm.fotoUrl || ''}
                    onChange={(e) => setKandidatForm({ ...kandidatForm, fotoUrl: e.target.value })}
                    placeholder="https://..."
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 shadow-2xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-900 mb-1.5">
                  Latar Belakang / Profesi
                </label>
                <input
                  type="text"
                  value={kandidatForm.latarBelakang || ''}
                  onChange={(e) => setKandidatForm({ ...kandidatForm, latarBelakang: e.target.value })}
                  placeholder="Guru / Wiraswasta / PNS"
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 shadow-2xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-900 mb-1.5">
                  Visi & Komitmen Pelayanan
                </label>
                <textarea
                  rows={2}
                  value={kandidatForm.visiMisi || ''}
                  onChange={(e) => setKandidatForm({ ...kandidatForm, visiMisi: e.target.value })}
                  placeholder="Visi atau komitmen rohani calon..."
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 shadow-2xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-900 mb-1.5">
                  Riwayat Pelayanan di Gereja
                </label>
                <textarea
                  rows={2}
                  value={kandidatForm.riwayatPelayanan || ''}
                  onChange={(e) => setKandidatForm({ ...kandidatForm, riwayatPelayanan: e.target.value })}
                  placeholder="Pengurus SPB 2018-2022, Guru Sekolah Minggu..."
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 shadow-2xs"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsKandidatModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-xl transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-xs cursor-pointer"
                >
                  {editingKandidat ? 'Simpan Perubahan' : 'Tambahkan Kandidat'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: KONFIRMASI INPUT SUARA E-VOTING */}
      {isVoteConfirmModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
            {/* Header */}
            <div className="p-5 bg-gradient-to-r from-purple-700 to-indigo-700 text-white flex items-center justify-between modal-dark-header">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center">
                  <Vote className="w-5 h-5 text-white" style={{ color: '#ffffff' }} />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white" style={{ color: '#ffffff', WebkitTextFillColor: '#ffffff' }}>Konfirmasi Pilihan Suara</h3>
                  <p className="text-xs text-purple-100" style={{ color: '#f3e8ff', WebkitTextFillColor: '#f3e8ff' }}>Layanan E-Voting Pemilihan Sah</p>
                </div>
              </div>
              <button
                onClick={() => setIsVoteConfirmModalOpen(false)}
                disabled={isSubmittingVote}
                className="p-1 hover:bg-white/20 rounded-lg text-white transition-colors cursor-pointer"
                style={{ color: '#ffffff' }}
              >
                <X className="w-5 h-5 text-white" style={{ color: '#ffffff' }} />
              </button>
            </div>

            {/* Body Content */}
            <div className="p-5 space-y-4 text-xs">
              <div className="p-3 bg-purple-50 rounded-xl border border-purple-100 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Sesi Pemilihan:</span>
                  <span className="font-bold text-purple-900">{currentSesi?.judulPemilihan}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Nama Pemilih:</span>
                  <span className="font-bold text-slate-800">{voterNameInput} ({voterRayonInput})</span>
                </div>
              </div>

              <div>
                <p className="font-bold text-slate-900 mb-2">
                  Kandidat Pilihan Anda ({selectedCandidateIds.length} calon terpilih):
                </p>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {sessionCandidates
                    .filter((c) => selectedCandidateIds.includes(c.id))
                    .map((c) => (
                      <div
                        key={c.id}
                        className="flex items-center gap-3 p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                      >
                        <span className="w-7 h-7 rounded-lg bg-purple-600 text-white font-black text-xs flex items-center justify-center shrink-0">
                          #{c.nomorUrut}
                        </span>
                        <div className="min-w-0 flex-1">
                          <h4 className="font-bold text-slate-900 truncate">{c.namaLengkap}</h4>
                          <p className="text-[11px] text-slate-500">{c.jabatanDicalonkan} • {c.lingkungan || 'Rayon Jemaat'}</p>
                        </div>
                        <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                      </div>
                    ))}
                </div>
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-[11px] flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
                <p>
                  Pilihan Anda bersifat <strong>Langsung, Umum, Bebas, dan Rahasia</strong>. Setelah dikonfirmasi, suara akan disimpan secara permanen dan tidak dapat diubah kembali.
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsVoteConfirmModalOpen(false)}
                disabled={isSubmittingVote}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
              >
                Periksa Kembali
              </button>
              <button
                type="button"
                onClick={handleConfirmCastVote}
                disabled={isSubmittingVote}
                className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Vote className="w-3.5 h-3.5" />
                <span>{isSubmittingVote ? 'Menyimpan Suara...' : 'Ya, Kirimkan Suara'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal: Hapus Sesi */}
      {deleteSesiTarget && (
        <DeleteConfirmModal
          isOpen={!!deleteSesiTarget}
          title="Konfirmasi Hapus Sesi Pemilihan"
          itemName={deleteSesiTarget.judulPemilihan}
          description={`Apakah Anda yakin ingin menghapus sesi pemilihan "${deleteSesiTarget.judulPemilihan}" (Periode: ${deleteSesiTarget.periode})? Seluruh data kandidat (${kandidatPemilihanList.filter(k => k.sesiId === deleteSesiTarget.id).length} orang), suara (${suaraVotingList.filter(v => v.sesiId === deleteSesiTarget.id).length} suara), dan usulan aspirasi yang terhubung akan ikut terhapus secara permanen.`}
          onConfirm={async () => {
            const targetId = deleteSesiTarget.id;
            await deleteSesiPemilihan(targetId);
            if (selectedSesiId === targetId) {
              const remaining = sesiPemilihanList.filter((s) => s.id !== targetId);
              setSelectedSesiId(remaining[0]?.id || '');
            }
            setDeleteSesiTarget(null);
          }}
          onClose={() => setDeleteSesiTarget(null)}
        />
      )}

      {/* MODAL: KELOLA SEMUA SESI PEMILIHAN */}
      {isManageSesiModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-lg">
                    Kelola Master Sesi Pemilihan
                  </h3>
                  <p className="text-xs text-slate-500">
                    Total {sesiPemilihanList.length} sesi terdaftar dalam sistem pemilihan jemaat
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsManageSesiModalOpen(false);
                    handleOpenAddSesi();
                  }}
                  className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Sesi Baru</span>
                </button>
                <button
                  onClick={() => setIsManageSesiModalOpen(false)}
                  className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-5 overflow-y-auto space-y-3.5 divide-y divide-slate-100">
              {sesiPemilihanList.length === 0 ? (
                <div className="py-12 text-center text-slate-500 space-y-3">
                  <Vote className="w-12 h-12 text-slate-300 mx-auto" />
                  <p className="text-sm font-medium">Belum ada sesi pemilihan yang terdaftar.</p>
                  <button
                    type="button"
                    onClick={() => {
                      setIsManageSesiModalOpen(false);
                      handleOpenAddSesi();
                    }}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Buka Sesi Pemilihan Pertama</span>
                  </button>
                </div>
              ) : (
                sesiPemilihanList.map((sesi) => {
                  const countCalon = kandidatPemilihanList.filter((k) => k.sesiId === sesi.id).length;
                  const countSuara = suaraVotingList.filter((v) => v.sesiId === sesi.id).length;
                  const countAspirasi = nominasiAspirasiList.filter((n) => n.sesiId === sesi.id).length;
                  const isCurrent = sesi.id === currentSesi?.id;

                  return (
                    <div
                      key={sesi.id}
                      className={`pt-3.5 first:pt-0 p-4 rounded-xl border transition-all ${
                        isCurrent
                          ? 'border-purple-300 bg-purple-50/40 shadow-xs ring-1 ring-purple-200'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-bold text-slate-900 text-base">{sesi.judulPemilihan}</h4>
                            {isCurrent && (
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-purple-600 text-white">
                                Sesi Aktif Saat Ini
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-3 text-xs text-slate-600 mt-1 flex-wrap">
                            <span>Periode: <strong>{sesi.periode}</strong></span>
                            <span>•</span>
                            <span>Jenis: <strong>{sesi.jenisSesi}</strong></span>
                            <span>•</span>
                            <span>Jadwal: <strong>{sesi.tanggalMulai} s/d {sesi.tanggalSelesai}</strong></span>
                            <span>•</span>
                            <span>Maks Pilihan: <strong>{sesi.maksimalPilihan} Calon</strong></span>
                          </div>

                          <div className="flex items-center gap-2 mt-2.5 flex-wrap">
                            <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-purple-100/70 text-purple-800 border border-purple-200/60">
                              👥 {countCalon} Calon Terdaftar
                            </span>
                            <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-100/70 text-emerald-800 border border-emerald-200/60">
                              🗳️ {countSuara} Suara Masuk
                            </span>
                            <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
                              💡 {countAspirasi} Usulan Aspirasi
                            </span>
                          </div>
                        </div>

                        {/* Status Switcher & Actions */}
                        <div className="flex flex-col sm:items-end gap-2 shrink-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs text-slate-500 font-medium">Status:</span>
                            <select
                              value={sesi.status || 'Aktif'}
                              onChange={(e) => updateSesiPemilihan(sesi.id, { status: e.target.value as any })}
                              className={`text-xs font-bold px-2.5 py-1 rounded-lg border cursor-pointer focus:ring-2 focus:ring-purple-500/20 ${
                                sesi.status === 'Aktif'
                                  ? 'text-emerald-700 border-emerald-300 bg-emerald-50'
                                  : sesi.status === 'Persiapan'
                                  ? 'text-amber-700 border-amber-300 bg-amber-50'
                                  : sesi.status === 'Ditutup'
                                  ? 'text-rose-700 border-rose-300 bg-rose-50'
                                  : 'text-slate-700 border-slate-300 bg-slate-50'
                              }`}
                            >
                              <option value="Aktif">Aktif</option>
                              <option value="Persiapan">Persiapan</option>
                              <option value="Selesai">Selesai</option>
                              <option value="Ditutup">Ditutup</option>
                            </select>
                          </div>

                          <div className="flex items-center gap-1.5 flex-wrap">
                            {!isCurrent ? (
                              <button
                                type="button"
                                onClick={() => setSelectedSesiId(sesi.id)}
                                className="px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                              >
                                Pilih Sesi
                              </button>
                            ) : (
                              <span className="px-2.5 py-1 text-xs font-semibold text-purple-700 flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5 text-purple-600" />
                                Terpilih
                              </span>
                            )}

                            <button
                              type="button"
                              onClick={() => {
                                openPrintReport({ reportType: 'pemilihan_rekap', sesiId: sesi.id });
                              }}
                              className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors cursor-pointer border border-slate-200"
                              title="Cetak Hasil Rekapitulasi Sesi Ini"
                            >
                              <Printer className="w-4 h-4" />
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setIsManageSesiModalOpen(false);
                                handleOpenEditSesi(sesi);
                              }}
                              className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors cursor-pointer border border-slate-200"
                              title="Edit Detail Sesi"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>

                            <button
                              type="button"
                              onClick={() => setResetSuaraTarget(sesi)}
                              className="p-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg transition-colors cursor-pointer border border-amber-200"
                              title="Reset Seluruh Suara Masuk (Simulasi / Uji Coba)"
                            >
                              <RotateCcw className="w-4 h-4" />
                            </button>

                            <button
                              type="button"
                              onClick={() => setDeleteSesiTarget(sesi)}
                              className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition-colors cursor-pointer border border-rose-200"
                              title="Hapus Sesi Pemilihan Ini Permanen"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  setIsManageSesiModalOpen(false);
                  handleOpenAddSesi();
                }}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Buka Sesi Pemilihan Baru</span>
              </button>
              <button
                type="button"
                onClick={() => setIsManageSesiModalOpen(false)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-medium rounded-xl cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal: Hapus Calon Kandidat */}
      {deleteKandidatTarget && (
        <DeleteConfirmModal
          isOpen={!!deleteKandidatTarget}
          title="Konfirmasi Hapus Calon Kandidat"
          itemName={`#${deleteKandidatTarget.nomorUrut} ${deleteKandidatTarget.namaLengkap} (${deleteKandidatTarget.jabatanDicalonkan})`}
          description={`Apakah Anda yakin ingin menghapus calon kandidat ini dari daftar pemilihan resmi?`}
          onConfirm={async () => {
            await deleteKandidatPemilihan(deleteKandidatTarget.id);
            setDeleteKandidatTarget(null);
          }}
          onClose={() => setDeleteKandidatTarget(null)}
        />
      )}

      {/* Confirmation Modal: Hapus Usulan Aspirasi */}
      {deleteNominasiTarget && (
        <DeleteConfirmModal
          isOpen={!!deleteNominasiTarget}
          title="Konfirmasi Hapus Usulan Aspirasi"
          itemName={`${deleteNominasiTarget.namaCalonDiusulkan} (${deleteNominasiTarget.jabatanDiusulkan})`}
          description={`Apakah Anda yakin ingin menghapus usulan dari ${deleteNominasiTarget.pengusulNama} ini dari meja penjaringan panitia?`}
          onConfirm={async () => {
            await deleteNominasiAspirasi(deleteNominasiTarget.id);
            setDeleteNominasiTarget(null);
          }}
          onClose={() => setDeleteNominasiTarget(null)}
        />
      )}

      {/* Confirmation Modal: Reset Suara Sesi E-Voting */}
      {resetSuaraTarget && (
        <DeleteConfirmModal
          isOpen={!!resetSuaraTarget}
          title="Konfirmasi Reset Perolehan Suara Sesi"
          itemName={`Reset Suara: ${resetSuaraTarget.judulPemilihan}`}
          description={`PERINGATAN: Anda akan menghapus seluruh data suara (${sessionVotes.length} pemilih masuk) dan mengembalikan perolehan suara semua kandidat menjadi 0. Tindakan ini tidak dapat dibatalkan dan biasa digunakan setelah sesi uji coba / simulasi.`}
          onConfirm={async () => {
            await resetSuaraVotingSesi(resetSuaraTarget.id);
            setResetSuaraTarget(null);
          }}
          onClose={() => setResetSuaraTarget(null)}
        />
      )}

      {/* POPUP DIALOG: SYARAT ALKITABIAH (1 TIMOTIUS 3) */}
      {isAyatModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-3xl max-h-[90vh] rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Header Dialog */}
            <div className="px-5 sm:px-6 py-4 border-b border-slate-200 bg-linear-to-r from-purple-50 via-indigo-50 to-purple-50 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-xs shrink-0">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-slate-900 text-base sm:text-lg">
                      Syarat Alkitabiah Pelayan Jemaat
                    </h3>
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-100 text-purple-700 border border-purple-200">
                      1 Timotius 3:1–16
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Alkitab Terjemahan Baru (TB-LAI) • Dasar Rohani Penatua, Diakon & Panitia Pelayanan GKE
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleCopyAyat}
                  className="px-3 py-1.5 rounded-lg bg-white/90 hover:bg-white text-slate-700 hover:text-purple-700 border border-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
                  title="Salin seluruh isi firman Tuhan 1 Timotius 3 ke papan klip"
                >
                  {copiedAyat ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700 font-bold">Tersalin!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-500" />
                      <span className="hidden sm:inline">Salin Teks</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setIsAyatModalOpen(false)}
                  className="w-8 h-8 rounded-lg bg-white/90 hover:bg-white text-slate-500 hover:text-slate-700 border border-slate-200 flex items-center justify-center transition-colors shadow-2xs cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Content Body */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-6 text-sm text-slate-800">
              {/* 4 Pilar Kualifikasi Ringkas */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl bg-purple-50/70 border border-purple-100">
                  <div className="flex items-center gap-2 text-purple-900 font-bold text-xs mb-1">
                    <ShieldCheck className="w-4 h-4 text-purple-600 shrink-0" />
                    <span>1. Karakter Pribadi & Akhlak</span>
                  </div>
                  <p className="text-xs text-purple-950/80 leading-relaxed">
                    Tak bercela, dapat menahan diri, bijaksana, sopan, bukan pemarah/peminum, melainkan peramah, pendamai, dan bukan hamba uang.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-indigo-50/70 border border-indigo-100">
                  <div className="flex items-center gap-2 text-indigo-900 font-bold text-xs mb-1">
                    <Users className="w-4 h-4 text-indigo-600 shrink-0" />
                    <span>2. Keteladanan Rumah Tangga</span>
                  </div>
                  <p className="text-xs text-indigo-950/80 leading-relaxed">
                    Setia pada pasangan (suami/istri teladan), kepala keluarga yang baik, disegani, dan dihormati oleh anak-anaknya.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-100">
                  <div className="flex items-center gap-2 text-amber-900 font-bold text-xs mb-1">
                    <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>3. Kematangan Iman & Pengajaran</span>
                  </div>
                  <p className="text-xs text-amber-950/80 leading-relaxed">
                    Memelihara rahasia iman dalam hati nurani yang murni, cakap mengajar, bukan petobat baru (menghindari jerat kesombongan).
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-100">
                  <div className="flex items-center gap-2 text-emerald-900 font-bold text-xs mb-1">
                    <Award className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>4. Reputasi Sosial & Rekam Jejak</span>
                  </div>
                  <p className="text-xs text-emerald-950/80 leading-relaxed">
                    Mempunyai nama baik di luar jemaat (di tengah masyarakat), teruji rekam jejak pelayanannya, dan dapat dipercaya dalam segala hal.
                  </p>
                </div>
              </div>

              {/* Bagian 1: Syarat-syarat penilik jemaat */}
              <div className="bg-slate-50/90 rounded-xl p-4 sm:p-5 border border-slate-200/80 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-purple-600 shrink-0" />
                    <h4 className="font-bold text-slate-900 text-sm sm:text-base">
                      Syarat-Syarat Penilik Jemaat (Penatua)
                    </h4>
                  </div>
                  <span className="text-xs font-semibold text-purple-700 bg-purple-100 px-2.5 py-0.5 rounded-md">
                    1 Timotius 3:1–7
                  </span>
                </div>

                <div className="space-y-2.5 text-xs sm:text-sm text-slate-700 leading-relaxed">
                  <p>
                    <sup className="font-bold text-purple-700 mr-1.5 text-xs">1</sup>
                    Benarlah perkataan ini: <span className="font-medium text-slate-900">"Jikalau seorang menghendaki jabatan penilik jemaat, ia menginginkan pekerjaan yang indah."</span>
                  </p>
                  <p>
                    <sup className="font-bold text-purple-700 mr-1.5 text-xs">2</sup>
                    Karena itu penilik jemaat haruslah <strong className="text-slate-900">seorang yang tak bercela</strong>, suami dari satu isteri, dapat menahan diri, bijaksana, sopan, suka memberi tumpangan, cakap mengajar orang,
                  </p>
                  <p>
                    <sup className="font-bold text-purple-700 mr-1.5 text-xs">3</sup>
                    bukan peminum, bukan pemarah melainkan peramah, pendamai, <strong className="text-slate-900">bukan hamba uang</strong>,
                  </p>
                  <p>
                    <sup className="font-bold text-purple-700 mr-1.5 text-xs">4</sup>
                    seorang kepala keluarga yang baik, disegani dan dihormati oleh anak-anaknya.
                  </p>
                  <p>
                    <sup className="font-bold text-purple-700 mr-1.5 text-xs">5</sup>
                    Jikalau seorang tidak tahu mengepalai keluarganya sendiri, bagaimanakah ia dapat mengurus Jemaat Allah?
                  </p>
                  <p>
                    <sup className="font-bold text-purple-700 mr-1.5 text-xs">6</sup>
                    Janganlah ia seorang yang baru bertobat, agar jangan ia menjadi sombong dan kena hukuman Iblis.
                  </p>
                  <p>
                    <sup className="font-bold text-purple-700 mr-1.5 text-xs">7</sup>
                    Hendaklah ia juga <strong className="text-slate-900">mempunyai nama baik di luar jemaat</strong>, agar jangan ia digugat orang dan jatuh ke dalam jerat Iblis.
                  </p>
                </div>
              </div>

              {/* Bagian 2: Syarat-syarat diakon */}
              <div className="bg-slate-50/90 rounded-xl p-4 sm:p-5 border border-slate-200/80 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 shrink-0" />
                    <h4 className="font-bold text-slate-900 text-sm sm:text-base">
                      Syarat-Syarat Diakon (Pelayan Meja & Kasih)
                    </h4>
                  </div>
                  <span className="text-xs font-semibold text-indigo-700 bg-indigo-100 px-2.5 py-0.5 rounded-md">
                    1 Timotius 3:8–13
                  </span>
                </div>

                <div className="space-y-2.5 text-xs sm:text-sm text-slate-700 leading-relaxed">
                  <p>
                    <sup className="font-bold text-indigo-700 mr-1.5 text-xs">8</sup>
                    Demikian juga diakon-diakon haruslah <strong className="text-slate-900">orang terhormat</strong>, jangan bercabang lidah, jangan penggemar anggur, jangan serakah,
                  </p>
                  <p>
                    <sup className="font-bold text-indigo-700 mr-1.5 text-xs">9</sup>
                    melainkan orang yang memelihara <strong className="text-slate-900">rahasia iman dalam hati nurani yang murni</strong>.
                  </p>
                  <p>
                    <sup className="font-bold text-indigo-700 mr-1.5 text-xs">10</sup>
                    <strong className="text-slate-900">Mereka juga harus diuji dahulu</strong>, baru ditetapkan dalam pelayanan itu setelah ternyata mereka tak bercela.
                  </p>
                  <p>
                    <sup className="font-bold text-indigo-700 mr-1.5 text-xs">11</sup>
                    Demikian pula isteri-isteri hendaklah orang terhormat, jangan pemfitnah, hendaklah dapat menahan diri dan dapat dipercaya dalam segala hal.
                  </p>
                  <p>
                    <sup className="font-bold text-indigo-700 mr-1.5 text-xs">12</sup>
                    Diakon haruslah suami dari satu isteri dan mengurus anak-anaknya dan keluarganya dengan baik.
                  </p>
                  <p>
                    <sup className="font-bold text-indigo-700 mr-1.5 text-xs">13</sup>
                    Karena mereka yang melayani dengan baik beroleh kedudukan yang baik sehingga dalam iman kepada Kristus Yesus mereka dapat bersaksi dengan leluasa.
                  </p>
                </div>
              </div>

              {/* Bagian 3: Dasar jemaat & rahasia ibadah */}
              <div className="bg-slate-50/90 rounded-xl p-4 sm:p-5 border border-slate-200/80 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 shrink-0" />
                    <h4 className="font-bold text-slate-900 text-sm sm:text-base">
                      Dasar Jemaat & Rahasia Ibadah
                    </h4>
                  </div>
                  <span className="text-xs font-semibold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-md">
                    1 Timotius 3:14–16
                  </span>
                </div>

                <div className="space-y-2.5 text-xs sm:text-sm text-slate-700 leading-relaxed">
                  <p>
                    <sup className="font-bold text-emerald-700 mr-1.5 text-xs">14</sup>
                    Semuanya itu kutuliskan kepadamu, walaupun kuharap segera dapat mengunjungi engkau.
                  </p>
                  <p>
                    <sup className="font-bold text-emerald-700 mr-1.5 text-xs">15</sup>
                    Jadi jika aku terlambat, sudahlah engkau tahu bagaimana orang harus hidup sebagai <strong className="text-slate-900">keluarga Allah, yakni jemaat dari Allah yang hidup, tiang penopang dan dasar kebenaran</strong>.
                  </p>
                  <p>
                    <sup className="font-bold text-emerald-700 mr-1.5 text-xs">16</sup>
                    Dan sesungguhnya agunglah rahasia ibadah kita: <span className="font-medium text-slate-900 italic">"Dia, yang telah menyatakan diri-Nya dalam rupa manusia, dibenarkan dalam Roh; yang menampakkan diri-Nya kepada malaikat-malaikat, diberitakan di antara bangsa-bangsa yang tidak mengenal Allah; yang dipercayai di dalam dunia, diangkat dalam kemuliaan."</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Footer Dialog */}
            <div className="px-5 sm:px-6 py-4 border-t border-slate-200 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-3">
              <p className="text-xs text-slate-500 text-center sm:text-left">
                Pedoman ini juga menjadi acuan bagi Panitia Pelayanan (Pembangunan, Natal Jemaat/Kategorial, dan Seksi Kategorial).
              </p>
              <button
                type="button"
                id="btn-close-syarat-alkitabiah"
                onClick={() => setIsAyatModalOpen(false)}
                className="w-full sm:w-auto px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl transition-colors shadow-xs cursor-pointer"
              >
                Tutup & Lanjutkan Pengusulan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DIALOG: SESI PEMILIHAN VOTING SELESAI / BATAS WAKTU BERAKHIR */}
      {isSesiExpiredModalOpen && currentSesi && (
        <div
          id="modal-sesi-voting-expired"
          className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200"
        >
          <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-8">
            {/* Header Dialog */}
            <div className="px-6 py-5 bg-gradient-to-r from-rose-700 via-rose-800 to-indigo-900 text-white relative modal-dark-header">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-rose-200 shrink-0 border border-white/20 shadow-inner">
                    <Lock className="w-6 h-6 text-white" style={{ color: '#ffffff' }} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-amber-400 text-slate-950 uppercase tracking-wide shadow-2xs">
                        <Clock className="w-3.5 h-3.5" />
                        Sesi Pemilihan Selesai
                      </span>
                      <span className="text-xs font-semibold text-rose-100" style={{ color: '#fecdd3', WebkitTextFillColor: '#fecdd3' }}>
                        Periode {currentSesi.periode}
                      </span>
                    </div>
                    <h3 className="text-xl font-bold text-white tracking-tight mt-1" style={{ color: '#ffffff', WebkitTextFillColor: '#ffffff' }}>
                      Pengumpulan Suara Telah Ditutup
                    </h3>
                  </div>
                </div>

                <button
                  type="button"
                  id="btn-close-modal-expired-x"
                  onClick={() => setIsSesiExpiredModalOpen(false)}
                  className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer shrink-0"
                  style={{ color: '#ffffff' }}
                >
                  <X className="w-4 h-4 text-white" style={{ color: '#ffffff' }} />
                </button>
              </div>
            </div>

            {/* Body Dialog */}
            <div className="p-6 space-y-5 text-sm text-slate-700 overflow-y-auto max-h-[calc(85vh-200px)]">
              {/* Alert Status Card */}
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200/90 text-rose-950 space-y-2">
                <div className="flex items-center gap-2 font-bold text-sm text-rose-900">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>Pemberitahuan Resmi Panitia Pemilihan</span>
                </div>
                <p className="text-xs text-rose-900/90 leading-relaxed">
                  Sesi pemilihan <strong className="text-rose-950">"{currentSesi.judulPemilihan}"</strong> telah melewati batas waktu akhir pelaksanaan pada tanggal <strong className="text-rose-950">{currentSesi.tanggalSelesai}</strong>.
                </p>
                <div className="pt-2 border-t border-rose-200/70 text-xs text-rose-800 font-medium">
                  🔒 Sesuai tata tertib, bilik suara elektronik telah dikunci secara otomatis. Pengumpulan atau perubahan suara voting baru sudah tidak dapat dilakukan.
                </div>
              </div>

              {/* Rincian Sesi Pemilihan */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Informasi Sesi Pemilihan
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="bg-white p-3 rounded-xl border border-slate-200/60">
                    <span className="text-slate-400 block mb-0.5">Judul Sesi</span>
                    <strong className="text-slate-900 font-bold text-sm line-clamp-1">
                      {currentSesi.judulPemilihan}
                    </strong>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-slate-200/60">
                    <span className="text-slate-400 block mb-0.5">Jenis Jabatan Pelayanan</span>
                    <strong className="text-slate-900 font-bold text-sm line-clamp-1">
                      {currentSesi.jenisSesi}
                    </strong>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-slate-200/60">
                    <span className="text-slate-400 block mb-0.5">Jadwal Pelaksanaan</span>
                    <span className="text-slate-800 font-semibold flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-500" />
                      {currentSesi.tanggalMulai} s/d {currentSesi.tanggalSelesai}
                    </span>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-slate-200/60">
                    <span className="text-slate-400 block mb-0.5">Status Sistem</span>
                    <span className="inline-flex items-center gap-1 text-rose-700 font-bold">
                      <Lock className="w-3.5 h-3.5 text-rose-600" />
                      {currentSesiStatus.statusLabel}
                    </span>
                  </div>
                </div>
              </div>

              {/* Ringkasan Hasil Pemilihan */}
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-3 bg-purple-50 rounded-2xl border border-purple-100">
                  <p className="text-[11px] font-semibold text-purple-700">Total Suara Sah</p>
                  <h4 className="text-lg font-black text-purple-900 mt-0.5">
                    {sessionVotes.length}
                  </h4>
                  <span className="text-[10px] text-purple-600">Pemilih</span>
                </div>
                <div className="p-3 bg-blue-50 rounded-2xl border border-blue-100">
                  <p className="text-[11px] font-semibold text-blue-700">Calon Kandidat</p>
                  <h4 className="text-lg font-black text-blue-900 mt-0.5">
                    {sessionCandidates.length}
                  </h4>
                  <span className="text-[10px] text-blue-600">Orang</span>
                </div>
                <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-100">
                  <p className="text-[11px] font-semibold text-emerald-700">Aspirasi Masuk</p>
                  <h4 className="text-lg font-black text-emerald-900 mt-0.5">
                    {sessionNominations.length}
                  </h4>
                  <span className="text-[10px] text-emerald-600">Usulan</span>
                </div>
              </div>

              {/* Catatan Integritas */}
              <div className="flex items-start gap-2.5 text-xs text-slate-500 bg-slate-100/70 p-3 rounded-xl border border-slate-200/50">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <p>
                  Seluruh suara yang masuk sebelum batas penutupan tersimpan aman dengan enkripsi verifikasi. Panitia Pemilihan dapat memvalidasi dan mengumumkan hasil akhir.
                </p>
              </div>
            </div>

            {/* Footer Dialog */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  id="btn-expired-view-rekap"
                  onClick={() => {
                    setIsSesiExpiredModalOpen(false);
                    if (canManage) {
                      setActiveSubTab('admin');
                    } else {
                      openPrintReport({ reportType: 'pemilihan_rekap', sesiId: currentSesi.id });
                    }
                  }}
                  className="w-full sm:w-auto px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <BarChart3 className="w-4 h-4" />
                  <span>Lihat Rekapitulasi Suara</span>
                </button>

                <button
                  type="button"
                  id="btn-expired-print-rekap"
                  onClick={() => {
                    openPrintReport({ reportType: 'pemilihan_rekap', sesiId: currentSesi.id });
                  }}
                  className="px-3.5 py-2.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
                  title="Cetak Berita Acara & Rekapitulasi Pemilihan"
                >
                  <Printer className="w-4 h-4 text-slate-600" />
                  <span className="hidden sm:inline">Cetak Rekap</span>
                </button>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                {canManage && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsSesiExpiredModalOpen(false);
                      handleOpenEditSesi(currentSesi);
                    }}
                    className="w-full sm:w-auto px-3.5 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                    title="Perpanjang tanggal selesai atau buka kembali sesi"
                  >
                    Perpanjang Waktu Sesi
                  </button>
                )}

                <button
                  type="button"
                  id="btn-close-modal-expired-bottom"
                  onClick={() => setIsSesiExpiredModalOpen(false)}
                  className="w-full sm:w-auto px-5 py-2.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Tutup / Mengerti
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
