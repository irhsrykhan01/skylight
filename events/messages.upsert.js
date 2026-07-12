import { serialize } from '../lib/serialize.js';
import loader from '../src/core/loader.js';
import config from '../config.js';
import { logger } from '../src/core/logger.js';
import { calculateSimilarity, getGroupAdmins, isBotAdmin } from '../lib/utils.js';
import { checkPermissions } from '../src/core/permission.js';
import database from '../lib/database.js';
import store from '../lib/store.js';

// Memori pelacak pesan masuk untuk Anti-Spam
const userMsgTrack = new Map();
// Memori rate limit cooldown perintah biasa
const cooldowns = new Map();

// Daftar kata kotor blacklist lengkap untuk Anti-Toxic (Stage 17)
const toxicWords = [
  'anjing', 'babi', 'monyet', 'bangsat', 'kontol', 'memek', 'bajingan', 
  'goblok', 'tolol', 'bego', 'peler', 'ngentot', 'asu', 'jembut', 'croot',
  'bejad', 'keparat', 'brengsek', 'tai', 'perek', 'lonte', 'silit'
];

export default {
  name: 'messages.upsert',
  async execute(sock, chatUpdate) {
    try {
      if (chatUpdate.type !== 'notify') return;
      const rawMsg = chatUpdate.messages[0];
      if (!rawMsg) return;
      if (rawMsg.key && rawMsg.key.remoteJid === 'status@broadcast') return; 

      // --- 1. DETEKSI ANTI-DELETE ---
      const protocolMessage = rawMsg.message?.protocolMessage;
      if (protocolMessage && protocolMessage.type === 3) {
        const deletedId = protocolMessage.key.id;
        const targetChat = protocolMessage.key.remoteJid;
        
        if (targetChat.endsWith('@g.us') && database.isPluginEnabled(targetChat, 'anti-delete')) {
          const savedMsg = store.get(deletedId);
          if (savedMsg) {
            const senderJid = savedMsg.sender;
            const username = senderJid.split('@')[0];
            
            let alertText = `*🕊️ [ANTI-DELETE MESSAGE] 🕊️*\n\n`;
            alertText += `• *Nama:* ${savedMsg.pushName}\n`;
            alertText += `• *Kontak:* @${username}\n`;
            alertText += `• *Isi Pesan Terhapus:* \n\n"${savedMsg.body}"`;
            
            await sock.sendMessage(targetChat, {
              text: alertText,
              mentions: [senderJid]
            });
          }
        }
        return; 
      }

      // Serialisasi pesan masuk
      const m = await serialize(sock, rawMsg);
      if (!m) return;

      logger.info(`Pesan Masuk: [${m.pushName}] -> ${m.body || `[Tipe: ${m.type}]`}`);

      // Simpan pesan teks biasa untuk kebutuhan Anti-Delete
      if (m.body) {
        store.save(m);
      }

      // --- 2. SISTEM MODERASI GRUP AUTOMATIS (Stage 17) ---
      if (m.isGroup) {
        const admins = await getGroupAdmins(sock, m.from);
        const isOwner = config.owner.includes(m.sender.split('@')[0]);
        const isAdmin = admins.includes(m.sender);
        const botAdmin = await isBotAdmin(sock, m.from); // Validasi kebal bug admin

        // A. ANTI-SPAM (Berjalan independen terpisah dari cooldown perintah)
        if (database.isPluginEnabled(m.from, 'antispam') && !isAdmin && !isOwner) {
          const now = Date.now();
          if (!userMsgTrack.has(m.sender)) userMsgTrack.set(m.sender, []);
          const timestamps = userMsgTrack.get(m.sender);
          timestamps.push(now);
          const filtered = timestamps.filter(t => now - t < 5000); // 5 detik terakhir
          userMsgTrack.set(m.sender, filtered);
          
          if (filtered.length >= 4) { // Lebih dari 4 pesan dalam 5 detik
            if (botAdmin) {
              await sock.sendMessage(m.from, { delete: m.key });
            }
            await m.reply(`*⚠️ [ANTI-SPAM] ⚠️*\nJangan melakukan spamming di grup ini!\nTag Pengirim: @${m.sender.split('@')[0]}`, { mentions: [m.sender] });
            return;
          }
        }

        // B. ANTI-LINK
        if (database.isPluginEnabled(m.from, 'antilink') && !isAdmin && !isOwner) {
          const waLinkRegex = /chat\.whatsapp\.com\/[a-zA-Z0-9]{20,26}|http|https/i;
          if (waLinkRegex.test(m.body)) {
            if (botAdmin) {
              await sock.sendMessage(m.from, { delete: m.key });
            }
            await m.reply(`*⚠️ [ANTI-LINK] ⚠️*\nTautan dilarang keras di grup ini!\nTag Pengirim: @${m.sender.split('@')[0]}`, { mentions: [m.sender] });
            return;
          }
        }

        // C. ANTI-TOXIC (Blacklist kata kotor)
        if (database.isPluginEnabled(m.from, 'antitoxic') && !isAdmin && !isOwner) {
          const hasToxic = toxicWords.some(word => m.body.toLowerCase().includes(word));
          if (hasToxic) {
            if (botAdmin) {
              await sock.sendMessage(m.from, { delete: m.key });
            }
            await m.reply(`*⚠️ [ANTI-TOXIC] ⚠️*\nKata kotor terdeteksi! Jaga lisan Anda di grup ini.\nTag Pengirim: @${m.sender.split('@')[0]}`, { mentions: [m.sender] });
            return;
          }
        }

        // D. ANTI-TAG SW
        if (database.isPluginEnabled(m.from, 'antitagsw') && !isAdmin && !isOwner) {
          const mentions = m.raw.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
          const hasTagSW = mentions.includes('status@broadcast') || m.body.includes('status@broadcast');
          if (hasTagSW) {
            if (botAdmin) {
              await sock.sendMessage(m.from, { delete: m.key });
            }
            await m.reply(`*⚠️ [ANTI-TAG SW] ⚠️*\nDilarang melakukan tag status (status@broadcast) di grup ini!\nTag Pengirim: @${m.sender.split('@')[0]}`, { mentions: [m.sender] });
            return;
          }
        }

        // E. ANTI-TAG ALL
        if (database.isPluginEnabled(m.from, 'antitagall') && !isAdmin && !isOwner) {
          const content = m.body.toLowerCase();
          if (content.includes('@everyone') || content.includes('@all')) {
            if (botAdmin) {
              await sock.sendMessage(m.from, { delete: m.key });
            }
            await m.reply(`*⚠️ [ANTI-TAG ALL] ⚠️*\nDilarang melakukan tag-all di grup ini!\nTag Pengirim: @${m.sender.split('@')[0]}`, { mentions: [m.sender] });
            return;
          }
        }
      }

      // --- SIKLUS HOOK 1: beforeMessage ---
      for (const hook of loader.hooks.beforeMessage) {
        const result = await hook.execute(m, { sock });
        if (result === false) return; 
      }

      const prefix = config.prefix;
      const isCmd = m.body.startsWith(prefix);
      if (!isCmd) return; 

      const args = m.body.slice(prefix.length).trim().split(/ +/);
      const cmdName = args.shift().toLowerCase();
      
      const command = loader.commands.get(cmdName) || loader.commands.get(loader.aliases.get(cmdName));

      // SMART HELPER
      if (!command) {
        let bestMatch = null;
        let highestScore = 0;
        const threshold = 0.55; 

        const allNames = [];
        loader.commands.forEach(cmd => {
          allNames.push(cmd.name);
          if (cmd.alias) allNames.push(...cmd.alias);
        });

        for (const name of allNames) {
          const score = calculateSimilarity(cmdName, name);
          if (score > highestScore) {
            highestScore = score;
            bestMatch = name;
          }
        }

        if (highestScore >= threshold && bestMatch) {
          const resolvedCmd = loader.commands.has(bestMatch) 
            ? bestMatch 
            : loader.aliases.get(bestMatch);
            
          await m.reply(`*❓ [SMART HELPER] ❓*\nMungkin yang Anda maksud adalah *${prefix}${resolvedCmd}*?`);
        }
        return; 
      }

      if (rawMsg.key.fromMe) {
        const ownerNumbers = config.owner.map(num => num.replace(/[^0-9]/g, ''));
        const senderNumber = m.sender.split('@')[0];
        if (!ownerNumbers.includes(senderNumber)) {
          return;
        }
      }

      // VALIDASI HAK AKSES (Permission Checker)
      const hasPermission = await checkPermissions(m, { sock, commandObj: command });
      if (!hasPermission) return;

      // PROTEKSI COOLDOWN UTILITY PERINTAH BIASA
      const cooldownTime = (command.cooldown || 3) * 1000; 
      const cooldownKey = `${m.sender}_${command.name}`;
      const now = Date.now();

      if (cooldowns.has(cooldownKey)) {
        const expirationTime = cooldowns.get(cooldownKey) + cooldownTime;
        if (now < expirationTime) {
          const timeLeft = ((expirationTime - now) / 1000).toFixed(1);
          await m.reply(`*⚠️ [ANTI-SPAM] ⚠️*\nHarap tunggu *${timeLeft}s* sebelum menggunakan perintah ini lagi.`);
          return;
        }
      }
      cooldowns.set(cooldownKey, now);

      // --- SIKLUS HOOK 2: beforeCommand ---
      for (const hook of loader.hooks.beforeCommand) {
        const result = await hook.execute(m, { sock, command: cmdName, args });
        if (result === false) return;
      }

      logger.info(`Menjalankan perintah: ${prefix}${cmdName} dari ${m.pushName}`);
      await command.execute(m, { sock, args, prefix, command: cmdName });

      // --- SIKLUS HOOK 3: afterCommand ---
      for (const hook of loader.hooks.afterCommand) {
        await hook.execute(m, { sock, command: cmdName, args });
      }

    } catch (err) {
      logger.error('Error saat memproses messages.upsert:', err);
    }
  }
};
