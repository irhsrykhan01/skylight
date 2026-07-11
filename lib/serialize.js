import { extractMessageContent, jidDecode } from '@whiskeysockets/baileys';
import pkg from '@whiskeysockets/baileys';
import { decodeJid } from './utils.js';

const { generateWAMessageFromContent, proto } = pkg;

// --- UTILITY SMART FALLBACK MENU GENERATOR ---
async function sendSmartMenu(sock, jid, options, quotedMsg) {
  const { title, body, footer, sections, buttons } = options;
  const isGroup = jid.endsWith('@g.us');

  // PRIORITAS 1: Coba kirimkan Interactive Message (Native Flow) jika bukan di obrolan grup
  if (!isGroup) {
    try {
      const interactiveButtons = [];
      
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
      
      if (sections && sections.length > 0) {
        interactiveButtons.push({
          name: "single_select",
          buttonParamsJson: JSON.stringify({
            title: title || "Pilih Menu",
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
        return true;
      }
    } catch (err) {
      // Gagal Native Flow, otomatis turun ke prioritas berikutnya
    }
  }

  // PRIORITAS 2: Coba kirimkan Legacy Buttons jika tombol didefinisikan
  if (buttons && buttons.length > 0) {
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
      // Abaikan dan turun ke prioritas berikutnya
    }
  }

  // PRIORITAS 3: Coba kirimkan Legacy List Message jika sections didefinisikan
  if (sections && sections.length > 0) {
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
        buttonText: title || "Pilih Menu",
        sections: legacySections
      }, { quoted: quotedMsg });
      return true;
    } catch (err) {
      // Gagal Legacy List, lanjut ke Text Fallback
    }
  }

  // PRIORITAS 4: Text Fallback Formatted (Sangat andal & kompatibel di semua versi WA)
  let textFallback = `*╭───『 ${title?.toUpperCase() || "MENU"} 』───⬡*\n`;
  if (body) textFallback += `│ ${body}\n│\n`;
  
  if (buttons && buttons.length > 0) {
    buttons.forEach((btn, idx) => {
      textFallback += `│ *[${idx + 1}]* ${btn.display_text}\n`;
      textFallback += `│    _Ketik: ${btn.id}_\n`;
    });
  }

  if (sections && sections.length > 0) {
    sections.forEach(sec => {
      textFallback += `├─『 *${sec.title?.toUpperCase() || "SEKSI MENU"}* 』\n`;
      sec.rows.forEach(row => {
        textFallback += `│  ▫️ *${row.title}*\n`;
        if (row.description) textFallback += `│     _${row.description}_\n`;
        textFallback += `│     _Ketik: ${row.id}_\n`;
      });
      textFallback += `│\n`;
    });
  }
  
  if (footer) textFallback += `│\n│ _${footer}_\n`;
  textFallback += `╰────────────────────⬡`;

  await sock.sendMessage(jid, { text: textFallback }, { quoted: quotedMsg });
  return true;
}

export async function serialize(sock, msg) {
  if (!msg.message) return null;

  const m = {};
  m.raw = msg;
  m.key = msg.key;
  m.id = msg.key.id;
  m.from = msg.key.remoteJid;
  m.isGroup = m.from.endsWith('@g.us');
  m.sender = decodeJid(m.isGroup ? msg.key.participant : m.from);
  m.pushName = msg.pushName || 'User';

  const messageContent = extractMessageContent(msg.message);
  if (!messageContent) return null;

  const messageTypes = Object.keys(messageContent);
  m.type = messageTypes.find(t => t !== 'messageContextInfo' && t !== 'senderKeyDistributionMessage') || messageTypes[0];

  const content = messageContent[m.type];
  m.body = '';

  if (m.type === 'conversation') {
    m.body = content;
  } else if (m.type === 'extendedTextMessage') {
    m.body = content.text;
  } else if (m.type === 'imageMessage' || m.type === 'videoMessage') {
    m.body = content.caption;
  } else if (m.type === 'buttonsResponseMessage') {
    m.body = content.selectedButtonId;
  } else if (m.type === 'templateButtonReplyMessage') {
    m.body = content.selectedId;
  } else if (m.type === 'interactiveResponseMessage') { // Tambahan pembaca respon tombol interaktif
    try {
      const response = JSON.parse(content.nativeFlowResponseMessage?.paramsJson);
      m.body = response.id || '';
    } catch {
      m.body = '';
    }
  }

  m.body = typeof m.body === 'string' ? m.body : '';

  m.reply = async (text, options = {}) => {
    return sock.sendMessage(m.from, { text, ...options }, { quoted: msg });
  };

  m.react = async (emoji) => {
    return sock.sendMessage(m.from, {
      react: { text: emoji, key: msg.key }
    });
  };

  // --- SMART FALLBACK MENU API UNTUK DEVELOPER ---
  m.menu = async (options) => {
    return sendSmartMenu(sock, m.from, options, msg);
  };

  return m;
    }
