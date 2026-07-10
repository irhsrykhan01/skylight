import { serialize } from '../lib/serialize.js';
import loader from '../src/core/loader.js';
import config from '../config.js';
import { logger } from '../src/core/logger.js';
import { calculateSimilarity } from '../lib/utils.js';
import { checkPermissions } from '../src/core/permission.js';

// Penyimpan memori cooldown rate limiter
const cooldowns = new Map();

export default {
  name: 'messages.upsert',
  async execute(sock, chatUpdate) {
    try {
      if (chatUpdate.type !== 'notify') return;
      const rawMsg = chatUpdate.messages[0];
      if (!rawMsg) return;
      if (rawMsg.key && rawMsg.key.remoteJid === 'status@broadcast') return; 

      const m = await serialize(sock, rawMsg);
      if (!m) return;

      // Cetak log pesan masuk
      logger.info(`Pesan Masuk: [${m.pushName}] -> ${m.body || `[Tipe: ${m.type}]`}`);

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

      // SMART HELPER: Koreksi Typo Perintah
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

      // Verifikasi loop aman
      if (rawMsg.key.fromMe) {
        const ownerNumbers = config.owner.map(num => num.replace(/[^0-9]/g, ''));
        const senderNumber = m.sender.split('@')[0];
        if (!ownerNumbers.includes(senderNumber)) {
          return;
        }
      }

      // --- VALIDASI HAK AKSES (Permission Checker) ---
      const hasPermission = await checkPermissions(m, { sock, commandObj: command });
      if (!hasPermission) return;

      // --- PROTEKSI COOLDOWN (ANTI-SPAM) ---
      const cooldownTime = (command.cooldown || 3) * 1000; // Default cooldown 3 detik jika tidak diset
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

      // Eksekusi Command
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
