import loader from '../../src/core/loader.js';
import config from '../../config.js';
import { formatRuntime } from '../../lib/utils.js';

// Urutan prioritas kategori statis yang rapi
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

// Dekorasi emoji dan label huruf kapital persis seperti template Anda
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

// Fungsi pembangun kotak menu klasik sesuai contoh persis
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
  alias: ['menu', 'help', 'h', 'allhelp'], // Alias pemetaan pemanggil otomatis
  category: 'general',
  desc: 'Menampilkan seluruh perintah bot dengan desain klasik.',
  async execute(m, { prefix }) {
    await m.react('📖');

    // Menghitung ping latensi secara aman (Bypass NaN)
    const timestamp = m.raw.messageTimestamp?.toNumber 
      ? m.raw.messageTimestamp.toNumber() 
      : Number(m.raw.messageTimestamp);

    const ping = Date.now() - (timestamp * 1000);
    const runtime = formatRuntime(process.uptime());

    // Mengelompokkan komando secara otomatis berdasarkan category metadata
    const categoryMap = {};
    loader.commands.forEach(cmd => {
      const cat = (cmd.category || 'general').toLowerCase().trim();
      if (!categoryMap[cat]) categoryMap[cat] = [];
      categoryMap[cat].push(cmd);
    });

    // Desain Header Info Atas Minimalis
    let menuText = `╭───『 *${config.botName.toUpperCase()} MENU* 』───⬡\n`;
    menuText += `│  ⏱️ *Runtime :* ${runtime}\n`;
    menuText += `│  ⚡ *Speed   :* ${ping}ms\n`;
    menuText += `╰────────────────────⬡\n\n`;

    // Penyusunan kategori menu dinamis mengikuti template yang Anda inginkan
    categoryOrder.forEach(catName => {
      const cmds = categoryMap[catName];
      if (cmds && cmds.length > 0) {
        menuText += renderCategoryMenu(catName, cmds) + '\n';
      }
    });

    await m.reply(menuText.trim());
    await m.react('✅');
  }
};
