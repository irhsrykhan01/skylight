import database from '../lib/database.js';
import { getGroupAdmins } from '../lib/utils.js';

export default {
  name: 'anti-link',
  desc: 'Mendeteksi dan menghapus tautan grup WhatsApp lain di dalam grup.',
  category: 'group',
  hooks: {
    // Berjalan sebelum pesan diproses menjadi perintah/command
    beforeMessage: async (m, { sock }) => {
      if (!m.isGroup) return;

      // Jalankan logika hanya jika plugin diaktifkan di grup bersangkutan
      if (!database.isPluginEnabled(m.from, 'anti-link')) return;

      const waLinkRegex = /chat\.whatsapp\.com\/[a-zA-Z0-9]{20,26}/i;
      if (waLinkRegex.test(m.body)) {
        try {
          const admins = await getGroupAdmins(sock, m.from);
          
          // Jika pengirimnya admin, jangan di-kick atau dihapus pesannya (admin bebas)
          if (admins.includes(m.sender)) return;

          // Kirim peringatan
          await m.reply(`*⚠️ [ANTI-LINK] ⚠️*\nLink grup terdeteksi! Mengirim link dilarang keras di grup ini.`);

          // Hapus pesan jika bot terdaftar sebagai admin grup
          const botId = sock.user.id.split(':')[0] + '@s.whatsapp.net';
          if (admins.includes(botId)) {
            await sock.sendMessage(m.from, {
              delete: {
                remoteJid: m.from,
                fromMe: false,
                id: m.id,
                participant: m.sender
              }
            });
          }
        } catch (err) {
          console.error('Error pada plugin anti-link:', err);
        }
        
        return false; // Mengembalikan false untuk memotong alur eksekusi command berikutnya
      }
    }
  }
};
