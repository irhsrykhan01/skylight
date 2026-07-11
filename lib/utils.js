import { jidDecode } from '@whiskeysockets/baileys';

// Helper untuk mendapatkan daftar ID admin di suatu grup secara real-time
export async function getGroupAdmins(sock, jid) {
  try {
    const metadata = await sock.groupMetadata(jid);
    return metadata.participants
      .filter(p => p.admin === 'admin' || p.admin === 'superadmin')
      .map(p => p.id);
  } catch (err) {
    return [];
  }
}

// Helper untuk penundaan waktu (delay)
export const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Helper untuk memformat durasi waktu runtime (detik -> Jam, Menit, Detik)
export function formatRuntime(seconds) {
  const d = Math.floor(seconds / (3600 * 24));
  const h = Math.floor((seconds % (3600 * 24)) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  
  const dDisplay = d > 0 ? `${d}d ` : '';
  const hDisplay = h > 0 ? `${h}h ` : '';
  const mDisplay = m > 0 ? `${m}m ` : '';
  const sDisplay = s > 0 ? `${s}s` : '';
  return dDisplay + hDisplay + mDisplay + sDisplay || '0s';
}

// Algoritma Levenshtein Distance untuk menghitung jarak perbedaan huruf
export function levenshtein(a, b) {
  const matrix = [];
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          Math.min(
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          )
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

// Menghitung persentase kemiripan antara dua kata
export function calculateSimilarity(s1, s2) {
  let longer = s1;
  let shorter = s2;
  if (s1.length < s2.length) {
    longer = s2;
    shorter = s1;
  }
  const longerLength = longer.length;
  if (longerLength === 0) {
    return 1.0;
  }
  return (longerLength - levenshtein(longer, shorter)) / parseFloat(longerLength);
}

// MEMBERSIHKAN JID DARI DEVICE ID (:X) SECARA GLOBAL
export function decodeJid(jid) {
  if (!jid) return jid;
  if (/:\d+@/gi.test(jid)) {
    const decode = jidDecode(jid) || {};
    return decode.user && decode.server && `${decode.user}@${decode.server}` || jid;
  }
  return jid;
}
