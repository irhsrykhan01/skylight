import database from '../../lib/database.js';
import loader from '../../src/core/loader.js';
import { getGroupAdmins } from '../../lib/utils.js';
import config from '../../config.js';

export default {
  name: 'plugin',
  alias: ['pl'],
  category: 'group',
  desc: 'Mengaktifkan atau menonaktifkan plugin grup.',
  async execute(m, { sock, args }) {
    if (!m.isGroup) return m.reply('Perintah ini hanya dapat digunakan di dalam grup.');

    // Validasi wewenang: harus Admin Grup atau Owner Bot
    const admins = await getGroupAdmins(sock, m.from);
    const isOwner = config.owner.includes(m.sender.split('@')[0]);
    const isAdmin = admins.includes(m.sender);

    if (!isAdmin && !isOwner) {
      return m.reply('Hanya admin grup atau owner bot yang dapat menggunakan perintah ini.');
    }

    const action = args[0]?.toLowerCase();
    const targetPlugin = args[1]?.toLowerCase();

    // 1. Tampilkan daftar plugin jika tidak ada parameter lanjutan (.plugin)
    if (!action || action === 'list') {
      let listMsg = `*🛠️ PENGATURAN PLUGIN GRUP 🛠️*\n\n`;
      loader.plugins.forEach(pl => {
        if (pl.category === 'group') {
          const status = database.isPluginEnabled(m.from, pl.name) ? '🟢 Aktif' : '🔴 Nonaktif';
          listMsg += `• *${pl.name}* - ${status}\n  _${pl.desc}_\n\n`;
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
