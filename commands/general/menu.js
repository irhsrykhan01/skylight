import loader from '../../src/core/loader.js';
import config from '../../config.js';
import { categoryOrder, categoryMeta, renderCategoryMenu } from '../../lib/menuHelper.js';

export default {
  name: 'menu',
  alias: ['help', 'h'],
  category: 'general',
  desc: 'Menampilkan menu bantuan interaktif berdasarkan kategori.',
  async execute(m, { sock, args, prefix }) {
    let categoryArg = args.join(' ').toLowerCase().trim();

    // MAP NAVIGASI ANGKA TERHADAP KATEGORI FRAMEWORK (Stage 17)
    const numberMapping = {
      "1": "general",
      "2": "group",
      "3": "admin tools",
      "4": "ai",
      "5": "downloader",
      "6": "sticker",
      "7": "tools",
      "8": "fun",
      "9": "owner",
      "10": "info"
    };

    if (numberMapping[categoryArg]) {
      categoryArg = numberMapping[categoryArg];
    }

    // 1. Logika penayangan spesifik kategori (.menu <kategori> atau .menu <angka>)
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

    // 2. Buat Data Baris untuk Generator Smart Fallback
    const rows = categoryOrder.map((cat, idx) => {
      const meta = categoryMeta[cat] || { label: cat, emoji: "▫️", desc: "" };
      return {
        title: `[${idx + 1}] ${meta.label}`, // Menyertakan penomoran indeks
        id: `.menu ${cat}`,
        description: meta.desc
      };
    });

    // Kirimkan menu menggunakan helper cerdas
    await m.menu({
      title: `🤖 MENU UTAMA ${config.botName.toUpperCase()}`,
      body: "Pilih salah satu kategori menu di bawah ini untuk melihat daftar perintah khusus:\n\n*Cara Akses Cepat:*\nKetik *.menu <angka_kategori>*\n_Contoh: *.menu 1* atau *.menu general*_",
      footer: "SkyLight Smart Fallback System",
      sections: [
        {
          title: "KATEGORI UTAMA",
          rows: rows
        }
      ]
    });
  }
};
