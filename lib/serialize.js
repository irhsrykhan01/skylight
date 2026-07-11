import { extractMessageContent } from '@whiskeysockets/baileys';
import { decodeJid } from './utils.js'; // Import terpusat

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

  return m;
}
