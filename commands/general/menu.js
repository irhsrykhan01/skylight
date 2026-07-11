import loader from '../../src/core/loader.js';
import config from '../../config.js';
import { formatRuntime } from '../../lib/utils.js';
import { categoryOrder, categoryMeta, renderCategoryMenu } from '../../lib/menuHelper.js'; // Impor dari helper luar

export default {
  name: 'menu',
  alias: ['help', 'h'],
  category: 'general',
  desc: 'Menampilkan menu bantuan interaktif berdasarkan kategori.',
  async execute(m, { sock, args, prefix }) {
    const categoryArg = args.join(' ').toLowerCase().trim();

    // 1. Logika penayangan spesifik kategori (.menu <kategori>)
    if (categoryArg) {
      if (categoryArg === 'all') {
        const allmenuCmd = loader.commands.get('allmenu');
        if (allmenuCmd) return allmenuCmd.execute(m, { sock, args, prefix });
      }

      const validCategory = categoryOrder.find(cat => cat === categoryArg);
      if (!validCategory) {
        return m.reply(`Kategori "${categoryArg}" tidak ditemukan.\nGunakan: *.menu* untuk membuka list kategori.`);
      }

      const cmds = [];
      loader.commands.forEach(cmd => {
        const cat = (cmd.category || 'general').toLowerCase().trim();
        if (cat === validCategory) {
          cmds.push(cmd);
        }
      });

      if (cmds.length === 0) {
        return m.reply(`Belum ada perintah yang terdaftar di kategori *${categoryMeta[validCategory]?.label || validCategory}*.`);
      }

      await m.react('⏳');
      let specMenu = `╭───『 *${config.botName.toUpperCase()} MENU* 』───⬡\n\n`;
      specMenu += renderCategoryMenu(prefix, validCategory, cmds);
      specMenu += `\n╰────────────────────⬡`;
      
      await m.reply(specMenu);
      return await m.react('✅');
    }

    // 2. Tampilkan Menu Utama berbasis Smart Fallback
    const rows = categoryOrder.map(cat => {
      const meta = categoryMeta[cat] || { label: cat, emoji: "▫️", desc: "" };
      return {
        title: `${meta.emoji} ${meta.label}`,
        id: `.menu ${cat}`,
        description: meta.desc
      };
    });

    rows.push({
      title: "📚 All Menu",
      id: ".allmenu",
      description: "Tampilkan seluruh kategori komando"
    });

    await m.menu({
      title: `🤖 MENU UTAMA ${config.botName.toUpperCase()}`,
      body: "Pilih salah satu kategori menu di bawah ini untuk melihat daftar perintah khusus:",
      footer: "SkyLight Interactive Menu",
      sections: [
        {
          title: "KATEGORI UTAMA",
          rows: rows
        }
      ]
    });
  }
};
