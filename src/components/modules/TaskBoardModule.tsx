import React, { useState, useMemo } from 'react';
import {
  CheckSquare,
  Plus,
  Search,
  Filter,
  Calendar,
  Clock,
  User,
  AlertCircle,
  CheckCircle2,
  Hourglass,
  ArrowRight,
  Trash2,
  Edit3,
  MessageSquare,
  Share2,
  Tag,
  DollarSign,
  MapPin,
  ListTodo,
  Columns,
  BarChart3,
  Send,
  Sparkles,
  ChevronRight,
  Layers,
  ChevronDown,
  Info,
  Check,
  ExternalLink,
  ShieldCheck,
  TrendingUp,
  X,
  FileSpreadsheet,
  Printer,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import {
  PelayananTask,
  TaskCategory,
  TaskPriority,
  TaskStatus,
  TaskSubtask,
} from '../../types';

export const TaskBoardModule: React.FC = () => {
  const {
    pelayananTaskList,
    addPelayananTask,
    updatePelayananTask,
    deletePelayananTask,
    movePelayananTaskStatus,
    togglePelayananSubtask,
    addPelayananTaskProgressNote,
    penatuaDiakonList,
    mphList,
    pengurusKategorialList,
    userAccounts,
    currentUser,
    settings,
    openPrintReport,
  } = useApp();

  // State Navigation & Views
  const [activeView, setActiveView] = useState<'kanban' | 'list' | 'timeline' | 'analytics'>('kanban');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedPriority, setSelectedPriority] = useState<string>('ALL');
  const [selectedAssignee, setSelectedAssignee] = useState<string>('ALL');

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [selectedTaskDetail, setSelectedTaskDetail] = useState<PelayananTask | null>(null);
  const [editingTask, setEditingTask] = useState<PelayananTask | null>(null);
  const [taskToDelete, setTaskToDelete] = useState<PelayananTask | null>(null);

  // Form State for Add / Edit Task
  const [formData, setFormData] = useState({
    judul: '',
    deskripsi: '',
    kategori: 'IBADAH' as TaskCategory,
    prioritas: 'SEDANG' as TaskPriority,
    status: 'TODO' as TaskStatus,
    penanggungJawab: '',
    penanggungJawabRole: '',
    penanggungJawabHp: '',
    pemberiTugas: 'Majelis Jemaat',
    tenggatWaktu: '',
    anggaran: '',
    lokasiTerkait: '',
    tagInput: '',
    tags: [] as string[],
    subtasks: [] as { id: string; judul: string; isDone: boolean; assignedTo?: string }[],
  });

  const [newSubtaskTitle, setNewSubtaskTitle] = useState<string>('');
  const [detailNewSubtask, setDetailNewSubtask] = useState<string>('');
  const [newProgressNote, setNewProgressNote] = useState<string>('');

  // Pre-compiled list of possible assignees for smart autocompletion
  const assigneeOptions = useMemo(() => {
    const names = new Set<string>();
    mphList.forEach((m) => names.add(m.nama));
    penatuaDiakonList.forEach((p) => names.add(p.nama));
    pengurusKategorialList.forEach((pk) => names.add(pk.nama));
    userAccounts.forEach((u) => names.add(u.namaLengkap));
    return Array.from(names).filter(Boolean);
  }, [mphList, penatuaDiakonList, pengurusKategorialList, userAccounts]);

  // Categories definition
  const categoryMeta: Record<
    TaskCategory,
    { label: string; bg: string; text: string; border: string; icon: string }
  > = {
    IBADAH: { label: 'Peribadahan & Liturgi', bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200', icon: '⛪' },
    DIAKONIA: { label: 'Diakonia & Sosial', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', icon: '🤝' },
    PEMBANGUNAN: { label: 'Pembangunan & Sarpras', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', icon: '🏗️' },
    KATEKISASI: { label: 'Katekisasi & Pengajaran', bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-200', icon: '📖' },
    SEKRETARIAT: { label: 'Sekretariat & Surat', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', icon: '📝' },
    KEUANGAN: { label: 'Keuangan & Perbendaharaan', bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200', icon: '💰' },
    SARPRAS: { label: 'Sound, Multimedia & Aset', bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', icon: '🎛️' },
    ACARA_KHUSUS: { label: 'Hari Raya & Acara Khusus', bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', icon: '🎉' },
    PELAYANAN_ANAK_REMAJA: { label: 'Pelayanan Anak & Remaja (SPAK/SPPR)', bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', icon: '🌟' },
  };

  const priorityMeta: Record<TaskPriority, { label: string; badgeClass: string; dotClass: string }> = {
    MENDESAK: { label: 'Mendesak', badgeClass: 'bg-rose-100 text-rose-800 border-rose-200', dotClass: 'bg-rose-500' },
    TINGGI: { label: 'Tinggi', badgeClass: 'bg-amber-100 text-amber-800 border-amber-200', dotClass: 'bg-amber-500' },
    SEDANG: { label: 'Sedang', badgeClass: 'bg-blue-100 text-blue-800 border-blue-200', dotClass: 'bg-blue-500' },
    RENDAH: { label: 'Rendah', badgeClass: 'bg-slate-100 text-slate-700 border-slate-200', dotClass: 'bg-slate-400' },
  };

  const columnMeta: Record<TaskStatus, { label: string; countBg: string; borderTop: string; description: string }> = {
    TODO: { label: 'Belum Dimulai', countBg: 'bg-slate-100 text-slate-700', borderTop: 'border-t-slate-400', description: 'Tugas telah didelegasikan & menunggu pelaksanaan' },
    IN_PROGRESS: { label: 'Sedang Dikerjakan', countBg: 'bg-blue-100 text-blue-800', borderTop: 'border-t-blue-500', description: 'Pelayanan aktif dalam proses eksekusi' },
    REVIEW: { label: 'Review & Evaluasi', countBg: 'bg-amber-100 text-amber-800', borderTop: 'border-t-amber-500', description: 'Menunggu pemeriksaan MPH / Koordinator' },
    COMPLETED: { label: 'Selesai & Terlaksana', countBg: 'bg-emerald-100 text-emerald-800', borderTop: 'border-t-emerald-500', description: 'Tugas pelayanan telah tuntas diselesaikan' },
  };

  // Filtered Task List
  const filteredTasks = useMemo(() => {
    return pelayananTaskList.filter((task) => {
      const matchSearch =
        task.judul.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.deskripsi.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.penanggungJawab.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (task.tags && task.tags.some((t) => t.toLowerCase().includes(searchTerm.toLowerCase())));

      const matchCategory = selectedCategory === 'ALL' || task.kategori === selectedCategory;
      const matchPriority = selectedPriority === 'ALL' || task.prioritas === selectedPriority;
      const matchAssignee = selectedAssignee === 'ALL' || task.penanggungJawab === selectedAssignee;

      return matchSearch && matchCategory && matchPriority && matchAssignee;
    });
  }, [pelayananTaskList, searchTerm, selectedCategory, selectedPriority, selectedAssignee]);

  // Statistics Summary
  const stats = useMemo(() => {
    const total = pelayananTaskList.length;
    const todo = pelayananTaskList.filter((t) => t.status === 'TODO').length;
    const inProgress = pelayananTaskList.filter((t) => t.status === 'IN_PROGRESS').length;
    const review = pelayananTaskList.filter((t) => t.status === 'REVIEW').length;
    const completed = pelayananTaskList.filter((t) => t.status === 'COMPLETED').length;
    const urgent = pelayananTaskList.filter((t) => (t.prioritas === 'MENDESAK' || t.prioritas === 'TINGGI') && t.status !== 'COMPLETED').length;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    const totalAnggaran = pelayananTaskList.reduce((acc, t) => acc + (t.anggaran || 0), 0);
    const totalRealisasi = pelayananTaskList.reduce((acc, t) => acc + (t.realisasiAnggaran || 0), 0);

    return { total, todo, inProgress, review, completed, urgent, completionRate, totalAnggaran, totalRealisasi };
  }, [pelayananTaskList]);

  // Quick Preset Handlers
  const applyPreset = (presetType: string) => {
    const today = new Date();
    const dueDate = new Date();
    dueDate.setDate(today.getDate() + 7);
    const dueDateStr = dueDate.toISOString().substring(0, 10);

    if (presetType === 'PERJAMUAN') {
      setFormData({
        judul: 'Persiapan Pelayanan Sakramen Perjamuan Kudus',
        deskripsi: 'Koordinasi pengadaan roti & anggur perjamuan, gladi resik pelayan meja perjamuan, dan pembersihan sloki perjamuan.',
        kategori: 'IBADAH',
        prioritas: 'MENDESAK',
        status: 'TODO',
        penanggungJawab: 'Pnt. Seksi Liturgi',
        penanggungJawabRole: 'Seksi Peribadahan & Liturgi',
        penanggungJawabHp: '0812-3456-7890',
        pemberiTugas: 'Ketua Majelis Jemaat',
        tenggatWaktu: dueDateStr,
        anggaran: '1000000',
        lokasiTerkait: 'Gedung Gereja & Ruang Konsistori',
        tagInput: '',
        tags: ['Perjamuan', 'Liturgi', 'Sakramen'],
        subtasks: [
          { id: 'sub-p1', judul: 'Pengecekan dan sterilisasi cawan/sloki perjamuan', isDone: false },
          { id: 'sub-p2', judul: 'Pemesanan roti tawar & anggur perjamuan', isDone: false },
          { id: 'sub-p3', judul: 'Briefing pelayan meja & pembagian tugas penatua', isDone: false },
        ],
      });
    } else if (presetType === 'DIAKONIA') {
      setFormData({
        judul: 'Perkunjungan Kasih & Diakonia Warga Sakit / Lansia',
        deskripsi: 'Penyusunan jadwal perkunjungan pastoral ke warga jemaat lansia dan yang sedang sakit di rumah atau rumah sakit.',
        kategori: 'DIAKONIA',
        prioritas: 'TINGGI',
        status: 'TODO',
        penanggungJawab: 'Dkn. Seksi Diakonia',
        penanggungJawabRole: 'Seksi Diakonia Sosial',
        penanggungJawabHp: '0813-8899-0011',
        pemberiTugas: 'MPH Majelis Jemaat',
        tenggatWaktu: dueDateStr,
        anggaran: '1500000',
        lokasiTerkait: 'Rumah Warga di 5 Rayon',
        tagInput: '',
        tags: ['Diakonia', 'Pastoral', 'Lansia'],
        subtasks: [
          { id: 'sub-d1', judul: 'Pendataan daftar nama warga yang membutuhkan perkunjungan', isDone: false },
          { id: 'sub-d2', judul: 'Penyiapan bingkisan kasih & vitamin', isDone: false },
          { id: 'sub-d3', judul: 'Pelaksanaan perkunjungan doa bersama Penatua Rayon', isDone: false },
        ],
      });
    } else if (presetType === 'SOUND') {
      setFormData({
        judul: 'Pemeriksaan Rutin Sound System & Streaming Ibadah',
        deskripsi: 'Pengecekan kualitas mixer, kabel instrumen, microphone wireless, dan kelancaran PC live streaming YouTube.',
        kategori: 'SARPRAS',
        prioritas: 'SEDANG',
        status: 'TODO',
        penanggungJawab: 'Tim Multimedia',
        penanggungJawabRole: 'Koordinator Multimedia & Sound',
        penanggungJawabHp: '0857-1234-5678',
        pemberiTugas: 'Seksi Sarpras',
        tenggatWaktu: dueDateStr,
        anggaran: '300000',
        lokasiTerkait: 'Balkon Multimedia Gereja',
        tagInput: '',
        tags: ['Sound', 'Streaming', 'Multimedia'],
        subtasks: [
          { id: 'sub-s1', judul: 'Cek baterai 6 unit mic wireless', isDone: false },
          { id: 'sub-s2', judul: 'Tes koneksi OBS & bandwidth internet gereja', isDone: false },
          { id: 'sub-s3', judul: 'Kalibrasi equalizer panggung & monitor', isDone: false },
        ],
      });
    } else if (presetType === 'RAPAT') {
      setFormData({
        judul: 'Penyusunan Materi & Undangan Sidang Majelis Jemaat',
        deskripsi: 'Pembuatan surat undangan sidang, penggandaan draft laporan program kerja dan realisasi kas perbendaharaan.',
        kategori: 'SEKRETARIAT',
        prioritas: 'TINGGI',
        status: 'TODO',
        penanggungJawab: 'Sekretariat Jemaat',
        penanggungJawabRole: 'Sekretaris MPH',
        penanggungJawabHp: '0812-9988-7766',
        pemberiTugas: 'Ketua MPH',
        tenggatWaktu: dueDateStr,
        anggaran: '500000',
        lokasiTerkait: 'Ruang Rapat Gedung Pertemuan',
        tagInput: '',
        tags: ['Sidang Majelis', 'Sekretariat', 'Laporan'],
        subtasks: [
          { id: 'sub-r1', judul: 'Penyusunan draft agenda sidang majelis', isDone: false },
          { id: 'sub-r2', judul: 'Kirim undangan via WhatsApp & surat fisik', isDone: false },
          { id: 'sub-r3', judul: 'Koordinasi konsumsi dan perlengkapan rapat', isDone: false },
        ],
      });
    }
  };

  // Open Create Modal
  const handleOpenCreateModal = () => {
    const today = new Date();
    const dueDate = new Date();
    dueDate.setDate(today.getDate() + 7);
    const dueDateStr = dueDate.toISOString().substring(0, 10);

    setEditingTask(null);
    setFormData({
      judul: '',
      deskripsi: '',
      kategori: 'IBADAH',
      prioritas: 'SEDANG',
      status: 'TODO',
      penanggungJawab: currentUser?.namaLengkap || '',
      penanggungJawabRole: 'Pengurus Jemaat',
      penanggungJawabHp: '',
      pemberiTugas: 'Majelis Jemaat',
      tenggatWaktu: dueDateStr,
      anggaran: '',
      lokasiTerkait: 'Gedung Gereja',
      tagInput: '',
      tags: ['Pelayanan'],
      subtasks: [],
    });
    setNewSubtaskTitle('');
    setIsCreateModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (task: PelayananTask) => {
    setEditingTask(task);
    setFormData({
      judul: task.judul,
      deskripsi: task.deskripsi,
      kategori: task.kategori,
      prioritas: task.prioritas,
      status: task.status,
      penanggungJawab: task.penanggungJawab,
      penanggungJawabRole: task.penanggungJawabRole || '',
      penanggungJawabHp: task.penanggungJawabHp || '',
      pemberiTugas: task.pemberiTugas || 'Majelis Jemaat',
      tenggatWaktu: task.tenggatWaktu,
      anggaran: task.anggaran ? String(task.anggaran) : '',
      lokasiTerkait: task.lokasiTerkait || '',
      tagInput: '',
      tags: task.tags || [],
      subtasks: task.subtasks || [],
    });
    setIsCreateModalOpen(true);
  };

  // Save Task (Add or Edit)
  const handleSubmitTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.judul.trim() || !formData.penanggungJawab.trim() || !formData.tenggatWaktu) {
      alert('Mohon lengkapi judul tugas, penanggung jawab, dan tanggal tenggat waktu!');
      return;
    }

    const taskPayload = {
      judul: formData.judul.trim(),
      deskripsi: formData.deskripsi.trim(),
      kategori: formData.kategori,
      prioritas: formData.prioritas,
      status: formData.status,
      penanggungJawab: formData.penanggungJawab.trim(),
      penanggungJawabRole: formData.penanggungJawabRole.trim() || 'Pengurus',
      penanggungJawabHp: formData.penanggungJawabHp.trim(),
      pemberiTugas: formData.pemberiTugas.trim() || 'Majelis Jemaat',
      tenggatWaktu: formData.tenggatWaktu,
      anggaran: formData.anggaran ? Number(formData.anggaran) : undefined,
      lokasiTerkait: formData.lokasiTerkait.trim(),
      tags: formData.tags,
      subtasks: formData.subtasks,
      catatanProgres: editingTask ? editingTask.catatanProgres : [],
    };

    if (editingTask) {
      await updatePelayananTask(editingTask.id, taskPayload);
      if (selectedTaskDetail?.id === editingTask.id) {
        setSelectedTaskDetail({ ...selectedTaskDetail, ...taskPayload });
      }
    } else {
      await addPelayananTask(taskPayload);
    }

    setIsCreateModalOpen(false);
  };

  // Subtask Handlers inside Create/Edit Modal
  const handleAddSubtaskInForm = () => {
    if (!newSubtaskTitle.trim()) return;
    setFormData((prev) => ({
      ...prev,
      subtasks: [
        ...prev.subtasks,
        {
          id: `sub-${Date.now()}`,
          judul: newSubtaskTitle.trim(),
          isDone: false,
        },
      ],
    }));
    setNewSubtaskTitle('');
  };

  const handleRemoveSubtaskInForm = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      subtasks: prev.subtasks.filter((st) => st.id !== id),
    }));
  };

  const handleAddTagInForm = () => {
    if (!formData.tagInput.trim()) return;
    const cleanTag = formData.tagInput.trim();
    if (!formData.tags.includes(cleanTag)) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, cleanTag],
        tagInput: '',
      }));
    } else {
      setFormData((prev) => ({ ...prev, tagInput: '' }));
    }
  };

  const handleRemoveTagInForm = (tagToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((t) => t !== tagToRemove),
    }));
  };

  // Subtask handler inside Detail Drawer
  const handleAddSubtaskInDetail = async () => {
    if (!selectedTaskDetail || !detailNewSubtask.trim()) return;
    const newSt: TaskSubtask = {
      id: `sub-${Date.now()}`,
      judul: detailNewSubtask.trim(),
      isDone: false,
    };
    const updatedSubtasks = [...(selectedTaskDetail.subtasks || []), newSt];
    await updatePelayananTask(selectedTaskDetail.id, { subtasks: updatedSubtasks });
    setSelectedTaskDetail({
      ...selectedTaskDetail,
      subtasks: updatedSubtasks,
    });
    setDetailNewSubtask('');
  };

  // Add Progress Note in Detail Drawer
  const handleAddProgressNoteInDetail = async () => {
    if (!selectedTaskDetail || !newProgressNote.trim()) return;
    await addPelayananTaskProgressNote(
      selectedTaskDetail.id,
      newProgressNote.trim(),
      currentUser?.namaLengkap || 'Pengurus Jemaat'
    );
    // update local detail
    const updatedNotes = [
      ...(selectedTaskDetail.catatanProgres || []),
      {
        id: `note-${Date.now()}`,
        penulis: currentUser?.namaLengkap || 'Pengurus Jemaat',
        catatan: newProgressNote.trim(),
        waktu: new Date().toISOString().replace('T', ' ').substring(0, 16),
        userRole: currentUser?.role,
      },
    ];
    setSelectedTaskDetail({
      ...selectedTaskDetail,
      catatanProgres: updatedNotes,
    });
    setNewProgressNote('');
  };

  // WhatsApp Notification Link Generator
  const generateWhatsAppReminderUrl = (task: PelayananTask) => {
    let cleanPhone = (task.penanggungJawabHp || '').replace(/[^0-9]/g, '');
    if (cleanPhone.startsWith('0')) {
      cleanPhone = '62' + cleanPhone.substring(1);
    } else if (!cleanPhone.startsWith('62') && cleanPhone.length > 5) {
      cleanPhone = '62' + cleanPhone;
    }

    const subtasksDone = task.subtasks.filter((st) => st.isDone).length;
    const subtasksTotal = task.subtasks.length;
    const namaGereja = settings?.namaJemaat || 'Gereja Kalimantan Evangelis (GKE)';

    const message = `*PEMBERITAHUAN TUGAS PELAYANAN GEREJA*\n🏛️ *${namaGereja}*\n----------------------------------------\nShalom Sdr/i *${task.penanggungJawab}*,\nBerikut adalah rincian tugas pelayanan yang didelegasikan kepada Anda:\n\n📌 *Tugas:* ${task.judul}\n📂 *Bidang:* ${categoryMeta[task.kategori]?.label || task.kategori}\n⚡ *Prioritas:* ${priorityMeta[task.prioritas]?.label || task.prioritas}\n📅 *Tenggat Waktu:* ${task.tenggatWaktu}\n📊 *Status:* ${columnMeta[task.status]?.label || task.status}\n📍 *Lokasi:* ${task.lokasiTerkait || 'Gedung Gereja'}\n\n📝 *Deskripsi / Instruksi:*\n_${task.deskripsi}_\n\n✅ *Progres Subtask:* ${subtasksDone}/${subtasksTotal} Selesai\n\n_Mari bersama melayani Tuhan dengan segenap hati dan penuh tanggung jawab. Tuhan Yesus memberkati!_ 🙏✝️`;

    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
  };

  // Helper date checker
  const isOverdue = (dateStr: string, status: TaskStatus) => {
    if (status === 'COMPLETED') return false;
    const today = new Date().toISOString().substring(0, 10);
    return dateStr < today;
  };

  const isDueSoon = (dateStr: string, status: TaskStatus) => {
    if (status === 'COMPLETED') return false;
    const today = new Date();
    const target = new Date(dateStr);
    const diffTime = target.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= 2;
  };

  return (
    <div className="space-y-6 pb-12" id="task-board-module-container">
      {/* 1. Header Banner & Quick Action */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start space-x-3">
            <div className="p-3 bg-emerald-600 text-white rounded-xl shadow-sm">
              <CheckSquare className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-2xl font-bold text-slate-900">Manajemen Tugas Pelayanan (Task Board)</h1>
                <span className="px-2.5 py-0.5 text-xs font-semibold bg-emerald-100 text-emerald-800 rounded-full border border-emerald-200">
                  Real-time Sync
                </span>
              </div>
              <p className="text-sm text-slate-600 mt-1 max-w-2xl">
                Delegasikan tugas-tugas peribadahan, kepanitiaan, diakonia, dan kegiatan seksi jemaat. Pantau progres checklist serta koordinasi antar pengurus secara transparan.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              id="btn-tambah-tugas-pelayanan"
              onClick={handleOpenCreateModal}
              className="inline-flex items-center px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-sm font-semibold rounded-lg shadow-sm transition-all duration-150 gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Tugas Baru</span>
            </button>

            <button
              id="btn-cetak-laporan-tugas"
              onClick={() =>
                openPrintReport({
                  reportType: 'task_board',
                  customTitle: 'Laporan Rekapitulasi Tugas Pelayanan Jemaat',
                  selectedKategori: selectedCategory !== 'ALL' ? selectedCategory : undefined,
                  selectedPriority: selectedPriority !== 'ALL' ? selectedPriority : undefined,
                })
              }
              className="inline-flex items-center px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-lg transition-colors gap-2 cursor-pointer border border-slate-200"
              title="Cetak Laporan Rekapitulasi Tugas Pelayanan Resmi GKE"
            >
              <Printer className="w-4 h-4 text-slate-600" />
              <span className="hidden sm:inline">Cetak Laporan</span>
            </button>
          </div>
        </div>

        {/* 2. KPI Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-6 pt-6 border-t border-slate-100">
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Total Tugas</span>
              <ListTodo className="w-4 h-4 text-slate-400" />
            </div>
            <p className="text-2xl font-bold text-slate-900 mt-1">{stats.total}</p>
            <span className="text-[11px] text-slate-500">Seluruh Seksi</span>
          </div>

          <div className="p-3.5 bg-blue-50/70 rounded-xl border border-blue-100">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-blue-700">Dikerjakan</span>
              <Hourglass className="w-4 h-4 text-blue-500" />
            </div>
            <p className="text-2xl font-bold text-blue-900 mt-1">{stats.inProgress}</p>
            <span className="text-[11px] text-blue-600 font-medium">Sedang Berjalan</span>
          </div>

          <div className="p-3.5 bg-amber-50/70 rounded-xl border border-amber-100">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-amber-700">Review & Evaluasi</span>
              <AlertCircle className="w-4 h-4 text-amber-500" />
            </div>
            <p className="text-2xl font-bold text-amber-900 mt-1">{stats.review}</p>
            <span className="text-[11px] text-amber-600 font-medium">Menunggu Verifikasi</span>
          </div>

          <div className="p-3.5 bg-emerald-50/70 rounded-xl border border-emerald-100">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-emerald-700">Selesai</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            </div>
            <p className="text-2xl font-bold text-emerald-900 mt-1">{stats.completed}</p>
            <span className="text-[11px] text-emerald-600 font-medium">{stats.completionRate}% Tuntas</span>
          </div>

          <div className="p-3.5 bg-rose-50/70 rounded-xl border border-rose-100">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-rose-700">Mendesak / Tinggi</span>
              <AlertCircle className="w-4 h-4 text-rose-500" />
            </div>
            <p className="text-2xl font-bold text-rose-900 mt-1">{stats.urgent}</p>
            <span className="text-[11px] text-rose-600 font-medium">Perlu Perhatian</span>
          </div>

          <div className="p-3.5 bg-teal-50/70 rounded-xl border border-teal-100">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-teal-700">Anggaran Tugas</span>
              <DollarSign className="w-4 h-4 text-teal-500" />
            </div>
            <p className="text-lg font-bold text-teal-900 mt-1 truncate" title={`Rp ${stats.totalAnggaran.toLocaleString('id-ID')}`}>
              Rp {(stats.totalAnggaran / 1000000).toFixed(1)} jt
            </p>
            <span className="text-[11px] text-teal-700 font-medium">Alokasi Kas</span>
          </div>
        </div>
      </div>

      {/* 3. View Switcher & Controls Bar */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          {/* View Mode Buttons */}
          <div className="flex items-center p-1 bg-slate-100 rounded-lg self-start">
            <button
              id="view-mode-kanban"
              onClick={() => setActiveView('kanban')}
              className={`inline-flex items-center px-3.5 py-1.5 rounded-md text-xs font-semibold transition-all ${
                activeView === 'kanban'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Columns className="w-3.5 h-3.5 mr-1.5" />
              <span>Kanban Board</span>
            </button>

            <button
              id="view-mode-list"
              onClick={() => setActiveView('list')}
              className={`inline-flex items-center px-3.5 py-1.5 rounded-md text-xs font-semibold transition-all ${
                activeView === 'list'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ListTodo className="w-3.5 h-3.5 mr-1.5" />
              <span>Daftar & Rekap</span>
            </button>

            <button
              id="view-mode-timeline"
              onClick={() => setActiveView('timeline')}
              className={`inline-flex items-center px-3.5 py-1.5 rounded-md text-xs font-semibold transition-all ${
                activeView === 'timeline'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Calendar className="w-3.5 h-3.5 mr-1.5" />
              <span>Jadwal & Tenggat</span>
            </button>

            <button
              id="view-mode-analytics"
              onClick={() => setActiveView('analytics')}
              className={`inline-flex items-center px-3.5 py-1.5 rounded-md text-xs font-semibold transition-all ${
                activeView === 'analytics'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5 mr-1.5" />
              <span>Beban & Anggaran</span>
            </button>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative min-w-[200px] flex-1 sm:flex-initial">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Cari tugas, penanggung jawab, tag..."
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            >
              <option value="ALL">Semua Kategori</option>
              {Object.keys(categoryMeta).map((cat) => (
                <option key={cat} value={cat}>
                  {categoryMeta[cat as TaskCategory].label}
                </option>
              ))}
            </select>

            {/* Priority Filter */}
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            >
              <option value="ALL">Semua Prioritas</option>
              {Object.keys(priorityMeta).map((p) => (
                <option key={p} value={p}>
                  Prioritas {priorityMeta[p as TaskPriority].label}
                </option>
              ))}
            </select>

            {/* Assignee Filter */}
            <select
              value={selectedAssignee}
              onChange={(e) => setSelectedAssignee(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            >
              <option value="ALL">Semua PJ / Pelayan</option>
              {assigneeOptions.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>

            {(searchTerm || selectedCategory !== 'ALL' || selectedPriority !== 'ALL' || selectedAssignee !== 'ALL') && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedCategory('ALL');
                  setSelectedPriority('ALL');
                  setSelectedAssignee('ALL');
                }}
                className="text-xs text-rose-600 hover:text-rose-800 font-medium px-2 py-1 bg-rose-50 rounded-md border border-rose-200"
              >
                Reset Filter
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 4. MAIN VIEWS CONTENT */}

      {/* VIEW A: KANBAN BOARD */}
      {activeView === 'kanban' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 items-start">
          {(['TODO', 'IN_PROGRESS', 'REVIEW', 'COMPLETED'] as TaskStatus[]).map((status) => {
            const columnTasks = filteredTasks.filter((t) => t.status === status);
            const col = columnMeta[status];

            return (
              <div
                key={status}
                className={`bg-slate-50/80 rounded-xl border border-slate-200 p-3.5 border-t-4 ${col.borderTop} flex flex-col min-h-[500px] shadow-2xs`}
              >
                {/* Column Header */}
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-200/80">
                  <div className="flex items-center space-x-2">
                    <h3 className="text-sm font-bold text-slate-800">{col.label}</h3>
                    <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${col.countBg}`}>
                      {columnTasks.length}
                    </span>
                  </div>

                  <button
                    onClick={() => {
                      handleOpenCreateModal();
                      setFormData((prev) => ({ ...prev, status }));
                    }}
                    className="p-1 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded transition-colors"
                    title={`Tambah tugas di status ${col.label}`}
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                {/* Column Tasks List */}
                <div className="space-y-3 flex-1">
                  {columnTasks.length === 0 ? (
                    <div className="text-center py-10 px-4 bg-white/60 rounded-lg border border-dashed border-slate-200">
                      <ListTodo className="w-6 h-6 text-slate-300 mx-auto mb-1.5" />
                      <p className="text-xs font-medium text-slate-400">Tidak ada tugas di kolom ini</p>
                    </div>
                  ) : (
                    columnTasks.map((task) => {
                      const cat = categoryMeta[task.kategori];
                      const prio = priorityMeta[task.prioritas];
                      const totalSub = task.subtasks.length;
                      const doneSub = task.subtasks.filter((st) => st.isDone).length;
                      const subPercent = totalSub > 0 ? Math.round((doneSub / totalSub) * 100) : 0;
                      const overdue = isOverdue(task.tenggatWaktu, task.status);
                      const dueSoon = isDueSoon(task.tenggatWaktu, task.status);

                      return (
                        <div
                          key={task.id}
                          id={`task-card-${task.id}`}
                          className="bg-white rounded-lg border border-slate-200 p-4 shadow-2xs hover:shadow-md transition-all duration-150 flex flex-col space-y-3 group cursor-pointer"
                          onClick={() => setSelectedTaskDetail(task)}
                        >
                          {/* Card Badges: Category & Priority */}
                          <div className="flex items-center justify-between gap-1">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 text-[11px] font-semibold rounded-md border ${cat.bg} ${cat.text} ${cat.border} truncate max-w-[170px]`}
                              title={cat.label}
                            >
                              <span className="mr-1">{cat.icon}</span>
                              {cat.label}
                            </span>

                            <span
                              className={`inline-flex items-center px-2 py-0.5 text-[10px] font-bold rounded-full border ${prio.badgeClass}`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${prio.dotClass}`} />
                              {prio.label}
                            </span>
                          </div>

                          {/* Task Title & Description */}
                          <div>
                            <h4 className="text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition-colors leading-snug line-clamp-2">
                              {task.judul}
                            </h4>
                            <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                              {task.deskripsi}
                            </p>
                          </div>

                          {/* Subtask Progress Bar */}
                          {totalSub > 0 && (
                            <div className="space-y-1 bg-slate-50 p-2 rounded-md border border-slate-100">
                              <div className="flex items-center justify-between text-[11px] font-medium text-slate-600">
                                <span className="flex items-center">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600 mr-1" />
                                  Checklist Subtask
                                </span>
                                <span>
                                  {doneSub}/{totalSub} ({subPercent}%)
                                </span>
                              </div>
                              <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                                <div
                                  className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                                  style={{ width: `${subPercent}%` }}
                                />
                              </div>
                            </div>
                          )}

                          {/* Card Footer: Assignee, Due Date & Quick Status Switch */}
                          <div className="pt-2 border-t border-slate-100 flex flex-col space-y-2">
                            <div className="flex items-center justify-between text-xs">
                              {/* Assignee */}
                              <div className="flex items-center space-x-1.5 text-slate-700 truncate max-w-[140px]" title={task.penanggungJawab}>
                                <div className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-[10px] font-bold shrink-0">
                                  {task.penanggungJawab.charAt(0)}
                                </div>
                                <span className="text-[11px] font-semibold truncate">{task.penanggungJawab}</span>
                              </div>

                              {/* Due Date */}
                              <div
                                className={`inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-medium ${
                                  overdue
                                    ? 'bg-rose-100 text-rose-800 font-bold'
                                    : dueSoon
                                    ? 'bg-amber-100 text-amber-800 font-semibold'
                                    : 'text-slate-500'
                                }`}
                              >
                                <Calendar className="w-3 h-3 mr-1" />
                                <span>{task.tenggatWaktu}</span>
                              </div>
                            </div>

                            {/* Quick Action Bottom Bar */}
                            <div className="flex items-center justify-between pt-1" onClick={(e) => e.stopPropagation()}>
                              {/* Next Status Mover */}
                              <div className="flex items-center space-x-1">
                                {status !== 'TODO' && (
                                  <button
                                    onClick={() => {
                                      const prevStatus =
                                        status === 'COMPLETED'
                                          ? 'REVIEW'
                                          : status === 'REVIEW'
                                          ? 'IN_PROGRESS'
                                          : 'TODO';
                                      movePelayananTaskStatus(task.id, prevStatus);
                                    }}
                                    className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded text-[10px]"
                                    title="Mundurkan status"
                                  >
                                    ←
                                  </button>
                                )}

                                {status !== 'COMPLETED' && (
                                  <button
                                    onClick={() => {
                                      const nextStatus =
                                        status === 'TODO'
                                          ? 'IN_PROGRESS'
                                          : status === 'IN_PROGRESS'
                                          ? 'REVIEW'
                                          : 'COMPLETED';
                                      movePelayananTaskStatus(task.id, nextStatus);
                                    }}
                                    className="inline-flex items-center px-2 py-0.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded text-[11px] font-semibold border border-emerald-200 transition-colors"
                                    title="Majukan status tugas"
                                  >
                                    <span>
                                      {status === 'TODO'
                                        ? 'Mulai Kerjakan'
                                        : status === 'IN_PROGRESS'
                                        ? 'Minta Review'
                                        : 'Tandai Selesai'}
                                    </span>
                                    <ArrowRight className="w-3 h-3 ml-1" />
                                  </button>
                                )}
                              </div>

                              {/* WhatsApp Reminder Button */}
                              {task.penanggungJawabHp && (
                                <a
                                  href={generateWhatsAppReminderUrl(task)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-1 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 rounded"
                                  title="Kirim Pengingat Tugas via WhatsApp"
                                >
                                  <Share2 className="w-3.5 h-3.5" />
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* VIEW B: LIST & REKAP TABLE */}
      {activeView === 'list' && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <ListTodo className="w-4 h-4 text-emerald-600" />
              <span>Daftar Rinci Tugas Pelayanan ({filteredTasks.length} data)</span>
            </h3>
            <span className="text-xs text-slate-500">Klik baris tugas untuk melihat rincian & diskusi progres</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100/80 text-slate-700 font-semibold border-b border-slate-200">
                  <th className="py-3 px-4">Tugas & Deskripsi</th>
                  <th className="py-3 px-4">Kategori Bidang</th>
                  <th className="py-3 px-4">Penanggung Jawab</th>
                  <th className="py-3 px-4">Prioritas</th>
                  <th className="py-3 px-4">Status Pelayanan</th>
                  <th className="py-3 px-4">Tenggat Waktu</th>
                  <th className="py-3 px-4">Subtask</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredTasks.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-10 text-center text-slate-400">
                      Tidak ada tugas pelayanan yang cocok dengan filter pencarian.
                    </td>
                  </tr>
                ) : (
                  filteredTasks.map((task) => {
                    const cat = categoryMeta[task.kategori];
                    const prio = priorityMeta[task.prioritas];
                    const col = columnMeta[task.status];
                    const doneSub = task.subtasks.filter((st) => st.isDone).length;
                    const totalSub = task.subtasks.length;
                    const overdue = isOverdue(task.tenggatWaktu, task.status);

                    return (
                      <tr
                        key={task.id}
                        className="hover:bg-slate-50/90 transition-colors cursor-pointer"
                        onClick={() => setSelectedTaskDetail(task)}
                      >
                        <td className="py-3 px-4 max-w-xs">
                          <p className="font-bold text-slate-900 leading-snug">{task.judul}</p>
                          <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{task.deskripsi}</p>
                          {task.tags && task.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {task.tags.map((t) => (
                                <span key={t} className="px-1.5 py-0.2 text-[10px] bg-slate-100 text-slate-600 rounded">
                                  #{t}
                                </span>
                              ))}
                            </div>
                          )}
                        </td>

                        <td className="py-3 px-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border ${cat.bg} ${cat.text} ${cat.border}`}
                          >
                            <span className="mr-1">{cat.icon}</span>
                            {cat.label}
                          </span>
                        </td>

                        <td className="py-3 px-4 whitespace-nowrap">
                          <p className="font-semibold text-slate-900">{task.penanggungJawab}</p>
                          <p className="text-[11px] text-slate-500">{task.penanggungJawabRole || 'Pelayan'}</p>
                        </td>

                        <td className="py-3 px-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold border ${prio.badgeClass}`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${prio.dotClass}`} />
                            {prio.label}
                          </span>
                        </td>

                        <td className="py-3 px-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-semibold ${col.countBg}`}
                          >
                            {col.label}
                          </span>
                        </td>

                        <td className="py-3 px-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-xs ${
                              overdue ? 'bg-rose-100 text-rose-800 font-bold' : 'text-slate-700'
                            }`}
                          >
                            <Calendar className="w-3 h-3 mr-1" />
                            {task.tenggatWaktu}
                          </span>
                        </td>

                        <td className="py-3 px-4 whitespace-nowrap">
                          {totalSub > 0 ? (
                            <span className="font-medium text-slate-700">
                              {doneSub} / {totalSub}
                            </span>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>

                        <td className="py-3 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end space-x-1.5">
                            {task.penanggungJawabHp && (
                              <a
                                href={generateWhatsAppReminderUrl(task)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded"
                                title="Kirim Pengingat WA"
                              >
                                <Send className="w-3.5 h-3.5" />
                              </a>
                            )}

                            <button
                              onClick={() =>
                                openPrintReport({
                                  reportType: 'task_board',
                                  selectedId: task.id,
                                  taskId: task.id,
                                  customTitle: `Lembar Penugasan Pelayanan - ${task.judul}`,
                                })
                              }
                              className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded"
                              title="Cetak Lembar Disposisi Tugas"
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => handleOpenEditModal(task)}
                              className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded"
                              title="Edit Tugas"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => setTaskToDelete(task)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                              title="Hapus Tugas"
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
      )}

      {/* VIEW C: TIMELINE & CALENDAR SCHEDULE */}
      {activeView === 'timeline' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="text-base font-bold text-slate-900 mb-2 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-emerald-600" />
              <span>Jadwal Tenggat Waktu & Kronologi Tugas Pelayanan</span>
            </h3>
            <p className="text-xs text-slate-500 mb-6">
              Urutan tugas berdasarkan kedekatan batas waktu penyelesaian untuk memastikan pelayanan gereja tidak ada yang terlewat.
            </p>

            <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200">
              {filteredTasks
                .slice()
                .sort((a, b) => a.tenggatWaktu.localeCompare(b.tenggatWaktu))
                .map((task) => {
                  const cat = categoryMeta[task.kategori];
                  const prio = priorityMeta[task.prioritas];
                  const col = columnMeta[task.status];
                  const overdue = isOverdue(task.tenggatWaktu, task.status);

                  return (
                    <div key={task.id} className="relative group">
                      {/* Timeline Node Icon */}
                      <div
                        className={`absolute -left-6 top-1 w-5 h-5 rounded-full border-2 border-white flex items-center justify-center shadow-xs ${
                          task.status === 'COMPLETED'
                            ? 'bg-emerald-500 text-white'
                            : overdue
                            ? 'bg-rose-500 text-white animate-pulse'
                            : 'bg-blue-500 text-white'
                        }`}
                      >
                        {task.status === 'COMPLETED' ? (
                          <Check className="w-3 h-3" />
                        ) : (
                          <Clock className="w-2.5 h-2.5" />
                        )}
                      </div>

                      {/* Card Content */}
                      <div
                        className="bg-slate-50/70 hover:bg-white p-4 rounded-xl border border-slate-200 hover:border-emerald-300 transition-all cursor-pointer shadow-2xs"
                        onClick={() => setSelectedTaskDetail(task)}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex items-center space-x-2">
                            <span className="text-xs font-bold text-slate-800 bg-white px-2.5 py-1 rounded-md border border-slate-200">
                              📅 {task.tenggatWaktu}
                            </span>
                            <span
                              className={`px-2 py-0.5 text-[11px] font-semibold rounded border ${cat.bg} ${cat.text} ${cat.border}`}
                            >
                              {cat.label}
                            </span>
                            <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${prio.badgeClass}`}>
                              {prio.label}
                            </span>
                          </div>

                          <span className={`px-2 py-0.5 text-xs font-semibold rounded-md ${col.countBg} self-start sm:self-auto`}>
                            {col.label}
                          </span>
                        </div>

                        <h4 className="text-sm font-bold text-slate-900 mt-2">{task.judul}</h4>
                        <p className="text-xs text-slate-600 mt-1">{task.deskripsi}</p>

                        <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-200/60 text-xs text-slate-500">
                          <span>👤 PJ: <strong className="text-slate-800">{task.penanggungJawab}</strong> ({task.penanggungJawabRole})</span>
                          <span>📍 {task.lokasiTerkait || 'Gereja'}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}

      {/* VIEW D: ANALYTICS & WORKLOAD */}
      {activeView === 'analytics' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Workload per Category */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-600" />
              <span>Distribusi Tugas Berdasarkan Bidang Pelayanan</span>
            </h3>

            <div className="space-y-3">
              {Object.keys(categoryMeta).map((catKey) => {
                const cat = categoryMeta[catKey as TaskCategory];
                const catTasks = pelayananTaskList.filter((t) => t.kategori === catKey);
                const count = catTasks.length;
                const completedCount = catTasks.filter((t) => t.status === 'COMPLETED').length;
                const percentage = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;

                if (count === 0) return null;

                return (
                  <div key={catKey} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-800 flex items-center">
                        <span className="mr-1.5">{cat.icon}</span>
                        {cat.label}
                      </span>
                      <span className="text-slate-500">
                        {completedCount}/{count} Selesai ({percentage}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-emerald-600 h-full rounded-full transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Budget & Realization per Department */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-teal-600" />
              <span>Ringkasan Anggaran & Realisasi Tugas Pelayanan</span>
            </h3>

            <div className="p-4 bg-teal-50/60 rounded-xl border border-teal-100 mb-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-teal-700 font-medium">Total Anggaran Dialokasikan</p>
                <p className="text-xl font-bold text-teal-950 mt-0.5">
                  Rp {stats.totalAnggaran.toLocaleString('id-ID')}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-teal-700 font-medium">Total Realisasi Terpakai</p>
                <p className="text-xl font-bold text-emerald-800 mt-0.5">
                  Rp {stats.totalRealisasi.toLocaleString('id-ID')}
                </p>
              </div>
            </div>

            <div className="divide-y divide-slate-100">
              {pelayananTaskList
                .filter((t) => t.anggaran && t.anggaran > 0)
                .map((task) => (
                  <div key={task.id} className="py-2.5 flex items-center justify-between text-xs">
                    <div className="max-w-[240px]">
                      <p className="font-semibold text-slate-900 truncate">{task.judul}</p>
                      <p className="text-[11px] text-slate-500">{task.penanggungJawab}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-slate-800">Rp {(task.anggaran || 0).toLocaleString('id-ID')}</p>
                      <p className="text-[11px] text-emerald-600">
                        Realisasi: Rp {(task.realisasiAnggaran || 0).toLocaleString('id-ID')}
                      </p>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* 5. MODAL: CREATE / EDIT TASK */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/80 rounded-t-2xl">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  {editingTask ? 'Edit Tugas Pelayanan' : 'Tambah Tugas Pelayanan Baru'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Lengkapi data tugas, delegasikan ke pelayan terkait, dan tentukan checklist subtask.
                </p>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmitTask} className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
              {/* Presets Button for quick fill if creating new */}
              {!editingTask && (
                <div className="p-3 bg-emerald-50/70 rounded-xl border border-emerald-200/80 space-y-2">
                  <span className="text-[11px] font-bold text-emerald-900 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                    Template Cepat Tugas Pelayanan Gereja:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => applyPreset('PERJAMUAN')}
                      className="px-2.5 py-1 bg-white hover:bg-emerald-100 text-emerald-800 font-semibold rounded-md border border-emerald-300 text-[11px] transition-colors"
                    >
                      ⛪ Sakramen Perjamuan Kudus
                    </button>
                    <button
                      type="button"
                      onClick={() => applyPreset('DIAKONIA')}
                      className="px-2.5 py-1 bg-white hover:bg-emerald-100 text-emerald-800 font-semibold rounded-md border border-emerald-300 text-[11px] transition-colors"
                    >
                      🤝 Baksos & Diakonia Kasih
                    </button>
                    <button
                      type="button"
                      onClick={() => applyPreset('SOUND')}
                      className="px-2.5 py-1 bg-white hover:bg-emerald-100 text-emerald-800 font-semibold rounded-md border border-emerald-300 text-[11px] transition-colors"
                    >
                      🎛️ Sound & Streaming Ibadah
                    </button>
                    <button
                      type="button"
                      onClick={() => applyPreset('RAPAT')}
                      className="px-2.5 py-1 bg-white hover:bg-emerald-100 text-emerald-800 font-semibold rounded-md border border-emerald-300 text-[11px] transition-colors"
                    >
                      📝 Sidang Majelis Jemaat
                    </button>
                  </div>
                </div>
              )}

              {/* Judul Tugas */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Judul Tugas Pelayanan <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Persiapan Liturgi & Musik Ibadah Gabungan"
                  value={formData.judul || ''}
                  onChange={(e) => setFormData({ ...formData, judul: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              {/* Deskripsi */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">Deskripsi & Instruksi</label>
                <textarea
                  rows={3}
                  placeholder="Rincian instruksi pelaksanaan, sasaran tugas, dan hal yang perlu dikoordinasikan..."
                  value={formData.deskripsi || ''}
                  onChange={(e) => setFormData({ ...formData, deskripsi: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              {/* Row: Kategori & Prioritas */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">Bidang / Kategori</label>
                  <select
                    value={formData.kategori || 'IBADAH'}
                    onChange={(e) => setFormData({ ...formData, kategori: e.target.value as TaskCategory })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  >
                    {Object.keys(categoryMeta).map((cat) => (
                      <option key={cat} value={cat}>
                        {categoryMeta[cat as TaskCategory].icon} {categoryMeta[cat as TaskCategory].label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">Tingkat Prioritas</label>
                  <select
                    value={formData.prioritas || 'SEDANG'}
                    onChange={(e) => setFormData({ ...formData, prioritas: e.target.value as TaskPriority })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  >
                    <option value="MENDESAK">🔴 Mendesak (Urgent)</option>
                    <option value="TINGGI">🟠 Tinggi (High)</option>
                    <option value="SEDANG">🔵 Sedang (Medium)</option>
                    <option value="RENDAH">⚪ Rendah (Low)</option>
                  </select>
                </div>
              </div>

              {/* Row: Penanggung Jawab, Role, and No WA */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Penanggung Jawab <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    list="assignees-list"
                    placeholder="Ketik atau pilih nama pelayan"
                    value={formData.penanggungJawab || ''}
                    onChange={(e) => setFormData({ ...formData, penanggungJawab: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                  <datalist id="assignees-list">
                    {assigneeOptions.map((name) => (
                      <option key={name} value={name} />
                    ))}
                  </datalist>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">Jabatan / Seksi</label>
                  <input
                    type="text"
                    placeholder="Misal: Penatua Liturgi / Ketua SPAK"
                    value={formData.penanggungJawabRole || ''}
                    onChange={(e) => setFormData({ ...formData, penanggungJawabRole: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">No. WhatsApp PJ</label>
                  <input
                    type="text"
                    placeholder="0812-xxxx-xxxx"
                    value={formData.penanggungJawabHp || ''}
                    onChange={(e) => setFormData({ ...formData, penanggungJawabHp: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Row: Tenggat Waktu & Anggaran */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Tenggat Waktu (Deadline) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.tenggatWaktu || ''}
                    onChange={(e) => setFormData({ ...formData, tenggatWaktu: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">Alokasi Anggaran (Rp)</label>
                  <input
                    type="number"
                    placeholder="Contoh: 1500000"
                    value={formData.anggaran ?? ''}
                    onChange={(e) => setFormData({ ...formData, anggaran: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">Lokasi / Ruangan</label>
                  <input
                    type="text"
                    placeholder="Gedung Utama / Konsistori"
                    value={formData.lokasiTerkait || ''}
                    onChange={(e) => setFormData({ ...formData, lokasiTerkait: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Subtasks Builder */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <label className="block text-xs font-bold text-slate-800">Daftar Subtask & Checklist Progres</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Tambah item subtask (misal: Pesan bunga altar)"
                    value={newSubtaskTitle || ''}
                    onChange={(e) => setNewSubtaskTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddSubtaskInForm();
                      }
                    }}
                    className="flex-1 px-3 py-1.5 text-xs border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddSubtaskInForm}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white font-semibold rounded-lg text-xs"
                  >
                    Tambah
                  </button>
                </div>

                {formData.subtasks.length > 0 && (
                  <div className="space-y-1.5 max-h-32 overflow-y-auto p-2 bg-slate-50 rounded-lg border border-slate-200">
                    {formData.subtasks.map((st, idx) => (
                      <div key={st.id} className="flex items-center justify-between text-xs py-1 px-2 bg-white rounded border border-slate-200">
                        <span className="font-medium text-slate-800">
                          {idx + 1}. {st.judul}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveSubtaskInForm(st.id)}
                          className="text-rose-500 hover:text-rose-700"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Tags */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <label className="block text-xs font-bold text-slate-800">Label / Tag</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Tambah tag kata kunci..."
                    value={formData.tagInput || ''}
                    onChange={(e) => setFormData({ ...formData, tagInput: e.target.value })}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddTagInForm();
                      }
                    }}
                    className="flex-1 px-3 py-1.5 text-xs border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-emerald-500/20"
                  />
                  <button
                    type="button"
                    onClick={handleAddTagInForm}
                    className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded-lg text-xs"
                  >
                    + Tag
                  </button>
                </div>

                <div className="flex flex-wrap gap-1">
                  {formData.tags.map((t) => (
                    <span key={t} className="inline-flex items-center px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[11px]">
                      #{t}
                      <button type="button" onClick={() => handleRemoveTagInForm(t)} className="ml-1 text-slate-400 hover:text-rose-600">
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-xs"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs shadow-sm"
                >
                  {editingTask ? 'Simpan Perubahan' : 'Buat Tugas Pelayanan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. MODAL / DRAWER: TASK DETAIL & PROGRESS DISCUSSION */}
      {selectedTaskDetail && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200">
            {/* Drawer Header */}
            <div className="p-6 border-b border-slate-100 flex items-start justify-between bg-slate-50/80 rounded-t-2xl">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 text-xs font-semibold rounded-md border ${
                      categoryMeta[selectedTaskDetail.kategori].bg
                    } ${categoryMeta[selectedTaskDetail.kategori].text} ${
                      categoryMeta[selectedTaskDetail.kategori].border
                    }`}
                  >
                    {categoryMeta[selectedTaskDetail.kategori].icon}{' '}
                    {categoryMeta[selectedTaskDetail.kategori].label}
                  </span>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 text-[11px] font-bold rounded-full border ${
                      priorityMeta[selectedTaskDetail.prioritas].badgeClass
                    }`}
                  >
                    {priorityMeta[selectedTaskDetail.prioritas].label}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 mt-1">{selectedTaskDetail.judul}</h3>
              </div>

              <div className="flex items-center space-x-1">
                <button
                  onClick={() =>
                    openPrintReport({
                      reportType: 'task_board',
                      selectedId: selectedTaskDetail.id,
                      taskId: selectedTaskDetail.id,
                      customTitle: `Lembar Penugasan Pelayanan - ${selectedTaskDetail.judul}`,
                    })
                  }
                  className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                  title="Cetak Lembar Disposisi Tugas Resmi GKE"
                >
                  <Printer className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    handleOpenEditModal(selectedTaskDetail);
                    setSelectedTaskDetail(null);
                  }}
                  className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Edit Tugas"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setSelectedTaskDetail(null)}
                  className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Drawer Body */}
            <div className="p-6 space-y-6 overflow-y-auto flex-1 text-xs">
              {/* Status Switcher Bar */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span className="text-slate-600 font-medium">Status Tugas Saat Ini:</span>
                <div className="flex flex-wrap gap-1">
                  {(['TODO', 'IN_PROGRESS', 'REVIEW', 'COMPLETED'] as TaskStatus[]).map((st) => (
                    <button
                      key={st}
                      onClick={async () => {
                        await movePelayananTaskStatus(selectedTaskDetail.id, st);
                        setSelectedTaskDetail({
                          ...selectedTaskDetail,
                          status: st,
                          tanggalSelesai: st === 'COMPLETED' ? new Date().toISOString().substring(0, 10) : undefined,
                        });
                      }}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${
                        selectedTaskDetail.status === st
                          ? 'bg-slate-900 text-white shadow-xs'
                          : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {columnMeta[st].label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-slate-800">Deskripsi Tugas Pelayanan</h4>
                <p className="text-slate-600 leading-relaxed bg-slate-50/50 p-3 rounded-lg border border-slate-100">
                  {selectedTaskDetail.deskripsi}
                </p>
              </div>

              {/* Meta Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-500 text-[11px] block">Penanggung Jawab</span>
                  <strong className="text-slate-900">{selectedTaskDetail.penanggungJawab}</strong>
                  <span className="text-slate-500 text-[10px] block">{selectedTaskDetail.penanggungJawabRole}</span>
                </div>

                <div>
                  <span className="text-slate-500 text-[11px] block">Tenggat Waktu</span>
                  <strong className="text-slate-900">{selectedTaskDetail.tenggatWaktu}</strong>
                </div>

                <div>
                  <span className="text-slate-500 text-[11px] block">Pemberi Tugas</span>
                  <strong className="text-slate-900">{selectedTaskDetail.pemberiTugas || 'MPH Jemaat'}</strong>
                </div>

                <div>
                  <span className="text-slate-500 text-[11px] block">Anggaran Alokasi</span>
                  <strong className="text-slate-900">
                    {selectedTaskDetail.anggaran
                      ? `Rp ${selectedTaskDetail.anggaran.toLocaleString('id-ID')}`
                      : 'Non-Anggaran'}
                  </strong>
                </div>
              </div>

              {/* Interactive Subtasks Checklist */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Checklist Subtask Pelayanan</span>
                  </h4>
                  <span className="text-xs font-semibold text-slate-600">
                    {selectedTaskDetail.subtasks.filter((s) => s.isDone).length} / {selectedTaskDetail.subtasks.length} Selesai
                  </span>
                </div>

                <div className="space-y-1.5">
                  {selectedTaskDetail.subtasks.map((st) => (
                    <div
                      key={st.id}
                      onClick={async () => {
                        await togglePelayananSubtask(selectedTaskDetail.id, st.id);
                        setSelectedTaskDetail({
                          ...selectedTaskDetail,
                          subtasks: selectedTaskDetail.subtasks.map((s) =>
                            s.id === st.id ? { ...s, isDone: !s.isDone } : s
                          ),
                        });
                      }}
                      className={`flex items-center justify-between p-2.5 rounded-lg border transition-all cursor-pointer ${
                        st.isDone
                          ? 'bg-emerald-50/60 border-emerald-200 text-emerald-900'
                          : 'bg-white border-slate-200 text-slate-800 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center space-x-2.5">
                        <input
                          type="checkbox"
                          checked={st.isDone}
                          readOnly
                          className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                        />
                        <span className={st.isDone ? 'line-through text-slate-500' : 'font-medium'}>
                          {st.judul}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Add Subtask in Detail */}
                <div className="flex gap-2 pt-1">
                  <input
                    type="text"
                    placeholder="Tambah subtask baru..."
                    value={detailNewSubtask || ''}
                    onChange={(e) => setDetailNewSubtask(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddSubtaskInDetail();
                      }
                    }}
                    className="flex-1 px-3 py-1.5 text-xs border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-emerald-500/20"
                  />
                  <button
                    type="button"
                    onClick={handleAddSubtaskInDetail}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white font-semibold rounded-lg text-xs"
                  >
                    + Tambah
                  </button>
                </div>
              </div>

              {/* Progress Discussion Log */}
              <div className="space-y-3 pt-4 border-t border-slate-100">
                <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <MessageSquare className="w-4 h-4 text-blue-600" />
                  <span>Catatan Koordinasi & Progres Pelayanan</span>
                </h4>

                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {(selectedTaskDetail.catatanProgres || []).length === 0 ? (
                    <p className="text-slate-400 italic text-[11px] py-2">Belum ada catatan progres.</p>
                  ) : (
                    (selectedTaskDetail.catatanProgres || []).map((note) => (
                      <div key={note.id} className="p-3 bg-slate-50 rounded-lg border border-slate-200/80 space-y-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-bold text-slate-800">{note.penulis}</span>
                          <span className="text-slate-400">{note.waktu}</span>
                        </div>
                        <p className="text-slate-600 leading-relaxed">{note.catatan}</p>
                      </div>
                    ))
                  )}
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Tuliskan catatan progres atau update koordinasi..."
                    value={newProgressNote || ''}
                    onChange={(e) => setNewProgressNote(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddProgressNoteInDetail();
                      }
                    }}
                    className="flex-1 px-3 py-2 text-xs border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-emerald-500/20"
                  />
                  <button
                    type="button"
                    onClick={handleAddProgressNoteInDetail}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs"
                  >
                    Kirim Catatan
                  </button>
                </div>
              </div>
            </div>

            {/* Drawer Footer with WhatsApp Instant Share & Cetak Lembar Tugas */}
            <div className="p-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 bg-slate-50/80 rounded-b-2xl">
              <a
                href={generateWhatsAppReminderUrl(selectedTaskDetail)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg text-xs shadow-sm gap-2"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Kirim Ringkasan ke WA PJ</span>
              </a>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() =>
                    openPrintReport({
                      reportType: 'task_board',
                      selectedId: selectedTaskDetail.id,
                      taskId: selectedTaskDetail.id,
                      customTitle: `Lembar Penugasan Pelayanan - ${selectedTaskDetail.judul}`,
                    })
                  }
                  className="inline-flex items-center px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold rounded-lg text-xs gap-1.5 border border-indigo-200 transition-colors cursor-pointer"
                  title="Cetak Lembar Disposisi & Rincian Tugas"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Cetak Lembar Tugas</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedTaskDetail(null)}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded-lg text-xs cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 7. DELETE CONFIRMATION MODAL */}
      {taskToDelete && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center space-x-3 text-rose-600">
              <div className="p-3 bg-rose-100 rounded-xl">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Hapus Tugas Pelayanan?</h3>
                <p className="text-xs text-slate-500">Tindakan ini tidak dapat dibatalkan.</p>
              </div>
            </div>

            <p className="text-xs text-slate-600">
              Apakah Anda yakin ingin menghapus tugas <strong className="text-slate-900">"{taskToDelete.judul}"</strong> yang didelegasikan kepada <strong className="text-slate-900">{taskToDelete.penanggungJawab}</strong>?
            </p>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                onClick={() => setTaskToDelete(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-xs"
              >
                Batal
              </button>
              <button
                onClick={async () => {
                  await deletePelayananTask(taskToDelete.id);
                  setTaskToDelete(null);
                  if (selectedTaskDetail?.id === taskToDelete.id) {
                    setSelectedTaskDetail(null);
                  }
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg text-xs shadow-sm"
              >
                Ya, Hapus Tugas
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
