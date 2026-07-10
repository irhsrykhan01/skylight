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

// Helper untuk penundaan waktu (jeda) jika dibutuhkan di masa depan
export const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
