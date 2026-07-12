import database from '../../lib/database.js';

const validPlugins = ['antilink', 'antispam', 'antitagall', 'antitagsw', 'welcome', 'goodbye', 'antidelete', 'antitoxic'];

export default {
  name: 'on',
  category: 'group',
  desc: 'Mengaktifkan plugin moderasi di grup ini.',
  groupOnly: true,
  adminOnly: true,
  async execute(m, { args }) {
    const pl = args[0]?.toLowerCase().trim();
    if (!pl) return m.reply(`Harap masukkan nama fitur.\nContoh: *.on antilink*\n\nFitur yang tersedia: \n• ${validPlugins.join('\n• ')}`);
    
    if (!validPlugins.includes(pl)) {
      return m.reply(`Fitur "${pl}" tidak ditemukan.\nFitur yang tersedia: \n• ${validPlugins.join('\n• ')}`);
    }

    database.setGroupPlugin(m.from, pl, true);
    await m.react('🟢');
    return m.reply(`🟢 Fitur *${pl}* telah diaktifkan untuk grup ini.`);
  }
};
