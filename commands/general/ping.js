export default {
  name: 'ping',
  alias: ['p'],
  category: 'general',
  desc: 'Memeriksa status respon bot.',
  async execute(m, { sock }) {
    // Beri reaksi emoji jam pasir saat memproses
    await m.react('⏳');
    
    // Kirim balasan teks
    await m.reply('Pong! SkyLight siap digunakan.');
    
    // Beri reaksi emoji sukses
    await m.react('✅');
  }
};
