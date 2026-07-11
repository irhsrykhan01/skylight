import loader from '../../src/core/loader.js';
import config from '../../config.js';
import { formatRuntime } from '../../lib/utils.js';
import database from '../../lib/database.js'; // Import database grup

export default {
  name: 'menu',
  alias: ['help', 'h'],
  category: 'general',
  desc: 'Menampilkan menu bantuan dan informasi sistem.',
  async execute(m, { sock, prefix }) {
    try {
      await m.react('⏳');

      const timestamp = m.raw.messageTimestamp?.toNumber 
        ? m.raw.messageTimestamp.toNumber() 
        : Number(m.raw.messageTimestamp);

      const ping = Date.now() - (timestamp * 1000);
      const runtime = formatRuntime(process.uptime());
      const ram = (process.memoryUsage().rss / 1024 / 1024).toFixed(1);
      
      // Kelompokkan command berdasarkan kategorinya
      const categories = {};
      loader.commands.forEach(cmd => {
        const cat = cmd.category ? cmd.category.toUpperCase() : 'LAIN-LAIN';
        if (!categories[cat]) categories[cat] = [];
        categories[cat].push(cmd);
      });

      // Desain layout menu modern
      let menuText = `╭───『 *${config.botName.toUpperCase()}* 』───⬡\n`;
      menuText += `│\n`;
      menuText += `│  *👤 Owner:* @${config.owner[0]}\n`;
      menuText += `│  *⏱️ Runtime:* ${runtime}\n`;
      menuText += `│  *⚡ Speed:* ${ping}ms\n`;
      menuText += `│  *💾 RAM:* ${ram} MB\n`;
      menuText += `│  *📂 Commands:* ${loader.commands.size}\n`;
      menuText += `│\n`;

      // 1. DAFTAR UTAMA PERINTAH (COMMANDS)
      for (const [cat, cmds] of Object.entries(categories)) {
        menuText += `├─『 *${cat}* 』\n`;
        cmds.forEach(cmd => {
          menuText += `│  ▫️ *${prefix}${cmd.name}*\n`;
          if (cmd.desc) menuText += `│     _${cmd.desc}_\n`;
        });
        menuText += `│\n`;
      }

      // 2. DAFTAR STATUS PLUGIN AKTIF (Hanya tampil jika diketik di dalam grup)
      if (m.isGroup) {
        menuText += `├─『 *PLUGINS GRUP* 』\n`;
        loader.plugins.forEach(pl => {
          if (pl.category === 'group') {
            const status = database.isPluginEnabled(m.from, pl.name) ? '🟢 Aktif' : '🔴 Nonaktif';
            menuText += `│  ${status} *${pl.name}*\n`;
            if (pl.desc) menuText += `│     _${pl.desc}_\n`;
          }
        });
        menuText += `│\n`;
      }

      menuText += `╰────────────────────⬡`;

      await sock.sendMessage(m.from, {
        text: menuText,
        mentions: [config.owner[0] + '@s.whatsapp.net']
      }, { quoted: m.raw });

      await m.react('✅');
    } catch (err) {
      console.error('Error saat menjalankan command menu:', err);
      await m.reply('Maaf, terjadi kesalahan internal saat memuat menu bantuan.');
    }
  }
};
