import database from '../lib/database.js';

export default {
  name: 'group-participants.update',
  async execute(sock, update) {
    try {
      const { id, participants, action } = update;
      
      // Pastikan fitur welcome aktif di database grup ini
      const isWelcomeEnabled = database.isPluginEnabled(id, 'welcome');
      if (!isWelcomeEnabled) return;

      for (const num of participants) {
        let text = '';
        if (action === 'add') {
          text = `*👋 HALO & SELAMAT DATANG! 👋*\n\nSelamat datang @${num.split('@')[0]} di grup ini!\nSemoga betah dan silakan perkenalkan diri Anda dengan baik.`;
        } else if (action === 'remove') {
          text = `*😢 GOODBYE / SELAMAT TINGGAL! 😢*\n\n@${num.split('@')[0]} telah meninggalkan grup. Terima kasih atas kebersamaannya selama ini.`;
        }

        if (text) {
          await sock.sendMessage(id, {
            text,
            mentions: [num]
          });
        }
      }
    } catch (err) {
      console.error('Error pada event group-participants.update:', err);
    }
  }
};
