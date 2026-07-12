import pkg from '@whiskeysockets/baileys';
import config from '../config.js';

const { generateWAMessageFromContent, proto } = pkg;

/**
 * Membangun tampilan Text Fallback modern yang sangat rapi
 * @param {Object} options - Parameter kustom menu
 * @returns {String} - Hasil format teks menu
 */
function buildTextFallback({ title, body, footer, sections, buttons }) {
  let text = `*╭───『 ${title?.toUpperCase() || "MENU"} 』───⬡*\n`;
  if (body) text += `│ ${body}\n│\n`;

  // Format tombol menjadi teks berangka
  if (buttons && buttons.length > 0) {
    buttons.forEach((btn, idx) => {
      text += `│ *🟢 [Tombol ${idx + 1}]* ${btn.display_text}\n`;
      text += `│    _Ketik perintah: ${btn.id}_\n`;
    });
  }

  // Format list section menjadi teks berbutir
  if (sections && sections.length > 0) {
    sections.forEach(sec => {
      text += `├─『 *${sec.title?.toUpperCase() || "SEKSI MENU"}* 』\n`;
      sec.rows.forEach(row => {
        text += `│  ▫️ *${row.title}*\n`;
        if (row.description) text += `│     _${row.description}_\n`;
        text += `│     _Ketik perintah: ${row.id}_\n`;
      });
      text += `│\n`;
    });
  }
  
  if (footer) text += `│\n│ _${footer}_\n`;
  text += `╰────────────────────⬡`;
  return text;
}

class InteractiveManager {
  /**
   * Fungsi Pengirim Inti dengan Alur Smart Fallback otomatis
   * Prioritas: Native Flow -> Legacy Buttons -> Legacy List -> Text Fallback
   */
  async sendInteractive(sock, jid, options, quotedMsg) {
    const { title, body, footer, buttonText, sections, buttons } = options;
    const isGroup = jid.endsWith('@g.us');

    // PRIORITAS 1: Coba Native Flow (Hanya jika diset true di config dan bukan di grup)
    // WhatsApp Personal melarang pengiriman Native Flow di obrolan grup secara diam-diam (silent-reject)
    if (config.useInteractiveMenu && !isGroup) {
      try {
        const interactiveButtons = [];

        // 1. Parsing Quick Reply Buttons
        if (buttons && buttons.length > 0) {
          buttons.forEach(btn => {
            interactiveButtons.push({
              name: "quick_reply",
              buttonParamsJson: JSON.stringify({
                display_text: btn.display_text,
                id: btn.id
              })
            });
          });
        }

        // 2. Parsing Single Select List
        if (sections && sections.length > 0) {
          interactiveButtons.push({
            name: "single_select",
            buttonParamsJson: JSON.stringify({
              title: buttonText || "Pilih Menu",
              sections: sections.map(sec => ({
                title: sec.title || "",
                rows: sec.rows.map(row => ({
                  title: row.title,
                  id: row.id,
                  description: row.description || ""
                }))
              }))
            })
          });
        }

        if (interactiveButtons.length > 0) {
          const msg = generateWAMessageFromContent(jid, {
            viewOnceMessage: {
              message: {
                messageContextInfo: {
                  deviceListMetadata: {},
                  deviceListMetadataVersion: 2
                },
                interactiveMessage: proto.Message.InteractiveMessage.create({
                  body: proto.Message.InteractiveMessage.Body.create({ text: body || "" }),
                  footer: proto.Message.InteractiveMessage.Footer.create({ text: footer || "" }),
                  header: proto.Message.InteractiveMessage.Header.create({
                    title: title || "",
                    hasMediaAttachment: false
                  }),
                  nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.create({
                    buttons: interactiveButtons
                  })
                })
              }
            }
          }, { quoted: quotedMsg });

          await sock.relayMessage(jid, msg.message, { messageId: msg.key.id });
          return true; // Sukses mengirimkan Native Flow
        }
      } catch (err) {
        // Gagal, otomatis beralih ke legacy fallback
      }
    }

    // PRIORITAS 2: Coba Legacy Buttons Message (Untuk komponen Tombol)
    if (buttons && buttons.length > 0 && !isGroup) {
      try {
        const legacyButtons = buttons.map(btn => ({
          buttonId: btn.id,
          buttonText: { displayText: btn.display_text },
          type: 1
        }));

        await sock.sendMessage(jid, {
          text: body || "",
          footer: footer || "",
          buttons: legacyButtons,
          headerType: 1
        }, { quoted: quotedMsg });
        return true;
      } catch (err) {
        // Gagal, otomatis beralih ke legacy list
      }
    }

    // PRIORITAS 3: Coba Legacy List Message (Untuk komponen List)
    if (sections && sections.length > 0 && !isGroup) {
      try {
        const legacySections = sections.map(sec => ({
          title: sec.title || "",
          rows: sec.rows.map(row => ({
            title: row.title,
            rowId: row.id,
            description: row.description || ""
          }))
        }));

        await sock.sendMessage(jid, {
          text: body || "",
          footer: footer || "",
          title: title || "",
          buttonText: buttonText || "Pilih Menu",
          sections: legacySections
        }, { quoted: quotedMsg });
        return true;
      } catch (err) {
        // Gagal, lanjut ke Text Fallback
      }
    }

    // PRIORITAS 4 (FALLBACK AKHIR): Mengirimkan Text Fallback Formatted
    // Metode ini 100% stabil, aman, dan kompatibel di semua versi WA, termasuk di dalam grup
    const textFallback = buildTextFallback(options);
    await sock.sendMessage(jid, { text: textFallback }, { quoted: quotedMsg });
    return true;
  }

  // Shorthand cerdas serbaguna
  async menu(sock, jid, options, quotedMsg) {
    return this.sendInteractive(sock, jid, options, quotedMsg);
  }

  // Shorthand pemaksaan tipe List
  async list(sock, jid, options, quotedMsg) {
    const { title, body, footer, buttonText, sections } = options;
    return this.sendInteractive(sock, jid, { title, body, footer, buttonText, sections }, quotedMsg);
  }

  // Shorthand pemaksaan tipe Buttons
  async buttons(sock, jid, options, quotedMsg) {
    const { title, body, footer, buttons } = options;
    return this.sendInteractive(sock, jid, { title, body, footer, buttons }, quotedMsg);
  }
}

export default new InteractiveManager();
