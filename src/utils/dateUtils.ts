export const formatIndonesianDate = (dateStr?: string): string => {
  if (!dateStr) return '-';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const year = parts[0];
  const monthIdx = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  return `${day} ${months[monthIdx] || ''} ${year}`;
};

/**
 * Validates whether a wedding date is within 1 month after the warta jemaat publication date.
 * Allows weddings in the immediate publication window (from -3 days before to +31 days after).
 */
export const isNikahWithinOneMonth = (
  weddingDateStr?: string,
  wartaPublishDateStr?: string
): boolean => {
  if (!weddingDateStr) return false;
  try {
    const rawWedding = weddingDateStr.trim().split('T')[0];
    const weddingTime = new Date(rawWedding).getTime();
    if (isNaN(weddingTime)) return true;

    const refStr = wartaPublishDateStr ? wartaPublishDateStr.trim().split('T')[0] : new Date().toISOString().split('T')[0];
    const refDate = new Date(refStr);
    if (isNaN(refDate.getTime())) return true;

    // Start: 3 days prior to warta publication (to cover Friday/Saturday weddings of the same week)
    const startDate = new Date(refDate);
    startDate.setHours(0, 0, 0, 0);
    startDate.setDate(startDate.getDate() - 3);

    // End: 31 days after publication (1 month)
    const endDate = new Date(refDate);
    endDate.setHours(23, 59, 59, 999);
    endDate.setDate(endDate.getDate() + 31);

    const checkDate = new Date(rawWedding);
    checkDate.setHours(12, 0, 0, 0);

    return checkDate >= startDate && checkDate <= endDate;
  } catch {
    return true;
  }
};

/**
 * Validates whether a death announcement falls within 2 weeks of the warta jemaat publication date.
 * (Allows death events from 14 days before to 14 days after warta publication date).
 */
export const isDukaWithinTwoWeeks = (
  deathDateStr?: string,
  wartaPublishDateStr?: string
): boolean => {
  if (!deathDateStr) return true;
  try {
    const rawDeath = deathDateStr.trim().split('T')[0];
    const deathTime = new Date(rawDeath).getTime();
    if (isNaN(deathTime)) return true;

    const refStr = wartaPublishDateStr ? wartaPublishDateStr.trim().split('T')[0] : new Date().toISOString().split('T')[0];
    const refDate = new Date(refStr);
    if (isNaN(refDate.getTime())) return true;

    // Start: 14 days before warta publication date
    const startDate = new Date(refDate);
    startDate.setHours(0, 0, 0, 0);
    startDate.setDate(startDate.getDate() - 14);

    // End: 14 days after warta publication date
    const endDate = new Date(refDate);
    endDate.setHours(23, 59, 59, 999);
    endDate.setDate(endDate.getDate() + 14);

    const checkDate = new Date(rawDeath);
    checkDate.setHours(12, 0, 0, 0);

    return checkDate >= startDate && checkDate <= endDate;
  } catch {
    return true;
  }
};

/**
 * Checks if the warta jemaat edition itself was published within the last 2 weeks (14 days).
 */
export const isWartaWithinTwoWeeks = (wartaPublishDateStr?: string): boolean => {
  if (!wartaPublishDateStr) return true;
  try {
    const pubDate = new Date(wartaPublishDateStr.trim().split('T')[0]);
    if (isNaN(pubDate.getTime())) return true;
    const now = new Date();
    const diffMs = now.getTime() - pubDate.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    return diffDays <= 14;
  } catch {
    return true;
  }
};

/**
 * Checks if the warta jemaat edition itself was published within the last 1 month (31 days).
 */
export const isWartaWithinOneMonth = (wartaPublishDateStr?: string): boolean => {
  if (!wartaPublishDateStr) return true;
  try {
    const pubDate = new Date(wartaPublishDateStr.trim().split('T')[0]);
    if (isNaN(pubDate.getTime())) return true;
    const now = new Date();
    const diffMs = now.getTime() - pubDate.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    return diffDays <= 31;
  } catch {
    return true;
  }
};
