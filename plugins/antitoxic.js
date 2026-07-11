import database from '../lib/database.js';

// Daftar kata toxic dasar (dapat dikembangkan/ditambah)
const toxicWords = ['anjing', 'babi', 'monyet', 'bangsat', 'kontol', 'memek', 'bajingan', 'goblok', 'tolol'];

export default {
  name: 'anti-toxic',
  desc: 'Mendeteksi dan menegur pengguna yang mengetik kata-kata kasar di dalam grup.',
  category: 'group',
  hooks: {
    beforeMessage: async (m, { sock }) => {
      if (!m.isGroup) return;

      // Jalankan logika hanya jika plugin anti-toxic diaktifkan di grup ini
      if (!database.isPluginEnabled(m.from, 'anti-toxic')) return;

      const content = m.body.toLowerCase();
      const foundWord = toxicWords.find(word => content.includes(word));

      if (foundWord) {
        const username = m.sender.split('@')[0];
        await m.reply(`*⚠️ [ANTI-TOXIC] ⚠️*\nHarap jaga bahasa Anda @${username}! Hindari mengetik kata kasar (*${foundWord}*) di grup ini.`, {
          mentions: [m.sender]
        });
        
        return false; // Mengembalikan false untuk menghentikan pesan agar tidak diproses lebih jauh
      }
    }
  }
};
