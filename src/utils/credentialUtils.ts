/**
 * Utility functions for automatic username and random password generation
 * for new church member registrations (Warga Jemaat GKE).
 */

export function generateUsername(namaLengkap: string, nik: string): string {
  if (!namaLengkap) return `warga.${Math.floor(1000 + Math.random() * 9000)}`;
  
  // Clean titles like Bpk., Ibu, S.Pd, M.Th, Dr., Ir. etc.
  const cleanedName = namaLengkap
    .replace(/(Bpk|Ibu|S\.Pd|S\.H|S\.T|S\.Kom|M\.Th|M\.Si|Dr|Ir|Dkn|Pnt)\.?/gi, '')
    .trim();
  
  // Extract words and pick first name or combined clean string
  const words = cleanedName.split(/\s+/).filter(Boolean);
  const baseName = (words[0] || 'warga')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');

  // Use last 4 digits of NIK or random 4 digits
  const cleanNik = (nik || '').replace(/[^0-9]/g, '');
  const nikSuffix = cleanNik.length >= 4 
    ? cleanNik.slice(-4) 
    : Math.floor(1000 + Math.random() * 9000).toString();

  return `${baseName || 'warga'}.${nikSuffix}`;
}

export function generateRandomPassword(): string {
  // Uppercase, lowercase, numbers without easily confused characters (O, 0, I, l)
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  let password = 'GKE';
  for (let i = 0; i < 5; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}
