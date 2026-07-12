import database from '../../lib/database.js';

const validPlugins = ['antilink', 'antispam', 'antitagall', 'antitagsw', 'welcome', 'goodbye', 'antidelete', 'antitoxic'];

export default {
  name: 'off',
  category: 'group',
  desc: 'Menonaktifkan plugin moderasi di grup ini.',
  groupOnly: true,
  adminOnly: true,
  async execute(m, { args }) {
    const pl = args[0]?.toLowerCase().trim();
    if (!pl) return m.reply(`Harap masukkan nama fitur.\nContoh: *.off antilink*\n\nFitur yang tersedia: \n• ${validPlugins.join('\n• ')}`);
    
    if (!validPlugins.includes(pl)) {
      return m.reply(`Fitur "${pl}" tidak ditemukan.\nFitur yang tersedia: \n• ${validPlugins.join('\n• ')}`);
    }

    database.setGroupPlugin(m.from, pl, false);
    await m.react('🔴');
    return m.reply(`🔴 Fitur *${pl}* telah dinonaktifkan untuk grup ini.`);
  }
};
