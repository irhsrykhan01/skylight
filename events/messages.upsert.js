import { serialize } from '../lib/serialize.js';
import loader from '../src/core/loader.js';
import config from '../config.js';
import { logger } from '../src/core/logger.js';
import database from '../lib/database.js';

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
        if (result === false) return; // Batalkan alur jika hook mengembalikan false
      }

      const prefix = config.prefix;
      const isCmd = m.body.startsWith(prefix);
      if (!isCmd) return; 

      const args = m.body.slice(prefix.length).trim().split(/ +/);
      const cmdName = args.shift().toLowerCase();
      
      const command = loader.commands.get(cmdName) || loader.commands.get(loader.aliases.get(cmdName));
      if (!command) return;

      if (rawMsg.key.fromMe) {
        const ownerNumbers = config.owner.map(num => num.replace(/[^0-9]/g, ''));
        const senderNumber = m.sender.split('@')[0];
        if (!ownerNumbers.includes(senderNumber)) {
          return;
        }
      }

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
