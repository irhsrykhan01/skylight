import pkg from '@whiskeysockets/baileys';
import { getGroupAdmins, decodeJid } from '../../lib/utils.js';
import database from '../../lib/database.js';
import config from '../../config.js';

const { generateWAMessageFromContent, proto } = pkg;

// Daftar plugin moderasi grup yang disetujui oleh spesifikasi
const groupPlugins = [
  { name: "anti-link", label: "Anti Link" },
  { name: "anti-spam", label: "Anti Spam" },
  { name: "anti-tagall", label: "Anti Tag All" },
  { name: "anti-tagsw", label: "Anti Tag SW" },
  { name: "welcome", label: "Welcome" },
  { name: "goodbye", label: "Goodbye" },
  { name: "anti-delete", label: "Anti Delete" },
  { name: "anti-toxic", label: "Anti Toxic" }
];

export default {
  name: "settings",
  alias: ["set", "setplugin"],
  category: "group",
  desc: "Mengelola pengaturan fitur moderasi grup.",
  groupOnly: true,
  adminOnly: true,
  async execute(m, { sock, args }) {
    const subCommand = args[0]?.toLowerCase();

    // 1. Logika Mengubah Status Fitur (.setplugin on/off <plugin-name>)
    if (subCommand === 'on' || subCommand === 'off') {
      const targetPl = args[1]?.toLowerCase();
      const plExists = groupPlugins.find(p => p.name === targetPl);
      if (!plExists) return m.reply(`Plugin "${targetPl}" tidak ditemukan.`);

      const status = subCommand === 'on';
      database.setGroupPlugin(m.from, targetPl, status);
      await m.react(status ? '🟢' : '🔴');
      return m.reply(`Berhasil mengubah status *${plExists.label}* menjadi *${status ? '🟢 ON' : '🔴 OFF'}* untuk grup ini.`);
    }

    // 2. Logika Pemrosesan Baris yang dipilih dari List (.setplugin select <plugin-name>)
    if (subCommand === 'select') {
      const targetPl = args[1]?.toLowerCase();
      const plExists = groupPlugins.find(p => p.name === targetPl);
      if (!plExists) return m.reply(`Plugin "${targetPl}" tidak ditemukan.`);

      const isEnabled = database.isPluginEnabled(m.from, targetPl);
      const currentStatusText = isEnabled ? "🟢 ON (Aktif)" : "🔴 OFF (Nonaktif)";

      // Kirim Reply Buttons (Quick Reply Native Flow)
      try {
        const buttonMsg = generateWAMessageFromContent(m.from, {
          viewOnceMessage: {
            message: {
              messageContextInfo: {
                deviceListMetadata: {},
                deviceListMetadataVersion: 2
              },
              interactiveMessage: proto.Message.InteractiveMessage.create({
                body: proto.Message.InteractiveMessage.Body.create({
                  text: `Atur status untuk fitur *${plExists.label}* di grup ini.\n\n*Status saat ini:* ${currentStatusText}`
                }),
                footer: proto.Message.InteractiveMessage.Footer.create({
                  text: "SkyLight Settings System"
                }),
                header: proto.Message.InteractiveMessage.Header.create({
                  title: `⚙️ PENGATURAN ${plExists.label.toUpperCase()}`,
                  hasMediaAttachment: false
                }),
                nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.create({
                  buttons: [
                    {
                      name: "quick_reply",
                      buttonParamsJson: JSON.stringify({
                        display_text: "🟢 ON",
                        id: `.setplugin on ${targetPl}`
                      })
                    },
                    {
                      name: "quick_reply",
                      buttonParamsJson: JSON.stringify({
                        display_text: "🔴 OFF",
                        id: `.setplugin off ${targetPl}`
                      })
                    }
                  ]
                })
              })
            }
          }
        }, { quoted: m.raw });

        return await sock.relayMessage(m.from, buttonMsg.message, { messageId: buttonMsg.key.id });
      } catch (err) {
        // Fallback jika tombol interaktif gagal
        return m.reply(`Silakan ketik:\n• *.setplugin on ${targetPl}* untuk mengaktifkan.\n• *.setplugin off ${targetPl}* untuk menonaktifkan.`);
      }
    }

    // 3. Menampilkan Menu Utama Pengaturan (List Message)
    try {
      const rows = groupPlugins.map(pl => {
        const isEnabled = database.isPluginEnabled(m.from, pl.name);
        const statusEmoji = isEnabled ? "🟢" : "🔴";
        return {
          title: `${statusEmoji} ${pl.label}`,
          id: `.setplugin select ${pl.name}`,
          description: `Ubah konfigurasi status fitur ${pl.label}`
        };
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
                text: "Pilih salah satu fitur di bawah ini untuk mengaktifkan atau menonaktifkannya di grup ini:"
              }),
              footer: proto.Message.InteractiveMessage.Footer.create({
                text: "SkyLight Moderation Tools"
              }),
              header: proto.Message.InteractiveMessage.Header.create({
                title: "🛡️ PENGATURAN MODERASI GRUP",
                hasMediaAttachment: false
              }),
              nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.create({
                buttons: [
                  {
                    name: "single_select",
                    buttonParamsJson: JSON.stringify({
                      title: "Buka Menu Fitur",
                      sections: [
                        {
                          title: "FITUR MODERASI",
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
      // Fallback menu teks terstruktur
      let textMenu = `*🛡️ PENGATURAN MODERASI GRUP (FALLBACK) 🛡️*\n\n`;
      groupPlugins.forEach(pl => {
        const isEnabled = database.isPluginEnabled(m.from, pl.name);
        const statusEmoji = isEnabled ? "🟢 ON" : "🔴 OFF";
        textMenu += `• *${pl.label}* - ${statusEmoji}\n  _Ketik: .setplugin select ${pl.name}_\n\n`;
      });
      return m.reply(textMenu);
    }
  }
};
