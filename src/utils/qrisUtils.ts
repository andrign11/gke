import { AppSettings } from '../types';
import QRCode from 'qrcode';

/**
 * Calculates CRC16-CCITT (0x1021) checksum required by EMVCo QRIS specification.
 */
function crc16(str: string): string {
  let crc = 0xffff;
  for (let i = 0; i < str.length; i++) {
    crc ^= str.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ 0x1021) & 0xffff;
      } else {
        crc = (crc << 1) & 0xffff;
      }
    }
  }
  return (crc & 0xffff).toString(16).toUpperCase().padStart(4, '0');
}

/**
 * Converts or builds an EMVCo Dynamic QRIS payload with exact transaction amount embedded.
 */
export function generateDynamicQrisPayload(
  settings?: AppSettings,
  amount: number = 0,
  refNo?: string
): string {
  const nmid = (settings?.qrisNmid || 'ID1025453826063').replace(/[^A-Za-z0-9]/g, '');
  const merchantName = (settings?.qrisMerchantName || settings?.namaJemaat || 'MAJELIS JEMAAT GKE').trim().substring(0, 25);
  const city = 'PALANGKARAYA';
  const cleanRef = (refNo || `GKE${Date.now().toString().slice(-6)}`).toUpperCase();

  const basePayload = settings?.qrisPayload?.trim();

  if (basePayload && basePayload.startsWith('000201')) {
    // Strip existing CRC 6304XXXX if present at the end
    let payloadWithoutCrc = basePayload.replace(/6304[A-Fa-f0-9]{4}$/, '');

    // Set Point of Initiation Method to Dynamic ('02') instead of Static ('01')
    payloadWithoutCrc = payloadWithoutCrc.replace(/010201/, '010202');

    // Remove existing Tag 54 (Amount) if present
    payloadWithoutCrc = payloadWithoutCrc.replace(/54\d{2}\d+/, '');

    // Insert Tag 53 (IDR 360) and Tag 54 (Amount) before Tag 58 (Country Code '5802ID')
    const amountStr = amount > 0 ? amount.toString() : '0';
    const tag54 = `54${String(amountStr.length).padStart(2, '0')}${amountStr}`;
    const tag53 = `5303360`;

    if (payloadWithoutCrc.includes('5802ID')) {
      payloadWithoutCrc = payloadWithoutCrc.replace('5802ID', `${tag53}${tag54}5802ID`);
    } else {
      payloadWithoutCrc += `${tag53}${tag54}`;
    }

    // Append Tag 6304 for CRC
    const stringToCalc = `${payloadWithoutCrc}6304`;
    const checksum = crc16(stringToCalc);
    return `${stringToCalc}${checksum}`;
  }

  // Synthesize standard EMVCo Dynamic QRIS (NMID / GPN compliant)
  const amtStr = amount > 0 ? amount.toString() : '0';
  const tag54Amt = `54${String(amtStr.length).padStart(2, '0')}${amtStr}`;
  const tag59Merch = `59${String(merchantName.length).padStart(2, '0')}${merchantName}`;
  const tag60City = `60${String(city.length).padStart(2, '0')}${city}`;

  // Tag 62 Additional Data (Reference Number)
  const refLen = cleanRef.length;
  const tag01Ref = `01${String(refLen).padStart(2, '0')}${cleanRef}`;
  const tag62 = `62${String(tag01Ref.length).padStart(2, '0')}${tag01Ref}`;

  // Tag 26 Merchant Account Information (GPN/GoPay ID)
  const nmidTag = `01${String(nmid.length).padStart(2, '0')}${nmid}`;
  const tag26 = `26${String(14 + nmidTag.length).padStart(2, '0')}0014ID.GOPAY.WWW${nmidTag}`;

  const payload =
    `000201` + // Format Indicator
    `010202` + // Dynamic QR Code
    tag26 + // Merchant Account Info
    `52045812` + // Merchant Category Code
    `5303360` + // Currency IDR (360)
    tag54Amt + // Transaction Amount (Dynamic)
    `5802ID` + // Country Code
    tag59Merch + // Merchant Name
    tag60City + // Merchant City
    tag62; // Reference / Bill Number

  const checksum = crc16(`${payload}6304`);
  return `${payload}6304${checksum}`;
}

/**
 * Utility helper to generate a scannable, high-resolution QR code URL or image source.
 * Generates an EMVCo Dynamic QRIS Payload when amount is specified.
 */
export function getQrisImageSource(
  settings?: AppSettings,
  amount: number = 0,
  refNo?: string
): string {
  // If custom uploaded image explicitly set and not stock photo, return custom image
  if (
    settings?.qrisImageUrl &&
    settings.qrisImageUrl.trim() !== '' &&
    !settings.qrisImageUrl.includes('unsplash.com')
  ) {
    return settings.qrisImageUrl.trim();
  }

  // Generate standard EMVCo Dynamic QRIS string with embedded nominal
  const dynamicPayload = generateDynamicQrisPayload(settings, amount, refNo);

  return `https://api.qrserver.com/v1/create-qr-code/?size=450x450&ecc=M&qzone=1&data=${encodeURIComponent(
    dynamicPayload
  )}`;
}

/**
 * Generates an offline-safe base64 data URL for QRIS or generic payloads using client-side qrcode generator.
 */
export async function generateQrisDataUrl(
  settings?: AppSettings,
  amount: number = 0,
  refNo?: string
): Promise<string> {
  if (
    settings?.qrisImageUrl &&
    settings.qrisImageUrl.trim() !== '' &&
    !settings.qrisImageUrl.includes('unsplash.com')
  ) {
    return settings.qrisImageUrl.trim();
  }
  const dynamicPayload = generateDynamicQrisPayload(settings, amount, refNo);
  try {
    return await QRCode.toDataURL(dynamicPayload, {
      width: 450,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
      errorCorrectionLevel: 'M',
    });
  } catch {
    return getQrisImageSource(settings, amount, refNo);
  }
}

/**
 * Validates whether a QRIS string or URL is properly formatted.
 */
export function validateQrisPayload(input: string): { isValid: boolean; message: string } {
  if (!input || !input.trim()) {
    return { isValid: false, message: 'String payload atau URL QRIS kosong.' };
  }
  const clean = input.trim();
  if (clean.startsWith('000201')) {
    return { isValid: true, message: 'Format EMVCo QRIS Baku (000201...) Valid.' };
  }
  if (clean.startsWith('http://') || clean.startsWith('https://') || clean.startsWith('data:image/')) {
    return { isValid: true, message: 'Format URL / Data Image QRIS Valid.' };
  }
  return {
    isValid: true,
    message: 'Teks payload QRIS tersimpan.',
  };
}
