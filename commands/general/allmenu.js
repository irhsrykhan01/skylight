import loader from '../../src/core/loader.js';
import config from '../../config.js';
import { formatRuntime } from '../../lib/utils.js';
import database from '../../lib/database.js'; // Import database

const categoryOrder = [
  "general",
  "group",
  "admin tools",
  "ai",
  "downloader",
  "sticker",
  "tools",
  "fun",
  "owner",
  "info"
];

const categoryMeta = {
  "general": { label: "GENERAL", emoji: "🚀" },
  "group": { label: "GROUP", emoji: "👥" },
  "admin tools": { label: "ADMIN TOOLS", emoji: "🛡️" },
  "ai": { label: "AI", emoji: "🤖" },
  "downloader": { label: "DOWNLOADER", emoji: "📥" },
  "sticker": { label: "STICKER", emoji: "🎨" },
  "tools": { label: "TOOLS", emoji: "🛠️" },
  "fun": { label: "FUN", emoji: "🎮" },
  "owner": { label: "OWNER", emoji: "⚙️" },
  "info": { label: "INFO", emoji: "📊" }
};

function renderCategoryMenu(categoryName, commandsList) {
  const meta = categoryMeta[categoryName] || { label: categoryName.toUpperCase(), emoji: "🚀" };
  let block = `│ ${meta.emoji}┊${meta.label}\n`;
  block += `│╭─────────╯\n`;
  commandsList.forEach(cmd => {
    block += `││• ${cmd.name}\n`;
  });
  block += `│╰───────── ·  · ✦\n`;
  return block;
}

export default {
  name: 'allmenu',
  alias: ['menu', 'help', 'h', 'allhelp'],
  category: 'general',
  desc: 'Menampilkan seluruh perintah bot dengan desain klasik.',
  async execute(m, { prefix }) {
    await m.react('📖');

    const timestamp = m.raw.messageTimestamp?.toNumber 
      ? m.raw.messageTimestamp.toNumber() 
      : Number(m.raw.messageTimestamp);

    const ping = Date.now() - (timestamp * 1000);
    const runtime = formatRuntime(process.uptime());

    const categoryMap = {};
    loader.commands.forEach(cmd => {
      const cat = (cmd.category || 'general').toLowerCase().trim();
      if (!categoryMap[cat]) categoryMap[cat] = [];
      categoryMap[cat].push(cmd);
    });

    let menuText = `╭───『 *${config.botName.toUpperCase()} MENU* 』───⬡\n`;
    menuText += `│  ⏱️ *Runtime :* ${runtime}\n`;
    menuText += `│  ⚡ *Speed   :* ${ping}ms\n`;
    menuText += `╰────────────────────⬡\n\n`;

    // 1. Menu Perintah Standard
    categoryOrder.forEach(catName => {
      const cmds = categoryMap[catName];
      if (cmds && cmds.length > 0) {
        menuText += renderCategoryMenu(catName, cmds) + '\n';
      }
    });

    // 2. INTEGRASI DINAMIS: GROUP SETTINGS STATUS (Stage 17)
    if (m.isGroup) {
      menuText += `│ ⚙️┊GROUP SETTINGS\n`;
      menuText += `│╭─────────╯\n`;
      const groupPluginsList = [
        { name: 'antilink', label: 'Anti Link' },
        { name: 'antispam', label: 'Anti Spam' },
        { name: 'antitagall', label: 'Anti Tag All' },
        { name: 'antitagsw', label: 'Anti Tag SW' },
        { name: 'welcome', label: 'Welcome' },
        { name: 'goodbye', label: 'Goodbye' },
        { name: 'antidelete', label: 'Anti Delete' },
        { name: 'antitoxic', label: 'Anti Toxic' }
      ];
      groupPluginsList.forEach(pl => {
        const isEnabled = database.isPluginEnabled(m.from, pl.name);
        const statusEmoji = isEnabled ? '🟢 ON' : '🔴 OFF';
        menuText += `││• ${pl.label} : ${statusEmoji}\n`;
      });
      menuText += `│╰───────── ·  · ✦\n\n`;
    }

    await m.reply(menuText.trim());
    await m.react('✅');
  }
};
