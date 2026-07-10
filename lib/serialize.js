import { jidDecode } from '@whiskeysockets/baileys';

export function decodeJid(jid) {
  if (!jid) return jid;
  if (/:\d+@/gi.test(jid)) {
    const decode = jidDecode(jid) || {};
    return decode.user && decode.server && `${decode.user}@${decode.server}` || jid;
  }
  return jid;
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

  // Mendeteksi tipe pesan secara aman
  const messageTypes = Object.keys(msg.message);
  m.type = messageTypes[0] === 'senderKeyDistributionMessage' ? messageTypes[1] : messageTypes[0];

  const messageContent = msg.message[m.type];
  m.body = '';

  // Mengekstrak teks dari berbagai tipe format pesan WhatsApp
  if (m.type === 'conversation') {
    m.body = messageContent;
  } else if (m.type === 'extendedTextMessage') {
    m.body = messageContent.text;
  } else if (m.type === 'imageMessage' || m.type === 'videoMessage') {
    m.body = messageContent.caption;
  }

  m.body = typeof m.body === 'string' ? m.body : '';

  // Helper reply instan
  m.reply = async (text, options = {}) => {
    return sock.sendMessage(m.from, { text, ...options }, { quoted: msg });
  };

  // Helper react instan
  m.react = async (emoji) => {
    return sock.sendMessage(m.from, {
      react: { text: emoji, key: msg.key }
    });
  };

  return m;
}
