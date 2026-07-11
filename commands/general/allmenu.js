import loader from '../../src/core/loader.js';
import config from '../../config.js';
import { renderCategoryMenu, categoryOrder } from './menu.js';

export default {
  name: 'allmenu',
  alias: ['allhelp'],
  category: 'general',
  desc: 'Menampilkan seluruh kategori komando beserta daftarnya.',
  async execute(m, { prefix }) {
    await m.react('📚');
    
    // Kelompokkan komando secara otomatis berdasarkan kategori metadata
    const categoryMap = {};
    loader.commands.forEach(cmd => {
      const cat = (cmd.category || 'general').toLowerCase().trim();
      if (!categoryMap[cat]) categoryMap[cat] = [];
      categoryMap[cat].push(cmd);
    });

    let menuText = `╭───『 *${config.botName.toUpperCase()} ALL MENU* 』───⬡\n\n`;
    
    // Perulangan dinamis mengikuti prioritas urutan kategori framework
    categoryOrder.forEach(catName => {
      const cmds = categoryMap[catName];
      if (cmds && cmds.length > 0) {
        menuText += renderCategoryMenu(prefix, catName, cmds) + '\n';
      }
    });

    menuText += `╰────────────────────⬡`;
    await m.reply(menuText);
    await m.react('✅');
  }
};
