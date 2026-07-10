import database from '../../lib/database.js';
import loader from '../../src/core/loader.js';

export default {
  name: 'plugin',
  alias: ['pl'],
  category: 'group',
  desc: 'Mengaktifkan atau menonaktifkan plugin grup.',
  // --- FLAG METADATA IZIN AKSES (Stage 17) ---
  groupOnly: true,
  adminOnly: true, 
  async execute(m, { sock, args }) {
    // Seluruh baris pengecekan manual admin & group ditiadakan karena sudah ditangani core
    const action = args[0]?.toLowerCase();
    const targetPlugin = args[1]?.toLowerCase();

    // 1. Tampilkan daftar plugin jika tidak ada parameter lanjutan
    if (!action || action === 'list') {
      let listMsg = `*🛠️ PENGATURAN PLUGIN GRUP 🛠️*\n\n`;
      loader.plugins.forEach(pl => {
        if (pl.category === 'group') {
          const status = database.isPluginEnabled(m.from, pl.name) ? '🟢' : '🔴';
          listMsg += `${status} *${pl.name}*\n  _${pl.desc}_\n\n`;
        }
      });
      listMsg += `Format penggunaan:\n.plugin enable <nama-plugin>\n.plugin disable <nama-plugin>`;
      return m.reply(listMsg);
    }

    // 2. Aktifkan atau Nonaktifkan Plugin
    if (action === 'enable' || action === 'disable') {
      if (!targetPlugin) return m.reply('Harap masukkan nama plugin yang ingin Anda konfigurasi.');
      
      const pl = loader.plugins.get(targetPlugin);
      if (!pl || pl.category !== 'group') {
        return m.reply(`Plugin grup dengan nama "${targetPlugin}" tidak ditemukan.`);
      }

      const status = action === 'enable';
      database.setGroupPlugin(m.from, targetPlugin, status);

      return m.reply(`Berhasil ${status ? 'mengaktifkan' : 'menonaktifkan'} plugin *${targetPlugin}* untuk grup ini.`);
    }

    return m.reply('Aksi tidak valid. Gunakan: .plugin list / enable / disable');
  }
};
