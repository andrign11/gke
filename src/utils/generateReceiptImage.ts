import { KeuanganItem, AppSettings } from '../types';

export function generateReceiptCanvasUrl(
  item: Partial<KeuanganItem> & {
    noReferensi?: string;
    tanggal: string;
    kategori: string;
    posKas?: string;
    jumlah: number;
    keterangan?: string;
    status?: string;
    disetujuiOleh?: string;
    namaPengirim?: string;
  },
  settings: Partial<AppSettings>
): string {
  const canvas = document.createElement('canvas');
  canvas.width = 700;
  canvas.height = 920;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Outer Border
  ctx.strokeStyle = '#0f172a'; // slate-900
  ctx.lineWidth = 6;
  ctx.strokeRect(16, 16, canvas.width - 32, canvas.height - 32);

  // Inner Fine Border
  ctx.strokeStyle = '#cbd5e1'; // slate-300
  ctx.lineWidth = 2;
  ctx.strokeRect(24, 24, canvas.width - 48, canvas.height - 48);

  // Header Dark Banner
  ctx.fillStyle = '#0f172a'; // slate-900
  ctx.fillRect(26, 26, canvas.width - 52, 120);

  // Church Name Header
  const namaJemaat = (settings.namaJemaat || 'MAJELIS JEMAAT GKE').toUpperCase();
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 22px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(namaJemaat, canvas.width / 2, 68);

  const resortGke = settings.resortGke || 'RESORT GKE PALANGKA RAYA';
  ctx.fillStyle = '#e2e8f0';
  ctx.font = 'bold 13px sans-serif';
  ctx.fillText(`${resortGke} — GEREJA KALIMANTAN EVANGELIS`, canvas.width / 2, 94);

  const alamat = settings.alamatGereja || 'Jl. Gereja No. 1, Kalimantan Tengah';
  ctx.fillStyle = '#94a3b8';
  ctx.font = '11px sans-serif';
  ctx.fillText(alamat, canvas.width / 2, 118);

  // Document Title
  ctx.fillStyle = '#0284c7'; // sky-600
  ctx.font = 'bold 18px sans-serif';
  ctx.fillText('RESI KUITANSI RESMI PERSEMBAHAN DIGITAL', canvas.width / 2, 182);

  // Separator Line
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(40, 198);
  ctx.lineTo(canvas.width - 40, 198);
  ctx.stroke();

  // Status Stamp Badge
  const statusStr = (item.status as string) || 'pending';
  const isApproved = statusStr === 'disetujui' || statusStr === 'diverifikasi' || statusStr === 'berhasil';
  const isRejected = statusStr === 'ditolak';

  const badgeBg = isApproved ? '#10b981' : isRejected ? '#f43f5e' : '#f59e0b';
  const badgeText = isApproved
    ? '✓ STATUS: TERVERIFIKASI & SAH'
    : isRejected
    ? '✕ STATUS: DITOLAK / TIDAK VALID'
    : '⏳ STATUS: MENUNGGU VERIFIKASI BENDAHARA';

  ctx.fillStyle = badgeBg;
  ctx.beginPath();
  ctx.roundRect(canvas.width / 2 - 160, 212, 320, 36, 18);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 12px sans-serif';
  ctx.fillText(badgeText, canvas.width / 2, 234);

  // Main Details Card Background
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(40, 268, canvas.width - 80, 330);
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 1;
  ctx.strokeRect(40, 268, canvas.width - 80, 330);

  // Key-Value Rows
  ctx.textAlign = 'left';
  let y = 302;
  const rowHeight = 36;

  // Extract donor name if present
  let pengirim = item.namaPengirim;
  if (!pengirim && item.keterangan) {
    const match = item.keterangan.match(/Pengirim:\s*([^(]+)/i);
    if (match) pengirim = match[1].trim();
  }
  if (!pengirim) pengirim = 'Warga Jemaat / Hamba Allah';

  const rows = [
    { label: 'No. Referensi / Ref ID', value: item.noReferensi || 'REF-' + Date.now().toString().slice(-6) },
    { label: 'Tanggal Transaksi', value: item.tanggal || new Date().toISOString().split('T')[0] },
    { label: 'Nama Pemberi / Pengirim', value: pengirim },
    { label: 'Kategori Persembahan', value: item.kategori || 'Persembahan Syukur' },
    { label: 'Pos Kas Tujuan', value: item.posKas || 'Kas Umum' },
  ];

  rows.forEach((r, idx) => {
    // Alternating background row
    if (idx % 2 === 1) {
      ctx.fillStyle = '#f1f5f9';
      ctx.fillRect(42, y - 22, canvas.width - 84, rowHeight);
    }

    ctx.fillStyle = '#64748b'; // label color
    ctx.font = '12px sans-serif';
    ctx.fillText(r.label, 60, y);

    ctx.fillStyle = '#0f172a'; // value color
    ctx.font = 'bold 13px sans-serif';
    ctx.fillText(':', 230, y);
    ctx.fillText(r.value, 245, y);

    y += rowHeight;
  });

  // Highlight Nominal Card
  ctx.fillStyle = '#065f46'; // emerald-800
  ctx.beginPath();
  ctx.roundRect(60, y - 8, canvas.width - 120, 58, 12);
  ctx.fill();

  ctx.fillStyle = '#d1fae5';
  ctx.font = 'bold 13px sans-serif';
  ctx.fillText('TOTAL NOMINAL PERSEMBAHAN:', 80, y + 26);

  ctx.textAlign = 'right';
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 22px monospace';
  ctx.fillText(`Rp ${item.jumlah.toLocaleString('id-ID')}`, canvas.width - 80, y + 28);

  // Catatan / Doa Box
  y += 76;
  ctx.textAlign = 'left';
  ctx.fillStyle = '#fffbeb'; // amber-50
  ctx.fillRect(40, y, canvas.width - 80, 70);
  ctx.strokeStyle = '#fde68a';
  ctx.strokeRect(40, y, canvas.width - 80, 70);

  ctx.fillStyle = '#b45309';
  ctx.font = 'bold 11px sans-serif';
  ctx.fillText('Catatan / Keterangan Warga Jemaat:', 55, y + 24);

  const ketText = item.keterangan || 'Persembahan Digital Warga Jemaat GKE';
  ctx.fillStyle = '#451a03';
  ctx.font = 'italic 12px sans-serif';
  const truncatedKet = ketText.length > 70 ? ketText.slice(0, 67) + '...' : ketText;
  ctx.fillText(`"${truncatedKet}"`, 55, y + 46);

  // Footer Signatures
  y += 100;
  ctx.textAlign = 'center';
  ctx.fillStyle = '#334155';
  ctx.font = '11px sans-serif';
  ctx.fillText(
    `Diverifikasi / Diterima Oleh: ${item.disetujuiOleh || settings.namaBendahara || 'Bendahara Majelis Jemaat'}`,
    canvas.width / 2,
    y
  );

  const nowStr = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
  ctx.fillStyle = '#64748b';
  ctx.font = '10px sans-serif';
  ctx.fillText(`Diterbitkan secara Digital pada: ${nowStr} WIB`, canvas.width / 2, y + 20);

  // Watermark
  ctx.fillStyle = '#94a3b8';
  ctx.font = '10px monospace';
  ctx.fillText('---------------- TANDA TERIMA DIGITAL RESMI GKE — DOKUMEN SAH SIKJ ----------------', canvas.width / 2, canvas.height - 38);

  return canvas.toDataURL('image/png');
}

export function downloadReceiptAsImage(
  item: Partial<KeuanganItem> & {
    noReferensi?: string;
    tanggal: string;
    kategori: string;
    posKas?: string;
    jumlah: number;
    keterangan?: string;
    status?: string;
    disetujuiOleh?: string;
    namaPengirim?: string;
  },
  settings: Partial<AppSettings>
) {
  const dataUrl = generateReceiptCanvasUrl(item, settings);
  if (!dataUrl) return;

  const refNo = item.noReferensi || 'GKE-' + Date.now();
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = `Resi-Persembahan-${refNo}.png`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export async function shareReceiptToWhatsApp(
  item: Partial<KeuanganItem> & {
    noReferensi?: string;
    tanggal: string;
    kategori: string;
    posKas?: string;
    jumlah: number;
    keterangan?: string;
    status?: string;
    disetujuiOleh?: string;
    namaPengirim?: string;
  },
  settings: Partial<AppSettings>
): Promise<{ success: boolean; message: string }> {
  // Download PNG image first so the user has the file locally
  downloadReceiptAsImage(item, settings);

  // Format admin phone number
  const rawPhone = (settings.noWhatsappAdmin || settings.gopayAccountNumber || '081255667788').replace(/\D/g, '');
  const formattedPhone = rawPhone.startsWith('0') ? '62' + rawPhone.slice(1) : rawPhone || '6281255667788';

  // Format donor name
  let pengirim = item.namaPengirim;
  if (!pengirim && item.keterangan) {
    const match = item.keterangan.match(/Pengirim:\s*([^(]+)/i);
    if (match) pengirim = match[1].trim();
  }
  if (!pengirim) pengirim = 'Warga Jemaat';

  const itemStatus = (item.status as string) || '';
  const isApproved = itemStatus === 'disetujui' || itemStatus === 'diverifikasi' || itemStatus === 'berhasil';
  const statusStr = isApproved ? 'TERVERIFIKASI & SAH' : 'MENUNGGU VERIFIKASI';

  const textMsg =
    `*RESI KUITANSI RESMI PERSEMBAHAN DIGITAL*\n` +
    `*${(settings.namaJemaat || 'MAJELIS JEMAAT GKE').toUpperCase()}*\n` +
    `====================================\n` +
    `📄 *No. Referensi:* ${item.noReferensi || '-'}\n` +
    `📅 *Tanggal:* ${item.tanggal}\n` +
    `👤 *Nama Pengirim:* ${pengirim}\n` +
    `🏷️ *Kategori:* ${item.kategori}\n` +
    `🏦 *Pos Kas:* ${item.posKas || 'Kas Umum'}\n` +
    `💰 *Nominal:* Rp ${item.jumlah.toLocaleString('id-ID')}\n` +
    `📌 *Status:* ${statusStr}\n` +
    `📝 *Catatan:* ${item.keterangan || '-'}\n` +
    `====================================\n` +
    `Syalom Bendahara / Pengurus, berikut saya kirimkan resi kuitansi persembahan digital untuk diverifikasi. Terima kasih, Tuhan memberkati!`;

  const waUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(textMsg)}`;

  // Try Web Share API with image file if supported
  try {
    const dataUrl = generateReceiptCanvasUrl(item, settings);
    const res = await fetch(dataUrl);
    const blob = await res.blob();
    const file = new File([blob], `Resi-Persembahan-${item.noReferensi || 'GKE'}.png`, { type: 'image/png' });

    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({
        title: 'Resi Persembahan Digital GKE',
        text: textMsg,
        files: [file],
      });
      return {
        success: true,
        message: 'Resi Kuitansi berhasil dibagikan langsung ke WhatsApp!',
      };
    }
  } catch (err) {
    console.log('Web share skipped, opening wa.me fallback:', err);
  }

  // Fallback: Open WA window directly
  window.open(waUrl, '_blank');

  return {
    success: true,
    message:
      'Gambar Resi (.PNG) telah di-download dan WhatsApp telah dibuka! Silakan lampirkan gambar resi yang baru tersimpan di perangkat Anda ke chat WhatsApp.',
  };
}
