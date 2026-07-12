import { extractMessageContent } from '@whiskeysockets/baileys';
import { decodeJid } from './utils.js';
import interactiveManager from './interactiveManager.js'; // Import manager terpusat

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
  } else if (m.type === 'interactiveResponseMessage') { 
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

  // --- STANDARD INTERACTIVE MENU API UNTUK DEVELOPER (Smart Fallback Terpusat) ---
  m.menu = async (options) => {
    return interactiveManager.menu(sock, m.from, options, msg);
  };

  m.list = async (options) => {
    return interactiveManager.list(sock, m.from, options, msg);
  };

  m.buttons = async (options) => {
    return interactiveManager.buttons(sock, m.from, options, msg);
  };

  m.interactive = async (options) => {
    return interactiveManager.sendInteractive(sock, m.from, options, msg);
  };

  return m;
}
