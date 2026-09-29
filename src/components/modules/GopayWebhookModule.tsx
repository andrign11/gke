import React, { useState, useEffect } from 'react';
import {
  Webhook,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  Copy,
  Check,
  Send,
  Server,
  DollarSign,
  ShieldCheck,
  Code,
  Search,
  BookOpen,
  ArrowRight,
  Database,
  Radio,
  FileText,
  Building2,
  Lock,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface WebhookLog {
  id: string;
  timestamp: string;
  event: string;
  source: string;
  refNo: string;
  amount: number;
  senderName: string;
  status: 'SUCCESS' | 'CANCELLED' | 'PENDING';
  recordedToLedger: boolean;
  payload: any;
}

interface PendingQueueItem {
  refNo: string;
  namaPengirim: string;
  nominal: number;
  kategori: string;
  posKas: string;
  metode: string;
  status: 'PENDING' | 'SUCCESS' | 'CANCELLED';
  createdAt: number;
  pollCount: number;
  confirmedAt?: number;
}

export const GopayWebhookModule: React.FC = () => {
  const { settings, keuanganList } = useApp();
  const [activeSubTab, setActiveSubTab] = useState<'logs' | 'queue' | 'ledger' | 'guide'>('logs');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isCopiedUrl, setIsCopiedUrl] = useState<boolean>(false);
  const [copiedPayloadId, setCopiedPayloadId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Realtime Backend Data
  const [webhookLogs, setWebhookLogs] = useState<WebhookLog[]>([]);
  const [pendingQueue, setPendingQueue] = useState<PendingQueueItem[]>([]);
  const [recordedLedger, setRecordedLedger] = useState<any[]>([]);

  // Webhook Simulator Form State
  const [simRefNo, setSimRefNo] = useState<string>(
    () => `QRIS-GOPAY-WH-${Math.floor(100000 + Math.random() * 900000)}`
  );
  const [simNama, setSimNama] = useState<string>('Hamba Allah / Donatur GoPay');
  const [simNominal, setSimNominal] = useState<string>('50000');
  const [simStatus, setSimStatus] = useState<'SUCCESS' | 'CANCELLED'>('SUCCESS');
  const [simPaymentType, setSimPaymentType] = useState<string>('gopay');
  const [isSendingSim, setIsSendingSim] = useState<boolean>(false);
  const [simMessage, setSimMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Absolute Webhook Endpoint URL
  const webhookUrl = `${window.location.origin}/api/persembahan/webhook`;

  const fetchWebhookData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/persembahan/webhook-logs');
      const data = await res.json();
      if (data.success) {
        setWebhookLogs(data.logs || []);
        setPendingQueue(data.pendingQueue || []);
        setRecordedLedger(data.recordedLedger || []);
      }
    } catch (err) {
      console.warn('Failed to fetch webhook logs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWebhookData();
    const interval = setInterval(fetchWebhookData, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(webhookUrl);
    setIsCopiedUrl(true);
    setTimeout(() => setIsCopiedUrl(false), 2000);
  };

  const handleCopyPayload = (logId: string, payload: any) => {
    navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
    setCopiedPayloadId(logId);
    setTimeout(() => setCopiedPayloadId(null), 2000);
  };

  const handleSendSimulatedWebhook = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSendingSim(true);
    setSimMessage(null);

    const parsedAmount = Number(simNominal.replace(/\D/g, '')) || 50000;

    const payload = {
      order_id: simRefNo,
      refNo: simRefNo,
      transaction_status: simStatus === 'SUCCESS' ? 'settlement' : 'cancel',
      status: simStatus,
      gross_amount: parsedAmount.toString(),
      payment_type: simPaymentType,
      nama_pengirim: simNama,
      transaction_time: new Date().toISOString(),
      signature_key: 'sha512_mock_verified_signature',
    };

    try {
      const res = await fetch('/api/persembahan/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (data.success) {
        setSimMessage({
          type: 'success',
          text: `Webhook Callback Berhasil Diterima! Status: ${data.status}. ${
            data.status === 'SUCCESS' ? 'Telah resmi dicatat ke pembukuan Kas Jemaat.' : 'Transaksi dibatalkan.'
          }`,
        });
        // Generate new refNo for next test
        setSimRefNo(`QRIS-GOPAY-WH-${Math.floor(100000 + Math.random() * 900000)}`);
        fetchWebhookData();
      } else {
        setSimMessage({
          type: 'error',
          text: data.error || 'Gagal mengirim callback webhook.',
        });
      }
    } catch {
      setSimMessage({
        type: 'error',
        text: 'Terjadi kesalahan koneksi saat mengirim webhook.',
      });
    } finally {
      setIsSendingSim(false);
    }
  };

  // Metrics calculation
  const totalReceived = webhookLogs.length;
  const totalSuccessLogs = webhookLogs.filter((l) => l.status === 'SUCCESS').length;
  const totalCancelledLogs = webhookLogs.filter((l) => l.status === 'CANCELLED').length;
  const totalAmountSuccess = webhookLogs
    .filter((l) => l.status === 'SUCCESS')
    .reduce((acc, curr) => acc + (curr.amount || 0), 0);

  // Filtered Logs
  const filteredLogs = webhookLogs.filter((log) => {
    const matchesSearch =
      log.refNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.senderName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.event.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === 'ALL' ? true : log.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className="bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 rounded-2xl p-5 sm:p-6 shadow-sm relative overflow-hidden">
        <div className="hidden dark:block absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-300 dark:border-emerald-500/30 text-emerald-900 dark:text-emerald-400 text-xs font-black mb-3">
              <Radio className="w-3.5 h-3.5 animate-pulse text-emerald-600 dark:text-emerald-400" />
              <span>Realtime GoPay / QRIS Webhook Callback Monitor</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
              <Webhook className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              <span>Integration Hub &amp; Webhook GoPay</span>
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-300 mt-1 max-w-2xl font-medium">
              Memantau callback mutasi otomatis dari GoPay / QRIS Merchant. Hanya transaksi dengan status
              <strong className="text-emerald-700 dark:text-emerald-400 font-bold"> SUCCESS / Settlement</strong> yang berhak dicatat ke Pembukuan Kas {settings.namaJemaat || 'GKE'}.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={fetchWebhookData}
              disabled={isLoading}
              className="px-4 py-2.5 rounded-xl bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 text-xs font-black transition-all flex items-center gap-2 border border-slate-300 dark:border-slate-600 cursor-pointer shadow-2xs disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 text-emerald-600 dark:text-emerald-400 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Segarkan Live Data</span>
            </button>
          </div>
        </div>

        {/* Webhook Endpoint Info Box */}
        <div className="mt-5 pt-4 border-t border-slate-200 dark:border-slate-700/70 grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
          <div className="md:col-span-8 bg-slate-50 dark:bg-slate-900/90 rounded-xl p-3.5 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
            <div className="min-w-0">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-700 dark:text-slate-400 flex items-center gap-1.5">
                <Server className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" /> Endpoint Receiver URL Webhook GoPay
              </span>
              <p className="text-xs font-mono font-black text-emerald-800 dark:text-emerald-300 truncate mt-0.5 select-all">
                {webhookUrl}
              </p>
            </div>
            <button
              type="button"
              onClick={handleCopyUrl}
              className="px-3.5 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-black flex items-center justify-center gap-1.5 transition-all flex-shrink-0 cursor-pointer shadow-2xs"
            >
              {isCopiedUrl ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{isCopiedUrl ? 'Tersalin!' : 'Salin URL'}</span>
            </button>
          </div>

          <div className="md:col-span-4 flex items-center gap-3 bg-slate-50 dark:bg-slate-900/80 rounded-xl p-3.5 border border-slate-200 dark:border-slate-800 text-xs shadow-2xs">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-600 dark:bg-emerald-400 animate-ping flex-shrink-0" />
            <div className="min-w-0">
              <span className="font-black text-slate-900 dark:text-slate-200 block">Status Gateway Engine</span>
              <span className="text-[11px] text-emerald-800 dark:text-emerald-400 font-mono font-black">Port 3000 • HTTP POST Active 200 OK</span>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-2xl p-4 flex items-center gap-4 shadow-2xs">
          <div className="w-12 h-12 rounded-xl bg-sky-50 dark:bg-sky-500/10 border border-sky-200 dark:border-sky-500/20 flex items-center justify-center text-sky-600 dark:text-sky-400 flex-shrink-0">
            <Webhook className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-600 dark:text-slate-400 block">Total Callback Diterima</span>
            <span className="text-2xl font-black text-slate-900 dark:text-white font-mono">{totalReceived}</span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-medium">HTTP Callback Hits</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-2xl p-4 flex items-center gap-4 shadow-2xs">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 flex-shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-600 dark:text-slate-400 block">Terverifikasi Sukses</span>
            <span className="text-2xl font-black text-emerald-700 dark:text-emerald-400 font-mono">{totalSuccessLogs}</span>
            <span className="text-[11px] text-emerald-800 dark:text-emerald-300 block font-bold">Dicatat ke Pembukuan Kas</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-2xl p-4 flex items-center gap-4 shadow-2xs">
          <div className="w-12 h-12 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 flex items-center justify-center text-rose-600 dark:text-rose-400 flex-shrink-0">
            <XCircle className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-600 dark:text-slate-400 block">Dibatalkan / Tidak Diterima</span>
            <span className="text-2xl font-black text-rose-700 dark:text-rose-400 font-mono">{totalCancelledLogs}</span>
            <span className="text-[11px] text-rose-800 dark:text-rose-300 block font-bold">Ditolak dari Pembukuan Kas</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-2xl p-4 flex items-center gap-4 shadow-2xs">
          <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400 flex-shrink-0">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-600 dark:text-slate-400 block">Total Persembahan GoPay</span>
            <span className="text-xl font-black text-amber-700 dark:text-amber-300 font-mono">
              Rp {totalAmountSuccess.toLocaleString('id-ID')}
            </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-medium">Masuk Rekening Merchant</span>
          </div>
        </div>
      </div>

      {/* Interactive Webhook Callback Simulator */}
      <div className="bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-emerald-500/30 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <Code className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white">Simulasi Live Callback Webhook GoPay</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">Uji pengiriman payload mutasi merchant untuk menguji verifikasi pembukuan otomatis</p>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-md bg-emerald-50 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50 text-[11px] font-mono font-bold">
            POST /api/persembahan/webhook
          </span>
        </div>

        {simMessage && (
          <div
            className={`p-3.5 rounded-xl text-xs font-medium mb-4 flex items-center gap-2 border ${
              simMessage.type === 'success'
                ? 'bg-emerald-950/80 text-emerald-200 border-emerald-500/40'
                : 'bg-rose-950/80 text-rose-200 border-rose-500/40'
            }`}
          >
            {simMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            ) : (
              <XCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            )}
            <span>{simMessage.text}</span>
          </div>
        )}

        <form onSubmit={handleSendSimulatedWebhook} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div>
            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-400 mb-1">Ref / Order ID</label>
            <input
              type="text"
              value={simRefNo}
              onChange={(e) => setSimRefNo(e.target.value)}
              required
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono font-bold text-emerald-800 dark:text-emerald-300 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-400 mb-1">Nama Pengirim</label>
            <input
              type="text"
              value={simNama}
              onChange={(e) => setSimNama(e.target.value)}
              required
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-slate-200 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-400 mb-1">Nominal (Rp)</label>
            <input
              type="number"
              value={simNominal}
              onChange={(e) => setSimNominal(e.target.value)}
              required
              min="1000"
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono font-black text-amber-700 dark:text-amber-300 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-400 mb-1">Status Mutation Merchant</label>
            <select
              value={simStatus}
              onChange={(e) => setSimStatus(e.target.value as 'SUCCESS' | 'CANCELLED')}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-slate-200 focus:outline-none focus:border-emerald-500"
            >
              <option value="SUCCESS">SUCCESS (Settlement - Masuk Kas)</option>
              <option value="CANCELLED">CANCELLED (Gagal - Jangan Catat)</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              disabled={isSendingSim}
              className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSendingSim ? 'Mengirim...' : 'Kirim Callback Test'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Main Content Tabs */}
      <div className="bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 rounded-2xl p-5 shadow-sm">
        {/* Navigation SubTabs */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-700/80 pb-4 mb-5">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            <button
              type="button"
              onClick={() => setActiveSubTab('logs')}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
                activeSubTab === 'logs'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'bg-slate-100 dark:bg-slate-900/60 text-slate-700 dark:text-slate-400 hover:text-slate-950 dark:hover:text-slate-200 border border-slate-200 dark:border-transparent'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Log Callback Webhook ({webhookLogs.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSubTab('queue')}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
                activeSubTab === 'queue'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'bg-slate-100 dark:bg-slate-900/60 text-slate-700 dark:text-slate-400 hover:text-slate-950 dark:hover:text-slate-200 border border-slate-200 dark:border-transparent'
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>Antrean Gateway ({pendingQueue.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSubTab('ledger')}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
                activeSubTab === 'ledger'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'bg-slate-100 dark:bg-slate-900/60 text-slate-700 dark:text-slate-400 hover:text-slate-950 dark:hover:text-slate-200 border border-slate-200 dark:border-transparent'
              }`}
            >
              <Database className="w-4 h-4" />
              <span>Hasil Pembukuan Kas ({recordedLedger.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSubTab('guide')}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
                activeSubTab === 'guide'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'bg-slate-100 dark:bg-slate-900/60 text-slate-700 dark:text-slate-400 hover:text-slate-950 dark:hover:text-slate-200 border border-slate-200 dark:border-transparent'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Panduan Merchant GoPay</span>
            </button>
          </div>

          {activeSubTab === 'logs' && (
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-56">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cari Ref / Pengirim..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
              >
                <option value="ALL">Semua Status</option>
                <option value="SUCCESS">SUCCESS</option>
                <option value="CANCELLED">CANCELLED</option>
              </select>
            </div>
          )}
        </div>

        {/* TAB 1: WEBHOOK LOGS */}
        {activeSubTab === 'logs' && (
          <div className="space-y-4">
            {filteredLogs.length === 0 ? (
              <div className="text-center py-12 bg-slate-900/50 rounded-2xl border border-slate-800">
                <Webhook className="w-10 h-10 text-slate-600 mx-auto mb-2 opacity-50" />
                <p className="text-sm font-bold text-slate-300">Belum Ada Callback Webhook Diterima</p>
                <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                  Gunakan formulir simulasi di atas atau lakukan transaksi dari QRIS/GoPay untuk memicu callback otomatis.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredLogs.map((log) => (
                  <div
                    key={log.id}
                    className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 transition-all hover:border-slate-700"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3 mb-3">
                      <div className="flex items-center gap-3">
                        {log.status === 'SUCCESS' ? (
                          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 flex-shrink-0">
                            <CheckCircle2 className="w-5 h-5" />
                          </div>
                        ) : (
                          <div className="w-9 h-9 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 flex-shrink-0">
                            <XCircle className="w-5 h-5" />
                          </div>
                        )}
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-xs text-emerald-300">
                              {log.refNo}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                log.status === 'SUCCESS'
                                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                  : 'bg-rose-950 text-rose-300 border border-rose-800'
                              }`}
                            >
                              {log.status}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 mt-0.5">
                            Pengirim: <strong className="text-slate-200">{log.senderName}</strong> • Rp {(log.amount || 0).toLocaleString('id-ID')}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-start sm:self-auto text-right">
                        <div>
                          <span className="text-[11px] text-slate-400 block font-mono">
                            {new Date(log.timestamp).toLocaleString('id-ID')}
                          </span>
                          <span className="text-[10px] text-slate-500 block">{log.source}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleCopyPayload(log.id, log.payload)}
                          className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1 cursor-pointer"
                          title="Salin Raw JSON Payload"
                        >
                          {copiedPayloadId === log.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Verification & Ledger Result */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                          Pemeriksaan Aturan Pembukuan
                        </span>
                        {log.status === 'SUCCESS' ? (
                          <p className="text-emerald-300 font-semibold flex items-center gap-1.5">
                            <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                            <span>Persembahan diterima merchant → Resmi dicatat ke Pembukuan Kas Jemaat</span>
                          </p>
                        ) : (
                          <p className="text-rose-300 font-semibold flex items-center gap-1.5">
                            <XCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                            <span>Persembahan tidak diterima merchant → DITOLAK dari pencatatan pembukuan</span>
                          </p>
                        )}
                      </div>

                      <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 font-mono text-[11px]">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                          Raw JSON Event
                        </span>
                        <div className="text-slate-300 truncate">
                          {JSON.stringify(log.payload)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: ANTREAN GATEWAY QUEUE */}
        {activeSubTab === 'queue' && (
          <div className="space-y-4">
            <p className="text-xs text-slate-400">
              Menampilkan daftar antrean transaksi persembahan digital di server gateway:
            </p>

            {pendingQueue.length === 0 ? (
              <div className="text-center py-10 bg-slate-900/50 rounded-2xl border border-slate-800">
                <Clock className="w-8 h-8 text-slate-600 mx-auto mb-2 opacity-50" />
                <p className="text-sm font-bold text-slate-300">Antrean Server Gateway Kosong</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-700 bg-slate-900/80 text-slate-400 font-bold uppercase text-[10px]">
                      <th className="p-3">Ref No</th>
                      <th className="p-3">Pengirim</th>
                      <th className="p-3">Nominal</th>
                      <th className="p-3">Status Gateway</th>
                      <th className="p-3">Waktu Didaftarkan</th>
                      <th className="p-3">Tercatat Kas</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {pendingQueue.map((item) => (
                      <tr key={item.refNo} className="hover:bg-slate-900/50">
                        <td className="p-3 font-mono font-bold text-emerald-300">{item.refNo}</td>
                        <td className="p-3 font-medium text-slate-200">{item.namaPengirim}</td>
                        <td className="p-3 font-bold text-amber-300">Rp {(item.nominal || 0).toLocaleString('id-ID')}</td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              item.status === 'SUCCESS'
                                ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                : item.status === 'CANCELLED'
                                ? 'bg-rose-950 text-rose-300 border border-rose-800'
                                : 'bg-amber-950 text-amber-300 border border-amber-800 animate-pulse'
                            }`}
                          >
                            {item.status}
                          </span>
                        </td>
                        <td className="p-3 text-slate-400 font-mono text-[11px]">
                          {new Date(item.createdAt).toLocaleTimeString('id-ID')}
                        </td>
                        <td className="p-3">
                          {item.status === 'SUCCESS' ? (
                            <span className="text-emerald-400 font-bold flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Ya
                            </span>
                          ) : (
                            <span className="text-slate-500">Tidak</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: LEDGER RECORDED */}
        {activeSubTab === 'ledger' && (
          <div className="space-y-4">
            <p className="text-xs text-slate-400">
              Seluruh transaksi persembahan digital GoPay/QRIS yang terbukti SUDAH DITERIMA merchant dan resmi dicatat ke Pembukuan Kas Jemaat:
            </p>

            {recordedLedger.length === 0 ? (
              <div className="text-center py-10 bg-slate-900/50 rounded-2xl border border-slate-800">
                <Database className="w-8 h-8 text-slate-600 mx-auto mb-2 opacity-50" />
                <p className="text-sm font-bold text-slate-300">Belum Ada Transaksi Tercatat</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-700 bg-slate-900/80 text-slate-400 font-bold uppercase text-[10px]">
                      <th className="p-3">Tanggal</th>
                      <th className="p-3">Ref No</th>
                      <th className="p-3">Keterangan</th>
                      <th className="p-3">Pos Kas</th>
                      <th className="p-3">Nominal (Rp)</th>
                      <th className="p-3">Petugas / Sistem</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {recordedLedger.map((row) => (
                      <tr key={row.id} className="hover:bg-slate-900/50">
                        <td className="p-3 font-mono text-slate-300">{row.tanggal}</td>
                        <td className="p-3 font-mono font-bold text-emerald-300">{row.noReferensi}</td>
                        <td className="p-3 font-medium text-slate-200">{row.keterangan}</td>
                        <td className="p-3 text-slate-300">{row.posKas}</td>
                        <td className="p-3 font-bold text-emerald-400">
                          Rp {(row.jumlah || 0).toLocaleString('id-ID')}
                        </td>
                        <td className="p-3 text-[11px] text-slate-400">{row.petugasInput}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: MERCHANT GUIDE */}
        {activeSubTab === 'guide' && (
          <div className="space-y-5 text-xs text-slate-300">
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-700 space-y-2">
              <h4 className="font-bold text-sm text-white flex items-center gap-2">
                <Building2 className="w-4 h-4 text-emerald-400" />
                <span>Pengaturan Payment Gateway Dashboard (Midtrans / GoPay / Bank Merchant)</span>
              </h4>
              <p className="text-slate-300 leading-relaxed">
                Untuk menghubungkan portal persembahan digital ini dengan akun Merchant GoPay / Midtrans resmi gereja:
              </p>
              <ol className="list-decimal list-inside space-y-2 pl-2 text-slate-300 mt-2">
                <li>
                  Buka Dashboard Merchant GoPay / Midtrans di <strong className="text-white font-mono">dashboard.midtrans.com</strong>.
                </li>
                <li>
                  Masuk ke menu <strong className="text-emerald-400">SETTINGS &gt; CONFIGURATION</strong>.
                </li>
                <li>
                  Pada bidang <strong className="text-white">Payment Notification URL (Webhook)</strong>, masukkan URL berikut:
                  <div className="my-1.5 p-2 bg-slate-950 rounded-lg font-mono text-emerald-300 border border-slate-800">
                    {webhookUrl}
                  </div>
                </li>
                <li>
                  Simpan perubahan. Setiap kali persembahan dikirim dan diterima merchant, sistem akan mengirim callback HTTP POST otomatis ke URL di atas untuk secara seketika mencatat transaksi ke Pembukuan Kas Jemaat.
                </li>
              </ol>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-700 space-y-2">
              <h4 className="font-bold text-sm text-white flex items-center gap-2">
                <Lock className="w-4 h-4 text-sky-400" />
                <span>Aturan Keuangan &amp; Integritas Data</span>
              </h4>
              <ul className="list-disc list-inside space-y-1.5 pl-2 text-slate-300">
                <li>
                  <strong>Buku Kas Terlindungi:</strong> Transaksi berstatus PENDING atau CANCELLED tidak pernah dimasukkan ke laporan keuangan kas jemaat.
                </li>
                <li>
                  <strong>Deduplikasi Otomatis:</strong> Apabila callback webhook terkirim lebih dari satu kali oleh gateway, server memverifikasi nomor referensi agar tidak terjadi pencatatan ganda di Buku Kas.
                </li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
