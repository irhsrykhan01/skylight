import pkg from '@whiskeysockets/baileys';
import loader from '../../src/core/loader.js';
import config from '../../config.js';
import { formatRuntime } from '../../lib/utils.js';

const { generateWAMessageFromContent, proto } = pkg;

// Urutan kategori tetap teratur mengikuti definisi framework
export const categoryOrder = [
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

// Metadata representasi kategori (Emoji & Label)
export const categoryMeta = {
  "general": { label: "General Menu", emoji: "✨", desc: "Perintah umum & bantuan" },
  "group": { label: "Group Menu", emoji: "👥", desc: "Perintah obrolan grup" },
  "admin tools": { label: "Admin Tools Menu", emoji: "🛡️", desc: "Alat moderasi admin" },
  "ai": { label: "AI Menu", emoji: "🤖", desc: "Perintah asisten pintar AI" },
  "downloader": { label: "Downloader Menu", emoji: "📥", desc: "Perintah pengunduh media" },
  "sticker": { label: "Sticker Menu", emoji: "🎨", desc: "Pembuatan & pengubah stiker" },
  "tools": { label: "Tools Menu", emoji: "🛠️", desc: "Peralatan utilitas praktis" },
  "fun": { label: "Fun Menu", emoji: "🎮", desc: "Fitur hiburan & game" },
  "owner": { label: "Owner Menu", emoji: "⚙️", desc: "Fitur kontrol penuh owner" },
  "info": { label: "Info Menu", emoji: "📊", desc: "Informasi statistik bot" }
};

// Fungsi pembangun template kotak list menu (All Menu & Spesifik)
export function renderCategoryMenu(prefix, categoryName, commandsList) {
  const meta = categoryMeta[categoryName] || { label: `${categoryName.toUpperCase()} Menu`, emoji: "▫️" };
  let block = `│ ${meta.emoji}┊ ${meta.label}\n`;
  block += `│╭──────────────────╯\n`;
  commandsList.forEach(cmd => {
    block += `││• ${cmd.name}\n`;
  });
  block += `│╰────────────────── ·  · ✦\n`;
  return block;
}

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

    // 2. Tampilkan Menu Utama menggunakan List Message (Native Flow)
    try {
      const rows = categoryOrder.map(cat => {
        const meta = categoryMeta[cat] || { label: cat, emoji: "▫️", desc: "" };
        return {
          title: `${meta.emoji} ${meta.label}`,
          id: `.menu ${cat}`,
          description: meta.desc
        };
      });

      // Tambahkan opsi All Menu di bagian paling bawah
      rows.push({
        title: "📚 All Menu",
        id: ".allmenu",
        description: "Tampilkan seluruh kategori komando"
      });

      const listMsg = generateWAMessageFromContent(m.from, {
        viewOnceMessage: {
          message: {
            messageContextInfo: {
              deviceListMetadata: {},
              deviceListMetadataVersion: 2
            },
            interactiveMessage: proto.Message.InteractiveMessage.create({
              body: proto.Message.InteractiveMessage.Body.create({
                text: "Pilih salah satu kategori menu di bawah ini untuk melihat daftar perintah khusus:"
              }),
              footer: proto.Message.InteractiveMessage.Footer.create({
                text: "SkyLight Interactive Menu"
              }),
              header: proto.Message.InteractiveMessage.Header.create({
                title: `🤖 MENU UTAMA ${config.botName.toUpperCase()}`,
                hasMediaAttachment: false
              }),
              nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.create({
                buttons: [
                  {
                    name: "single_select",
                    buttonParamsJson: JSON.stringify({
                      title: "Klik di Sini",
                      sections: [
                        {
                          title: "KATEGORI UTAMA",
                          rows: rows
                        }
                      ]
                    })
                  }
                ]
              })
            })
          }
        }
      }, { quoted: m.raw });

      return await sock.relayMessage(m.from, listMsg.message, { messageId: listMsg.key.id });
    } catch (err) {
      // Fallback menu teks terstruktur jika List Message tidak didukung oleh WA pengguna
      let textMenu = `╭───『 *MENU UTAMA (FALLBACK)* 』───⬡\n\n`;
      categoryOrder.forEach(cat => {
        const meta = categoryMeta[cat] || { label: cat, emoji: "▫️" };
        textMenu += `• *${meta.emoji} ${meta.label}* -> Ketik: *${prefix}menu ${cat}*\n`;
      });
      textMenu += `• *📚 All Menu* -> Ketik: *${prefix}allmenu*\n\n`;
      textMenu += `╰────────────────────⬡`;
      return m.reply(textMenu);
    }
  }
};
