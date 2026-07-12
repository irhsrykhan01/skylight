import database from '../lib/database.js';
import { decodeJid } from '../lib/utils.js';

export default {
  name: 'group-participants.update',
  async execute(sock, update) {
    try {
      const { id, participants, action } = update;

      for (const num of participants) {
        const cleanNum = decodeJid(num);
        const username = cleanNum.split('@')[0];

        // Sapaan Anggota Baru (Welcome)
        if (action === 'add') {
          const isWelcomeEnabled = database.isPluginEnabled(id, 'welcome');
          if (isWelcomeEnabled) {
            await sock.sendMessage(id, {
              text: `*👋 HALO & SELAMAT DATANG! 👋*\n\nSelamat datang @${username} di grup ini!\nSemoga betah dan silakan perkenalkan diri Anda dengan baik.`,
              mentions: [cleanNum]
            });
          }
        } 
        // Sapaan Anggota Keluar (Goodbye)
        else if (action === 'remove') {
          const isGoodbyeEnabled = database.isPluginEnabled(id, 'goodbye');
          if (isGoodbyeEnabled) {
            await sock.sendMessage(id, {
              text: `*😢 GOODBYE / SELAMAT TINGGAL! 😢*\n\n@${username} telah meninggalkan grup. Terima kasih atas kebersamaannya selama ini.`,
              mentions: [cleanNum]
            });
          }
        }
      }
    } catch (err) {
      console.error('Error pada event group-participants.update:', err);
    }
  }
};
