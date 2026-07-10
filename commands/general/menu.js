import loader from '../../src/core/loader.js';
import config from '../../config.js';
import { formatRuntime } from '../../lib/utils.js';

export default {
  name: 'menu',
  alias: ['help', 'h'],
  category: 'general',
  desc: 'Menampilkan menu bantuan dan informasi sistem.',
  async execute(m, { sock, prefix }) {
    // Memberikan reaksi jam pasir selagi menghitung data
    await m.react('⏳');

    // Menghitung latensi respon bot (Ping)
    const ping = Date.now() - (m.raw.messageTimestamp * 1000);
    const runtime = formatRuntime(process.uptime());
    const ram = (process.memoryUsage().rss / 1024 / 1024).toFixed(1);
    
    // Kelompokkan command berdasarkan kategorinya secara dinamis
    const categories = {};
    loader.commands.forEach(cmd => {
      const cat = cmd.category ? cmd.category.toUpperCase() : 'LAIN-LAIN';
      if (!categories[cat]) categories[cat] = [];
      categories[cat].push(cmd);
    });

    // Desain layout menu modern yang bersih
    let menuText = `╭───『 *${config.botName.toUpperCase()}* 』───⬡\n`;
    menuText += `│\n`;
    menuText += `│  *👤 Owner:* @${config.owner[0]}\n`;
    menuText += `│  *⏱️ Runtime:* ${runtime}\n`;
    menuText += `│  *⚡ Speed:* ${ping}ms\n`;
    menuText += `│  *💾 RAM:* ${ram} MB\n`;
    menuText += `│  *📂 Commands:* ${loader.commands.size}\n`;
    menuText += `│\n`;

    for (const [cat, cmds] of Object.entries(categories)) {
      menuText += `├─『 *${cat}* 』\n`;
      cmds.forEach(cmd => {
        menuText += `│  ▫️ *${prefix}${cmd.name}*\n`;
        if (cmd.desc) menuText += `│     _${cmd.desc}_\n`;
      });
      menuText += `│\n`;
    }

    menuText += `╰────────────────────⬡`;

    // Kirim pesan dengan tag owner
    await sock.sendMessage(m.from, {
      text: menuText,
      mentions: [config.owner[0] + '@s.whatsapp.net']
    }, { quoted: m.raw });

    await m.react('✅');
  }
};
